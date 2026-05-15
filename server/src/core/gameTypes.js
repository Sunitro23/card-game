export function normalizeGameType(gameType) {
  if (gameType === "awale") return "awale";
  if (gameType === "twenty_one") return "twenty_one";
  if (gameType === "berenike_shot") return "berenike_shot";
  return "card_duel";
}
