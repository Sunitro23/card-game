import { ATTACKS, STARTING_HP } from "../core/constants.js";
import { rooms } from "../core/state.js";
import { rollDie } from "../core/random.js";
import { addToHandRespectingLimits, createDeck, drawRaw, getCurrentPlayer, getOpponent, removeCardFromHand, spendEnergy, startTurn } from "../core/players.js";

export function startCardDuelGame(room) {
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

  room.log.push({ at: Date.now(), type: "game_started", message: "Combat lancÃ©. Chaque joueur pioche 1 carte." });
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

