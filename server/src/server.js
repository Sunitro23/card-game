import { createServer } from "node:http";
import { Server } from "socket.io";
import {
  abortGame,
  createRoom,
  endTurn,
  getVisibleState,
  joinRoom,
  leaveBySocket,
  playCard,
  performAttack,
  drawCard,
  drawTwentyOneNumberCard,
  drawTwentyOneTrumpCard,
  playAwaleMove,
  playTwentyOneTrump,
  replayGame,
  resolveDefense,
  rooms,
  standTwentyOne,
  startGame,
  spectateRoom,
  playersBySocketId
} from "./game.js";

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? "0.0.0.0";

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: ["https://owlbear.sunitro.de", "http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST"]
  }
});

function emitRoomState(code) {
  const room = rooms.get(code);
  if (!room) return;

  for (const player of room.players) {
    io.to(player.socketId).emit("room:state", getVisibleState(room, player.id));
  }
  for (const spectator of room.spectators ?? []) {
    io.to(spectator.socketId).emit("room:state", getVisibleState(room, null));
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
  socket.on("room:create", ({ playerName, gameType }) => {
    try {
      const room = createRoom(socket.id, playerName || "Joueur 1", gameType);
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

  socket.on("room:spectate", ({ code, spectatorName }) => {
    try {
      const room = spectateRoom(code, socket.id, spectatorName || "Spectateur");
      socket.join(room.code);
      emitRoomState(room.code);
    } catch (err) {
      onError(socket, err);
    }
  });

  socket.on("game:start", ({ code }) => {
    try {
      const ref = playersBySocketId.get(socket.id);
      if (!ref) throw new Error("Joueur inconnu.");
      startGame(code, ref.playerId);
      emitRoomState(code);
    } catch (err) {
      onError(socket, err);
    }
  });

  socket.on("game:replay", () => {
    try {
      const ref = playersBySocketId.get(socket.id);
      if (!ref) throw new Error("Joueur inconnu.");
      replayGame(ref.code, ref.playerId);
      emitRoomState(ref.code);
    } catch (err) {
      onError(socket, err);
    }
  });


  socket.on("awale:move", ({ pitIndex }) => {
    try {
      const ref = playersBySocketId.get(socket.id);
      if (!ref) throw new Error("Joueur inconnu.");
      playAwaleMove(ref.code, ref.playerId, pitIndex);
      emitRoomState(ref.code);
    } catch (err) {
      onError(socket, err);
    }
  });


  socket.on("twentyone:draw-number", () => {
    try {
      const ref = playersBySocketId.get(socket.id);
      if (!ref) throw new Error("Joueur inconnu.");
      drawTwentyOneNumberCard(ref.code, ref.playerId);
      emitRoomState(ref.code);
    } catch (err) {
      onError(socket, err);
    }
  });

  socket.on("twentyone:draw-trump", () => {
    try {
      const ref = playersBySocketId.get(socket.id);
      if (!ref) throw new Error("Joueur inconnu.");
      drawTwentyOneTrumpCard(ref.code, ref.playerId);
      emitRoomState(ref.code);
    } catch (err) {
      onError(socket, err);
    }
  });

  socket.on("twentyone:play-trump", ({ cardId }) => {
    try {
      const ref = playersBySocketId.get(socket.id);
      if (!ref) throw new Error("Joueur inconnu.");
      playTwentyOneTrump(ref.code, ref.playerId, cardId);
      emitRoomState(ref.code);
    } catch (err) {
      onError(socket, err);
    }
  });

  socket.on("twentyone:stand", () => {
    try {
      const ref = playersBySocketId.get(socket.id);
      if (!ref) throw new Error("Joueur inconnu.");
      standTwentyOne(ref.code, ref.playerId);
      emitRoomState(ref.code);
    } catch (err) {
      onError(socket, err);
    }
  });

  socket.on("game:abort", () => {
    try {
      const ref = playersBySocketId.get(socket.id);
      if (!ref) throw new Error("Joueur inconnu.");
      abortGame(ref.code, ref.playerId);
      emitRoomState(ref.code);
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

  socket.on("combat:attack", (payload) => {
    try {
      const ref = playersBySocketId.get(socket.id);
      if (!ref) throw new Error("Joueur inconnu.");
      performAttack(ref.code, ref.playerId, payload);
      emitRoomState(ref.code);
    } catch (err) {
      onError(socket, err);
    }
  });

  socket.on("turn:draw", () => {
    try {
      const ref = playersBySocketId.get(socket.id);
      if (!ref) throw new Error("Joueur inconnu.");
      drawCard(ref.code, ref.playerId);
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

  socket.on("turn:end", ({ source } = {}) => {
    try {
      const ref = playersBySocketId.get(socket.id);
      if (!ref) throw new Error("Joueur inconnu.");
      if (source !== "skip_icon_button") throw new Error("Fin de tour autorisée uniquement via le bouton skip.");
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
