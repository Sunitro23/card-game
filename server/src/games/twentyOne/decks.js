import { TWENTY_ONE_MAX_TRUMPS, TWENTY_ONE_STARTING_LIVES } from "../../core/constants.js";
import { shuffle, uid } from "../../core/random.js";
import { twentyOneTotalForTarget } from "./scoring.js";

const TWENTY_ONE_TRUMP_DEFS = [
  ...[2, 3, 4, 5, 6, 7].map((value) => ({ type: "trump", trumpType: "add_number", value, name: `Carte ${value}` })),
  { type: "trump", trumpType: "go_for", target: 17, name: "Cible 17" },
  { type: "trump", trumpType: "go_for", target: 24, name: "Cible 24" },
  { type: "trump", trumpType: "go_for", target: 27, name: "Cible 27" },
  { type: "trump", trumpType: "bet", action: "one_up", name: "Mise +1" },
  { type: "trump", trumpType: "bet", action: "shield", name: "Bouclier" },
  { type: "trump", trumpType: "bet", action: "bless", name: "Grace" },
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

export function createTwentyOneNumberDeck() {
  const cards = [];
  cards.push({ id: uid("num"), value: 1, rank: "A", hidden: false });
  for (let value = 2; value <= 10; value += 1) cards.push({ id: uid("num"), value, rank: String(value), hidden: false });
  return shuffle(cards);
}

export function createTwentyOneTrumpDeck() {
  const cards = [];
  for (let copy = 0; copy < 2; copy += 1) {
    for (const def of TWENTY_ONE_TRUMP_DEFS) cards.push({ id: uid("trump"), ...def });
  }
  return shuffle(cards);
}

export function twentyOnePlayerState() {
  return { lives: TWENTY_ONE_STARTING_LIVES, cards: [], stood: false, manualStand: false, autoBust: false, lastTrump: null, bless: false, hasPlayedCardThisRound: false };
}

export function drawTwentyOneTrump(room, player, count = 1) {
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

export function drawTwentyOneNumber(room, player, { hidden = false, value = null, perfect = false } = {}) {
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

export function returnTwentyOneNumberCards(room, cards) {
  room.twentyOne.numberDeck.push(...cards.map((card) => ({ id: card.id, value: card.value, rank: card.rank, hidden: false })));
  room.twentyOne.numberDeck = shuffle(room.twentyOne.numberDeck);
}
