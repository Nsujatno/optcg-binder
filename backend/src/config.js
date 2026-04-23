import dotenv from "dotenv";

dotenv.config();

export const PORT = Number.parseInt(process.env.PORT || "4000", 10);
export const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
