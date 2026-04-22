import { createServer } from "node:http";
import { Server } from "socket.io";
import {
  createRoom,
  endTurn,
  getVisibleState,
  joinRoom,
  leaveBySocket,
  mulligan,
  playCard,
  resolveDefense,
  rooms,
  startGame,
  playersBySocketId
} from "./game.js";

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? "0.0.0.0";

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: ["https://owlbear.sunitro.de", "http://localhost:5173"],
    methods: ["GET", "POST"]
  }
});

function emitRoomState(code) {
  const room = rooms.get(code);
  if (!room) return;

  for (const player of room.players) {
    io.to(player.socketId).emit("room:state", getVisibleState(room, player.id));
  }

  const lastLog = room.log[room.log.length - 1];
  if (lastLog) {
    io.to(code).emit("game:event", lastLog);
  }
}

function onError(socket, err) {
  socket.emit("game:error", { message: err.message || "Erreur serveur." });
}

io.on("connection", (socket) => {
  socket.on("room:create", ({ playerName }) => {
    try {
      const room = createRoom(socket.id, playerName || "Joueur 1");
      socket.join(room.code);
      emitRoomState(room.code);
    } catch (err) {
      onError(socket, err);
    }
  });

  socket.on("room:join", ({ code, playerName }) => {
    try {
      const room = joinRoom(code, socket.id, playerName || "Joueur 2");
      socket.join(room.code);
      emitRoomState(room.code);
    } catch (err) {
      onError(socket, err);
    }
  });

  socket.on("game:start", ({ code }) => {
    try {
      startGame(code);
      emitRoomState(code);
    } catch (err) {
      onError(socket, err);
    }
  });

  socket.on("card:play", (payload) => {
    try {
      const ref = playersBySocketId.get(socket.id);
      if (!ref) throw new Error("Joueur inconnu.");
      playCard(ref.code, ref.playerId, payload);
      emitRoomState(ref.code);
    } catch (err) {
      onError(socket, err);
    }
  });

  socket.on("combat:defend", ({ defenseCardId }) => {
    try {
      const ref = playersBySocketId.get(socket.id);
      if (!ref) throw new Error("Joueur inconnu.");
      resolveDefense(ref.code, ref.playerId, defenseCardId);
      emitRoomState(ref.code);
    } catch (err) {
      onError(socket, err);
    }
  });

  socket.on("hand:mulligan", ({ cardIds }) => {
    try {
      const ref = playersBySocketId.get(socket.id);
      if (!ref) throw new Error("Joueur inconnu.");
      mulligan(ref.code, ref.playerId, cardIds);
      emitRoomState(ref.code);
    } catch (err) {
      onError(socket, err);
    }
  });

  socket.on("turn:end", () => {
    try {
      const ref = playersBySocketId.get(socket.id);
      if (!ref) throw new Error("Joueur inconnu.");
      endTurn(ref.code, ref.playerId);
      emitRoomState(ref.code);
    } catch (err) {
      onError(socket, err);
    }
  });

  socket.on("disconnect", () => {
    const code = leaveBySocket(socket.id);
    if (code) emitRoomState(code);
  });
});

httpServer.listen(PORT, HOST, () => {
  console.log(`Socket server ready on http://${HOST}:${PORT}`);
});
