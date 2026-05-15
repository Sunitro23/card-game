import { AWALE_PITS_PER_PLAYER } from "./core/constants.js";
import { generateRoomCode, uid } from "./core/random.js";
import { normalizeGameType } from "./core/gameTypes.js";
import { makePlayer } from "./core/players.js";
import { playersBySocketId, rooms } from "./core/state.js";
import { finishAwale, playAwaleMove, startAwaleGame } from "./games/awale.js";
import { drawCard, endTurn, mulligan, performAttack, playCard, resolveDefense, startCardDuelGame } from "./games/cardDuel.js";
import { abortTwentyOneGame, drawTwentyOneNumberCard, drawTwentyOneTrumpCard, playTwentyOneTrump, standTwentyOne, startTwentyOneGame } from "./games/twentyOne.js";

export { playersBySocketId, rooms } from "./core/state.js";
export { drawCard, endTurn, mulligan, performAttack, playCard, resolveDefense } from "./games/cardDuel.js";
export { playAwaleMove } from "./games/awale.js";
export { drawTwentyOneNumberCard, drawTwentyOneTrumpCard, playTwentyOneTrump, standTwentyOne } from "./games/twentyOne.js";
export { getVisibleState } from "./visibleState.js";

export function createRoom(hostSocketId, hostName, gameType = "card_duel") {
  let code = generateRoomCode();
  while (rooms.has(code)) code = generateRoomCode();

  const host = makePlayer(hostSocketId, hostName, 0);
  const room = {
    code,
    phase: "lobby",
    gameType: normalizeGameType(gameType),
    createdAt: Date.now(),
    turnIndex: 0,
    players: [host],
    spectators: [],
    hostPlayerId: host.id,
    log: [{ at: Date.now(), type: "room_created", message: `${hostName} a crÃ©Ã© la partie ${code}.` }],
    pendingAttack: null,
    cardDuel: null,
    awale: null,
    twentyOne: null
  };

  rooms.set(code, room);
  playersBySocketId.set(hostSocketId, { code, playerId: host.id });
  return room;
}

export function joinRoom(code, socketId, playerName) {
  const room = rooms.get(code);
  if (!room) throw new Error("Room introuvable.");
  if (room.phase !== "lobby") throw new Error("Partie dÃ©jÃ  dÃ©marrÃ©e.");
  if (room.players.length >= 2) throw new Error("La room est pleine.");

  const player = makePlayer(socketId, playerName, 2);
  room.players.push(player);
  playersBySocketId.set(socketId, { code, playerId: player.id });
  room.log.push({ at: Date.now(), type: "player_joined", message: `${playerName} a rejoint.` });

  return room;
}

export function spectateRoom(code, socketId, spectatorName) {
  const room = rooms.get(code);
  if (!room) throw new Error("Room introuvable.");

  const spectator = {
    id: uid("s"),
    socketId,
    name: spectatorName || "Spectateur"
  };
  room.spectators ??= [];
  room.spectators.push(spectator);
  playersBySocketId.set(socketId, { code, playerId: null, spectatorId: spectator.id });
  room.log.push({ at: Date.now(), type: "spectator_joined", message: `${spectator.name} regarde la partie.` });

  return room;
}

export function startGame(code, requesterPlayerId) {
  const room = rooms.get(code);
  if (!room) throw new Error("Room introuvable.");
  if (!requesterPlayerId || room.hostPlayerId !== requesterPlayerId) throw new Error("Seul l'hÃ´te peut dÃ©marrer la partie.");
  if (room.players.length !== 2) throw new Error("Il faut 2 joueurs pour dÃ©marrer.");

  room.turnIndex = Math.floor(Math.random() * room.players.length);
  room.pendingAttack = null;

  if (room.gameType === "awale") return startAwaleGame(room);
  if (room.gameType === "twenty_one") return startTwentyOneGame(room);
  return startCardDuelGame(room);
}

export function replayGame(code, requesterPlayerId) {
  const room = rooms.get(code);
  if (!room) throw new Error("Room introuvable.");
  if (room.phase !== "finished") throw new Error("La partie n'est pas terminée.");
  if (!room.players.some((p) => p.id === requesterPlayerId)) throw new Error("Seuls les joueurs peuvent relancer.");
  if (room.players.length !== 2) throw new Error("Il faut 2 joueurs pour relancer.");

  room.turnIndex = Math.floor(Math.random() * room.players.length);
  room.pendingAttack = null;
  room.cardDuel = null;
  room.awale = null;
  room.twentyOne = null;
  room.log.push({ at: Date.now(), type: "game_replay", message: "Nouvelle partie lancée." });

  if (room.gameType === "awale") return startAwaleGame(room);
  if (room.gameType === "twenty_one") return startTwentyOneGame(room);
  return startCardDuelGame(room);
}

export function abortGame(code, playerId) {
  const room = rooms.get(code);
  if (!room) throw new Error("Room introuvable.");
  if (room.phase === "finished" || room.phase === "lobby") throw new Error("Aucune partie en cours Ã  abandonner.");

  const quitterSide = room.players.findIndex((p) => p.id === playerId);
  if (quitterSide < 0) throw new Error("Joueur introuvable.");
  const winnerSide = quitterSide === 0 ? 1 : 0;

  if (room.gameType === "twenty_one" && room.twentyOne) return abortTwentyOneGame(room, quitterSide, winnerSide);

  if (room.gameType === "awale" && room.awale) {
    const remaining = room.awale.board.reduce((total, seeds) => total + seeds, 0);
    room.awale.board = Array(AWALE_PITS_PER_PLAYER * 2).fill(0);
    room.awale.captured[winnerSide] += remaining;
    finishAwale(room, "abort", `${room.players[quitterSide].name} abandonne. ${room.players[winnerSide].name} capture les ${remaining} graine(s) restantes.`);
    return room;
  }

  room.phase = "finished";
  room.log.push({
    at: Date.now(),
    type: "game_finished",
    message: `${room.players[quitterSide].name} abandonne. ${room.players[winnerSide].name} remporte le combat.`
  });
  return room;
}

export function leaveBySocket(socketId) {
  const ref = playersBySocketId.get(socketId);
  if (!ref) return null;

  const room = rooms.get(ref.code);
  playersBySocketId.delete(socketId);
  if (!room) return null;

  if (ref.spectatorId) {
    room.spectators = (room.spectators ?? []).filter((s) => s.id !== ref.spectatorId);
    room.log.push({ at: Date.now(), type: "spectator_left", message: "Un spectateur a quitté la partie." });
    return ref.code;
  }

  room.players = room.players.filter((p) => p.id !== ref.playerId);
  if (room.hostPlayerId === ref.playerId) {
    room.hostPlayerId = room.players[0]?.id ?? null;
  }
  room.log.push({ at: Date.now(), type: "disconnect", message: "Un joueur a quitté la partie." });

  if (!room.players.length) rooms.delete(ref.code);
  return ref.code;
}
