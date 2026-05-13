import React from "react";
import { socket } from "./socket.js";
import { GAME_CHOICES } from "./gameChoices.js";
import { styles } from "./styles.js";
import { theme } from "./theme.js";
import { AwaleDirectionRow, AwaleMiddleFlow, AwalePit } from "./awaleView.jsx";
import { cardDetails, cardLabel, canDefenseCardAnswerAttack, getAwaleRowsForViewer, previewCardFromVision, soulsAttackCardTheme, soulsCardPalette, specialCardIcon, trumpShortEffect } from "./cardPresentation.js";

export function App() {
  const [name, setName] = React.useState("Joueur");
  const [code, setCode] = React.useState("");
  const [gameType, setGameType] = React.useState("card_duel");
  const [roomAction, setRoomAction] = React.useState("join");
  const [state, setState] = React.useState(null);
  const [error, setError] = React.useState("");
  const [activeCardId, setActiveCardId] = React.useState(null);
  const [hoveredTrump, setHoveredTrump] = React.useState(null);
  const [copyFeedback, setCopyFeedback] = React.useState("");
  const [showAwaleRules, setShowAwaleRules] = React.useState(false);
  const [showTwentyOneRules, setShowTwentyOneRules] = React.useState(false);
  const [defenseToast, setDefenseToast] = React.useState("");
  const [trumpPopup, setTrumpPopup] = React.useState(null);
  const [twentyOneResultToast, setTwentyOneResultToast] = React.useState(null);
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
  const isSpectator = state?.viewerRole === "spectator" || Boolean(state && !me);

  const opponents = React.useMemo(() => {
    if (!state || !me) return [];
    return state.players.filter((p) => p.id !== me.id);
  }, [state, me]);
  const visibleDuelPlayers = React.useMemo(() => {
    if (!state) return [];
    return me ? [opponents[0], me].filter(Boolean) : state.players;
  }, [state, me, opponents]);
  const selectedTwentyOneTrump = React.useMemo(() => {
    const active = me?.hand?.find((card) => card.id === activeCardId && card.type === "trump");
    return active ?? me?.hand?.find((card) => card.type === "trump") ?? null;
  }, [activeCardId, me]);
  const twentyOneWinner = React.useMemo(() => {
    if (!state?.twentyOne?.winnerId) return null;
    return state.players.find((player) => player.id === state.twentyOne.winnerId) ?? null;
  }, [state]);

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
  const gameWinner = React.useMemo(() => {
    if (!state || state.phase !== "finished") return null;
    if (state.gameType === "twenty_one" && state.twentyOne?.winnerId) {
      return state.players.find((player) => player.id === state.twentyOne.winnerId) ?? null;
    }
    if (state.gameType === "awale" && state.awale?.winnerSide !== undefined) {
      if (state.awale.winnerSide === null) return null;
      return state.players.find((player) => player.awaleSide === state.awale.winnerSide) ?? null;
    }
    const lastFinish = [...(state.log ?? [])].reverse().find((entry) => entry.type === "game_finished");
    return state.players.find((player) => lastFinish?.message?.includes(`${player.name} remporte`)) ?? null;
  }, [state]);

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

  React.useEffect(() => {
    const result = state?.twentyOne?.lastRoundResult;
    if (!isTwentyOneGame || !result?.id) return;

    const winner = result.winnerId
      ? state.players.find((player) => player.id === result.winnerId)
      : null;
    const loser = result.loserId
      ? state.players.find((player) => player.id === result.loserId)
      : null;

    setTwentyOneResultToast({
      ...result,
      winnerName: winner?.name ?? "Joueur",
      loserName: loser?.name ?? "Joueur"
    });

    const timer = setTimeout(() => setTwentyOneResultToast(null), result.gameOver ? 4200 : 3000);
    return () => clearTimeout(timer);
  }, [state?.twentyOne?.lastRoundResult?.id, isTwentyOneGame]);

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

  function handleSpectateRoom() {
    ensureConnection();
    setError("");
    socket.emit("room:spectate", {
      code: code.trim().toUpperCase(),
      spectatorName: name.trim() || "Spectateur"
    });
  }

  function handleStartGame() {
    if (!state) return;
    socket.emit("game:start", { code: state.code });
  }

  async function copyRoomCode() {
    if (!state?.code) return;

    try {
      await navigator.clipboard.writeText(state.code);
      setCopyFeedback("Copié");
    } catch {
      setCopyFeedback("Copie impossible");
    }

    window.setTimeout(() => setCopyFeedback(""), 1600);
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

  function replayCurrentGame() {
    socket.emit("game:replay");
  }

  function returnToMenu() {
    socket.disconnect();
    setState(null);
    setError("");
    setActiveCardId(null);
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
        .twenty-one-trump-card:hover:not(:disabled),
        .twenty-one-trump-card:focus-visible {
          transform: translateY(-8px) scale(1.04);
          box-shadow: inset 0 0 24px rgba(0,0,0,0.66), 0 18px 26px rgba(0,0,0,0.55), 0 0 0 1px rgba(240,138,53,0.46);
          filter: saturate(1.12) brightness(1.08);
          outline: none;
        }
        .twenty-one-action:hover:not(:disabled),
        .twenty-one-action:focus-visible {
          transform: translateY(-1px);
          outline: none;
        }
        .twenty-one-trump-card {
          position: relative;
          overflow: hidden;
        }
        .twenty-one-trump-card::before {
          content: "";
          position: absolute;
          inset: 6px;
          border: 1px solid rgba(244, 231, 200, 0.18);
          border-radius: 3px;
          pointer-events: none;
        }
        .twenty-one-trump-card::after {
          content: "";
          position: absolute;
          left: 50%;
          top: 38%;
          width: 36px;
          height: 36px;
          transform: translate(-50%, -50%);
          border-radius: 999px;
          background: radial-gradient(circle, rgba(240,138,53,0.34), rgba(240,138,53,0.07) 58%, transparent 70%);
          pointer-events: none;
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
        .twenty-one-winner-toast {
          animation: twenty-one-winner-in 620ms cubic-bezier(0.2, 0.9, 0.24, 1.18) both, twenty-one-winner-glow 1600ms ease-in-out 620ms infinite alternate;
        }
        .twenty-one-winner-toast.is-tie {
          border-color: rgba(216, 201, 167, 0.58);
          background: radial-gradient(circle at 50% 0%, rgba(216, 201, 167, 0.18), transparent 42%), linear-gradient(160deg, rgba(31, 27, 20, 0.98), rgba(5, 4, 3, 0.98));
        }
        .twenty-one-winner-toast::before,
        .twenty-one-winner-toast::after {
          content: "";
          position: absolute;
          left: 50%;
          top: 50%;
          width: 82%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(240,138,53,0.85), transparent);
          transform-origin: center;
          pointer-events: none;
          opacity: 0;
          animation: twenty-one-spark 820ms ease-out 180ms both;
        }
        .twenty-one-winner-toast::after {
          transform: translate(-50%, -50%) rotate(90deg);
          animation-delay: 260ms;
        }
        @keyframes twenty-one-winner-in {
          0% { opacity: 0; transform: translate(-50%, -42%) scale(0.84); filter: blur(2px); }
          62% { opacity: 1; transform: translate(-50%, -50%) scale(1.04); filter: blur(0); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1); filter: blur(0); }
        }
        @keyframes twenty-one-winner-glow {
          0% { box-shadow: inset 0 0 36px rgba(0,0,0,0.62), 0 20px 54px rgba(0,0,0,0.76), 0 0 22px rgba(240, 138, 53, 0.2); }
          100% { box-shadow: inset 0 0 36px rgba(0,0,0,0.62), 0 20px 54px rgba(0,0,0,0.76), 0 0 44px rgba(240, 138, 53, 0.42); }
        }
        @keyframes twenty-one-spark {
          0% { opacity: 0; transform: translate(-50%, -50%) scaleX(0.18); }
          28% { opacity: 1; }
          100% { opacity: 0; transform: translate(-50%, -50%) scaleX(1.2); }
        }
        .twenty-one-result-spark {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #ffe4a8;
          box-shadow: 0 0 12px rgba(240, 138, 53, 0.9);
          transform: translate(-50%, -50%);
          animation: twenty-one-result-spark 900ms ease-out both;
          animation-delay: var(--spark-delay, 0ms);
        }
        @keyframes twenty-one-result-spark {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.4); }
          16% { opacity: 1; }
          100% {
            opacity: 0;
            transform:
              translate(
                calc(-50% + var(--spark-x, 0px)),
                calc(-50% + var(--spark-y, 0px))
              )
              scale(0.8);
          }
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
                <span style={styles.menuLabel}>Créer une room</span>
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
              <button
                className="menu-row menu-action"
                type="button"
                onClick={() => setRoomAction("spectate")}
                style={{
                  ...styles.menuRow,
                  ...styles.menuButtonRow,
                  ...(roomAction === "spectate" ? styles.menuRowSelected : null)
                }}
              >
                <span style={styles.menuLabel}>Regarder</span>
                <span style={styles.menuValue}>{roomAction === "spectate" ? "Sélectionné" : ""}</span>
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
              onClick={roomAction === "create" ? handleCreateRoom : roomAction === "spectate" ? handleSpectateRoom : handleJoinRoom}
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
                    <span style={styles.menuValue}>{isSelected ? "Sélectionné" : ""}</span>
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
                <span style={styles.menuLabel}>Créer une room</span>
                <span style={styles.menuValue}>{selectedMode.title}</span>
              </button>
              <button className="menu-row menu-action" type="button" onClick={handleJoinRoom} style={{ ...styles.menuRow, ...styles.menuButtonRow }}>
                <span style={styles.menuLabel}>Rejoindre</span>
                <span style={styles.menuValue}>{code || "Code requis"}</span>
              </button>
              <div style={styles.menuActionHint}>
                <span>Entrer: valider la ligne active</span>
                <span>Sélection: orange-brun</span>
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
                { id: "twenty_one", title: "Twenty One", desc: "Approche la cible, joue des cartes spéciales, protège tes 3 vies." }
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
                Room {state.code}. {state.gameType === "awale" ? "Awalé classique" : state.gameType === "twenty_one" ? "Twenty One" : "Duel de cartes"}. En attente des joueurs.
              </span>
            </header>

            <section style={styles.menuSection}>
              <div style={styles.menuSectionTitle}>Code room</div>
              <button
                className="menu-row menu-action"
                type="button"
                onClick={copyRoomCode}
                style={{ ...styles.menuRow, ...styles.menuButtonRow }}
                title="Copier le code de la room"
              >
                <span style={styles.menuLabel}>{state.code}</span>
                <span style={styles.menuValue}>{copyFeedback || "Copier"}</span>
              </button>
            </section>

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
                  <span style={styles.menuValue}>{player.id === state.hostPlayerId ? "Hôte" : "Invité"}</span>
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
                  <span style={styles.menuLabel}>Démarrer</span>
                  <span style={styles.menuValue}>{state.players.length < 2 ? "Deux joueurs requis" : "Prêt"}</span>
                </button>
              ) : (
                <div className="menu-row" style={{ ...styles.menuRow, color: "rgba(216, 201, 167, 0.58)" }}>
                  <span style={styles.menuLabel}>Démarrer</span>
                  <span style={styles.menuValue}>Réservé à l'hôte</span>
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
              <span>
                {state.players.map((player) => `${player.name} : ${state.awale?.captured?.[player.awaleSide] ?? 0}`).join(" / ")}
              </span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => setShowAwaleRules((visible) => !visible)}
                  style={{
                    ...styles.twentyOneRulesToggle,
                    minHeight: isMobilePortrait ? 30 : styles.twentyOneRulesToggle.minHeight,
                    padding: isMobilePortrait ? "4px 8px" : styles.twentyOneRulesToggle.padding,
                    fontSize: isMobilePortrait ? 12 : undefined
                  }}
                >
                  {showAwaleRules ? "Masquer" : "Règles"}
                </button>
                <button onClick={abortCurrentGame} disabled={state.phase === "finished" || isSpectator}>Abandonner</button>
              </div>
            </div>

            {showAwaleRules && (
              <section
                style={{
                  ...styles.ruleBox,
                  borderColor: "rgba(216, 201, 167, 0.16)",
                  background: "rgba(10, 9, 7, 0.7)",
                  padding: isMobilePortrait ? 10 : styles.ruleBox.padding,
                  fontSize: isMobilePortrait ? 12 : styles.ruleBox.fontSize
                }}
              >
                <strong>Règles Awalé classique</strong>
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
            )}

            <div
              style={{
                ...styles.awaleTurnHint,
                fontSize: isMobilePortrait ? 13 : 15,
                padding: isMobilePortrait ? "7px 8px" : styles.awaleTurnHint.padding
              }}
            >
              {isSpectator && state.phase !== "finished" ? "Mode spectateur." : isMyTurn && state.phase !== "finished" ? "À toi de jouer : choisis un trou de ton camp." : state.phase === "finished" ? "Partie terminée." : "Tour adverse."}
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

          </section>
        )}


        {state && !isLobbyPhase && isTwentyOneGame && (
          <section style={{ ...styles.twentyOneShell, gap: isMobilePortrait ? 8 : styles.twentyOneShell.gap }}>
            <div
              style={{
                ...styles.twentyOneTopBar,
                gridTemplateColumns: isMobile ? "1fr auto" : styles.twentyOneTopBar.gridTemplateColumns,
                padding: isMobile ? "6px 8px" : styles.twentyOneTopBar.padding,
                gap: isMobile ? 8 : styles.twentyOneTopBar.gap,
                fontSize: isMobile ? 12 : undefined
              }}
            >
              <div style={styles.twentyOneGameTitle}>
                <strong style={{ fontSize: isMobile ? 22 : 24, lineHeight: 1 }}>Manche {state.twentyOne?.round}</strong>
                <span>{me?.hand?.length ?? 0}/6 spéciales</span>
              </div>
              <div style={{ justifySelf: "end", display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => setShowTwentyOneRules((visible) => !visible)}
                  style={{
                    ...styles.twentyOneRulesToggle,
                    minHeight: isMobile ? 30 : styles.twentyOneRulesToggle.minHeight,
                    padding: isMobile ? "4px 8px" : styles.twentyOneRulesToggle.padding,
                    fontSize: isMobile ? 12 : undefined
                  }}
                >
                  {showTwentyOneRules ? "Masquer" : "Règles"}
                </button>
                <button
                  onClick={abortCurrentGame}
                  disabled={state.phase === "finished" || isSpectator}
                  style={{
                    minHeight: isMobile ? 30 : undefined,
                    padding: isMobile ? "4px 8px" : undefined,
                    fontSize: isMobile ? 12 : undefined
                  }}
                >
                  Abandonner
                </button>
              </div>
            </div>
            {showTwentyOneRules && (
              <section style={{ ...styles.ruleBox, borderColor: "rgba(216, 201, 167, 0.16)", background: "rgba(10, 9, 7, 0.7)", fontSize: isMobile ? 12 : styles.ruleBox.fontSize, padding: isMobile ? 8 : styles.ruleBox.padding }}>
                <strong>Règles Twenty One</strong>
                <span>Chaque manche vise la cible active. Les cartes Cible 17, 24 ou 27 peuvent la changer.</span>
                <span>L'As vaut 1 ou 11 selon le meilleur total possible.</span>
                <span>Chaque joueur commence avec 1 carte cachée et 1 carte visible. Le paquet de points contient une seule carte de chaque rang.</span>
                <span>La manche se résout uniquement quand les 2 joueurs cliquent Rester à la suite.</span>
                <span>Piocher passe le tour, mais remet cette chaîne de Rester à zéro.</span>
                <span>Le perdant perd la mise en vies; Grâce peut empêcher une mort.</span>
                <span>Les cartes spéciales gardées restent en main. +3 cartes spéciales par manche, jusqu'à 6 en main.</span>
              </section>
            )}

            <div
              style={{
                ...styles.awaleTurnHint,
                fontSize: isMobile ? 13 : 15,
                padding: isMobile ? "7px 8px" : styles.awaleTurnHint.padding
              }}
            >
              {isSpectator && state.phase !== "finished" ? "Mode spectateur." : isMyTurn && state.phase !== "finished" ? "À toi de jouer : pioche 1 fois pour passer, joue une carte spéciale ou clique Rester." : state.phase === "finished" ? "Partie terminée." : "Tour adverse."}
            </div>

            <div
              style={{
                ...styles.twentyOneLayout,
                gridTemplateColumns: isMobile ? "1fr" : styles.twentyOneLayout.gridTemplateColumns,
                gap: isMobile ? 8 : styles.twentyOneLayout.gap
              }}
            >
              <div style={{ ...styles.twentyOneTable, padding: isMobile ? 8 : styles.twentyOneTable.padding, gap: isMobile ? 8 : styles.twentyOneTable.gap }}>
                {(me ? [me, opponents[0]].filter(Boolean) : state.players).map((player) => {
                  const isSelf = player.id === me?.id;
                  const total = player.twentyOne?.total ?? 0;
                  const target = state.twentyOne?.target ?? 21;
                  const busted = total > target;
                  const playerStatus = player.twentyOne?.stood ? "Reste" : player.id === state.turnPlayerId && state.phase !== "finished" ? "Tour actif" : busted ? "Bust" : "";
                  const playerNote = [playerStatus, player.twentyOne?.bless ? "Grâce" : ""].filter(Boolean).join(" · ");
                  return (
                    <div key={player.id} style={{ ...styles.twentyOnePlayerPanel, borderTop: isSelf ? 0 : styles.twentyOnePlayerPanel.borderTop, padding: isMobile ? "4px 0" : styles.twentyOnePlayerPanel.padding }}>
                      <div
                        style={{
                          ...styles.twentyOnePlayerHeader,
                          gridTemplateColumns: isMobile ? "minmax(88px, 1fr) auto" : styles.twentyOnePlayerHeader.gridTemplateColumns,
                          gap: isMobile ? 6 : styles.twentyOnePlayerHeader.gap
                        }}
                      >
                        <span style={{ ...styles.twentyOnePlayerName, fontSize: isMobile ? 15 : styles.twentyOnePlayerName.fontSize }}>
                          <span style={{ color: "#d84d3d" }}>♥</span> {player.twentyOne?.lives} {isSelf ? "Joueur" : player.name}
                        </span>
                        <span style={{ ...styles.twentyOneTotal, fontSize: isMobile ? 18 : styles.twentyOneTotal.fontSize }}>{total}/{target}</span>
                        {playerNote && (
                          <span style={{ ...styles.twentyOnePlayerMeta, gridColumn: isMobile ? "1 / -1" : undefined, fontSize: isMobile ? 11 : styles.twentyOnePlayerMeta.fontSize }}>
                            {playerNote}
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          ...styles.twentyOneCardZone,
                          minHeight: isMobile ? 56 : styles.twentyOneCardZone.minHeight,
                          padding: isMobile ? 6 : styles.twentyOneCardZone.padding,
                          gap: isMobile ? 6 : styles.twentyOneCardZone.gap
                        }}
                        aria-label={`Cartes jouées par ${player.name}`}
                      >
                        {(player.twentyOne?.cards ?? []).map((card, index) => (
                          <div
                            key={`${player.id}-num-${card.id}-${index}`}
                            style={{
                              ...styles.cardBack,
                              width: isMobile ? 54 : 58,
                              height: isMobile ? 74 : 78,
                              background: card.hidden && !isSelf ? "linear-gradient(140deg, #11100d, #382817)" : "linear-gradient(140deg, #d8c08a, #6f3c19)",
                              color: card.hidden && !isSelf ? "#d8c9a7" : "#160d07",
                              flexDirection: "column"
                            }}
                          >
                            <span style={{ fontSize: isMobile ? 10 : 11 }}>{card.hidden && !isSelf ? "CACHÉE" : "CARTE"}</span>
                            <strong style={{ fontSize: isMobile ? 28 : 26 }}>{card.rank ?? card.value ?? "?"}</strong>
                          </div>
                        ))}
                        {!(player.twentyOne?.cards?.length) && (
                          <>
                            <span style={{ ...styles.twentyOneGhostCard, width: isMobile ? 54 : styles.twentyOneGhostCard.width, height: isMobile ? 74 : styles.twentyOneGhostCard.height }} aria-hidden="true" />
                            <span style={{ ...styles.twentyOneGhostCard, width: isMobile ? 54 : styles.twentyOneGhostCard.width, height: isMobile ? 74 : styles.twentyOneGhostCard.height }} aria-hidden="true" />
                            {!isMobile && <span style={{ color: "rgba(232, 216, 181, 0.48)", fontSize: 12 }}>Cartes jouées</span>}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}

                <div style={styles.twentyOneActionsPanel}>
                  <span style={styles.twentyOneStatLabel}>Actions disponibles</span>
                  <div
                    style={{
                      ...styles.twentyOneActionRow,
                      gridTemplateColumns: isMobile ? "1fr 1fr" : styles.twentyOneActionRow.gridTemplateColumns,
                      gap: isMobile ? 8 : styles.twentyOneActionRow.gap
                    }}
                  >
                    <button
                      className="twenty-one-action"
                      onClick={drawTwentyOneNumber}
                      disabled={!isMyTurn || me?.twentyOne?.stood || me?.twentyOne?.hasDrawnThisTurn || state.phase === "finished"}
                      style={{
                        ...styles.twentyOneDrawAction,
                        minHeight: isMobile ? 54 : styles.twentyOneDrawAction.minHeight,
                        gridTemplateColumns: isMobile ? "28px 1fr" : styles.twentyOneDrawAction.gridTemplateColumns,
                        padding: isMobile ? "6px 8px" : undefined,
                        opacity: !isMyTurn || me?.twentyOne?.stood || me?.twentyOne?.hasDrawnThisTurn || state.phase === "finished" ? 0.6 : 1
                      }}
                    >
                      <span style={{ fontSize: isMobile ? 21 : 28, lineHeight: 1 }}>🂡</span>
                      <span>
                        <span style={{ display: "block", fontSize: isMobile ? 14 : 17 }}>Piocher</span>
                        <span style={{ display: "block", fontSize: isMobile ? 10 : 12, color: "rgba(255,240,201,0.72)" }}>1 fois puis passe</span>
                      </span>
                    </button>
                    <button
                      className="twenty-one-action"
                      onClick={standTwentyOne}
                      disabled={!isMyTurn || me?.twentyOne?.stood || state.phase === "finished"}
                      style={{
                        ...styles.twentyOneStandAction,
                        minHeight: isMobile ? 54 : styles.twentyOneStandAction.minHeight,
                        padding: isMobile ? "6px 8px" : undefined,
                        fontSize: isMobile ? 14 : undefined,
                        opacity: !isMyTurn || me?.twentyOne?.stood || state.phase === "finished" ? 0.6 : 1
                      }}
                    >
                      Rester
                    </button>
                  </div>
                </div>
              </div>

              <aside style={{ ...styles.twentyOneTrumpPanel, padding: isMobile ? 8 : styles.twentyOneTrumpPanel.padding, gap: isMobile ? 8 : styles.twentyOneTrumpPanel.gap }}>
                  <div style={styles.twentyOneSideStats}>
                    <div style={styles.twentyOneSideStat}>
                      <span style={styles.twentyOneStatLabel}>Mise</span>
                      <strong style={{ ...styles.twentyOneSideStatValue, fontSize: isMobile ? 28 : styles.twentyOneSideStatValue.fontSize }}>
                        {state.twentyOne?.bet ?? 0}
                      </strong>
                      <span style={styles.twentyOneSideStatHint}>vie(s) en jeu</span>
                    </div>
                    <div style={styles.twentyOneSideStat}>
                      <span style={styles.twentyOneStatLabel}>Cible</span>
                      <strong style={{ ...styles.twentyOneSideStatValue, fontSize: isMobile ? 28 : styles.twentyOneSideStatValue.fontSize }}>
                        {state.twentyOne?.target ?? 21}
                      </strong>
                      <span style={styles.twentyOneSideStatHint}>à approcher</span>
                    </div>
                  </div>
                  {me ? (
                    <>
                      <div style={{ display: "grid", gap: 2 }}>
                        <strong>Cartes spéciales</strong>
                        {!isMobile && <span style={{ color: "rgba(232, 216, 181, 0.56)", fontSize: 12 }}>+3 par manche, 6 en main maximum.</span>}
                      </div>
                      <div style={{ ...styles.twentyOneTrumpHand, gap: isMobile ? 4 : styles.twentyOneTrumpHand.gap }}>
                        {me.hand.map((card) => {
                      const palette = soulsCardPalette(card);
                      const isActive = selectedTwentyOneTrump?.id === card.id;
                      const isBustStand = me?.twentyOne?.autoBust || ((me?.twentyOne?.total ?? 0) > (state.twentyOne?.target ?? 21));
                      const isVoluntaryStand = me?.twentyOne?.stood && !isBustStand;
                      const trumpDescription = cardDetails(card);
                      return (
                        <button
                          key={card.id}
                          className="twenty-one-trump-card"
                          type="button"
                          disabled={!isMyTurn || me?.twentyOne?.stood || state.phase === "finished"}
                          onClick={() => handleCardClick(card)}
                          onMouseEnter={(event) => setHoveredTrump({ card, x: event.clientX, y: event.clientY })}
                          onMouseMove={(event) => setHoveredTrump({ card, x: event.clientX, y: event.clientY })}
                          onMouseLeave={() => setHoveredTrump(null)}
                          onFocus={() => setHoveredTrump(null)}
                          style={{
                            ...styles.twentyOneTrumpCard,
                            width: "100%",
                            minHeight: isMobile ? 88 : styles.twentyOneTrumpCard.minHeight,
                            aspectRatio: styles.twentyOneTrumpCard.aspectRatio,
                            padding: isMobile ? 5 : styles.twentyOneTrumpCard.padding,
                            background: palette.bg,
                            border: isActive ? "1px solid rgba(240, 138, 53, 0.86)" : "1px solid rgba(229, 208, 156, 0.34)",
                            opacity: !isMyTurn || me?.twentyOne?.stood || state.phase === "finished" ? 0.6 : isVoluntaryStand && !isActive ? 0.68 : 1
                          }}
                          aria-label={`${cardLabel(card)}. ${trumpDescription}`}
                        >
                          <strong style={{ ...styles.twentyOneTrumpTitle, fontSize: isMobile ? 10 : styles.twentyOneTrumpTitle.fontSize }}>{cardLabel(card)}</strong>
                          <span style={{ ...styles.twentyOneTrumpIcon, fontSize: isMobile ? 36 : styles.twentyOneTrumpIcon.fontSize }}>{palette.icon}</span>
                        </button>
                      );
                        })}
                      </div>
                    </>
                  ) : (
                    <span style={styles.twentyOneSideStatHint}>Mode spectateur : la mise reste visible pendant toute la manche.</span>
                  )}
                </aside>
            </div>

            {state.phase === "finished" && (
              <strong style={{ justifySelf: "center" }}>{twentyOneWinner?.name ?? "Un joueur"} gagne.</strong>
            )}
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
              {isSpectator ? (
                <div style={{ display: "grid", gap: 12 }}>
                  {visibleDuelPlayers.map((player) => (
                    <div key={player.id}>
                      <div style={{ ...styles.playerBadge, maxWidth: "100%", flexWrap: "wrap", fontSize: isMobilePortrait ? 12 : styles.playerBadge.fontSize, padding: isMobilePortrait ? "6px 10px" : styles.playerBadge.padding }}>
                        {player.name} · HP {player.hp} · Énergie {player.energy}/{state.config.maxEnergy} · {player.handCount} cartes
                      </div>
                      <div style={styles.opponentHand}>
                        {Array.from({ length: player.handCount }).map((_, index) => (
                          <div key={`${player.id}-spectator-card-${index}`} style={styles.cardBack}>UNO</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : opponents[0] ? (
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

        {state && !isLobbyPhase && !isTwentyOneGame && (
          <section style={{ ...styles.log, marginTop: isMobilePortrait ? 8 : styles.log.marginTop, maxHeight: isMobilePortrait ? 130 : styles.log.maxHeight, fontSize: isMobilePortrait ? 12 : styles.log.fontSize }}>
            <strong>Journal</strong>
            <ul>
              {state.log.map((entry, idx) => (
                <li key={`${entry.at}-${idx}`}>{entry.message}</li>
              ))}
            </ul>
          </section>
        )}

        {state?.phase === "finished" && (
          <div style={styles.modalBackdrop}>
            <div style={{ ...styles.modal, maxWidth: 460, textAlign: "center", display: "grid", gap: 12 }}>
              <span style={{ color: "rgba(232, 216, 181, 0.68)", fontSize: 13, fontWeight: 800, textTransform: "uppercase" }}>Partie terminée</span>
              <strong style={{ fontSize: 26, lineHeight: 1.1 }}>
                {gameWinner ? `${gameWinner.name} gagne` : "Égalité"}
              </strong>
              <span style={{ color: "rgba(232, 216, 181, 0.78)", fontSize: 14 }}>
                {[...(state.log ?? [])].reverse().find((entry) => entry.type === "game_finished")?.message ?? "La partie est finie."}
              </span>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
                {!isSpectator && (
                  <button
                    type="button"
                    onClick={replayCurrentGame}
                    style={{ ...styles.validateButton, width: "100%", justifySelf: "stretch" }}
                  >
                    Rejouer
                  </button>
                )}
                <button
                  type="button"
                  onClick={returnToMenu}
                  style={{ width: "100%", minHeight: 42 }}
                >
                  Menu
                </button>
              </div>
            </div>
          </div>
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
              <div style={{ fontSize: 42, lineHeight: 1 }}>{specialCardIcon(trumpPopup.card ?? { type: "trump" })}</div>
              <h3 style={{ margin: "6px 0" }}>Carte spéciale jouée</h3>
              <strong style={{ fontSize: 22 }}>{trumpPopup.card?.name ?? "Carte spéciale"}</strong>
              <p style={{ margin: "8px 0 0", fontWeight: 700 }}>{cardDetails(trumpPopup.card ?? { type: "trump" })}</p>
              <p style={{ marginBottom: 0 }}>{trumpPopup.message}</p>
            </div>
          </div>
        )}

        {isTwentyOneGame && twentyOneResultToast && (
          <div
            key={twentyOneResultToast.id}
            className={`twenty-one-winner-toast${twentyOneResultToast.tie ? " is-tie" : ""}`}
            style={styles.twentyOneWinnerToast}
          >
            <span style={styles.twentyOneWinnerSparks} aria-hidden="true">
              {[
                [-118, -34],
                [-82, 48],
                [-28, -68],
                [34, 64],
                [86, -44],
                [122, 26]
              ].map(([x, y], index) => (
                <span
                  key={`${twentyOneResultToast.id}-${index}`}
                  className="twenty-one-result-spark"
                  style={{
                    "--spark-x": `${x}px`,
                    "--spark-y": `${y}px`,
                    "--spark-delay": `${index * 70}ms`
                  }}
                />
              ))}
            </span>
            <span style={styles.twentyOneWinnerLabel}>
              {twentyOneResultToast.tie
                ? `Manche ${twentyOneResultToast.round}`
                : twentyOneResultToast.winnerId === me?.id
                  ? "Victoire"
                  : "Fin de manche"}
            </span>
            <strong style={styles.twentyOneWinnerName}>
              {twentyOneResultToast.tie ? "Égalité" : twentyOneResultToast.winnerName}
            </strong>
            <span style={styles.twentyOneWinnerMeta}>
              {twentyOneResultToast.tie
                ? `Personne ne perd de vie · cible ${twentyOneResultToast.target}`
                : twentyOneResultToast.gameOver
                  ? "remporte Twenty One"
                  : `${twentyOneResultToast.loserName} perd ${twentyOneResultToast.damage} vie`}
            </span>
          </div>
        )}

        {hoveredTrump && (
          <div
            style={{
              ...styles.trumpTooltip,
              left: Math.min(Math.max(hoveredTrump.x, 118), viewport.width - 118),
              top: Math.max(hoveredTrump.y - 12, 42),
              transform: "translate(-50%, -100%)"
            }}
          >
            {cardDetails(hoveredTrump.card)}
          </div>
        )}

        {error && <p style={{ color: "#d3533a", fontWeight: 700, textTransform: "uppercase", textShadow: "0 0 14px rgba(211,83,58,0.58)" }}>{error}</p>}
      </div>
    </main>
  );
}
