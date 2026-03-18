import { defineServer, defineRoom } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { VERSION } from "@void-market/shared";
import { GalaxyRoom } from "./rooms/GalaxyRoom.js";

const PORT = Number(process.env.PORT) || 2567;

const server = defineServer({
  transport: new WebSocketTransport(),

  rooms: {
    galaxy: defineRoom(GalaxyRoom),
  },

  express: (app) => {
    app.get("/health", (_req, res) => {
      res.status(200).json({ status: "ok", version: VERSION });
    });
  },
});

void server.listen(PORT).then(() => {
  console.log(`@void-market/server v${VERSION} listening on port ${PORT}`);
});
