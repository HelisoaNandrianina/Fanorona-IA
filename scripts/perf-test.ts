import { createInitialState, applyMove, isGameOver } from "../src/game/rules";
import { computeBestMove, resetTranspositionTable } from "../src/ai/minimax";
import type { GameState, Difficulty } from "../src/game/types";

function playGame(d1: Difficulty, d2: Difficulty, starter: "P1" | "P2") {
  resetTranspositionTable();
  let s: GameState = createInitialState(starter);
  let iterations = 0;
  const timesP1: number[] = [];
  const timesP2: number[] = [];
  const depthsDifficile: number[] = [];
  const nodesDifficile: number[] = [];

  while (!isGameOver(s) && iterations < 150) {
    const difficulty = s.currentPlayer === "P1" ? d1 : d2;
    const stats = computeBestMove(s, s.currentPlayer, difficulty);
    if (!stats.bestMove) break;

    if (s.currentPlayer === "P1") timesP1.push(stats.timeMs);
    else timesP2.push(stats.timeMs);

    if (difficulty === "difficile") {
      depthsDifficile.push(stats.depth);
      nodesDifficile.push(stats.nodesExplored);
    }

    s = applyMove(s, stats.bestMove).state;
    iterations++;
  }

  return { state: s, iterations, timesP1, timesP2, depthsDifficile, nodesDifficile };
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

console.log("=== Mesure : Difficile (P1) vs Moyen (P2), 20 parties ===");
{
  let p1Wins = 0, p2Wins = 0, draws = 0;
  const allTimesP1: number[] = [];
  const allDepths: number[] = [];
  const allNodes: number[] = [];
  for (let i = 0; i < 20; i++) {
    const r = playGame("difficile", "moyen", i % 2 === 0 ? "P1" : "P2");
    if (r.state.winner === "P1") p1Wins++;
    else if (r.state.winner === "P2") p2Wins++;
    else draws++;
    allTimesP1.push(...r.timesP1);
    allDepths.push(...r.depthsDifficile);
    allNodes.push(...r.nodesDifficile);
  }
  console.log(`Difficile gagne: ${p1Wins}/20 (${(p1Wins/20*100).toFixed(0)}%)`);
  console.log(`Moyen gagne: ${p2Wins}/20`);
  console.log(`Nulles: ${draws}/20`);
  console.log(`Temps moyen IA Difficile: ${avg(allTimesP1).toFixed(1)} ms`);
  console.log(`Profondeur moyenne atteinte (Difficile): ${avg(allDepths).toFixed(1)}`);
  console.log(`Nœuds explorés moyens par coup (Difficile): ${avg(allNodes).toFixed(0)}`);
}

console.log("\n=== Mesure : Difficile (P1) vs Facile (P2), 20 parties ===");
{
  let p1Wins = 0, p2Wins = 0, draws = 0;
  for (let i = 0; i < 20; i++) {
    const r = playGame("difficile", "facile", i % 2 === 0 ? "P1" : "P2");
    if (r.state.winner === "P1") p1Wins++;
    else if (r.state.winner === "P2") p2Wins++;
    else draws++;
  }
  console.log(`Difficile gagne: ${p1Wins}/20 (${(p1Wins/20*100).toFixed(0)}%)`);
  console.log(`Facile gagne: ${p2Wins}/20`);
  console.log(`Nulles: ${draws}/20`);
}

console.log("\n=== Mesure : Moyen (P1) vs Facile (P2), 20 parties ===");
{
  let p1Wins = 0, p2Wins = 0, draws = 0;
  for (let i = 0; i < 20; i++) {
    const r = playGame("moyen", "facile", i % 2 === 0 ? "P1" : "P2");
    if (r.state.winner === "P1") p1Wins++;
    else if (r.state.winner === "P2") p2Wins++;
    else draws++;
  }
  console.log(`Moyen gagne: ${p1Wins}/20 (${(p1Wins/20*100).toFixed(0)}%)`);
  console.log(`Facile gagne: ${p2Wins}/20`);
  console.log(`Nulles: ${draws}/20`);
}

console.log("\n=== Mesure : temps moyen par niveau (position de départ) ===");
{
  for (const diff of ["facile", "moyen", "difficile"] as Difficulty[]) {
    resetTranspositionTable();
    const times: number[] = [];
    for (let i = 0; i < 15; i++) {
      resetTranspositionTable();
      const s = createInitialState("P1");
      const stats = computeBestMove(s, "P1", diff);
      times.push(stats.timeMs);
    }
    console.log(`${diff}: ${avg(times).toFixed(2)} ms (moyenne sur 15 mesures)`);
  }
}

console.log("\n=== Mesure : temps IA difficile en milieu de partie (phase mouvement) ===");
{
  resetTranspositionTable();
  let s: GameState = createInitialState("P1");
  const setup = [0, 1, 8, 5, 6, 7]; // place 6 pions sans victoire (cf. test-engine)
  for (let i = 0; i < setup.length; i++) {
    s = applyMove(s, { from: null, to: setup[i], player: i % 2 === 0 ? "P1" : "P2" }).state;
  }
  const times: number[] = [];
  const depths: number[] = [];
  const nodes: number[] = [];
  for (let i = 0; i < 10; i++) {
    const stats = computeBestMove(s, s.currentPlayer, "difficile");
    times.push(stats.timeMs);
    depths.push(stats.depth);
    nodes.push(stats.nodesExplored);
  }
  console.log(`Temps moyen (phase mouvement): ${avg(times).toFixed(1)} ms`);
  console.log(`Profondeur moyenne: ${avg(depths).toFixed(1)}`);
  console.log(`Nœuds explorés moyens: ${avg(nodes).toFixed(0)}`);
}
