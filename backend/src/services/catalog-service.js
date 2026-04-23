import { withCache } from "../cache.js";
import { getCardsBySet, getMarketPrice, getSets, searchCards } from "../optcg.js";

const ONE_HOUR = 1000 * 60 * 60;
const FIFTEEN_MINUTES = 1000 * 60 * 15;
const ONE_DAY = 1000 * 60 * 60 * 24;

export function fetchSets() {
    return withCache("sets", ONE_HOUR, getSets);
}

export function fetchCardsBySet(setId) {
    return withCache(`set:${setId}:cards`, ONE_HOUR, () => getCardsBySet(setId));
}

export function fetchSearchCards(query, setId) {
    return withCache(
        `search:${setId || "all"}:${query.toLowerCase()}`,
        FIFTEEN_MINUTES,
        () => searchCards(query, setId),
    );
}

export function fetchMarketPrice(cardId) {
    return withCache(`market:${cardId}`, ONE_DAY, () => getMarketPrice(cardId));
}
