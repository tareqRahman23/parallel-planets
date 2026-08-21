import { describe, it, expect, beforeEach } from 'vitest';
import { GameSession } from '../src/app/GameSession';

describe('Invasion Combat Rules, 3-Star System & Loot Escrow', () => {
  let session: GameSession;

  beforeEach(() => {
    session = new GameSession();
    session.rocket.repaired = true;
    session.addCoins(1000);
    session.purchaseCreature('rabbit');
    session.purchaseCreature('rabbit');
    session.update(3.1);

    session.selectCreatureForLaunch(session.ownedCreatures[0].id);
    session.selectCreatureForLaunch(session.ownedCreatures[1].id);
    session.confirmLoadout('none');
  });

  it('starts 180s battle timer upon deploying the first troop along the perimeter', () => {
    expect(session.invasion.timerStarted).toBe(false);
    expect(session.invasion.remainingSeconds).toBe(180);

    const rabbitId = session.ownedCreatures[0].id;
    expect(session.deployCreature(rabbitId, [10, 0, 0])).toBe(true);

    expect(session.invasion.timerStarted).toBe(true);
    expect(session.mode).toBe('invasion');
  });

  it('calculates 3-star conditions (50% destruction, Core, 100% destruction)', () => {
    // 8 counted buildings in total
    const buildings = session.invasion.buildings;
    expect(buildings.length).toBe(8);

    // Destroy 4 buildings (50%)
    for (let i = 1; i <= 4; i++) {
      buildings[i].health = 0;
      buildings[i].isDead = true;
    }

    const stars1 = session.calculateDestruction();
    expect(session.invasion.destructionPercent).toBe(50);
    expect(stars1.fiftyPercent).toBe(true);
    expect(stars1.core).toBe(false);
    expect(stars1.fullDestruction).toBe(false);

    // Destroy Core
    const core = buildings.find((b) => b.kind === 'core')!;
    core.health = 0;
    core.isDead = true;

    const stars2 = session.calculateDestruction();
    expect(stars2.fiftyPercent).toBe(true);
    expect(stars2.core).toBe(true);
    expect(stars2.fullDestruction).toBe(false);

    // Destroy remaining buildings (100%)
    buildings.forEach((b) => {
      b.health = 0;
      b.isDead = true;
    });
    const stars3 = session.calculateDestruction();
    expect(session.invasion.destructionPercent).toBe(100);
    expect(stars3.fullDestruction).toBe(true);
  });

  it('settles loot escrow into warehouse (Tech Parts first, then Stone, then auto-sells overflow)', () => {
    session.invasion.lootEscrow.coins = 240;
    session.invasion.lootEscrow.techParts = 5;
    session.invasion.lootEscrow.stone = 20;

    // Warehouse capacity is 20
    const result = session.finalizeInvasionResult();
    expect(result.lootSettlement?.coinsAdded).toBe(240 + 10); // 240 base + 10 overflow
    expect(result.lootSettlement?.techPartsStored).toBe(5); // 5 tech parts stored (15 slots left)
    expect(result.lootSettlement?.stoneStored).toBe(15); // 15 stone stored (warehouse full: 20/20)
    expect(result.lootSettlement?.stoneSold).toBe(5); // 5 stone sold at 2 coins each = +10 coins
    expect(result.lootSettlement?.overflowSaleCoins).toBe(10);
  });

  it('permanently removes dead deployed creatures and places survivors in 30s recovery', () => {
    const c1 = session.ownedCreatures[0];
    const c2 = session.ownedCreatures[1];

    session.deployCreature(c1.id, [10, 0, 0]);
    session.deployCreature(c2.id, [-10, 0, 0]);

    // c1 killed in battle
    c1.invasionState = 'lost';
    // c2 survived
    c2.invasionState = 'survived';

    session.finalizeInvasionResult();
    session.continueHomeFromInvasion();

    // c1 is permanently removed
    expect(session.ownedCreatures.find((c) => c.id === c1.id)).toBeUndefined();

    // c2 survives and enters 30s recovery
    const survivor = session.ownedCreatures.find((c) => c.id === c2.id)!;
    expect(survivor).toBeDefined();
    expect(survivor.homeState).toBe('recovering');
    expect(survivor.recoveryRemainingSeconds).toBe(30);
  });
});
