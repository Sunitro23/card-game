import { TWENTY_ONE_MAX_TRUMPS, TWENTY_ONE_STARTING_BET, TWENTY_ONE_STARTING_LIVES, TWENTY_ONE_STARTING_TARGET, TWENTY_ONE_TRUMPS_PER_ROUND } from "../core/constants.js";
import { rooms } from "../core/state.js";
import { shuffle, uid } from "../core/random.js";
import { getOpponent, removeCardFromHand } from "../core/players.js";

export function startTwentyOneGame(room) {
  room.phase = "twenty_one";
  room.twentyOne = {
    round: 1,
    target: TWENTY_ONE_STARTING_TARGET,
    bet: TWENTY_ONE_STARTING_BET,
    numberDeck: createTwentyOneNumberDeck(),
    trumpDeck: createTwentyOneTrumpDeck(),
    startingTurnIndex: room.turnIndex,
    winnerId: null,
    lastRoundResult: null,
    standStreak: 0,
    lastStandPlayerId: null
  };
  room.players.forEach((p) => {
    p.hp = p.twentyOne?.lives ?? TWENTY_ONE_STARTING_LIVES;
    p.energy = 0;
    p.hand = [];
    p.deck = [];
    p.discard = [];
    p.twentyOne = twentyOnePlayerState();
    drawTwentyOneNumber(room, p, { hidden: true });
    drawTwentyOneNumber(room, p);
    drawTwentyOneTrump(room, p, TWENTY_ONE_TRUMPS_PER_ROUND);
  });
  room.log.push({ at: Date.now(), type: "game_started", message: "Twenty One lancé. Cible 21, mise 1. Chaque joueur commence avec 1 carte cachée et 1 carte visible." });
  return room;
}

export function abortTwentyOneGame(room, quitterSide, winnerSide) {
  room.phase = "finished";
  room.twentyOne.winnerId = room.players[winnerSide].id;
  room.log.push({
    at: Date.now(),
    type: "game_finished",
    message: `${room.players[quitterSide].name} abandonne. ${room.players[winnerSide].name} remporte Twenty One.`
  });
  return room;
}

const TWENTY_ONE_TRUMP_DEFS = [
  ...[2, 3, 4, 5, 6, 7].map((value) => ({ type: "trump", trumpType: "add_number", value, name: `Carte ${value}` })),
  { type: "trump", trumpType: "go_for", target: 17, name: "Cible 17" },
  { type: "trump", trumpType: "go_for", target: 24, name: "Cible 24" },
  { type: "trump", trumpType: "go_for", target: 27, name: "Cible 27" },
  { type: "trump", trumpType: "bet", action: "one_up", name: "Mise +1" },
  { type: "trump", trumpType: "bet", action: "shield", name: "Bouclier" },
  { type: "trump", trumpType: "bet", action: "bless", name: "Grâce" },
  { type: "trump", trumpType: "bet", action: "bloodshed", name: "Saignée" },
  { type: "trump", trumpType: "bet", action: "destroy", name: "Briser" },
  { type: "trump", trumpType: "bet", action: "friendship", name: "Alliance" },
  { type: "trump", trumpType: "bet", action: "reincarnation", name: "Renaissance" },
  { type: "trump", trumpType: "deck", action: "hush", name: "Silence" },
  { type: "trump", trumpType: "deck", action: "perfect_draw", name: "Pioche sûre" },
  { type: "trump", trumpType: "deck", action: "refresh", name: "Relance" },
  { type: "trump", trumpType: "deck", action: "remove", name: "Retrait" },
  { type: "trump", trumpType: "deck", action: "return", name: "Retour" },
  { type: "trump", trumpType: "deck", action: "exchange", name: "Échange" },
  { type: "trump", trumpType: "deck", action: "disservice", name: "Fardeau" }
];

function createTwentyOneNumberDeck() {
  const cards = [];
  cards.push({ id: uid("num"), value: 1, rank: "A", hidden: false });
  for (let value = 2; value <= 10; value += 1) cards.push({ id: uid("num"), value, rank: String(value), hidden: false });
  return shuffle(cards);
}

function createTwentyOneTrumpDeck() {
  const cards = [];
  for (let copy = 0; copy < 2; copy += 1) {
    for (const def of TWENTY_ONE_TRUMP_DEFS) cards.push({ id: uid("trump"), ...def });
  }
  return shuffle(cards);
}

function twentyOnePlayerState() {
  return { lives: TWENTY_ONE_STARTING_LIVES, cards: [], stood: false, manualStand: false, autoBust: false, lastTrump: null, bless: false, hasPlayedCardThisRound: false };
}

export function twentyOneTotal(player) {
  return twentyOneTotalForTarget(player, TWENTY_ONE_STARTING_TARGET);
}

export function twentyOneTotalForTarget(player, target) {
  let total = 0;
  let aces = 0;
  for (const card of player.twentyOne.cards) {
    if (card.value === 1) {
      aces += 1;
      total += 1;
    } else {
      total += card.value;
    }
  }

  while (aces > 0 && total + 10 <= target) {
    total += 10;
    aces -= 1;
  }

  return total;
}

function isTwentyOneBust(player, target) {
  return false;
}

function refreshTwentyOneBustState(player, target) {
  player.twentyOne.autoBust = false;
}

function drawTwentyOneTrump(room, player, count = 1) {
  const drawn = [];
  for (let i = 0; i < count; i += 1) {
    if (player.hand.length >= TWENTY_ONE_MAX_TRUMPS) break;
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
    const target = room.twentyOne.target;
    let bestTotal = -1;
    room.twentyOne.numberDeck.forEach((card, cardIndex) => {
      const candidate = {
        ...player,
        twentyOne: {
          ...player.twentyOne,
          cards: [...player.twentyOne.cards, card]
        }
      };
      const candidateTotal = twentyOneTotalForTarget(candidate, target);
      if (candidateTotal <= target && candidateTotal > bestTotal) {
        bestTotal = candidateTotal;
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
  room.twentyOne.numberDeck.push(...cards.map((card) => ({ id: card.id, value: card.value, rank: card.rank, hidden: false })));
  room.twentyOne.numberDeck = shuffle(room.twentyOne.numberDeck);
}

function resetTwentyOneRound(room) {
  room.twentyOne.round += 1;
  room.twentyOne.target = TWENTY_ONE_STARTING_TARGET;
  room.twentyOne.bet = TWENTY_ONE_STARTING_BET;
  room.twentyOne.numberDeck = createTwentyOneNumberDeck();
  room.twentyOne.standStreak = 0;
  room.twentyOne.lastStandPlayerId = null;
  room.twentyOne.startingTurnIndex = (room.twentyOne.startingTurnIndex + 1) % room.players.length;
  room.turnIndex = room.twentyOne.startingTurnIndex;
  for (const player of room.players) {
    player.twentyOne.cards = [];
    player.twentyOne.stood = false;
    player.twentyOne.manualStand = false;
    player.twentyOne.autoBust = false;
    player.twentyOne.lastTrump = null;
    player.twentyOne.bless = false;
    player.twentyOne.hasPlayedCardThisRound = false;
    drawTwentyOneNumber(room, player, { hidden: true });
    drawTwentyOneNumber(room, player);
    drawTwentyOneTrump(room, player, TWENTY_ONE_TRUMPS_PER_ROUND);
  }
}

function getTwentyOneTurnPlayer(room) {
  return room.players[room.turnIndex % room.players.length];
}

function ensureTwentyOneTurn(room, player) {
  if (getTwentyOneTurnPlayer(room)?.id !== player.id) throw new Error("Ce n'est pas votre tour.");
}

function passTwentyOneTurn(room, player) {
  const currentIndex = room.players.findIndex((p) => p.id === player.id);
  const nextIndex = room.players.findIndex((p, index) => index !== currentIndex);
  if (nextIndex >= 0) {
    room.turnIndex = nextIndex;
    room.players[nextIndex].twentyOne.hasDrawnThisTurn = false;
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
  const total = twentyOneTotalForTarget(player, target);
  return { total, distance: Math.abs(target - total), busted: total > target };
}

function setTwentyOneRoundResult(room, result) {
  room.twentyOne.lastRoundResult = {
    id: uid("round"),
    round: room.twentyOne.round,
    target: room.twentyOne.target,
    ...result
  };
}

function resolveTwentyOneRound(room) {
  const [a, b] = room.players;
  const noPlayerActed = room.players.every((player) => !player.twentyOne.hasPlayedCardThisRound);

  if (noPlayerActed) {
    setTwentyOneRoundResult(room, {
      winnerId: null,
      loserId: null,
      damage: 0,
      scores: {
        [a.id]: twentyOneTotalForTarget(a, room.twentyOne.target),
        [b.id]: twentyOneTotalForTarget(b, room.twentyOne.target)
      },
      tie: true,
      gameOver: false
    });
    room.log.push({ at: Date.now(), type: "twenty_one_round_passed", message: `Manche ${room.twentyOne.round} terminée : les deux joueurs restent sans jouer de carte. Personne ne perd de vie.` });
    resetTwentyOneRound(room);
    room.log.push({ at: Date.now(), type: "twenty_one_round_start", message: `Manche ${room.twentyOne.round} lancée. Cible 21, mise 1.` });
    return;
  }

  const scoreA = scoreTwentyOnePlayer(a, room.twentyOne.target);
  const scoreB = scoreTwentyOnePlayer(b, room.twentyOne.target);
  let loser = null;

  if (scoreA.busted && !scoreB.busted) loser = a;
  else if (scoreB.busted && !scoreA.busted) loser = b;
  else if (scoreA.distance < scoreB.distance) loser = b;
  else if (scoreB.distance < scoreA.distance) loser = a;

  if (!loser) {
    setTwentyOneRoundResult(room, {
      winnerId: null,
      loserId: null,
      damage: 0,
      scores: {
        [a.id]: scoreA.total,
        [b.id]: scoreB.total
      },
      tie: true,
      gameOver: false
    });
    room.log.push({ at: Date.now(), type: "twenty_one_round_tie", message: `Manche ${room.twentyOne.round} nulle : ${a.name} ${scoreA.total}, ${b.name} ${scoreB.total}, cible ${room.twentyOne.target}.` });
    resetTwentyOneRound(room);
    room.log.push({ at: Date.now(), type: "twenty_one_round_start", message: `Manche ${room.twentyOne.round} lancée. Cible 21, mise 1.` });
    return;
  }

  const winner = loser.id === a.id ? b : a;
  const damage = room.twentyOne.bet;
  if (loser.twentyOne.lives - damage <= 0 && loser.twentyOne.bless) {
    loser.twentyOne.bless = false;
    loser.twentyOne.lives = 1;
    room.log.push({ at: Date.now(), type: "twenty_one_bless", message: `${loser.name} est sauvé par Grâce et reste à 1 vie.` });
  } else {
    loser.twentyOne.lives = Math.max(0, loser.twentyOne.lives - damage);
  }

  setTwentyOneRoundResult(room, {
    winnerId: winner.id,
    loserId: loser.id,
    damage,
    scores: {
      [winner.id]: scoreTwentyOnePlayer(winner, room.twentyOne.target).total,
      [loser.id]: scoreTwentyOnePlayer(loser, room.twentyOne.target).total
    },
    tie: false,
    gameOver: loser.twentyOne.lives <= 0
  });

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
  room.log.push({ at: Date.now(), type: "twenty_one_round_start", message: `Manche ${room.twentyOne.round} lancée. Cible 21, mise 1.` });
}

function checkTwentyOneRoundResolution(room) {
  if (room.phase !== "twenty_one") return false;
  if (room.twentyOne.standStreak < room.players.length) return false;
  resolveTwentyOneRound(room);
  return true;
}

export function drawTwentyOneNumberCard(code, playerId) {
  const room = rooms.get(code);
  if (!room) throw new Error("Room introuvable.");
  if (room.phase !== "twenty_one") throw new Error("Twenty One n'est pas en cours.");

  const actor = room.players.find((p) => p.id === playerId);
  if (!actor) throw new Error("Joueur introuvable.");
  ensureTwentyOneTurn(room, actor);
  if (actor.twentyOne.autoBust || isTwentyOneBust(actor, room.twentyOne.target)) throw new Error("Vous êtes Bust : jouez une carte spéciale ou cliquez Rester.");
  if (actor.twentyOne.hasDrawnThisTurn) throw new Error("Vous avez déjà pioché pendant ce tour.");

  const card = drawTwentyOneNumber(room, actor);
  if (!card) throw new Error("Deck vide.");
  actor.twentyOne.hasPlayedCardThisRound = true;
  room.log.push({ at: Date.now(), type: "twenty_one_draw", message: `${actor.name} pioche une carte.` });

  refreshTwentyOneBustState(actor, room.twentyOne.target);
  passTwentyOneTurn(room, actor);
  checkTwentyOneRoundResolution(room);
  return room;
}

export function drawTwentyOneTrumpCard(code, playerId) {
  const room = rooms.get(code);
  if (!room) throw new Error("Room introuvable.");
  if (room.phase !== "twenty_one") throw new Error("Twenty One n'est pas en cours.");
  if (!room.players.some((p) => p.id === playerId)) throw new Error("Joueur introuvable.");
  throw new Error("Les cartes spéciales ne sont pas piochables manuellement : +3 par manche, 6 en main maximum.");
}

export function standTwentyOne(code, playerId) {
  const room = rooms.get(code);
  if (!room) throw new Error("Room introuvable.");
  if (room.phase !== "twenty_one") throw new Error("Twenty One n'est pas en cours.");

  const actor = room.players.find((p) => p.id === playerId);
  if (!actor) throw new Error("Joueur introuvable.");
  ensureTwentyOneTurn(room, actor);
  recordTwentyOneStand(room, actor);
  room.log.push({ at: Date.now(), type: "twenty_one_stand", message: `${actor.name} reste a ${twentyOneTotalForTarget(actor, room.twentyOne.target)}.` });
  const didResolveRound = checkTwentyOneRoundResolution(room);
  if (!didResolveRound) passTwentyOneTurn(room, actor);
  return room;
}

export function playTwentyOneTrump(code, playerId, cardId) {
  const room = rooms.get(code);
  if (!room) throw new Error("Room introuvable.");
  if (room.phase !== "twenty_one") throw new Error("Twenty One n'est pas en cours.");

  const actor = room.players.find((p) => p.id === playerId);
  if (!actor) throw new Error("Joueur introuvable.");
  ensureTwentyOneTurn(room, actor);
  if (actor.twentyOne.manualStand) throw new Error("Vous avez déjà stand.");
  const opponent = getOpponent(room, actor.id);
  if (!opponent) throw new Error("Aucun adversaire.");

  const card = removeCardFromHand(actor, cardId);
  if (card.type !== "trump") {
    actor.hand.push(card);
    throw new Error("Cette carte n'est pas une carte spéciale Twenty One.");
  }

  actor.twentyOne.hasPlayedCardThisRound = true;
  let consumed = true;
  let message = `${actor.name} joue ${card.name}.`;

  if (card.trumpType === "add_number") {
    const drawn = drawTwentyOneNumber(room, actor, { value: card.value });
    message = drawn ? `${actor.name} joue ${card.name} et reçoit un ${card.value}.` : `${actor.name} joue ${card.name}, mais aucun ${card.value} n'est disponible.`;
  } else if (card.trumpType === "go_for") {
    room.twentyOne.target = card.target;
    message = `${actor.name} joue ${card.name} : la cible devient ${card.target}.`;
  } else if (card.trumpType === "bet") {
    if (card.action === "one_up") room.twentyOne.bet += 1;
    if (card.action === "shield") room.twentyOne.bet = Math.max(0, room.twentyOne.bet - 1);
    if (card.action === "bless") actor.twentyOne.bless = true;
    if (card.action === "bloodshed") {
      room.twentyOne.bet += 1;
      message = `${actor.name} joue ${card.name} : la mise augmente de 1. Aucun bonus de pioche spéciale n'est ajouté.`;
    }
    if (card.action === "destroy") {
      consumed = Boolean(destroyLastOpponentTrump(room, actor, opponent));
      message = consumed ? message : `${actor.name} joue ${card.name}, mais aucune carte spéciale adverse ne peut être détruite.`;
    }
    if (card.action === "friendship") message = `${actor.name} joue ${card.name}. Cette carte sert surtout à occuper ou déclencher les effets qui regardent la dernière carte spéciale jouée.`;
    if (card.action === "reincarnation") {
      consumed = Boolean(destroyLastOpponentTrump(room, actor, opponent));
      message = consumed ? `${actor.name} joue ${card.name} et annule la dernière carte spéciale adverse annulable.` : `${actor.name} joue ${card.name}, mais aucune carte spéciale adverse ne peut être annulée.`;
    }
  } else if (card.trumpType === "deck") {
    if (card.action === "hush") {
      drawTwentyOneNumber(room, actor, { hidden: true });
      message = `${actor.name} joue ${card.name} et ajoute une carte cachée à son total.`;
    }
    if (card.action === "perfect_draw") {
      const drawn = drawTwentyOneNumber(room, actor, { perfect: true });
      message = drawn ? `${actor.name} joue ${card.name} et reçoit la meilleure carte qui ne dépasse pas la cible.` : `${actor.name} tente ${card.name}, mais aucune carte sûre n'est disponible.`;
    }
    if (card.action === "refresh") {
      returnTwentyOneNumberCards(room, actor.twentyOne.cards);
      actor.twentyOne.cards = [];
      drawTwentyOneNumber(room, actor);
      drawTwentyOneNumber(room, actor);
      message = `${actor.name} joue ${card.name} : ses cartes repartent dans le paquet, puis 2 nouvelles cartes visibles sont piochées.`;
    }
    if (card.action === "remove") {
      const removed = opponent.twentyOne.cards.pop();
      if (removed) returnTwentyOneNumberCards(room, [removed]);
      message = removed ? `${actor.name} joue ${card.name} et retire la dernière carte de ${opponent.name}.` : `${actor.name} joue ${card.name}, mais ${opponent.name} n'a pas de carte.`;
    }
    if (card.action === "return") {
      const removed = actor.twentyOne.cards.pop();
      if (removed) returnTwentyOneNumberCards(room, [removed]);
      message = removed ? `${actor.name} joue ${card.name} et retire sa dernière carte.` : `${actor.name} joue ${card.name}, mais n'a pas de carte.`;
    }
    if (card.action === "exchange") {
      const own = actor.twentyOne.cards.pop();
      const other = opponent.twentyOne.cards.pop();
      if (own && other) {
        actor.twentyOne.cards.push({ ...other, hidden: false });
        opponent.twentyOne.cards.push({ ...own, hidden: false });
        message = `${actor.name} joue ${card.name} : les dernières cartes sont échangées et révélées.`;
      } else {
        if (own) actor.twentyOne.cards.push(own);
        if (other) opponent.twentyOne.cards.push(other);
        message = `${actor.name} joue ${card.name}, mais l'échange est impossible.`;
      }
    }
    if (card.action === "disservice") {
      drawTwentyOneNumber(room, opponent);
      message = `${actor.name} joue ${card.name} : ${opponent.name} pioche une carte visible de plus.`;
    }
  }

  actor.discard.push(card);
  if (consumed) actor.twentyOne.lastTrump = card;
  room.log.push({ at: Date.now(), type: "twenty_one_trump", message, playerId: actor.id, card: { type: card.type, name: card.name, trumpType: card.trumpType, action: card.action, value: card.value, target: card.target } });
  refreshTwentyOneBustState(actor, room.twentyOne.target);
  refreshTwentyOneBustState(opponent, room.twentyOne.target);
  checkTwentyOneRoundResolution(room);
  return room;
}
