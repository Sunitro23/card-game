import React from "react";
import { createRoot } from "react-dom/client";
import { io } from "socket.io-client";

const socketUrl =
  import.meta.env.VITE_SOCKET_URL ?? "https://owlbearapi.sunitro.de";

const socket = io(socketUrl, {
  autoConnect: false,
  path: "/socket.io/",
  transports: ["websocket", "polling"],
});

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
      playerName: name.trim() || "Joueur",
    });
  }

  function handleStartGame() {
    if (!state) return;
    socket.emit("game:start", { code: state.code });
  }

  function handleEndTurn() {
    socket.emit("turn:end");
  }

  return (
    <main
      style={{
        padding: 16,
        fontFamily: "sans-serif",
        maxWidth: 420,
        margin: "0 auto",
      }}
    >
      <h1>Card Game MVP</h1>

      <label style={{ display: "block" }}>
        <div>Pseudo</div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: "100%" }}
        />
      </label>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={handleCreateRoom}>Créer</button>
        <input
          value={code}
          placeholder="Code room"
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />
        <button onClick={handleJoinRoom}>Rejoindre</button>
      </div>

      {state && (
        <section style={{ marginTop: 16 }}>
          <p>
            <strong>Room:</strong> {state.code} ({state.phase})
          </p>

          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button onClick={handleStartGame}>Démarrer</button>
            <button onClick={handleEndTurn}>Fin de tour</button>
          </div>

          <h2>Joueurs</h2>
          <ul>
            {state.players.map((p) => (
              <li key={p.id}>
                {p.name} - HP {p.hp} - Mana {p.mana} - Main {p.handCount}
              </li>
            ))}
          </ul>

          <h2>Journal</h2>
          <ul>
            {state.log.map((entry, idx) => (
              <li key={`${entry.at}-${idx}`}>{entry.message}</li>
            ))}
          </ul>
        </section>
      )}

      {error && <p style={{ color: "crimson" }}>{error}</p>}
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