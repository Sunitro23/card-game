import { ATTACKS, AWALE_PITS_PER_PLAYER, AWALE_SEEDS_PER_PIT, ENERGY_PER_TURN, MAX_DEFENSE_IN_HAND, MAX_ENERGY, MAX_HAND_SIZE, TWENTY_ONE_MAX_TRUMPS, TWENTY_ONE_STARTING_LIVES, TWENTY_ONE_STARTING_TARGET, TWENTY_ONE_TRUMPS_PER_ROUND } from "./core/constants.js";
import { generateRoomCode, uid } from "./core/random.js";
import { normalizeGameType } from "./core/gameTypes.js";
import { getOpponent, makePlayer } from "./core/players.js";
import { playersBySocketId, rooms } from "./core/state.js";
import { finishAwale, getLegalAwaleMoves, getPlayerSide, playAwaleMove, startAwaleGame } from "./games/awale.js";
import { shootBerenikeShot, startBerenikeShotGame, useBerenikeItem, visibleBerenikePlayer, visibleBerenikeState } from "./games/berenikeShot.js";
import { drawCard, endTurn, mulligan, performAttack, playCard, resolveDefense, startCardDuelGame } from "./games/cardDuel.js";
import { abortTwentyOneGame, drawTwentyOneNumberCard, drawTwentyOneTrumpCard, playTwentyOneTrump, standTwentyOne, startTwentyOneGame, twentyOneTotalForTarget } from "./games/twentyOne.js";

export { playersBySocketId, rooms } from "./core/state.js";
export { drawCard, endTurn, mulligan, performAttack, playCard, resolveDefense } from "./games/cardDuel.js";
export { playAwaleMove } from "./games/awale.js";
export { shootBerenikeShot, useBerenikeItem } from "./games/berenikeShot.js";
export { drawTwentyOneNumberCard, drawTwentyOneTrumpCard, playTwentyOneTrump, standTwentyOne } from "./games/twentyOne.js";

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
    log: [{ at: Date.now(), type: "room_created", message: `${hostName} a créé la partie ${code}.` }],
    pendingAttack: null,
    awale: null,
    berenike: null,
    twentyOne: null
  };

  rooms.set(code, room);
  playersBySocketId.set(hostSocketId, { code, playerId: host.id });
  return room;
}

export function joinRoom(code, socketId, playerName) {
  const room = rooms.get(code);
  if (!room) throw new Error("Room introuvable.");
  if (room.phase !== "lobby") throw new Error("Partie déjà démarrée.");

  const maxPlayers = room.gameType === "berenike_shot" ? 8 : 2;
  if (room.players.length >= maxPlayers) throw new Error("La room est pleine.");

  const player = makePlayer(socketId, playerName, room.players.length);
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

function validatePlayerCountForStart(room) {
  if (room.gameType === "berenike_shot") {
    if (room.players.length < 2 || room.players.length > 8) throw new Error("Berenike Shot se joue de 2 à 8 joueurs.");
    return;
  }
  if (room.players.length !== 2) throw new Error("Il faut 2 joueurs pour démarrer.");
}

export function startGame(code, requesterPlayerId) {
  const room = rooms.get(code);
  if (!room) throw new Error("Room introuvable.");
  if (!requesterPlayerId || room.hostPlayerId !== requesterPlayerId) throw new Error("Seul l'hôte peut démarrer la partie.");
  validatePlayerCountForStart(room);

  room.turnIndex = Math.floor(Math.random() * room.players.length);
  room.pendingAttack = null;

  if (room.gameType === "awale") return startAwaleGame(room);
  if (room.gameType === "twenty_one") return startTwentyOneGame(room);
  if (room.gameType === "berenike_shot") return startBerenikeShotGame(room);
  return startCardDuelGame(room);
}

export function replayGame(code, requesterPlayerId) {
  const room = rooms.get(code);
  if (!room) throw new Error("Room introuvable.");
  if (room.phase !== "finished") throw new Error("La partie n'est pas terminée.");
  if (!room.players.some((p) => p.id === requesterPlayerId)) throw new Error("Seuls les joueurs peuvent relancer.");
  validatePlayerCountForStart(room);

  room.turnIndex = Math.floor(Math.random() * room.players.length);
  room.pendingAttack = null;
  room.awale = null;
  room.berenike = null;
  room.twentyOne = null;
  room.log.push({ at: Date.now(), type: "game_replay", message: "Nouvelle partie lancée." });

  if (room.gameType === "awale") return startAwaleGame(room);
  if (room.gameType === "twenty_one") return startTwentyOneGame(room);
  if (room.gameType === "berenike_shot") return startBerenikeShotGame(room);
  return startCardDuelGame(room);
}

export function abortGame(code, playerId) {
  const room = rooms.get(code);
  if (!room) throw new Error("Room introuvable.");
  if (room.phase === "finished" || room.phase === "lobby") throw new Error("Aucune partie en cours à abandonner.");

  const quitterSide = room.players.findIndex((p) => p.id === playerId);
  if (quitterSide < 0) throw new Error("Joueur introuvable.");
  const winnerSide = quitterSide === 0 ? 1 : 0;

  if (room.gameType === "twenty_one" && room.twentyOne) return abortTwentyOneGame(room, quitterSide, winnerSide);

  if (room.gameType === "berenike_shot" && room.berenike) {
    const quitter = room.players[quitterSide];
    quitter.berenike.active = false;
    quitter.berenike.hp = 0;
    quitter.berenike.inventory = [];
    const active = room.players.filter((player) => player.berenike?.active);
    if (active.length === 1) {
      room.phase = "finished";
      room.berenike.winnerId = active[0].id;
      room.log.push({ at: Date.now(), type: "game_finished", message: `${quitter.name} abandonne. ${active[0].name} remporte Berenike Shot.` });
    } else {
      room.log.push({ at: Date.now(), type: "abort", message: `${quitter.name} abandonne.` });
    }
    return room;
  }

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

export function getVisibleState(room, playerId) {
  const viewer = room.players.find((p) => p.id === playerId);
  const opponent = getOpponent(room, playerId);
  const viewerRole = viewer ? "player" : "spectator";

  return {
    code: room.code,
    phase: room.phase,
    gameType: room.gameType,
    config: {
      maxEnergy: MAX_ENERGY,
      energyPerTurn: ENERGY_PER_TURN,
      maxHandSize: MAX_HAND_SIZE,
      maxDefenseInHand: MAX_DEFENSE_IN_HAND,
      attacks: Object.values(ATTACKS),
      awale: { pitsPerPlayer: AWALE_PITS_PER_PLAYER, seedsPerPit: AWALE_SEEDS_PER_PIT },
      twentyOne: { startingLives: TWENTY_ONE_STARTING_LIVES, startingTarget: TWENTY_ONE_STARTING_TARGET, trumpsPerRound: TWENTY_ONE_TRUMPS_PER_ROUND, maxTrumps: TWENTY_ONE_MAX_TRUMPS }
    },
    turnPlayerId: room.players[room.turnIndex % room.players.length]?.id,
    pendingAttack: room.pendingAttack
      ? {
          id: room.pendingAttack.id,
          attackerId: room.pendingAttack.attackerId,
          targetId: room.pendingAttack.targetId,
          facedown: false,
          card: room.pendingAttack.card
        }
      : null,
    hostPlayerId: room.hostPlayerId,
    viewerRole,
    spectatorCount: room.spectators?.length ?? 0,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      hp: p.hp,
      energy: p.energy,
      position: p.position,
      awaleSide: room.players.findIndex((player) => player.id === p.id),
      handCount: p.hand.length,
      hand: p.id === playerId ? p.hand : undefined,
      berenike: visibleBerenikePlayer(p, playerId),
      twentyOne: p.twentyOne
        ? {
            lives: p.twentyOne.lives,
            total: p.id === playerId
              ? twentyOneTotalForTarget(p, room.twentyOne.target)
              : twentyOneTotalForTarget({ ...p, twentyOne: { ...p.twentyOne, cards: p.twentyOne.cards.filter((card) => !card.hidden) } }, room.twentyOne.target),
            stood: Boolean(p.twentyOne.manualStand),
            manualStand: Boolean(p.twentyOne.manualStand),
            autoBust: p.twentyOne.autoBust,
            bless: p.twentyOne.bless,
            hasDrawnThisTurn: Boolean(p.twentyOne.hasDrawnThisTurn),
            cards: p.twentyOne.cards.map((card) => ({
              id: card.id,
              value: p.id === playerId || !card.hidden ? card.value : null,
              rank: p.id === playerId || !card.hidden ? card.rank : null,
              hidden: card.hidden
            })),
            trumpCount: p.hand.length
          }
        : null
    })),
    berenike: visibleBerenikeState(room, playerId),
    twentyOne: room.twentyOne
      ? {
          round: room.twentyOne.round,
          target: room.twentyOne.target,
          bet: room.twentyOne.bet,
          numberDeckCount: room.twentyOne.numberDeck.length,
          trumpDeckCount: room.twentyOne.trumpDeck.length,
          winnerId: room.twentyOne.winnerId,
          lastRoundResult: room.twentyOne.lastRoundResult
        }
      : null,
    awale: room.awale
      ? {
          board: room.awale.board,
          captured: room.awale.captured,
          legalMoves: viewer ? getLegalAwaleMoves(room, getPlayerSide(room, playerId)) : [],
          finishedReason: room.awale.finishedReason,
          winnerSide: room.awale.winnerSide,
          lastMove: room.awale.lastMove
        }
      : null,
    opponentHandPreview: viewer?.status.visionActive && opponent
      ? opponent.hand.map((c) => ({
          type: c.type,
          defense: c.type === "defense" ? c.defense : undefined,
          utility: c.type === "utility" ? c.utility : undefined
        }))
      : undefined,
    log: room.log.slice(-20)
  };
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
