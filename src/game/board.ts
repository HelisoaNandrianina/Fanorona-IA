import type { BitBoard, CellIndex, Player } from "./types";

export const COORDS: ReadonlyArray<readonly [number, number]> = [
  [0, 0], [1, 0], [2, 0],
  [0, 1], [1, 1], [2, 1],
  [0, 2], [1, 2], [2, 2],
];

/** Liste d'adjacence : vers quelles cases un pion peut-il se déplacer ? */
export const ADJACENCY: ReadonlyArray<ReadonlyArray<CellIndex>> = [
  /* 0 */ [1, 3, 4],
  /* 1 */ [0, 2, 4],
  /* 2 */ [1, 4, 5],
  /* 3 */ [0, 4, 6],
  /* 4 */ [0, 1, 2, 3, 5, 6, 7, 8], 
  /* 5 */ [2, 4, 8],
  /* 6 */ [3, 4, 7],
  /* 7 */ [4, 6, 8],
  /* 8 */ [4, 5, 7],
];

/** Toutes les lignes gagnantes (lignes, colonnes, diagonales du carré
 *  + diagonales internes passant par le centre). */
export const WINNING_LINES: ReadonlyArray<readonly [number, number, number]> = [
  // Lignes horizontales
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  // Colonnes verticales
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  // Diagonales principales du carré
  [0, 4, 8],
  [2, 4, 6],
];

/** Précalcule les lignes sous forme de bitmasks pour une détection O(1) */
export const WINNING_MASKS: ReadonlyArray<number> = WINNING_LINES.map(
  ([a, b, c]) => (1 << a) | (1 << b) | (1 << c)
);

export const FULL_MASK = 0b111111111; 
export const CENTER_CELL = 4;
export const CORNER_CELLS: ReadonlyArray<CellIndex> = [0, 2, 6, 8];
export const EDGE_CELLS: ReadonlyArray<CellIndex> = [1, 3, 5, 7];

export function emptyBoard(): BitBoard {
  return { p1: 0, p2: 0 };
}

export function getMask(board: BitBoard, player: Player): number {
  return player === "P1" ? board.p1 : board.p2;
}

export function occupiedMask(board: BitBoard): number {
  return board.p1 | board.p2;
}

export function cellState(board: BitBoard, cell: CellIndex): Player | null {
  const bit = 1 << cell;
  if (board.p1 & bit) return "P1";
  if (board.p2 & bit) return "P2";
  return null;
}

export function isCellEmpty(board: BitBoard, cell: CellIndex): boolean {
  return !((occupiedMask(board) >> cell) & 1);
}

export function setCell(board: BitBoard, cell: CellIndex, player: Player): BitBoard {
  const bit = 1 << cell;
  if (player === "P1") {
    return { p1: board.p1 | bit, p2: board.p2 & ~bit };
  }
  return { p2: board.p2 | bit, p1: board.p1 & ~bit };
}

export function clearCell(board: BitBoard, cell: CellIndex): BitBoard {
  const bit = ~(1 << cell);
  return { p1: board.p1 & bit, p2: board.p2 & bit };
}

export function moveCell(board: BitBoard, from: CellIndex, to: CellIndex, player: Player): BitBoard {
  const cleared = clearCell(board, from);
  return setCell(cleared, to, player);
}

/** Vérifie si le bitmask du joueur contient une ligne gagnante complète. */
export function hasWinningLine(mask: number): boolean {
  for (const lineMask of WINNING_MASKS) {
    if ((mask & lineMask) === lineMask) return true;
  }
  return false;
}

/** Retourne la ligne gagnante (triplet de cases) si elle existe, sinon null. */
export function findWinningLine(mask: number): readonly [number, number, number] | null {
  for (let i = 0; i < WINNING_MASKS.length; i++) {
    if ((mask & WINNING_MASKS[i]) === WINNING_MASKS[i]) return WINNING_LINES[i];
  }
  return null;
}

/** Cases libres adjacentes à `cell` (pour la phase de mouvement). */
export function freeAdjacent(board: BitBoard, cell: CellIndex): CellIndex[] {
  const occ = occupiedMask(board);
  return ADJACENCY[cell].filter((adj) => !((occ >> adj) & 1));
}

/** Hash stable du plateau + joueur courant + phase, pour la table de transposition. */
export function hashBoard(board: BitBoard, currentPlayer: Player, phase: string): string {
  return `${board.p1}|${board.p2}|${currentPlayer}|${phase}`;
}

export function opponent(player: Player): Player {
  return player === "P1" ? "P2" : "P1";
}

/** Notation "a1".."c3" pour l'historique des coups, alignée sur le schéma de l'énoncé
 *  (colonnes a/b/c, lignes 1/2/3 du bas vers le haut). */
const COLS = ["a", "b", "c"];
export function cellToNotation(cell: CellIndex): string {
  const [col, row] = COORDS[cell];
  return `${COLS[col]}${row + 1}`;
}
