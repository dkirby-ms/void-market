import express from "express";
import { defineServer, defineRoom } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { VERSION } from "@void-market/shared";
import { GalaxyRoom } from "./rooms/GalaxyRoom.js";
import { authRouter } from "./auth/index.js";

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
});
