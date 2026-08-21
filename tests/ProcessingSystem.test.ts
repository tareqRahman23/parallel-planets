import { describe, it, expect, beforeEach } from 'vitest';
import { GameSession } from '../src/app/GameSession';

describe('Machines, Processing Queues & Crafting Armory', () => {
  let session: GameSession;

  beforeEach(() => {
    session = new GameSession();
  });

  it('enforces machine prerequisite chain: Spinnery -> Tailor, Drill -> Stone Forge -> Workshop', () => {
    session.addCoins(2000);

    // Cannot build Tailor without Spinnery
    expect(session.purchaseMachine('tailor')).toBe(false);

    // Build Spinnery
    expect(session.purchaseMachine('spinnery')).toBe(true);
    session.update(5.1); // Finish construction
    expect(session.machines.find((m) => m.kind === 'spinnery')?.status).toBe('idle');

    // Now Tailor can be purchased
    expect(session.purchaseMachine('tailor')).toBe(true);

    // Cannot build Workshop without Tailor & Forge
    expect(session.purchaseMachine('workshop')).toBe(false);
  });

  it('requires a click-triggered batch to process Fur into Thread', () => {
    session.addCoins(200);
    session.purchaseMachine('spinnery');
    session.update(5.1);

    const spinnery = session.machines.find((m) => m.kind === 'spinnery')!;
    session.addToInventory('fur', 2);

    // Refining machines do not consume inputs until the player clicks them.
    session.update(6.1);
    expect(session.fur).toBe(2);
    expect(session.thread).toBe(0);

    expect(session.queueMachineJob(spinnery.id)).toBe(true);
    session.update(6.1);
    expect(session.fur).toBe(0);
    expect(session.thread).toBe(1);
    expect(spinnery.outputTray).toHaveLength(0);
  });

  it('automatically deposits Mining Drill stone into the warehouse', () => {
    session.addCoins(200);
    expect(session.purchaseMachine('drill')).toBe(true);
    session.update(5.1);

    const drill = session.machines.find((m) => m.kind === 'drill')!;
    session.update(4.1);

    expect(session.stone).toBe(2);
    expect(drill.outputTray).toHaveLength(0);
    expect(drill.status).toBe('idle');
  });

  it('speeds up click-triggered production when a machine is upgraded', () => {
    session.addCoins(500);
    session.purchaseMachine('spinnery');
    session.update(5.1);
    const spinnery = session.machines.find((m) => m.kind === 'spinnery')!;

    expect(session.upgradeMachine(spinnery.id)).toBe(true);
    expect(spinnery.level).toBe(2);
    session.addToInventory('fur', 2);
    expect(session.queueMachineJob(spinnery.id)).toBe(true);
    session.update(4.6);

    expect(session.thread).toBe(1);
  });

  it('crafts Rabbit Armor and Orbital Support Powers in the Workshop', () => {
    // Unlock Workshop
    session.addCoins(2000);
    session.purchaseMachine('drill');
    session.purchaseMachine('spinnery');
    session.update(5.1);
    session.machines.find((m) => m.kind === 'drill')!.autoRunEnabled = false;
    session.purchaseMachine('tailor');
    session.purchaseMachine('stoneForge');
    session.update(5.1);
    session.purchaseMachine('workshop');
    session.update(5.1);

    // Craft Rabbit Armor: 10 Stone + 1 Fabric + 1 Tech Part
    session.addToInventory('stone', 10);
    session.addToInventory('fabric', 1);
    session.addToInventory('techParts', 1);

    expect(session.canQueueWorkshopRecipe('rabbitArmor')).toBe(true);
    expect(session.queueWorkshopRecipe('rabbitArmor')).toBe(true);
    expect(session.stone).toBe(0);
    expect(session.fabric).toBe(0);
    expect(session.techParts).toBe(0);

    // 8 seconds craft time
    session.update(8.1);
    expect(session.workshop.readyOutputs.length).toBe(1);
    expect(session.workshop.readyOutputs[0]).toBe('rabbitArmor');

    expect(session.collectWorkshopItem('rabbitArmor')).toBe(true);
    expect(session.equipment.rabbitArmor).toBe(1);
  });
});
