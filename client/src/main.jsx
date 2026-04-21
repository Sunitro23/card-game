import React from "react";
import { createRoot } from "react-dom/client";
import { io } from "socket.io-client";

const socket = io("http://localhost:3001", { autoConnect: false });

function App() {
  const [name, setName] = React.useState("Joueur");
  const [code, setCode] = React.useState("");
  const [state, setState] = React.useState(null);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    socket.on("room:state", setState);
    socket.on("game:error", (e) => setError(e.message));
    return () => {
      socket.off("room:state", setState);
      socket.off("game:error");
    };
  }, []);

  function ensureConnection() {
    if (!socket.connected) socket.connect();
  }

  return (
    <main style={{ padding: 16, fontFamily: "sans-serif", maxWidth: 420, margin: "0 auto" }}>
      <h1>Card Game MVP</h1>
      <label>
        Pseudo
        <input value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%" }} />
      </label>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={() => { ensureConnection(); socket.emit("room:create", { playerName: name }); }}>
          Créer
        </button>
        <input value={code} placeholder="Code room" onChange={(e) => setCode(e.target.value.toUpperCase())} />
        <button onClick={() => { ensureConnection(); socket.emit("room:join", { code, playerName: name }); }}>
          Rejoindre
        </button>
      </div>

      {state && (
        <section style={{ marginTop: 16 }}>
          <p><strong>Room:</strong> {state.code} ({state.phase})</p>
          <button onClick={() => socket.emit("game:start", { code: state.code })}>Démarrer</button>
          <button onClick={() => socket.emit("turn:end", { code: state.code })}>Fin de tour</button>
          <h2>Joueurs</h2>
          <ul>
            {state.players.map((p) => (
              <li key={p.id}>{p.name} - HP {p.hp} - Mana {p.mana} - Main {p.handCount}</li>
            ))}
          </ul>
          <h2>Journal</h2>
          <ul>
            {state.log.map((e, idx) => (
              <li key={`${e.at}-${idx}`}>{e.message}</li>
            ))}
          </ul>
        </section>
      )}

      {error && <p style={{ color: "crimson" }}>{error}</p>}
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
