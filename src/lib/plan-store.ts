/**
 * Shared raid-plan store (browser).
 * The plan is a plain array of {t, q, s} rows kept in localStorage so the three
 * RaidCalc tools hand off to each other: pick targets in the calculator, price
 * them in the solver, farm for them in the ETA tool. Everything stays on device.
 */

export interface PlanRow {
  t: string; // target id
  q: number; // quantity
  s?: 'soft' | 'hard';
}

const KEY = 'raidcalc.plan.v1';

export function loadPlan(): PlanRow[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((r) => r && typeof r.t === 'string' && Number.isFinite(r.q) && r.q > 0);
  } catch {
    return [];
  }
}

export function savePlan(rows: PlanRow[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(rows.filter((r) => r.q > 0)));
  } catch {
    /* storage unavailable - plan stays in memory only */
  }
}

export function clearPlan(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}

/** Minimal event bus so tabs/pages stay in sync. */
export const PLAN_EVENT = 'raidcalc:plan';

export function announcePlan(): void {
  window.dispatchEvent(new CustomEvent(PLAN_EVENT));
}

export function onPlan(cb: () => void): void {
  window.addEventListener(PLAN_EVENT, cb);
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) cb();
  });
}

/** Copy a human-readable plan summary to the clipboard. */
export function planSummary(rows: PlanRow[], names: Record<string, string>): string {
  if (!rows.length) return '';
  const lines = rows.map((r) => `${r.q}x ${names[r.t] ?? r.t}${r.s === 'soft' ? ' (soft side)' : ''}`);
  return `Rust raid plan (made with raidcalc.top):\n${lines.join('\n')}`;
}
