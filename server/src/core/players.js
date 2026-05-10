import { ENERGY_PER_TURN, MAX_DEFENSE_IN_HAND, MAX_ENERGY, MAX_HAND_SIZE, STARTING_HP } from "./constants.js";
import { shuffle, uid } from "./random.js";

export function createDeck() {
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

  return shuffle(cards);
}

export function makePlayer(socketId, name, position) {
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

export function drawRaw(player, count = 1) {
  const drawn = [];
  for (let i = 0; i < count; i += 1) {
    if (!player.deck.length) {
      player.deck = shuffle(player.discard);
      player.discard = [];
      if (!player.deck.length) break;
    }
    const card = player.deck.pop();
    drawn.push(card);
  }
  return drawn;
}

export function addToHandRespectingLimits(room, player, cards) {
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
        player.deck = shuffle(player.deck);
      }
      return candidate;
    }

    skipped.push(candidate);
  }

  if (skipped.length) {
    player.deck.push(...skipped);
    player.deck = shuffle(player.deck);
  }

  return null;
}

export function getCurrentPlayer(room) {
  return room.players[room.turnIndex % room.players.length];
}

export function getOpponent(room, playerId) {
  return room.players.find((p) => p.id !== playerId);
}

export function removeCardFromHand(player, cardId) {
  const idx = player.hand.findIndex((c) => c.id === cardId);
  if (idx < 0) throw new Error("Carte absente de la main.");
  return player.hand.splice(idx, 1)[0];
}

export function spendEnergy(player, amount = 1) {
  if (player.energy < amount) throw new Error("Énergie insuffisante.");
  player.energy -= amount;
}

export function startTurn(room) {
  const current = getCurrentPlayer(room);
  current.energy = Math.min(MAX_ENERGY, current.energy + ENERGY_PER_TURN);
  current.status.visionActive = false;
  room.log.push({
    at: Date.now(),
    type: "turn_started",
    message: `Tour de ${current.name} (+${ENERGY_PER_TURN} énergie, total ${current.energy}/${MAX_ENERGY}).`
  });
}
