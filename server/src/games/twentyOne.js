import { TWENTY_ONE_STARTING_BET, TWENTY_ONE_STARTING_LIVES, TWENTY_ONE_STARTING_TARGET, TWENTY_ONE_TRUMPS_PER_ROUND } from "../core/constants.js";
import { getOpponent, removeCardFromHand } from "../core/players.js";
import { rooms } from "../core/state.js";
import {
  createTwentyOneNumberDeck,
  createTwentyOneTrumpDeck,
  drawTwentyOneNumber,
  drawTwentyOneTrump,
  returnTwentyOneNumberCards,
  twentyOnePlayerState
} from "./twentyOne/decks.js";
import { checkTwentyOneRoundResolution, ensureTwentyOneTurn, passTwentyOneTurn } from "./twentyOne/rounds.js";
import { isTwentyOneBust, refreshTwentyOneBustState, twentyOneTotal, twentyOneTotalForTarget } from "./twentyOne/scoring.js";
import { destroyLastOpponentTrump } from "./twentyOne/trumpEffects.js";

export { twentyOneTotal, twentyOneTotalForTarget } from "./twentyOne/scoring.js";

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
    lastRoundResult: null
  };
  room.players.forEach((player) => {
    player.hp = player.twentyOne?.lives ?? TWENTY_ONE_STARTING_LIVES;
    player.energy = 0;
    player.hand = [];
    player.deck = [];
    player.discard = [];
    player.twentyOne = twentyOnePlayerState();
    drawTwentyOneNumber(room, player, { hidden: true });
    drawTwentyOneNumber(room, player, { hidden: true });
    drawTwentyOneTrump(room, player, TWENTY_ONE_TRUMPS_PER_ROUND);
  });
  room.log.push({ at: Date.now(), type: "game_started", message: "Twenty One lance. Cible 21, mise 1. Chaque joueur commence avec 2 cartes cachees." });
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

function getTwentyOneActor(room, playerId) {
  const actor = room.players.find((player) => player.id === playerId);
  if (!actor) throw new Error("Joueur introuvable.");
  return actor;
}

function ensureTwentyOneGame(room) {
  if (!room) throw new Error("Room introuvable.");
  if (room.phase !== "twenty_one") throw new Error("Twenty One n'est pas en cours.");
}

function ensureCanActInTwentyOne(room, actor) {
  ensureTwentyOneTurn(room, actor);
  if (actor.twentyOne.manualStand || (actor.twentyOne.stood && !isTwentyOneBust(actor, room.twentyOne.target))) throw new Error("Vous avez déjà stand.");
}

export function drawTwentyOneNumberCard(code, playerId) {
  const room = rooms.get(code);
  ensureTwentyOneGame(room);

  const actor = getTwentyOneActor(room, playerId);
  ensureCanActInTwentyOne(room, actor);
  if (actor.twentyOne.autoBust || isTwentyOneBust(actor, room.twentyOne.target)) throw new Error("Vous êtes Bust : jouez une carte spéciale ou cliquez Rester.");

  const card = drawTwentyOneNumber(room, actor);
  if (!card) throw new Error("Deck vide.");
  actor.twentyOne.hasPlayedCardThisRound = true;
  room.log.push({ at: Date.now(), type: "twenty_one_draw", message: `${actor.name} pioche une carte.` });

  refreshTwentyOneBustState(actor, room.twentyOne.target);
  checkTwentyOneRoundResolution(room);
  return room;
}

export function drawTwentyOneTrumpCard(code, playerId) {
  const room = rooms.get(code);
  ensureTwentyOneGame(room);
  getTwentyOneActor(room, playerId);
  throw new Error("Les cartes spéciales ne sont pas piochables manuellement : +3 par manche, 6 en main maximum.");
}

export function standTwentyOne(code, playerId) {
  const room = rooms.get(code);
  ensureTwentyOneGame(room);

  const actor = getTwentyOneActor(room, playerId);
  ensureCanActInTwentyOne(room, actor);
  actor.twentyOne.stood = true;
  actor.twentyOne.manualStand = true;
  actor.twentyOne.autoBust = false;
  passTwentyOneTurn(room, actor);
  room.log.push({ at: Date.now(), type: "twenty_one_stand", message: `${actor.name} reste a ${twentyOneTotalForTarget(actor, room.twentyOne.target)}.` });
  checkTwentyOneRoundResolution(room);
  return room;
}

export function playTwentyOneTrump(code, playerId, cardId) {
  const room = rooms.get(code);
  ensureTwentyOneGame(room);

  const actor = getTwentyOneActor(room, playerId);
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
    message = `${actor.name} change la cible : Go For ${card.target}.`;
  } else if (card.trumpType === "bet") {
    if (card.action === "one_up") room.twentyOne.bet += 1;
    if (card.action === "shield") room.twentyOne.bet = Math.max(0, room.twentyOne.bet - 1);
    if (card.action === "bless") actor.twentyOne.bless = true;
    if (card.action === "bloodshed") {
      room.twentyOne.bet += 1;
      message = `${actor.name} joue ${card.name} : mise +1. Aucune carte spéciale supplémentaire n'est piochée.`;
    }
    if (card.action === "destroy") {
      consumed = Boolean(destroyLastOpponentTrump(room, actor, opponent));
      message = consumed ? message : `${actor.name} joue ${card.name}, mais aucune carte spéciale adverse ne peut être détruite.`;
    }
    if (card.action === "friendship") message = `${actor.name} joue ${card.name}. Aucune carte spéciale supplémentaire n'est piochée.`;
    if (card.action === "reincarnation") {
      consumed = Boolean(destroyLastOpponentTrump(room, actor, opponent));
      message = consumed ? `${actor.name} joue ${card.name} et détruit la dernière carte spéciale adverse. Aucune carte spéciale supplémentaire n'est piochée.` : `${actor.name} joue ${card.name}, mais aucune carte spéciale adverse ne peut être détruite.`;
    }
  } else if (card.trumpType === "deck") {
    if (card.action === "hush") drawTwentyOneNumber(room, actor, { hidden: true });
    if (card.action === "perfect_draw") {
      const drawn = drawTwentyOneNumber(room, actor, { perfect: true });
      message = drawn ? `${actor.name} réalise ${card.name}.` : `${actor.name} tente ${card.name}, mais aucune carte sûre n'est disponible.`;
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
      message = removed ? message : `${actor.name} joue Remove, mais ${opponent.name} n'a pas de carte.`;
    }
    if (card.action === "return") {
      const removed = actor.twentyOne.cards.pop();
      if (removed) returnTwentyOneNumberCards(room, [removed]);
      message = removed ? message : `${actor.name} joue Return, mais n'a pas de carte.`;
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
  room.log.push({ at: Date.now(), type: "twenty_one_trump", message, playerId: actor.id, card: { type: card.type, name: card.name, trumpType: card.trumpType, action: card.action, value: card.value, target: card.target } });
  refreshTwentyOneBustState(actor, room.twentyOne.target);
  refreshTwentyOneBustState(opponent, room.twentyOne.target);
  checkTwentyOneRoundResolution(room);
  return room;
}
