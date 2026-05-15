import { TWENTY_ONE_STARTING_TARGET } from "../../core/constants.js";

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

export function isTwentyOneBust(player, target) {
  return false;
}

export function refreshTwentyOneBustState(player, target) {
  player.twentyOne.autoBust = false;
  if (!player.twentyOne.manualStand) player.twentyOne.stood = false;
}

export function scoreTwentyOnePlayer(player, target) {
  const total = twentyOneTotalForTarget(player, target);
  return { total, distance: Math.abs(target - total), busted: total > target };
}
