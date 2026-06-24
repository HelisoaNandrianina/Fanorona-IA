import "./RulesModal.css";

interface RulesModalProps {
  onClose: () => void;
}

export function RulesModal({ onClose }: RulesModalProps) {
  return (
    <div className="rules-modal__overlay" onClick={onClose}>
      <div className="rules-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="rules-modal__title">Règles du Fanoron-telo</h2>

        <section className="rules-modal__section">
          <h3>Le plateau</h3>
          <p>
            9 intersections disposées en grille 3×3, reliées par des lignes
            horizontales, verticales et diagonales (y compris les diagonales
            internes des quadrants). Chaque joueur dispose de 3 pions.
          </p>
        </section>

        <section className="rules-modal__section">
          <h3>Phase 1 — Placement</h3>
          <p>
            Les joueurs posent chacun un pion à tour de rôle sur une intersection
            libre. Si un joueur aligne ses 3 pions (ligne, colonne ou diagonale)
            pendant cette phase, il gagne immédiatement.
          </p>
        </section>

        <section className="rules-modal__section">
          <h3>Phase 2 — Mouvement</h3>
          <p>
            Si aucun alignement n'est réalisé après la pose des 6 pions, chaque
            joueur déplace à tour de rôle un de ses pions vers une intersection
            adjacente libre, en suivant les lignes du plateau. Le premier qui
            aligne ses 3 pions gagne.
          </p>
        </section>

        <button className="btn btn--primary btn--full" onClick={onClose}>
          Compris
        </button>
      </div>
    </div>
  );
}
