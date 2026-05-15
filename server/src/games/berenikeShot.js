import { rooms } from "../core/state.js";
import { shuffle, uid } from "../core/random.js";

export const BERENIKE_ITEMS = [
  { type: "glass_eye", name: "Oeil de Verre", icon: "◉", desc: "Regarde la prochaine balle." },
  { type: "pliers", name: "Pince", icon: "⌘", desc: "Retire la prochaine balle." },
  { type: "estus", name: "Estus", icon: "✚", desc: "Récupère 1 PV." },
  { type: "black_powder", name: "Poudre Noire", icon: "■", desc: "La prochaine balle réelle inflige 2 dégâts." },
  { type: "chains", name: "Chaines", icon: "⛓", desc: "Un participant saute son prochain tour." },
  { type: "skeleton_key", name: "Passe-partout", icon: "⚿", desc: "Vole et utilise un consommable visible." },
  { type: "magic_orb", name: "Boule Magique", icon: "●", desc: "Révèle une balle future." },
  { type: "soup", name: "Potage Suspicieux", icon: "◒", desc: "50%: +2 PV. Sinon: -1 PV." },
  { type: "trick_coin", name: "Pièce Truquée", icon: "₽", desc: "Inverse la prochaine balle." }
];

const ITEM_BY_TYPE = Object.fromEntries(BERENIKE_ITEMS.map((item) => [item.type, item]));
const MAX_ITEMS = 8;

function cycleConfig(activeCount) {
  if (activeCount <= 2) return { maxHp: 4, itemsPerCycle: 2, minReserve: 3, maxReserve: 5 };
  if (activeCount <= 4) return { maxHp: 3, itemsPerCycle: 2, minReserve: 4, maxReserve: 6 };
  if (activeCount <= 6) return { maxHp: 3, itemsPerCycle: 2, minReserve: 5, maxReserve: 7 };
  return { maxHp: 2, itemsPerCycle: 1, minReserve: 6, maxReserve: 8 };
}

function activePlayers(room) {
  return room.players.filter((player) => player.berenike?.active);
}

function currentPlayer(room) {
  return room.players[room.turnIndex % room.players.length];
}

function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function makeItem() {
  const template = BERENIKE_ITEMS[Math.floor(Math.random() * BERENIKE_ITEMS.length)];
  return { id: uid("item"), ...template };
}

function makeReserve(activeCount, fixedDeathmatch = false) {
  if (fixedDeathmatch) return shuffle([{ id: uid("bullet"), type: "real" }, { id: uid("bullet"), type: "blank" }]);

  const config = cycleConfig(activeCount);
  const size = randomInt(config.minReserve, config.maxReserve);
  const realCount = randomInt(1, size - 1);
  const bullets = [
    ...Array.from({ length: realCount }, () => ({ id: uid("bullet"), type: "real" })),
    ...Array.from({ length: size - realCount }, () => ({ id: uid("bullet"), type: "blank" }))
  ];
  return shuffle(bullets);
}

function reserveCounts(reserve) {
  return {
    real: reserve.filter((bullet) => bullet.type === "real").length,
    blank: reserve.filter((bullet) => bullet.type === "blank").length
  };
}

function publicCycleMessage(room) {
  const counts = reserveCounts(room.berenike.reserve);
  return `Cycle ${room.berenike.cycle}: ${counts.real} balle(s) réelle(s), ${counts.blank} factice(s).`;
}

function drawItemsForCycle(room) {
  const active = activePlayers(room);
  const config = room.berenike.deathmatch ? { itemsPerCycle: 0 } : cycleConfig(active.length);

  for (const player of active) {
    for (let i = 0; i < config.itemsPerCycle; i += 1) {
      if (player.berenike.inventory.length < MAX_ITEMS) player.berenike.inventory.push(makeItem());
    }
  }
}

function beginCycle(room, { fixedDeathmatch = false } = {}) {
  const activeCount = activePlayers(room).length;
  room.berenike.cycle += 1;
  room.berenike.reserve = makeReserve(activeCount, fixedDeathmatch);
  room.berenike.publicCounts = reserveCounts(room.berenike.reserve);
  for (const player of room.players) {
    if (player.berenike) player.berenike.secrets = {};
  }
  drawItemsForCycle(room);
  room.log.push({ at: Date.now(), type: "berenike_cycle", message: publicCycleMessage(room) });
}

function syncPublicCounts(room) {
  room.berenike.publicCounts = reserveCounts(room.berenike.reserve);
}

function clearCurrentBulletSecrets(room) {
  for (const player of room.players) {
    if (player.berenike?.secrets?.nextBullet) player.berenike.secrets.nextBullet = null;
  }
}

function aliveCheck(room, touchedPlayers) {
  const eliminated = [];
  for (const player of touchedPlayers) {
    if (player.berenike?.active && player.berenike.hp <= 0) {
      player.berenike.hp = 0;
      player.berenike.active = false;
      player.berenike.inventory = [];
      player.berenike.skipped = false;
      player.berenike.powderArmed = false;
      eliminated.push(player);
      room.log.push({ at: Date.now(), type: "berenike_eliminated", message: `${player.name} est éliminé.` });
    }
  }

  const active = activePlayers(room);
  if (active.length === 1) {
    room.phase = "finished";
    room.berenike.winnerId = active[0].id;
    room.log.push({ at: Date.now(), type: "game_finished", message: `${active[0].name} remporte Berenike Shot.` });
    return eliminated;
  }

  if (active.length === 0 && eliminated.length > 1) {
    startDeathmatch(room, eliminated);
  }

  return eliminated;
}

function nextTurn(room, { samePlayer = false } = {}) {
  if (room.phase === "finished") return;
  if (!activePlayers(room).length) return;

  if (!samePlayer) room.turnIndex += 1;

  let guard = 0;
  while (guard < room.players.length * 2) {
    const player = currentPlayer(room);
    if (player?.berenike?.active) {
      if (player.berenike.skipped) {
        player.berenike.skipped = false;
        room.log.push({ at: Date.now(), type: "berenike_skip", message: `${player.name} saute son tour.` });
        room.turnIndex += 1;
        guard += 1;
        continue;
      }
      room.log.push({ at: Date.now(), type: "turn_started", message: `Tour de ${player.name}.` });
      return;
    }
    room.turnIndex += 1;
    guard += 1;
  }
}

function ensureCycleIfEmpty(room) {
  if (room.phase === "finished") return;
  if (activePlayers(room).length <= 1) {
    aliveCheck(room, []);
    return;
  }
  if (room.berenike.reserve.length === 0) beginCycle(room);
}

function startDeathmatch(room, participants) {
  room.berenike.deathmatch = true;
  for (const player of room.players) {
    if (participants.some((participant) => participant.id === player.id)) {
      player.berenike.active = true;
      player.berenike.hp = 1;
      player.berenike.maxHp = 1;
      player.berenike.inventory = [];
      player.berenike.skipped = false;
      player.berenike.powderArmed = false;
    }
  }
  room.turnIndex = Math.max(0, room.players.findIndex((player) => player.berenike?.active));
  room.log.push({ at: Date.now(), type: "berenike_deathmatch", message: "Égalité mortelle: les derniers participants reviennent à 1 PV." });
  beginCycle(room, { fixedDeathmatch: true });
  nextTurn(room, { samePlayer: true });
}

function removeInventoryItem(player, itemId) {
  const index = player.berenike.inventory.findIndex((item) => item.id === itemId);
  if (index < 0) throw new Error("Consommable introuvable.");
  return player.berenike.inventory.splice(index, 1)[0];
}

function findActiveTarget(room, targetPlayerId) {
  const target = room.players.find((player) => player.id === targetPlayerId);
  if (!target?.berenike?.active) throw new Error("Cible invalide.");
  return target;
}

function applyItem(room, actor, item, payload = {}, { stolen = false } = {}) {
  const label = stolen ? `${actor.name} utilise le ${item.name} volé` : `${actor.name} utilise ${item.name}`;

  if (item.type === "glass_eye") {
    const next = room.berenike.reserve[0];
    actor.berenike.secrets.nextBullet = next?.type ?? null;
    room.log.push({ at: Date.now(), type: "berenike_item", message: `${label}.` });
    return;
  }

  if (item.type === "pliers") {
    const removed = room.berenike.reserve.shift();
    clearCurrentBulletSecrets(room);
    syncPublicCounts(room);
    room.log.push({ at: Date.now(), type: "berenike_item", message: removed ? `${label} et retire la prochaine balle.` : `${label}, mais la réserve est vide.` });
    ensureCycleIfEmpty(room);
    return;
  }

  if (item.type === "estus") {
    actor.berenike.hp = Math.min(actor.berenike.maxHp, actor.berenike.hp + 1);
    room.log.push({ at: Date.now(), type: "berenike_item", message: `${label} et récupère 1 PV.` });
    return;
  }

  if (item.type === "black_powder") {
    if (actor.berenike.powderArmed) {
      actor.berenike.inventory.push(item);
      throw new Error("Poudre Noire est déjà active.");
    }
    actor.berenike.powderArmed = true;
    room.log.push({ at: Date.now(), type: "berenike_item", message: `${label}. La prochaine balle réelle appliquée fera 2 dégâts.` });
    return;
  }

  if (item.type === "chains") {
    const target = findActiveTarget(room, payload.targetPlayerId);
    if (target.berenike.skipped) {
      actor.berenike.inventory.push(item);
      throw new Error("Ce participant est déjà entravé.");
    }
    target.berenike.skipped = true;
    room.log.push({ at: Date.now(), type: "berenike_item", message: `${label} sur ${target.name}.` });
    return;
  }

  if (item.type === "magic_orb") {
    if (room.berenike.reserve.length <= 1) {
      actor.berenike.inventory.push(item);
      throw new Error("Boule Magique ne fonctionne pas s'il ne reste qu'une balle.");
    }
    const index = randomInt(1, room.berenike.reserve.length - 1);
    actor.berenike.secrets.futureBullet = { position: index + 1, type: room.berenike.reserve[index].type };
    room.log.push({ at: Date.now(), type: "berenike_item", message: `${label}.` });
    return;
  }

  if (item.type === "soup") {
    const heals = Math.random() < 0.5;
    if (heals) {
      actor.berenike.hp = Math.min(actor.berenike.maxHp, actor.berenike.hp + 2);
      room.log.push({ at: Date.now(), type: "berenike_item", message: `${label}: le potage soigne 2 PV.` });
    } else {
      actor.berenike.hp -= 1;
      room.log.push({ at: Date.now(), type: "berenike_item", message: `${label}: le potage mord et inflige 1 dégât.` });
      aliveCheck(room, [actor]);
    }
    return;
  }

  if (item.type === "trick_coin") {
    const next = room.berenike.reserve[0];
    if (!next) {
      actor.berenike.inventory.push(item);
      throw new Error("Aucune balle à transformer.");
    }
    next.type = next.type === "real" ? "blank" : "real";
    clearCurrentBulletSecrets(room);
    room.log.push({ at: Date.now(), type: "berenike_item", message: `${label}. La prochaine balle est transformée.` });
    return;
  }

  if (item.type === "skeleton_key") {
    const target = findActiveTarget(room, payload.targetPlayerId);
    if (target.id === actor.id) {
      actor.berenike.inventory.push(item);
      throw new Error("Passe-partout doit cibler un autre participant.");
    }
    const stolenItem = removeInventoryItem(target, payload.stolenItemId);
    if (stolenItem.type === "skeleton_key") {
      target.berenike.inventory.push(stolenItem);
      actor.berenike.inventory.push(item);
      throw new Error("Passe-partout ne peut pas voler un autre Passe-partout.");
    }
    room.log.push({ at: Date.now(), type: "berenike_item", message: `${actor.name} vole ${stolenItem.name} à ${target.name}.` });
    applyItem(room, actor, stolenItem, { ...payload, targetPlayerId: payload.secondaryTargetPlayerId }, { stolen: true });
  }
}

export function startBerenikeShotGame(room) {
  room.phase = "berenike_shot";
  room.pendingAttack = null;
  room.berenike = {
    cycle: 0,
    reserve: [],
    publicCounts: { real: 0, blank: 0 },
    lastShot: null,
    winnerId: null,
    deathmatch: false
  };

  const config = cycleConfig(room.players.length);
  room.players = shuffle(room.players);
  room.players.forEach((player, index) => {
    player.position = index;
    player.hp = config.maxHp;
    player.hand = [];
    player.berenike = {
      active: true,
      hp: config.maxHp,
      maxHp: config.maxHp,
      inventory: [],
      skipped: false,
      powderArmed: false,
      secrets: {}
    };
  });

  room.turnIndex = 0;
  room.log.push({ at: Date.now(), type: "game_started", message: "Berenike Shot commence. L'ordre de jeu est mélangé." });
  beginCycle(room);
  nextTurn(room, { samePlayer: true });
  return room;
}

export function shootBerenikeShot(code, playerId, targetPlayerId) {
  const room = rooms.get(code);
  if (!room) throw new Error("Room introuvable.");
  if (room.phase !== "berenike_shot") throw new Error("Berenike Shot n'est pas en cours.");

  const actor = room.players.find((player) => player.id === playerId);
  if (!actor?.berenike?.active || currentPlayer(room)?.id !== actor.id) throw new Error("Ce n'est pas votre tour.");
  const target = findActiveTarget(room, targetPlayerId);
  const bullet = room.berenike.reserve.shift();
  if (!bullet) throw new Error("La réserve est vide.");

  clearCurrentBulletSecrets(room);
  syncPublicCounts(room);

  const selfTarget = target.id === actor.id;
  let damage = 0;
  if (bullet.type === "real") {
    damage = actor.berenike.powderArmed ? 2 : 1;
    target.berenike.hp -= damage;
    actor.berenike.powderArmed = false;
  }

  room.berenike.lastShot = {
    id: uid("shot"),
    shooterId: actor.id,
    targetId: target.id,
    bulletType: bullet.type,
    damage
  };

  if (bullet.type === "real") {
    room.log.push({ at: Date.now(), type: "berenike_shot", message: `${actor.name} tire sur ${selfTarget ? "lui-même" : target.name}: balle réelle, ${damage} dégât(s).` });
  } else {
    room.log.push({ at: Date.now(), type: "berenike_shot", message: `${actor.name} tire sur ${selfTarget ? "lui-même" : target.name}: balle factice.` });
  }

  aliveCheck(room, [target]);
  ensureCycleIfEmpty(room);

  if (room.phase !== "finished") {
    nextTurn(room, { samePlayer: selfTarget && bullet.type === "blank" && actor.berenike.active });
  }

  return room;
}

export function useBerenikeItem(code, playerId, payload) {
  const room = rooms.get(code);
  if (!room) throw new Error("Room introuvable.");
  if (room.phase !== "berenike_shot") throw new Error("Berenike Shot n'est pas en cours.");

  const actor = room.players.find((player) => player.id === playerId);
  if (!actor?.berenike?.active || currentPlayer(room)?.id !== actor.id) throw new Error("Ce n'est pas votre tour.");
  const item = removeInventoryItem(actor, payload.itemId);
  applyItem(room, actor, item, payload);
  return room;
}

export function visibleBerenikeState(room, playerId) {
  if (!room.berenike) return null;
  return {
    cycle: room.berenike.cycle,
    reserveCount: room.berenike.reserve.length,
    publicCounts: room.berenike.publicCounts,
    lastShot: room.berenike.lastShot,
    deathmatch: room.berenike.deathmatch,
    winnerId: room.berenike.winnerId,
    maxItems: MAX_ITEMS,
    items: BERENIKE_ITEMS,
    secret: playerId
      ? room.players.find((player) => player.id === playerId)?.berenike?.secrets ?? {}
      : {}
  };
}

export function visibleBerenikePlayer(player, viewerId) {
  if (!player.berenike) return null;
  return {
    active: player.berenike.active,
    hp: player.berenike.hp,
    maxHp: player.berenike.maxHp,
    inventoryCount: player.berenike.inventory.length,
    inventory: player.berenike.active ? player.berenike.inventory : [],
    skipped: player.berenike.skipped,
    powderArmed: player.berenike.powderArmed,
    isViewer: player.id === viewerId
  };
}
