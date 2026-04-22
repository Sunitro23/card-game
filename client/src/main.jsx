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
    padding: 12,
    fontFamily: "Inter, system-ui, sans-serif",
    background: "#13c75b",
    color: "#0d1021",
    boxSizing: "border-box"
  },
  panel: {
    margin: "0 auto",
    maxWidth: 1000
  },
  lobby: {
    background: "rgba(255,255,255,0.9)",
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8
  },
  board: {
    borderRadius: 18,
    minHeight: 420,
    background: "radial-gradient(circle at center, #2fd46f 0%, #13c75b 52%, #10b752 100%)",
    boxShadow: "inset 0 0 0 3px rgba(255,255,255,0.2)",
    padding: 12,
    display: "grid",
    gridTemplateRows: "auto auto auto",
    gap: 12
  },
  centerArena: {
    display: "flex",
    justifyContent: "center"
  },
  arenaCard: {
    background: "#d31936",
    borderRadius: 12,
    width: "min(100%, 360px)",
    minHeight: 110,
    boxShadow: "0 6px 0 #8c0f23",
    display: "flex",
    gap: 12,
    justifyContent: "center",
    alignItems: "center",
    padding: 10
  },
  arenaSlot: {
    border: "3px solid #f4f4f4",
    width: 110,
    height: 90,
    borderRadius: 10,
    background: "#10111a",
    color: "#f4f4f4",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 12,
    textAlign: "center",
    padding: 4
  },
  playerBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    background: "rgba(10,20,40,0.8)",
    color: "#fff",
    padding: "6px 12px",
    fontSize: 13,
    marginBottom: 8
  },
  handRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
    gap: 8
  },
  opponentHand: {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 6,
    minHeight: 60
  },
  cardBack: {
    width: 48,
    height: 68,
    borderRadius: 8,
    border: "3px solid #f1f1f1",
    background: "#10111a",
    color: "#ffcc00",
    fontWeight: 900,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  myCard: {
    borderRadius: 12,
    border: "3px solid #fff",
    background: "#f8f8f8",
    boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
    padding: 8
  },
  myCardTitle: {
    fontSize: 13,
    fontWeight: 700,
    minHeight: 34
  },
  small: {
    fontSize: 12,
    opacity: 0.8
  },
  controls: {
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    background: "rgba(255,255,255,0.88)",
    display: "grid",
    gap: 10
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
  }
};

function cardLabel(card) {
  if (card.type === "defense") return `DEF ${card.defense}`;
  if (card.type === "utility") return `UTIL ${card.utility}`;
  return card.type;
}

function cardDetails(card) {
  if (card.type === "defense" && card.value) return `Réduction: ${card.value}`;
  return "";
}

function App() {
  const [name, setName] = React.useState("Joueur");
  const [code, setCode] = React.useState("");
  const [state, setState] = React.useState(null);
  const [error, setError] = React.useState("");

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
  const defenseCards = me?.hand?.filter((c) => c.type === "defense") ?? [];

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

  return (
    <main style={styles.page}>
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
          <section style={styles.board}>
            <div>
              {opponents[0] ? (
                <>
                  <div style={styles.playerBadge}>
                    {opponents[0].name} · HP {opponents[0].hp} · Énergie {opponents[0].energy}/{state.config.maxEnergy} · {opponents[0].handCount} cartes
                  </div>
                  <div style={styles.opponentHand}>
                    {Array.from({ length: opponents[0].handCount }).map((_, index) => (
                      <div key={`opponent-card-${index}`} style={styles.cardBack}>
                        DOS
                      </div>
                    ))}
                  </div>
                  {state.opponentDeckPreview && (
                    <div style={styles.small}>Deck adverse visible: {state.opponentDeckPreview.join(", ")}</div>
                  )}
                </>
              ) : (
                <div style={styles.playerBadge}>En attente d'un adversaire...</div>
              )}
            </div>

            <div style={styles.centerArena}>
              <div style={styles.arenaCard}>
                <div style={styles.arenaSlot}>Pioche util/def (1 énergie)</div>
                <div style={styles.arenaSlot}>{pendingAttack ? pendingAttack.card.label : "Aucune attaque"}</div>
              </div>
            </div>

            {me && (
              <div>
                <div style={styles.playerBadge}>
                  {me.name} · HP {me.hp} · Énergie {me.energy}/{state.config.maxEnergy}
                </div>
                <div style={styles.handRow}>
                  {me.hand.map((card) => (
                    <div key={card.id} style={styles.myCard}>
                      <div style={styles.myCardTitle}>{cardLabel(card)}</div>
                      <div style={styles.small}>{cardDetails(card)}</div>
                      {card.type === "utility" && (
                        <div>
                          <button
                            onClick={() => playCard(card.id, opponents[0]?.id)}
                            disabled={!opponents[0] || !isMyTurn || Boolean(pendingAttack)}
                          >
                            Utiliser
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {state && (
          <section style={styles.controls}>
            <div>
              <strong>Actions de tour</strong>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                <button onClick={() => attack("ranged")} disabled={!isMyTurn || Boolean(pendingAttack)}>
                  Attaque distance (D4)
                </button>
                <button onClick={() => attack("magic")} disabled={!isMyTurn || Boolean(pendingAttack)}>
                  Attaque magique (D6)
                </button>
                <button onClick={() => attack("melee")} disabled={!isMyTurn || Boolean(pendingAttack)}>
                  Attaque mêlée (D8)
                </button>
                <button onClick={drawCard} disabled={!isMyTurn || Boolean(pendingAttack)}>
                  Piocher (1 énergie)
                </button>
              </div>
            </div>

            {isMyDefenseTurn && (
              <div>
                <strong>Défense</strong>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                  {defenseCards.map((card) => (
                    <button key={card.id} onClick={() => defend(card.id)}>
                      Défendre: {card.defense}
                    </button>
                  ))}
                  <button onClick={defendWithoutCard}>Aucune défense</button>
                </div>
              </div>
            )}
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
