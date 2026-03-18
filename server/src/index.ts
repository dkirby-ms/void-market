import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Load .env from monorepo root (two levels up from server/src/)
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../.env") });

import express from "express";
import { defineServer, defineRoom } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { VERSION } from "@void-market/shared";
import { GalaxyRoom } from "./rooms/GalaxyRoom.js";
import { authRouter, isDevAuthEnabled } from "./auth/index.js";

const PORT = Number(process.env.PORT) || 2567;

const server = defineServer({
  transport: new WebSocketTransport(),

  rooms: {
    galaxy: defineRoom(GalaxyRoom),
  },

  express: (app) => {
    app.use(express.json());

    app.get("/health", (_req, res) => {
      res.status(200).json({ status: "ok", version: VERSION });
    });

    app.use("/api/auth", authRouter);
  },
});

void server.listen(PORT).then(() => {
  console.log(`@void-market/server v${VERSION} listening on port ${PORT}`);
  if (isDevAuthEnabled()) {
    console.log(
      "[dev-auth] ⚡ Dev auth bypass ENABLED — GET /api/auth/dev-token for tokens",
    );
  }
});
