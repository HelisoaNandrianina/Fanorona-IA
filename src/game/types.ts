
export type CellIndex = number; // 0..8

export type Player = "P1" | "P2";

export type CellState = Player | null;


export interface BitBoard {
  p1: number; // bitmask 9 bits — pions du joueur 1
  p2: number; // bitmask 9 bits — pions du joueur 2
}

export type GamePhase = "placement" | "mouvement";

export type GameMode = "humain-vs-humain" | "humain-vs-ia" | "ia-vs-ia";

export type Difficulty = "facile" | "moyen" | "difficile";

export interface Move {
  /** Coup de pose (phase 1) : from = null */
  from: CellIndex | null;
  to: CellIndex;
  player: Player;
}

export interface AIStats {
  /** Temps de réflexion en millisecondes */
  timeMs: number;
  /** Profondeur de recherche atteinte */
  depth: number;
  /** Nombre de noeuds explorés */
  nodesExplored: number;
  /** Nombre de hits dans la table de transposition */
  transpositionHits: number;
  /** Coup choisi */
  bestMove: Move | null;
  /** Évaluation du coup (centièmes de pion) */
  evaluation: number;
}

export interface GameState {
  board: BitBoard;
  phase: GamePhase;
  currentPlayer: Player;
  /** Nombre de pions déjà posés par chaque joueur (0..3) */
  placedCount: { P1: number; P2: number };
  /** Pion sélectionné en phase de mouvement (UI) */
  selectedCell: CellIndex | null;
  winner: Player | null;
  isDraw: boolean;
  history: Move[];
  /** Historique des plateaux (hash) pour la règle de répétition / nulle */
  boardHistory: string[];
}

export interface GameConfig {
  mode: GameMode;
  /** Difficulté de l'IA pour le joueur P2 (et P1 en mode IA vs IA si besoin) */
  difficultyP1: Difficulty;
  difficultyP2: Difficulty;
  /** Qui commence */
  starter: Player;
}
