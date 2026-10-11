import {
  TARGETS,
  EXPLOSIVES,
  DAMAGE,
  type TargetDef,
  type ExplosiveDef,
  type DamageEntry,
} from '../data/raid-data';

export type Side = 'hard' | 'soft';

export interface TargetSelection {
  targetId: string;
  qty: number;
  /** Only used where the explosive differentiates sides. */
  side?: Side;
}

export interface CostLine {
  explosive: ExplosiveDef;
  /** units needed for ONE of the target */
  perTarget: number;
  /** units for the whole line (perTarget x qty), rounded up */
  total: number;
  sulfur: number | null;
  sideUsed: Side | 'both';
}

export interface TargetCost {
  target: TargetDef;
  qty: number;
  lines: CostLine[];
}

export interface RaidTotals {
  targets: TargetCost[];
  byExplosive: Map<string, { explosive: ExplosiveDef; total: number; sulfur: number | null }>;
  sulfur: number;
}

function countFor(entry: DamageEntry, hp: number, side: Side): number {
  if (entry.mode === 'count') {
    return side === 'soft' ? entry.soft : entry.hard;
  }
  if ('both' in entry) return Math.ceil(hp / entry.both);
  return Math.ceil(hp / (side === 'soft' ? entry.soft : entry.hard));
}

/** Units of `explosiveId` needed to destroy one unit of `targetId`. */
export function unitsFor(targetId: string, explosiveId: string, side: Side = 'hard'): number | null {
  const target = TARGETS.find((t) => t.id === targetId);
  const entry = DAMAGE[explosiveId]?.[targetId];
  if (!target || !entry) return null;
  return countFor(entry, target.hp, side);
}

/** Full cost table for one target across every applicable explosive. */
export function costForTarget(targetId: string, qty = 1, side: Side = 'hard'): TargetCost | null {
  const target = TARGETS.find((t) => t.id === targetId);
  if (!target) return null;
  const lines: CostLine[] = [];
  for (const explosive of EXPLOSIVES) {
    const per = unitsFor(targetId, explosive.id, side);
    if (per == null) continue;
    lines.push({
      explosive,
      perTarget: per,
      total: per * qty,
      sulfur: explosive.sulfur == null ? null : explosive.sulfur * per * qty,
      sideUsed: perHardPerSoftEqual(targetId, explosive.id) ? 'both' : side,
    });
  }
  return { target, qty, lines };
}

function perHardPerSoftEqual(targetId: string, explosiveId: string): boolean {
  const entry = DAMAGE[explosiveId]?.[targetId];
  if (!entry) return true;
  if (entry.mode === 'count') return entry.hard === entry.soft;
  if ('both' in entry) return true;
  return entry.hard === entry.soft;
}

/** Totals across a whole raid plan. */
export function raidTotals(selections: TargetSelection[]): RaidTotals {
  const targets: TargetCost[] = [];
  const byExplosive = new Map<string, { explosive: ExplosiveDef; total: number; sulfur: number | null }>();
  let sulfur = 0;
  for (const sel of selections) {
    if (!Number.isFinite(sel.qty) || sel.qty < 1) continue;
    const cost = costForTarget(sel.targetId, Math.floor(sel.qty), sel.side ?? 'hard');
    if (!cost) continue;
    targets.push(cost);
    for (const line of cost.lines) {
      const acc = byExplosive.get(line.explosive.id) ?? { explosive: line.explosive, total: 0, sulfur: 0 };
      acc.total += line.total;
      if (line.sulfur != null) {
        acc.sulfur = (acc.sulfur ?? 0) + line.sulfur;
        sulfur += line.sulfur;
      }
      byExplosive.set(line.explosive.id, acc);
    }
  }
  return { targets, byExplosive, sulfur };
}

export interface SolverOption {
  explosiveId: string;
  count: number;
  sulfur: number;
  bench: number;
}

/**
 * Ranked cheapest options for one target, by total sulfur.
 * `includeTools=false` drops zero-sulfur meme methods (torch);
 * `craftableOnly=true` drops MLRS (not craftable, no sulfur price).
 */
export function cheapestOptions(
  targetId: string,
  side: Side = 'hard',
  opts: { includeTools?: boolean; craftableOnly?: boolean } = {},
): SolverOption[] {
  const { includeTools = false, craftableOnly = true } = opts;
  const target = TARGETS.find((t) => t.id === targetId);
  if (!target) return [];
  const out: SolverOption[] = [];
  for (const ex of EXPLOSIVES) {
    if (ex.kind === 'tool' && !includeTools) continue;
    if (craftableOnly && ex.sulfur == null) continue;
    const n = unitsFor(targetId, ex.id, side);
    if (n == null || ex.sulfur == null) continue;
    out.push({ explosiveId: ex.id, count: n, sulfur: n * ex.sulfur, bench: ex.bench });
  }
  out.sort((a, b) => a.sulfur - b.sulfur || a.count - b.count);
  return out;
}

/** Cheapest raid (sulfur) across several targets, mixing explosives freely. */
export function cheapestMixedRaid(selections: TargetSelection[], side: Side = 'hard') {
  const lines: { target: TargetDef; qty: number; option: SolverOption }[] = [];
  let sulfur = 0;
  for (const sel of selections) {
    if (!Number.isFinite(sel.qty) || sel.qty < 1) continue;
    const target = TARGETS.find((t) => t.id === sel.targetId);
    if (!target) continue;
    const best = cheapestOptions(sel.targetId, sel.side ?? side)[0];
    if (!best) continue;
    const qty = Math.floor(sel.qty);
    sulfur += best.sulfur * qty;
    lines.push({ target, qty, option: { ...best, count: best.count * qty, sulfur: best.sulfur * qty } });
  }
  return { lines, sulfur };
}

export const fmt = (n: number): string => n.toLocaleString('en-US');
