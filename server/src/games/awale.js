import { AWALE_PITS_PER_PLAYER, AWALE_SEEDS_PER_PIT, AWALE_TOTAL_PITS } from "../core/constants.js";
import { rooms } from "../core/state.js";
import { uid } from "../core/random.js";
import { getCurrentPlayer } from "../core/players.js";

export function startAwaleGame(room) {
  room.phase = "awale";
  room.awale = {
    board: Array(AWALE_TOTAL_PITS).fill(AWALE_SEEDS_PER_PIT),
    captured: [0, 0],
    history: new Set(),
    finishedReason: null,
    winnerSide: null,
    lastMove: null
  };
  room.awale.history.add(awaleStateKey(room));
  room.log.push({
    at: Date.now(),
    type: "game_started",
    message: `AwalÃ© lancÃ©. ${getCurrentPlayer(room).name} joue en premier.`
  });
  return room;
}

export function isAwaleSidePit(pitIndex, side) {
  return side === 0
    ? pitIndex >= 0 && pitIndex < AWALE_PITS_PER_PLAYER
    : pitIndex >= AWALE_PITS_PER_PLAYER && pitIndex < AWALE_TOTAL_PITS;
}

function awaleSidePitIndexes(side) {
  return side === 0 ? [0, 1, 2, 3, 4, 5] : [6, 7, 8, 9, 10, 11];
}

function awaleOpponentSide(side) {
  return side === 0 ? 1 : 0;
}

function awaleSideSeedCount(board, side) {
  return awaleSidePitIndexes(side).reduce((total, pitIndex) => total + board[pitIndex], 0);
}

function awaleStateKey(room) {
  return `${room.turnIndex % room.players.length}|${room.awale.board.join(",")}|${room.awale.captured.join(",")}`;
}

export function getPlayerSide(room, playerId) {
  const playerIndex = room.players.findIndex((p) => p.id === playerId);
  if (playerIndex < 0) throw new Error("Joueur introuvable.");
  return playerIndex;
}

function simulateAwaleMove(board, side, pitIndex) {
  const nextBoard = [...board];
  const sowPath = [];
  let seeds = nextBoard[pitIndex];
  nextBoard[pitIndex] = 0;
  let cursor = pitIndex;

  while (seeds > 0) {
    cursor = (cursor + 1) % AWALE_TOTAL_PITS;
    if (cursor === pitIndex) continue;
    nextBoard[cursor] += 1;
    sowPath.push(cursor);
    seeds -= 1;
  }

  const opponentSide = awaleOpponentSide(side);
  const capturedPits = [];
  if (isAwaleSidePit(cursor, opponentSide) && (nextBoard[cursor] === 2 || nextBoard[cursor] === 3)) {
    let captureCursor = cursor;
    while (isAwaleSidePit(captureCursor, opponentSide) && (nextBoard[captureCursor] === 2 || nextBoard[captureCursor] === 3)) {
      capturedPits.push(captureCursor);
      captureCursor = (captureCursor - 1 + AWALE_TOTAL_PITS) % AWALE_TOTAL_PITS;
    }
  }

  const capturedSeeds = capturedPits.reduce((total, capturedPit) => total + nextBoard[capturedPit], 0);
  for (const capturedPit of capturedPits) nextBoard[capturedPit] = 0;

  return { board: nextBoard, capturedPits, capturedSeeds, lastPit: cursor, sowPath };
}

export function getLegalAwaleMoves(room, side) {
  return awaleSidePitIndexes(side).filter((pitIndex) => {
    if (room.awale.board[pitIndex] <= 0) return false;
    const result = simulateAwaleMove(room.awale.board, side, pitIndex);
    return awaleSideSeedCount(result.board, awaleOpponentSide(side)) > 0;
  });
}

function captureAwaleRemainder(room, side) {
  const captured = awaleSidePitIndexes(side).reduce((total, pitIndex) => {
    const seeds = room.awale.board[pitIndex];
    room.awale.board[pitIndex] = 0;
    return total + seeds;
  }, 0);
  room.awale.captured[side] += captured;
  return captured;
}

export function finishAwale(room, reason, message) {
  room.phase = "finished";
  room.awale.finishedReason = reason;
  const [scoreA, scoreB] = room.awale.captured;
  room.awale.winnerSide = scoreA === scoreB ? null : scoreA > scoreB ? 0 : 1;
  room.log.push({ at: Date.now(), type: "game_finished", message });
}

export function playAwaleMove(code, playerId, pitIndex) {
  const room = rooms.get(code);
  if (!room) throw new Error("Room introuvable.");
  if (room.gameType !== "awale" || room.phase !== "awale") throw new Error("La partie d'Awalé n'est pas en cours.");

  const actor = room.players.find((p) => p.id === playerId);
  const current = getCurrentPlayer(room);
  if (!actor || current.id !== actor.id) throw new Error("Ce n'est pas votre tour.");

  const side = getPlayerSide(room, playerId);
  const normalizedPitIndex = Number(pitIndex);
  if (!Number.isInteger(normalizedPitIndex) || !isAwaleSidePit(normalizedPitIndex, side)) {
    throw new Error("Choisissez un trou de votre camp.");
  }
  if (room.awale.board[normalizedPitIndex] <= 0) throw new Error("Ce trou est vide.");

  const legalMoves = getLegalAwaleMoves(room, side);
  if (!legalMoves.includes(normalizedPitIndex)) {
    throw new Error("Coup interdit : il affamerait l'adversaire.");
  }

  const startingSeeds = room.awale.board[normalizedPitIndex];
  const result = simulateAwaleMove(room.awale.board, side, normalizedPitIndex);
  room.awale.board = result.board;
  room.awale.captured[side] += result.capturedSeeds;
  room.awale.lastMove = {
    id: uid("awale_move"),
    playerId: actor.id,
    side,
    fromPit: normalizedPitIndex,
    sowPath: result.sowPath,
    lastPit: result.lastPit,
    capturedPits: result.capturedPits,
    capturedSeeds: result.capturedSeeds
  };

  const captureText = result.capturedSeeds > 0 ? ` et capture ${result.capturedSeeds} graine(s)` : "";
  const krooText = startingSeeds > 11 ? " (Kroo)" : "";
  room.log.push({
    at: Date.now(),
    type: "awale_move",
    message: `${actor.name} sème depuis le trou ${normalizedPitIndex + 1}${krooText}${captureText}.`
  });

  const nextSide = awaleOpponentSide(side);
  if (awaleSideSeedCount(room.awale.board, nextSide) === 0) {
    const remainder = captureAwaleRemainder(room, side);
    finishAwale(
      room,
      "empty_side",
      `${room.players[nextSide].name} n'a plus de graines. ${actor.name} récupère ${remainder} graine(s) restante(s).`
    );
    return room;
  }

  room.turnIndex = (room.turnIndex + 1) % room.players.length;

  if (getLegalAwaleMoves(room, nextSide).length === 0) {
    finishAwale(
      room,
      "starvation_lock",
      `Aucun coup légal ne peut nourrir ${room.players[side].name}. Les graines restantes ne sont pas capturées.`
    );
    return room;
  }

  const key = awaleStateKey(room);
  if (room.awale.history.has(key)) {
    finishAwale(room, "loop", "Configuration répétée : la partie boucle, les graines restantes ne sont pas capturées.");
    return room;
  }
  room.awale.history.add(key);
  room.log.push({ at: Date.now(), type: "turn_started", message: `Tour de ${getCurrentPlayer(room).name}.` });
  return room;
}
