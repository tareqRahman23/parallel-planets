import { describe, it, expect, beforeEach } from 'vitest';
import { GameSession } from '../src/app/GameSession';

describe('GameSession State Machine & Implementation 2 Progression', () => {
  let session: GameSession;

  beforeEach(() => {
    session = new GameSession();
  });

  it('initializes with starting coins (100), warehouse L0 (20), empty inventory and home mode', () => {
    expect(session.coins).toBe(100);
    expect(session.warehouseCapacity).toBe(20);
    expect(session.stone).toBe(0);
    expect(session.fur).toBe(0);
    expect(session.fertilizer).toBe(0);
    expect(session.thread).toBe(0);
    expect(session.fabric).toBe(0);
    expect(session.techParts).toBe(0);
    expect(session.ownedCreatures.length).toBe(0);
    expect(session.isRocketRepaired).toBe(false);
    expect(session.mode).toBe('home');
  });

  it('enforces warehouse capacity limits on storing goods', () => {
    expect(session.warehouseCapacity).toBe(20);
    expect(session.addToInventory('stone', 15)).toBe(true);
    expect(session.totalStoredGoods).toBe(15);

    // Adding 10 more exceeds 20 capacity
    expect(session.addToInventory('stone', 10)).toBe(false);
    expect(session.stone).toBe(15);
  });

  it('upgrades warehouse from L0 (20) -> L1 (35) -> L2 (50)', () => {
    // L0 -> L1 is affordable from the opening economy.
    expect(session.upgradeWarehouse()).toBe(true);
    expect(session.warehouseCapacity).toBe(35);
    expect(session.coins).toBe(100 - 75);

    session.addCoins(200);

    // L1 -> L2
    expect(session.upgradeWarehouse()).toBe(true);
    expect(session.warehouseCapacity).toBe(50);

    // Cannot upgrade past L2
    expect(session.upgradeWarehouse()).toBe(false);
  });

  it('allows placing carrot patches for 3 coins on open ground and fertilizing them', () => {
    expect(session.canPlaceCarrot([3, 0, 3])).toBe(true);
    const patch = session.placeCarrot([3, 0, 3]);
    expect(patch).not.toBeNull();
    expect(session.coins).toBe(97);
    expect(patch?.foodUnits).toBe(3);
    expect(patch?.growthDurationSeconds).toBe(3);

    // Fast-forward growth
    session.update(3.2);
    expect(session.home.carrotPatches[0].status).toBe('mature');

    // Add fertilizer and apply to patch
    session.addToInventory('fertilizer', 1);
    expect(session.applyFertilizer(patch!.id)).toBe(true);
    expect(session.fertilizer).toBe(0);
    expect(session.home.carrotPatches[0].fertilized).toBe(true);
    expect(session.home.carrotPatches[0].foodUnits).toBe(8);
  });

  it('supports clickable stone nodes with 3 charges and 6s regeneration', () => {
    const node = session.home.stoneNodes[0];
    expect(node.charges).toBe(3);

    // Click 3 times with 0.36s cooldown between clicks
    expect(session.clickStoneNode(node.id)).toBe(true);
    session.update(0.36);
    expect(session.clickStoneNode(node.id)).toBe(true);
    session.update(0.36);
    expect(session.clickStoneNode(node.id)).toBe(true);
    expect(node.charges).toBe(0);
    expect(session.stone).toBe(3);

    // Cannot click with 0 charges
    expect(session.clickStoneNode(node.id)).toBe(false);

    // Wait 6 seconds for 1 charge regeneration
    session.update(6.1);
    expect(session.home.stoneNodes[0].charges).toBe(1);
  });
});
