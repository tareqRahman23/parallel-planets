import { GameSession } from '../app/GameSession';

export class ObjectiveSystem {
  public static getObjectiveText(session: GameSession, enemiesRemaining: number = 8): string {
    const { mode } = session;

    const steps = [
      {
        id: 'gather-stone',
        title: 'COMMERCE',
        description: 'Mine Stone from rock nodes and deliver the tutorial order for 30 Coins.',
        checkCompleted: () => session.orders.completedCount > 0,
      },
      {
        id: 'plant-carrot',
        title: 'NUTRITION',
        description: 'Spend 3 Coins to place a Carrot Patch on the green terrain.',
        checkCompleted: () => session.home.carrotPatches.length > 0 || session.ownedCreatures.some((c) => c.carrotsEaten > 0),
      },
      {
        id: 'buy-rabbit',
        title: 'COLONY',
        description: 'Purchase a Rabbit (50 Coins) or Bull (250 Coins) from the top bar.',
        checkCompleted: () => session.livingCreatureCount > 0,
      },
      {
        id: 'collect-fur',
        title: 'PRODUCTION',
        description: 'Feed a Rabbit with Carrots. Its Fur can feed an automated Spinnery.',
        checkCompleted: () => session.stats.totalFurHarvested > 0 || session.stats.totalFertilizerProduced > 0,
      },
      {
        id: 'build-machines',
        title: 'INDUSTRY',
        description: 'Open the BUILD menu to construct the Spinnery (150) or Mining Drill (120).',
        checkCompleted: () => session.machines.some((m) => m.status !== 'unbuilt'),
      },
      {
        id: 'workshop-armory',
        title: 'ARMORY',
        description: 'Build the Workshop to craft Creature Armor and Orbital Support powers.',
        checkCompleted: () => session.equipment.rabbitArmor > 0 || session.equipment.bullArmor > 0 || session.equipment.swordSupportUnlocked || session.equipment.gunSupportUnlocked,
      },
      {
        id: 'repair-rocket',
        title: 'AEROSPACE',
        description: 'Craft Rocket Spaceframe Repair (12 Tech Parts) at the Workshop.',
        checkCompleted: () => session.isRocketRepaired,
      },
      {
        id: 'loadout-army',
        title: 'DEPLOYMENT',
        description: 'Click the Rocket to select your army and orbital support power.',
        checkCompleted: () => session.selectedCreatureIds.length > 0 || mode === 'invasionPreview' || mode === 'invasion',
      },
      {
        id: 'invade',
        title: 'INVASION',
        description: 'Deploy your troops along the perimeter and destroy the Enemy Core!',
        checkCompleted: () => session.stats.campaignVictoryAchieved,
      },
    ];

    if (mode === 'home' || mode === 'homeRaid') {
      if (mode === 'homeRaid') {
        return '🚨 ALIEN RAID: Click raiders 4 times to cage them! Defend machines and warehouse.';
      }
      const nextStep = steps.find((s) => !s.checkCompleted());
      return nextStep ? `${nextStep.title}: ${nextStep.description}` : 'Ready for Invasion: Click Rocket to Launch';
    }

    if (mode === 'invasionPreview') {
      return 'PREVIEW: Inspect base & defense ranges. Click troop card to start deployment!';
    }

    if (mode === 'invasion') {
      if (enemiesRemaining > 0) {
        return `INVASION: Autonomous combat in progress (${enemiesRemaining} key targets remaining)`;
      }
      return 'VICTORY: Enemy base dismantled!';
    }

    if (mode === 'invasionResult') {
      return 'Invasion Concluded: Review results and return home.';
    }

    return 'Parallel Planets: Implementation 2';
  }
}
