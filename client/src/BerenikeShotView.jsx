import React from "react";
import { styles } from "./styles.js";

const TARGET_ITEMS = new Set(["chains", "skeleton_key"]);
const MUSKET_IMAGE_URL = "/musket.svg";

function bulletLabel(type) {
  if (type === "real") return "réelle";
  if (type === "blank") return "factice";
  return "inconnue";
}

function playerPoint(index, count, compact = false) {
  const angle = -90 + (360 / Math.max(count, 1)) * index;
  const rad = (angle * Math.PI) / 180;
  return {
    left: 50 + Math.cos(rad) * (compact ? 38 : 39),
    top: 48 + Math.sin(rad) * (compact ? 38 : 35),
    angle
  };
}

function getShotAngle(players, targetId, compact = false) {
  const index = players.findIndex((player) => player.id === targetId);
  if (index < 0) return 0;
  return playerPoint(index, players.length, compact).angle;
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
  const [shotPopup, setShotPopup] = React.useState(null);
  const [cyclePopup, setCyclePopup] = React.useState(null);
  const [hoveredPlayerId, setHoveredPlayerId] = React.useState(null);
  const previousShotIdRef = React.useRef(null);
  const previousCycleRef = React.useRef(null);
  const isCompactTable = isMobile || state.players.length > 4;
  const selectedItem = me?.berenike?.inventory?.find((item) => item.id === selectedItemId) ?? null;
  const currentPlayer = state.players.find((player) => player.id === state.turnPlayerId);
  const isMyTurn = Boolean(me && state.turnPlayerId === me.id && me.berenike?.active);
  const activePlayers = state.players.filter((player) => player.berenike?.active);
  const lastShot = state.berenike?.lastShot;
  const isShotAnimating = Boolean(shotPopup && lastShot?.id === shotPopup.id);
  const musketAngle = isShotAnimating ? getShotAngle(state.players, lastShot.targetId, isCompactTable) : 0;
  const hoveredPlayer = state.players.find((player) => player.id === hoveredPlayerId);

  React.useEffect(() => {
    if (!selectedItemId) return;
    if (!me?.berenike?.inventory?.some((item) => item.id === selectedItemId)) {
      setSelectedItemId(null);
    }
  }, [me, selectedItemId]);

  React.useEffect(() => {
    const lastShot = state.berenike?.lastShot;
    if (!lastShot?.id) return;
    if (previousShotIdRef.current === lastShot.id) return;
    previousShotIdRef.current = lastShot.id;

    const shooter = state.players.find((player) => player.id === lastShot.shooterId);
    const target = state.players.find((player) => player.id === lastShot.targetId);
    setShotPopup({
      id: lastShot.id,
      bulletType: lastShot.bulletType,
      damage: lastShot.damage,
      shooterName: shooter?.name ?? "Joueur",
      targetName: target?.name ?? "cible"
    });

    const timer = window.setTimeout(() => setShotPopup(null), 1200);
    return () => window.clearTimeout(timer);
  }, [state.berenike?.lastShot?.id, state.players]);

  React.useEffect(() => {
    const cycle = state.berenike?.cycle;
    if (!cycle || previousCycleRef.current === cycle) return;
    previousCycleRef.current = cycle;

    setCyclePopup({
      cycle,
      reserveCount: state.berenike.reserveCount,
      real: state.berenike.publicCounts.real,
      blank: state.berenike.publicCounts.blank
    });

    const timer = window.setTimeout(() => setCyclePopup(null), 1500);
    return () => window.clearTimeout(timer);
  }, [state.berenike?.cycle, state.berenike?.reserveCount, state.berenike?.publicCounts.real, state.berenike?.publicCounts.blank]);

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
        .berenike-player:hover { z-index: 24 !important; }
        .berenike-target:hover:not(:disabled) { transform: scale(1.01); }
        .berenike-item:hover:not(:disabled), .berenike-item.is-selected { border-color: #d8bd77; }
        @keyframes berenike-shot-kick { 0% { translate: 0 0; } 45% { translate: -8px 0; } 100% { translate: 0 0; } }
        @keyframes berenike-muzzle { 0% { opacity: 1; } 100% { opacity: 0; transform: translate(18px, -50%) scale(1.25); } }
        @keyframes berenike-popup-in { 0% { opacity: 0; } 100% { opacity: 1; } }
      `}</style>

      <div style={topBarStyle(isMobile)}>
        <div>
          <strong style={{ fontSize: isMobile ? 18 : 22 }}>Berenike Shot</strong>
          <div style={{ color: "rgba(232,216,181,0.7)", fontSize: 13 }}>
            Tour de {currentPlayer?.name ?? "personne"} · {activePlayers.length} actif(s)
          </div>
        </div>
        <div style={reserveSummaryStyle(isMobile)}>
          <strong>Cycle {state.berenike.cycle}</strong>
          <span>{state.berenike.reserveCount} balle(s)</span>
          <span><span style={bulletDotStyle("real")} /> {state.berenike.publicCounts.real} réelle(s)</span>
          <span><span style={bulletDotStyle("blank")} /> {state.berenike.publicCounts.blank} factice(s)</span>
        </div>
        <div style={topActionsStyle(isMobile)}>
          <button type="button" onClick={() => setRulesOpen((value) => !value)}>?</button>
          <button type="button" onClick={abortCurrentGame} disabled={!me || state.phase === "finished"}>Abandon</button>
        </div>
      </div>

      <div style={tableStyle(isMobilePortrait)}>
        {state.players.map((player, index) => {
          const point = playerPoint(index, state.players.length, isCompactTable);
          const isCurrent = state.turnPlayerId === player.id;
          const isSelf = me?.id === player.id;
          const canTarget = isMyTurn && player.berenike?.active;
          return (
            <div
              key={player.id}
              className="berenike-player"
              onMouseEnter={() => setHoveredPlayerId(player.id)}
              onMouseLeave={() => setHoveredPlayerId((current) => current === player.id ? null : current)}
              onFocus={() => setHoveredPlayerId(player.id)}
              onBlur={() => setHoveredPlayerId((current) => current === player.id ? null : current)}
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
                data-disabled={!canTarget}
                style={playerButtonStyle({ isCurrent, isSelf, isActive: player.berenike?.active, compact: isCompactTable })}
                title={selectedItem ? itemHint(selectedItem) : "Tirer sur cette cible"}
              >
                <span style={{ display: "grid", gap: 2, minWidth: isCompactTable ? 0 : 72, justifyItems: isCompactTable ? "center" : "start" }}>
                  <b>{player.name}</b>
                  <span>♥ {player.berenike?.hp ?? 0}/{player.berenike?.maxHp ?? 0}</span>
                  {!isCompactTable && <span>☗ {player.berenike?.inventoryCount ?? 0}{player.berenike?.skipped ? " · entravé" : ""}</span>}
                </span>
              </button>
            </div>
          );
        })}

        <div style={musketWrapStyle}>
          <div
            key={isShotAnimating ? lastShot.id : "idle-musket"}
            style={{
              ...musketStyle,
              width: isMobile ? 210 : 286,
              height: isMobile ? 64 : 86,
              transform: `rotate(${musketAngle}deg)`,
              animation: isShotAnimating ? "berenike-shot-kick 240ms ease-out" : "none"
            }}
          >
            <img
              src={MUSKET_IMAGE_URL}
              alt=""
              draggable="false"
              style={musketImageStyle}
            />
            {isShotAnimating && (
              <>
                <span style={muzzleFlashStyle(lastShot.bulletType, isMobile)} />
              </>
            )}
          </div>
          <div style={turnPlaqueStyle}>
            {isMyTurn ? (selectedItem ? itemHint(selectedItem) : "Choisis une cible") : "En attente"}
          </div>
        </div>

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

      {shotPopup && (
        <div style={shotPopupStyle(shotPopup.bulletType)}>
          <strong>{shotPopup.bulletType === "real" ? "Balle réelle" : "Balle à blanc"}</strong>
          <span>
            {shotPopup.bulletType === "real"
              ? `${shotPopup.targetName} perd ${shotPopup.damage} PV`
              : "Aucun dégât"}
          </span>
        </div>
      )}

      {cyclePopup && (
        <div style={cyclePopupStyle}>
          <strong>Nouveau cycle</strong>
          <span>Cycle {cyclePopup.cycle} · {cyclePopup.reserveCount} balle(s)</span>
          <span>
            <span style={bulletDotStyle("real")} /> {cyclePopup.real} réelle(s)
            <span style={{ display: "inline-block", width: 10 }} />
            <span style={bulletDotStyle("blank")} /> {cyclePopup.blank} factice(s)
          </span>
        </div>
      )}

      {hoveredPlayer && (
        <div style={globalInventoryPopupStyle}>
          <strong>{hoveredPlayer.name}</strong>
          <span style={inventoryTitleStyle}>Inventaire</span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
            {(hoveredPlayer.berenike?.inventory ?? []).length ? hoveredPlayer.berenike.inventory.map((item) => (
              <span key={item.id} title={`${item.name}: ${item.desc}`} style={miniItemStyle}>{item.icon}</span>
            )) : <span style={{ opacity: 0.7 }}>Aucun</span>}
          </div>
        </div>
      )}
    </section>
  );
}

const topBarStyle = (isMobile) => ({
  display: "grid",
  gridTemplateColumns: isMobile ? "1fr" : "1fr auto auto",
  gap: 10,
  alignItems: "center",
  border: "1px solid rgba(216, 201, 167, 0.22)",
  background: "#100d0a",
  padding: 12,
  borderRadius: 4
});

const reserveSummaryStyle = (isMobile) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: isMobile ? "flex-start" : "center",
  gap: isMobile ? 8 : 12,
  flexWrap: "wrap",
  padding: "8px 10px",
  borderRadius: 4,
  border: "1px solid rgba(216,201,167,0.3)",
  background: "#18120c",
  color: "#f4e7c8",
  fontSize: isMobile ? 12 : 13
});

const topActionsStyle = (isMobile) => ({
  display: "grid",
  gridTemplateColumns: isMobile ? "56px 1fr" : "56px 130px",
  gap: 8
});

const tableStyle = (isMobilePortrait) => ({
  position: "relative",
  minHeight: isMobilePortrait ? "min(70vh, 610px)" : 600,
  border: "1px solid rgba(216, 201, 167, 0.3)",
  borderRadius: 4,
  overflow: "hidden",
  background: "#0b0907",
  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.02)"
});

const bulletDotStyle = (type) => ({
  display: "inline-block",
  width: 10,
  height: 10,
  borderRadius: "50%",
  marginRight: 4,
  border: "1px solid rgba(255,255,255,0.45)",
  background: type === "real" ? "#c24134" : "#d7d2c6"
});

const playerButtonStyle = ({ isCurrent, isSelf, isActive, compact }) => ({
  width: compact ? 86 : 168,
  minHeight: compact ? 68 : 78,
  display: "grid",
  gridTemplateColumns: "1fr",
  alignItems: "center",
  justifyItems: compact ? "center" : "stretch",
  gap: compact ? 4 : 8,
  padding: compact ? 6 : 8,
  borderRadius: 4,
  border: isCurrent ? "2px solid rgba(255, 203, 99, 0.95)" : "1px solid rgba(216, 201, 167, 0.4)",
  background: isActive ? "#18120d" : "#0d0d0c",
  color: isActive ? "#f4e7c8" : "rgba(232,216,181,0.48)",
  opacity: isActive ? 1 : 0.62,
  boxShadow: isCurrent ? "0 0 0 2px rgba(255,181,70,0.2)" : "none",
  textAlign: compact ? "center" : "left",
  transition: "transform 140ms ease, filter 140ms ease",
  outline: isSelf ? "1px solid rgba(88, 207, 91, 0.7)" : "none"
});

const inventoryTitleStyle = {
  flex: "1 0 100%",
  color: "rgba(244,231,200,0.72)",
  fontSize: 11,
  fontWeight: 900,
  textTransform: "uppercase",
  textAlign: "center"
};

const miniItemStyle = {
  width: 24,
  height: 24,
  display: "grid",
  placeItems: "center",
  borderRadius: 3,
  border: "1px solid rgba(216,201,167,0.34)",
  background: "#25180f",
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
  gap: 28,
  pointerEvents: "none"
};

const musketStyle = {
  position: "relative",
  width: 238,
  height: 82,
  transformOrigin: "50% 50%",
  transition: "transform 180ms ease",
  filter: "none",
  overflow: "visible"
};

const musketImageStyle = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  objectFit: "contain",
  opacity: 0.92,
  filter: "none",
  pointerEvents: "none",
  userSelect: "none"
};

const turnPlaqueStyle = {
  minWidth: 230,
  position: "relative",
  zIndex: 2,
  marginTop: 14,
  padding: "10px 14px",
  borderRadius: 4,
  border: "1px solid rgba(216,201,167,0.34)",
  background: "#15100c",
  color: "#f4e7c8",
  textAlign: "center",
  fontWeight: 900,
  boxShadow: "none"
};

const muzzleFlashStyle = (bulletType, isMobile = false) => ({
  position: "absolute",
  left: isMobile ? 198 : 270,
  top: isMobile ? 30 : 40,
  width: bulletType === "real" ? 30 : 22,
  height: bulletType === "real" ? 30 : 22,
  borderRadius: "50%",
  background: bulletType === "real" ? "#f0c25b" : "#d7d2c6",
  transform: "translate(0, -50%)",
  animation: "berenike-muzzle 260ms ease-out both",
  pointerEvents: "none"
});

const shotPopupStyle = (bulletType) => ({
  position: "fixed",
  left: "50%",
  top: "42%",
  zIndex: 60,
  minWidth: "min(88vw, 240px)",
  display: "grid",
  justifyItems: "center",
  gap: 5,
  padding: "12px 14px",
  borderRadius: 4,
  border: bulletType === "real" ? "1px solid #c24134" : "1px solid #d7d2c6",
  background: "#15100c",
  color: "#fff0c9",
  textAlign: "center",
  boxShadow: "none",
  animation: "berenike-popup-in 100ms ease-out both",
  pointerEvents: "none"
});

const cyclePopupStyle = {
  position: "fixed",
  right: 16,
  top: 96,
  zIndex: 62,
  width: "min(86vw, 260px)",
  display: "grid",
  justifyItems: "start",
  gap: 5,
  padding: "10px 12px",
  borderRadius: 4,
  border: "1px solid rgba(216,201,167,0.45)",
  background: "#15100c",
  color: "#fff0c9",
  textAlign: "left",
  fontSize: 13,
  boxShadow: "none",
  animation: "berenike-popup-in 100ms ease-out both",
  pointerEvents: "none"
};

const globalInventoryPopupStyle = {
  position: "fixed",
  right: 16,
  top: 124,
  zIndex: 72,
  width: "min(86vw, 230px)",
  display: "grid",
  justifyItems: "center",
  gap: 7,
  padding: "10px 12px",
  borderRadius: 4,
  border: "1px solid rgba(216,201,167,0.45)",
  background: "#15100c",
  color: "#fff0c9",
  boxShadow: "none",
  pointerEvents: "none",
  animation: "berenike-popup-in 120ms ease-out both"
};

const handPanelStyle = {
  borderRadius: 4,
  border: "1px solid rgba(216,201,167,0.28)",
  background: "#100d0a",
  padding: 12,
  display: "grid",
  gap: 10
};

const itemRowStyle = {
  display: "flex",
  gap: 10,
  overflowX: "auto",
  padding: "8px 2px 12px",
  minHeight: 104
};

const itemCardStyle = (selected) => ({
  flex: "0 0 104px",
  minHeight: 96,
  borderRadius: 4,
  border: selected ? "1px solid rgba(240,189,91,0.9)" : "1px solid rgba(216,201,167,0.42)",
  background: selected ? "#2a1d12" : "#18120d",
  color: "#f4e7c8",
  textShadow: "none",
  boxShadow: "none",
  display: "grid",
  justifyItems: "center",
  alignContent: "center",
  gap: 5,
  padding: 8,
  fontWeight: 900,
  transition: "transform 140ms ease, border-color 140ms ease"
});
