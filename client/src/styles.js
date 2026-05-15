import { theme } from "./theme.js";

const baseStyles = {
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
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 13,
    textAlign: "center",
    gap: 4,
    padding: 8
  },
  arenaSlotLabel: {
    color: "rgba(232, 216, 181, 0.62)",
    fontSize: 11,
    fontWeight: 900,
    textTransform: "uppercase"
  },
  arenaSlotMeta: {
    color: "rgba(232, 216, 181, 0.72)",
    fontSize: 12,
    fontWeight: 800
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
    width: 18,
    height: 18,
    display: "grid",
    placeItems: "center",
    fontSize: 16,
    lineHeight: 1,
    filter: "drop-shadow(0 2px 2px rgba(20, 4, 2, 0.62))",
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
  twentyOneShell: {
    display: "grid",
    gap: 12,
    width: "100%"
  },
  twentyOneTopBar: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    alignItems: "center",
    gap: 12,
    borderRadius: 4,
    background: "linear-gradient(90deg, rgba(20, 17, 12, 0.94), rgba(9, 8, 6, 0.9))",
    border: "1px solid rgba(216, 201, 167, 0.18)",
    padding: "10px 12px",
    color: "rgba(232, 216, 181, 0.78)"
  },
  twentyOneGameTitle: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8
  },
  twentyOneRulesToggle: {
    minHeight: 34,
    borderRadius: 3,
    border: "1px solid rgba(216, 201, 167, 0.34)",
    background: "linear-gradient(180deg, rgba(36, 28, 18, 0.92), rgba(8, 7, 6, 0.94))",
    color: "#f4e7c8",
    padding: "6px 10px",
    fontWeight: 800,
    cursor: "pointer"
  },
  twentyOneLayout: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(230px, 290px)",
    gap: 12,
    alignItems: "start"
  },
  twentyOneTable: {
    borderRadius: 4,
    background: "radial-gradient(circle at 50% 8%, rgba(128, 82, 37, 0.22), transparent 32%), linear-gradient(180deg, rgba(21, 17, 12, 0.96), rgba(6, 5, 4, 0.98))",
    border: "1px solid rgba(216, 201, 167, 0.2)",
    boxShadow: "inset 0 0 60px rgba(0,0,0,0.68), 0 16px 32px rgba(0,0,0,0.48)",
    padding: 12,
    display: "grid",
    gap: 12
  },
  twentyOnePlayerPanel: {
    display: "grid",
    gap: 8,
    padding: "10px 0",
    borderTop: "1px solid rgba(216, 201, 167, 0.14)"
  },
  twentyOnePlayerHeader: {
    display: "grid",
    gridTemplateColumns: "minmax(120px, 1fr) auto auto",
    gap: 10,
    alignItems: "baseline"
  },
  twentyOnePlayerName: {
    color: "#f2dfb8",
    fontSize: 18,
    fontWeight: 900
  },
  twentyOnePlayerMeta: {
    color: "rgba(232, 216, 181, 0.68)",
    fontSize: 12,
    fontWeight: 700
  },
  twentyOneTotal: {
    color: "#fff0c9",
    fontSize: 26,
    fontWeight: 950,
    lineHeight: 1
  },
  twentyOneCardZone: {
    minHeight: 104,
    borderRadius: 4,
    border: "1px dashed rgba(216, 201, 167, 0.2)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.01))",
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: 10
  },
  twentyOneGhostCard: {
    width: 58,
    height: 78,
    borderRadius: 4,
    border: "1px dashed rgba(216, 201, 167, 0.28)",
    background: "linear-gradient(145deg, rgba(216,201,167,0.06), rgba(216,201,167,0.015))",
    boxShadow: "inset 0 0 22px rgba(0,0,0,0.38)"
  },
  twentyOneActionsPanel: {
    display: "grid",
    gap: 8,
    paddingTop: 8,
    borderTop: "1px solid rgba(216, 201, 167, 0.14)"
  },
  twentyOneStatLabel: {
    color: "rgba(232, 216, 181, 0.62)",
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase"
  },
  twentyOneActionRow: {
    display: "grid",
    gridTemplateColumns: "minmax(150px, 1fr) minmax(110px, 0.62fr)",
    gap: 10
  },
  twentyOneDrawAction: {
    minHeight: 76,
    borderRadius: 4,
    border: "1px solid rgba(240, 138, 53, 0.56)",
    background: "linear-gradient(135deg, rgba(113, 58, 23, 0.94), rgba(31, 18, 10, 0.96))",
    color: "#fff0c9",
    display: "grid",
    gridTemplateColumns: "44px 1fr",
    alignItems: "center",
    gap: 10,
    textAlign: "left",
    fontWeight: 900,
    cursor: "pointer"
  },
  twentyOneStandAction: {
    minHeight: 76,
    borderRadius: 4,
    border: "1px solid rgba(216, 201, 167, 0.34)",
    background: "linear-gradient(135deg, rgba(47, 40, 29, 0.96), rgba(10, 9, 7, 0.97))",
    color: "#f4e7c8",
    fontWeight: 900,
    cursor: "pointer"
  },
  twentyOneTrumpPanel: {
    borderRadius: 4,
    background: "linear-gradient(180deg, rgba(18, 15, 11, 0.94), rgba(7, 6, 5, 0.96))",
    border: "1px solid rgba(216, 201, 167, 0.2)",
    boxShadow: "inset 0 0 42px rgba(0,0,0,0.62), 0 14px 26px rgba(0,0,0,0.42)",
    padding: 10,
    display: "grid",
    gap: 10
  },
  twentyOneTrumpHand: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(86px, 1fr))",
    gap: 8
  },
  twentyOneTrumpCard: {
    minHeight: 112,
    aspectRatio: "0.78 / 1",
    borderRadius: 4,
    position: "relative",
    color: "#f4e7c8",
    boxShadow: "inset 0 0 24px rgba(0,0,0,0.64), 0 10px 16px rgba(0,0,0,0.42)",
    padding: "10px 8px",
    cursor: "pointer",
    display: "grid",
    gridTemplateRows: "auto 1fr",
    gap: 6,
    alignItems: "start",
    justifyItems: "center",
    textAlign: "center",
    overflow: "hidden",
    transition: "transform 140ms ease, filter 140ms ease, opacity 140ms ease"
  },
  twentyOneTrumpTitle: {
    position: "relative",
    zIndex: 2,
    display: "block",
    width: "100%",
    marginTop: 2,
    padding: "0 4px",
    fontSize: 12,
    lineHeight: 1.15,
    textWrap: "balance"
  },
  twentyOneTrumpIcon: {
    position: "relative",
    alignSelf: "center",
    justifySelf: "center",
    zIndex: 1,
    fontSize: 42,
    lineHeight: 1
  },
  twentyOneWinnerToast: {
    position: "fixed",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 45,
    minWidth: "min(92vw, 420px)",
    borderRadius: 4,
    border: "1px solid rgba(240, 138, 53, 0.72)",
    background: "radial-gradient(circle at 50% 0%, rgba(240, 138, 53, 0.28), transparent 42%), linear-gradient(160deg, rgba(44, 31, 20, 0.98), rgba(7, 6, 5, 0.98))",
    color: "#fff0c9",
    boxShadow: "0 24px 58px rgba(0,0,0,0.72), inset 0 0 44px rgba(0,0,0,0.62)",
    padding: "18px 20px",
    display: "grid",
    gap: 5,
    textAlign: "center",
    overflow: "hidden"
  },
  twentyOneWinnerSparks: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none"
  },
  twentyOneWinnerLabel: {
    color: "rgba(232, 216, 181, 0.72)",
    fontSize: 13,
    fontWeight: 800,
    textTransform: "uppercase"
  },
  twentyOneWinnerName: {
    fontSize: 30,
    lineHeight: 1,
    color: "#fff0c9"
  },
  twentyOneWinnerMeta: {
    color: "rgba(232, 216, 181, 0.8)",
    fontSize: 14
  },
  duelResultPopup: {
    position: "fixed",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 45,
    minWidth: "min(92vw, 420px)",
    borderRadius: 4,
    border: "1px solid rgba(240, 138, 53, 0.72)",
    background: "radial-gradient(circle at 50% 0%, rgba(240, 138, 53, 0.28), transparent 42%), linear-gradient(160deg, rgba(44, 31, 20, 0.98), rgba(7, 6, 5, 0.98))",
    color: "#fff0c9",
    boxShadow: "0 24px 58px rgba(0,0,0,0.72), inset 0 0 44px rgba(0,0,0,0.62)",
    padding: "18px 20px",
    display: "grid",
    gap: 5,
    textAlign: "center",
    overflow: "hidden"
  },
  duelResultTitle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontSize: 26,
    lineHeight: 1.05,
    color: "#fff0c9"
  },
  duelResultMeta: {
    color: "rgba(232, 216, 181, 0.62)",
    fontSize: 12,
    fontWeight: 800,
    textTransform: "uppercase"
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
  },
  trumpTooltip: {
    position: "fixed",
    zIndex: 50,
    maxWidth: 230,
    borderRadius: 4,
    border: "1px solid rgba(240, 138, 53, 0.58)",
    background: "linear-gradient(160deg, rgba(37, 27, 18, 0.98), rgba(7, 6, 5, 0.98))",
    color: "#f4e7c8",
    boxShadow: "0 12px 26px rgba(0,0,0,0.58), inset 0 0 22px rgba(0,0,0,0.44)",
    padding: "8px 10px",
    fontSize: 12,
    fontWeight: 800,
    textAlign: "center",
    pointerEvents: "none"
  }
};

export const styles = baseStyles;
