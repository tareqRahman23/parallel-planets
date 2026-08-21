import { describe, it, expect, beforeEach } from 'vitest';
import { GameSession } from '../src/app/GameSession';

describe('Home Defense Stations & Raid Caging Mechanics', () => {
  let session: GameSession;

  beforeEach(() => {
    session = new GameSession();
    session.addCoins(2000);
  });

  it('purchases and activates Pulse Turret on def_pad_1', () => {
    expect(session.purchaseDefense('pulseTurret', 'def_pad_1')).toBe(true);
    const turret = session.defenses.find((d) => d.padId === 'def_pad_1')!;
    expect(turret.status).toBe('constructing');

    session.update(5.1); // Construction finishes
    expect(turret.status).toBe('active');
    expect(turret.health).toBe(220);
  });

  it('triggers alien raid and handles manual caging with 4 clicks', () => {
    // Unlock and trigger raid
    session.purchaseMachine('drill');
    session.update(5.1);

    // Fast forward to first raid
    session.home.raid.secondsUntilSpawn = 0.1;
    session.update(0.2); // enters warning
    expect(session.home.raid.phase).toBe('warning');

    session.update(15.1); // enters active raid
    expect(session.home.raid.phase).toBe('active');
    expect(session.home.raid.raiders.length).toBeGreaterThan(0);

    const raider = session.home.raid.raiders[0];
    expect(raider.cageSegments).toBe(0);
    expect(raider.isStunned).toBe(false);

    // Click 1
    expect(session.cageRaider(raider.id)).toBe(true);
    expect(raider.cageSegments).toBe(1);

    // Click 2, 3, 4 with cooldown pacing (0.26s)
    session.update(0.26);
    expect(session.cageRaider(raider.id)).toBe(true);
    session.update(0.26);
    expect(session.cageRaider(raider.id)).toBe(true);
    session.update(0.26);
    expect(session.cageRaider(raider.id)).toBe(true);

    expect(raider.cageSegments).toBe(0); // resets on stun
    expect(raider.isStunned).toBe(true);
    expect(raider.stunTimer).toBe(4.0);
  });

  it('decays cage segments after 2 seconds without clicking', () => {
    session.purchaseMachine('drill');
    session.update(5.1);
    session.home.raid.secondsUntilSpawn = 0.1;
    session.update(0.2); // warning
    session.update(15.1); // active raid

    const raider = session.home.raid.raiders[0];
    expect(session.cageRaider(raider.id)).toBe(true);
    expect(raider.cageSegments).toBe(1);

    // Wait 2.1s without clicking
    session.update(2.1);
    expect(raider.cageSegments).toBe(0);
  });
});
