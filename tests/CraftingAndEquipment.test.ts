import { describe, it, expect, beforeEach } from 'vitest';
import { GameSession } from '../src/app/GameSession';
import { getCreatureStats } from '../src/creatures/CreatureData';

describe('Crafting Workshop and Equipment Inventory', () => {
  let session: GameSession;

  beforeEach(() => {
    session = new GameSession();
    // Build workshop prerequisite machines & upgrade warehouse to L1 (35 cap)
    session.addCoins(3000);
    session.upgradeWarehouse(); // L0 (20) -> L1 (35)
    session.purchaseMachine('drill');
    session.purchaseMachine('spinnery');
    session.update(5.1);
    session.machines.find((m) => m.kind === 'drill')!.autoRunEnabled = false;
    session.purchaseMachine('tailor');
    session.purchaseMachine('stoneForge');
    session.update(5.1);
    session.purchaseMachine('workshop');
    session.update(5.1);
  });

  it('crafts Orbital Sword Support with 15 Stone + 1 Fabric + 2 Tech Parts', () => {
    session.addToInventory('stone', 15);
    session.addToInventory('fabric', 1);
    session.addToInventory('techParts', 2);

    expect(session.queueWorkshopRecipe('swordSupport')).toBe(true);
    expect(session.stone).toBe(0);

    session.update(10.1);
    expect(session.collectWorkshopItem('swordSupport')).toBe(true);
    expect(session.equipment.swordSupportUnlocked).toBe(true);
  });

  it('crafts Orbital Gun Support with 25 Stone + 3 Tech Parts', () => {
    session.addToInventory('stone', 25);
    session.addToInventory('techParts', 3);

    expect(session.queueWorkshopRecipe('gunSupport')).toBe(true);

    session.update(12.1);
    expect(session.collectWorkshopItem('gunSupport')).toBe(true);
    expect(session.equipment.gunSupportUnlocked).toBe(true);
  });

  it('crafts and assigns Rabbit Armor to Rabbit, boosting stats', () => {
    session.purchaseCreature('rabbit');
    session.update(3.1);
    const rabbit = session.ownedCreatures[0];

    session.addToInventory('stone', 10);
    session.addToInventory('fabric', 1);
    session.addToInventory('techParts', 1);

    expect(session.queueWorkshopRecipe('rabbitArmor')).toBe(true);
    session.update(8.1);
    expect(session.collectWorkshopItem('rabbitArmor')).toBe(true);
    expect(session.equipment.rabbitArmor).toBe(1);

    expect(session.assignArmor(rabbit.id, 'rabbitArmor')).toBe(true);
    expect(rabbit.armorEquipped).toBe(true);
    expect(session.equipment.rabbitArmor).toBe(0);

    const stats = getCreatureStats(rabbit);
    expect(stats.damageReduction).toBeGreaterThan(0.12);
  });

  it('rejects assigning armor to the wrong species or already armored creatures', () => {
    session.purchaseCreature('rabbit');
    session.purchaseCreature('bull');
    session.update(3.1);

    const rabbit = session.ownedCreatures.find((c) => c.kind === 'rabbit')!;
    const bull = session.ownedCreatures.find((c) => c.kind === 'bull')!;

    session.equipment.rabbitArmor = 1;

    // Rabbit armor cannot be assigned to Bull
    expect(session.assignArmor(bull.id, 'rabbitArmor')).toBe(false);

    // Assign to rabbit
    expect(session.assignArmor(rabbit.id, 'rabbitArmor')).toBe(true);

    // Cannot re-assign to already armored rabbit
    session.equipment.rabbitArmor = 1;
    expect(session.assignArmor(rabbit.id, 'rabbitArmor')).toBe(false);
  });
});
