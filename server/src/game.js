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
  return gameType === "awale" ? "awale" : "card_duel";
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
    awale: null
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
      awale: { pitsPerPlayer: AWALE_PITS_PER_PLAYER, seedsPerPit: AWALE_SEEDS_PER_PIT }
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
      hand: p.id === playerId ? p.hand : undefined
    })),
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
