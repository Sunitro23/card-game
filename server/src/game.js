import crypto from "node:crypto";

const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

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
    { id: uid("atk"), type: "attack", stat: "FOR", baseDamage: 5, range: "proximity", rollMod: 2 },
    { id: uid("atk"), type: "attack", stat: "FOR", baseDamage: 4, range: "proximity", rollMod: 1 },
    { id: uid("atk"), type: "attack", stat: "DEX", baseDamage: 4, range: "distance", rollMod: 3 },
    { id: uid("atk"), type: "attack", stat: "DEX", baseDamage: 3, range: "distance", rollMod: 2 },
    { id: uid("atk"), type: "attack", stat: "INT", baseDamage: 4, range: "distance", rollMod: 2 },
    { id: uid("atk"), type: "attack", stat: "INT", baseDamage: 3, range: "distance", rollMod: 3 },
    { id: uid("def"), type: "defense", defense: "block", value: 4 },
    { id: uid("def"), type: "defense", defense: "dodge", value: 999 },
    { id: uid("def"), type: "defense", defense: "counter", value: 0 },
    { id: uid("util"), type: "utility", utility: "vision" },
    { id: uid("util"), type: "utility", utility: "steal" },
    { id: uid("util"), type: "utility", utility: "critical" },
    { id: uid("util"), type: "utility", utility: "move", value: 2 },
    { id: uid("skill"), type: "skill", skill: "counter_immunity", manaCost: 5 },
    { id: uid("mana"), type: "mana", mana: 1 },
    { id: uid("mana"), type: "mana", mana: 1 },
    { id: uid("mana"), type: "mana", mana: 1 }
  ];

  return cards.sort(() => Math.random() - 0.5);
}

function makeStats() {
  return { VIT: 30, FOR: 3, DEX: 3, INT: 3, SAG: 2, CHA: 2 };
}

export function createRoom(hostSocketId, hostName) {
  let code = generateRoomCode();
  while (rooms.has(code)) code = generateRoomCode();

  const hostPlayerId = uid("p");
  const room = {
    code,
    phase: "lobby",
    createdAt: Date.now(),
    turnIndex: 0,
    players: [
      {
        id: hostPlayerId,
        socketId: hostSocketId,
        name: hostName,
        stats: makeStats(),
        hp: 30,
        mana: 0,
        bluffUsesMax: 2,
        bluffUsesLeft: 2,
        usedUltimate: false,
        mulliganUsedTurn: false,
        hand: [],
        deck: createDeck(),
        discard: [],
        position: 0,
        status: { counterImmune: false }
      }
    ],
    log: [
      { at: Date.now(), type: "room_created", message: `${hostName} a créé la partie ${code}.` }
    ],
    pendingAttack: null
  };

  rooms.set(code, room);
  playersBySocketId.set(hostSocketId, { code, playerId: hostPlayerId });
  return room;
}

export function joinRoom(code, socketId, playerName) {
  const room = rooms.get(code);
  if (!room) throw new Error("Room introuvable.");
  if (room.phase !== "lobby") throw new Error("Partie déjà démarrée.");
  if (room.players.length >= 2) throw new Error("La room est pleine.");

  const playerId = uid("p");
  room.players.push({
    id: playerId,
    socketId,
    name: playerName,
    stats: makeStats(),
    hp: 30,
    mana: 0,
    bluffUsesMax: 2,
    bluffUsesLeft: 2,
    usedUltimate: false,
    mulliganUsedTurn: false,
    hand: [],
    deck: createDeck(),
    discard: [],
    position: 2,
    status: { counterImmune: false }
  });
  playersBySocketId.set(socketId, { code, playerId });
  room.log.push({ at: Date.now(), type: "player_joined", message: `${playerName} a rejoint.` });

  return room;
}

function draw(player, count = 1) {
  for (let i = 0; i < count; i += 1) {
    if (!player.deck.length) {
      player.deck = player.discard.sort(() => Math.random() - 0.5);
      player.discard = [];
      if (!player.deck.length) break;
    }
    player.hand.push(player.deck.pop());
  }
}

export function startGame(code) {
  const room = rooms.get(code);
  if (!room) throw new Error("Room introuvable.");
  if (room.players.length !== 2) throw new Error("Il faut 2 joueurs pour démarrer.");

  room.phase = "combat";
  room.turnIndex = Math.floor(Math.random() * room.players.length);
  room.pendingAttack = null;

  room.players.forEach((p) => {
    draw(p, 5);
    p.mulliganUsedTurn = false;
    p.bluffUsesLeft = p.bluffUsesMax;
    p.usedUltimate = false;
    p.status.counterImmune = false;
  });

  room.log.push({ at: Date.now(), type: "game_started", message: "Combat lancé." });
  return room;
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

export function playCard(code, playerId, { cardId, targetPlayerId, facedown = false }) {
  const room = rooms.get(code);
  if (!room) throw new Error("Room introuvable.");
  if (room.phase !== "combat") throw new Error("Le combat n'a pas commencé.");

  const actor = room.players.find((p) => p.id === playerId);
  const turnPlayer = getCurrentPlayer(room);
  if (!actor || turnPlayer.id !== actor.id) throw new Error("Ce n'est pas votre tour.");

  const card = removeCardFromHand(actor, cardId);
  const target = room.players.find((p) => p.id === targetPlayerId) ?? getOpponent(room, actor.id);
  if (!target) throw new Error("Aucune cible.");

  const canBluff = facedown && actor.bluffUsesLeft > 0;
  if (facedown && !canBluff) throw new Error("Bluff indisponible.");

  if (canBluff) {
    actor.bluffUsesLeft -= 1;
    room.pendingAttack = {
      id: uid("attack"),
      attackerId: actor.id,
      targetId: target.id,
      card,
      facedown: true,
      declaredType: "hidden"
    };

    room.log.push({
      at: Date.now(),
      type: "attack_declared",
      message: `${actor.name} joue une carte face cachée contre ${target.name}.`
    });
    return room;
  }

  if (card.type === "mana") {
    actor.mana += card.mana;
    actor.discard.push(card);
    room.log.push({ at: Date.now(), type: "mana", message: `${actor.name} gagne ${card.mana} mana.` });
    return room;
  }

  if (card.type === "attack") {
    room.pendingAttack = {
      id: uid("attack"),
      attackerId: actor.id,
      targetId: target.id,
      card,
      facedown: false,
      declaredType: "attack"
    };

    room.log.push({
      at: Date.now(),
      type: "attack_declared",
      message: `${actor.name} attaque ${target.name} (${card.stat}).`
    });
    return room;
  }

  if (card.type === "utility") {
    if (card.utility === "critical") {
      actor.status.nextCritical = true;
      room.log.push({ at: Date.now(), type: "buff", message: `${actor.name} prépare un coup critique.` });
    } else if (card.utility === "move") {
      actor.position += card.value;
      room.log.push({ at: Date.now(), type: "move", message: `${actor.name} avance de ${card.value} cases.` });
    } else if (card.utility === "vision") {
      room.log.push({ at: Date.now(), type: "vision", message: `${actor.name} utilise Vision.` });
    } else if (card.utility === "steal") {
      if (target.hand.length) {
        const stolen = target.hand.pop();
        actor.hand.push(stolen);
        room.log.push({ at: Date.now(), type: "steal", message: `${actor.name} vole une carte à ${target.name}.` });
      }
    }
    actor.discard.push(card);
    return room;
  }

  if (card.type === "skill") {
    if (actor.usedUltimate) throw new Error("Ultime déjà utilisée.");
    if (actor.mana < 5) throw new Error("Mana insuffisant.");
    actor.mana -= 5;
    actor.usedUltimate = true;
    actor.status.counterImmune = true;
    actor.discard.push(card);
    room.log.push({ at: Date.now(), type: "ultimate", message: `${actor.name} active son ultime.` });
    return room;
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

  if (attack.card.type !== "attack") {
    attacker.discard.push(attack.card);
    if (defenseCard) defender.discard.push(defenseCard);
    room.pendingAttack = null;
    room.log.push({
      at: Date.now(),
      type: "bluff_resolved",
      message: `${attacker.name} bluffait avec une carte ${attack.card.type}. Aucun dégât infligé.`
    });
    return room;
  }

  const attackRoll = rollDie() + attack.card.rollMod;
  const statBonus = attacker.stats[attack.card.stat] ?? 0;
  let damage = attack.card.baseDamage + statBonus + attackRoll;

  if (attack.card.range === "proximity") damage += 2;
  if (attacker.status.nextCritical) {
    damage *= 2;
    attacker.status.nextCritical = false;
  }

  if (defenseCard?.defense === "block") {
    damage = Math.max(0, damage - defenseCard.value);
  }
  if (defenseCard?.defense === "dodge") {
    damage = 0;
  }
  if (defenseCard?.defense === "counter" && !attacker.status.counterImmune) {
    const counterDamage = 4 + rollDie();
    attacker.hp = Math.max(0, attacker.hp - counterDamage);
    room.log.push({ at: Date.now(), type: "counter", message: `${defender.name} contre: ${counterDamage} dégâts.` });
  }

  defender.hp = Math.max(0, defender.hp - damage);

  attacker.discard.push(attack.card);
  if (defenseCard) defender.discard.push(defenseCard);

  room.log.push({
    at: Date.now(),
    type: "attack_resolved",
    message: `${attacker.name} inflige ${damage} dégâts à ${defender.name}.`
  });

  room.pendingAttack = null;
  if (defender.hp <= 0 || attacker.hp <= 0) {
    room.phase = "finished";
    const winner = attacker.hp > 0 ? attacker.name : defender.name;
    room.log.push({ at: Date.now(), type: "game_finished", message: `${winner} remporte le combat.` });
  }

  return room;
}

export function guessBluff(code, defenderId, guess) {
  const room = rooms.get(code);
  const attack = room?.pendingAttack;
  if (!room || !attack || !attack.facedown) throw new Error("Aucun bluff en attente.");
  if (attack.targetId !== defenderId) throw new Error("Pas votre décision.");

  const isAttack = attack.card.type === "attack";
  const guessedRight = (guess === "attack" && isAttack) || (guess === "other" && !isAttack);

  room.log.push({
    at: Date.now(),
    type: "bluff_guess",
    message: guessedRight ? "Bluff deviné correctement." : "Mauvaise lecture du bluff."
  });

  return { room, guessedRight };
}

export function mulligan(code, playerId, cardIds = []) {
  const room = rooms.get(code);
  if (!room) throw new Error("Room introuvable.");

  const player = room.players.find((p) => p.id === playerId);
  const current = getCurrentPlayer(room);
  if (!player || current.id !== player.id) throw new Error("Action invalide.");
  if (player.mulliganUsedTurn) throw new Error("Mulligan déjà utilisé ce tour.");

  const selected = new Set(cardIds);
  const kept = [];
  const discarded = [];

  for (const c of player.hand) {
    if (selected.has(c.id)) discarded.push(c);
    else kept.push(c);
  }

  player.hand = kept;
  player.discard.push(...discarded);
  draw(player, discarded.length);
  player.mulliganUsedTurn = true;

  room.log.push({
    at: Date.now(),
    type: "mulligan",
    message: `${player.name} défausse ${discarded.length} carte(s) puis repioche.`
  });

  return room;
}

export function endTurn(code, playerId) {
  const room = rooms.get(code);
  if (!room) throw new Error("Room introuvable.");

  const current = getCurrentPlayer(room);
  if (current.id !== playerId) throw new Error("Ce n'est pas votre tour.");

  const sagRoll = rollDie();
  const sagSuccess = sagRoll + current.stats.SAG >= 7;
  draw(current, sagSuccess ? 2 : 1);
  current.mulliganUsedTurn = false;

  room.turnIndex = (room.turnIndex + 1) % room.players.length;
  room.log.push({
    at: Date.now(),
    type: "turn_end",
    message: `${current.name} termine son tour (${sagSuccess ? "+1 pioche SAG" : "pioche normale"}).`
  });

  return room;
}

export function getVisibleState(room, playerId) {
  return {
    code: room.code,
    phase: room.phase,
    turnPlayerId: room.players[room.turnIndex % room.players.length]?.id,
    pendingAttack: room.pendingAttack
      ? {
          id: room.pendingAttack.id,
          attackerId: room.pendingAttack.attackerId,
          targetId: room.pendingAttack.targetId,
          facedown: room.pendingAttack.facedown,
          card: room.pendingAttack.facedown && room.pendingAttack.targetId !== playerId
            ? { id: "hidden", type: "unknown" }
            : room.pendingAttack.card
        }
      : null,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      hp: p.hp,
      mana: p.mana,
      position: p.position,
      handCount: p.hand.length,
      hand: p.id === playerId ? p.hand : undefined,
      bluffUsesLeft: p.id === playerId ? p.bluffUsesLeft : undefined,
      usedUltimate: p.usedUltimate,
      stats: p.stats
    })),
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
