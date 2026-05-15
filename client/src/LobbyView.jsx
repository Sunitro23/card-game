import { GAME_CHOICES } from "./gameChoices.js";
import { styles } from "./styles.js";
import { theme } from "./theme.js";

export function LobbyView({
  state,
  isLobbyPhase,
  isMobilePortrait,
  name,
  setName,
  code,
  setCode,
  gameType,
  setGameType,
  roomAction,
  setRoomAction,
  copyFeedback,
  isHost,
  onCreateRoom,
  onJoinRoom,
  onSpectateRoom,
  onCopyRoomCode,
  onStartGame
}) {
  const handleCreateRoom = onCreateRoom;
  const handleJoinRoom = onJoinRoom;
  const handleSpectateRoom = onSpectateRoom;
  const copyRoomCode = onCopyRoomCode;
  const handleStartGame = onStartGame;
  const selectedMode = GAME_CHOICES.find((choice) => choice.id === gameType) ?? GAME_CHOICES[0];

  return (
    <>
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


    </>
  );
}
