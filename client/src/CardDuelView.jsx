import { cardDetails, cardLabel, previewCardFromVision, soulsAttackCardTheme, soulsCardPalette } from "./cardPresentation.js";
import { styles } from "./styles.js";

export function CardDuelView({
  state,
  me,
  opponents,
  visibleDuelPlayers,
  isMobile,
  isMobilePortrait,
  isSpectator,
  isMyTurn,
  isMyDefenseTurn,
  pendingAttack,
  activeCardId,
  onDrawCard,
  onEndTurn,
  onCardClick,
  onAttack
}) {
  const drawCard = onDrawCard;
  const handleEndTurnFromSkipIcon = onEndTurn;
  const handleCardClick = onCardClick;
  const attack = onAttack;
  const isLobbyPhase = state?.phase === "lobby";
  const isAwaleGame = state?.gameType === "awale";
  const isTwentyOneGame = state?.gameType === "twenty_one";

  return (
    <>
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
                  <div style={{ ...styles.arenaSlot, flex: isMobilePortrait ? "1 1 150px" : undefined, width: isMobilePortrait ? "100%" : isMobile ? 150 : styles.arenaSlot.width, minHeight: isMobilePortrait ? 76 : isMobile ? 86 : styles.arenaSlot.minHeight, fontSize: isMobile ? 11 : styles.arenaSlot.fontSize }}>
                    <span style={styles.arenaSlotLabel}>Defense en attente</span>
                    <strong>{pendingAttack.card.label}</strong>
                    <span style={styles.arenaSlotMeta}>
                      cible: {isMyDefenseTurn ? "toi" : opponents[0]?.name ?? "adversaire"}
                    </span>
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


    </>
  );
}
