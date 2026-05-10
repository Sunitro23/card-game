export function normalizeGameType(gameType) {
  if (gameType === "awale") return "awale";
  if (gameType === "twenty_one") return "twenty_one";
  return "card_duel";
}

