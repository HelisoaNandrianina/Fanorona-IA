import "./MainMenu.css";

interface MainMenuProps {
  onNavigate: (screen: "mode-select") => void;
  onShowRules: () => void;
}

export function MainMenu({ onNavigate, onShowRules }: MainMenuProps) {
  return (
    <div className="main-menu malagasy-pattern-bg">
      <div className="main-menu__content">
        <span className="main-menu__eyebrow">Institut Supérieur Polytechnique de Madagascar</span>
        <h1 className="main-menu__title">Fanoron-telo</h1>
        <p className="main-menu__subtitle">
          Le jeu de stratégie traditionnel malgache, réinventé avec une intelligence artificielle.
        </p>

        <div className="main-menu__actions">
          <button className="btn btn--primary" onClick={() => onNavigate("mode-select")}>
            Nouvelle partie
          </button>
          <button className="btn btn--ghost" onClick={onShowRules}>
            Règles du jeu
          </button>
        </div>

        <div className="main-menu__board-glyph" aria-hidden="true">
          <svg viewBox="0 0 100 100">
            <g stroke="var(--c-ivory-faint)" strokeWidth="1.2" fill="none" opacity="0.5">
              <line x1="20" y1="20" x2="80" y2="20" />
              <line x1="20" y1="50" x2="80" y2="50" />
              <line x1="20" y1="80" x2="80" y2="80" />
              <line x1="20" y1="20" x2="20" y2="80" />
              <line x1="50" y1="20" x2="50" y2="80" />
              <line x1="80" y1="20" x2="80" y2="80" />
              <line x1="20" y1="20" x2="80" y2="80" />
              <line x1="80" y1="20" x2="20" y2="80" />
            </g>
            {[20, 50, 80].map((x) =>
              [20, 50, 80].map((y) => (
                <circle key={`${x}-${y}`} cx={x} cy={y} r="2.4" fill="var(--c-highlight)" opacity="0.7" />
              ))
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}
