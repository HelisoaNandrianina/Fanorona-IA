import type { AIStats, GameMode } from "../game/types";
import "./AIStatsPanel.css";

interface AIStatsPanelProps {
  stats: AIStats | null;
  mode: GameMode;
  isThinking: boolean;
}

export function AIStatsPanel({ stats, mode, isThinking }: AIStatsPanelProps) {
  if (mode === "humain-vs-humain") return null;

  return (
    <div className="ai-stats">
      <span className="ai-stats__eyebrow">Statistiques IA</span>

      {isThinking && !stats && (
        <p className="ai-stats__placeholder">Calcul en cours…</p>
      )}

      {stats && (
        <div className="ai-stats__grid">
          <div className="ai-stats__metric">
            <span className="ai-stats__value">{stats.timeMs.toFixed(0)}</span>
            <span className="ai-stats__label">ms de réflexion</span>
          </div>
          <div className="ai-stats__metric">
            <span className="ai-stats__value">{stats.depth}</span>
            <span className="ai-stats__label">profondeur</span>
          </div>
          <div className="ai-stats__metric">
            <span className="ai-stats__value">{stats.nodesExplored.toLocaleString("fr-FR")}</span>
            <span className="ai-stats__label">nœuds explorés</span>
          </div>
          <div className="ai-stats__metric">
            <span className="ai-stats__value">{stats.transpositionHits.toLocaleString("fr-FR")}</span>
            <span className="ai-stats__label">hits table</span>
          </div>
        </div>
      )}

      {!stats && !isThinking && (
        <p className="ai-stats__placeholder">En attente du premier coup de l'IA.</p>
      )}
    </div>
  );
}
