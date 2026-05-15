import {
  abortGame,
  createRoom,
  drawCard,
  drawTwentyOneNumberCard,
  drawTwentyOneTrumpCard,
  endTurn,
  joinRoom,
  leaveBySocket,
  playAwaleMove,
  playCard,
  playTwentyOneTrump,
  performAttack,
  playersBySocketId,
  replayGame,
  resolveDefense,
  rooms,
  spectateRoom,
  standTwentyOne,
  startGame
} from "./game.js";
import { getVisibleState } from "./visibleState.js";

export function emitRoomState(io, code) {
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

function emitError(socket, err) {
  socket.emit("game:error", { message: err.message || "Erreur serveur." });
}

function getPlayerRef(socket) {
  const ref = playersBySocketId.get(socket.id);
  if (!ref) throw new Error("Joueur inconnu.");
  return ref;
}

function runRoomAction(socket, action) {
  try {
    const room = action();
    socket.join(room.code);
    return room.code;
  } catch (err) {
    emitError(socket, err);
    return null;
  }
}

function runPlayerAction(socket, action) {
  try {
    const ref = getPlayerRef(socket);
    action(ref);
    return ref.code;
  } catch (err) {
    emitError(socket, err);
    return null;
  }
}

export function registerSocketHandlers(io) {
  io.on("connection", (socket) => {
    socket.on("room:create", ({ playerName, gameType }) => {
      const code = runRoomAction(socket, () => createRoom(socket.id, playerName || "Joueur 1", gameType));
      if (code) emitRoomState(io, code);
    });

    socket.on("room:join", ({ code, playerName }) => {
      const roomCode = runRoomAction(socket, () => joinRoom(code, socket.id, playerName || "Joueur 2"));
      if (roomCode) emitRoomState(io, roomCode);
    });

    socket.on("room:spectate", ({ code, spectatorName }) => {
      const roomCode = runRoomAction(socket, () => spectateRoom(code, socket.id, spectatorName || "Spectateur"));
      if (roomCode) emitRoomState(io, roomCode);
    });

    socket.on("game:start", ({ code }) => {
      const roomCode = runPlayerAction(socket, (ref) => {
        startGame(code, ref.playerId);
      });
      if (roomCode) emitRoomState(io, code);
    });

    socket.on("game:replay", () => {
      const code = runPlayerAction(socket, (ref) => {
        replayGame(ref.code, ref.playerId);
      });
      if (code) emitRoomState(io, code);
    });

    socket.on("awale:move", ({ pitIndex }) => {
      const code = runPlayerAction(socket, (ref) => {
        playAwaleMove(ref.code, ref.playerId, pitIndex);
      });
      if (code) emitRoomState(io, code);
    });

    socket.on("twentyone:draw-number", () => {
      const code = runPlayerAction(socket, (ref) => {
        drawTwentyOneNumberCard(ref.code, ref.playerId);
      });
      if (code) emitRoomState(io, code);
    });

    socket.on("twentyone:draw-trump", () => {
      const code = runPlayerAction(socket, (ref) => {
        drawTwentyOneTrumpCard(ref.code, ref.playerId);
      });
      if (code) emitRoomState(io, code);
    });

    socket.on("twentyone:play-trump", ({ cardId }) => {
      const code = runPlayerAction(socket, (ref) => {
        playTwentyOneTrump(ref.code, ref.playerId, cardId);
      });
      if (code) emitRoomState(io, code);
    });

    socket.on("twentyone:stand", () => {
      const code = runPlayerAction(socket, (ref) => {
        standTwentyOne(ref.code, ref.playerId);
      });
      if (code) emitRoomState(io, code);
    });

    socket.on("game:abort", () => {
      const code = runPlayerAction(socket, (ref) => {
        abortGame(ref.code, ref.playerId);
      });
      if (code) emitRoomState(io, code);
    });

    socket.on("card:play", (payload) => {
      const code = runPlayerAction(socket, (ref) => {
        playCard(ref.code, ref.playerId, payload);
      });
      if (code) emitRoomState(io, code);
    });

    socket.on("combat:attack", (payload) => {
      const code = runPlayerAction(socket, (ref) => {
        performAttack(ref.code, ref.playerId, payload);
      });
      if (code) emitRoomState(io, code);
    });

    socket.on("turn:draw", () => {
      const code = runPlayerAction(socket, (ref) => {
        drawCard(ref.code, ref.playerId);
      });
      if (code) emitRoomState(io, code);
    });

    socket.on("combat:defend", ({ defenseCardId }) => {
      const code = runPlayerAction(socket, (ref) => {
        resolveDefense(ref.code, ref.playerId, defenseCardId);
      });
      if (code) emitRoomState(io, code);
    });

    socket.on("turn:end", ({ source } = {}) => {
      const code = runPlayerAction(socket, (ref) => {
        if (source !== "skip_icon_button") throw new Error("Fin de tour autorisée uniquement via le bouton skip.");
        endTurn(ref.code, ref.playerId);
      });
      if (code) emitRoomState(io, code);
    });

    socket.on("disconnect", () => {
      const code = leaveBySocket(socket.id);
      if (code) emitRoomState(io, code);
    });
  });
}
