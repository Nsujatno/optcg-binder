import cors from "cors";
import express from "express";
import { FRONTEND_ORIGIN } from "./config.js";
import { catalogRouter } from "./routes/catalog-routes.js";
import { healthRouter } from "./routes/health-routes.js";

export function createApp() {
    const app = express();

    app.use(
        cors({
            origin: FRONTEND_ORIGIN,
            methods: ["GET", "OPTIONS"],
        }),
    );
    app.use(express.json());

    app.use(healthRouter);
    app.use("/api", catalogRouter);

    app.use((request, response) => {
        response.status(404).json({ error: "Not Found" });
    });

    app.use((error, _request, response, _next) => {
        response.status(500).json({
            error: "Internal Server Error",
            message: error instanceof Error ? error.message : "Unknown error",
        });
    });

    return app;
}
