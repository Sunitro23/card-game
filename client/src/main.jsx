import React from "react";
import { createRoot } from "react-dom/client";
import { io } from "socket.io-client";

const socketUrl = import.meta.env.VITE_SOCKET_URL ?? "https://owlbearapi.sunitro.de";

const socket = io(socketUrl, {
  autoConnect: false,
  path: "/socket.io/",
  transports: ["websocket", "polling"]
});

const theme = {
  ash: "#090806",
  iron: "#1a1712",
  panel: "rgba(18, 15, 11, 0.92)",
  panelSoft: "rgba(30, 25, 18, 0.78)",
  bone: "#d8c9a7",
  ember: "#b85a24",
  emberBright: "#f08a35",
  blood: "#7d1010",
  line: "rgba(216, 201, 167, 0.32)",
  glow: "rgba(240, 138, 53, 0.34)"
};

const GAME_CHOICES = [
  { id: "card_duel", title: "Duel de cartes", desc: "Combat strict au tour par tour, attaques et defenses." },
  { id: "awale", title: "Awale classique", desc: "Plateau rituel, douze trous, captures par deux ou trois." },
  { id: "twenty_one", title: "Twenty One", desc: "Rapproche-toi de la cible, joue tes Trumps, preserve tes vies." }
];

const styles = {
  page: {
    width: "100%",
    minHeight: "100dvh",
    padding: 14,
    fontFamily: "'Cinzel', 'Georgia', 'Times New Roman', serif",
    background: "radial-gradient(circle at 50% 0%, rgba(151, 86, 34, 0.34) 0%, transparent 28%), radial-gradient(circle at 12% 16%, rgba(226, 153, 67, 0.12) 0%, transparent 26%), linear-gradient(180deg, #17120d 0%, #090806 48%, #030302 100%)",
    color: theme.bone,
    boxSizing: "border-box",
    overflowX: "hidden",
    textShadow: "0 1px 2px rgba(0, 0, 0, 0.86)"
  },
  panel: {
    margin: "0 auto",
    maxWidth: 980,
    width: "100%"
  },
  homeCard: {
    position: "relative",
    overflow: "hidden",
    background: "radial-gradient(circle at 50% 0%, rgba(120, 75, 36, 0.24), transparent 34%), linear-gradient(180deg, rgba(31, 25, 17, 0.97), rgba(8, 7, 6, 0.98)), repeating-linear-gradient(0deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 5px)",
    border: "1px solid rgba(213, 190, 137, 0.44)",
    borderRadius: 2,
    padding: 24,
    boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.78), inset 0 0 72px rgba(0,0,0,0.82), 0 24px 52px rgba(0,0,0,0.68)",
    display: "grid",
    gap: 18
  },
  menuHeader: {
    display: "grid",
    gap: 6,
    paddingBottom: 13,
    borderBottom: "1px solid rgba(213, 190, 137, 0.26)"
  },
  menuTitle: {
    margin: 0,
    color: "#f1e2bf",
    fontSize: "clamp(30px, 4.4vw, 52px)",
    lineHeight: 1,
    fontWeight: 500,
    letterSpacing: 0,
    textShadow: "0 3px 8px rgba(0,0,0,0.9)"
  },
  menuSubtitle: {
    maxWidth: 640,
    color: "rgba(232, 216, 181, 0.72)",
    fontSize: 14,
    lineHeight: 1.45
  },
  menuSection: {
    display: "grid",
    gap: 0,
    borderTop: "1px solid rgba(213, 190, 137, 0.18)"
  },
  menuSectionTitle: {
    color: "rgba(185, 156, 103, 0.82)",
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
    padding: "12px 0 7px",
    letterSpacing: 0
  },
  menuRow: {
    width: "100%",
    minHeight: 38,
    display: "grid",
    gridTemplateColumns: "minmax(130px, 1fr) minmax(110px, auto)",
    alignItems: "center",
    gap: 16,
    padding: "7px 10px",
    border: 0,
    borderTop: "1px solid rgba(213, 190, 137, 0.13)",
    borderRadius: 0,
    background: "transparent",
    color: "rgba(239, 225, 194, 0.82)",
    boxShadow: "none",
    textAlign: "left",
    textTransform: "none"
  },
  menuButtonRow: {
    cursor: "pointer"
  },
  menuRowSelected: {
    background: "linear-gradient(90deg, rgba(126, 63, 24, 0.86), rgba(75, 36, 14, 0.46) 62%, transparent)",
    color: "#fff0c9",
    boxShadow: "inset 3px 0 0 rgba(238, 149, 56, 0.92), inset 0 0 22px rgba(109, 42, 15, 0.48)"
  },
  menuLabel: {
    minWidth: 0,
    fontSize: 16
  },
  menuValue: {
    justifySelf: "end",
    minWidth: 0,
    color: "#f1dfb5",
    fontSize: 15,
    textAlign: "right"
  },
  menuInput: {
    justifySelf: "end",
    width: "min(240px, 42vw)",
    minHeight: 30,
    padding: "2px 0",
    border: 0,
    borderBottom: "1px solid rgba(213, 190, 137, 0.48)",
    borderRadius: 0,
    background: "transparent",
    boxShadow: "none",
    color: "#f4e7c8",
    textAlign: "right",
    outline: "none"
  },
  menuDescription: {
    marginTop: 0,
    padding: 0,
    color: "rgba(224, 206, 166, 0.68)",
    fontSize: 13,
    lineHeight: 1.4
  },
  menuActions: {
    display: "grid",
    gap: 0,
    paddingTop: 2,
    borderTop: "1px solid rgba(213, 190, 137, 0.22)"
  },
  menuActionHint: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
    paddingTop: 10,
    color: "rgba(232, 216, 181, 0.58)",
    fontSize: 12
  },
  validateButton: {
    width: "min(100%, 320px)",
    justifySelf: "start",
    marginTop: 2,
    minHeight: 42,
    border: "1px solid rgba(238, 149, 56, 0.74)",
    background: "linear-gradient(90deg, rgba(126, 63, 24, 0.94), rgba(62, 28, 12, 0.86))",
    color: "#fff0c9",
    boxShadow: "inset 3px 0 0 rgba(238, 149, 56, 0.92), inset 0 0 22px rgba(109, 42, 15, 0.5), 0 10px 20px rgba(0,0,0,0.32)",
    textAlign: "left",
    justifyContent: "start"
  },
  lobbyPlayers: {
    margin: 0,
    padding: 0,
    listStyle: "none",
    display: "grid",
    gap: 8
  },
  lobbyPlayerItem: {
    borderRadius: 3,
    background: "linear-gradient(90deg, rgba(68, 52, 35, 0.68), rgba(20, 17, 13, 0.72))",
    border: `1px solid ${theme.line}`,
    padding: "8px 10px",
    fontWeight: 700,
    color: "#f1e5c8"
  },
  gameChoice: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: 10
  },
  gameChoiceButton: {
    border: `1px solid ${theme.line}`,
    borderRadius: 3,
    padding: 12,
    background: "linear-gradient(180deg, rgba(39, 33, 24, 0.96), rgba(11, 10, 8, 0.96))",
    color: theme.bone,
    textAlign: "left",
    cursor: "pointer",
    display: "grid",
    gap: 4
  },
  lobby: {
    background: theme.panel,
    border: `1px solid ${theme.line}`,
    borderRadius: 4,
    padding: 10,
    marginBottom: 10,
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    boxShadow: "0 14px 34px rgba(0,0,0,0.5)"
  },
  board: {
    width: "100%",
    borderRadius: 4,
    minHeight: 460,
    background: "radial-gradient(circle at 50% 35%, rgba(95, 65, 35, 0.38) 0%, rgba(22, 18, 13, 0.96) 42%, rgba(4, 4, 3, 0.98) 100%), repeating-linear-gradient(90deg, rgba(255,255,255,0.025) 0 1px, transparent 1px 62px)",
    border: `1px solid ${theme.line}`,
    boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.82), inset 0 0 70px rgba(0,0,0,0.72), 0 18px 36px rgba(0,0,0,0.55)",
    padding: 14,
    display: "grid",
    gridTemplateRows: "auto auto auto",
    gap: 12,
    overflow: "hidden"
  },
  centerArena: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },
  centerPanel: {
    borderRadius: 3,
    width: "min(100%, 640px)",
    minHeight: 150,
    background: "linear-gradient(160deg, rgba(41, 34, 25, 0.92), rgba(8, 8, 7, 0.94))",
    border: `1px solid ${theme.line}`,
    boxShadow: "inset 0 0 42px rgba(0,0,0,0.74), 0 14px 28px rgba(0,0,0,0.48)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
    gap: 14,
    padding: 14
  },
  arenaSlot: {
    border: `1px solid ${theme.line}`,
    width: 170,
    minHeight: 94,
    borderRadius: 3,
    background: "linear-gradient(180deg, rgba(8, 8, 7, 0.94), rgba(38, 28, 19, 0.86))",
    color: "#efe0bf",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 13,
    textAlign: "center",
    padding: 8
  },
  drawDeckButton: {
    width: 122,
    minHeight: 152,
    borderRadius: 3,
    border: `1px solid rgba(240, 138, 53, 0.56)`,
    background: "radial-gradient(circle at 50% 24%, rgba(240, 138, 53, 0.38), transparent 38%), linear-gradient(160deg, #2d2116, #0b0907 78%)",
    color: "#f4e7c8",
    boxShadow: "inset 0 0 28px rgba(0,0,0,0.68), 0 10px 18px rgba(0,0,0,0.55)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    fontWeight: 800,
    cursor: "pointer",
    transition: "transform 130ms ease, filter 130ms ease"
  },
  deckActions: {
    display: "flex",
    alignItems: "center",
    gap: 8
  },
  skipTurnButton: {
    width: 40,
    height: 40,
    borderRadius: 3,
    border: `1px solid rgba(240, 138, 53, 0.62)`,
    background: `linear-gradient(160deg, ${theme.blood}, #2b0705)`,
    color: "#f4e7c8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    fontWeight: 900,
    lineHeight: 1,
    padding: 0,
    boxShadow: "inset 0 0 18px rgba(0,0,0,0.6), 0 8px 14px rgba(0,0,0,0.48)",
    cursor: "pointer",
    transition: "transform 130ms ease, filter 130ms ease"
  },
  playerBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    borderRadius: 2,
    background: "linear-gradient(90deg, rgba(11, 10, 8, 0.92), rgba(55, 41, 28, 0.76))",
    border: `1px solid ${theme.line}`,
    color: "#f4e7c8",
    padding: "7px 14px",
    fontSize: 13,
    marginBottom: 10,
    boxShadow: "0 4px 14px rgba(0,0,0,0.46)"
  },
  handRow: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 10,
    minHeight: 165,
    padding: "10px 8px"
  },
  opponentHand: {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 6,
    minHeight: 74
  },
  cardBack: {
    width: 56,
    height: 78,
    borderRadius: 3,
    border: `1px solid rgba(216, 201, 167, 0.58)`,
    background: "radial-gradient(circle at 50% 32%, rgba(240, 138, 53, 0.32), transparent 34%), linear-gradient(140deg, #282017, #060504)",
    color: "#d9c58e",
    fontWeight: 900,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "inset 0 0 20px rgba(0,0,0,0.72), 0 8px 14px rgba(0,0,0,0.46)"
  },
  cardButton: {
    width: 124,
    minHeight: 152,
    borderRadius: 3,
    border: `1px solid rgba(229, 208, 156, 0.62)`,
    color: "#f4e7c8",
    boxShadow: "inset 0 0 24px rgba(0,0,0,0.64), 0 13px 18px rgba(0,0,0,0.55)",
    padding: "8px 8px 12px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    transition: "transform 140ms ease, box-shadow 140ms ease, filter 140ms ease",
    transformOrigin: "center bottom"
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 11,
    opacity: 0.95,
    color: "#e7d5ad",
    textTransform: "uppercase"
  },
  cardMain: {
    fontWeight: 900,
    fontSize: 28,
    lineHeight: 1,
    textShadow: `0 0 10px ${theme.glow}, 0 2px 4px rgba(0,0,0,0.9)`
  },
  cardSub: {
    fontSize: 12,
    fontWeight: 700,
    opacity: 0.95
  },
  small: {
    fontSize: 12,
    opacity: 0.88
  },
  controls: {
    marginTop: 10,
    padding: 12,
    borderRadius: 4,
    background: theme.panel,
    border: `1px solid ${theme.line}`,
    display: "grid",
    gap: 10
  },
  actionCards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: 10,
    marginTop: 8
  },
  actionCardButton: {
    minHeight: 110,
    borderRadius: 3,
    border: `1px solid rgba(229, 208, 156, 0.58)`,
    color: "#f4e7c8",
    fontWeight: 800,
    boxShadow: "inset 0 0 22px rgba(0,0,0,0.62), 0 10px 16px rgba(0,0,0,0.45)",
    cursor: "pointer",
    transition: "transform 130ms ease, filter 130ms ease",
    padding: 10,
    display: "grid",
    gap: 4,
    textAlign: "left"
  },
  actionIcon: {
    fontSize: 24,
    lineHeight: 1
  },
  actionTitle: {
    fontSize: 13
  },
  actionSubtitle: {
    fontSize: 11,
    fontWeight: 700,
    opacity: 0.9
  },
  awaleBoard: {
    borderRadius: 4,
    background: "radial-gradient(circle at 50% 18%, rgba(156, 91, 38, 0.38), transparent 34%), linear-gradient(135deg, #2d2117, #6b4428 46%, #15100c)",
    border: `1px solid ${theme.line}`,
    boxShadow: "inset 0 0 46px rgba(0,0,0,0.66), 0 16px 30px rgba(0,0,0,0.52)",
    padding: 14,
    display: "grid",
    gap: 12,
    overflow: "hidden"
  },
  awaleRowWrap: {
    display: "grid",
    gap: 5
  },
  awaleRow: {
    display: "grid",
    gridTemplateColumns: "repeat(6, minmax(44px, 1fr))",
    gap: 10
  },
  awaleDirectionRow: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: 10,
    padding: "0 4%",
    color: "#e9d7ad",
    fontSize: 22,
    fontWeight: 900,
    lineHeight: 1,
    textShadow: "0 2px 5px rgba(0,0,0,0.38)",
    pointerEvents: "none"
  },
  awaleDirectionArrow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 22
  },
  awaleMiddleFlow: {
    display: "grid",
    gridTemplateColumns: "44px 1fr 44px",
    alignItems: "center",
    minHeight: 30,
    color: "#fff8dd",
    fontSize: 24,
    fontWeight: 900,
    textShadow: "0 2px 5px rgba(0,0,0,0.38)",
    pointerEvents: "none"
  },
  awaleTurnHint: {
    borderRadius: 12,
    background: "linear-gradient(90deg, rgba(55, 39, 25, 0.94), rgba(13, 11, 9, 0.94))",
    color: "#f4e7c8",
    border: `1px solid ${theme.line}`,
    padding: "8px 10px",
    textAlign: "center",
    fontWeight: 900,
    boxShadow: "0 8px 16px rgba(0,0,0,0.46)"
  },
  awalePit: {
    minHeight: 100,
    borderRadius: "999px",
    border: "1px solid rgba(216, 201, 167, 0.34)",
    background: "radial-gradient(circle at 50% 62%, #120d09 0%, #3b2819 48%, #76502d 100%)",
    color: "#fff8dd",
    boxShadow: "inset 0 14px 24px rgba(0,0,0,0.72), 0 8px 14px rgba(0,0,0,0.42)",
    fontWeight: 900,
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
    gap: 2,
    padding: 8,
    position: "relative",
    overflow: "hidden",
    transition: "transform 180ms ease, filter 180ms ease, opacity 180ms ease"
  },
  awaleSeedLayer: {
    position: "absolute",
    inset: 8,
    zIndex: 2,
    pointerEvents: "none"
  },
  awaleSeed: {
    position: "absolute",
    width: 14,
    height: 19,
    borderRadius: "55% 45% 52% 48%",
    background: "radial-gradient(circle at 34% 28%, #f8d890 0 13%, #b86b28 34%, #5a2d16 72%, #180b06 100%)",
    boxShadow: "inset -2px -3px 4px rgba(59, 27, 8, 0.45), inset 2px 2px 3px rgba(255,255,255,0.38), 0 2px 3px rgba(31, 13, 4, 0.42)",
    transformOrigin: "center"
  },
  awaleScoreBar: {
    borderRadius: 14,
    background: theme.panel,
    border: `1px solid ${theme.line}`,
    color: "#f4e7c8",
    padding: 10,
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
    fontWeight: 800
  },
  ruleBox: {
    borderRadius: 4,
    background: theme.panel,
    border: `1px solid ${theme.line}`,
    color: "#e7d5ad",
    padding: 12,
    display: "grid",
    gap: 6,
    fontSize: 13
  },
  twentyOneTargetPanel: {
    borderRadius: 4,
    background: "linear-gradient(135deg, rgba(62, 45, 27, 0.96), rgba(12, 10, 8, 0.96))",
    color: "#f4e7c8",
    padding: "12px 16px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 10,
    boxShadow: "inset 0 0 28px rgba(0,0,0,0.62), 0 12px 24px rgba(0,0,0,0.46)",
    border: `1px solid rgba(240, 138, 53, 0.5)`
  },
  twentyOneTargetMetric: {
    display: "grid",
    gap: 2,
    textAlign: "center"
  },
  twentyOneMetricValue: {
    fontSize: 30,
    fontWeight: 950,
    lineHeight: 1
  },
  log: {
    marginTop: 10,
    maxHeight: 180,
    overflow: "auto",
    borderRadius: 12,
    background: "rgba(4, 4, 3, 0.82)",
    border: `1px solid ${theme.line}`,
    color: "#e7d5ad",
    padding: 10,
    fontSize: 13
  },
  turnBox: {
    marginLeft: "auto",
    fontWeight: 700
  },
  modalBackdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(2, 2, 2, 0.82)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 30,
    padding: 12
  },
  modal: {
    width: "min(100%, 820px)",
    borderRadius: 4,
    background: "linear-gradient(160deg, rgba(48, 35, 23, 0.98), rgba(8, 7, 6, 0.98))",
    padding: 16,
    boxShadow: `inset 0 0 44px rgba(0,0,0,0.72), 0 18px 42px rgba(0,0,0,0.7), 0 0 36px ${theme.glow}`,
    border: `1px solid rgba(240, 138, 53, 0.56)`,
    color: "#f4e7c8"
  },
  modalCards: {
    marginTop: 10,
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center"
  },
  defenseToast: {
    position: "fixed",
    left: "50%",
    bottom: 16,
    transform: "translateX(-50%)",
    zIndex: 40,
    borderRadius: 3,
    border: `1px solid rgba(240, 138, 53, 0.62)`,
    background: `linear-gradient(135deg, ${theme.blood}, #1c0504)`,
    color: "#f4e7c8",
    fontWeight: 800,
    fontSize: 13,
    padding: "8px 12px",
    boxShadow: "0 10px 18px rgba(6, 10, 24, 0.35)",
    animation: "defense-toast-in 240ms ease-out"
  }
};

function friendlyDefenseName(defense) {
  const names = {
    dodge: "Esquive",
    block: "Blocage",
    counter_melee: "Contre mêlée",
    counter_magic: "Contre magie"
  };
  return names[defense] ?? defense;
}

function cardPalette(card) {
  if (card.type === "trump") return { bg: "linear-gradient(135deg, #151d44, #8d4dff)", icon: "♛" };
  if (card.type === "utility") return { bg: "linear-gradient(135deg, #7d4dff, #4c72ff)", icon: "★" };

  if (card.defense === "dodge") return { bg: "linear-gradient(135deg, #ff9d4d, #ff5858)", icon: "↺" };
  if (card.defense === "block") return { bg: "linear-gradient(135deg, #25ad63, #0b7b6a)", icon: "🛡" };
  if (card.defense === "counter_melee") return { bg: "linear-gradient(135deg, #ffd447, #ff8e32)", icon: "⚔" };
  if (card.defense === "counter_magic") return { bg: "linear-gradient(135deg, #00a0ff, #4a39ff)", icon: "✦" };

  return { bg: "linear-gradient(135deg, #6d7ea5, #43506c)", icon: "?" };
}

function cardLabel(card) {
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

function cardDetails(card) {
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
    if (card.action === "perfect_draw") return "Meilleure carte sûre vers la cible.";
    if (card.action === "refresh") return "Reset tes cartes numériques puis pioche 2.";
    if (card.action === "remove") return "Retire la dernière carte adverse.";
    if (card.action === "return") return "Retire ta dernière carte.";
    if (card.action === "exchange") return "Échange les dernières cartes.";
    if (card.action === "disservice") return "Force l'adversaire à piocher.";
    return "Trump Twenty One.";
  }
  if (card.type === "defense" && card.value) return `Réduction: ${card.value}`;
  if (card.type === "utility" && card.utility === "critical") return "Double les dégâts de ta prochaine attaque.";
  if (card.type === "utility" && card.utility === "vision") return "Révèle la main adverse pendant ce tour.";
  if (card.type === "utility" && card.utility === "steal") return "Vole une carte aléatoire dans la main ennemie.";
  return "";
}

function canDefenseCardAnswerAttack(card, attackType) {
  if (card.type !== "defense") return false;
  if (card.defense === "dodge" || card.defense === "block") return true;
  if (card.defense === "counter_melee") return attackType === "melee";
  if (card.defense === "counter_magic") return attackType === "magic";
  return false;
}

function attackCardTheme(attackType) {
  if (attackType === "ranged") return { bg: "linear-gradient(135deg, #ff6f4d, #ff3c6f)", icon: "➶", title: "Distance", die: "D4" };
  if (attackType === "magic") return { bg: "linear-gradient(135deg, #2da9ff, #5a46ff)", icon: "✦", title: "Magie", die: "D6" };
  return { bg: "linear-gradient(135deg, #ffd447, #ff8e32)", icon: "⚔", title: "Mêlée", die: "D8" };
}

function soulsCardPalette(card) {
  if (card.type === "trump") return { bg: "radial-gradient(circle at 50% 20%, rgba(240, 138, 53, 0.38), transparent 36%), linear-gradient(160deg, #3a2414, #080706 78%)", icon: "♛" };
  if (card.type === "utility") return { bg: "radial-gradient(circle at 50% 22%, rgba(167, 139, 89, 0.28), transparent 38%), linear-gradient(160deg, #2e261c, #0a0907 78%)", icon: "✦" };

  if (card.defense === "dodge") return { bg: "linear-gradient(160deg, #5b2b19, #110b08 78%)", icon: "↺" };
  if (card.defense === "block") return { bg: "linear-gradient(160deg, #3a392f, #0a0907 78%)", icon: "♜" };
  if (card.defense === "counter_melee") return { bg: "linear-gradient(160deg, #6c411f, #120a05 78%)", icon: "⚔" };
  if (card.defense === "counter_magic") return { bg: "linear-gradient(160deg, #2e3140, #08080b 78%)", icon: "✦" };

  return { bg: "linear-gradient(160deg, #332c23, #090806 78%)", icon: "?" };
}

function soulsAttackCardTheme(attackType) {
  if (attackType === "ranged") return { bg: "linear-gradient(160deg, #553322, #110907 78%)", icon: "➶", title: "Distance", die: "D4" };
  if (attackType === "magic") return { bg: "linear-gradient(160deg, #2b2d3a, #08080b 78%)", icon: "✦", title: "Magie", die: "D6" };
  return { bg: "linear-gradient(160deg, #6b3f1b, #100805 78%)", icon: "⚔", title: "MÃªlÃ©e", die: "D8" };
}

function previewCardFromVision(rawCard) {
  if (!rawCard) return null;
  if (typeof rawCard === "object" && rawCard.type) return rawCard;
  if (typeof rawCard !== "string") return null;
  const [type, detail] = rawCard.split(":");
  if (!type || !detail) return null;
  if (type === "defense") return { type, defense: detail };
  if (type === "utility") return { type, utility: detail };
  return null;
}

function getAwaleRowsForViewer(state, me) {
  if (!state?.awale?.board || !me) return { myRow: [], opponentRow: [] };
  const mySide = me.awaleSide;
  const opponentSide = mySide === 0 ? 1 : 0;
  const sideIndexes = (side) => (side === 0 ? [0, 1, 2, 3, 4, 5] : [6, 7, 8, 9, 10, 11]);
  return {
    myRow: sideIndexes(mySide),
    opponentRow: [...sideIndexes(opponentSide)].reverse()
  };
}


const AWALE_SEED_POSITIONS = [
  [48, 44, -18], [36, 56, 18], [59, 58, 43], [63, 36, -35], [26, 41, 55], [43, 29, 7],
  [72, 49, 71], [30, 65, -62], [52, 69, 12], [20, 52, 27], [78, 36, -12], [38, 76, -28],
  [58, 22, 31], [68, 68, -51], [24, 28, -7], [47, 83, 48], [83, 55, 16], [16, 68, -39],
  [34, 19, 66], [74, 22, -66], [55, 50, 4], [42, 63, -47], [66, 80, 39], [18, 38, 13],
  [88, 44, -27], [29, 82, 24], [50, 14, -44], [12, 54, 61], [61, 91, -5], [76, 72, 52],
  [22, 16, -18], [86, 66, 28], [40, 90, -70], [11, 78, 42], [91, 29, -4], [32, 50, -52],
  [70, 13, 19], [49, 37, -73], [58, 74, 74], [26, 72, 8], [79, 87, -36], [17, 24, 36],
  [93, 77, 60], [7, 43, -21], [36, 7, 50], [64, 6, -58], [4, 67, 16], [96, 52, -48]
];

function getAwaleSeedStyle(seedIndex, seedCount, isMobile, isAnimated) {
  const [x, y, rotation] = AWALE_SEED_POSITIONS[seedIndex % AWALE_SEED_POSITIONS.length];
  const ring = Math.floor(seedIndex / AWALE_SEED_POSITIONS.length);
  const scale = Math.max(0.64, (isMobile ? 0.78 : 1) - ring * 0.08 - Math.max(0, seedCount - 18) * 0.006);
  return {
    ...styles.awaleSeed,
    width: isMobile ? 11 : styles.awaleSeed.width,
    height: isMobile ? 15 : styles.awaleSeed.height,
    left: `${x}%`,
    top: `${y}%`,
    transform: `translate(-50%, -50%) rotate(${rotation + ring * 23}deg) scale(${scale})`,
    zIndex: seedIndex,
    animation: isAnimated ? `awale-seed-drop 420ms ease-out ${Math.min(seedIndex, 12) * 22}ms both` : undefined
  };
}

function AwaleDirectionRow({ direction, isMobilePortrait, isMobileLandscape }) {
  const arrow = direction === "left" ? "←" : "→";
  return (
    <div
      style={{
        ...styles.awaleDirectionRow,
        gap: isMobilePortrait ? 4 : isMobileLandscape ? 8 : styles.awaleDirectionRow.gap,
        fontSize: isMobilePortrait ? 18 : styles.awaleDirectionRow.fontSize,
        minHeight: isMobilePortrait ? 16 : undefined,
        padding: isMobilePortrait ? "0 6%" : styles.awaleDirectionRow.padding
      }}
      aria-hidden="true"
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={`${direction}-${index}`} style={styles.awaleDirectionArrow}>
          {arrow}
        </span>
      ))}
    </div>
  );
}

function AwaleMiddleFlow({ isMobilePortrait }) {
  return (
    <div
      style={{
        ...styles.awaleMiddleFlow,
        gridTemplateColumns: isMobilePortrait ? "32px 1fr 32px" : styles.awaleMiddleFlow.gridTemplateColumns,
        minHeight: isMobilePortrait ? 22 : styles.awaleMiddleFlow.minHeight,
        fontSize: isMobilePortrait ? 19 : styles.awaleMiddleFlow.fontSize
      }}
      aria-label="Le semis suit le bas vers la droite, remonte, puis revient vers la gauche en haut."
    >
      <span style={{ textAlign: "center" }}>↓</span>
      <span />
      <span style={{ textAlign: "center" }}>↑</span>
    </div>
  );
}

function AwalePit({ pitIndex, seedCount, isMobile, isMobilePortrait, isMobileLandscape, isLegal, isMyTurn, isDisabled, lastMove, onPlay, isOpponent }) {
  const isSource = lastMove?.fromPit === pitIndex;
  const sowStep = lastMove?.sowPath?.lastIndexOf(pitIndex) ?? -1;
  const isSown = sowStep >= 0;
  const isCaptured = lastMove?.capturedPits?.includes(pitIndex);
  const isLastPit = lastMove?.lastPit === pitIndex;
  const animationName = isCaptured ? "awale-capture-pulse" : isSource ? "awale-source-lift" : isSown || isLastPit ? "awale-pit-pulse" : undefined;

  return (
    <button
      type="button"
      onClick={onPlay}
      disabled={isDisabled}
      style={{
        ...styles.awalePit,
        minHeight: isMobilePortrait ? 58 : isMobile ? 72 : isMobileLandscape ? 116 : styles.awalePit.minHeight,
        aspectRatio: isMobilePortrait ? "1 / 1.08" : isMobileLandscape ? "1.18 / 1" : undefined,
        padding: isMobilePortrait ? 5 : styles.awalePit.padding,
        outline: isLegal && isMyTurn ? "3px solid #fff78a" : "none",
        opacity: isDisabled ? (isOpponent ? 0.88 : 0.68) : 1,
        cursor: isDisabled ? "default" : "pointer",
        transform: isLegal && isMyTurn && !isDisabled ? "translateY(-2px)" : undefined,
        filter: isCaptured ? "brightness(1.18) saturate(1.2)" : undefined,
        animation: animationName ? `${animationName} 560ms ease-out` : undefined,
        animationDelay: isSown ? `${Math.min(sowStep, 14) * 42}ms` : undefined
      }}
      aria-label={`Trou ${pitIndex + 1}, ${seedCount} graine${seedCount > 1 ? "s" : ""}`}
    >
      <span
        style={{
          ...styles.awaleSeedLayer,
          inset: isMobilePortrait ? 5 : styles.awaleSeedLayer.inset
        }}
        aria-hidden="true"
      >
        {Array.from({ length: seedCount }).map((_, seedIndex) => (
          <span
            key={`${pitIndex}-${lastMove?.id ?? "initial"}-${seedIndex}`}
            style={getAwaleSeedStyle(seedIndex, seedCount, isMobile, isSown || isSource || isCaptured)}
          />
        ))}
      </span>
    </button>
  );
}

function App() {
  const [name, setName] = React.useState("Joueur");
  const [code, setCode] = React.useState("");
  const [gameType, setGameType] = React.useState("card_duel");
  const [roomAction, setRoomAction] = React.useState("create");
  const [state, setState] = React.useState(null);
  const [error, setError] = React.useState("");
  const [activeCardId, setActiveCardId] = React.useState(null);
  const [defenseToast, setDefenseToast] = React.useState("");
  const [trumpPopup, setTrumpPopup] = React.useState(null);
  const getViewportState = React.useCallback(() => ({
    width: window.innerWidth,
    height: window.innerHeight
  }), []);
  const [viewport, setViewport] = React.useState(getViewportState);

  React.useEffect(() => {
    const onResize = () => setViewport(getViewportState());
    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    onResize();
    return () => {
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
    };
  }, [getViewportState]);

  const isMobile = viewport.width <= 700;
  const isMobilePortrait = isMobile && viewport.height >= viewport.width;
  const isMobileLandscape = viewport.width <= 950 && viewport.height <= 520 && viewport.width > viewport.height;

  React.useEffect(() => {
    const onRoomState = (nextState) => {
      setState(nextState);
      setError("");
    };

    const onGameError = (e) => {
      setError(e?.message ?? "Erreur inconnue.");
    };

    socket.on("room:state", onRoomState);
    socket.on("game:error", onGameError);

    return () => {
      socket.off("room:state", onRoomState);
      socket.off("game:error", onGameError);
    };
  }, []);

  const me = React.useMemo(() => {
    if (!state) return null;
    return state.players.find((p) => p.hand);
  }, [state]);

  const opponents = React.useMemo(() => {
    if (!state || !me) return [];
    return state.players.filter((p) => p.id !== me.id);
  }, [state, me]);

  const pendingAttack = state?.pendingAttack;
  const isMyTurn = Boolean(state && me && state.turnPlayerId === me.id);
  const isMyDefenseTurn = Boolean(pendingAttack && me && pendingAttack.targetId === me.id);
  const isLobbyPhase = state?.phase === "lobby";
  const isAwaleGame = state?.gameType === "awale";
  const isTwentyOneGame = state?.gameType === "twenty_one";
  const isHost = Boolean(state && me && state.hostPlayerId === me.id);
  const selectedMode = GAME_CHOICES.find((choice) => choice.id === gameType) ?? GAME_CHOICES[0];
  const defenseCards = React.useMemo(
    () => me?.hand?.filter((c) => c.type === "defense") ?? [],
    [me]
  );

  const validDefenseCards = React.useMemo(() => {
    if (!pendingAttack) return [];
    return defenseCards.filter((card) => canDefenseCardAnswerAttack(card, pendingAttack.card.type));
  }, [defenseCards, pendingAttack]);

  const invalidDefenseCards = React.useMemo(() => {
    if (!pendingAttack) return [];
    return defenseCards.filter((card) => !canDefenseCardAnswerAttack(card, pendingAttack.card.type));
  }, [defenseCards, pendingAttack]);

  const awaleRows = React.useMemo(() => getAwaleRowsForViewer(state, me), [state, me]);

  React.useEffect(() => {
    if (!me) {
      setActiveCardId(null);
      return;
    }

    if (!me.hand.some((card) => card.id === activeCardId)) {
      setActiveCardId(null);
    }
  }, [me, activeCardId]);

  React.useEffect(() => {
    const lastLog = state?.log?.[state.log.length - 1];
    if (!lastLog) return;

    if (["counter", "counter_fail", "attack_resolved"].includes(lastLog.type)) {
      setDefenseToast(lastLog.message);
      const timer = setTimeout(() => setDefenseToast(""), 1800);
      return () => clearTimeout(timer);
    }
  }, [state?.log]);

  React.useEffect(() => {
    const lastLog = state?.log?.[state.log.length - 1];
    if (lastLog?.type !== "twenty_one_trump") return;

    setTrumpPopup(lastLog);
    const timer = setTimeout(() => setTrumpPopup(null), 3200);
    return () => clearTimeout(timer);
  }, [state?.log]);

  function ensureConnection() {
    if (!socket.connected) socket.connect();
  }

  function handleCreateRoom() {
    ensureConnection();
    setError("");
    socket.emit("room:create", { playerName: name.trim() || "Joueur", gameType });
  }

  function handleJoinRoom() {
    ensureConnection();
    setError("");
    socket.emit("room:join", {
      code: code.trim().toUpperCase(),
      playerName: name.trim() || "Joueur"
    });
  }

  function handleStartGame() {
    if (!state) return;
    socket.emit("game:start", { code: state.code });
  }

  function handleEndTurnFromSkipIcon() {
    socket.emit("turn:end", { source: "skip_icon_button" });
  }

  function playCard(cardId, targetPlayerId) {
    socket.emit("card:play", { cardId, targetPlayerId });
    setActiveCardId(null);
  }

  function attack(attackType) {
    socket.emit("combat:attack", { attackType, targetPlayerId: opponents[0]?.id });
  }

  function drawCard() {
    socket.emit("turn:draw");
  }

  function defend(defenseCardId) {
    socket.emit("combat:defend", { defenseCardId });
  }

  function defendWithoutCard() {
    socket.emit("combat:defend", {});
  }

  function playAwalePit(pitIndex) {
    socket.emit("awale:move", { pitIndex });
  }

  function drawTwentyOneNumber() {
    socket.emit("twentyone:draw-number");
  }

  function standTwentyOne() {
    socket.emit("twentyone:stand");
  }

  function playTwentyOneTrump(cardId) {
    socket.emit("twentyone:play-trump", { cardId });
    setActiveCardId(null);
  }

  function abortCurrentGame() {
    socket.emit("game:abort");
  }

  function handleCardClick(card) {
    if (activeCardId === card.id) {
      if (card.type === "trump" && isTwentyOneGame && state?.phase !== "finished") {
        playTwentyOneTrump(card.id);
      } else if (card.type === "utility" && isMyTurn && !pendingAttack) {
        playCard(card.id, opponents[0]?.id);
      } else {
        setActiveCardId(null);
      }
      return;
    }

    setActiveCardId(card.id);
  }

  return (
    <main style={{ ...styles.page, padding: isMobilePortrait ? 0 : isMobile ? 6 : isMobileLandscape ? 4 : styles.page.padding }}>
      <style>{`
        html, body, #root { margin: 0; min-height: 100%; width: 100%; }
        body { overflow-x: hidden; background: #030302; }
        * { box-sizing: border-box; }
        button, input { font: inherit; max-width: 100%; }
        button {
          border-radius: 3px;
          border: 1px solid rgba(216, 201, 167, 0.42);
          background: linear-gradient(180deg, rgba(54, 40, 25, 0.98), rgba(13, 11, 9, 0.98));
          color: #f4e7c8;
          padding: 8px 12px;
          cursor: pointer;
          box-shadow: inset 0 0 18px rgba(0, 0, 0, 0.58), 0 8px 14px rgba(0, 0, 0, 0.32);
          letter-spacing: 0;
        }
        button:hover:not(:disabled) {
          border-color: rgba(240, 138, 53, 0.72);
          filter: brightness(1.08);
        }
        button:disabled {
          cursor: not-allowed;
          filter: grayscale(0.7);
        }
        input {
          border-radius: 3px;
          border: 1px solid rgba(216, 201, 167, 0.42);
          background: rgba(5, 4, 3, 0.84);
          color: #f4e7c8;
          padding: 9px 11px;
          box-shadow: inset 0 0 18px rgba(0, 0, 0, 0.62);
        }
        input::placeholder { color: rgba(216, 201, 167, 0.62); }
        strong { color: #f2dfb8; }
        .souls-frame::before,
        .souls-frame::after {
          content: "";
          position: absolute;
          width: 44px;
          height: 44px;
          border-color: rgba(222, 196, 132, 0.5);
          pointer-events: none;
        }
        .souls-frame::before {
          left: 9px;
          top: 9px;
          border-left: 1px solid;
          border-top: 1px solid;
          box-shadow: -5px -5px 0 -4px rgba(222, 196, 132, 0.5);
        }
        .souls-frame::after {
          right: 9px;
          bottom: 9px;
          border-right: 1px solid;
          border-bottom: 1px solid;
          box-shadow: 5px 5px 0 -4px rgba(222, 196, 132, 0.5);
        }
        .menu-row:hover:not(:disabled),
        .menu-row:focus-visible,
        .menu-field:focus-within {
          background: linear-gradient(90deg, rgba(116, 56, 20, 0.72), rgba(64, 30, 13, 0.36) 62%, transparent);
          color: #fff0c9;
          outline: none;
          filter: none;
        }
        .menu-row:disabled {
          color: rgba(216, 201, 167, 0.35);
          cursor: not-allowed;
        }
        .menu-action {
          grid-template-columns: minmax(130px, 1fr) minmax(110px, auto);
        }
        .menu-input:focus {
          border-bottom-color: rgba(240, 138, 53, 0.9);
        }
        @media (max-width: 700px) and (orientation: portrait) {
          button { min-height: 40px; }
          input { min-height: 40px; width: 100%; }
          .menu-row {
            grid-template-columns: 1fr;
            gap: 4px;
          }
        }
        @keyframes defense-pop {
          0% { transform: scale(0.92) translateY(12px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes defense-toast-in {
          0% { transform: translateX(-50%) translateY(10px); opacity: 0; }
          100% { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
        @keyframes trump-popup-pop {
          0% { transform: translateY(14px) scale(0.9); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes awale-seed-drop {
          0% { opacity: 0; transform: translate(-50%, -80%) rotate(var(--seed-rotation, 0deg)) scale(0.35); }
          68% { opacity: 1; transform: translate(-50%, -43%) rotate(var(--seed-rotation, 0deg)) scale(1.12); }
          100% { opacity: 1; }
        }
        @keyframes awale-pit-pulse {
          0% { transform: scale(1); box-shadow: inset 0 10px 18px rgba(0,0,0,0.34), 0 6px 12px rgba(35, 18, 5, 0.28); }
          45% { transform: scale(1.045); box-shadow: inset 0 10px 18px rgba(0,0,0,0.24), 0 0 0 6px rgba(255,247,138,0.28), 0 10px 18px rgba(35, 18, 5, 0.34); }
          100% { transform: scale(1); }
        }
        @keyframes awale-source-lift {
          0% { transform: translateY(0) scale(1); }
          35% { transform: translateY(-7px) scale(1.035); filter: brightness(1.16); }
          100% { transform: translateY(0) scale(1); }
        }
        @keyframes awale-capture-pulse {
          0% { transform: scale(1); }
          45% { transform: scale(0.94); box-shadow: inset 0 10px 18px rgba(0,0,0,0.22), 0 0 0 7px rgba(255,108,88,0.36), 0 10px 18px rgba(35, 18, 5, 0.34); }
          100% { transform: scale(1); }
        }
      `}</style>
      <div
        style={{
          ...styles.panel,
          maxWidth: isMobilePortrait || isMobileLandscape ? "none" : styles.panel.maxWidth,
          margin: isMobilePortrait ? 0 : styles.panel.margin,
          width: "100%"
        }}
      >
        {!state && (
          <section className="souls-frame" style={{ ...styles.homeCard, borderRadius: isMobilePortrait ? 0 : styles.homeCard.borderRadius, padding: isMobilePortrait ? 16 : styles.homeCard.padding }}>
            <header style={styles.menuHeader}>
              <h1 style={styles.menuTitle}>Salle de jeux</h1>
              <span style={styles.menuSubtitle}>
                Cree une room ou rejoins une room existante. Mode choisi: {selectedMode.title}.
              </span>
            </header>

            <section style={styles.menuSection}>
              <div style={styles.menuSectionTitle}>Joueur</div>
              <label className="menu-field" style={styles.menuRow}>
                <span style={styles.menuLabel}>Nom du joueur</span>
                <input
                  className="menu-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Joueur"
                  style={styles.menuInput}
                />
              </label>
            </section>

            <section style={styles.menuActions}>
              <div style={styles.menuSectionTitle}>Actions</div>
              <button
                className="menu-row menu-action"
                type="button"
                onClick={() => setRoomAction("create")}
                style={{
                  ...styles.menuRow,
                  ...styles.menuButtonRow,
                  ...(roomAction === "create" ? styles.menuRowSelected : null)
                }}
              >
                <span style={styles.menuLabel}>Creer une room</span>
                <span style={styles.menuValue}>{roomAction === "create" ? "Sélectionné" : ""}</span>
              </button>
              <button
                className="menu-row menu-action"
                type="button"
                onClick={() => setRoomAction("join")}
                style={{
                  ...styles.menuRow,
                  ...styles.menuButtonRow,
                  ...(roomAction === "join" ? styles.menuRowSelected : null)
                }}
              >
                <span style={styles.menuLabel}>Rejoindre</span>
                <span style={styles.menuValue}>{roomAction === "join" ? "Sélectionné" : ""}</span>
              </button>
            </section>

            {roomAction === "create" ? (
              <section style={styles.menuSection}>
                <div style={styles.menuSectionTitle}>Mode de jeu</div>
                {GAME_CHOICES.map((choice) => {
                  const isSelected = gameType === choice.id;
                  return (
                    <button
                      key={choice.id}
                      className="menu-row"
                      type="button"
                      onClick={() => setGameType(choice.id)}
                      style={{
                        ...styles.menuRow,
                        ...styles.menuButtonRow,
                        alignItems: isSelected ? "start" : styles.menuRow.alignItems,
                        ...(isSelected ? styles.menuRowSelected : null)
                      }}
                    >
                      <span style={{ ...styles.menuLabel, display: "grid", gap: 3 }}>
                        <span>{choice.title}</span>
                        {isSelected && <span style={styles.menuDescription}>{choice.desc}</span>}
                      </span>
                      <span style={styles.menuValue}>{isSelected ? "Sélectionné" : ""}</span>
                    </button>
                  );
                })}
              </section>
            ) : (
              <section style={styles.menuSection}>
                <div style={styles.menuSectionTitle}>Connexion / room</div>
                <label className="menu-field" style={styles.menuRow}>
                  <span style={styles.menuLabel}>Code room</span>
                  <input
                    className="menu-input"
                    value={code}
                    placeholder="____"
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    style={styles.menuInput}
                  />
                </label>
              </section>
            )}

            <button
              className="menu-row menu-action"
              type="button"
              onClick={roomAction === "create" ? handleCreateRoom : handleJoinRoom}
              style={{ ...styles.menuRow, ...styles.menuButtonRow, ...styles.validateButton }}
            >
              Valider
            </button>

            {/* Legacy menu removed from display after the action-first flow. */}
            <section style={{ display: "none" }}>
              <div style={styles.menuSectionTitle}>Mode de jeu</div>
              {GAME_CHOICES.map((choice) => {
                const isSelected = gameType === choice.id;
                return (
                  <button
                    key={choice.id}
                    className="menu-row"
                    type="button"
                    onClick={() => setGameType(choice.id)}
                    style={{
                      ...styles.menuRow,
                      ...styles.menuButtonRow,
                      ...(isSelected ? styles.menuRowSelected : null)
                    }}
                  >
                    <span style={styles.menuLabel}>{choice.title}</span>
                    <span style={styles.menuValue}>{isSelected ? "Selectionne" : ""}</span>
                  </button>
                );
              })}
              <span style={styles.menuDescription}>{selectedMode.desc}</span>
            </section>

            <section style={{ display: "none" }}>
              <div style={styles.menuSectionTitle}>Connexion / room</div>
              <label className="menu-field" style={styles.menuRow}>
                <span style={styles.menuLabel}>Code room</span>
                <input
                  className="menu-input"
                  value={code}
                  placeholder="____"
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  style={styles.menuInput}
                />
              </label>
            </section>

            <section style={{ display: "none" }}>
              <div style={styles.menuSectionTitle}>Actions</div>
              <button className="menu-row menu-action" type="button" onClick={handleCreateRoom} style={{ ...styles.menuRow, ...styles.menuButtonRow }}>
                <span style={styles.menuLabel}>Creer une room</span>
                <span style={styles.menuValue}>{selectedMode.title}</span>
              </button>
              <button className="menu-row menu-action" type="button" onClick={handleJoinRoom} style={{ ...styles.menuRow, ...styles.menuButtonRow }}>
                <span style={styles.menuLabel}>Rejoindre</span>
                <span style={styles.menuValue}>{code || "Code requis"}</span>
              </button>
              <div style={styles.menuActionHint}>
                <span>Entrer: valider la ligne active</span>
                <span>Selection: orange-brun</span>
              </div>
            </section>
            <div style={{ display: "none" }}>
            <strong style={{ fontSize: 20 }}>Salle de jeux</strong>
            <span>Crée une room ou rejoins une room existante, puis joue au duel de cartes ou à l'Awalé.</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Pseudo" />
            <div style={styles.gameChoice}>
              {[
                { id: "card_duel", title: "Duel de cartes", desc: "Le combat temps réel existant." },
                { id: "awale", title: "Awalé classique", desc: "12 trous, 48 graines, captures par 2 ou 3." },
                { id: "twenty_one", title: "Twenty One", desc: "Approche la cible, joue des Trumps, protège tes 3 vies." }
              ].map((choice) => (
                <button
                  key={choice.id}
                  type="button"
                  onClick={() => setGameType(choice.id)}
                  style={{
                    ...styles.gameChoiceButton,
                    border: gameType === choice.id ? "1px solid rgba(240, 138, 53, 0.86)" : styles.gameChoiceButton.border,
                    boxShadow: gameType === choice.id ? `0 0 0 2px rgba(240, 138, 53, 0.18), inset 0 0 28px ${theme.glow}` : "none"
                  }}
                >
                  <strong>{choice.title}</strong>
                  <span style={styles.small}>{choice.desc}</span>
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", width: "100%" }}>
              <button style={{ flex: isMobilePortrait ? "1 1 100%" : undefined }} onClick={handleCreateRoom}>Créer une room {gameType === "awale" ? "Awalé" : gameType === "twenty_one" ? "Twenty One" : "Duel"}</button>
              <input
                value={code}
                placeholder="Code room"
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                style={{ flex: isMobilePortrait ? "1 1 54%" : undefined }}
              />
              <button style={{ flex: isMobilePortrait ? "1 1 38%" : undefined }} onClick={handleJoinRoom}>Rejoindre</button>
            </div>
            </div>
          </section>
        )}

        {state && isLobbyPhase && (
          <section className="souls-frame" style={{ ...styles.homeCard, borderRadius: isMobilePortrait ? 0 : styles.homeCard.borderRadius, padding: isMobilePortrait ? 16 : styles.homeCard.padding }}>
            <header style={styles.menuHeader}>
              <h1 style={styles.menuTitle}>Lobby</h1>
              <span style={styles.menuSubtitle}>
                Room {state.code}. {state.gameType === "awale" ? "Awale classique" : state.gameType === "twenty_one" ? "Twenty One" : "Duel de cartes"}. En attente des joueurs.
              </span>
            </header>

            <section style={styles.menuSection}>
              <div style={styles.menuSectionTitle}>Joueurs</div>
              {state.players.map((player) => (
                <div
                  key={player.id}
                  className="menu-row"
                  style={{
                    ...styles.menuRow,
                    ...(player.id === state.hostPlayerId ? styles.menuRowSelected : null)
                  }}
                >
                  <span style={styles.menuLabel}>{player.name}</span>
                  <span style={styles.menuValue}>{player.id === state.hostPlayerId ? "Hote" : "Invite"}</span>
                </div>
              ))}
              {state.players.length < 2 && (
                <div className="menu-row" style={{ ...styles.menuRow, color: "rgba(216, 201, 167, 0.48)" }}>
                  <span style={styles.menuLabel}>Emplacement libre</span>
                  <span style={styles.menuValue}>En attente</span>
                </div>
              )}
            </section>

            <section style={styles.menuActions}>
              <div style={styles.menuSectionTitle}>Actions</div>
              {isHost ? (
                <button
                  className="menu-row menu-action"
                  type="button"
                  onClick={handleStartGame}
                  disabled={state.players.length < 2}
                  style={{ ...styles.menuRow, ...styles.menuButtonRow }}
                >
                  <span style={styles.menuLabel}>Demarrer</span>
                  <span style={styles.menuValue}>{state.players.length < 2 ? "Deux joueurs requis" : "Pret"}</span>
                </button>
              ) : (
                <div className="menu-row" style={{ ...styles.menuRow, color: "rgba(216, 201, 167, 0.58)" }}>
                  <span style={styles.menuLabel}>Demarrer</span>
                  <span style={styles.menuValue}>Reserve a l'hote</span>
                </div>
              )}
            </section>
            <div style={{ display: "none" }}>
            <strong style={{ fontSize: 20 }}>Lobby</strong>
            <p style={{ margin: 0 }}>
              Room <strong>{state.code}</strong> · {state.gameType === "awale" ? "Awalé classique" : state.gameType === "twenty_one" ? "Twenty One" : "Duel de cartes"} · En attente des joueurs.
            </p>
            <ul style={styles.lobbyPlayers}>
              {state.players.map((player) => (
                <li key={player.id} style={styles.lobbyPlayerItem}>
                  {player.name} {player.id === state.hostPlayerId ? "(hôte)" : ""}
                </li>
              ))}
            </ul>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              {isHost ? (
                <button onClick={handleStartGame} disabled={state.players.length < 2}>
                  Démarrer
                </button>
              ) : (
                <span>Seul l'hôte peut lancer la partie.</span>
              )}
              {state.players.length < 2 && <span>Il faut 2 joueurs pour démarrer.</span>}
            </div>
            </div>
          </section>
        )}

        {state && !isLobbyPhase && isAwaleGame && (
          <section style={{ display: "grid", gap: isMobilePortrait ? 8 : 10, width: "100%" }}>
            <div
              style={{
                ...styles.awaleScoreBar,
                padding: isMobilePortrait ? 8 : styles.awaleScoreBar.padding,
                gap: isMobilePortrait ? 6 : styles.awaleScoreBar.gap,
                fontSize: isMobilePortrait ? 13 : undefined
              }}
            >
              {state.players.map((player) => (
                <span key={player.id}>
                  {player.name}: {state.awale?.captured?.[player.awaleSide] ?? 0} graine(s) capturée(s)
                  {state.turnPlayerId === player.id && state.phase !== "finished" ? " · à jouer" : ""}
                </span>
              ))}
              <button onClick={abortCurrentGame} disabled={state.phase === "finished"}>Abandonner</button>
            </div>

            <div
              style={{
                ...styles.awaleTurnHint,
                fontSize: isMobilePortrait ? 13 : 15,
                padding: isMobilePortrait ? "7px 8px" : styles.awaleTurnHint.padding
              }}
            >
              {isMyTurn && state.phase !== "finished" ? "À toi de jouer : choisis un trou de ton camp." : state.phase === "finished" ? "Partie terminée." : "Tour adverse."}
            </div>

            <div
              style={{
                ...styles.awaleBoard,
                borderRadius: isMobilePortrait ? 18 : styles.awaleBoard.borderRadius,
                padding: isMobilePortrait ? 6 : isMobile ? 10 : isMobileLandscape ? 8 : styles.awaleBoard.padding,
                gap: isMobilePortrait ? 5 : isMobileLandscape ? 10 : styles.awaleBoard.gap
              }}
            >
              <div style={{ ...styles.awaleRowWrap, gap: isMobilePortrait ? 3 : styles.awaleRowWrap.gap }}>
                <AwaleDirectionRow direction="left" isMobilePortrait={isMobilePortrait} isMobileLandscape={isMobileLandscape} />
                <div
                  style={{
                    ...styles.awaleRow,
                    gridTemplateColumns: isMobilePortrait ? "repeat(6, minmax(0, 1fr))" : styles.awaleRow.gridTemplateColumns,
                    gap: isMobilePortrait ? 3 : isMobileLandscape ? 12 : styles.awaleRow.gap
                  }}
                >
                  {awaleRows.opponentRow.map((pitIndex) => (
                    <AwalePit
                      key={pitIndex}
                      pitIndex={pitIndex}
                      seedCount={state.awale.board[pitIndex]}
                      isMobile={isMobile}
                      isMobilePortrait={isMobilePortrait}
                      isMobileLandscape={isMobileLandscape}
                      isLegal={false}
                      isMyTurn={false}
                      isDisabled
                      isOpponent
                      lastMove={state.awale.lastMove}
                    />
                  ))}
                </div>
              </div>

              <AwaleMiddleFlow isMobilePortrait={isMobilePortrait} />

              <div style={{ ...styles.awaleRowWrap, gap: isMobilePortrait ? 3 : styles.awaleRowWrap.gap }}>
                <div
                  style={{
                    ...styles.awaleRow,
                    gridTemplateColumns: isMobilePortrait ? "repeat(6, minmax(0, 1fr))" : styles.awaleRow.gridTemplateColumns,
                    gap: isMobilePortrait ? 3 : isMobileLandscape ? 12 : styles.awaleRow.gap
                  }}
                >
                  {awaleRows.myRow.map((pitIndex) => {
                    const isLegal = state.awale?.legalMoves?.includes(pitIndex);
                    return (
                      <AwalePit
                        key={pitIndex}
                        pitIndex={pitIndex}
                        seedCount={state.awale.board[pitIndex]}
                        isMobile={isMobile}
                        isMobilePortrait={isMobilePortrait}
                        isMobileLandscape={isMobileLandscape}
                        isLegal={isLegal}
                        isMyTurn={isMyTurn}
                        isDisabled={!isMyTurn || state.phase === "finished" || !isLegal}
                        lastMove={state.awale.lastMove}
                        onPlay={() => playAwalePit(pitIndex)}
                      />
                    );
                  })}
                </div>
                <AwaleDirectionRow direction="right" isMobilePortrait={isMobilePortrait} isMobileLandscape={isMobileLandscape} />
              </div>
            </div>

            <section
              style={{
                ...styles.ruleBox,
                padding: isMobilePortrait ? 10 : styles.ruleBox.padding,
                fontSize: isMobilePortrait ? 12 : styles.ruleBox.fontSize
              }}
            >
              <strong>Règles Awalé classique intégrées</strong>
              <span>Chaque joueur sème depuis ses 6 trous. Une dernière graine chez l'adversaire capture le trou s'il contient 2 ou 3 graines, puis les trous précédents valides.</span>
              <span>Un Kroo (plus de 11 graines) saute toujours le trou de départ. Les coups qui affament l'adversaire sont bloqués. Les boucles terminent la partie sans capturer les graines restantes.</span>
              {state.phase === "finished" && (
                <strong>
                  {state.awale?.winnerSide === null
                    ? "Égalité."
                    : `${state.players.find((player) => player.awaleSide === state.awale?.winnerSide)?.name} gagne.`}
                </strong>
              )}
            </section>
          </section>
        )}


        {state && !isLobbyPhase && isTwentyOneGame && (
          <section style={{ display: "grid", gap: isMobilePortrait ? 8 : 12, width: "100%" }}>
            <div style={{ ...styles.awaleScoreBar, alignItems: "center" }}>
              <strong>Twenty One · Manche {state.twentyOne?.round}</strong>
              <span>Actions libres : pas de gestion des tours.</span>
              <span>Trumps initiaux uniquement : {me?.hand?.length ?? 0}/3 en main</span>
              <button onClick={abortCurrentGame} disabled={state.phase === "finished"}>Abandonner</button>
            </div>

            <div style={styles.twentyOneTargetPanel}>
              <div style={styles.twentyOneTargetMetric}>
                <span>Numéro requis / cible</span>
                <strong style={styles.twentyOneMetricValue}>{state.twentyOne?.target}</strong>
              </div>
              <div style={styles.twentyOneTargetMetric}>
                <span>Bet en vies</span>
                <strong style={styles.twentyOneMetricValue}>{state.twentyOne?.bet}</strong>
              </div>
              <div style={styles.twentyOneTargetMetric}>
                <span>Cartes numériques restantes</span>
                <strong style={styles.twentyOneMetricValue}>{state.twentyOne?.numberDeckCount}</strong>
              </div>
            </div>

            <div style={{ ...styles.board, minHeight: "auto", gridTemplateRows: "auto auto auto", background: "radial-gradient(circle at center, rgba(112, 71, 34, 0.42) 0%, rgba(22, 17, 12, 0.98) 55%, rgba(4, 4, 3, 0.98) 100%)" }}>
              {[opponents[0], me].filter(Boolean).map((player) => {
                const isSelf = player.id === me?.id;
                const total = player.twentyOne?.total ?? 0;
                const busted = total > (state.twentyOne?.target ?? 21);
                return (
                  <div key={player.id} style={{ display: "grid", gap: 8 }}>
                    <div style={{ ...styles.playerBadge, justifyContent: "space-between", flexWrap: "wrap" }}>
                      <span>{player.name} · {player.twentyOne?.lives} vie(s) · Total {total}{busted ? " · bust" : ""}</span>
                      <span>{Math.max(0, (state.twentyOne?.target ?? 21) - total)} requis · {player.twentyOne?.cards?.length ?? 0} carte(s){player.twentyOne?.stood ? " · Stand" : " · Actif"}{player.twentyOne?.bless ? " · Bless" : ""}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                      {(player.twentyOne?.cards ?? []).map((card, index) => (
                        <div key={`${player.id}-num-${card.id}-${index}`} style={{ ...styles.cardBack, width: 58, height: 78, background: card.hidden && !isSelf ? "linear-gradient(140deg, #11100d, #382817)" : "linear-gradient(140deg, #d8c08a, #6f3c19)", color: card.hidden && !isSelf ? "#d8c9a7" : "#160d07", flexDirection: "column" }}>
                          <span style={{ fontSize: 11 }}>{card.hidden && !isSelf ? "Hush" : "NUM"}</span>
                          <strong style={{ fontSize: 26 }}>{card.value ?? "?"}</strong>
                        </div>
                      ))}
                      {!(player.twentyOne?.cards?.length) && <span style={{ color: "#fff", opacity: 0.85 }}>Aucune carte numérique.</span>}
                    </div>
                  </div>
                );
              })}

              <div style={{ ...styles.centerPanel, width: "100%", color: "#fff", justifyContent: "center", flexWrap: "wrap" }}>
                <button onClick={drawTwentyOneNumber} disabled={me?.twentyOne?.stood || state.phase === "finished"} style={{ ...styles.drawDeckButton, opacity: me?.twentyOne?.stood || state.phase === "finished" ? 0.6 : 1 }}>
                  <div style={styles.actionIcon}>🂡</div>
                  <div>Carte normale</div>
                  <div style={{ fontSize: 11, opacity: 0.9 }}>À volonté</div>
                </button>
                <div style={{ ...styles.arenaSlot, minHeight: 92 }}>
                  ♛ Trumps non piochables : 3 reçus au départ, aucun autre tirage.
                </div>
                <button onClick={standTwentyOne} disabled={me?.twentyOne?.stood || state.phase === "finished"} style={{ ...styles.skipTurnButton, width: 96, borderRadius: 16, opacity: me?.twentyOne?.stood || state.phase === "finished" ? 0.6 : 1 }}>
                  Stand
                </button>
              </div>

              {me && (
                <div>
                  <div style={{ ...styles.playerBadge, flexWrap: "wrap" }}>{me.name} · Trumps en main: {me.hand.length}</div>
                  <div style={{ ...styles.handRow, minHeight: 150 }}>
                    {me.hand.map((card, index) => {
                      const palette = soulsCardPalette(card);
                      const isActive = activeCardId === card.id;
                      const tilt = (index - (me.hand.length - 1) / 2) * 4;
                      return (
                        <button
                          key={card.id}
                          type="button"
                          onClick={() => handleCardClick(card)}
                          style={{
                            ...styles.cardButton,
                            width: isMobilePortrait ? "clamp(106px, 31vw, 124px)" : isMobile ? 104 : styles.cardButton.width,
                            minHeight: isMobilePortrait ? 138 : isMobile ? 132 : styles.cardButton.minHeight,
                            background: palette.bg,
                            transform: isActive ? "translateY(-18px) scale(1.05)" : `rotate(${tilt}deg)`,
                            opacity: me?.twentyOne?.stood && !isActive ? 0.72 : 1
                          }}
                          title="Clique une fois pour sélectionner, re-clique pour jouer ce Trump."
                        >
                          <div style={styles.cardHeader}><span>TRUMP</span><span>{palette.icon}</span></div>
                          <div style={{ ...styles.cardMain, fontSize: 30 }}>{palette.icon}</div>
                          <div style={styles.cardSub}>{cardLabel(card)}</div>
                          <div style={styles.small}>{cardDetails(card)}</div>
                          {isActive && !me?.twentyOne?.stood && state.phase !== "finished" && <div style={{ fontSize: 11, marginTop: 2, fontWeight: 700 }}>Re-clique pour jouer</div>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <section style={styles.ruleBox}>
              <strong>Règles Twenty One intégrées</strong>
              <span>Chaque manche vise la cible active (21 par défaut). Les Go For peuvent la changer en 17, 24 ou 27.</span>
              <span>Le meilleur total est le plus proche de la cible. Le perdant de la manche perd le bet en vies; Bless peut empêcher une mort.</span>
              <span>Les joueurs peuvent piocher des cartes numériques et jouer leurs Trumps librement, sans tour imposé.</span>
              <span>Les Trumps ne sont pas piochables : chaque joueur en reçoit 3 au début, puis aucun autre tirage de Trump n'est ajouté.</span>
              {state.phase === "finished" && <strong>{state.players.find((player) => player.id === state.twentyOne?.winnerId)?.name ?? "Un joueur"} gagne.</strong>}
            </section>
          </section>
        )}

        {state && !isLobbyPhase && !isAwaleGame && !isTwentyOneGame && (
          <section
            style={{
              ...styles.board,
              minHeight: isMobilePortrait ? "calc(100dvh - 210px)" : isMobile ? 380 : styles.board.minHeight,
              borderRadius: isMobilePortrait ? 14 : styles.board.borderRadius,
              padding: isMobilePortrait ? 6 : isMobile ? 10 : styles.board.padding,
              gap: isMobilePortrait ? 8 : styles.board.gap
            }}
          >
            <div>
              {opponents[0] ? (
                <>
                  <div style={{ ...styles.playerBadge, maxWidth: "100%", flexWrap: "wrap", fontSize: isMobilePortrait ? 12 : styles.playerBadge.fontSize, padding: isMobilePortrait ? "6px 10px" : styles.playerBadge.padding }}>
                    {opponents[0].name} · HP {opponents[0].hp} · Énergie {opponents[0].energy}/{state.config.maxEnergy} · {opponents[0].handCount} cartes
                  </div>
                  <div style={styles.opponentHand}>
                    {Array.from({ length: opponents[0].handCount }).map((_, index) => (
                      (() => {
                        const revealedCard = previewCardFromVision(state.opponentHandPreview?.[index]);
                        const palette = revealedCard ? soulsCardPalette(revealedCard) : null;
                        return (
                          <div
                            key={`opponent-card-${index}`}
                            style={
                              revealedCard
                                ? {
                                    ...styles.cardBack,
                                    width: isMobile ? 58 : 64,
                                    height: isMobile ? 84 : 90,
                                    background: palette.bg,
                                    flexDirection: "column",
                                    gap: 3,
                                    fontSize: 11
                                  }
                                : styles.cardBack
                            }
                          >
                            {revealedCard ? (
                              <>
                                <span style={{ fontSize: 20, lineHeight: 1 }}>{palette.icon}</span>
                                <span style={{ fontSize: 9, textAlign: "center", padding: "0 3px" }}>
                                  {cardLabel(revealedCard)}
                                </span>
                              </>
                            ) : (
                              "UNO"
                            )}
                          </div>
                        );
                      })()
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ ...styles.playerBadge, maxWidth: "100%", flexWrap: "wrap", fontSize: isMobilePortrait ? 12 : styles.playerBadge.fontSize }}>En attente d'un adversaire...</div>
              )}
            </div>

            <div style={styles.centerArena}>
              <div
                style={{
                  ...styles.centerPanel,
                  width: "100%",
                  minHeight: isMobilePortrait ? 106 : isMobile ? 126 : styles.centerPanel.minHeight,
                  borderRadius: isMobilePortrait ? 16 : styles.centerPanel.borderRadius,
                  gap: isMobilePortrait ? 6 : isMobile ? 8 : styles.centerPanel.gap,
                  padding: isMobilePortrait ? 8 : styles.centerPanel.padding,
                  flexWrap: "wrap"
                }}
              >
                <div style={styles.deckActions}>
                  <button
                    type="button"
                    onClick={drawCard}
                    disabled={!isMyTurn || Boolean(pendingAttack)}
                    style={{
                      ...styles.drawDeckButton,
                      width: isMobilePortrait ? 104 : isMobile ? 98 : styles.drawDeckButton.width,
                      minHeight: isMobilePortrait ? 116 : isMobile ? 124 : styles.drawDeckButton.minHeight,
                      opacity: !isMyTurn || Boolean(pendingAttack) ? 0.6 : 1
                    }}
                    title="Clique pour piocher une carte utilitaire/défense (1 énergie)."
                  >
                    <div style={styles.actionIcon}>🂠</div>
                    <div style={{ fontSize: 13 }}>Pioche</div>
                    <div style={{ fontSize: 11, opacity: 0.9 }}>1 énergie</div>
                  </button>
                  <button
                    type="button"
                    onClick={handleEndTurnFromSkipIcon}
                    disabled={!isMyTurn || Boolean(pendingAttack)}
                    style={{
                      ...styles.skipTurnButton,
                      opacity: !isMyTurn || Boolean(pendingAttack) ? 0.6 : 1
                    }}
                    title="Passer le tour"
                  >
                    <span style={{ transform: "translateX(0.5px)" }}>⏭</span>
                  </button>
                </div>
                {pendingAttack && (
                  <div style={{ ...styles.arenaSlot, flex: isMobilePortrait ? "1 1 150px" : undefined, width: isMobilePortrait ? "100%" : isMobile ? 130 : styles.arenaSlot.width, minHeight: isMobilePortrait ? 66 : isMobile ? 78 : styles.arenaSlot.minHeight, fontSize: isMobile ? 11 : styles.arenaSlot.fontSize }}>
                    {`${pendingAttack.card.label} sur ${isMyDefenseTurn ? "toi" : opponents[0]?.name ?? "cible"}`}
                  </div>
                )}
              </div>
            </div>

            {me && (
              <div>
                <div style={{ ...styles.playerBadge, maxWidth: "100%", flexWrap: "wrap", fontSize: isMobilePortrait ? 12 : styles.playerBadge.fontSize, padding: isMobilePortrait ? "6px 10px" : styles.playerBadge.padding }}>
                  {me.name} · HP {me.hp} · Énergie {me.energy}/{state.config.maxEnergy}
                </div>
                <div style={{ ...styles.handRow, minHeight: isMobilePortrait ? 132 : isMobile ? 124 : styles.handRow.minHeight, gap: isMobilePortrait ? 5 : isMobile ? 6 : styles.handRow.gap, padding: isMobilePortrait ? "8px 0" : styles.handRow.padding }}>
                  {me.hand.map((card, index) => {
                    const palette = soulsCardPalette(card);
                    const isActive = activeCardId === card.id;
                    const tilt = (index - (me.hand.length - 1) / 2) * 5;
                    return (
                      <button
                        key={card.id}
                        type="button"
                        style={{
                          ...styles.cardButton,
                          width: isMobilePortrait ? "clamp(104px, 31vw, 118px)" : isMobile ? 96 : styles.cardButton.width,
                          minHeight: isMobilePortrait ? 136 : isMobile ? 124 : styles.cardButton.minHeight,
                          background: palette.bg,
                          transform: isActive
                            ? "translateY(-18px) scale(1.05)"
                            : `rotate(${tilt}deg) translateY(0px)`,
                          boxShadow: isActive
                            ? "0 18px 22px rgba(16, 24, 46, 0.44)"
                            : styles.cardButton.boxShadow,
                          filter: isActive ? "saturate(1.2)" : "none",
                          opacity:
                            card.type === "utility" && (!isMyTurn || Boolean(pendingAttack)) && !isActive
                              ? 0.75
                              : 1
                        }}
                        onClick={() => handleCardClick(card)}
                        title={
                          card.type === "utility"
                            ? "Clique une fois pour sélectionner, re-clique pour jouer."
                            : "Carte défensive utilisée automatiquement via popup en défense."
                        }
                      >
                        <div style={styles.cardHeader}>
                          <span>{card.type === "defense" ? "DEF" : "UTIL"}</span>
                          <span>{palette.icon}</span>
                        </div>
                        <div style={{ ...styles.cardMain, fontSize: isMobilePortrait ? 30 : styles.cardMain.fontSize }}>{palette.icon}</div>
                        <div style={styles.cardSub}>{cardLabel(card)}</div>
                        <div style={styles.small}>{cardDetails(card)}</div>
                        {isActive && card.type === "utility" && isMyTurn && !pendingAttack && (
                          <div style={{ fontSize: 11, marginTop: 2, fontWeight: 700 }}>
                            Re-clique pour jouer
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {state && !isLobbyPhase && !isAwaleGame && !isTwentyOneGame && (
          <section style={{ ...styles.controls, marginTop: isMobilePortrait ? 8 : styles.controls.marginTop, padding: isMobilePortrait ? 8 : styles.controls.padding, borderRadius: isMobilePortrait ? 12 : styles.controls.borderRadius }}>
            <div>
              <strong>Actions de tour</strong>
              <div style={{ ...styles.actionCards, gridTemplateColumns: isMobilePortrait ? "repeat(3, minmax(0, 1fr))" : isMobile ? "repeat(2, minmax(0, 1fr))" : styles.actionCards.gridTemplateColumns, gap: isMobilePortrait ? 6 : styles.actionCards.gap }}>
                {["ranged", "magic", "melee"].map((attackType) => {
                  const theme = soulsAttackCardTheme(attackType);
                  return (
                    <button
                      key={attackType}
                      onClick={() => attack(attackType)}
                      disabled={!isMyTurn || Boolean(pendingAttack)}
                      style={{
                        ...styles.actionCardButton,
                        background: theme.bg,
                        minHeight: isMobilePortrait ? 86 : isMobile ? 94 : styles.actionCardButton.minHeight,
                        padding: isMobilePortrait ? 7 : styles.actionCardButton.padding,
                        opacity: !isMyTurn || Boolean(pendingAttack) ? 0.6 : 1
                      }}
                    >
                      <div style={styles.actionIcon}>{theme.icon}</div>
                      <div style={styles.actionTitle}>Attaque {theme.title}</div>
                      <div style={styles.actionSubtitle}>{theme.die}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {state && !isLobbyPhase && (
          <section style={{ ...styles.log, marginTop: isMobilePortrait ? 8 : styles.log.marginTop, maxHeight: isMobilePortrait ? 130 : styles.log.maxHeight, fontSize: isMobilePortrait ? 12 : styles.log.fontSize }}>
            <strong>Journal</strong>
            <ul>
              {state.log.map((entry, idx) => (
                <li key={`${entry.at}-${idx}`}>{entry.message}</li>
              ))}
            </ul>
          </section>
        )}

        {!isLobbyPhase && !isAwaleGame && !isTwentyOneGame && isMyDefenseTurn && (
          <div style={styles.modalBackdrop}>
            <div style={{ ...styles.modal, padding: isMobile ? 12 : styles.modal.padding, animation: "defense-pop 220ms ease-out" }}>
              <h3 style={{ margin: 0 }}>🛡 Défense requise</h3>
              <p style={{ marginBottom: 8 }}>
                Tu subis <strong>{pendingAttack?.card.label}</strong>. Choisis une défense valide.
              </p>

              <div style={styles.modalCards}>
                {validDefenseCards.map((card) => {
                  const palette = soulsCardPalette(card);
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => defend(card.id)}
                      style={{
                        ...styles.cardButton,
                        background: palette.bg,
                        width: isMobile ? 104 : 132,
                        minHeight: isMobile ? 132 : 160
                      }}
                    >
                      <div style={styles.cardHeader}>
                        <span>DEF</span>
                        <span>{palette.icon}</span>
                      </div>
                      <div style={styles.cardMain}>{palette.icon}</div>
                      <div style={styles.cardSub}>{cardLabel(card)}</div>
                      <div style={styles.small}>{cardDetails(card)}</div>
                    </button>
                  );
                })}

                {!validDefenseCards.length && (
                  <div style={{ fontWeight: 700 }}>Aucune carte compatible disponible.</div>
                )}
              </div>

              {invalidDefenseCards.length > 0 && (
                <p style={{ marginTop: 10, fontSize: 12, opacity: 0.9 }}>
                  Cartes non proposées car incompatibles: {invalidDefenseCards.map((card) => cardLabel(card)).join(", ")}.
                </p>
              )}

              <div style={{ marginTop: 12 }}>
                <button
                  onClick={defendWithoutCard}
                  style={{
                    borderRadius: 12,
                    border: "2px solid #fff",
                    background: "rgba(255,255,255,0.16)",
                    color: "#fff",
                    padding: "8px 12px",
                    fontWeight: 700
                  }}
                >
                  Subir l'attaque (aucune défense)
                </button>
              </div>
            </div>
          </div>
        )}

        {defenseToast && (
          <div style={styles.defenseToast}>{defenseToast}</div>
        )}

        {trumpPopup && (
          <div style={styles.modalBackdrop}>
            <div style={{ ...styles.modal, maxWidth: 440, textAlign: "center", animation: "trump-popup-pop 220ms ease-out" }}>
              <div style={{ fontSize: 42, lineHeight: 1 }}>♛</div>
              <h3 style={{ margin: "6px 0" }}>Trump joué</h3>
              <strong style={{ fontSize: 22 }}>{trumpPopup.card?.name ?? "Trump"}</strong>
              <p style={{ marginBottom: 0 }}>{trumpPopup.message}</p>
            </div>
          </div>
        )}

        {error && <p style={{ color: "#d3533a", fontWeight: 700, textTransform: "uppercase", textShadow: "0 0 14px rgba(211,83,58,0.58)" }}>{error}</p>}
      </div>
    </main>
  );
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root introuvable.");
}

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
