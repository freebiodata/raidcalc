/**
 * RaidCalc verified dataset - Rust raid structures & explosives.
 *
 * SNAPSHOT: 2026-10-11
 * SOURCES (all values below were read from these pages on the snapshot date):
 *  [W-D]  Rust Wiki (Fandom), "Destruction" raid chart - min quantities and per-item
 *         structure damage tables: https://rust.fandom.com/wiki/Destruction
 *  [W-B]  Rust Wiki (Fandom), "Building" - tier HP (wood 250, stone 500, sheet metal 1000,
 *         armored 2000; wood door 200, armored door 800->1000 via chart) and the
 *         soft-side note ("the textured side is stronger than the smooth (inner side)"):
 *         https://rust.fandom.com/wiki/Building
 *  [W-I]  Rust Wiki (Fandom) item pages - crafting recipes & raw sulfur:
 *         Timed Explosive Charge (2200 sulfur), Rocket (1400), Satchel Charge (480),
 *         Beancan Grenade (60 gunpowder = 120 sulfur), Explosives (110 sulfur each),
 *         Gun Powder (20 sulfur per 10), Explosive 5.56 Rifle Ammo (25 sulfur/round,
 *         its own demolition table incl. strong/weak side), MLRS Rocket (damage 500,
 *         not craftable), Sulfur Ore (300 ore per node, 1:1 smelt).
 *  [RC]   RustClash wiki (rustlabs successor), per-target raid tables - server-rendered
 *         damage/count/sulfur values used to cross-check every count in this file:
 *         https://wiki.rustclash.com/building/stone-wall (+ wood/metal/armored wall,
 *         every door, tool cupboard, auto turret, SAM site, high external walls,
 *         ladder hatch).
 *
 * RECONCILIATION NOTES (where sources disagreed, the rustclash value won because its
 * damage x count math is self-consistent: dmg x (n-1) < HP <= dmg x n):
 * - Beancan grenade vs armored door: wiki Destruction count table says 56, but the
 *    wiki's own damage table (14.5 dmg) gives ceil(1000/14.5) = 69. rustclash: 69. Used: 69.
 * - Explosive ammo vs stone wall: wiki says 127 rounds; rustclash lists 185 hard side
 *    (2.704 dmg/round -> ceil(500/2.704) = 185). Used: 185 hard / 173 soft.
 * - Sheet metal wall HP 1000 comes from the wiki Destruction HP header row
 *    (the Building page prose omits it).
 * - Double doors need the same counts as single doors (wiki explosive-ammo page note;
 *    confirmed on rustclash sheet-metal-double-door table).
 */

export const DATA_SNAPSHOT = '2026-10-11';

/** Sidebar categories used in the target picker. */
export type TargetCategory = 'walls' | 'doors' | 'deployables';

export interface TargetDef {
  id: string;
  name: string;
  short: string;
  category: TargetCategory;
  hp: number;
  /** Wiki citation for the HP value. */
  hpSource: string;
  /** true = soft side is materially cheaper for at least one explosive (ammo/torch). */
  sideMatters: boolean;
  /** Torch-raidable (wood only). */
  wood?: boolean;
  note?: string;
}

export const TARGETS: TargetDef[] = [
  {
    id: 'wood-wall', name: 'Wood Wall', short: 'Wood', category: 'walls', hp: 250,
    hpSource: '[W-B] Wood Tier components have 250 health', sideMatters: true, wood: true,
  },
  {
    id: 'stone-wall', name: 'Stone Wall', short: 'Stone', category: 'walls', hp: 500,
    hpSource: '[W-B] Stone Tier components have 500 health', sideMatters: true,
  },
  {
    id: 'sheet-wall', name: 'Sheet Metal Wall', short: 'Sheet', category: 'walls', hp: 1000,
    hpSource: '[W-D] Sheet Metal Tier 1000 hp header', sideMatters: true,
  },
  {
    id: 'armored-wall', name: 'Armored Wall', short: 'Armored', category: 'walls', hp: 2000,
    hpSource: '[W-B] Armored Tier components have 2000 health', sideMatters: true,
  },
  {
    id: 'wood-door', name: 'Wooden Door', short: 'Wood door', category: 'doors', hp: 200,
    hpSource: '[W-B] Wood Tier Doors have 200 health', sideMatters: false, wood: true,
  },
  {
    id: 'sheet-door', name: 'Sheet Metal Door', short: 'Sheet door', category: 'doors', hp: 250,
    hpSource: '[W-D] Sheet Metal Door 250 hp header', sideMatters: false,
    note: 'The classic raid target: 2 rockets or 63 explosive rounds.',
  },
  {
    id: 'sheet-double-door', name: 'Sheet Metal Double Door', short: 'Sheet dbl door',
    category: 'doors', hp: 250,
    hpSource: '[W-I] Explosive ammo page: single and double doors need the same amount',
    sideMatters: false, note: 'Same counts as the single sheet door.',
  },
  {
    id: 'garage-door', name: 'Garage Door', short: 'Garage', category: 'doors', hp: 600,
    hpSource: '[W-D] Garage Door 600 hp header', sideMatters: false,
  },
  {
    id: 'armored-door', name: 'Armored Door', short: 'Armored door', category: 'doors', hp: 1000,
    hpSource: '[W-D] Armored Door 1000 hp header (Building page prose says 800; the raid chart header says 1000 and matches all damage math)',
    sideMatters: false,
  },
  {
    id: 'ladder-hatch', name: 'Ladder Hatch', short: 'Hatch', category: 'deployables', hp: 250,
    hpSource: '[W-D] Ladder Hatch 250 hp header', sideMatters: false,
  },
  {
    id: 'he-wood-wall', name: 'High External Wood Wall', short: 'HE wood', category: 'walls',
    hp: 500, hpSource: '[W-D] High External Wooden Wall 500 hp header', sideMatters: true,
    wood: true, note: 'Same damage profile as the wood wall, double HP.',
  },
  {
    id: 'he-stone-wall', name: 'High External Stone Wall', short: 'HE stone', category: 'walls',
    hp: 500, hpSource: '[W-D] High External Stone Wall 500 hp header', sideMatters: true,
    note: 'Identical explosive counts to the stone wall.',
  },
  {
    id: 'tc', name: 'Tool Cupboard', short: 'TC', category: 'deployables', hp: 100,
    hpSource: '[W-I] Tool Cupboard trivia: "The Tool Cupboard has 100 health"',
    sideMatters: false, note: 'Any single explosive removes it.',
  },
  {
    id: 'auto-turret', name: 'Auto Turret', short: 'Turret', category: 'deployables', hp: 1000,
    hpSource: '[RC] auto-turret table (1000 hp: 4 rockets x 312.5)', sideMatters: false,
  },
  {
    id: 'sam-site', name: 'SAM Site', short: 'SAM', category: 'deployables', hp: 1000,
    hpSource: '[RC] sam-site table (200 explosive rounds x 5.008 = 1000 hp)', sideMatters: false,
  },
];

export type ExplosiveKind = 'explosive' | 'ammo' | 'tool';

export interface ExplosiveDef {
  id: string;
  name: string;
  short: string;
  kind: ExplosiveKind;
  /** Raw sulfur cost per unit. null = not craftable (MLRS). */
  sulfur: number | null;
  /** Workbench tier required (0 = none / default blueprint). */
  bench: number;
  /** Short crafting recipe (components). */
  recipe: string;
  /** Fully raw crafting cost line (sulfur, charcoal, etc.). */
  raw: string;
  icon: string; // lucide icon name
  /** dud/failure note (satchel). */
  caveat?: string;
}

export const EXPLOSIVES: ExplosiveDef[] = [
  {
    id: 'c4', name: 'C4 (Timed Explosive Charge)', short: 'C4', kind: 'explosive',
    sulfur: 2200, bench: 3,
    recipe: '20 Explosives + 5 Cloth + 2 Tech Trash',
    raw: '2,200 sulfur · 3,000 charcoal · 200 metal frags · 60 low grade · 2 tech trash',
    icon: 'bomb',
  },
  {
    id: 'rocket', name: 'Rocket', short: 'Rocket', kind: 'explosive',
    sulfur: 1400, bench: 3,
    recipe: '2 Metal Pipes + 150 Gun Powder + 10 Explosives',
    raw: '1,400 sulfur · 1,950 charcoal · 100 metal frags · 30 low grade · 2 pipes',
    icon: 'rocket',
  },
  {
    id: 'satchel', name: 'Satchel Charge', short: 'Satchel', kind: 'explosive',
    sulfur: 480, bench: 1,
    recipe: '4 Beancan Grenades + 1 Rope + 1 Small Stash',
    raw: '480 sulfur · 720 charcoal · 80 metal frags · 10 cloth · 1 rope',
    icon: 'backpack',
    caveat: 'Satchels have a random fuse and a small chance to dud - experienced raiders carry ~20% spares. [W-I]',
  },
  {
    id: 'beancan', name: 'Beancan Grenade', short: 'Beancan', kind: 'explosive',
    sulfur: 120, bench: 1,
    recipe: '60 Gun Powder + 20 Metal Fragments',
    raw: '120 sulfur · 180 charcoal · 20 metal frags',
    icon: 'cylinder',
    caveat: 'Beancans stuck with a right-click deal more damage to structures than a thrown hit. [RC]',
  },
  {
    id: 'ammo', name: 'Explosive 5.56 Rifle Ammo', short: 'Explo ammo', kind: 'ammo',
    sulfur: 25, bench: 1,
    recipe: 'per 2 rounds: 10 Metal Frags + 20 Gun Powder + 10 Sulfur',
    raw: '25 sulfur · 15 metal frags · 30 charcoal per round',
    icon: 'target',
  },
  {
    id: 'mlrs', name: 'MLRS Rocket', short: 'MLRS', kind: 'explosive',
    sulfur: null, bench: 0,
    recipe: 'Not craftable - looted from APC, heli and elite crates',
    raw: 'Fired remotely via the Launch Site MLRS · 60–70 s flight delay · 3 SAM hits intercept it',
    icon: 'radar',
  },
  {
    id: 'torch', name: 'Torch (wood only)', short: 'Torch', kind: 'tool',
    sulfur: 0, bench: 0,
    recipe: '1 Wood + 1 Cloth',
    raw: 'Zero sulfur - the meme method. Only works on wood, only realistic from the soft side.',
    icon: 'flame',
  },
];

/**
 * Per-target damage/counts.
 * - mode 'damage': value = structure damage per unit -> count = ceil(hp / damage).
 *    This reproduces every count in the wiki Destruction chart (verified in tests).
 * - mode 'count': value = tested hits needed (torch - its damage model is not a
 *    simple HP division; wood fire/melee multipliers apply).
 * - hard/soft: explosive-only items are identical on both sides ('both'); items that
 *    also deal bullet or melee damage take MORE from the weak side, so they carry
 *    distinct hard/soft values. Soft side = the smooth face that faces indoors [W-B].
 */
export type DamageEntry =
  | { mode: 'damage'; both: number }
  | { mode: 'damage'; hard: number; soft: number }
  | { mode: 'count'; hard: number; soft: number };

export const DAMAGE: Record<string, Record<string, DamageEntry>> = {
  c4: {
    'wood-wall': { mode: 'damage', both: 495 },
    'stone-wall': { mode: 'damage', both: 275 },
    'sheet-wall': { mode: 'damage', both: 275 },
    'armored-wall': { mode: 'damage', both: 275 },
    'wood-door': { mode: 'damage', both: 1100 },
    'sheet-door': { mode: 'damage', both: 440 },
    'sheet-double-door': { mode: 'damage', both: 440 },
    'garage-door': { mode: 'damage', both: 440 },
    'armored-door': { mode: 'damage', both: 440 },
    'ladder-hatch': { mode: 'damage', both: 440 },
    'he-wood-wall': { mode: 'damage', both: 495 },
    'he-stone-wall': { mode: 'damage', both: 275 },
    tc: { mode: 'damage', both: 2200 },
    'auto-turret': { mode: 'damage', both: 1100 },
    'sam-site': { mode: 'damage', both: 1100 },
  },
  rocket: {
    'wood-wall': { mode: 'damage', both: 247.65 },
    'stone-wall': { mode: 'damage', both: 137.65 },
    'sheet-wall': { mode: 'damage', both: 137.575 },
    'armored-wall': { mode: 'damage', both: 137.575 },
    'wood-door': { mode: 'damage', both: 550.375 },
    'sheet-door': { mode: 'damage', both: 220.375 },
    'sheet-double-door': { mode: 'damage', both: 220.375 },
    'garage-door': { mode: 'damage', both: 220.375 },
    'armored-door': { mode: 'damage', both: 220.375 },
    'ladder-hatch': { mode: 'damage', both: 220.375 },
    'he-wood-wall': { mode: 'damage', both: 247.65 },
    'he-stone-wall': { mode: 'damage', both: 137.65 },
    tc: { mode: 'damage', both: 550.375 },
    'auto-turret': { mode: 'damage', both: 312.5 },
    'sam-site': { mode: 'damage', both: 312.5 },
  },
  satchel: {
    'wood-wall': { mode: 'damage', both: 91.5 },
    'stone-wall': { mode: 'damage', both: 51.5 },
    'sheet-wall': { mode: 'damage', both: 43.5 },
    'armored-wall': { mode: 'damage', both: 43.5 },
    'wood-door': { mode: 'damage', both: 170 },
    'sheet-door': { mode: 'damage', both: 70 },
    'sheet-double-door': { mode: 'damage', both: 70 },
    'garage-door': { mode: 'damage', both: 70 },
    'armored-door': { mode: 'damage', both: 70 },
    'ladder-hatch': { mode: 'damage', both: 70 },
    'he-wood-wall': { mode: 'damage', both: 91.5 },
    'he-stone-wall': { mode: 'damage', both: 51.5 },
    tc: { mode: 'damage', both: 322 },
    'auto-turret': { mode: 'damage', both: 550 },
    'sam-site': { mode: 'damage', both: 550 },
  },
  beancan: {
    'wood-wall': { mode: 'damage', both: 19.5 },
    'stone-wall': { mode: 'damage', both: 11 },
    'sheet-wall': { mode: 'damage', both: 9 },
    'armored-wall': { mode: 'damage', both: 9 },
    'wood-door': { mode: 'damage', both: 35 },
    'sheet-door': { mode: 'damage', both: 14.5 },
    'sheet-double-door': { mode: 'damage', both: 14.5 },
    'garage-door': { mode: 'damage', both: 14.5 },
    'armored-door': { mode: 'damage', both: 14.5 },
    'ladder-hatch': { mode: 'damage', both: 14.5 },
    'he-wood-wall': { mode: 'damage', both: 19.5 },
    'he-stone-wall': { mode: 'damage', both: 11 },
    tc: { mode: 'damage', both: 30.5 },
    'auto-turret': { mode: 'damage', both: 65 },
    'sam-site': { mode: 'damage', both: 65 },
  },
  ammo: {
    'wood-wall': { mode: 'damage', hard: 5.1072, soft: 5.7072 },
    'stone-wall': { mode: 'damage', hard: 2.704, soft: 2.904 },
    'sheet-wall': { mode: 'damage', hard: 2.506, soft: 2.508 },
    'armored-wall': { mode: 'damage', hard: 2.506, soft: 2.508 },
    'wood-door': { mode: 'damage', both: 11.016 },
    'sheet-door': { mode: 'damage', both: 4.0064 },
    'sheet-double-door': { mode: 'damage', both: 4.0064 },
    'garage-door': { mode: 'damage', both: 4.0064 },
    'armored-door': { mode: 'damage', both: 4.0064 },
    'ladder-hatch': { mode: 'damage', both: 4.0064 },
    'he-wood-wall': { mode: 'damage', hard: 5.1072, soft: 5.7072 },
    'he-stone-wall': { mode: 'damage', hard: 2.704, soft: 2.904 },
    tc: { mode: 'damage', both: 11.016 },
    'auto-turret': { mode: 'damage', both: 9.008 },
    'sam-site': { mode: 'damage', both: 5.008 },
  },
  mlrs: {
    'wood-wall': { mode: 'damage', both: 315.15 },
    'stone-wall': { mode: 'damage', both: 175.15 },
    'sheet-wall': { mode: 'damage', both: 175.075 },
    'armored-wall': { mode: 'damage', both: 175.075 },
    'wood-door': { mode: 'damage', both: 700.375 },
    'sheet-door': { mode: 'damage', both: 280.375 },
    'sheet-double-door': { mode: 'damage', both: 280.375 },
    'garage-door': { mode: 'damage', both: 280.375 },
    'armored-door': { mode: 'damage', both: 280.375 },
    'ladder-hatch': { mode: 'damage', both: 280.375 },
    'he-wood-wall': { mode: 'damage', both: 315.15 },
    'he-stone-wall': { mode: 'damage', both: 175.15 },
    tc: { mode: 'damage', both: 700.375 },
    'auto-turret': { mode: 'damage', both: 462.5 },
    'sam-site': { mode: 'damage', both: 387.5 },
  },
  // Torch: tested hit counts (mode 'count'); fire/melee vs wood is not a plain HP
  // division, so we store rustclash's tested values instead of deriving them.
  torch: {
    'wood-wall': { mode: 'count', hard: 962, soft: 97 },
    'wood-door': { mode: 'count', hard: 308, soft: 308 },
    'he-wood-wall': { mode: 'count', hard: 1924, soft: 194 },
  },
};

/** Sulfur economics (all per wiki item pages [W-I], cross-checked on rustclash [RC]). */
export const SULFUR_FACTS = {
  perGunpowder10: 20, // 20 sulfur + 30 charcoal -> 10 gun powder
  perExplosive: 110, // 50 gun powder + 10 sulfur + 3 LGF + 10 metal frags
  perNode: 300, // one sulfur node = 300 sulfur ore = 300 sulfur (1:1 smelt)
};
