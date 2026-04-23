import { SAMPLE_CARDS, SAMPLE_SETS } from "./catalog-sample.js";

const OPTCG_API_BASE =
    (process.env.OPTCG_API_BASE || "https://optcgapi.com/api").replace(/\/$/, "");

function normalizeCard(input) {
    const cardSetId =
        typeof input.card_set_id === "string"
            ? input.card_set_id
            : typeof input.card_image_id === "string"
                ? input.card_image_id
                : typeof input.id === "string"
                    ? input.id
                    : null;

    const setId =
        typeof input.set_id === "string"
            ? input.set_id
            : typeof input.set_name === "string" && input.set_name.includes("OP-")
                ? input.set_name
                : typeof cardSetId === "string"
                    ? cardSetId.slice(0, 4).replace("OP", "OP-")
                    : null;

    const name =
        typeof input.card_name === "string"
            ? input.card_name
            : typeof input.name === "string"
                ? input.name
                : null;

    const setName =
        typeof input.set_name === "string"
            ? input.set_name
            : typeof input.series === "string"
                ? input.series
                : setId;

    const imageUrl =
        typeof input.card_image === "string"
            ? input.card_image
            : typeof input.image === "string"
                ? input.image
                : cardSetId
                    ? `https://optcgapi.com/media/static/Card_Images/${cardSetId}.jpg`
                    : "";

    if (!cardSetId || !setId || !name || !setName || !imageUrl) {
        return null;
    }

    return {
        id: imageUrl,
        setId,
        setName,
        cardSetId,
        name,
        imageUrl,
        marketPrice:
            typeof input.market_price === "number"
                ? input.market_price
                : typeof input.market_price === "string"
                    ? Number.parseFloat(input.market_price)
                    : null,
        rarity: typeof input.rarity === "string" ? input.rarity : "Unknown",
        color:
            typeof input.card_color === "string"
                ? input.card_color
                : typeof input.color === "string"
                    ? input.color
                    : "Unknown",
        type:
            typeof input.card_type === "string"
                ? input.card_type
                : typeof input.type === "string"
                    ? input.type
                    : "Unknown",
        cost:
            typeof input.card_cost === "string"
                ? input.card_cost
                : typeof input.cost === "string"
                    ? input.cost
                    : null,
        power:
            typeof input.card_power === "string"
                ? input.card_power
                : typeof input.power === "string"
                    ? input.power
                    : null,
        life:
            typeof input.life === "string"
                ? input.life
                : typeof input.life === "number"
                    ? String(input.life)
                    : null,
        counter:
            typeof input.counter_amount === "number"
                ? input.counter_amount
                : typeof input.counter_amount === "string"
                    ? Number.parseInt(input.counter_amount, 10)
                    : null,
        attribute: typeof input.attribute === "string" ? input.attribute : null,
        subTypes:
            typeof input.sub_types === "string"
                ? input.sub_types.split("/").map((value) => value.trim())
                : Array.isArray(input.sub_types)
                    ? input.sub_types.filter((value) => typeof value === "string")
                    : [],
        text:
            typeof input.card_text === "string"
                ? input.card_text
                : typeof input.text === "string"
                    ? input.text
                    : "",
        scrapedAt: typeof input.date_scraped === "string" ? input.date_scraped : null
    };
}

async function fetchJsonCandidates(candidates, validator) {
    for (const candidate of candidates) {
        try {
            const response = await fetch(candidate, {
                headers: {
                    Accept: "application/json"
                }
            });

            if (!response.ok) {
                continue;
            }

            const payload = await response.json();
            const value = validator(payload);
            if (value) {
                return value;
            }
        } catch {
            continue;
        }
    }

    return null;
}

function extractCardArray(payload) {
    const arrayCandidate = Array.isArray(payload)
        ? payload
        : payload && typeof payload === "object"
            ? [payload.data, payload.cards, payload.results].find((value) => Array.isArray(value))
            : null;

    if (!Array.isArray(arrayCandidate)) {
        return null;
    }

    const cards = arrayCandidate
        .map((item) => (item && typeof item === "object" ? normalizeCard(item) : null))
        .filter(Boolean);

    return cards.length ? cards : null;
}

function extractCardsFromSetPayload(payload) {
    if (Array.isArray(payload)) {
        return extractCardArray(payload);
    }

    if (!payload || typeof payload !== "object") {
        return null;
    }

    const nestedCards = [payload.cards, payload.data, payload.results].find((value) =>
        Array.isArray(value)
    );

    if (Array.isArray(nestedCards)) {
        return extractCardArray(nestedCards);
    }

    return null;
}

function filterCards(cards, query) {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
        return cards;
    }

    return cards.filter((card) =>
        [
            card.name,
            card.cardSetId,
            card.text,
            card.type,
            card.color,
            card.rarity,
            card.subTypes.join(" ")
        ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery)
    );
}

export async function getSets() {
    return [...SAMPLE_SETS].sort((left, right) =>
        left.code.localeCompare(right.code)
    );
}

export async function getCardsBySet(setId) {
    const remoteCards = await fetchJsonCandidates(
        [
            `${OPTCG_API_BASE}/sets/${encodeURIComponent(setId)}/`
        ],
        extractCardsFromSetPayload
    );

    const cards = remoteCards || SAMPLE_CARDS.filter((card) => card.setId === setId);
    return cards.sort((left, right) => left.cardSetId.localeCompare(right.cardSetId));
}

export async function searchCards(query, setId) {
    if (setId) {
        const setCards = await getCardsBySet(setId);
        return filterCards(setCards, query).slice(0, 100);
    }

    const localCards = filterCards(SAMPLE_CARDS, query);
    return localCards.slice(0, 100);
}

export async function getMarketPrice(cardId) {
    const card =
        SAMPLE_CARDS.find((item) => item.id === cardId) ||
        (await searchCards(cardId)).find((item) => item.id === cardId);

    return card?.marketPrice ?? null;
}
