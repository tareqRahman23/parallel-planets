import { describe, it, expect, beforeEach } from 'vitest';
import { GameSession } from '../src/app/GameSession';
import { SupplyOrderSystem } from '../src/systems/SupplyOrderSystem';

describe('Supply Orders & Economy System', () => {
  let session: GameSession;

  beforeEach(() => {
    session = new GameSession();
  });

  it('starts with a tutorial stone order and an unfulfilled order', () => {
    const orders = session.orders.active;
    expect(orders.length).toBe(2);
    expect(orders[0].id).toBe('order_tutorial_1');
    expect(orders[0].requirements[0]).toEqual({ resource: 'stone', amount: 5 });
    expect(orders[0].durationSeconds).toBe(Infinity);
  });

  it('completes the tutorial order and awards coins and streak bonus', () => {
    session.addToInventory('stone', 5);
    expect(session.completeOrder('order_tutorial_1')).toBe(true);
    expect(session.stone).toBe(0);
    expect(session.coins).toBe(130); // 100 + 30
    expect(session.orders.streak).toBe(1);
  });

  it('calculates progressive streak multipliers correctly', () => {
    expect(SupplyOrderSystem.getStreakMultiplier(0)).toBe(1.0);
    expect(SupplyOrderSystem.getStreakMultiplier(1)).toBe(1.1);
    expect(SupplyOrderSystem.getStreakMultiplier(2)).toBe(1.2);
    expect(SupplyOrderSystem.getStreakMultiplier(3)).toBe(1.3);
    expect(SupplyOrderSystem.getStreakMultiplier(5)).toBe(1.3); // Max 1.3x cap
  });

  it('supports emergency quick sales to the market at fixed lower rates', () => {
    session.addToInventory('stone', 4);
    session.addToInventory('fur', 2);

    // 4 stone at 2 coins each = 8 coins
    expect(session.sellToMarket('stone', 4)).toBe(true);
    expect(session.coins).toBe(108);
    expect(session.stone).toBe(0);

    // 2 fur at 6 coins each = 12 coins
    expect(session.sellToMarket('fur', 2)).toBe(true);
    expect(session.coins).toBe(120);
    expect(session.fur).toBe(0);
  });
});
