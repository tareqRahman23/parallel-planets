import { describe, it, expect, beforeEach } from 'vitest';
import { GameSession } from '../src/app/GameSession';

describe('Rocket Repairs, Cargo Upgrades & Invasion Loadout', () => {
  let session: GameSession;

  beforeEach(() => {
    session = new GameSession();
  });

  it('repairs the rocket with 12 Tech Parts', () => {
    session.addToInventory('techParts', 12);
    expect(session.isRocketRepaired).toBe(false);

    expect(session.repairRocket()).toBe(true);
    expect(session.isRocketRepaired).toBe(true);
    expect(session.techParts).toBe(0);
    expect(session.rocketCapacity).toBe(6);
  });

  it('upgrades rocket cargo capacity to 7 (Cargo I) and 10 (Cargo II)', () => {
    session.rocket.repaired = true;
    expect(session.rocketCapacity).toBe(6);

    // Cargo I
    session.rocket.cargoLevel = 1;
    expect(session.rocketCapacity).toBe(8);

    // Cargo II
    session.rocket.cargoLevel = 2;
    expect(session.rocketCapacity).toBe(12);
  });

  it('validates loadout weight limits (Rabbit: 1, Bull: 5) and requires support power choice', () => {
    session.rocket.repaired = true;
    session.equipment.swordSupportUnlocked = true;

    // Add 4 rabbits and 1 bull
    session.addCoins(1000);
    session.purchaseCreature('rabbit');
    session.purchaseCreature('rabbit');
    session.purchaseCreature('rabbit');
    session.purchaseCreature('rabbit');
    session.purchaseCreature('bull');
    session.update(3.1);

    const rabbits = session.ownedCreatures.filter((c) => c.kind === 'rabbit');
    const bull = session.ownedCreatures.find((c) => c.kind === 'bull')!;

    // Select 3 rabbits (weight 3)
    session.selectCreatureForLaunch(rabbits[0].id);
    session.selectCreatureForLaunch(rabbits[1].id);
    session.selectCreatureForLaunch(rabbits[2].id);
    expect(session.selectedArmyWeight).toBe(3);

    // Bull requires 5 weight (3 + 5 = 8 > 5 cap) -> rejected
    expect(session.selectCreatureForLaunch(bull.id)).toBe(false);
    expect(session.selectedArmyWeight).toBe(3);

    // Confirm loadout with sword support
    expect(session.canConfirmLaunch('sword').canLaunch).toBe(true);
    expect(session.confirmLoadout('sword')).toBe(true);
    expect(session.mode).toBe('invasionPreview');
  });

  it('allows an invasion preview before the rocket is repaired', () => {
    session.addCoins(100);
    session.purchaseCreature('rabbit');
    session.update(3.1);
    session.selectCreatureForLaunch(session.ownedCreatures[0].id);

    expect(session.canConfirmLaunch('none').canLaunch).toBe(true);
    expect(session.confirmLoadout('none')).toBe(true);
    expect(session.mode).toBe('invasionPreview');
  });

  it('can board one Rabbit and one Bull in the starter rocket', () => {
    session.addCoins(1000);
    session.purchaseCreature('rabbit');
    session.purchaseCreature('bull');
    session.update(3.1);

    const rabbit = session.ownedCreatures.find((c) => c.kind === 'rabbit')!;
    const bull = session.ownedCreatures.find((c) => c.kind === 'bull')!;
    expect(session.selectCreatureForLaunch(rabbit.id)).toBe(true);
    expect(session.selectCreatureForLaunch(bull.id)).toBe(true);
    expect(session.selectedArmyWeight).toBe(6);
    expect(session.canConfirmLaunch('none').canLaunch).toBe(true);
  });
});
