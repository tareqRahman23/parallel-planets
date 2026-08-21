import { GAME_CONFIG } from '../app/GameConfig';

export type CreatureKind = 'rabbit' | 'bull';
export type GrowthStage = 1 | 2 | 3;
export type ArmorKind = 'rabbitArmor' | 'bullArmor';
export type HomeCreatureStatus = 'arriving' | 'active' | 'eating' | 'stunned' | 'selected' | 'recovering';
export type InvasionCreatureStatus = 'home' | 'undeployed' | 'deployed' | 'survived' | 'lost';

export interface OwnedCreature {
  id: string;
  kind: CreatureKind;
  name: string;
  carrotsEaten: number;
  armorEquipped: boolean;
  currentHealth: number;
  homeState: HomeCreatureStatus;
  invasionState: InvasionCreatureStatus;
  productionCounter: number;
  appetiteRemainingSeconds: number;
  recoveryRemainingSeconds: number;
  worldPosition?: [number, number, number];
  petCooldownRemainingSeconds?: number;
  pendingProduct: {
    kind: 'fur' | 'fertilizer';
    remainingSeconds: number;
    totalSeconds?: number;
  } | null;
}

export interface PendingCreatureDelivery {
  id: string;
  kind: CreatureKind;
  name: string;
  remainingSeconds: number;
}

export interface CreatureStats {
  maxHealth: number;
  damage: number;
  moveSpeed: number;
  attackRange: number;
  attackCooldown: number;
  damageReduction: number;
  weight: number;
  stageName: string;
}

const CREATURE_NAMES: Record<CreatureKind, string[]> = {
  rabbit: [
    'Pip', 'Bolt', 'Clover', 'Moss', 'Rook', 'Bramble', 
    'Thistle', 'Barley', 'Flint', 'Jasper', 'Ziggy', 'Sprout',
    'Dash', 'Pebble', 'Swift', 'Willow', 'Thumper', 'Acorn'
  ],
  bull: [
    'Brutus', 'Goliath', 'Rex', 'Taurus', 'Forge', 'Bison',
    'Orion', 'Titan', 'Rumble', 'Copper', 'Atlas', 'Colossus',
    'Vanguard', 'Tank', 'Granite', 'Thunder', 'Crag', 'Hammer'
  ],
};

let nameIndices: Record<CreatureKind, number> = {
  rabbit: 0,
  bull: 0,
};

export function generateCreatureName(kind: CreatureKind): string {
  const pool = CREATURE_NAMES[kind];
  const index = nameIndices[kind] % pool.length;
  nameIndices[kind]++;
  return pool[index];
}

export function getGrowthStage(kind: CreatureKind, carrotsEaten: number): GrowthStage {
  if (kind === 'rabbit') {
    if (carrotsEaten >= 5) return 3;
    if (carrotsEaten >= 2) return 2;
    return 1;
  } else {
    if (carrotsEaten >= 7) return 3;
    if (carrotsEaten >= 3) return 2;
    return 1;
  }
}

export function getGrowthStageName(kind: CreatureKind, stage: GrowthStage): string {
  return (GAME_CONFIG.creatures[kind].stages[stage] as any).name;
}

export function getNextCarrotThreshold(kind: CreatureKind, stage: GrowthStage): number | null {
  if (stage === 1) return kind === 'rabbit' ? 2 : 3;
  if (stage === 2) return kind === 'rabbit' ? 5 : 7;
  return null; // Max stage
}

export function getCreatureStats(creature: {
  kind: CreatureKind;
  carrotsEaten?: number;
  growthStage?: GrowthStage;
  armorEquipped?: boolean;
}): CreatureStats {
  const stage = creature.growthStage ?? (creature.carrotsEaten !== undefined ? getGrowthStage(creature.kind, creature.carrotsEaten) : 1);
  const config = GAME_CONFIG.creatures[creature.kind];
  const stageConfig = (config.stages[stage] as any);
  
  let maxHealth = stageConfig.health;
  let damage = stageConfig.damage;
  let moveSpeed = stageConfig.moveSpeed;
  let attackRange = config.combat.attackRange;
  let attackCooldown = config.combat.attackCooldown;
  
  let damageMultiplier = 1.0;
  if (creature.kind === 'bull') {
    damageMultiplier *= (1.0 - GAME_CONFIG.creatures.bull.combat.innateDamageReduction); // 0.8
  }

  if (creature.armorEquipped) {
    if (creature.kind === 'rabbit') {
      const armorConfig = GAME_CONFIG.creatures.rabbit.armorBonus;
      maxHealth += armorConfig.health;
      damage += armorConfig.damage;
      damageMultiplier *= (1.0 - armorConfig.damageReduction); // 0.85
    } else {
      const armorConfig = GAME_CONFIG.creatures.bull.armorBonus;
      maxHealth += armorConfig.health;
      damage += armorConfig.damage;
      damageMultiplier *= (1.0 - armorConfig.additionalDamageReduction); // 0.9 (yielding 0.8 * 0.9 = 0.72)
    }
  }

  const damageReduction = 1.0 - damageMultiplier;

  return {
    maxHealth,
    damage,
    moveSpeed,
    attackRange,
    attackCooldown,
    damageReduction,
    weight: config.weight,
    stageName: stageConfig.name,
  };
}
