import type { Difficulty, GameState, Move, Player } from "../game/types";
import { applyMove, generateLegalMoves } from "../game/rules";
import { evaluate, WIN_SCORE } from "./evaluation";
import { TranspositionTable } from "./transpositionTable";
import { hashBoard, CENTER_CELL } from "../game/board";
import { lookupOpeningBook } from "./openingBook";
import type { AIStats } from "../game/types";

interface SearchConfig {
  /** Profondeur maximale de recherche (en demi-coups / ply) */
  maxDepth: number;
  /** Budget de temps en ms (pour l'iterative deepening, mode difficile) */
  timeLimitMs: number;
  /** Probabilité (0..1) de jouer un coup sous-optimal (bruit), pour le mode Facile */
  randomness: number;
  useTranspositionTable: boolean;
  useOpeningBook: boolean;
  useIterativeDeepening: boolean;
}

const DIFFICULTY_CONFIG: Record<Difficulty, SearchConfig> = {
  facile: {
    maxDepth: 1,
    timeLimitMs: 200,
    randomness: 0.45,
    useTranspositionTable: false,
    useOpeningBook: false,
    useIterativeDeepening: false,
  },
  moyen: {
    maxDepth: 3,
    timeLimitMs: 500,
    randomness: 0.12,
    useTranspositionTable: true,
    useOpeningBook: true,
    useIterativeDeepening: false,
  },
  difficile: {
    maxDepth: 9,
    timeLimitMs: 900,
    randomness: 0,
    useTranspositionTable: true,
    useOpeningBook: true,
    useIterativeDeepening: true,
  },
};

/** Table de transposition persistante entre les appels (réinitialisée par partie). */
let globalTT = new TranspositionTable();
export function resetTranspositionTable(): void {
  globalTT = new TranspositionTable();
}

let nodesExplored = 0;

/**
 * Calcule le meilleur coup pour `player` dans l'état `state`, selon la difficulté.
 * Fonction synchrone mais conçue pour être appelée depuis un Web Worker ou
 * via setTimeout côté UI afin de ne jamais bloquer le thread de rendu trop longtemps.
 */
export function computeBestMove(
  state: GameState,
  player: Player,
  difficulty: Difficulty
): AIStats {
  const config = DIFFICULTY_CONFIG[difficulty];
  const startTime = performance.now();
  nodesExplored = 0;

  const legalMoves = generateLegalMoves(state, player);
  if (legalMoves.length === 0) {
    return {
      timeMs: 0,
      depth: 0,
      nodesExplored: 0,
      transpositionHits: 0,
      bestMove: null,
      evaluation: 0,
    };
  }

  // 1. Opening book
  if (config.useOpeningBook) {
    const bookMove = lookupOpeningBook(state.board, player, state.phase);
    if (bookMove) {
      const isLegal = legalMoves.some(
        (m) => m.to === bookMove.to && m.from === bookMove.from
      );
      if (isLegal) {
        return {
          timeMs: performance.now() - startTime,
          depth: 0,
          nodesExplored: 0,
          transpositionHits: 0,
          bestMove: bookMove,
          evaluation: 0,
        };
      }
    }
  }

  // 2. Mode Facile : forte chance de jouer un coup aléatoire parmi les légaux
  if (difficulty === "facile" && Math.random() < config.randomness) {
    const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
    return {
      timeMs: performance.now() - startTime,
      depth: 0,
      nodesExplored: 0,
      transpositionHits: 0,
      bestMove: randomMove,
      evaluation: 0,
    };
  }

  if (!config.useTranspositionTable) {
    globalTT.clear();
  }

  let bestMove: Move = legalMoves[0];
  let bestScore = -Infinity;
  let depthReached = 0;

  const orderedMoves = orderMoves(state, legalMoves);

  if (config.useIterativeDeepening) {
    // Approfondissement itératif : on augmente la profondeur tant qu'il reste
    // du temps, en conservant toujours le meilleur résultat du dernier palier
    // *complet*. Permet une recherche "anytime" robuste au mode Difficile.
    for (let depth = 1; depth <= config.maxDepth; depth++) {
      const elapsed = performance.now() - startTime;
      if (elapsed > config.timeLimitMs && depth > 2) break;

      const result = searchRoot(state, orderedMoves, player, depth, startTime, config.timeLimitMs);
      if (result.aborted && depth > 1) break;

      bestMove = result.bestMove;
      bestScore = result.bestScore;
      depthReached = depth;

      // Coup gagnant trouvé : inutile de chercher plus profond
      if (bestScore >= WIN_SCORE - 10) break;
    }
  } else {
    const result = searchRoot(state, orderedMoves, player, config.maxDepth, startTime, config.timeLimitMs);
    bestMove = result.bestMove;
    bestScore = result.bestScore;
    depthReached = config.maxDepth;
  }

  return {
    timeMs: performance.now() - startTime,
    depth: depthReached,
    nodesExplored,
    transpositionHits: globalTT.hits,
    bestMove,
    evaluation: bestScore,
  };
}

function searchRoot(
  state: GameState,
  moves: Move[],
  player: Player,
  depth: number,
  startTime: number,
  timeLimitMs: number
): { bestMove: Move; bestScore: number; aborted: boolean } {
  let bestMove = moves[0];
  let bestScore = -Infinity;
  let alpha = -Infinity;
  const beta = Infinity;
  let aborted = false;

  for (const move of moves) {
    if (performance.now() - startTime > timeLimitMs * 1.5) {
      aborted = true;
      break;
    }
    const { state: nextState } = applyMove(state, move);
    const score = -alphaBeta(nextState, depth - 1, -beta, -alpha, opponentOf(player), player, startTime, timeLimitMs);

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
    if (score > alpha) alpha = score;
  }

  return { bestMove, bestScore, aborted };
}

/**
 * Negamax avec élagage Alpha-Beta : retourne le score du point de vue de
 * `toMove` (le joueur dont c'est le tour dans `state`).
 * `rootPlayer` reste fixe pour l'évaluation finale (perspective constante).
 */
function alphaBeta(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  toMove: Player,
  rootPlayer: Player,
  startTime: number,
  timeLimitMs: number
): number {
  nodesExplored++;

  if (state.winner) {
    // Victoire/défaite : score extrême, ajusté par la profondeur restante pour
    // préférer les victoires rapides et retarder les défaites.
    const sign = state.winner === toMove ? 1 : -1;
    return sign * (WIN_SCORE + depth);
  }
  if (state.isDraw) return 0;
  if (depth === 0) {
    const evalFromRoot = evaluate(state, rootPlayer);
    return rootPlayer === toMove ? evalFromRoot : -evalFromRoot;
  }

  const ttKey = hashBoard(state.board, toMove, state.phase);
  let ttEntryMoveIndex: number | undefined;

  const entry = globalTT.get(ttKey);
  if (entry && entry.depth >= depth) {
    if (entry.flag === "exact") return entry.score;
    if (entry.flag === "lowerbound" && entry.score > alpha) alpha = entry.score;
    else if (entry.flag === "upperbound" && entry.score < beta) beta = entry.score;
    if (alpha >= beta) return entry.score;
    ttEntryMoveIndex = entry.bestMoveIndex;
  }

  const legalMoves = generateLegalMoves(state, toMove);
  if (legalMoves.length === 0) {
    // Aucun coup possible (immobilisation totale) : défaite pour `toMove`
    return -(WIN_SCORE - 1);
  }

  let moves = orderMoves(state, legalMoves);
  if (ttEntryMoveIndex !== undefined && ttEntryMoveIndex < moves.length) {
    // Place le meilleur coup connu en tête (move ordering via TT)
    const [known] = moves.splice(ttEntryMoveIndex, 1);
    moves = [known, ...moves];
  }

  const originalAlpha = alpha;
  let bestScore = -Infinity;
  let bestIndex = 0;

  for (let i = 0; i < moves.length; i++) {
    if (performance.now() - startTime > timeLimitMs * 1.5) break;

    const { state: nextState } = applyMove(state, moves[i]);
    const score = -alphaBeta(
      nextState,
      depth - 1,
      -beta,
      -alpha,
      opponentOf(toMove),
      rootPlayer,
      startTime,
      timeLimitMs
    );

    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
    if (score > alpha) alpha = score;
    if (alpha >= beta) break; // élagage Alpha-Beta
  }

  let flag: "exact" | "lowerbound" | "upperbound" = "exact";
  if (bestScore <= originalAlpha) flag = "upperbound";
  else if (bestScore >= beta) flag = "lowerbound";

  globalTT.set(ttKey, { depth, score: bestScore, flag, bestMoveIndex: bestIndex });

  return bestScore;
}

/** Tri heuristique des coups pour améliorer l'élagage : favorise le centre
 *  et les coups qui créent une menace immédiate. Économique (pas de récursion). */
function orderMoves(state: GameState, moves: Move[]): Move[] {
  return [...moves].sort((a, b) => scoreMoveHeuristic(state, b) - scoreMoveHeuristic(state, a));
}

function scoreMoveHeuristic(state: GameState, move: Move): number {
  let score = 0;
  if (move.to === CENTER_CELL) score += 5;
  const { won } = applyMove(state, move);
  if (won) score += 1000;
  return score;
}

function opponentOf(player: Player): Player {
  return player === "P1" ? "P2" : "P1";
}
