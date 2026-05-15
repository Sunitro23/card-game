import { TWENTY_ONE_STARTING_TARGET } from "../../core/constants.js";

export function destroyLastOpponentTrump(room, actor, opponent) {
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
