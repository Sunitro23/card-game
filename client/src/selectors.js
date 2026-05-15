import { canDefenseCardAnswerAttack, getAwaleRowsForViewer } from "./cardPresentation.js";

export function getMe(state) {
  if (!state) return null;
  return state.players.find((player) => player.hand) ?? null;
}

export function getIsSpectator(state, me) {
  return state?.viewerRole === "spectator" || Boolean(state && !me);
}

export function getOpponents(state, me) {
  if (!state || !me) return [];
  return state.players.filter((player) => player.id !== me.id);
}

export function getVisibleDuelPlayers(state, me, opponents) {
  if (!state) return [];
  return me ? [opponents[0], me].filter(Boolean) : state.players;
}

export function getSelectedTwentyOneTrump(me, activeCardId) {
  const active = me?.hand?.find((card) => card.id === activeCardId && card.type === "trump");
  return active ?? me?.hand?.find((card) => card.type === "trump") ?? null;
}

export function getTwentyOneWinner(state) {
  if (!state?.twentyOne?.winnerId) return null;
  return state.players.find((player) => player.id === state.twentyOne.winnerId) ?? null;
}

export function getDefenseCards(me) {
  return me?.hand?.filter((card) => card.type === "defense") ?? [];
}

export function getValidDefenseCards(defenseCards, pendingAttack) {
  if (!pendingAttack) return [];
  return defenseCards.filter((card) => canDefenseCardAnswerAttack(card, pendingAttack.card.type));
}

export function getInvalidDefenseCards(defenseCards, pendingAttack) {
  if (!pendingAttack) return [];
  return defenseCards.filter((card) => !canDefenseCardAnswerAttack(card, pendingAttack.card.type));
}

export function getGameWinner(state) {
  if (!state || state.phase !== "finished") return null;
  if (state.gameType === "twenty_one" && state.twentyOne?.winnerId) {
    return state.players.find((player) => player.id === state.twentyOne.winnerId) ?? null;
  }
  if (state.gameType === "berenike_shot" && state.berenike?.winnerId) {
    return state.players.find((player) => player.id === state.berenike.winnerId) ?? null;
  }
  if (state.gameType === "awale" && state.awale?.winnerSide !== undefined) {
    if (state.awale.winnerSide === null) return null;
    return state.players.find((player) => player.awaleSide === state.awale.winnerSide) ?? null;
  }
  const lastFinish = [...(state.log ?? [])].reverse().find((entry) => entry.type === "game_finished");
  return state.players.find((player) => lastFinish?.message?.includes(`${player.name} remporte`)) ?? null;
}

export function getAwaleRows(state, me) {
  return getAwaleRowsForViewer(state, me);
}
