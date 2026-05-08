import { styles } from "./styles.js";

const AWALE_SEED_POSITIONS = [
  [48, 44, -18], [36, 56, 18], [59, 58, 43], [63, 36, -35], [26, 41, 55], [43, 29, 7],
  [72, 49, 71], [30, 65, -62], [52, 69, 12], [20, 52, 27], [78, 36, -12], [38, 76, -28],
  [58, 22, 31], [68, 68, -51], [24, 28, -7], [47, 83, 48], [83, 55, 16], [16, 68, -39],
  [34, 19, 66], [74, 22, -66], [55, 50, 4], [42, 63, -47], [66, 80, 39], [18, 38, 13],
  [88, 44, -27], [29, 82, 24], [50, 14, -44], [12, 54, 61], [61, 91, -5], [76, 72, 52],
  [22, 16, -18], [86, 66, 28], [40, 90, -70], [11, 78, 42], [91, 29, -4], [32, 50, -52],
  [70, 13, 19], [49, 37, -73], [58, 74, 74], [26, 72, 8], [79, 87, -36], [17, 24, 36],
  [93, 77, 60], [7, 43, -21], [36, 7, 50], [64, 6, -58], [4, 67, 16], [96, 52, -48]
];

function getAwaleSeedStyle(seedIndex, seedCount, isMobile, isAnimated) {
  const [x, y, rotation] = AWALE_SEED_POSITIONS[seedIndex % AWALE_SEED_POSITIONS.length];
  const ring = Math.floor(seedIndex / AWALE_SEED_POSITIONS.length);
  const scale = Math.max(0.64, (isMobile ? 0.78 : 1) - ring * 0.08 - Math.max(0, seedCount - 18) * 0.006);
  return {
    ...styles.awaleSeed,
    width: isMobile ? 15 : styles.awaleSeed.width,
    height: isMobile ? 15 : styles.awaleSeed.height,
    fontSize: isMobile ? 13 : styles.awaleSeed.fontSize,
    left: `${x}%`,
    top: `${y}%`,
    transform: `translate(-50%, -50%) rotate(${rotation + ring * 23}deg) scale(${scale})`,
    zIndex: seedIndex,
    animation: isAnimated ? `awale-seed-drop 420ms ease-out ${Math.min(seedIndex, 12) * 22}ms both` : undefined
  };
}

export function AwaleDirectionRow({ direction, isMobilePortrait, isMobileLandscape }) {
  const arrow = direction === "left" ? "←" : "→";
  return (
    <div
      style={{
        ...styles.awaleDirectionRow,
        gap: isMobilePortrait ? 4 : isMobileLandscape ? 8 : styles.awaleDirectionRow.gap,
        fontSize: isMobilePortrait ? 18 : styles.awaleDirectionRow.fontSize,
        minHeight: isMobilePortrait ? 16 : undefined,
        padding: isMobilePortrait ? "0 6%" : styles.awaleDirectionRow.padding
      }}
      aria-hidden="true"
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={`${direction}-${index}`} style={styles.awaleDirectionArrow}>
          {arrow}
        </span>
      ))}
    </div>
  );
}

export function AwaleMiddleFlow({ isMobilePortrait }) {
  return (
    <div
      style={{
        ...styles.awaleMiddleFlow,
        gridTemplateColumns: isMobilePortrait ? "32px 1fr 32px" : styles.awaleMiddleFlow.gridTemplateColumns,
        minHeight: isMobilePortrait ? 22 : styles.awaleMiddleFlow.minHeight,
        fontSize: isMobilePortrait ? 19 : styles.awaleMiddleFlow.fontSize
      }}
      aria-label="Le semis suit le bas vers la droite, remonte, puis revient vers la gauche en haut."
    >
      <span style={{ textAlign: "center" }}>↓</span>
      <span />
      <span style={{ textAlign: "center" }}>↑</span>
    </div>
  );
}

export function AwalePit({ pitIndex, seedCount, isMobile, isMobilePortrait, isMobileLandscape, isLegal, isMyTurn, isDisabled, lastMove, onPlay, isOpponent }) {
  const isSource = lastMove?.fromPit === pitIndex;
  const sowStep = lastMove?.sowPath?.lastIndexOf(pitIndex) ?? -1;
  const isSown = sowStep >= 0;
  const isCaptured = lastMove?.capturedPits?.includes(pitIndex);
  const isLastPit = lastMove?.lastPit === pitIndex;
  const animationName = isCaptured ? "awale-capture-pulse" : isSource ? "awale-source-lift" : isSown || isLastPit ? "awale-pit-pulse" : undefined;

  return (
    <button
      type="button"
      onClick={onPlay}
      disabled={isDisabled}
      style={{
        ...styles.awalePit,
        minHeight: isMobilePortrait ? 58 : isMobile ? 72 : isMobileLandscape ? 116 : styles.awalePit.minHeight,
        aspectRatio: isMobilePortrait ? "1 / 1.08" : isMobileLandscape ? "1.18 / 1" : undefined,
        padding: isMobilePortrait ? 5 : styles.awalePit.padding,
        outline: isLegal && isMyTurn ? "3px solid #fff78a" : "none",
        opacity: isDisabled ? (isOpponent ? 0.88 : 0.68) : 1,
        cursor: isDisabled ? "default" : "pointer",
        transform: isLegal && isMyTurn && !isDisabled ? "translateY(-2px)" : undefined,
        filter: isCaptured ? "brightness(1.18) saturate(1.2)" : undefined,
        animation: animationName ? `${animationName} 560ms ease-out` : undefined,
        animationDelay: isSown ? `${Math.min(sowStep, 14) * 42}ms` : undefined
      }}
      aria-label={`Trou ${pitIndex + 1}, ${seedCount} graine${seedCount > 1 ? "s" : ""}`}
    >
      <span
        style={{
          ...styles.awaleSeedLayer,
          inset: isMobilePortrait ? 5 : styles.awaleSeedLayer.inset
        }}
        aria-hidden="true"
      >
        {Array.from({ length: seedCount }).map((_, seedIndex) => (
          <span
            key={`${pitIndex}-${lastMove?.id ?? "initial"}-${seedIndex}`}
            style={getAwaleSeedStyle(seedIndex, seedCount, isMobile, isSown || isSource || isCaptured)}
          >
            🍒
          </span>
        ))}
      </span>
    </button>
  );
}
