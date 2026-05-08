export function friendlyDefenseName(defense) {
  const names = {
    dodge: "Esquive",
    block: "Blocage",
    counter_melee: "Contre mêlée",
    counter_magic: "Contre magie"
  };
  return names[defense] ?? defense;
}

export function cardPalette(card) {
  if (card.type === "trump") return { bg: "linear-gradient(135deg, #151d44, #8d4dff)", icon: specialCardIcon(card) };
  if (card.type === "utility") return { bg: "linear-gradient(135deg, #7d4dff, #4c72ff)", icon: "★" };

  if (card.defense === "dodge") return { bg: "linear-gradient(135deg, #ff9d4d, #ff5858)", icon: "↺" };
  if (card.defense === "block") return { bg: "linear-gradient(135deg, #25ad63, #0b7b6a)", icon: "▣" };
  if (card.defense === "counter_melee") return { bg: "linear-gradient(135deg, #ffd447, #ff8e32)", icon: "⚔" };
  if (card.defense === "counter_magic") return { bg: "linear-gradient(135deg, #00a0ff, #4a39ff)", icon: "✦" };

  return { bg: "linear-gradient(135deg, #6d7ea5, #43506c)", icon: "?" };
}

export function cardLabel(card) {
  if (card.type === "trump") return card.name ?? "Trump";
  if (card.type === "defense") return friendlyDefenseName(card.defense);
  if (card.type === "utility") {
    if (card.utility === "critical") return "Critique";
    if (card.utility === "vision") return "Vision";
    if (card.utility === "steal") return "Vol";
    return `Util ${card.utility}`;
  }
  return card.type;
}

export function cardDetails(card) {
  if (card.type === "trump") {
    if (card.trumpType === "add_number") return `Cherche un ${card.value} dans le deck numérique.`;
    if (card.trumpType === "go_for") return `La cible devient ${card.target}.`;
    if (card.action === "one_up") return "Augmente le bet de +1.";
    if (card.action === "shield") return "Diminue le bet de -1.";
    if (card.action === "bless") return "Te sauve si tu devais mourir.";
    if (card.action === "bloodshed") return "Bet +1, sans pioche de Trump.";
    if (card.action === "destroy") return "Détruit le dernier Trump adverse.";
    if (card.action === "friendship") return "Effet sans pioche de Trump.";
    if (card.action === "reincarnation") return "Destroy, sans pioche de Trump.";
    if (card.action === "hush") return "Pioche une carte numérique cachée.";
    if (card.action === "perfect_draw") return "Meilleure carte s?re vers la cible.";
    if (card.action === "refresh") return "Reset tes cartes numériques puis pioche 2.";
    if (card.action === "remove") return "Retire la derni?re carte adverse.";
    if (card.action === "return") return "Retire ta derni?re carte.";
    if (card.action === "exchange") return "?change les derni?res cartes.";
    if (card.action === "disservice") return "Force l'adversaire ? piocher.";
    return "Trump Twenty One.";
  }
  if (card.type === "defense" && card.value) return `R?duction: ${card.value}`;
  if (card.type === "utility" && card.utility === "critical") return "Double les d?g?ts de ta prochaine attaque.";
  if (card.type === "utility" && card.utility === "vision") return "R?v?le la main adverse pendant ce tour.";
  if (card.type === "utility" && card.utility === "steal") return "Vole une carte al?atoire dans la main ennemie.";
  return "";
}

export function trumpShortEffect(card) {
  if (card.type !== "trump") return "";
  if (card.trumpType === "add_number") return `+${card.value} choisi`;
  if (card.trumpType === "go_for") return `Cible ${card.target}`;
  if (card.action === "one_up" || card.action === "bloodshed") return "+1 mise";
  if (card.action === "shield") return "-1 mise";
  if (card.action === "bless") return "Sauve 1 vie";
  if (card.action === "destroy" || card.action === "reincarnation") return "Détruit";
  if (card.action === "hush") return "Pioche cachée";
  if (card.action === "perfect_draw") return "Carte sûre";
  if (card.action === "refresh") return "Reset +2";
  if (card.action === "remove") return "Retire adverse";
  if (card.action === "return") return "Retire à toi";
  if (card.action === "exchange") return "Échange";
  if (card.action === "disservice") return "Adversaire +1";
  return "Effet spécial";
}

export function specialCardIcon(card) {
  if (card.type !== "trump") return "✦";
  if (card.trumpType === "add_number") {
    const icons = { 2: "Ⅱ", 3: "Ⅲ", 4: "Ⅳ", 5: "Ⅴ", 6: "Ⅵ", 7: "Ⅶ" };
    return icons[card.value] ?? `${card.value}`;
  }
  if (card.trumpType === "go_for") return `${card.target}`;
  if (card.action === "one_up") return "↑";
  if (card.action === "shield") return "◇";
  if (card.action === "bless") return "✔";
  if (card.action === "bloodshed") return "†";
  if (card.action === "destroy") return "✕";
  if (card.action === "friendship") return "☉";
  if (card.action === "reincarnation") return "↻";
  if (card.action === "hush") return "●";
  if (card.action === "perfect_draw") return "★";
  if (card.action === "refresh") return "↺";
  if (card.action === "remove") return "−";
  if (card.action === "return") return "↩";
  if (card.action === "exchange") return "⇄";
  if (card.action === "disservice") return "!";
  return "✦";
}

export function canDefenseCardAnswerAttack(card, attackType) {
  if (card.type !== "defense") return false;
  if (card.defense === "dodge" || card.defense === "block") return true;
  if (card.defense === "counter_melee") return attackType === "melee";
  if (card.defense === "counter_magic") return attackType === "magic";
  return false;
}

export function attackCardTheme(attackType) {
  if (attackType === "ranged") return { bg: "linear-gradient(135deg, #ff6f4d, #ff3c6f)", icon: "➶", title: "Distance", die: "D4" };
  if (attackType === "magic") return { bg: "linear-gradient(135deg, #2da9ff, #5a46ff)", icon: "✦", title: "Magie", die: "D6" };
  return { bg: "linear-gradient(135deg, #ffd447, #ff8e32)", icon: "⚔", title: "Mêlée", die: "D8" };
}

export function soulsCardPalette(card) {
  if (card.type === "trump") return { bg: "radial-gradient(circle at 50% 20%, rgba(240, 138, 53, 0.38), transparent 36%), linear-gradient(160deg, #3a2414, #080706 78%)", icon: specialCardIcon(card) };
  if (card.type === "utility") return { bg: "radial-gradient(circle at 50% 22%, rgba(167, 139, 89, 0.28), transparent 38%), linear-gradient(160deg, #2e261c, #0a0907 78%)", icon: "✦" };

  if (card.defense === "dodge") return { bg: "linear-gradient(160deg, #5b2b19, #110b08 78%)", icon: "↺" };
  if (card.defense === "block") return { bg: "linear-gradient(160deg, #3a392f, #0a0907 78%)", icon: "▣" };
  if (card.defense === "counter_melee") return { bg: "linear-gradient(160deg, #6c411f, #120a05 78%)", icon: "⚔" };
  if (card.defense === "counter_magic") return { bg: "linear-gradient(160deg, #2e3140, #08080b 78%)", icon: "✦" };

  return { bg: "linear-gradient(160deg, #332c23, #090806 78%)", icon: "?" };
}

export function soulsAttackCardTheme(attackType) {
  if (attackType === "ranged") return { bg: "linear-gradient(160deg, #553322, #110907 78%)", icon: "➶", title: "Distance", die: "D4" };
  if (attackType === "magic") return { bg: "linear-gradient(160deg, #2b2d3a, #08080b 78%)", icon: "✦", title: "Magie", die: "D6" };
  return { bg: "linear-gradient(160deg, #6b3f1b, #100805 78%)", icon: "⚔", title: "Mêlée", die: "D8" };
}

export function previewCardFromVision(rawCard) {
  if (!rawCard) return null;
  if (typeof rawCard === "object" && rawCard.type) return rawCard;
  if (typeof rawCard !== "string") return null;
  const [type, detail] = rawCard.split(":");
  if (!type || !detail) return null;
  if (type === "defense") return { type, defense: detail };
  if (type === "utility") return { type, utility: detail };
  return null;
}

export function getAwaleRowsForViewer(state, me) {
  if (!state?.awale?.board || !me) return { myRow: [], opponentRow: [] };
  const mySide = me.awaleSide;
  const opponentSide = mySide === 0 ? 1 : 0;
  const sideIndexes = (side) => (side === 0 ? [0, 1, 2, 3, 4, 5] : [6, 7, 8, 9, 10, 11]);
  return {
    myRow: sideIndexes(mySide),
    opponentRow: [...sideIndexes(opponentSide)].reverse()
  };
}


