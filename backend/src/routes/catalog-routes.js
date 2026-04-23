import { Router } from "express";
import {
    fetchCardsBySet,
    fetchMarketPrice,
    fetchSearchCards,
    fetchSets,
} from "../services/catalog-service.js";

export const catalogRouter = Router();

catalogRouter.get("/sets", async (_request, response, next) => {
    try {
        const sets = await fetchSets();
        response.json({ sets });
    } catch (error) {
        next(error);
    }
});

catalogRouter.get("/sets/:setId/cards", async (request, response, next) => {
    try {
        const cards = await fetchCardsBySet(request.params.setId);
        response.json({ cards });
    } catch (error) {
        next(error);
    }
});

catalogRouter.get("/cards/search", async (request, response, next) => {
    try {
        const query = typeof request.query.q === "string" ? request.query.q : "";
        const setId = typeof request.query.setId === "string" ? request.query.setId : undefined;
        const cards = await fetchSearchCards(query, setId);
        response.json({ cards });
    } catch (error) {
        next(error);
    }
});

catalogRouter.get("/cards/:cardId/market", async (request, response, next) => {
    try {
        const marketPrice = await fetchMarketPrice(request.params.cardId);
        response.json({ cardId: request.params.cardId, marketPrice });
    } catch (error) {
        next(error);
    }
});
