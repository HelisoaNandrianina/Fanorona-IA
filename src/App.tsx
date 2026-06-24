import { useState } from "react";
import type { Difficulty, GameConfig, GameMode } from "./game/types";
import { MainMenu } from "./components/MainMenu";
import { GameSetupScreen } from "./components/GameSetupScreen";
import { RulesModal } from "./components/RulesModal";
import { GameLayout } from "./components/GameLayout";

type Screen = "menu" | "setup" | "game";

const MODE_OPTIONS = [
  {
    id: "humain-vs-humain" as GameMode,
    title: "Humain vs Humain",
    description: "Deux joueurs s'affrontent localement, tour à tour, sur le même appareil.",
  },
  {
    id: "humain-vs-ia" as GameMode,
    title: "Humain vs IA",
    description: "Affrontez l'intelligence artificielle et choisissez son niveau de difficulté.",
    badge: "Populaire",
  },
  {
    id: "ia-vs-ia" as GameMode,
    title: "IA vs IA",
    description: "Mode démonstration : observez deux IA s'affronter automatiquement.",
  },
];

const DIFFICULTY_OPTIONS = [
  {
    id: "facile" as Difficulty,
    title: "Facile",
    description: "Coups majoritairement aléatoires. Idéal pour découvrir le jeu.",
  },
  {
    id: "moyen" as Difficulty,
    title: "Moyen",
    description: "Minimax avec table de transposition, profondeur modérée.",
  },
  {
    id: "difficile" as Difficulty,
    title: "Difficile",
    description: "Alpha-Beta optimisé, approfondissement itératif, ouverture théorique.",
    badge: "Expert",
  },
];

export default function App() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [showRules, setShowRules] = useState(false);
  const [mode, setMode] = useState<GameMode | null>(null);
  const [difficultyP1, setDifficultyP1] = useState<Difficulty | null>(null);
  const [difficultyP2, setDifficultyP2] = useState<Difficulty | null>(null);
  const [config, setConfig] = useState<GameConfig | null>(null);

  function handleSelectMode(newMode: GameMode) {
    setMode(newMode);
    // On réinitialise les difficultés si on change de mode, pour éviter
    // de lancer une partie avec une config obsolète (ex: ancien choix IA vs IA
    // réutilisé silencieusement pour Humain vs IA).
    setDifficultyP1(null);
    setDifficultyP2(null);
  }

  function handleStart() {
    if (!mode) return;

    if (mode === "humain-vs-humain") {
      setConfig({ mode, difficultyP1: "moyen", difficultyP2: "moyen", starter: "P1" });
      setScreen("game");
      return;
    }

    if (mode === "humain-vs-ia") {
      if (!difficultyP2) return;
      setConfig({ mode, difficultyP1: "moyen", difficultyP2, starter: "P1" });
      setScreen("game");
      return;
    }

    // ia-vs-ia
    if (!difficultyP1 || !difficultyP2) return;
    setConfig({ mode, difficultyP1, difficultyP2, starter: "P1" });
    setScreen("game");
  }

  function handleBackToMenu() {
    setScreen("menu");
    setMode(null);
    setDifficultyP1(null);
    setDifficultyP2(null);
    setConfig(null);
  }

  return (
    <>
      {screen === "menu" && (
        <MainMenu
          onNavigate={() => setScreen("setup")}
          onShowRules={() => setShowRules(true)}
        />
      )}

      {screen === "setup" && (
        <GameSetupScreen
          modeOptions={MODE_OPTIONS}
          difficultyOptions={DIFFICULTY_OPTIONS}
          mode={mode}
          difficultyP1={difficultyP1}
          difficultyP2={difficultyP2}
          onSelectMode={handleSelectMode}
          onSelectDifficultyP1={setDifficultyP1}
          onSelectDifficultyP2={setDifficultyP2}
          onBack={() => setScreen("menu")}
          onStart={handleStart}
        />
      )}

      {screen === "game" && config && (
        <GameLayout config={config} onBackToMenu={handleBackToMenu} />
      )}

      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
    </>
  );
}
