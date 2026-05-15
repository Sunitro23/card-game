import React from "react";
import { styles } from "./styles.js";
import { AwaleDirectionRow, AwaleMiddleFlow, AwalePit } from "./awaleView.jsx";
import { CardDuelView } from "./CardDuelView.jsx";
import { LobbyView } from "./LobbyView.jsx";
import { cardDetails, cardLabel, soulsCardPalette, specialCardIcon, trumpShortEffect } from "./cardPresentation.js";
import { getAwaleRows, getDefenseCards, getGameWinner, getInvalidDefenseCards, getIsSpectator, getMe, getOpponents, getSelectedTwentyOneTrump, getTwentyOneWinner, getValidDefenseCards, getVisibleDuelPlayers } from "./selectors.js";
import { TwentyOneView } from "./TwentyOneView.jsx";
import { useRoomSocket } from "./useRoomSocket.js";
import { useViewport } from "./useViewport.js";

export function App() {
  const [name, setName] = React.useState("Joueur");
  const [code, setCode] = React.useState("");
  const [gameType, setGameType] = React.useState("card_duel");
  const [roomAction, setRoomAction] = React.useState("join");
  const { state, setState, error, setError, ensureConnection, emit, disconnect } = useRoomSocket();
  const [activeCardId, setActiveCardId] = React.useState(null);
  const [hoveredTrump, setHoveredTrump] = React.useState(null);
  const [copyFeedback, setCopyFeedback] = React.useState("");
  const [showAwaleRules, setShowAwaleRules] = React.useState(false);
  const [showTwentyOneRules, setShowTwentyOneRules] = React.useState(false);
  const [duelResultPopup, setDuelResultPopup] = React.useState(null);
  const [trumpPopup, setTrumpPopup] = React.useState(null);
  const [twentyOneResultToast, setTwentyOneResultToast] = React.useState(null);
  const { viewport, isMobile, isMobilePortrait, isMobileLandscape } = useViewport();

  const me = React.useMemo(() => getMe(state), [state]);
  const isSpectator = getIsSpectator(state, me);
  const opponents = React.useMemo(() => getOpponents(state, me), [state, me]);
  const visibleDuelPlayers = React.useMemo(() => getVisibleDuelPlayers(state, me, opponents), [state, me, opponents]);
  const selectedTwentyOneTrump = React.useMemo(() => getSelectedTwentyOneTrump(me, activeCardId), [activeCardId, me]);
  const twentyOneWinner = React.useMemo(() => getTwentyOneWinner(state), [state]);

  const pendingAttack = state?.pendingAttack;
  const isMyTurn = Boolean(state && me && state.turnPlayerId === me.id);
  const isMyDefenseTurn = Boolean(pendingAttack && me && pendingAttack.targetId === me.id);
  const isLobbyPhase = state?.phase === "lobby";
  const isAwaleGame = state?.gameType === "awale";
  const isTwentyOneGame = state?.gameType === "twenty_one";
  const isHost = Boolean(state && me && state.hostPlayerId === me.id);
  const defenseCards = React.useMemo(() => getDefenseCards(me), [me]);
  const validDefenseCards = React.useMemo(() => getValidDefenseCards(defenseCards, pendingAttack), [defenseCards, pendingAttack]);
  const invalidDefenseCards = React.useMemo(() => getInvalidDefenseCards(defenseCards, pendingAttack), [defenseCards, pendingAttack]);
  const awaleRows = React.useMemo(() => getAwaleRows(state, me), [state, me]);
  const gameWinner = React.useMemo(() => getGameWinner(state), [state]);

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
    const event = state?.cardDuel?.lastEvent;
    if (!event?.id || state?.gameType !== "card_duel") return;

    setDuelResultPopup(event);
    const timer = setTimeout(() => setDuelResultPopup(null), 3200);
    return () => clearTimeout(timer);
  }, [state?.cardDuel?.lastEvent?.id, state?.gameType]);

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

  function handleCreateRoom() {
    ensureConnection();
    setError("");
    emit("room:create", { playerName: name.trim() || "Joueur", gameType });
  }

  function handleJoinRoom() {
    ensureConnection();
    setError("");
    emit("room:join", {
      code: code.trim().toUpperCase(),
      playerName: name.trim() || "Joueur"
    });
  }

  function handleSpectateRoom() {
    ensureConnection();
    setError("");
    emit("room:spectate", {
      code: code.trim().toUpperCase(),
      spectatorName: name.trim() || "Spectateur"
    });
  }

  function handleStartGame() {
    if (!state) return;
    emit("game:start", { code: state.code });
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
    emit("turn:end", { source: "skip_icon_button" });
  }

  function playCard(cardId, targetPlayerId) {
    emit("card:play", { cardId, targetPlayerId });
    setActiveCardId(null);
  }

  function attack(attackType) {
    emit("combat:attack", { attackType, targetPlayerId: opponents[0]?.id });
  }

  function drawCard() {
    emit("turn:draw");
  }

  function defend(defenseCardId) {
    emit("combat:defend", { defenseCardId });
  }

  function defendWithoutCard() {
    emit("combat:defend", {});
  }

  function playAwalePit(pitIndex) {
    emit("awale:move", { pitIndex });
  }

  function drawTwentyOneNumber() {
    emit("twentyone:draw-number");
  }

  function standTwentyOne() {
    emit("twentyone:stand");
  }

  function playTwentyOneTrump(cardId) {
    emit("twentyone:play-trump", { cardId });
    setActiveCardId(null);
  }

  function abortCurrentGame() {
    emit("game:abort");
  }

  function replayCurrentGame() {
    emit("game:replay");
  }

  function returnToMenu() {
    disconnect();
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

  function duelResultCopy(event) {
    if (!event) return null;
    const defender = event.defenderId === me?.id ? "Tu" : event.defenderName;
    const attacker = event.attackerId === me?.id ? "Tu" : event.attackerName;

    if (event.type === "dodge") {
      return {
        label: "Esquive",
        title: `${defender} esquive l'attaque`,
        detail: "Aucun degat subi.",
        meta: `${event.attackLabel} evitee`,
        icon: "↺"
      };
    }
    if (event.type === "block") {
      return {
        label: "Blocage",
        title: `${defender} bloque`,
        detail: event.damage > 0 ? `${event.damage} degat(s) passent.` : "Tout est absorbe.",
        meta: `${event.attackLabel} reduite`,
        icon: "▣"
      };
    }
    if (event.type === "counter_melee" || event.type === "counter_magic") {
      return {
        label: "Contre reussi",
        title: `${defender} contre`,
        detail: `${event.reflectedDamage} degat(s) renvoyes a ${attacker}.`,
        meta: "L'attaque est annulee",
        icon: "⚔"
      };
    }
    if (event.type === "counter_fail") {
      return {
        label: "Contre rate",
        title: `${defender} rate son contre`,
        detail: `${event.damage} degat(s) subis.`,
        meta: `${event.attackLabel} touche`,
        icon: "!"
      };
    }
    return {
      label: "Impact",
      title: `${attacker} touche ${defender}`,
      detail: `${event.damage} degat(s) subis.`,
      meta: "Aucune defense jouee",
      icon: "✦"
    };
  }

  const duelResult = duelResultCopy(duelResultPopup);

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
        <LobbyView
          state={state}
          isLobbyPhase={isLobbyPhase}
          isMobilePortrait={isMobilePortrait}
          name={name}
          setName={setName}
          code={code}
          setCode={setCode}
          gameType={gameType}
          setGameType={setGameType}
          roomAction={roomAction}
          setRoomAction={setRoomAction}
          copyFeedback={copyFeedback}
          isHost={isHost}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onSpectateRoom={handleSpectateRoom}
          onCopyRoomCode={copyRoomCode}
          onStartGame={handleStartGame}
        />

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
          <TwentyOneView
            state={state}
            me={me}
            opponents={opponents}
            isMobile={isMobile}
            isMobilePortrait={isMobilePortrait}
            isSpectator={isSpectator}
            isMyTurn={isMyTurn}
            showRules={showTwentyOneRules}
            selectedTrump={selectedTwentyOneTrump}
            winner={twentyOneWinner}
            onToggleRules={() => setShowTwentyOneRules((visible) => !visible)}
            onAbort={abortCurrentGame}
            onDrawNumber={drawTwentyOneNumber}
            onStand={standTwentyOne}
            onCardClick={handleCardClick}
            onHoverTrump={setHoveredTrump}
          />
        )}

        <CardDuelView
          state={state}
          me={me}
          opponents={opponents}
          visibleDuelPlayers={visibleDuelPlayers}
          isMobile={isMobile}
          isMobilePortrait={isMobilePortrait}
          isSpectator={isSpectator}
          isMyTurn={isMyTurn}
          isMyDefenseTurn={isMyDefenseTurn}
          pendingAttack={pendingAttack}
          activeCardId={activeCardId}
          onDrawCard={drawCard}
          onEndTurn={handleEndTurnFromSkipIcon}
          onCardClick={handleCardClick}
          onAttack={attack}
        />

        {state && !isLobbyPhase && isAwaleGame && (
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

        {!isLobbyPhase && !isAwaleGame && !isTwentyOneGame && duelResult && (
          <div
            key={duelResultPopup.id}
            className={`twenty-one-winner-toast duel-result-popup${duelResultPopup.type === "counter_fail" ? " is-tie" : ""}`}
            style={styles.duelResultPopup}
          >
            <span style={styles.twentyOneWinnerSparks} aria-hidden="true">
              {[
                [-112, -28],
                [-72, 42],
                [-24, -58],
                [32, 58],
                [76, -36],
                [112, 22]
              ].map(([x, y], index) => (
                <span
                  key={`${duelResultPopup.id}-${index}`}
                  className="twenty-one-result-spark"
                  style={{
                    "--spark-x": `${x}px`,
                    "--spark-y": `${y}px`,
                    "--spark-delay": `${index * 70}ms`
                  }}
                />
              ))}
            </span>
            <span style={styles.twentyOneWinnerLabel}>{duelResult.label}</span>
            <strong style={styles.duelResultTitle}>
              <span aria-hidden="true">{duelResult.icon}</span> {duelResult.title}
            </strong>
            <span style={styles.twentyOneWinnerMeta}>{duelResult.detail}</span>
            <span style={styles.duelResultMeta}>{duelResult.meta}</span>
          </div>
        )}

        {trumpPopup && (
          <div style={styles.modalBackdrop}>
            <div style={{ ...styles.modal, maxWidth: 440, textAlign: "center", animation: "trump-popup-pop 220ms ease-out" }}>
              <div style={{ fontSize: 42, lineHeight: 1 }}>{specialCardIcon(trumpPopup.card ?? { type: "trump" })}</div>
              <h3 style={{ margin: "6px 0" }}>Carte spéciale jouée</h3>
              <strong style={{ fontSize: 22 }}>{trumpPopup.card?.name ?? "Carte spéciale"}</strong>
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
