import type { GameState, Move, Player, GamePhase, BitBoard } from "./types";
import {
  emptyBoard,
  setCell,
  moveCell,
  getMask,
  hasWinningLine,
  freeAdjacent,
  occupiedMask,
  hashBoard,
  opponent,
} from "./board";

export function createInitialState(starter: Player = "P1"): GameState {
  return {
    board: emptyBoard(),
    phase: "placement",
    currentPlayer: starter,
    placedCount: { P1: 0, P2: 0 },
    selectedCell: null,
    winner: null,
    isDraw: false,
    history: [],
    boardHistory: [],
  };
}

/** Génère tous les coups légaux pour `player` dans l'état donné. */
export function generateLegalMoves(state: GameState, player: Player): Move[] {
  if (state.winner || state.isDraw) return [];

  if (state.phase === "placement") {
    const moves: Move[] = [];
    const occ = occupiedMask(state.board);
    for (let cell = 0; cell < 9; cell++) {
      if (!((occ >> cell) & 1)) {
        moves.push({ from: null, to: cell, player });
      }
    }
    return moves;
  }

  // Phase mouvement : chaque pion du joueur peut bouger vers une case libre adjacente
  const moves: Move[] = [];
  const mask = getMask(state.board, player);
  for (let cell = 0; cell < 9; cell++) {
    if ((mask >> cell) & 1) {
      for (const dest of freeAdjacent(state.board, cell)) {
        moves.push({ from: cell, to: dest, player });
      }
    }
  }
  return moves;
}

export interface ApplyResult {
  state: GameState;
  /** true si ce coup a déclenché une victoire immédiate */
  won: boolean;
}

/** Applique un coup et retourne le nouvel état (immutable — ne modifie pas `state`). */
export function applyMove(state: GameState, move: Move): ApplyResult {
  const { player, from, to } = move;

  let newBoard: BitBoard;
  let newPlacedCount = state.placedCount;
  let newPhase: GamePhase = state.phase;

  if (from === null) {
    // Pose
    newBoard = setCell(state.board, to, player);
    newPlacedCount = {
      ...state.placedCount,
      [player]: state.placedCount[player] + 1,
    };
  } else {
    // Déplacement
    newBoard = moveCell(state.board, from, to, player);
  }

  const playerMask = getMask(newBoard, player);
  const won = hasWinningLine(playerMask);

  // Transition de phase : dès que les 6 pions sont posés (3 chacun), sans victoire,
  if (
    newPhase === "placement" &&
    newPlacedCount.P1 === 3 &&
    newPlacedCount.P2 === 3
  ) {
    newPhase = "mouvement";
  }

  const newHistory = [...state.history, move];
  const boardKey = hashBoard(newBoard, opponent(player), newPhase);
  const newBoardHistory = [...state.boardHistory, boardKey];

  // Détection de nulle par répétition (uniquement en phase mouvement) :
  // si la même position (plateau + joueur à jouer) survient 3 fois, on déclare
  // la nulle pour éviter une partie infinie. Ce n'est pas une règle traditionnelle
  // du Fanoron-telo, mais une mesure de robustesse algorithmique attendue par le sujet.
  let isDraw = false;
  if (!won && newPhase === "mouvement") {
    const occurrences = newBoardHistory.filter((h) => h === boardKey).length;
    if (occurrences >= 3) isDraw = true;
    // Garde-fou supplémentaire : limite dure de coups pour éviter toute partie infinie
    if (newHistory.length >= 200) isDraw = true;
  }

  const newState: GameState = {
    board: newBoard,
    phase: newPhase,
    currentPlayer: won || isDraw ? state.currentPlayer : opponent(player),
    placedCount: newPlacedCount,
    selectedCell: null,
    winner: won ? player : null,
    isDraw,
    history: newHistory,
    boardHistory: newBoardHistory,
  };

  return { state: newState, won };
}

export function isGameOver(state: GameState): boolean {
  return state.winner !== null || state.isDraw;
}
