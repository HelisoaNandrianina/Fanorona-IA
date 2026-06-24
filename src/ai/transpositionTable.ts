export type TTFlag = "exact" | "lowerbound" | "upperbound";

export interface TTEntry {
  depth: number;
  score: number;
  flag: TTFlag;
  bestMoveIndex?: number;
}

export class TranspositionTable {
  private table = new Map<string, TTEntry>();
  public hits = 0;
  public stores = 0;

  get(key: string): TTEntry | undefined {
    const entry = this.table.get(key);
    if (entry) this.hits++;
    return entry;
  }

  set(key: string, entry: TTEntry): void {
    this.table.set(key, entry);
    this.stores++;
  }

  clear(): void {
    this.table.clear();
    this.hits = 0;
    this.stores = 0;
  }

  get size(): number {
    return this.table.size;
  }
}
