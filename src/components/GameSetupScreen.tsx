import type { Difficulty, GameMode } from "../game/types";
import "./GameSetupScreen.css";

interface OptionDef<T extends string> {
  id: T;
  title: string;
  description: string;
  badge?: string;
}

interface GameSetupScreenProps {
  modeOptions: OptionDef<GameMode>[];
  difficultyOptions: OptionDef<Difficulty>[];
  mode: GameMode | null;
  difficultyP1: Difficulty | null;
  difficultyP2: Difficulty | null;
  onSelectMode: (mode: GameMode) => void;
  onSelectDifficultyP1: (d: Difficulty) => void;
  onSelectDifficultyP2: (d: Difficulty) => void;
  onBack: () => void;
  onStart: () => void;
}

export function GameSetupScreen({
  modeOptions,
  difficultyOptions,
  mode,
  difficultyP1,
  difficultyP2,
  onSelectMode,
  onSelectDifficultyP1,
  onSelectDifficultyP2,
  onBack,
  onStart,
}: GameSetupScreenProps) {
  const needsP2Difficulty = mode === "humain-vs-ia" || mode === "ia-vs-ia";
  const needsP1Difficulty = mode === "ia-vs-ia";

  const canStart =
    mode !== null &&
    (mode !== "humain-vs-ia" || difficultyP2 !== null) &&
    (mode !== "ia-vs-ia" || (difficultyP1 !== null && difficultyP2 !== null));

  return (
    <div className="setup-screen malagasy-pattern-bg">
      <div className="setup-screen__content">
        <span className="setup-screen__eyebrow">Configuration de la partie</span>
        <h2 className="setup-screen__title">Préparez votre partie</h2>

        {/* --- Étape 1 : Mode de jeu --- */}
        <section className="setup-section">
          <h3 className="setup-section__label">
            <span className="setup-section__step">1</span> Mode de jeu
          </h3>
          <div className="setup-options">
            {modeOptions.map((opt) => (
              <button
                key={opt.id}
                className={`option-card ${mode === opt.id ? "option-card--selected" : ""}`}
                onClick={() => onSelectMode(opt.id)}
              >
                {opt.badge && <span className="option-card__badge">{opt.badge}</span>}
                <h4 className="option-card__title">{opt.title}</h4>
                <p className="option-card__desc">{opt.description}</p>
              </button>
            ))}
          </div>
        </section>

        {/* --- Étape 2 : Difficulté IA n°1 (uniquement IA vs IA) --- */}
        {needsP1Difficulty && (
          <section className="setup-section setup-section--enter">
            <h3 className="setup-section__label">
              <span className="setup-section__step">2</span> Difficulté de l'IA n°1 (Joueur 1)
            </h3>
            <div className="setup-options">
              {difficultyOptions.map((opt) => (
                <button
                  key={opt.id}
                  className={`option-card option-card--compact ${difficultyP1 === opt.id ? "option-card--selected" : ""}`}
                  onClick={() => onSelectDifficultyP1(opt.id)}
                >
                  {opt.badge && <span className="option-card__badge">{opt.badge}</span>}
                  <h4 className="option-card__title">{opt.title}</h4>
                  <p className="option-card__desc">{opt.description}</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* --- Étape difficulté du second adversaire IA --- */}
        {needsP2Difficulty && (
          <section className="setup-section setup-section--enter">
            <h3 className="setup-section__label">
              <span className="setup-section__step">{needsP1Difficulty ? "3" : "2"}</span>{" "}
              {mode === "ia-vs-ia" ? "Difficulté de l'IA n°2 (Joueur 2)" : "Difficulté de l'IA"}
            </h3>
            <div className="setup-options">
              {difficultyOptions.map((opt) => (
                <button
                  key={opt.id}
                  className={`option-card option-card--compact ${difficultyP2 === opt.id ? "option-card--selected" : ""}`}
                  onClick={() => onSelectDifficultyP2(opt.id)}
                >
                  {opt.badge && <span className="option-card__badge">{opt.badge}</span>}
                  <h4 className="option-card__title">{opt.title}</h4>
                  <p className="option-card__desc">{opt.description}</p>
                </button>
              ))}
            </div>
          </section>
        )}

        <div className="setup-screen__actions">
          <button className="btn btn--ghost" onClick={onBack}>
            Retour
          </button>
          <button className="btn btn--primary" onClick={onStart} disabled={!canStart}>
            Lancer la partie
          </button>
        </div>
      </div>
    </div>
  );
}
