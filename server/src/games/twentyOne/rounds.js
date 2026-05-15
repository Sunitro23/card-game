import { TWENTY_ONE_STARTING_BET, TWENTY_ONE_STARTING_TARGET, TWENTY_ONE_TRUMPS_PER_ROUND } from "../../core/constants.js";
import { uid } from "../../core/random.js";
import { createTwentyOneNumberDeck, drawTwentyOneNumber, drawTwentyOneTrump } from "./decks.js";
import { scoreTwentyOnePlayer, twentyOneTotalForTarget } from "./scoring.js";

export function resetTwentyOneRound(room) {
  room.twentyOne.round += 1;
  room.twentyOne.target = TWENTY_ONE_STARTING_TARGET;
  room.twentyOne.bet = TWENTY_ONE_STARTING_BET;
  room.twentyOne.numberDeck = createTwentyOneNumberDeck();
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
    drawTwentyOneNumber(room, player, { hidden: true });
    drawTwentyOneTrump(room, player, TWENTY_ONE_TRUMPS_PER_ROUND);
  }
}

export function getTwentyOneTurnPlayer(room) {
  return room.players[room.turnIndex % room.players.length];
}

export function ensureTwentyOneTurn(room, player) {
  if (getTwentyOneTurnPlayer(room)?.id !== player.id) throw new Error("Ce n'est pas votre tour.");
}

export function passTwentyOneTurn(room, player) {
  const currentIndex = room.players.findIndex((candidate) => candidate.id === player.id);
  const nextIndex = room.players.findIndex((candidate, index) => index !== currentIndex && !candidate.twentyOne.manualStand);
  if (nextIndex >= 0) room.turnIndex = nextIndex;
}

function setTwentyOneRoundResult(room, result) {
  room.twentyOne.lastRoundResult = {
    id: uid("round"),
    round: room.twentyOne.round,
    target: room.twentyOne.target,
    ...result
  };
}

function logNewTwentyOneRound(room) {
  room.log.push({ at: Date.now(), type: "twenty_one_round_start", message: `Manche ${room.twentyOne.round} lancée. Cible 21, mise 1.` });
}

function resolvePassedTwentyOneRound(room, a, b) {
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
  logNewTwentyOneRound(room);
}

function resolveTiedTwentyOneRound(room, a, b, scoreA, scoreB) {
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
  logNewTwentyOneRound(room);
}

function resolveWinningTwentyOneRound(room, a, b, loser) {
  const winner = loser.id === a.id ? b : a;
  const damage = room.twentyOne.bet;
  if (loser.twentyOne.lives - damage <= 0 && loser.twentyOne.bless) {
    loser.twentyOne.bless = false;
    loser.twentyOne.lives = 1;
    room.log.push({ at: Date.now(), type: "twenty_one_bless", message: `${loser.name} est sauvé par Bless et reste à 1 vie.` });
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
  logNewTwentyOneRound(room);
}

export function resolveTwentyOneRound(room) {
  const [a, b] = room.players;
  const noPlayerActed = room.players.every((player) => !player.twentyOne.hasPlayedCardThisRound);

  if (noPlayerActed) {
    resolvePassedTwentyOneRound(room, a, b);
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
    resolveTiedTwentyOneRound(room, a, b, scoreA, scoreB);
    return;
  }

  resolveWinningTwentyOneRound(room, a, b, loser);
}

export function checkTwentyOneRoundResolution(room) {
  if (room.phase !== "twenty_one") return;
  if (room.players.every((player) => player.twentyOne.manualStand === true)) resolveTwentyOneRound(room);
}
