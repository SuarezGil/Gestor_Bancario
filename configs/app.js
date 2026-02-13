"use strict";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import accountRoutes from "../src/accounts/account.routes.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true, status: "up" });
});

app.use("/api/accounts", accountRoutes);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Endpoint not found"
    });
});

export default app;