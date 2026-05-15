import React from "react";
import { cardDetails, cardLabel, soulsCardPalette } from "./cardPresentation.js";
import { styles } from "./styles.js";

export function TwentyOneView({
  state,
  me,
  opponents,
  isMobile,
  isMobilePortrait,
  isSpectator,
  isMyTurn,
  showRules,
  selectedTrump,
  winner,
  onToggleRules,
  onAbort,
  onDrawNumber,
  onStand,
  onCardClick,
  onHoverTrump
}) {
  return (
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
            onClick={onToggleRules}
            style={{
              ...styles.twentyOneRulesToggle,
              minHeight: isMobile ? 30 : styles.twentyOneRulesToggle.minHeight,
              padding: isMobile ? "4px 8px" : styles.twentyOneRulesToggle.padding,
              fontSize: isMobile ? 12 : undefined
            }}
          >
            {showRules ? "Masquer" : "Règles"}
          </button>
          <button
            onClick={onAbort}
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
      {showRules && (
        <section style={{ ...styles.ruleBox, borderColor: "rgba(216, 201, 167, 0.16)", background: "rgba(10, 9, 7, 0.7)", fontSize: isMobile ? 12 : styles.ruleBox.fontSize, padding: isMobile ? 8 : styles.ruleBox.padding }}>
          <strong>Règles Twenty One</strong>
          <span>Chaque manche vise la cible active. Les Go For peuvent la changer en 17, 24 ou 27.</span>
          <span>L'As vaut 1 ou 11 selon le meilleur total possible.</span>
          <span>Chaque joueur commence avec 2 cartes cachees. Le paquet numerique contient une seule carte de chaque rang.</span>
          <span>Le joueur actif peut piocher autant qu'il veut, puis cliquer Rester pour passer la main.</span>
          <span>Si les deux joueurs restent sans jouer de carte pendant la manche, elle se termine sans perte de vie.</span>
          <span>Le perdant perd la mise en vies; Bless peut empêcher une mort.</span>
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
        {isSpectator && state.phase !== "finished" ? "Mode spectateur." : isMyTurn && state.phase !== "finished" ? "A toi de jouer : pioche autant que tu veux, puis clique Rester." : state.phase === "finished" ? "Partie terminee." : "Tour adverse."}
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
            const playerNote = [playerStatus, player.twentyOne?.bless ? "Bless" : ""].filter(Boolean).join(" · ");
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
                onClick={onDrawNumber}
                disabled={!isMyTurn || me?.twentyOne?.stood || state.phase === "finished"}
                style={{
                  ...styles.twentyOneDrawAction,
                  minHeight: isMobile ? 54 : styles.twentyOneDrawAction.minHeight,
                  gridTemplateColumns: isMobile ? "28px 1fr" : styles.twentyOneDrawAction.gridTemplateColumns,
                  padding: isMobile ? "6px 8px" : undefined,
                  opacity: !isMyTurn || me?.twentyOne?.stood || state.phase === "finished" ? 0.6 : 1
                }}
              >
                <span style={{ fontSize: isMobile ? 21 : 28, lineHeight: 1 }}>🂡</span>
                <span>
                  <span style={{ display: "block", fontSize: isMobile ? 14 : 17 }}>Piocher</span>
                  <span style={{ display: "block", fontSize: isMobile ? 10 : 12, color: "rgba(255,240,201,0.72)" }}>Carte</span>
                </span>
              </button>
              <button
                className="twenty-one-action"
                onClick={onStand}
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

        {me && (
          <aside style={{ ...styles.twentyOneTrumpPanel, padding: isMobile ? 8 : styles.twentyOneTrumpPanel.padding, gap: isMobile ? 8 : styles.twentyOneTrumpPanel.gap }}>
            <div style={{ display: "grid", gap: 2 }}>
              <strong>Cartes spéciales</strong>
              {!isMobile && <span style={{ color: "rgba(232, 216, 181, 0.56)", fontSize: 12 }}>+3 par manche, 6 en main maximum.</span>}
            </div>
            <div style={{ ...styles.twentyOneTrumpHand, gap: isMobile ? 4 : styles.twentyOneTrumpHand.gap }}>
              {me.hand.map((card) => {
                const palette = soulsCardPalette(card);
                const isActive = selectedTrump?.id === card.id;
                const isBustStand = me?.twentyOne?.autoBust || ((me?.twentyOne?.total ?? 0) > (state.twentyOne?.target ?? 21));
                const isVoluntaryStand = me?.twentyOne?.stood && !isBustStand;
                const trumpDescription = cardDetails(card);
                return (
                  <button
                    key={card.id}
                    className="twenty-one-trump-card"
                    type="button"
                    disabled={!isMyTurn || me?.twentyOne?.stood || state.phase === "finished"}
                    onClick={() => onCardClick(card)}
                    onMouseEnter={(event) => onHoverTrump({ card, x: event.clientX, y: event.clientY })}
                    onMouseMove={(event) => onHoverTrump({ card, x: event.clientX, y: event.clientY })}
                    onMouseLeave={() => onHoverTrump(null)}
                    onFocus={() => onHoverTrump(null)}
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
          </aside>
        )}
      </div>

      {state.phase === "finished" && (
        <strong style={{ justifySelf: "center" }}>{winner?.name ?? "Un joueur"} gagne.</strong>
      )}
    </section>
  );
}
