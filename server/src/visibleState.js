import {
  ATTACKS,
  AWALE_PITS_PER_PLAYER,
  AWALE_SEEDS_PER_PIT,
  ENERGY_PER_TURN,
  MAX_DEFENSE_IN_HAND,
  MAX_ENERGY,
  MAX_HAND_SIZE,
  TWENTY_ONE_MAX_TRUMPS,
  TWENTY_ONE_STARTING_LIVES,
  TWENTY_ONE_STARTING_TARGET,
  TWENTY_ONE_TRUMPS_PER_ROUND
} from "./core/constants.js";
import { getOpponent } from "./core/players.js";
import { getLegalAwaleMoves, getPlayerSide } from "./games/awale.js";
import { twentyOneTotalForTarget } from "./games/twentyOne.js";

function visibleTwentyOnePlayerState(room, player, viewerPlayerId) {
  if (!player.twentyOne) return null;

  const canSeeHiddenCards = player.id === viewerPlayerId;
  const scoringPlayer = canSeeHiddenCards
    ? player
    : {
        ...player,
        twentyOne: {
          ...player.twentyOne,
          cards: player.twentyOne.cards.filter((card) => !card.hidden)
        }
      };

  return {
    lives: player.twentyOne.lives,
    total: twentyOneTotalForTarget(scoringPlayer, room.twentyOne.target),
    stood: Boolean(player.twentyOne.manualStand),
    manualStand: Boolean(player.twentyOne.manualStand),
    autoBust: player.twentyOne.autoBust,
    bless: player.twentyOne.bless,
    hasPlayedCardThisRound: player.twentyOne.hasPlayedCardThisRound,
    cards: player.twentyOne.cards.map((card) => ({
      id: card.id,
      value: canSeeHiddenCards || !card.hidden ? card.value : null,
      rank: canSeeHiddenCards || !card.hidden ? card.rank : null,
      hidden: card.hidden
    })),
    trumpCount: player.hand.length
  };
}

function visiblePlayerState(room, player, viewerPlayerId) {
  return {
    id: player.id,
    name: player.name,
    hp: player.hp,
    energy: player.energy,
    position: player.position,
    awaleSide: room.players.findIndex((candidate) => candidate.id === player.id),
    handCount: player.hand.length,
    hand: player.id === viewerPlayerId ? player.hand : undefined,
    twentyOne: visibleTwentyOnePlayerState(room, player, viewerPlayerId)
  };
}

function visiblePendingAttack(room) {
  if (!room.pendingAttack) return null;

  return {
    id: room.pendingAttack.id,
    attackerId: room.pendingAttack.attackerId,
    targetId: room.pendingAttack.targetId,
    facedown: false,
    card: room.pendingAttack.card
  };
}

function visibleOpponentHandPreview(viewer, opponent) {
  if (!viewer?.status.visionActive || !opponent) return undefined;

  return opponent.hand.map((card) => ({
    type: card.type,
    defense: card.type === "defense" ? card.defense : undefined,
    utility: card.type === "utility" ? card.utility : undefined
  }));
}

export function getVisibleState(room, playerId) {
  const viewer = room.players.find((player) => player.id === playerId);
  const opponent = getOpponent(room, playerId);
  const viewerRole = viewer ? "player" : "spectator";

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
      awale: { pitsPerPlayer: AWALE_PITS_PER_PLAYER, seedsPerPit: AWALE_SEEDS_PER_PIT },
      twentyOne: {
        startingLives: TWENTY_ONE_STARTING_LIVES,
        startingTarget: TWENTY_ONE_STARTING_TARGET,
        trumpsPerRound: TWENTY_ONE_TRUMPS_PER_ROUND,
        maxTrumps: TWENTY_ONE_MAX_TRUMPS
      }
    },
    turnPlayerId: room.players[room.turnIndex % room.players.length]?.id,
    pendingAttack: visiblePendingAttack(room),
    hostPlayerId: room.hostPlayerId,
    viewerRole,
    spectatorCount: room.spectators?.length ?? 0,
    cardDuel: room.cardDuel
      ? {
          lastEvent: room.cardDuel.lastEvent
        }
      : null,
    players: room.players.map((player) => visiblePlayerState(room, player, playerId)),
    twentyOne: room.twentyOne
      ? {
          round: room.twentyOne.round,
          target: room.twentyOne.target,
          bet: room.twentyOne.bet,
          numberDeckCount: room.twentyOne.numberDeck.length,
          trumpDeckCount: room.twentyOne.trumpDeck.length,
          winnerId: room.twentyOne.winnerId,
          lastRoundResult: room.twentyOne.lastRoundResult
        }
      : null,
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
    opponentHandPreview: visibleOpponentHandPreview(viewer, opponent),
    log: room.log.slice(-20)
  };
}
