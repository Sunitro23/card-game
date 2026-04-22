import crypto from "node:crypto";

const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const MAX_ENERGY = 6;
const ENERGY_PER_TURN = 2;
const STARTING_HP = 30;
const MAX_HAND_SIZE = 5;
const MAX_DEFENSE_IN_HAND = 2;

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
        player.discard.push(card);
        room.log.push({ at: Date.now(), type: "defense_cap", message: `${player.name} a déjà 2 défenses en main, carte défaussée.` });
        continue;
      }
    }

    player.hand.push(card);
  }
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

function autoSkipTurnIfNoEnergy(room) {
  if (room.phase !== "combat" || room.pendingAttack) return;
  const current = getCurrentPlayer(room);
  if (!current || current.energy > 0) return;

  room.log.push({
    at: Date.now(),
    type: "turn_auto_skip",
    message: `${current.name} n'a plus d'énergie, son tour est passé automatiquement.`
  });

  room.turnIndex = (room.turnIndex + 1) % room.players.length;
  room.log.push({ at: Date.now(), type: "turn_end", message: `${current.name} termine son tour.` });
  startTurn(room);
}

export function createRoom(hostSocketId, hostName) {
  let code = generateRoomCode();
  while (rooms.has(code)) code = generateRoomCode();

  const host = makePlayer(hostSocketId, hostName, 0);
  const room = {
    code,
    phase: "lobby",
    createdAt: Date.now(),
    turnIndex: 0,
    players: [host],
    log: [{ at: Date.now(), type: "room_created", message: `${hostName} a créé la partie ${code}.` }],
    pendingAttack: null
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

export function startGame(code) {
  const room = rooms.get(code);
  if (!room) throw new Error("Room introuvable.");
  if (room.players.length !== 2) throw new Error("Il faut 2 joueurs pour démarrer.");

  room.phase = "combat";
  room.turnIndex = Math.floor(Math.random() * room.players.length);
  room.pendingAttack = null;

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
  autoSkipTurnIfNoEnergy(room);
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

  autoSkipTurnIfNoEnergy(room);
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
    config: {
      maxEnergy: MAX_ENERGY,
      energyPerTurn: ENERGY_PER_TURN,
      maxHandSize: MAX_HAND_SIZE,
      maxDefenseInHand: MAX_DEFENSE_IN_HAND,
      attacks: Object.values(ATTACKS)
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
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      hp: p.hp,
      energy: p.energy,
      position: p.position,
      handCount: p.hand.length,
      hand: p.id === playerId ? p.hand : undefined
    })),
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
  room.log.push({ at: Date.now(), type: "disconnect", message: "Un joueur a quitté la partie." });

  if (!room.players.length) rooms.delete(ref.code);
  return ref.code;
}
