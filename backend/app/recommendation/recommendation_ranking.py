from __future__ import annotations

from collections import Counter
from dataclasses import dataclass

from .recommendation_profiles import PremiumCardProfile


@dataclass(frozen=True)
class RankedCandidate:
    card: PremiumCardProfile
    vector_score: float
    metadata_score: float
    reason: str
    total_score: float


def score_candidate_metadata(
    candidate: PremiumCardProfile,
    page_cards: list[PremiumCardProfile],
) -> tuple[float, list[str]]:
    family_counts = Counter(card.normalized_name_family for card in page_cards)
    same_set = sum(1 for card in page_cards if card.set_id == candidate.set_id)
    same_name = sum(1 for card in page_cards if card.normalized_name == candidate.normalized_name)
    same_name_family = family_counts.get(candidate.normalized_name_family, 0)
    same_type = sum(1 for card in page_cards if card.card_type == candidate.card_type)
    same_color = sum(1 for card in page_cards if card.color == candidate.color)
    subtype_overlap = sum(
        1
        for card in page_cards
        if set(card.sub_types).intersection(candidate.sub_types)
    )
    dominant_family, dominant_family_count = family_counts.most_common(1)[0] if family_counts else ("", 0)
    dominant_family_bonus = (
        dominant_family_count * 2.0
        if dominant_family_count >= 2 and candidate.normalized_name_family == dominant_family
        else 0.0
    )

    score = (
        same_name * 4.0
        + same_name_family * 5.0
        + dominant_family_bonus
        + same_set * 2.0
        + same_type * 1.5
        + same_color * 0.75
        + subtype_overlap * 0.75
    )

    reasons: list[str] = []
    if same_set:
        reasons.append("same set")
    if same_name:
        reasons.append("same character")
    elif same_name_family:
        reasons.append("same character family")
    if same_type:
        reasons.append("same type")
    if same_color:
        reasons.append("matching color")
    if subtype_overlap:
        reasons.append("shared subtype")
    if not reasons:
        reasons.append("premium page contrast")

    return score, reasons


def build_reason_text(reasons: list[str], visual: bool) -> str:
    ordered = list(dict.fromkeys(reasons))
    primary = ", ".join(ordered[:3])
    if visual:
        return f"Visually close to nearby premiums with {primary}."
    return f"Strong metadata fit from {primary}."


def diversify(ranked: list[RankedCandidate]) -> list[RankedCandidate]:
    family_counts: Counter[str] = Counter()
    results: list[RankedCandidate] = []
    for item in ranked:
        family = item.card.normalized_name_family
        limit = 1 if len(results) < 5 else 2
        if family_counts[family] >= limit:
            continue
        family_counts[family] += 1
        results.append(item)
        if len(results) >= 10:
            break
    return results
