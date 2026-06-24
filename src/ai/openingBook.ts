import type { BitBoard, Move, Player } from "./../game/types";
import { hashBoard, occupiedMask, CENTER_CELL, CORNER_CELLS } from "../game/board";

/** Nombre de pions max sur le plateau pour consulter encore le livre d'ouverture. */
export const OPENING_BOOK_MAX_PLIES = 2;

/**
 * Retourne un coup d'ouverture recommandé, ou null si la position n'est pas
 * dans le livre (ou si on a dépassé la profondeur couverte par le livre).
 */
export function lookupOpeningBook(
  board: BitBoard,
  player: Player,
  phase: string
): Move | null {
  const occ = occupiedMask(board);
  const popcount = countBits(occ);

  if (phase !== "placement" || popcount > OPENING_BOOK_MAX_PLIES) {
    return null;
  }

  // Coup n°1 : le centre est théoriquement la meilleure ouverture
  // (8 connexions, contrôle maximal des lignes).
  if (popcount === 0) {
    return { from: null, to: CENTER_CELL, player };
  }

  // Coup n°2 (réponse au centre pris par l'adversaire) : jouer un coin,
  // qui participe à 3 lignes (1 ligne droite + 1 colonne + 1 diagonale)
  // et limite le mieux la mobilité de l'adversaire.
  if (popcount === 1) {
    const centerTaken = (occ >> CENTER_CELL) & 1;
    if (centerTaken) {
      const freeCorner = CORNER_CELLS.find((c) => !((occ >> c) & 1));
      if (freeCorner !== undefined) {
        return { from: null, to: freeCorner, player };
      }
    } else {
      // Le centre est encore libre (cas rare si l'adversaire a joué ailleurs) : le prendre.
      return { from: null, to: CENTER_CELL, player };
    }
  }

  void hashBoard; // réservé pour extension future du livre (clé exacte par position)
  return null;
}

function countBits(mask: number): number {
  let c = 0;
  let m = mask;
  while (m) {
    c += m & 1;
    m >>= 1;
  }
  return c;
}
