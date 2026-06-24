import { useEffect, useRef } from "react";
import type { Move } from "../game/types";
import { cellToNotation } from "../game/board";
import "./MoveHistory.css";

interface MoveHistoryProps {
  history: Move[];
}

export function MoveHistory({ history }: MoveHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history.length]);

  // Groupe les coups par paire (P1, P2) pour un affichage type "registre de partie"
  const pairs: Array<[Move | null, Move | null]> = [];
  for (let i = 0; i < history.length; i += 2) {
    pairs.push([history[i] ?? null, history[i + 1] ?? null]);
  }

  function formatMove(move: Move): string {
    const dest = cellToNotation(move.to);
    if (move.from === null) return dest;
    return `${cellToNotation(move.from)}→${dest}`;
  }

  return (
    <div className="move-history">
      <span className="move-history__eyebrow">Historique des coups</span>
      <div className="move-history__list" ref={scrollRef}>
        {pairs.length === 0 && (
          <p className="move-history__empty">Aucun coup joué pour l'instant.</p>
        )}
        {pairs.map(([m1, m2], i) => (
          <div className="move-history__row" key={i}>
            <span className="move-history__num">{i + 1}</span>
            <span className="move-history__cell move-history__cell--p1">
              {m1 ? formatMove(m1) : ""}
            </span>
            <span className="move-history__cell move-history__cell--p2">
              {m2 ? formatMove(m2) : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
