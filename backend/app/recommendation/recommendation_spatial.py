from __future__ import annotations

from math import sqrt
from typing import Callable

from .recommendation_profiles import PremiumCardProfile


def choose_anchor_cards(
    selected_slot_id: str,
    premium_page_cards: list[PremiumCardProfile],
    affinity_score: Callable[[PremiumCardProfile], float],
) -> list[PremiumCardProfile]:
    target_row, target_col = parse_slot_id(selected_slot_id)

    def anchor_key(card: PremiumCardProfile) -> tuple[float, float, str]:
        if card.slot_id is None:
            return (999.0, 0.0, "")
        row, col = parse_slot_id(card.slot_id)
        distance = max(abs(row - target_row), abs(col - target_col))
        affinity = affinity_score(card)
        return (distance, -affinity, card.slot_id)

    return sorted(premium_page_cards, key=anchor_key)[:3]


def compose_query_vector(
    selected_slot_id: str,
    anchors: list[PremiumCardProfile],
    premium_page_cards: list[PremiumCardProfile],
    vectors_by_id: dict[str, list[float]],
) -> list[float]:
    if not anchors:
        return []

    if len(anchors) == 1:
        return vectors_by_id.get(anchors[0].vector_id, [])

    target_row, target_col = parse_slot_id(selected_slot_id)
    local_weights: list[float] = []
    for anchor in anchors:
        if anchor.slot_id is None:
            continue
        row, col = parse_slot_id(anchor.slot_id)
        distance = max(abs(row - target_row), abs(col - target_col))
        local_weights.append(1 / ((distance + 1) ** 2))

    if not local_weights:
        return []

    local_total = sum(local_weights)
    local_share = 0.85
    weighted_vectors: list[tuple[list[float], float]] = []

    for anchor, raw_weight in zip(anchors, local_weights, strict=False):
        vector = vectors_by_id.get(anchor.vector_id)
        if vector:
            weighted_vectors.append((vector, local_share * (raw_weight / local_total)))

    anchor_ids = {anchor.vector_id for anchor in anchors}
    remaining_cards = [card for card in premium_page_cards if card.vector_id not in anchor_ids]
    if remaining_cards:
        remaining_share = 0.15 / len(remaining_cards)
        for card in remaining_cards:
            vector = vectors_by_id.get(card.vector_id)
            if vector:
                weighted_vectors.append((vector, remaining_share))

    return weighted_average(weighted_vectors)


def parse_slot_id(slot_id: str) -> tuple[int, int]:
    row, col = slot_id.split("-", 1)
    return int(row), int(col)


def weighted_average(weighted_vectors: list[tuple[list[float], float]]) -> list[float]:
    if not weighted_vectors:
        return []

    dimension = len(weighted_vectors[0][0])
    combined = [0.0] * dimension
    total_weight = 0.0
    for vector, weight in weighted_vectors:
        if len(vector) != dimension:
            continue
        total_weight += weight
        for index, value in enumerate(vector):
            combined[index] += value * weight

    if total_weight <= 0:
        return []

    normalized = [value / total_weight for value in combined]
    magnitude = sqrt(sum(value * value for value in normalized))
    if magnitude <= 0:
        return normalized
    return [value / magnitude for value in normalized]
