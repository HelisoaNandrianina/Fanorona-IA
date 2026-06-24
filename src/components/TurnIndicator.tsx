import type { GameMode, GamePhase, Player } from "../game/types";
import "./TurnIndicator.css";

interface TurnIndicatorProps {
  currentPlayer: Player;
  phase: GamePhase;
  mode: GameMode;
  isThinking: boolean;
  winner: Player | null;
  isDraw: boolean;
}

function playerLabel(player: Player, mode: GameMode): string {
  if (mode === "ia-vs-ia") return player === "P1" ? "IA — Joueur 1" : "IA — Joueur 2";
  if (mode === "humain-vs-ia") return player === "P1" ? "Vous" : "IA";
  return player === "P1" ? "Joueur 1" : "Joueur 2";
}

export function TurnIndicator({ currentPlayer, phase, mode, isThinking, winner, isDraw }: TurnIndicatorProps) {
  if (winner) {
    return (
      <div className="turn-indicator turn-indicator--end">
        <span className="turn-indicator__eyebrow">Partie terminée</span>
        <h3 className="turn-indicator__title">
          {playerLabel(winner, mode)} remporte la partie
        </h3>
      </div>
    );
  }

  if (isDraw) {
    return (
      <div className="turn-indicator turn-indicator--end">
        <span className="turn-indicator__eyebrow">Partie terminée</span>
        <h3 className="turn-indicator__title">Match nul</h3>
      </div>
    );
  }

  return (
    <div className="turn-indicator">
      <span className="turn-indicator__eyebrow">
        Phase {phase === "placement" ? "1 — Placement" : "2 — Mouvement"}
      </span>
      <div className="turn-indicator__row">
        <span className={`turn-indicator__dot ${currentPlayer === "P1" ? "dot-p1" : "dot-p2"}`} />
        <h3 className="turn-indicator__title">
          {playerLabel(currentPlayer, mode)}
          {isThinking && <span className="turn-indicator__thinking"> réfléchit…</span>}
        </h3>
      </div>
    </div>
  );
}
