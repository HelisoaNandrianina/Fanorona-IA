// Script de validation manuelle — non inclus dans le rendu final.
import { createInitialState, applyMove, generateLegalMoves, isGameOver } from "../src/game/rules";
import { computeBestMove, resetTranspositionTable } from "../src/ai/minimax";
import { hasWinningLine, getMask, findWinningLine } from "../src/game/board";
import type { GameState, Move } from "../src/game/types";

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error("❌ FAIL:", msg);
    process.exitCode = 1;
  } else {
    console.log("✅", msg);
  }
}

// --- Test 1 : génération de coups en phase placement ---
{
  const s = createInitialState("P1");
  const moves = generateLegalMoves(s, "P1");
  assert(moves.length === 9, "9 coups légaux au début de la partie (placement)");
}

// --- Test 2 : victoire immédiate en phase de placement (ligne du bas) ---
{
  let s: GameState = createInitialState("P1");
  const seq: Move[] = [
    { from: null, to: 0, player: "P1" },
    { from: null, to: 3, player: "P2" },
    { from: null, to: 1, player: "P1" },
    { from: null, to: 4, player: "P2" },
    { from: null, to: 2, player: "P1" }, // P1 aligne 0-1-2
  ];
  for (const m of seq) {
    s = applyMove(s, m).state;
  }
  assert(s.winner === "P1", "P1 gagne en alignant 0-1-2 pendant la phase de placement");
  assert(hasWinningLine(getMask(s.board, "P1")), "hasWinningLine détecte correctement la ligne 0-1-2");
  const line = findWinningLine(getMask(s.board, "P1"));
  assert(!!line && line[0] === 0 && line[1] === 1 && line[2] === 2, "findWinningLine retourne [0,1,2]");
}

// --- Test 3 : transition placement -> mouvement après 6 poses sans victoire ---
{
  let s: GameState = createInitialState("P1");
  // Placement qui évite toute victoire : P1 joue coins opposés non alignés, P2 bloque
  const seq: Move[] = [
    { from: null, to: 0, player: "P1" },
    { from: null, to: 1, player: "P2" },
    { from: null, to: 8, player: "P1" },
    { from: null, to: 5, player: "P2" },
    { from: null, to: 6, player: "P1" }, // P1: 0,8,6 -> pas de ligne (0,8,6 n'est pas une ligne)
    { from: null, to: 7, player: "P2" }, // P2: 1,5,7 -> pas de ligne
  ];
  for (const m of seq) {
    s = applyMove(s, m).state;
  }
  assert(s.phase === "mouvement", "passage en phase mouvement après 6 poses sans alignement");
  assert(s.winner === null, "aucun gagnant après ce placement neutre");
  assert(s.placedCount.P1 === 3 && s.placedCount.P2 === 3, "3 pions posés par joueur");
}

// --- Test 4 : génération de coups en phase mouvement (adjacence uniquement) ---
{
  let s: GameState = createInitialState("P1");
  const seq: Move[] = [
    { from: null, to: 0, player: "P1" },
    { from: null, to: 1, player: "P2" },
    { from: null, to: 8, player: "P1" },
    { from: null, to: 5, player: "P2" },
    { from: null, to: 6, player: "P1" },
    { from: null, to: 7, player: "P2" },
  ];
  for (const m of seq) s = applyMove(s, m).state;
  const moves = generateLegalMoves(s, "P1");
  // P1 a des pions sur 0, 8, 6. Vérifions qu'aucun coup ne mène vers une case occupée.
  const occupiedCells = new Set([0, 1, 5, 6, 7, 8]);
  const allValid = moves.every((m) => !occupiedCells.has(m.to));
  assert(allValid, "tous les coups générés en phase mouvement mènent vers une case libre");
  assert(moves.length > 0, "au moins un coup de mouvement disponible");
}

// --- Test 5 : l'IA facile retourne toujours un coup légal ---
{
  resetTranspositionTable();
  const s = createInitialState("P1");
  const stats = computeBestMove(s, "P1", "facile");
  assert(stats.bestMove !== null, "IA facile retourne un coup non-null");
  const legal = generateLegalMoves(s, "P1");
  const isLegal = legal.some((m) => m.to === stats.bestMove!.to && m.from === stats.bestMove!.from);
  assert(isLegal, "le coup de l'IA facile est dans la liste des coups légaux");
}

// --- Test 6 : l'IA difficile bloque une menace évidente (P2 a 2 alignés, doit bloquer) ---
{
  resetTranspositionTable();
  let s: GameState = createInitialState("P1");
  // P1 pose 0 et 1 (menace sur la case 2), c'est à P2 de jouer -> doit bloquer en 2
  const seq: Move[] = [
    { from: null, to: 0, player: "P1" },
    { from: null, to: 4, player: "P2" },
    { from: null, to: 1, player: "P1" }, // P1 menace 0-1-2
  ];
  for (const m of seq) s = applyMove(s, m).state;
  assert(s.winner === null, "pas encore de victoire (menace seulement)");

  const stats = computeBestMove(s, "P2", "difficile");
  assert(stats.bestMove !== null, "IA difficile retourne un coup face à la menace");
  assert(stats.bestMove!.to === 2, `IA difficile bloque en case 2 (a joué ${stats.bestMove!.to})`);
}

// --- Test 7 : l'IA difficile prend la victoire immédiate si possible ---
{
  resetTranspositionTable();
  let s: GameState = createInitialState("P1");
  const seq: Move[] = [
    { from: null, to: 0, player: "P1" },
    { from: null, to: 4, player: "P2" },
    { from: null, to: 3, player: "P1" }, // P1: 0,3 -> menace sur 6 (colonne 0-3-6)
    { from: null, to: 5, player: "P2" },
  ];
  for (const m of seq) s = applyMove(s, m).state;
  const stats = computeBestMove(s, "P1", "difficile");
  assert(stats.bestMove!.to === 6, `IA difficile complète la victoire en case 6 (a joué ${stats.bestMove!.to})`);
}

// --- Test 8 : opening book — premier coup = centre pour IA moyen/difficile ---
{
  resetTranspositionTable();
  const s = createInitialState("P1");
  const statsMoyen = computeBestMove(s, "P1", "moyen");
  assert(statsMoyen.bestMove!.to === 4, "IA moyenne ouvre au centre (case 4) via opening book");

  resetTranspositionTable();
  const statsDifficile = computeBestMove(s, "P1", "difficile");
  assert(statsDifficile.bestMove!.to === 4, "IA difficile ouvre au centre (case 4) via opening book");
}

// --- Test 9 : simulation complète IA difficile vs IA difficile ne plante pas et termine ---
{
  resetTranspositionTable();
  let s: GameState = createInitialState("P1");
  let iterations = 0;
  const maxIterations = 60;
  while (!isGameOver(s) && iterations < maxIterations) {
    const stats = computeBestMove(s, s.currentPlayer, "difficile");
    if (!stats.bestMove) break;
    s = applyMove(s, stats.bestMove).state;
    iterations++;
  }
  assert(iterations < maxIterations, `partie IA difficile vs IA difficile termine en ${iterations} coups (pas de boucle infinie)`);
  assert(s.winner !== null || s.isDraw, "la partie se termine par une victoire ou une nulle");
  console.log(`   -> Résultat: ${s.winner ? `${s.winner} gagne` : "nulle"} en ${iterations} coups, phase finale: ${s.phase}`);
}

// --- Test 10 : IA difficile ne perd jamais contre IA facile (sur plusieurs parties) ---
{
  let difficileWins = 0;
  let facileWins = 0;
  let draws = 0;
  const numGames = 6;

  for (let g = 0; g < numGames; g++) {
    resetTranspositionTable();
    let s: GameState = createInitialState(g % 2 === 0 ? "P1" : "P2");
    let iterations = 0;
    // P1 = difficile, P2 = facile
    while (!isGameOver(s) && iterations < 100) {
      const difficulty = s.currentPlayer === "P1" ? "difficile" : "facile";
      const stats = computeBestMove(s, s.currentPlayer, difficulty);
      if (!stats.bestMove) break;
      s = applyMove(s, stats.bestMove).state;
      iterations++;
    }
    if (s.winner === "P1") difficileWins++;
    else if (s.winner === "P2") facileWins++;
    else draws++;
  }
  console.log(`   -> Sur ${numGames} parties: Difficile gagne ${difficileWins}, Facile gagne ${facileWins}, Nulles ${draws}`);
  assert(facileWins === 0, "l'IA difficile ne perd jamais contre l'IA facile");
}

console.log("\n--- Tests terminés ---");
