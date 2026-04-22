import React from "react";
import { createRoot } from "react-dom/client";
import { io } from "socket.io-client";

const socketUrl = import.meta.env.VITE_SOCKET_URL ?? "https://owlbearapi.sunitro.de";

const socket = io(socketUrl, {
  autoConnect: false,
  path: "/socket.io/",
  transports: ["websocket", "polling"]
});

const styles = {
  page: {
    minHeight: "100vh",
    padding: 14,
    fontFamily: "'Trebuchet MS', 'Inter', system-ui, sans-serif",
    background: "radial-gradient(circle at 50% 20%, #7ad4ff 0%, #5b8cff 38%, #4439a8 100%)",
    color: "#0d1021",
    boxSizing: "border-box"
  },
  panel: {
    margin: "0 auto",
    maxWidth: 1060
  },
  lobby: {
    background: "rgba(255,255,255,0.9)",
    borderRadius: 16,
    padding: 10,
    marginBottom: 10,
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    boxShadow: "0 12px 30px rgba(8,8,26,0.2)"
  },
  board: {
    borderRadius: 22,
    minHeight: 460,
    background: "radial-gradient(circle at center, #8fe8ff 0%, #67b6ff 46%, #4f74da 100%)",
    boxShadow: "inset 0 0 0 3px rgba(255,255,255,0.45), 0 14px 28px rgba(15,21,55,0.35)",
    padding: 14,
    display: "grid",
    gridTemplateRows: "auto auto auto",
    gap: 12
  },
  centerArena: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },
  centerPanel: {
    borderRadius: 20,
    width: "min(100%, 640px)",
    minHeight: 150,
    background: "linear-gradient(150deg, rgba(8, 21, 55, 0.86), rgba(17, 44, 105, 0.9))",
    boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.35), 0 14px 28px rgba(12, 16, 38, 0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
    gap: 14,
    padding: 14
  },
  arenaSlot: {
    border: "3px solid #fefefe",
    width: 170,
    minHeight: 94,
    borderRadius: 12,
    background: "rgba(14, 20, 41, 0.92)",
    color: "#f4f4f4",
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
    borderRadius: 14,
    border: "3px solid #fff",
    background: "linear-gradient(135deg, #26b06f, #168f9b)",
    color: "#fff",
    boxShadow: "0 10px 16px rgba(5, 18, 27, 0.45)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    fontWeight: 800,
    cursor: "pointer",
    transition: "transform 130ms ease, filter 130ms ease"
  },
  playerBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    background: "rgba(10,20,40,0.78)",
    color: "#fff",
    padding: "7px 14px",
    fontSize: 13,
    marginBottom: 10,
    boxShadow: "0 4px 10px rgba(5,7,16,0.3)"
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
    borderRadius: 10,
    border: "3px solid #f1f1f1",
    background: "linear-gradient(140deg, #241f84, #5421b8)",
    color: "#ffde59",
    fontWeight: 900,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 6px 0 rgba(8,9,20,0.35)"
  },
  cardButton: {
    width: 124,
    minHeight: 152,
    borderRadius: 14,
    border: "3px solid #fff",
    color: "#fff",
    boxShadow: "0 12px 16px rgba(16, 24, 46, 0.38)",
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
    opacity: 0.95
  },
  cardMain: {
    fontWeight: 900,
    fontSize: 28,
    lineHeight: 1,
    textShadow: "0 2px 4px rgba(0,0,0,0.25)"
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
    borderRadius: 14,
    background: "rgba(255,255,255,0.9)",
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
    borderRadius: 14,
    border: "3px solid #fff",
    color: "#fff",
    fontWeight: 800,
    boxShadow: "0 10px 14px rgba(16, 24, 46, 0.32)",
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
  log: {
    marginTop: 10,
    maxHeight: 180,
    overflow: "auto",
    borderRadius: 12,
    background: "rgba(8, 18, 28, 0.8)",
    color: "#fff",
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
    background: "rgba(2, 6, 22, 0.72)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 30,
    padding: 12
  },
  modal: {
    width: "min(100%, 820px)",
    borderRadius: 16,
    background: "linear-gradient(135deg, #2b3f89, #4b2b86)",
    padding: 16,
    boxShadow: "0 18px 36px rgba(5, 8, 20, 0.46)",
    border: "3px solid #fff",
    color: "#fff"
  },
  modalCards: {
    marginTop: 10,
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center"
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
  if (card.type === "utility") return { bg: "linear-gradient(135deg, #7d4dff, #4c72ff)", icon: "★" };

  if (card.defense === "dodge") return { bg: "linear-gradient(135deg, #ff9d4d, #ff5858)", icon: "↺" };
  if (card.defense === "block") return { bg: "linear-gradient(135deg, #25ad63, #0b7b6a)", icon: "🛡" };
  if (card.defense === "counter_melee") return { bg: "linear-gradient(135deg, #ffd447, #ff8e32)", icon: "⚔" };
  if (card.defense === "counter_magic") return { bg: "linear-gradient(135deg, #00a0ff, #4a39ff)", icon: "✦" };

  return { bg: "linear-gradient(135deg, #6d7ea5, #43506c)", icon: "?" };
}

function cardLabel(card) {
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

function App() {
  const [name, setName] = React.useState("Joueur");
  const [code, setCode] = React.useState("");
  const [state, setState] = React.useState(null);
  const [error, setError] = React.useState("");
  const [activeCardId, setActiveCardId] = React.useState(null);
  const [isMobile, setIsMobile] = React.useState(() => window.matchMedia("(max-width: 700px)").matches);

  React.useEffect(() => {
    const query = window.matchMedia("(max-width: 700px)");
    const onChange = (event) => setIsMobile(event.matches);
    query.addEventListener("change", onChange);
    setIsMobile(query.matches);
    return () => query.removeEventListener("change", onChange);
  }, []);

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

  React.useEffect(() => {
    if (!me) {
      setActiveCardId(null);
      return;
    }

    if (!me.hand.some((card) => card.id === activeCardId)) {
      setActiveCardId(null);
    }
  }, [me, activeCardId]);

  function ensureConnection() {
    if (!socket.connected) socket.connect();
  }

  function handleCreateRoom() {
    ensureConnection();
    setError("");
    socket.emit("room:create", { playerName: name.trim() || "Joueur" });
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

  function handleEndTurn() {
    socket.emit("turn:end");
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

  function handleCardClick(card) {
    if (activeCardId === card.id) {
      if (card.type === "utility" && isMyTurn && !pendingAttack) {
        playCard(card.id, opponents[0]?.id);
      } else {
        setActiveCardId(null);
      }
      return;
    }

    setActiveCardId(card.id);
  }

  return (
    <main style={{ ...styles.page, padding: isMobile ? 8 : styles.page.padding }}>
      <div style={styles.panel}>
        <section style={styles.lobby}>
          <strong>Card Game MVP</strong>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Pseudo" />
          <button onClick={handleCreateRoom}>Créer</button>
          <input
            value={code}
            placeholder="Code room"
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
          <button onClick={handleJoinRoom}>Rejoindre</button>
          {state && (
            <>
              <button onClick={handleStartGame}>Démarrer</button>
              <button onClick={handleEndTurn} disabled={!isMyTurn || Boolean(pendingAttack)}>
                Fin de tour
              </button>
              <span>
                Room <strong>{state.code}</strong> - {state.phase}
              </span>
              <span style={styles.turnBox}>{isMyTurn ? "✅ Ton tour" : "⏳ Tour adverse"}</span>
            </>
          )}
        </section>

        {state && (
          <section style={{ ...styles.board, minHeight: isMobile ? 380 : styles.board.minHeight, padding: isMobile ? 10 : styles.board.padding }}>
            <div>
              {opponents[0] ? (
                <>
                  <div style={styles.playerBadge}>
                    {opponents[0].name} · HP {opponents[0].hp} · Énergie {opponents[0].energy}/{state.config.maxEnergy} · {opponents[0].handCount} cartes
                  </div>
                  <div style={styles.opponentHand}>
                    {Array.from({ length: opponents[0].handCount }).map((_, index) => (
                      (() => {
                        const revealedCard = previewCardFromVision(state.opponentHandPreview?.[index]);
                        const palette = revealedCard ? cardPalette(revealedCard) : null;
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
                <div style={styles.playerBadge}>En attente d'un adversaire...</div>
              )}
            </div>

            <div style={styles.centerArena}>
              <div style={{ ...styles.centerPanel, minHeight: isMobile ? 126 : styles.centerPanel.minHeight, gap: isMobile ? 8 : styles.centerPanel.gap }}>
                <button
                  type="button"
                  onClick={drawCard}
                  disabled={!isMyTurn || Boolean(pendingAttack)}
                  style={{
                    ...styles.drawDeckButton,
                    width: isMobile ? 98 : styles.drawDeckButton.width,
                    minHeight: isMobile ? 124 : styles.drawDeckButton.minHeight,
                    opacity: !isMyTurn || Boolean(pendingAttack) ? 0.6 : 1
                  }}
                  title="Clique pour piocher une carte utilitaire/défense (1 énergie)."
                >
                  <div style={styles.actionIcon}>🂠</div>
                  <div style={{ fontSize: 13 }}>Pioche</div>
                  <div style={{ fontSize: 11, opacity: 0.9 }}>1 énergie</div>
                </button>
                {pendingAttack && (
                  <div style={{ ...styles.arenaSlot, width: isMobile ? 130 : styles.arenaSlot.width, minHeight: isMobile ? 78 : styles.arenaSlot.minHeight, fontSize: isMobile ? 11 : styles.arenaSlot.fontSize }}>
                    {`${pendingAttack.card.label} sur ${isMyDefenseTurn ? "toi" : opponents[0]?.name ?? "cible"}`}
                  </div>
                )}
              </div>
            </div>

            {me && (
              <div>
                <div style={styles.playerBadge}>
                  {me.name} · HP {me.hp} · Énergie {me.energy}/{state.config.maxEnergy}
                </div>
                <div style={{ ...styles.handRow, minHeight: isMobile ? 124 : styles.handRow.minHeight, gap: isMobile ? 6 : styles.handRow.gap }}>
                  {me.hand.map((card, index) => {
                    const palette = cardPalette(card);
                    const isActive = activeCardId === card.id;
                    const tilt = (index - (me.hand.length - 1) / 2) * 5;
                    return (
                      <button
                        key={card.id}
                        type="button"
                        style={{
                          ...styles.cardButton,
                          width: isMobile ? 96 : styles.cardButton.width,
                          minHeight: isMobile ? 124 : styles.cardButton.minHeight,
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
                        <div style={styles.cardMain}>{palette.icon}</div>
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

        {state && (
          <section style={styles.controls}>
            <div>
              <strong>Actions de tour</strong>
              <div style={{ ...styles.actionCards, gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : styles.actionCards.gridTemplateColumns }}>
                {["ranged", "magic", "melee"].map((attackType) => {
                  const theme = attackCardTheme(attackType);
                  return (
                    <button
                      key={attackType}
                      onClick={() => attack(attackType)}
                      disabled={!isMyTurn || Boolean(pendingAttack)}
                      style={{
                        ...styles.actionCardButton,
                        background: theme.bg,
                        minHeight: isMobile ? 94 : styles.actionCardButton.minHeight,
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

        {state && (
          <section style={styles.log}>
            <strong>Journal</strong>
            <ul>
              {state.log.map((entry, idx) => (
                <li key={`${entry.at}-${idx}`}>{entry.message}</li>
              ))}
            </ul>
          </section>
        )}

        {isMyDefenseTurn && (
          <div style={styles.modalBackdrop}>
            <div style={{ ...styles.modal, padding: isMobile ? 12 : styles.modal.padding }}>
              <h3 style={{ margin: 0 }}>🛡 Défense requise</h3>
              <p style={{ marginBottom: 8 }}>
                Tu subis <strong>{pendingAttack?.card.label}</strong>. Choisis une défense valide.
              </p>

              <div style={styles.modalCards}>
                {validDefenseCards.map((card) => {
                  const palette = cardPalette(card);
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

        {error && <p style={{ color: "#8b0000", fontWeight: 700 }}>{error}</p>}
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
