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
  if (card.type === "trump") return card.name ?? "Carte spéciale";
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
    if (card.trumpType === "add_number") return `Ajoute un ${card.value} à tes cartes, si cette valeur est encore disponible.`;
    if (card.trumpType === "go_for") return `Change la cible de la manche : il faut maintenant se rapprocher de ${card.target}.`;
    if (card.action === "one_up") return "Augmente la mise de 1 : le perdant de la manche perdra 1 vie de plus.";
    if (card.action === "shield") return "Réduit la mise de 1, sans descendre sous 0 : le perdant perdra moins de vies.";
    if (card.action === "bless") return "Protection : si tu devais tomber à 0 vie cette manche, tu restes à 1 vie et la protection disparaît.";
    if (card.action === "bloodshed") return "Augmente la mise de 1. Aucun autre bonus de pioche spéciale n'est ajouté.";
    if (card.action === "destroy") return "Annule la dernière carte spéciale adverse annulable et retire son effet si possible.";
    if (card.action === "friendship") return "Carte neutre : elle compte comme dernière carte spéciale jouée sans changer immédiatement la manche.";
    if (card.action === "reincarnation") return "Annule la dernière carte spéciale adverse annulable, sans autre bonus de pioche spéciale.";
    if (card.action === "hush") return "Ajoute une carte cachée à ton total : toi seul vois sa valeur.";
    if (card.action === "perfect_draw") return "Ajoute la meilleure carte disponible qui rapproche ton total de la cible sans la dépasser.";
    if (card.action === "refresh") return "Remet toutes tes cartes dans le paquet, puis pioche 2 nouvelles cartes visibles.";
    if (card.action === "remove") return "Retire la dernière carte de l'adversaire et la remet dans le paquet.";
    if (card.action === "return") return "Retire ta dernière carte et la remet dans le paquet.";
    if (card.action === "exchange") return "Échange ta dernière carte avec la dernière carte adverse. Les deux cartes deviennent visibles.";
    if (card.action === "disservice") return "Force l'adversaire à ajouter une carte visible à son total.";
    return "Carte spéciale Twenty One.";
  }
  if (card.type === "defense" && card.value) return `Réduction : ${card.value}`;
  if (card.type === "utility" && card.utility === "critical") return "Double les dégâts de ta prochaine attaque.";
  if (card.type === "utility" && card.utility === "vision") return "Révèle la main adverse pendant ce tour.";
  if (card.type === "utility" && card.utility === "steal") return "Vole une carte aléatoire dans la main ennemie.";
  return "";
}

export function trumpShortEffect(card) {
  if (card.type !== "trump") return "";
  if (card.trumpType === "add_number") return `${card.value} précis`;
  if (card.trumpType === "go_for") return `Cible ${card.target}`;
  if (card.action === "one_up" || card.action === "bloodshed") return "+1 mise";
  if (card.action === "shield") return "-1 mise";
  if (card.action === "bless") return "Sauve 1 vie";
  if (card.action === "destroy" || card.action === "reincarnation") return "Annule";
  if (card.action === "hush") return "Ajout caché";
  if (card.action === "perfect_draw") return "Carte sûre";
  if (card.action === "refresh") return "Remet +2";
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
  if (!state?.awale?.board) return { myRow: [], opponentRow: [] };
  const mySide = me?.awaleSide ?? 0;
  const opponentSide = mySide === 0 ? 1 : 0;
  const sideIndexes = (side) => (side === 0 ? [0, 1, 2, 3, 4, 5] : [6, 7, 8, 9, 10, 11]);
  return {
    myRow: sideIndexes(mySide),
    opponentRow: [...sideIndexes(opponentSide)].reverse()
  };
}


