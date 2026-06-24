import { useState, useEffect } from "react";
import type { GameConfig } from "../game/types";
import { useFanoronGame } from "../hooks/useFanoronGame";
import { findWinningLine, getMask } from "../game/board";
import { Board } from "./Board";
import { TurnIndicator } from "./TurnIndicator";
import { MoveHistory } from "./MoveHistory";
import { AIStatsPanel } from "./AIStatsPanel";
import "./GameLayout.css";

interface GameLayoutProps {
  config: GameConfig;
  onBackToMenu: () => void;
}

const DIFFICULTY_LABELS: Record<string, string> = {
  facile: "Facile",
  moyen: "Moyen",
  difficile: "Difficile",
};

export function GameLayout({ config, onBackToMenu }: GameLayoutProps) {
  const { state, isThinking, lastAIStats, handleCellClick, resetGame, undo, redo, canUndo, canRedo } =
    useFanoronGame(config);
  const [showRematchPrompt, setShowRematchPrompt] = useState(false);

  const winningLine = state.winner
    ? findWinningLine(getMask(state.board, state.winner))
    : null;

  useEffect(() => {
    if (state.winner || state.isDraw) {
      const t = setTimeout(() => setShowRematchPrompt(true), 500);
      return () => clearTimeout(t);
    }
    setShowRematchPrompt(false);
  }, [state.winner, state.isDraw]);

  const interactive =
    !isThinking &&
    !state.winner &&
    !state.isDraw &&
    (config.mode !== "ia-vs-ia") &&
    !(config.mode === "humain-vs-ia" && state.currentPlayer === "P2");

  const difficultyLabel =
    config.mode === "humain-vs-humain"
      ? null
      : config.mode === "ia-vs-ia"
        ? `${DIFFICULTY_LABELS[config.difficultyP1]} vs ${DIFFICULTY_LABELS[config.difficultyP2]}`
        : DIFFICULTY_LABELS[config.difficultyP2];

  return (
    <div className="game-layout">
      <header className="game-header">
        <button className="game-header__back" onClick={onBackToMenu} aria-label="Retour au menu">
          ← Menu
        </button>
        <h1 className="game-header__title">Fanoron-telo</h1>
        <div className="game-header__meta">
          {difficultyLabel && (
            <span className="game-header__badge">IA · {difficultyLabel}</span>
          )}
        </div>
      </header>

      <main className="game-main">
        <section className="game-board-zone">
          <Board
            state={state}
            onCellClick={handleCellClick}
            winningLine={winningLine}
            interactive={interactive}
          />
        </section>

        <aside className="game-sidebar">
          <TurnIndicator
            currentPlayer={state.currentPlayer}
            phase={state.phase}
            mode={config.mode}
            isThinking={isThinking}
            winner={state.winner}
            isDraw={state.isDraw}
          />

          <AIStatsPanel stats={lastAIStats} mode={config.mode} isThinking={isThinking} />

          <MoveHistory history={state.history} />

          <div className="game-sidebar__actions">
            <div className="game-sidebar__undo-row">
              <button
                className="btn btn--ghost btn--sm"
                onClick={undo}
                disabled={!canUndo}
                aria-label="Annuler le dernier coup"
                title="Annuler (Undo)"
              >
                ↶ Annuler
              </button>
              <button
                className="btn btn--ghost btn--sm"
                onClick={redo}
                disabled={!canRedo}
                aria-label="Rejouer le coup annulé"
                title="Rejouer (Redo)"
              >
                Rejouer ↷
              </button>
            </div>
            <button className="btn btn--ghost btn--sm btn--full" onClick={() => resetGame()}>
              Recommencer la partie
            </button>
          </div>
        </aside>
      </main>

      {showRematchPrompt && (
        <div className="rematch-banner">
          <span>
            {state.winner
              ? `${state.winner === "P1" ? "Joueur 1" : "Joueur 2"} a gagné !`
              : "Match nul."}
          </span>
          <button className="btn btn--primary btn--sm" onClick={() => resetGame()}>
            Rejouer
          </button>
        </div>
      )}
    </div>
  );
}
