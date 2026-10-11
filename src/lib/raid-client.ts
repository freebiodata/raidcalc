/**
 * Client-side companions to lib/raid.ts for the interactive tools.
 * The full dataset ships to the browser via a JSON <script> tag (see tool pages);
 * these helpers work against that parsed payload so we don't bundle the whole
 * TS data module into client JS.
 */

export interface PayloadTarget {
  id: string;
  name: string;
  short: string;
  hp: number;
  wood: boolean;
  cat: string;
  note: string | null;
}

export interface PayloadExplosive {
  id: string;
  name: string;
  short: string;
  sulfur: number | null;
  bench: number;
  kind: 'explosive' | 'ammo' | 'tool';
}

export type PayloadDamage = Record<string, Record<string, { mode: 'damage' | 'count'; both?: number; hard?: number; soft?: number }>>;

export interface Payload {
  targets: PayloadTarget[];
  explosives: PayloadExplosive[];
  damage: PayloadDamage;
}

export interface PlanRowLite {
  t: string;
  q: number;
  s?: 'hard' | 'soft';
}

export const SULFUR_PER_NODE = 300;

export const fmt = (n: number): string => n.toLocaleString('en-US');

/** Units of explosive needed for one target, from the payload. */
export function unitsForPayload(
  payload: Payload,
  targetId: string,
  explosiveId: string,
  side: 'hard' | 'soft' = 'hard',
): number | null {
  const entry = payload.damage[explosiveId]?.[targetId];
  const target = payload.targets.find((t) => t.id === targetId);
  if (!entry || !target) return null;
  if (entry.mode === 'count') {
    const v = side === 'soft' ? entry.soft : entry.hard;
    return v ?? null;
  }
  const dmg = entry.both ?? (side === 'soft' ? entry.soft : entry.hard);
  if (dmg == null) return null;
  return Math.ceil(target.hp / dmg);
}

export interface SolverRow {
  id: string;
  count: number;
  sulfur: number;
  bench: number;
  kind: PayloadExplosive['kind'];
}

/** Ranked options (sulfur ascending) for one target. */
export function optionsForPayload(
  payload: Payload,
  targetId: string,
  side: 'hard' | 'soft',
  opts: { includeTools?: boolean; includeMlrs?: boolean } = {},
): SolverRow[] {
  const { includeTools = false, includeMlrs = false } = opts;
  const out: SolverRow[] = [];
  for (const ex of payload.explosives) {
    if (ex.kind === 'tool' && !includeTools) continue;
    if (ex.id === 'mlrs' && !includeMlrs) continue;
    const n = unitsForPayload(payload, targetId, ex.id, side);
    if (n == null || ex.sulfur == null) continue;
    out.push({ id: ex.id, count: n, sulfur: n * ex.sulfur, bench: ex.bench, kind: ex.kind });
  }
  out.sort((a, b) => a.sulfur - b.sulfur || a.count - b.count);
  return out;
}

/** Cheapest mixed raid across a plan; groups by explosive id. */
export function cheapestMixedFromPayload(payload: Payload, rows: PlanRowLite[]) {
  const groups = new Map<string, { id: string; count: number; sulfur: number }>();
  let sulfur = 0;
  const perTarget: { targetId: string; qty: number; explosiveId: string; count: number; sulfur: number }[] = [];
  for (const row of rows) {
    if (row.q < 1) continue;
    const best = optionsForPayload(payload, row.t, row.s ?? 'hard')[0];
    if (!best) continue;
    const count = best.count * row.q;
    const cost = best.sulfur * row.q;
    sulfur += cost;
    const acc = groups.get(best.id) ?? { id: best.id, count: 0, sulfur: 0 };
    acc.count += count;
    acc.sulfur += cost;
    groups.set(best.id, acc);
    perTarget.push({ targetId: row.t, qty: row.q, explosiveId: best.id, count, sulfur: cost });
  }
  return { groups: [...groups.values()], sulfur, perTarget };
}
