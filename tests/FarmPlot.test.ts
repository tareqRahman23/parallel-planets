import { describe, it, expect, beforeEach } from 'vitest';
import { GameSession } from '../src/app/GameSession';

describe('Carrot Patch Lifecycle, Fertilization & Loose Products', () => {
  let session: GameSession;

  beforeEach(() => {
    session = new GameSession();
  });

  it('grows a carrot patch from green (3s) to mature with 3 food units', () => {
    const patch = session.placeCarrot([3, 0, 3]);
    expect(patch?.status).toBe('growing');
    expect(patch?.foodUnits).toBe(3);

    session.update(1.5);
    expect(session.home.carrotPatches[0].status).toBe('growing');

    session.update(1.6);
    expect(session.home.carrotPatches[0].status).toBe('mature');
  });

  it('halves remaining growth time and increases food units to 8 on fertilization', () => {
    const patch = session.placeCarrot([3, 0, 3])!;
    session.update(1.0); // 2.0s remaining

    session.addToInventory('fertilizer', 1);
    expect(session.applyFertilizer(patch.id)).toBe(true);

    const updatedPatch = session.home.carrotPatches[0];
    expect(updatedPatch.fertilized).toBe(true);
    expect(updatedPatch.foodUnits).toBe(8);

    // Remaining time was halved: should reach maturity within ~1.1s
    session.update(1.1);
    expect(session.home.carrotPatches[0].status).toBe('mature');
  });

  it('handles food consumption and patch depletion / wilt removal', () => {
    const patch = session.placeCarrot([3, 0, 3])!;
    session.update(3.1); // mature

    expect(session.reserveFoodUnit('creature_1', patch.id)).toBe(true);
    expect(session.consumeFoodUnit('creature_1', patch.id)).toBe(true);
    expect(session.home.carrotPatches[0].foodUnits).toBe(2);

    // Consume remaining 2 units
    session.consumeFoodUnit('creature_2', patch.id);
    session.consumeFoodUnit('creature_3', patch.id);

    expect(session.home.carrotPatches[0].status).toBe('depleted');

    // 0.6s wilt decay removes it from list
    session.update(0.7);
    expect(session.home.carrotPatches.length).toBe(0);
  });

  it('spawns loose products with distinct expiration lifetimes', () => {
    session.spawnLooseProduct('fur', [0, 0, 0]);
    session.spawnLooseProduct('fertilizer', [1, 0, 1]);

    expect(session.home.looseProducts.length).toBe(2);
    expect(session.home.looseProducts[0].lifetimeSeconds).toBe(40);
    expect(session.home.looseProducts[1].lifetimeSeconds).toBe(45);

    // Collect fur
    const furId = session.home.looseProducts[0].id;
    expect(session.collectProduct(furId)).not.toBeNull();
    expect(session.fur).toBe(1);
    expect(session.home.looseProducts.length).toBe(1);

    // Let fertilizer expire at 45.1s
    session.update(45.2);
    expect(session.home.looseProducts.length).toBe(0);
  });
});
