"use strict";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";

import accountRoutes from "../src/accounts/account.routes.js";
import favoriteRoutes from "../src/favorites/favorite.routes.js";
import swaggerSpec from "./swagger.js";
import transactionRoutes from "../src/transactions/transaction.routes.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));
app.use(express.json({ limit: "10mb" }));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true, status: "up" });
});

app.use("/gestionBancaria/api/v1", accountRoutes);
app.use("/gestionBancaria/api/v1/favorites", favoriteRoutes);
app.use("/gestionBancaria/api/v1/transactions", transactionRoutes);

app.use((req, res) => {
    res.status(404).json({ success: false, message: "Endpoint not found" });
});

export default app;