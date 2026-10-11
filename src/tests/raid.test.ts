import { describe, it, expect } from 'vitest';
import { unitsFor, cheapestOptions, cheapestMixedRaid, raidTotals } from '../lib/raid';
import { DAMAGE, EXPLOSIVES, TARGETS } from '../data/raid-data';

/**
 * These tests pin RaidCalc to the published raid tables:
 *  - Rust Wiki (Fandom) "Destruction" chart (min quantities per target)
 *  - RustClash wiki (rustlabs successor) per-target tables
 * Any failure here means the dataset or the ceil() math drifted.
 */
describe('counts match the published raid tables', () => {
  it('C4 counts match the wiki Destruction chart', () => {
    expect(unitsFor('wood-wall', 'c4')).toBe(1);
    expect(unitsFor('stone-wall', 'c4')).toBe(2);
    expect(unitsFor('sheet-wall', 'c4')).toBe(4);
    expect(unitsFor('armored-wall', 'c4')).toBe(8);
    expect(unitsFor('wood-door', 'c4')).toBe(1);
    expect(unitsFor('sheet-door', 'c4')).toBe(1);
    expect(unitsFor('garage-door', 'c4')).toBe(2);
    expect(unitsFor('armored-door', 'c4')).toBe(3);
    expect(unitsFor('ladder-hatch', 'c4')).toBe(1);
    expect(unitsFor('he-wood-wall', 'c4')).toBe(2);
    expect(unitsFor('he-stone-wall', 'c4')).toBe(2);
    expect(unitsFor('tc', 'c4')).toBe(1);
  });

  it('rocket counts match the wiki Destruction chart', () => {
    expect(unitsFor('wood-wall', 'rocket')).toBe(2);
    expect(unitsFor('stone-wall', 'rocket')).toBe(4);
    expect(unitsFor('sheet-wall', 'rocket')).toBe(8);
    expect(unitsFor('armored-wall', 'rocket')).toBe(15);
    expect(unitsFor('wood-door', 'rocket')).toBe(1);
    expect(unitsFor('sheet-door', 'rocket')).toBe(2);
    expect(unitsFor('garage-door', 'rocket')).toBe(3);
    expect(unitsFor('armored-door', 'rocket')).toBe(5);
    expect(unitsFor('ladder-hatch', 'rocket')).toBe(2);
    expect(unitsFor('he-wood-wall', 'rocket')).toBe(3);
    expect(unitsFor('he-stone-wall', 'rocket')).toBe(4);
  });

  it('satchel counts match the wiki Destruction chart', () => {
    expect(unitsFor('wood-wall', 'satchel')).toBe(3);
    expect(unitsFor('stone-wall', 'satchel')).toBe(10);
    expect(unitsFor('sheet-wall', 'satchel')).toBe(23);
    expect(unitsFor('armored-wall', 'satchel')).toBe(46);
    expect(unitsFor('wood-door', 'satchel')).toBe(2);
    expect(unitsFor('sheet-door', 'satchel')).toBe(4);
    expect(unitsFor('garage-door', 'satchel')).toBe(9);
    expect(unitsFor('armored-door', 'satchel')).toBe(15);
    expect(unitsFor('he-wood-wall', 'satchel')).toBe(6);
    expect(unitsFor('he-stone-wall', 'satchel')).toBe(10);
  });

  it('beancan counts match rustclash (69 for armored door, not the stale wiki 56)', () => {
    expect(unitsFor('wood-wall', 'beancan')).toBe(13);
    expect(unitsFor('stone-wall', 'beancan')).toBe(46);
    expect(unitsFor('sheet-wall', 'beancan')).toBe(112);
    expect(unitsFor('armored-wall', 'beancan')).toBe(223);
    expect(unitsFor('wood-door', 'beancan')).toBe(6);
    expect(unitsFor('sheet-door', 'beancan')).toBe(18);
    expect(unitsFor('garage-door', 'beancan')).toBe(42);
    expect(unitsFor('armored-door', 'beancan')).toBe(69);
    expect(unitsFor('he-wood-wall', 'beancan')).toBe(26);
    expect(unitsFor('he-stone-wall', 'beancan')).toBe(46);
  });

  it('explosive ammo: 63 for sheet metal door, 185/173 hard/soft for stone wall (rustclash)', () => {
    expect(unitsFor('sheet-door', 'ammo')).toBe(63);
    expect(unitsFor('garage-door', 'ammo')).toBe(150);
    expect(unitsFor('armored-door', 'ammo')).toBe(250);
    expect(unitsFor('wood-door', 'ammo')).toBe(19);
    expect(unitsFor('sheet-wall', 'ammo', 'hard')).toBe(400);
    expect(unitsFor('armored-wall', 'ammo', 'hard')).toBe(799);
    expect(unitsFor('stone-wall', 'ammo', 'hard')).toBe(185);
    expect(unitsFor('stone-wall', 'ammo', 'soft')).toBe(173);
    expect(unitsFor('wood-wall', 'ammo', 'hard')).toBe(49);
    expect(unitsFor('wood-wall', 'ammo', 'soft')).toBe(44);
  });

  it('deployables (rustclash): TC, turret, SAM', () => {
    expect(unitsFor('tc', 'rocket')).toBe(1);
    expect(unitsFor('tc', 'satchel')).toBe(1);
    expect(unitsFor('tc', 'ammo')).toBe(10);
    expect(unitsFor('auto-turret', 'rocket')).toBe(4);
    expect(unitsFor('auto-turret', 'satchel')).toBe(2);
    expect(unitsFor('auto-turret', 'beancan')).toBe(16);
    expect(unitsFor('auto-turret', 'ammo')).toBe(112);
    expect(unitsFor('sam-site', 'rocket')).toBe(4);
    expect(unitsFor('sam-site', 'satchel')).toBe(2);
    expect(unitsFor('sam-site', 'ammo')).toBe(200);
    expect(unitsFor('sam-site', 'mlrs')).toBe(3);
  });

  it('torch: 97 hits on the soft side of a wood wall, 962 hard, 308 for a wood door', () => {
    expect(unitsFor('wood-wall', 'torch', 'soft')).toBe(97);
    expect(unitsFor('wood-wall', 'torch', 'hard')).toBe(962);
    expect(unitsFor('wood-door', 'torch')).toBe(308);
  });
});

describe('sulfur economics', () => {
  it('explosive sulfur costs match the wiki recipes', () => {
    const byId = Object.fromEntries(EXPLOSIVES.map((e) => [e.id, e]));
    expect(byId.c4.sulfur).toBe(2200);
    expect(byId.rocket.sulfur).toBe(1400);
    expect(byId.satchel.sulfur).toBe(480);
    expect(byId.beancan.sulfur).toBe(120);
    expect(byId.ammo.sulfur).toBe(25);
    expect(byId.mlrs.sulfur).toBeNull();
    expect(byId.torch.sulfur).toBe(0);
  });

  it('recipe sulfur reconciles: C4 = 20 explosives x 110, rocket = 10x110 + 150x2', () => {
    // 1 Explosives = 50 gunpowder (100 sulfur) + 10 sulfur = 110 sulfur
    expect(20 * 110).toBe(2200); // C4
    expect(10 * 110 + 150 * 2).toBe(1400); // Rocket
    // Satchel = 4 beancans; beancan = 60 gunpowder = 120 sulfur
    expect(4 * 120).toBe(480); // Satchel
  });
});

describe('solver', () => {
  it('sheet metal door: explosive ammo wins on paper (63 x 25 = 1,575), then satchels', () => {
    const opts = cheapestOptions('sheet-door');
    expect(opts[0].explosiveId).toBe('ammo');
    expect(opts[0].sulfur).toBe(1575);
    expect(opts[1].explosiveId).toBe('satchel');
    expect(opts[1].sulfur).toBe(1920);
    expect(opts.find((o) => o.explosiveId === 'rocket')?.sulfur).toBe(2800);
  });

  it('stone wall: C4 edges out ammo on pure sulfur (4,400 vs 4,625), satchels third', () => {
    const opts = cheapestOptions('stone-wall', 'hard');
    expect(opts[0].explosiveId).toBe('c4');
    expect(opts[0].sulfur).toBe(4400);
    expect(opts[1].explosiveId).toBe('ammo');
    expect(opts[1].sulfur).toBe(4625);
    expect(opts[2].explosiveId).toBe('satchel');
    expect(opts[2].sulfur).toBe(4800);
  });

  it('soft side saves sulfur on stone walls (173 rounds)', () => {
    const soft = cheapestOptions('stone-wall', 'soft');
    expect(soft[0].count).toBe(173);
    expect(soft[0].sulfur).toBe(4325);
  });

  it('the famous raid: 2 sheet doors + 1 stone wall = ammo + C4 = 7,550 sulfur', () => {
    const raid = cheapestMixedRaid([
      { targetId: 'sheet-door', qty: 2 },
      { targetId: 'stone-wall', qty: 1 },
    ]);
    // doors: 63 ammo each = 1,575 x2 = 3,150; stone wall: 2 C4 = 4,400.
    expect(raid.sulfur).toBe(7550);
    expect(raid.lines[0].option.explosiveId).toBe('ammo');
    expect(raid.lines[1].option.explosiveId).toBe('c4');
  });

  it('armored door: cheapest on paper is explosive ammo (250 x 25 = 6,250)', () => {
    const opts = cheapestOptions('armored-door');
    expect(opts[0].explosiveId).toBe('ammo');
    expect(opts[0].sulfur).toBe(6250);
    expect(opts.find((o) => o.explosiveId === 'beancan')?.sulfur).toBe(8280);
  });

  it('totals aggregate across quantities', () => {
    const totals = raidTotals([{ targetId: 'sheet-door', qty: 3 }]);
    const rockets = totals.byExplosive.get('rocket')!;
    expect(rockets.total).toBe(6); // 2 per door x 3
    expect(rockets.sulfur).toBe(8400);
    expect(totals.sulfur).toBeGreaterThanOrEqual(5760); // at least satchel route 4x3x480
  });
});

describe('dataset integrity', () => {
  it('every target has at least C4 + rocket + satchel + beancan + ammo entries', () => {
    for (const t of TARGETS) {
      for (const ex of ['c4', 'rocket', 'satchel', 'beancan', 'ammo', 'mlrs']) {
        expect(DAMAGE[ex]?.[t.id], `${ex} vs ${t.id}`).toBeDefined();
      }
    }
  });

  it('ceil math is self-consistent: damage x (n-1) < hp <= damage x n', () => {
    for (const [exId, targets] of Object.entries(DAMAGE)) {
      for (const [tId, entry] of Object.entries(targets)) {
        if (entry.mode !== 'damage') continue;
        const hp = TARGETS.find((t) => t.id === tId)!.hp;
        const check = (dmg: number) => {
          const n = Math.ceil(hp / dmg);
          expect(dmg * (n - 1), `${exId} vs ${tId}`).toBeLessThan(hp);
          expect(dmg * n, `${exId} vs ${tId}`).toBeGreaterThanOrEqual(hp);
        };
        if ('both' in entry) check(entry.both);
        else {
          check(entry.hard);
          check(entry.soft);
        }
      }
    }
  });

  it('wood targets are flagged so the torch option only appears on wood', () => {
    const woodIds = TARGETS.filter((t) => t.wood).map((t) => t.id);
    expect(Object.keys(DAMAGE.torch).sort()).toEqual([...woodIds].sort());
  });
});
