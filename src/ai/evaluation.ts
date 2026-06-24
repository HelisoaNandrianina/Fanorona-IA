// Fanoron-telo — fonction d'évaluation heuristique
//
// Évalue une position du point de vue de `player` (positif = bon pour player).
// Heuristique composite, documentée dans le README (Section 5) :
//   1. Victoire/défaite immédiate -> score extrême
//   2. Nombre de lignes "ouvertes" à 2 pions (menaces) pour soi vs adversaire
//   3. Contrôle du centre (case 4, la plus connectée : 8 voisins)
//   4. Mobilité (nombre de coups légaux disponibles) en phase mouvement

import type { BitBoard, GameState, Player } from "../game/types";
import {
  WINNING_MASKS,
  getMask,
  hasWinningLine,
  CENTER_CELL,
  occupiedMask,
  freeAdjacent,
} from "../game/board";

export const WIN_SCORE = 100000;

/** Compte les lignes où le joueur a exactement 2 pions et la 3e case est libre
 *  (= menace de victoire au prochain coup). */
function countOpenTwoLines(board: BitBoard, mask: number): number {
  const occ = occupiedMask(board);
  let count = 0;
  for (const lineMask of WINNING_MASKS) {
    const playerBitsOnLine = mask & lineMask;
    const occBitsOnLine = occ & lineMask;
    // Le joueur a 2 pions sur cette ligne, et la ligne n'est pas bloquée par l'adversaire
    const popcount = popcount9(playerBitsOnLine);
    if (popcount === 2 && occBitsOnLine === playerBitsOnLine) {
      count++;
    }
  }
  return count;
}

function popcount9(mask: number): number {
  let count = 0;
  let m = mask;
  while (m) {
    count += m & 1;
    m >>= 1;
  }
  return count;
}

/** Mobilité : nombre de déplacements légaux pour le masque donné (phase mouvement). */
function mobility(board: BitBoard, mask: number): number {
  let total = 0;
  for (let cell = 0; cell < 9; cell++) {
    if ((mask >> cell) & 1) {
      total += freeAdjacent(board, cell).length;
    }
  }
  return total;
}

/**
 * Évalue l'état `state` du point de vue de `player`.
 * Score > 0 favorise `player`, score < 0 favorise l'adversaire.
 */
export function evaluate(state: GameState, player: Player): number {
  const opp: Player = player === "P1" ? "P2" : "P1";
  const myMask = getMask(state.board, player);
  const oppMask = getMask(state.board, opp);

  if (hasWinningLine(myMask)) return WIN_SCORE;
  if (hasWinningLine(oppMask)) return -WIN_SCORE;
  if (state.isDraw) return 0;

  let score = 0;

  // 1. Menaces ouvertes (poids fort : une menace non bloquée gagne au coup suivant)
  const myThreats = countOpenTwoLines(state.board, myMask);
  const oppThreats = countOpenTwoLines(state.board, oppMask);
  score += 50 * (myThreats - oppThreats);

  // 2. Contrôle du centre — la case la plus connectée du plateau
  const centerBit = 1 << CENTER_CELL;
  if (myMask & centerBit) score += 30;
  if (oppMask & centerBit) score -= 30;

  // 3. Nombre de pions sur le plateau (utile en cas de variantes de capture future,
  //    et stabilise l'éval en phase de placement)
  score += 3 * (popcount9(myMask) - popcount9(oppMask));

  // 4. Mobilité, pertinente surtout en phase mouvement (un pion bloqué est un handicap)
  if (state.phase === "mouvement") {
    const myMobility = mobility(state.board, myMask);
    const oppMobility = mobility(state.board, oppMask);
    score += 4 * (myMobility - oppMobility);
  }

  return score;
}
