import { createServer } from "node:http";
import { Server } from "socket.io";
import { registerSocketHandlers } from "./socketHandlers.js";

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? "0.0.0.0";

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: ["https://owlbear.sunitro.de", "http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST"]
  }
});

registerSocketHandlers(io);

httpServer.listen(PORT, HOST, () => {
  console.log(`Socket server ready on http://${HOST}:${PORT}`);
});
