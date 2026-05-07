import crypto from "node:crypto";

const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const MAX_ENERGY = 6;
const ENERGY_PER_TURN = 2;
const STARTING_HP = 30;
const MAX_HAND_SIZE = 5;
const MAX_DEFENSE_IN_HAND = 2;
const AWALE_SEEDS_PER_PIT = 4;
const AWALE_PITS_PER_PLAYER = 6;
const AWALE_TOTAL_PITS = AWALE_PITS_PER_PLAYER * 2;
const TWENTY_ONE_STARTING_LIVES = 3;
const TWENTY_ONE_STARTING_TARGET = 21;
const TWENTY_ONE_STARTING_BET = 1;
const TWENTY_ONE_STARTING_TRUMPS = 3;

const ATTACKS = {
  ranged: { type: "ranged", label: "Attaque à distance", dieSides: 4 },
  magic: { type: "magic", label: "Attaque magique", dieSides: 6 },
  melee: { type: "melee", label: "Attaque de mêlée", dieSides: 8 }
};

export const rooms = new Map();
export const playersBySocketId = new Map();

function uid(prefix) {
  return `${prefix}_${crypto.randomBytes(4).toString("hex")}`;
}

function rollDie(sides = 6) {
  return Math.floor(Math.random() * sides) + 1;
}

function generateRoomCode() {
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  }
  return code;
}

function createDeck() {
  const cards = [
    { id: uid("def"), type: "defense", defense: "dodge" },
    { id: uid("def"), type: "defense", defense: "block", value: 3 },
    { id: uid("def"), type: "defense", defense: "counter_melee" },
    { id: uid("def"), type: "defense", defense: "counter_magic" },
    { id: uid("util"), type: "utility", utility: "vision" },
    { id: uid("util"), type: "utility", utility: "critical" },
    { id: uid("util"), type: "utility", utility: "steal" },
    { id: uid("def"), type: "defense", defense: "block", value: 2 },
    { id: uid("util"), type: "utility", utility: "critical" }
  ];

  return cards.sort(() => Math.random() - 0.5);
}

function makePlayer(socketId, name, position) {
  return {
    id: uid("p"),
    socketId,
    name,
    awaleSide: position === 0 ? 0 : 1,
    hp: STARTING_HP,
    energy: 0,
    hand: [],
    deck: createDeck(),
    discard: [],
    position,
    status: { nextCritical: false, visionActive: false }
  };
}

function drawRaw(player, count = 1) {
  const drawn = [];
  for (let i = 0; i < count; i += 1) {
    if (!player.deck.length) {
      player.deck = player.discard.sort(() => Math.random() - 0.5);
      player.discard = [];
      if (!player.deck.length) break;
    }
    const card = player.deck.pop();
    drawn.push(card);
  }
  return drawn;
}

function addToHandRespectingLimits(room, player, cards) {
  for (const card of cards) {
    if (player.hand.length >= MAX_HAND_SIZE) {
      player.discard.push(card);
      room.log.push({ at: Date.now(), type: "hand_full", message: `${player.name} a la main pleine (5), carte défaussée.` });
      continue;
    }

    if (card.type === "defense") {
      const defenseCount = player.hand.filter((c) => c.type === "defense").length;
      if (defenseCount >= MAX_DEFENSE_IN_HAND) {
        const replacement = drawUtilityReplacement(player, card);
        if (replacement) {
          player.hand.push(replacement);
          room.log.push({
            at: Date.now(),
            type: "defense_cap",
            message: `${player.name} a déjà 2 défenses : une carte utilitaire a été piochée à la place.`
          });
        } else {
          room.log.push({
            at: Date.now(),
            type: "defense_cap",
            message: `${player.name} a déjà 2 défenses et aucune utilitaire n'est disponible.`
          });
        }
        continue;
      }
    }

    player.hand.push(card);
  }
}

function drawUtilityReplacement(player, blockedDefenseCard) {
  const skipped = [blockedDefenseCard];
  const maxAttempts = player.deck.length + player.discard.length;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const [candidate] = drawRaw(player, 1);
    if (!candidate) break;

    if (candidate.type === "utility") {
      if (skipped.length) {
        player.deck.push(...skipped);
        player.deck = player.deck.sort(() => Math.random() - 0.5);
      }
      return candidate;
    }

    skipped.push(candidate);
  }

  if (skipped.length) {
    player.deck.push(...skipped);
    player.deck = player.deck.sort(() => Math.random() - 0.5);
  }

  return null;
}

function getCurrentPlayer(room) {
  return room.players[room.turnIndex % room.players.length];
}

function getOpponent(room, playerId) {
  return room.players.find((p) => p.id !== playerId);
}

function removeCardFromHand(player, cardId) {
  const idx = player.hand.findIndex((c) => c.id === cardId);
  if (idx < 0) throw new Error("Carte absente de la main.");
  return player.hand.splice(idx, 1)[0];
}

function spendEnergy(player, amount = 1) {
  if (player.energy < amount) throw new Error("Énergie insuffisante.");
  player.energy -= amount;
}

function startTurn(room) {
  const current = getCurrentPlayer(room);
  current.energy = Math.min(MAX_ENERGY, current.energy + ENERGY_PER_TURN);
  current.status.visionActive = false;
  room.log.push({
    at: Date.now(),
    type: "turn_started",
    message: `Tour de ${current.name} (+${ENERGY_PER_TURN} énergie, total ${current.energy}/${MAX_ENERGY}).`
  });
}

function normalizeGameType(gameType) {
  if (gameType === "awale") return "awale";
  if (gameType === "twenty_one") return "twenty_one";
  return "card_duel";
}

const TWENTY_ONE_TRUMP_DEFS = [
  ...[2, 3, 4, 5, 6, 7].map((value) => ({ type: "trump", trumpType: "add_number", value, name: `${value}-Card` })),
  { type: "trump", trumpType: "go_for", target: 17, name: "Go For 17" },
  { type: "trump", trumpType: "go_for", target: 24, name: "Go For 24" },
  { type: "trump", trumpType: "go_for", target: 27, name: "Go For 27" },
  { type: "trump", trumpType: "bet", action: "one_up", name: "One-Up" },
  { type: "trump", trumpType: "bet", action: "shield", name: "Shield" },
  { type: "trump", trumpType: "bet", action: "bless", name: "Bless" },
  { type: "trump", trumpType: "bet", action: "bloodshed", name: "Bloodshed" },
  { type: "trump", trumpType: "bet", action: "destroy", name: "Destroy" },
  { type: "trump", trumpType: "bet", action: "friendship", name: "Friendship" },
  { type: "trump", trumpType: "bet", action: "reincarnation", name: "Reincarnation" },
  { type: "trump", trumpType: "deck", action: "hush", name: "Hush" },
  { type: "trump", trumpType: "deck", action: "perfect_draw", name: "Perfect Draw" },
  { type: "trump", trumpType: "deck", action: "refresh", name: "Refresh" },
  { type: "trump", trumpType: "deck", action: "remove", name: "Remove" },
  { type: "trump", trumpType: "deck", action: "return", name: "Return" },
  { type: "trump", trumpType: "deck", action: "exchange", name: "Exchange" },
  { type: "trump", trumpType: "deck", action: "disservice", name: "Disservice" }
];

function createTwentyOneNumberDeck() {
  const cards = [];
  for (let value = 1; value <= 10; value += 1) {
    for (let copy = 0; copy < 4; copy += 1) cards.push({ id: uid("num"), value, hidden: false });
  }
  return cards.sort(() => Math.random() - 0.5);
}

function createTwentyOneTrumpDeck() {
  const cards = [];
  for (let copy = 0; copy < 2; copy += 1) {
    for (const def of TWENTY_ONE_TRUMP_DEFS) cards.push({ id: uid("trump"), ...def });
  }
  return cards.sort(() => Math.random() - 0.5);
}

function twentyOnePlayerState() {
  return { lives: TWENTY_ONE_STARTING_LIVES, cards: [], stood: false, lastTrump: null, bless: false };
}

function twentyOneTotal(player) {
  return player.twentyOne.cards.reduce((total, card) => total + card.value, 0);
}

function drawTwentyOneTrump(room, player, count = 1) {
  const drawn = [];
  for (let i = 0; i < count; i += 1) {
    if (!room.twentyOne.trumpDeck.length) break;
    const card = room.twentyOne.trumpDeck.pop();
    player.hand.push(card);
    drawn.push(card);
  }
  return drawn;
}

function drawTwentyOneNumber(room, player, { hidden = false, value = null, perfect = false } = {}) {
  let index = -1;
  if (value !== null) {
    index = room.twentyOne.numberDeck.findIndex((card) => card.value === value);
  } else if (perfect) {
    const total = twentyOneTotal(player);
    const target = room.twentyOne.target;
    let bestValue = -1;
    room.twentyOne.numberDeck.forEach((card, cardIndex) => {
      if (total + card.value <= target && card.value > bestValue) {
        bestValue = card.value;
        index = cardIndex;
      }
    });
  } else if (room.twentyOne.numberDeck.length) {
    index = room.twentyOne.numberDeck.length - 1;
  }

  if (index < 0) return null;
  const [card] = room.twentyOne.numberDeck.splice(index, 1);
  player.twentyOne.cards.push({ ...card, hidden });
  return card;
}

function returnTwentyOneNumberCards(room, cards) {
  room.twentyOne.numberDeck.push(...cards.map((card) => ({ id: uid("num"), value: card.value, hidden: false })));
  room.twentyOne.numberDeck = room.twentyOne.numberDeck.sort(() => Math.random() - 0.5);
}

function resetTwentyOneRound(room) {
  room.twentyOne.round += 1;
  room.twentyOne.target = TWENTY_ONE_STARTING_TARGET;
  room.twentyOne.bet = TWENTY_ONE_STARTING_BET;
  room.twentyOne.numberDeck = createTwentyOneNumberDeck();
  for (const player of room.players) {
    player.twentyOne.cards = [];
    player.twentyOne.stood = false;
    player.twentyOne.lastTrump = null;
    player.twentyOne.bless = false;
  }
}

function destroyLastOpponentTrump(room, actor, opponent) {
  const destroyed = opponent.twentyOne.lastTrump;
  if (!destroyed) return null;
  if (destroyed.trumpType === "go_for") room.twentyOne.target = TWENTY_ONE_STARTING_TARGET;
  if (destroyed.trumpType === "bet" && destroyed.action === "one_up") room.twentyOne.bet = Math.max(0, room.twentyOne.bet - 1);
  if (destroyed.trumpType === "bet" && destroyed.action === "shield") room.twentyOne.bet += 1;
  if (destroyed.trumpType === "bet" && destroyed.action === "bless") opponent.twentyOne.bless = false;
  opponent.twentyOne.lastTrump = null;
  room.log.push({ at: Date.now(), type: "twenty_one_destroy", message: `${actor.name} détruit ${destroyed.name} de ${opponent.name}.` });
  return destroyed;
}

function scoreTwentyOnePlayer(player, target) {
  const total = twentyOneTotal(player);
  return { total, distance: Math.abs(target - total), busted: total > target };
}

function resolveTwentyOneRound(room) {
  const [a, b] = room.players;
  const scoreA = scoreTwentyOnePlayer(a, room.twentyOne.target);
  const scoreB = scoreTwentyOnePlayer(b, room.twentyOne.target);
  let loser = null;

  if (scoreA.busted && !scoreB.busted) loser = a;
  else if (scoreB.busted && !scoreA.busted) loser = b;
  else if (scoreA.distance < scoreB.distance) loser = b;
  else if (scoreB.distance < scoreA.distance) loser = a;

  if (!loser) {
    room.log.push({ at: Date.now(), type: "twenty_one_round_tie", message: `Manche ${room.twentyOne.round} nulle : ${a.name} ${scoreA.total}, ${b.name} ${scoreB.total}, cible ${room.twentyOne.target}.` });
    resetTwentyOneRound(room);
    room.log.push({ at: Date.now(), type: "twenty_one_round_start", message: `Manche ${room.twentyOne.round} lancée. Cible 21, bet 1.` });
    return;
  }

  const winner = loser.id === a.id ? b : a;
  const damage = room.twentyOne.bet;
  if (loser.twentyOne.lives - damage <= 0 && loser.twentyOne.bless) {
    loser.twentyOne.bless = false;
    loser.twentyOne.lives = 1;
    room.log.push({ at: Date.now(), type: "twenty_one_bless", message: `${loser.name} est sauvé par Bless et reste à 1 vie.` });
  } else {
    loser.twentyOne.lives = Math.max(0, loser.twentyOne.lives - damage);
  }

  room.log.push({
    at: Date.now(),
    type: "twenty_one_round_resolved",
    message: `${winner.name} gagne la manche ${room.twentyOne.round} (${scoreTwentyOnePlayer(winner, room.twentyOne.target).total} vs ${scoreTwentyOnePlayer(loser, room.twentyOne.target).total}, cible ${room.twentyOne.target}). ${loser.name} perd ${damage} vie(s).`
  });

  if (loser.twentyOne.lives <= 0) {
    room.phase = "finished";
    room.twentyOne.winnerId = winner.id;
    room.log.push({ at: Date.now(), type: "game_finished", message: `${winner.name} remporte Twenty One.` });
    return;
  }

  resetTwentyOneRound(room);
  room.log.push({ at: Date.now(), type: "twenty_one_round_start", message: `Manche ${room.twentyOne.round} lancée. Cible 21, bet 1.` });
}

function checkTwentyOneRoundResolution(room) {
  if (room.phase !== "twenty_one") return;
  if (room.players.every((player) => player.twentyOne.stood)) resolveTwentyOneRound(room);
}

function isAwaleSidePit(pitIndex, side) {
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

function getPlayerSide(room, playerId) {
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

function getLegalAwaleMoves(room, side) {
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

function finishAwale(room, reason, message) {
  room.phase = "finished";
  room.awale.finishedReason = reason;
  const [scoreA, scoreB] = room.awale.captured;
  room.awale.winnerSide = scoreA === scoreB ? null : scoreA > scoreB ? 0 : 1;
  room.log.push({ at: Date.now(), type: "game_finished", message });
}

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
    hostPlayerId: host.id,
    log: [{ at: Date.now(), type: "room_created", message: `${hostName} a créé la partie ${code}.` }],
    pendingAttack: null,
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
  if (room.phase !== "lobby") throw new Error("Partie déjà démarrée.");
  if (room.players.length >= 2) throw new Error("La room est pleine.");

  const player = makePlayer(socketId, playerName, 2);
  room.players.push(player);
  playersBySocketId.set(socketId, { code, playerId: player.id });
  room.log.push({ at: Date.now(), type: "player_joined", message: `${playerName} a rejoint.` });

  return room;
}

export function startGame(code, requesterPlayerId) {
  const room = rooms.get(code);
  if (!room) throw new Error("Room introuvable.");
  if (requesterPlayerId && room.hostPlayerId !== requesterPlayerId) throw new Error("Seul l'hôte peut démarrer la partie.");
  if (room.players.length !== 2) throw new Error("Il faut 2 joueurs pour démarrer.");

  room.turnIndex = Math.floor(Math.random() * room.players.length);
  room.pendingAttack = null;

  if (room.gameType === "awale") {
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
      message: `Awalé lancé. ${getCurrentPlayer(room).name} joue en premier.`
    });
    return room;
  }

  if (room.gameType === "twenty_one") {
    room.phase = "twenty_one";
    room.twentyOne = {
      round: 1,
      target: TWENTY_ONE_STARTING_TARGET,
      bet: TWENTY_ONE_STARTING_BET,
      numberDeck: createTwentyOneNumberDeck(),
      trumpDeck: createTwentyOneTrumpDeck(),
      winnerId: null
    };
    room.players.forEach((p) => {
      p.hp = p.twentyOne?.lives ?? TWENTY_ONE_STARTING_LIVES;
      p.energy = 0;
      p.hand = [];
      p.deck = [];
      p.discard = [];
      p.twentyOne = twentyOnePlayerState();
      drawTwentyOneTrump(room, p, TWENTY_ONE_STARTING_TRUMPS);
    });
    room.log.push({ at: Date.now(), type: "game_started", message: `Twenty One lancé. Cible 21, bet 1. Chaque joueur peut agir librement, sans tour imposé.` });
    return room;
  }

  room.phase = "combat";
  room.players.forEach((p) => {
    p.hp = STARTING_HP;
    p.energy = 0;
    p.hand = [];
    p.deck = createDeck();
    p.discard = [];
    p.status.nextCritical = false;
    p.status.visionActive = false;
    addToHandRespectingLimits(room, p, drawRaw(p, 1));
  });

  room.log.push({ at: Date.now(), type: "game_started", message: "Combat lancé. Chaque joueur pioche 1 carte." });
  startTurn(room);
  return room;
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

export function abortGame(code, playerId) {
  const room = rooms.get(code);
  if (!room) throw new Error("Room introuvable.");
  if (room.phase === "finished" || room.phase === "lobby") throw new Error("Aucune partie en cours à abandonner.");

  const quitterSide = room.players.findIndex((p) => p.id === playerId);
  if (quitterSide < 0) throw new Error("Joueur introuvable.");
  const winnerSide = quitterSide === 0 ? 1 : 0;

  if (room.gameType === "twenty_one" && room.twentyOne) {
    room.phase = "finished";
    room.twentyOne.winnerId = room.players[winnerSide].id;
    room.log.push({
      at: Date.now(),
      type: "game_finished",
      message: `${room.players[quitterSide].name} abandonne. ${room.players[winnerSide].name} remporte Twenty One.`
    });
    return room;
  }

  if (room.gameType === "awale" && room.awale) {
    const remaining = room.awale.board.reduce((total, seeds) => total + seeds, 0);
    room.awale.board = Array(AWALE_TOTAL_PITS).fill(0);
    room.awale.captured[winnerSide] += remaining;
    finishAwale(
      room,
      "abort",
      `${room.players[quitterSide].name} abandonne. ${room.players[winnerSide].name} capture les ${remaining} graine(s) restantes.`
    );
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

export function drawTwentyOneNumberCard(code, playerId) {
  const room = rooms.get(code);
  if (!room) throw new Error("Room introuvable.");
  if (room.phase !== "twenty_one") throw new Error("Twenty One n'est pas en cours.");

  const actor = room.players.find((p) => p.id === playerId);
  if (!actor) throw new Error("Joueur introuvable.");
  if (actor.twentyOne.stood) throw new Error("Vous avez déjà stand.");

  const card = drawTwentyOneNumber(room, actor);
  if (!card) throw new Error("Deck numérique vide.");
  room.log.push({ at: Date.now(), type: "twenty_one_draw", message: `${actor.name} pioche une carte numérique.` });

  if (twentyOneTotal(actor) > room.twentyOne.target) actor.twentyOne.stood = true;
  checkTwentyOneRoundResolution(room);
  return room;
}

export function drawTwentyOneTrumpCard(code, playerId) {
  const room = rooms.get(code);
  if (!room) throw new Error("Room introuvable.");
  if (room.phase !== "twenty_one") throw new Error("Twenty One n'est pas en cours.");
  if (!room.players.some((p) => p.id === playerId)) throw new Error("Joueur introuvable.");
  throw new Error("Les Trumps ne sont pas piochables : chaque joueur reçoit uniquement 3 Trumps au début.");
}

export function standTwentyOne(code, playerId) {
  const room = rooms.get(code);
  if (!room) throw new Error("Room introuvable.");
  if (room.phase !== "twenty_one") throw new Error("Twenty One n'est pas en cours.");

  const actor = room.players.find((p) => p.id === playerId);
  if (!actor) throw new Error("Joueur introuvable.");
  if (actor.twentyOne.stood) throw new Error("Vous avez déjà stand.");
  actor.twentyOne.stood = true;
  room.log.push({ at: Date.now(), type: "twenty_one_stand", message: `${actor.name} stand à ${twentyOneTotal(actor)}.` });
  checkTwentyOneRoundResolution(room);
  return room;
}

export function playTwentyOneTrump(code, playerId, cardId) {
  const room = rooms.get(code);
  if (!room) throw new Error("Room introuvable.");
  if (room.phase !== "twenty_one") throw new Error("Twenty One n'est pas en cours.");

  const actor = room.players.find((p) => p.id === playerId);
  if (!actor) throw new Error("Joueur introuvable.");
  if (actor.twentyOne.stood) throw new Error("Vous avez déjà stand.");
  const opponent = getOpponent(room, actor.id);
  if (!opponent) throw new Error("Aucun adversaire.");

  const card = removeCardFromHand(actor, cardId);
  if (card.type !== "trump") {
    actor.hand.push(card);
    throw new Error("Cette carte n'est pas un Trump Twenty One.");
  }

  let consumed = true;
  let message = `${actor.name} joue ${card.name}.`;

  if (card.trumpType === "add_number") {
    const drawn = drawTwentyOneNumber(room, actor, { value: card.value });
    message = drawn ? `${actor.name} joue ${card.name} et reçoit un ${card.value}.` : `${actor.name} joue ${card.name}, mais aucun ${card.value} n'est disponible.`;
  } else if (card.trumpType === "go_for") {
    room.twentyOne.target = card.target;
    message = `${actor.name} change la cible : Go For ${card.target}.`;
  } else if (card.trumpType === "bet") {
    if (card.action === "one_up") room.twentyOne.bet += 1;
    if (card.action === "shield") room.twentyOne.bet = Math.max(0, room.twentyOne.bet - 1);
    if (card.action === "bless") actor.twentyOne.bless = true;
    if (card.action === "bloodshed") {
      room.twentyOne.bet += 1;
      message = `${actor.name} joue Bloodshed : bet +1. Aucun Trump supplémentaire n'est pioché.`;
    }
    if (card.action === "destroy") {
      consumed = Boolean(destroyLastOpponentTrump(room, actor, opponent));
      message = consumed ? message : `${actor.name} joue Destroy, mais aucun Trump adverse ne peut être détruit.`;
    }
    if (card.action === "friendship") message = `${actor.name} joue Friendship. Aucun Trump supplémentaire n'est pioché.`;
    if (card.action === "reincarnation") {
      consumed = Boolean(destroyLastOpponentTrump(room, actor, opponent));
      message = consumed ? `${actor.name} joue Reincarnation et détruit le dernier Trump adverse. Aucun Trump supplémentaire n'est pioché.` : `${actor.name} joue Reincarnation, mais aucun Trump adverse ne peut être détruit.`;
    }
  } else if (card.trumpType === "deck") {
    if (card.action === "hush") drawTwentyOneNumber(room, actor, { hidden: true });
    if (card.action === "perfect_draw") {
      const drawn = drawTwentyOneNumber(room, actor, { perfect: true });
      message = drawn ? `${actor.name} réalise un Perfect Draw.` : `${actor.name} tente Perfect Draw, mais aucune carte sûre n'est disponible.`;
    }
    if (card.action === "refresh") {
      returnTwentyOneNumberCards(room, actor.twentyOne.cards);
      actor.twentyOne.cards = [];
      drawTwentyOneNumber(room, actor);
      drawTwentyOneNumber(room, actor);
    }
    if (card.action === "remove") {
      const removed = opponent.twentyOne.cards.pop();
      if (removed) returnTwentyOneNumberCards(room, [removed]);
      message = removed ? message : `${actor.name} joue Remove, mais ${opponent.name} n'a pas de carte numérique.`;
    }
    if (card.action === "return") {
      const removed = actor.twentyOne.cards.pop();
      if (removed) returnTwentyOneNumberCards(room, [removed]);
      message = removed ? message : `${actor.name} joue Return, mais n'a pas de carte numérique.`;
    }
    if (card.action === "exchange") {
      const own = actor.twentyOne.cards.pop();
      const other = opponent.twentyOne.cards.pop();
      if (own && other) {
        actor.twentyOne.cards.push({ ...other, hidden: false });
        opponent.twentyOne.cards.push({ ...own, hidden: false });
      } else {
        if (own) actor.twentyOne.cards.push(own);
        if (other) opponent.twentyOne.cards.push(other);
        message = `${actor.name} joue Exchange, mais l'échange est impossible.`;
      }
    }
    if (card.action === "disservice") drawTwentyOneNumber(room, opponent);
  }

  actor.discard.push(card);
  if (consumed) actor.twentyOne.lastTrump = card;
  room.log.push({ at: Date.now(), type: "twenty_one_trump", message, playerId: actor.id, card: { name: card.name, trumpType: card.trumpType, action: card.action, value: card.value, target: card.target } });
  if (twentyOneTotal(actor) > room.twentyOne.target) actor.twentyOne.stood = true;
  if (twentyOneTotal(opponent) > room.twentyOne.target) opponent.twentyOne.stood = true;
  checkTwentyOneRoundResolution(room);
  return room;
}

export function drawCard(code, playerId) {
  const room = rooms.get(code);
  if (!room) throw new Error("Room introuvable.");
  if (room.phase !== "combat") throw new Error("Le combat n'a pas commencé.");
  if (room.pendingAttack) throw new Error("Une attaque est en attente de défense.");

  const actor = room.players.find((p) => p.id === playerId);
  const current = getCurrentPlayer(room);
  if (!actor || current.id !== actor.id) throw new Error("Ce n'est pas votre tour.");
  if (actor.hand.length >= MAX_HAND_SIZE) throw new Error("Main pleine (5 cartes max).");

  spendEnergy(actor, 1);
  const drawn = drawRaw(actor, 1);
  addToHandRespectingLimits(room, actor, drawn);
  room.log.push({ at: Date.now(), type: "draw", message: `${actor.name} pioche (coût 1 énergie).` });
  return room;
}

export function performAttack(code, playerId, { attackType, targetPlayerId }) {
  const room = rooms.get(code);
  if (!room) throw new Error("Room introuvable.");
  if (room.phase !== "combat") throw new Error("Le combat n'a pas commencé.");
  if (room.pendingAttack) throw new Error("Une attaque est en attente de défense.");

  const actor = room.players.find((p) => p.id === playerId);
  const current = getCurrentPlayer(room);
  if (!actor || current.id !== actor.id) throw new Error("Ce n'est pas votre tour.");

  const attack = ATTACKS[attackType];
  if (!attack) throw new Error("Type d'attaque invalide.");
  spendEnergy(actor, 1);

  const target = room.players.find((p) => p.id === targetPlayerId) ?? getOpponent(room, actor.id);
  if (!target) throw new Error("Aucune cible.");

  room.pendingAttack = {
    id: uid("attack"),
    attackerId: actor.id,
    targetId: target.id,
    card: attack
  };

  room.log.push({ at: Date.now(), type: "attack_declared", message: `${actor.name} lance ${attack.label} (coût 1 énergie).` });
  return room;
}

export function playCard(code, playerId, { cardId, targetPlayerId }) {
  const room = rooms.get(code);
  if (!room) throw new Error("Room introuvable.");
  if (room.phase !== "combat") throw new Error("Le combat n'a pas commencé.");
  if (room.pendingAttack) throw new Error("Une attaque est en attente de défense.");

  const actor = room.players.find((p) => p.id === playerId);
  const current = getCurrentPlayer(room);
  if (!actor || current.id !== actor.id) throw new Error("Ce n'est pas votre tour.");

  const card = removeCardFromHand(actor, cardId);
  const target = room.players.find((p) => p.id === targetPlayerId) ?? getOpponent(room, actor.id);
  if (!target) throw new Error("Aucune cible.");
  if (card.type !== "utility") {
    actor.hand.push(card);
    throw new Error("Seules les cartes utilitaires sont jouables pendant votre tour.");
  }

  if (card.utility === "critical") {
    actor.status.nextCritical = true;
    room.log.push({ at: Date.now(), type: "buff", message: `${actor.name} prépare un coup critique.` });
  } else if (card.utility === "vision") {
    actor.status.visionActive = true;
    room.log.push({ at: Date.now(), type: "vision", message: `${actor.name} active Vision et voit la main adverse.` });
  } else if (card.utility === "steal") {
    if (target.hand.length) {
      const pickedIndex = Math.floor(Math.random() * target.hand.length);
      const [stolen] = target.hand.splice(pickedIndex, 1);
      if (actor.hand.length >= MAX_HAND_SIZE) {
        target.hand.push(stolen);
        room.log.push({
          at: Date.now(),
          type: "steal",
          message: `${actor.name} tente un vol, mais sa main est pleine.`
        });
      } else {
        actor.hand.push(stolen);
        room.log.push({ at: Date.now(), type: "steal", message: `${actor.name} vole une carte de la main de ${target.name}.` });
      }
    } else {
      room.log.push({ at: Date.now(), type: "steal", message: `${actor.name} tente un vol, mais ${target.name} n'a pas de carte en main.` });
    }
  }

  actor.discard.push(card);
  return room;
}

export function resolveDefense(code, defenderId, defenseCardId = null) {
  const room = rooms.get(code);
  if (!room?.pendingAttack) throw new Error("Aucune attaque en attente.");

  const attack = room.pendingAttack;
  if (attack.targetId !== defenderId) throw new Error("Pas votre défense.");

  const attacker = room.players.find((p) => p.id === attack.attackerId);
  const defender = room.players.find((p) => p.id === defenderId);
  if (!attacker || !defender) throw new Error("Joueur introuvable.");

  let defenseCard = null;
  if (defenseCardId) {
    defenseCard = removeCardFromHand(defender, defenseCardId);
    if (defenseCard.type !== "defense") throw new Error("La carte n'est pas défensive.");
  }

  let damage = rollDie(attack.card.dieSides);
  if (attacker.status.nextCritical) {
    damage *= 2;
    attacker.status.nextCritical = false;
  }

  let reflectedDamage = 0;

  if (defenseCard?.defense === "dodge") {
    damage = 0;
  }

  if (defenseCard?.defense === "block") {
    damage = Math.max(0, damage - (defenseCard.value ?? 3));
  }

  if (defenseCard?.defense === "counter_melee") {
    if (attack.card.type === "melee") {
      reflectedDamage = rollDie(6);
      damage = 0;
    } else {
      room.log.push({ at: Date.now(), type: "counter_fail", message: `${defender.name} rate son contre mêlée.` });
    }
  }

  if (defenseCard?.defense === "counter_magic") {
    if (attack.card.type === "magic") {
      reflectedDamage = rollDie(6);
      damage = 0;
    } else {
      room.log.push({ at: Date.now(), type: "counter_fail", message: `${defender.name} rate son contre magique.` });
    }
  }

  defender.hp = Math.max(0, defender.hp - damage);
  if (reflectedDamage > 0) {
    attacker.hp = Math.max(0, attacker.hp - reflectedDamage);
    room.log.push({ at: Date.now(), type: "counter", message: `${defender.name} contre et renvoie ${reflectedDamage} dégâts.` });
  }

  if (defenseCard) defender.discard.push(defenseCard);

  room.log.push({
    at: Date.now(),
    type: "attack_resolved",
    message: `${attacker.name} inflige ${damage} dégâts à ${defender.name}.`
  });

  room.pendingAttack = null;
  if (defender.hp <= 0 || attacker.hp <= 0) {
    room.phase = "finished";
    const winner = attacker.hp > defender.hp ? attacker.name : defender.name;
    room.log.push({ at: Date.now(), type: "game_finished", message: `${winner} remporte le combat.` });
  }
  return room;
}

export function mulligan() {
  throw new Error("Le mulligan est désactivé dans ce mode.");
}

export function endTurn(code, playerId) {
  const room = rooms.get(code);
  if (!room) throw new Error("Room introuvable.");
  if (room.pendingAttack) throw new Error("Résolvez l'attaque avant de finir le tour.");

  const current = getCurrentPlayer(room);
  if (current.id !== playerId) throw new Error("Ce n'est pas votre tour.");

  room.turnIndex = (room.turnIndex + 1) % room.players.length;
  room.log.push({ at: Date.now(), type: "turn_end", message: `${current.name} termine son tour.` });
  startTurn(room);

  return room;
}

export function getVisibleState(room, playerId) {
  const viewer = room.players.find((p) => p.id === playerId);
  const opponent = getOpponent(room, playerId);

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
      twentyOne: { startingLives: TWENTY_ONE_STARTING_LIVES, startingTarget: TWENTY_ONE_STARTING_TARGET }
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
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      hp: p.hp,
      energy: p.energy,
      position: p.position,
      awaleSide: room.players.findIndex((player) => player.id === p.id),
      handCount: p.hand.length,
      hand: p.id === playerId ? p.hand : undefined,
      twentyOne: p.twentyOne
        ? {
            lives: p.twentyOne.lives,
            total: p.id === playerId
              ? twentyOneTotal(p)
              : p.twentyOne.cards.reduce((total, card) => total + (card.hidden ? 0 : card.value), 0),
            stood: p.twentyOne.stood,
            bless: p.twentyOne.bless,
            cards: p.twentyOne.cards.map((card) => ({
              id: card.id,
              value: p.id === playerId || !card.hidden ? card.value : null,
              hidden: card.hidden
            })),
            trumpCount: p.hand.length
          }
        : null
    })),
    twentyOne: room.twentyOne
      ? {
          round: room.twentyOne.round,
          target: room.twentyOne.target,
          bet: room.twentyOne.bet,
          numberDeckCount: room.twentyOne.numberDeck.length,
          trumpDeckCount: room.twentyOne.trumpDeck.length,
          winnerId: room.twentyOne.winnerId
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

  room.players = room.players.filter((p) => p.id !== ref.playerId);
  if (room.hostPlayerId === ref.playerId) {
    room.hostPlayerId = room.players[0]?.id ?? null;
  }
  room.log.push({ at: Date.now(), type: "disconnect", message: "Un joueur a quitté la partie." });

  if (!room.players.length) rooms.delete(ref.code);
  return ref.code;
}
