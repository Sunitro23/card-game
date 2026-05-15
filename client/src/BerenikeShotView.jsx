import React from "react";
import { styles } from "./styles.js";

const TARGET_ITEMS = new Set(["chains", "skeleton_key"]);

function bulletLabel(type) {
  if (type === "real") return "réelle";
  if (type === "blank") return "factice";
  return "inconnue";
}

function playerPoint(index, count) {
  const angle = -90 + (360 / Math.max(count, 1)) * index;
  const rad = (angle * Math.PI) / 180;
  return {
    left: 50 + Math.cos(rad) * 39,
    top: 48 + Math.sin(rad) * 35,
    angle
  };
}

function getShotAngle(players, targetId) {
  const index = players.findIndex((player) => player.id === targetId);
  if (index < 0) return 0;
  return playerPoint(index, players.length).angle;
}

function itemHint(item) {
  if (!item) return "";
  if (item.type === "chains") return "Choisis une cible à entraver.";
  if (item.type === "skeleton_key") return "Choisis un joueur dont voler un consommable.";
  return item.desc;
}

export function BerenikeShotView({ state, me, isMobile, isMobilePortrait, emit, abortCurrentGame }) {
  const [selectedItemId, setSelectedItemId] = React.useState(null);
  const [rulesOpen, setRulesOpen] = React.useState(false);
  const selectedItem = me?.berenike?.inventory?.find((item) => item.id === selectedItemId) ?? null;
  const currentPlayer = state.players.find((player) => player.id === state.turnPlayerId);
  const isMyTurn = Boolean(me && state.turnPlayerId === me.id && me.berenike?.active);
  const activePlayers = state.players.filter((player) => player.berenike?.active);
  const lastTargetId = state.berenike?.lastShot?.targetId ?? state.turnPlayerId;
  const musketAngle = getShotAngle(state.players, lastTargetId);

  React.useEffect(() => {
    if (!selectedItemId) return;
    if (!me?.berenike?.inventory?.some((item) => item.id === selectedItemId)) {
      setSelectedItemId(null);
    }
  }, [me, selectedItemId]);

  function useItem(item, targetPlayer = null) {
    if (!item || !isMyTurn) return;

    const payload = { itemId: item.id };
    if (item.type === "chains") {
      if (!targetPlayer) return;
      payload.targetPlayerId = targetPlayer.id;
    }
    if (item.type === "skeleton_key") {
      if (!targetPlayer) return;
      const stolen = targetPlayer.berenike.inventory.find((candidate) => candidate.type !== "skeleton_key");
      if (!stolen) return;
      payload.targetPlayerId = targetPlayer.id;
      payload.stolenItemId = stolen.id;
      payload.secondaryTargetPlayerId = targetPlayer.id;
    }

    emit("berenike:item", payload);
    setSelectedItemId(null);
  }

  function handleItemClick(item) {
    if (!isMyTurn) return;
    if (TARGET_ITEMS.has(item.type)) {
      setSelectedItemId(selectedItemId === item.id ? null : item.id);
      return;
    }
    useItem(item);
  }

  function handlePlayerClick(player) {
    if (!isMyTurn || !player.berenike?.active) return;
    if (selectedItem) {
      useItem(selectedItem, player);
      return;
    }
    emit("berenike:shoot", { targetPlayerId: player.id });
  }

  return (
    <section style={{ display: "grid", gap: 10, width: "100%" }}>
      <style>{`
        .berenike-player:hover .berenike-inventory { opacity: 1; transform: translate(-50%, -8px); pointer-events: auto; }
        .berenike-target:hover:not(:disabled) { transform: translate(-50%, -50%) scale(1.04); filter: brightness(1.12); }
        .berenike-item:hover:not(:disabled), .berenike-item.is-selected { transform: translateY(-8px); border-color: rgba(240, 189, 91, 0.9); }
        @keyframes berenike-shot-kick { 0% { translate: 0 0; } 40% { translate: -8px 0; } 100% { translate: 0 0; } }
      `}</style>

      <div style={topBarStyle(isMobile)}>
        <div>
          <strong style={{ fontSize: isMobile ? 18 : 22 }}>Berenike Shot</strong>
          <div style={{ color: "rgba(232,216,181,0.7)", fontSize: 13 }}>
            Tour de {currentPlayer?.name ?? "personne"} · {activePlayers.length} actif(s)
          </div>
        </div>
        <div style={topActionsStyle(isMobile)}>
          <button type="button" onClick={() => setRulesOpen((value) => !value)}>?</button>
          <button type="button" onClick={abortCurrentGame} disabled={!me || state.phase === "finished"}>Abandon</button>
        </div>
      </div>

      <div style={tableStyle(isMobilePortrait)}>
        <aside style={reservePanelStyle(isMobile)}>
          <strong>Cycle de réserve</strong>
          <div style={bulletRowStyle}>
            {Array.from({ length: state.berenike.reserveCount }).map((_, index) => (
              <span key={`bullet-${index}`} style={bulletDotStyle(index < state.berenike.publicCounts.real ? "real" : "blank")} />
            ))}
          </div>
          <span><b>{state.berenike.publicCounts.real}</b> réelle(s)</span>
          <span><b>{state.berenike.publicCounts.blank}</b> factice(s)</span>
          {state.berenike.secret?.nextBullet && (
            <span style={secretStyle}>Prochaine: {bulletLabel(state.berenike.secret.nextBullet)}</span>
          )}
          {state.berenike.secret?.futureBullet && (
            <span style={secretStyle}>
              Position {state.berenike.secret.futureBullet.position}: {bulletLabel(state.berenike.secret.futureBullet.type)}
            </span>
          )}
        </aside>

        {state.players.map((player, index) => {
          const point = playerPoint(index, state.players.length);
          const isCurrent = state.turnPlayerId === player.id;
          const isSelf = me?.id === player.id;
          const canTarget = isMyTurn && player.berenike?.active;
          return (
            <div
              key={player.id}
              className="berenike-player"
              style={{
                position: "absolute",
                left: `${point.left}%`,
                top: `${point.top}%`,
                transform: "translate(-50%, -50%)",
                zIndex: 4
              }}
            >
              <button
                className="berenike-target"
                type="button"
                onClick={() => handlePlayerClick(player)}
                disabled={!canTarget}
                style={playerButtonStyle({ isCurrent, isSelf, isActive: player.berenike?.active })}
                title={selectedItem ? itemHint(selectedItem) : "Tirer sur cette cible"}
              >
                <span style={avatarStyle(player)}>{player.name.slice(0, 1).toUpperCase()}</span>
                <span style={{ display: "grid", gap: 2, minWidth: 72 }}>
                  <b>{player.name}</b>
                  <span>♥ {player.berenike?.hp ?? 0}/{player.berenike?.maxHp ?? 0}</span>
                  <span>☗ {player.berenike?.inventoryCount ?? 0}{player.berenike?.skipped ? " · entravé" : ""}</span>
                </span>
              </button>
              <div className="berenike-inventory" style={hoverInventoryStyle}>
                {(player.berenike?.inventory ?? []).length ? player.berenike.inventory.map((item) => (
                  <span key={item.id} title={item.desc} style={miniItemStyle}>{item.icon}</span>
                )) : <span style={{ opacity: 0.7 }}>Aucun</span>}
              </div>
            </div>
          );
        })}

        <div style={musketWrapStyle}>
          <div
            style={{
              ...musketStyle,
              transform: `rotate(${musketAngle}deg)`,
              animation: state.berenike.lastShot?.id ? "berenike-shot-kick 240ms ease-out" : "none"
            }}
          >
            <span style={musketBarrelStyle} />
            <span style={musketStockStyle} />
            <span style={musketLockStyle} />
          </div>
          <div style={turnPlaqueStyle}>
            {isMyTurn ? (selectedItem ? itemHint(selectedItem) : "Choisis une cible") : "En attente"}
          </div>
        </div>

        <aside style={quickRulesStyle(isMobile)}>
          <strong>Règles rapides</strong>
          <span>Balle réelle: 1 dégât.</span>
          <span>Balle factice: aucun dégât.</span>
          <span>Se viser avec une factice conserve le tour.</span>
        </aside>
      </div>

      <div style={handPanelStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <strong>Tes consommables ({me?.berenike?.inventoryCount ?? 0}/{state.berenike.maxItems})</strong>
          <span style={{ color: "rgba(232,216,181,0.68)", fontSize: 13 }}>
            {selectedItem ? itemHint(selectedItem) : isMyTurn ? "Tu peux en utiliser plusieurs avant de tirer." : "Patiente jusqu'à ton tour."}
          </span>
        </div>
        <div style={itemRowStyle}>
          {(me?.berenike?.inventory ?? []).map((item) => (
            <button
              key={item.id}
              className={`berenike-item${selectedItemId === item.id ? " is-selected" : ""}`}
              type="button"
              onClick={() => handleItemClick(item)}
              disabled={!isMyTurn}
              style={itemCardStyle(selectedItemId === item.id)}
              title={item.desc}
            >
              <span style={{ fontSize: 30, lineHeight: 1 }}>{item.icon}</span>
              <b>{item.name}</b>
              <small>{item.desc}</small>
            </button>
          ))}
          {!(me?.berenike?.inventory ?? []).length && <span style={{ color: "rgba(232,216,181,0.62)" }}>Aucun consommable.</span>}
        </div>
      </div>

      <section style={{ ...styles.log, marginTop: 0 }}>
        <strong>Journal</strong>
        <ul>
          {state.log.map((entry, idx) => (
            <li key={`${entry.at}-${idx}`}>{entry.message}</li>
          ))}
        </ul>
      </section>

      {rulesOpen && (
        <div style={styles.modalBackdrop}>
          <div style={{ ...styles.modal, maxWidth: 620 }}>
            <h3 style={{ marginTop: 0 }}>Berenike Shot</h3>
            <p>La réserve annonce seulement combien de balles réelles et factices restent. L'ordre est caché.</p>
            <p>À ton tour, tu peux jouer autant de consommables que tu veux, puis cliquer sur toi-même ou un autre participant pour tirer.</p>
            <p>Une balle factice sur toi te laisse rejouer. Une balle réelle fait passer le tour après les dégâts.</p>
            <button type="button" onClick={() => setRulesOpen(false)}>Fermer</button>
          </div>
        </div>
      )}
    </section>
  );
}

const topBarStyle = (isMobile) => ({
  display: "grid",
  gridTemplateColumns: isMobile ? "1fr" : "1fr auto",
  gap: 10,
  alignItems: "center",
  border: "1px solid rgba(216, 201, 167, 0.22)",
  background: "linear-gradient(90deg, rgba(20,17,12,0.94), rgba(8,7,6,0.94))",
  padding: 12,
  borderRadius: 4
});

const topActionsStyle = (isMobile) => ({
  display: "grid",
  gridTemplateColumns: isMobile ? "56px 1fr" : "56px 130px",
  gap: 8
});

const tableStyle = (isMobilePortrait) => ({
  position: "relative",
  minHeight: isMobilePortrait ? "min(72vh, 620px)" : 640,
  border: "1px solid rgba(216, 201, 167, 0.3)",
  borderRadius: 4,
  overflow: "hidden",
  background: "radial-gradient(circle at 50% 48%, rgba(129,76,33,0.48), rgba(38,24,14,0.9) 32%, rgba(5,4,3,0.98) 72%), repeating-radial-gradient(circle at 50% 50%, rgba(232,216,181,0.08) 0 1px, transparent 1px 54px)",
  boxShadow: "inset 0 0 90px rgba(0,0,0,0.82), 0 18px 34px rgba(0,0,0,0.48)"
});

const reservePanelStyle = (isMobile) => ({
  position: "absolute",
  left: 12,
  top: 12,
  zIndex: 6,
  width: isMobile ? 176 : 230,
  display: "grid",
  gap: 7,
  padding: 12,
  borderRadius: 4,
  border: "1px solid rgba(216,201,167,0.34)",
  background: "linear-gradient(160deg, rgba(9,8,6,0.88), rgba(32,24,15,0.82))",
  color: "#f4e7c8",
  fontSize: isMobile ? 12 : 14
});

const quickRulesStyle = (isMobile) => ({
  position: "absolute",
  right: 12,
  bottom: 12,
  zIndex: 6,
  width: isMobile ? 184 : 260,
  display: "grid",
  gap: 7,
  padding: 12,
  borderRadius: 4,
  border: "1px solid rgba(216,201,167,0.34)",
  background: "linear-gradient(160deg, rgba(9,8,6,0.88), rgba(32,24,15,0.82))",
  color: "#f4e7c8",
  fontSize: isMobile ? 12 : 14
});

const bulletRowStyle = { display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" };

const bulletDotStyle = (type) => ({
  width: 16,
  height: 16,
  borderRadius: "50%",
  border: "1px solid rgba(255,255,255,0.58)",
  background: type === "real"
    ? "radial-gradient(circle at 35% 30%, #ff705f, #8d1710 70%)"
    : "radial-gradient(circle at 35% 30%, #fff, #8c8c8c 70%)",
  boxShadow: "0 2px 5px rgba(0,0,0,0.5)"
});

const secretStyle = {
  marginTop: 4,
  color: "#ffe0a0",
  fontWeight: 900
};

const playerButtonStyle = ({ isCurrent, isSelf, isActive }) => ({
  width: 178,
  minHeight: 82,
  display: "grid",
  gridTemplateColumns: "58px 1fr",
  alignItems: "center",
  gap: 8,
  padding: 8,
  borderRadius: 4,
  border: isCurrent ? "2px solid rgba(255, 203, 99, 0.95)" : "1px solid rgba(216, 201, 167, 0.4)",
  background: isActive
    ? "linear-gradient(90deg, rgba(15,13,10,0.95), rgba(54,39,25,0.84))"
    : "linear-gradient(90deg, rgba(8,8,7,0.82), rgba(24,24,22,0.7))",
  color: isActive ? "#f4e7c8" : "rgba(232,216,181,0.48)",
  opacity: isActive ? 1 : 0.62,
  boxShadow: isCurrent ? "0 0 24px rgba(255,181,70,0.44), inset 0 0 18px rgba(0,0,0,0.62)" : "0 10px 20px rgba(0,0,0,0.44)",
  textAlign: "left",
  transition: "transform 140ms ease, filter 140ms ease",
  outline: isSelf ? "1px solid rgba(88, 207, 91, 0.7)" : "none"
});

const avatarStyle = (player) => ({
  width: 54,
  height: 54,
  borderRadius: "50%",
  display: "grid",
  placeItems: "center",
  border: "2px solid rgba(232,216,181,0.68)",
  background: player.berenike?.active
    ? "radial-gradient(circle at 40% 28%, rgba(240,138,53,0.74), rgba(25,18,12,0.96) 66%)"
    : "linear-gradient(135deg, #272727, #080808)",
  fontSize: 24,
  fontWeight: 900
});

const hoverInventoryStyle = {
  position: "absolute",
  left: "50%",
  bottom: "100%",
  transform: "translate(-50%, 2px)",
  opacity: 0,
  pointerEvents: "none",
  transition: "opacity 140ms ease, transform 140ms ease",
  minWidth: 130,
  display: "flex",
  gap: 5,
  flexWrap: "wrap",
  justifyContent: "center",
  padding: 8,
  borderRadius: 4,
  border: "1px solid rgba(216,201,167,0.36)",
  background: "rgba(6,5,4,0.95)",
  boxShadow: "0 10px 20px rgba(0,0,0,0.54)"
};

const miniItemStyle = {
  width: 24,
  height: 24,
  display: "grid",
  placeItems: "center",
  borderRadius: 3,
  border: "1px solid rgba(216,201,167,0.34)",
  background: "rgba(68,47,27,0.76)",
  color: "#ffe0a0",
  fontWeight: 900
};

const musketWrapStyle = {
  position: "absolute",
  left: "50%",
  top: "50%",
  transform: "translate(-50%, -50%)",
  zIndex: 3,
  display: "grid",
  placeItems: "center",
  gap: 18
};

const musketStyle = {
  position: "relative",
  width: 250,
  height: 64,
  transformOrigin: "50% 50%",
  transition: "transform 280ms ease",
  filter: "drop-shadow(0 16px 18px rgba(0,0,0,0.64))"
};

const musketBarrelStyle = {
  position: "absolute",
  left: 86,
  top: 22,
  width: 148,
  height: 16,
  borderRadius: "999px",
  border: "1px solid rgba(255,231,174,0.7)",
  background: "linear-gradient(180deg, #f2d08a, #7a5124 48%, #1a120a 52%, #b98643)",
  boxShadow: "inset 0 0 8px rgba(0,0,0,0.68)"
};

const musketStockStyle = {
  position: "absolute",
  left: 12,
  top: 28,
  width: 112,
  height: 24,
  borderRadius: "70% 35% 45% 70%",
  transform: "rotate(-12deg)",
  background: "linear-gradient(135deg, #7d3d18, #2c1208 70%)",
  border: "1px solid rgba(255,190,96,0.45)"
};

const musketLockStyle = {
  position: "absolute",
  left: 82,
  top: 12,
  width: 36,
  height: 32,
  borderRadius: 8,
  background: "linear-gradient(135deg, #d6a65a, #422816)",
  border: "1px solid rgba(255,231,174,0.5)"
};

const turnPlaqueStyle = {
  minWidth: 230,
  padding: "10px 14px",
  borderRadius: 4,
  border: "1px solid rgba(216,201,167,0.34)",
  background: "linear-gradient(180deg, rgba(45,31,18,0.94), rgba(10,8,6,0.94))",
  color: "#f4e7c8",
  textAlign: "center",
  fontWeight: 900,
  boxShadow: "0 12px 22px rgba(0,0,0,0.48)"
};

const handPanelStyle = {
  borderRadius: 4,
  border: "1px solid rgba(216,201,167,0.28)",
  background: "linear-gradient(180deg, rgba(18,14,10,0.96), rgba(6,5,4,0.98))",
  padding: 12,
  display: "grid",
  gap: 10
};

const itemRowStyle = {
  display: "flex",
  gap: 10,
  overflowX: "auto",
  padding: "8px 2px 12px",
  minHeight: 134
};

const itemCardStyle = (selected) => ({
  flex: "0 0 118px",
  minHeight: 120,
  borderRadius: 4,
  border: selected ? "1px solid rgba(240,189,91,0.9)" : "1px solid rgba(216,201,167,0.42)",
  background: "radial-gradient(circle at 50% 18%, rgba(240,138,53,0.22), transparent 38%), linear-gradient(180deg, #b8955d, #634225 46%, #18100a)",
  color: "#170f08",
  textShadow: "none",
  boxShadow: "inset 0 0 20px rgba(255,240,196,0.18), 0 10px 18px rgba(0,0,0,0.42)",
  display: "grid",
  justifyItems: "center",
  alignContent: "center",
  gap: 5,
  padding: 8,
  fontWeight: 900,
  transition: "transform 140ms ease, border-color 140ms ease"
});
