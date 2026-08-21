import { describe, it, expect, beforeEach } from 'vitest';
import { GameSession } from '../src/app/GameSession';
import { getCreatureStats } from '../src/creatures/CreatureData';

describe('Creatures, Growth Stages & Armor Multipliers', () => {
  let session: GameSession;

  beforeEach(() => {
    session = new GameSession();
    session.addCoins(1000);
  });

  it('delivers purchased creatures after 3 seconds', () => {
    expect(session.purchaseCreature('rabbit')).toBe(true);
    expect(session.pendingDeliveries.length).toBe(1);

    session.update(3.1);
    expect(session.pendingDeliveries.length).toBe(0);
    expect(session.ownedCreatures.length).toBe(1);
    expect(session.ownedCreatures[0].homeState).toBe('active');
  });

  it('starts the appetite timer after delivery so creatures enter the farming loop', () => {
    session.purchaseCreature('rabbit');
    session.update(3.1);
    const rabbit = session.ownedCreatures[0];
    const appetiteAtDelivery = rabbit.appetiteRemainingSeconds;

    session.update(1);

    expect(rabbit.appetiteRemainingSeconds).toBeLessThan(appetiteAtDelivery);
  });

  it('tracks rabbit growth stages: Kit (0-1) -> Runner (2-4) -> Vanguard (5+)', () => {
    session.purchaseCreature('rabbit');
    session.update(3.1);
    const rabbit = session.ownedCreatures[0];

    // Initial Stage 1 (Kit)
    let stats = getCreatureStats(rabbit);
    expect(stats.stageName).toBe('Kit');
    expect(stats.maxHealth).toBe(45);
    expect(stats.damage).toBe(6);

    // Feed 2 carrots -> Stage 2 (Runner)
    session.feedCreature(rabbit.id);
    session.feedCreature(rabbit.id);
    stats = getCreatureStats(session.ownedCreatures[0]);
    expect(stats.stageName).toBe('Runner');
    expect(stats.maxHealth).toBe(70);

    // Feed 3 more (total 5) -> Stage 3 (Vanguard)
    session.feedCreature(rabbit.id);
    session.feedCreature(rabbit.id);
    session.feedCreature(rabbit.id);
    stats = getCreatureStats(session.ownedCreatures[0]);
    expect(stats.stageName).toBe('Vanguard');
    expect(stats.maxHealth).toBe(95);
  });

  it('applies multiplicative armor damage reduction correctly', () => {
    session.purchaseCreature('bull');
    session.update(3.1);
    const bull = session.ownedCreatures[0];
    expect(bull).toBeDefined();

    // Bull Base reduction: 20% (1.0 - 0.8)
    let stats = getCreatureStats(bull);
    expect(stats.damageReduction).toBeCloseTo(0.20);

    // Equip Bull Armor (+10% additional reduction multiplicatively)
    // 1.0 - (1.0 - 0.20) * (1.0 - 0.10) = 1.0 - 0.80 * 0.90 = 1.0 - 0.72 = 0.28 (28%)
    session.equipment.bullArmor = 1;
    expect(session.assignArmor(bull.id, 'bullArmor')).toBe(true);
    expect(session.ownedCreatures[0].armorEquipped).toBe(true);

    stats = getCreatureStats(session.ownedCreatures[0]);
    expect(stats.damageReduction).toBeCloseTo(0.28, 2);
  });

  it('drops loose fur near rabbit upon digesting or clicking directly', () => {
    session.purchaseCreature('rabbit');
    session.update(3.1);
    const rabbit = session.ownedCreatures[0];
    rabbit.worldPosition = [3, 0, 4];

    // Feed rabbit -> schedules pending fur
    session.feedCreature(rabbit.id);
    expect(rabbit.pendingProduct).not.toBeNull();
    expect(rabbit.pendingProduct?.kind).toBe('fur');

    // Clicking rabbit speeds up and immediately drops the loose fur
    const result = session.interactWithCreature(rabbit.id);
    expect(result).not.toBeNull();
    expect(result?.action).toBe('speedup');
    expect(session.home.looseProducts.length).toBe(1);
    expect(session.home.looseProducts[0].kind).toBe('fur');
    expect(session.home.looseProducts[0].worldPosition[0]).toBeCloseTo(3, 0);
    expect(session.home.looseProducts[0].worldPosition[2]).toBeCloseTo(4, 0);

    // Collect the loose fur
    const collected = session.collectProduct(session.home.looseProducts[0].id);
    expect(collected).not.toBeNull();
    expect(session.economy.inventory.fur).toBe(1);
  });
});
