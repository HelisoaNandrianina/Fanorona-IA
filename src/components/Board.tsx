import { useMemo } from "react";
import type { GameState } from "../game/types";
import { ADJACENCY, COORDS, isCellEmpty, freeAdjacent } from "../game/board";
import "./Board.css";

interface BoardProps {
  state: GameState;
  onCellClick: (cell: number) => void;
  winningLine: readonly [number, number, number] | null;
  interactive: boolean;
}

const VIEW_SIZE = 460;
const MARGIN = 70;
const STEP = (VIEW_SIZE - 2 * MARGIN) / 2;

function toSvgCoords(col: number, row: number): [number, number] {
  // row 0 = bas du plateau (cf. notation a1 en bas) -> on inverse l'axe Y
  const x = MARGIN + col * STEP;
  const y = VIEW_SIZE - MARGIN - row * STEP;
  return [x, y];
}

// Dédupliquer les segments d'adjacence (lignes du plateau) pour le tracé
function buildLineSegments(): Array<[number, number]> {
  const seen = new Set<string>();
  const segments: Array<[number, number]> = [];
  for (let cell = 0; cell < 9; cell++) {
    for (const adj of ADJACENCY[cell]) {
      const key = cell < adj ? `${cell}-${adj}` : `${adj}-${cell}`;
      if (!seen.has(key)) {
        seen.add(key);
        segments.push([cell, adj]);
      }
    }
  }
  return segments;
}

const LINE_SEGMENTS = buildLineSegments();
const COL_LABELS = ["a", "b", "c"];

export function Board({ state, onCellClick, winningLine, interactive }: BoardProps) {
  const { board, selectedCell, currentPlayer, phase } = state;

  const legalDestinations = useMemo(() => {
    if (!interactive) return new Set<number>();
    if (phase === "placement") {
      const set = new Set<number>();
      for (let c = 0; c < 9; c++) if (isCellEmpty(board, c)) set.add(c);
      return set;
    }
    if (selectedCell !== null) {
      return new Set(freeAdjacent(board, selectedCell));
    }
    return new Set<number>();
  }, [board, phase, selectedCell, interactive]);

  const movablePieces = useMemo(() => {
    if (!interactive || phase !== "mouvement") return new Set<number>();
    const set = new Set<number>();
    for (let c = 0; c < 9; c++) {
      const occ = !isCellEmpty(board, c);
      if (!occ) continue;
      const owner = (board.p1 >> c) & 1 ? "P1" : "P2";
      if (owner === currentPlayer && freeAdjacent(board, c).length > 0) {
        set.add(c);
      }
    }
    return set;
  }, [board, phase, currentPlayer, interactive]);

  const winningSet = winningLine ? new Set(winningLine) : null;

  return (
    <div className="board-wrapper">
      <div className="board-frame malagasy-pattern-bg">
        <svg
          viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
          className="board-svg"
          role="img"
          aria-label="Plateau de Fanoron-telo"
        >
          <defs>
            <radialGradient id="woodGrain" cx="50%" cy="40%" r="75%">
              <stop offset="0%" stopColor="var(--c-wood-light)" />
              <stop offset="55%" stopColor="var(--c-wood-mid)" />
              <stop offset="100%" stopColor="var(--c-wood-dark)" />
            </radialGradient>
            <filter id="pieceShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="2.4" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* Fond bois du plateau */}
          <rect x="0" y="0" width={VIEW_SIZE} height={VIEW_SIZE} rx="10" fill="url(#woodGrain)" />
          <rect
            x="6" y="6"
            width={VIEW_SIZE - 12} height={VIEW_SIZE - 12}
            rx="6"
            fill="none"
            stroke="rgba(0,0,0,0.35)"
            strokeWidth="2"
          />

          {/* Lignes de connexion du plateau */}
          {LINE_SEGMENTS.map(([a, b], i) => {
            const [x1, y1] = toSvgCoords(...COORDS[a]);
            const [x2, y2] = toSvgCoords(...COORDS[b]);
            return (
              <line
                key={i}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="rgba(242, 234, 217, 0.55)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            );
          })}

          {/* Surbrillance de la ligne gagnante */}
          {winningSet && (
            <g>
              {[[winningLine![0], winningLine![1]], [winningLine![1], winningLine![2]]].map(
                ([a, b], i) => {
                  const [x1, y1] = toSvgCoords(...COORDS[a]);
                  const [x2, y2] = toSvgCoords(...COORDS[b]);
                  return (
                    <line
                      key={`win-${i}`}
                      x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke="var(--c-highlight)"
                      strokeWidth="4"
                      strokeLinecap="round"
                      className="winning-line"
                    />
                  );
                }
              )}
            </g>
          )}

          {/* Cases / intersections cliquables */}
          {COORDS.map(([col, row], cell) => {
            const [x, y] = toSvgCoords(col, row);
            const occupant = (board.p1 >> cell) & 1 ? "P1" : (board.p2 >> cell) & 1 ? "P2" : null;
            const isSelected = selectedCell === cell;
            const isLegalDest = legalDestinations.has(cell);
            const isMovable = movablePieces.has(cell);
            const isWinningCell = winningSet?.has(cell) ?? false;
            const canInteract = interactive && (isLegalDest || isMovable || isSelected || (phase === "placement" && !occupant));

            return (
              <g
                key={cell}
                className={`board-node ${canInteract ? "interactive" : ""}`}
                onClick={() => interactive && onCellClick(cell)}
                role={canInteract ? "button" : undefined}
                tabIndex={canInteract ? 0 : -1}
                aria-label={`Intersection ${COL_LABELS[col]}${row + 1}`}
                onKeyDown={(e) => {
                  if (canInteract && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onCellClick(cell);
                  }
                }}
              >
                {/* Halo case jouable */}
                {isLegalDest && !occupant && (
                  <circle cx={x} cy={y} r="14" className="legal-dot" />
                )}

                {/* Anneau d'intersection (point physique du plateau) */}
                <circle cx={x} cy={y} r="5.5" fill="rgba(0,0,0,0.4)" />

                {/* Pion */}
                {occupant && (
                  <g
                    className={[
                      "piece",
                      occupant === "P1" ? "piece-p1" : "piece-p2",
                      isSelected ? "piece-selected" : "",
                      isWinningCell ? "piece-winning" : "",
                      isMovable ? "piece-movable" : "",
                    ].join(" ").trim()}
                    filter="url(#pieceShadow)"
                  >
                    <circle cx={x} cy={y} r="22" className="piece-base" />
                    <circle cx={x} cy={y - 1.5} r="22" className="piece-face" />
                    <circle cx={x - 6} cy={y - 8} r="7" className="piece-gloss" />
                  </g>
                )}

                {/* Zone de clic invisible élargie */}
                <circle cx={x} cy={y} r="26" fill="transparent" />
              </g>
            );
          })}
        </svg>

        {/* Repères de coordonnées, façon échiquier */}
        <div className="board-coords-col">
          {[3, 2, 1].map((n) => (
            <span key={n}>{n}</span>
          ))}
        </div>
        <div className="board-coords-row">
          {COL_LABELS.map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
