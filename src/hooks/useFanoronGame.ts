import { useCallback, useEffect, useRef, useState } from "react";
import type {
  AIStats,
  Difficulty,
  GameConfig,
  GameMode,
  GameState,
  Move,
  Player,
} from "../game/types";
import { createInitialState, applyMove, generateLegalMoves, isGameOver } from "../game/rules";
import { computeBestMove, resetTranspositionTable } from "../ai/minimax";
import { isCellEmpty } from "../game/board";

const AI_THINK_DELAY_MIN_MS = 350; 

function isAIControlled(mode: GameMode, player: Player): boolean {
  if (mode === "ia-vs-ia") return true;
  if (mode === "humain-vs-ia") return player === "P2";
  return false;
}

export function useFanoronGame(config: GameConfig) {
  const [state, setState] = useState<GameState>(() => createInitialState(config.starter));
  const [lastAIStats, setLastAIStats] = useState<AIStats | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [winningLine, setWinningLine] = useState<readonly [number, number, number] | null>(null);
  const aiTimeoutRef = useRef<number | null>(null);


  const [pastStates, setPastStates] = useState<GameState[]>([]);
  const [futureStates, setFutureStates] = useState<GameState[]>([]);

  const resetGame = useCallback((starter: Player = config.starter) => {
    if (aiTimeoutRef.current) {
      window.clearTimeout(aiTimeoutRef.current);
      aiTimeoutRef.current = null;
    }
    resetTranspositionTable();
    setState(createInitialState(starter));
    setLastAIStats(null);
    setIsThinking(false);
    setWinningLine(null);
    setPastStates([]);
    setFutureStates([]);
  }, [config.starter]);

  // Réinitialise la partie si le mode change (ex: retour au menu puis nouveau mode)
  useEffect(() => {
    resetGame(config.starter);

  }, [config.mode, config.difficultyP1, config.difficultyP2]);

  const playMove = useCallback((move: Move) => {
    setState((prev) => {
      if (isGameOver(prev)) return prev;
      const legal = generateLegalMoves(prev, move.player);
      const isLegal = legal.some((m) => m.from === move.from && m.to === move.to);
      if (!isLegal) return prev;

      const { state: next } = applyMove(prev, move);
      setPastStates((stack) => [...stack, prev]);
      setFutureStates([]);
      return next;
    });
  }, []);


  const handleCellClick = useCallback((cell: number) => {
    setState((prev) => {
      if (isGameOver(prev)) return prev;
      if (isAIControlled(config.mode, prev.currentPlayer)) return prev;

      if (prev.phase === "placement") {
        if (!isCellEmpty(prev.board, cell)) return prev;
        const { state: next } = applyMove(prev, { from: null, to: cell, player: prev.currentPlayer });
        setPastStates((stack) => [...stack, prev]);
        setFutureStates([]);
        return next;
      }

      // Phase mouvement : deux clics — sélection du pion, puis destination
      const board = prev.board;
      const occupant = !isCellEmpty(board, cell)
        ? (board.p1 >> cell) & 1 ? "P1" : "P2"
        : null;

      if (prev.selectedCell === null) {
        if (occupant === prev.currentPlayer) {
          return { ...prev, selectedCell: cell };
        }
        return prev;
      }

      if (prev.selectedCell === cell) {
        // Désélection
        return { ...prev, selectedCell: null };
      }

      if (occupant === prev.currentPlayer) {
        // Changement de sélection vers un autre pion du même joueur
        return { ...prev, selectedCell: cell };
      }

      const legal = generateLegalMoves(prev, prev.currentPlayer);
      const isLegal = legal.some((m) => m.from === prev.selectedCell && m.to === cell);
      if (!isLegal) return prev;

      const { state: next } = applyMove(prev, {
        from: prev.selectedCell,
        to: cell,
        player: prev.currentPlayer,
      });
      setPastStates((stack) => [...stack, prev]);
      setFutureStates([]);
      return next;
    });
  }, [config.mode]);


  const undo = useCallback(() => {
    if (isThinking) return;
    setPastStates((stack) => {
      if (stack.length === 0) return stack;

      let cursor = stack.length;
      const skipped: GameState[] = [];

      // Recule tant que l'état ciblé correspondrait à un tour contrôlé par l'IA
      do {
        cursor--;
      } while (
        cursor > 0 &&
        config.mode !== "ia-vs-ia" &&
        isAIControlled(config.mode, stack[cursor].currentPlayer)
      );

      const target = stack[cursor];
      for (let i = stack.length - 1; i > cursor; i--) skipped.unshift(stack[i]);

      setState((current) => {
        setFutureStates((future) => [...skipped, current, ...future]);
        return target;
      });
      return stack.slice(0, cursor);
    });
  }, [isThinking, config.mode]);


  const redo = useCallback(() => {
    if (isThinking) return;
    setFutureStates((future) => {
      if (future.length === 0) return future;

      let cursor = 0;
      do {
        cursor++;
      } while (
        cursor < future.length &&
        config.mode !== "ia-vs-ia" &&
        isAIControlled(config.mode, future[cursor - 1].currentPlayer)
      );

      const target = future[cursor - 1];
      const consumed = future.slice(0, cursor);
      const rest = future.slice(cursor);

      setState((current) => {
        setPastStates((stack) => [...stack, current, ...consumed.slice(0, -1)]);
        return target;
      });
      return rest;
    });
  }, [isThinking, config.mode]);

  const canUndo = pastStates.length > 0 && !isThinking;
  const canRedo = futureStates.length > 0 && !isThinking;

  // Déclenche le coup de l'IA quand c'est son tour
  useEffect(() => {
    if (isGameOver(state)) return;
    const currentIsAI = isAIControlled(config.mode, state.currentPlayer);
    if (!currentIsAI) return;

    setIsThinking(true);
    const difficulty: Difficulty =
      state.currentPlayer === "P1" ? config.difficultyP1 : config.difficultyP2;

    const startTime = performance.now();

    aiTimeoutRef.current = window.setTimeout(() => {
      const stats = computeBestMove(state, state.currentPlayer, difficulty);
      const elapsed = performance.now() - startTime;
      const remainingDelay = Math.max(0, AI_THINK_DELAY_MIN_MS - elapsed);

      aiTimeoutRef.current = window.setTimeout(() => {
        setLastAIStats(stats);
        setIsThinking(false);
        if (stats.bestMove) {
          playMove(stats.bestMove);
        }
      }, remainingDelay);
    }, 30);

    return () => {
      if (aiTimeoutRef.current) {
        window.clearTimeout(aiTimeoutRef.current);
        aiTimeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.history.length, state.currentPlayer, config.mode]);

  return {
    state,
    isThinking,
    lastAIStats,
    winningLine,
    setWinningLine,
    handleCellClick,
    resetGame,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
