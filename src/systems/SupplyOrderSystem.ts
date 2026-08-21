export type OrderResourceType = 'stone' | 'fur' | 'fertilizer' | 'thread' | 'fabric' | 'techParts';

export interface SupplyOrderRequirement {
  resource: OrderResourceType;
  amount: number;
}

export interface SupplyOrder {
  id: string;
  requirements: SupplyOrderRequirement[];
  baseRewardCoins: number;
  durationSeconds: number;
  remainingSeconds: number;
  status: 'active' | 'completed' | 'expired';
  replacementTimer: number; // 3s delay after completion or expiration
}

export interface UnlockedProducts {
  stone: boolean;
  fur: boolean;
  fertilizer: boolean;
  thread: boolean;
  fabric: boolean;
  techParts: boolean;
}

interface OrderTemplate {
  id: string;
  requirements: SupplyOrderRequirement[];
  baseRewardCoins: number;
  durationSeconds: number;
  requiredUnlocks: OrderResourceType[];
}

export const ORDER_TEMPLATES: OrderTemplate[] = [
  {
    id: 'order_stone_8',
    requirements: [{ resource: 'stone', amount: 8 }],
    baseRewardCoins: 35,
    durationSeconds: 75,
    requiredUnlocks: ['stone'],
  },
  {
    id: 'order_stone_12',
    requirements: [{ resource: 'stone', amount: 12 }],
    baseRewardCoins: 55,
    durationSeconds: 85,
    requiredUnlocks: ['stone'],
  },
  {
    id: 'order_fur_3',
    requirements: [{ resource: 'fur', amount: 3 }],
    baseRewardCoins: 30,
    durationSeconds: 70,
    requiredUnlocks: ['fur'],
  },
  {
    id: 'order_fur_5',
    requirements: [{ resource: 'fur', amount: 5 }],
    baseRewardCoins: 55,
    durationSeconds: 80,
    requiredUnlocks: ['fur'],
  },
  {
    id: 'order_fert_2',
    requirements: [{ resource: 'fertilizer', amount: 2 }],
    baseRewardCoins: 35,
    durationSeconds: 90,
    requiredUnlocks: ['fertilizer'],
  },
  {
    id: 'order_fur_stone_combo',
    requirements: [
      { resource: 'fur', amount: 2 },
      { resource: 'stone', amount: 5 },
    ],
    baseRewardCoins: 45,
    durationSeconds: 85,
    requiredUnlocks: ['fur', 'stone'],
  },
  {
    id: 'order_thread_2',
    requirements: [{ resource: 'thread', amount: 2 }],
    baseRewardCoins: 45,
    durationSeconds: 90,
    requiredUnlocks: ['thread'],
  },
  {
    id: 'order_thread_3',
    requirements: [{ resource: 'thread', amount: 3 }],
    baseRewardCoins: 75,
    durationSeconds: 100,
    requiredUnlocks: ['thread'],
  },
  {
    id: 'order_fabric_1',
    requirements: [{ resource: 'fabric', amount: 1 }],
    baseRewardCoins: 70,
    durationSeconds: 100,
    requiredUnlocks: ['fabric'],
  },
  {
    id: 'order_fabric_2',
    requirements: [{ resource: 'fabric', amount: 2 }],
    baseRewardCoins: 150,
    durationSeconds: 120,
    requiredUnlocks: ['fabric'],
  },
  {
    id: 'order_tech_1',
    requirements: [{ resource: 'techParts', amount: 1 }],
    baseRewardCoins: 55,
    durationSeconds: 95,
    requiredUnlocks: ['techParts'],
  },
  {
    id: 'order_tech_2',
    requirements: [{ resource: 'techParts', amount: 2 }],
    baseRewardCoins: 125,
    durationSeconds: 110,
    requiredUnlocks: ['techParts'],
  },
  {
    id: 'order_fabric_tech_combo',
    requirements: [
      { resource: 'fabric', amount: 1 },
      { resource: 'techParts', amount: 1 },
    ],
    baseRewardCoins: 140,
    durationSeconds: 120,
    requiredUnlocks: ['fabric', 'techParts'],
  },
  {
    id: 'order_fert_thread_combo',
    requirements: [
      { resource: 'fertilizer', amount: 2 },
      { resource: 'thread', amount: 2 },
    ],
    baseRewardCoins: 100,
    durationSeconds: 110,
    requiredUnlocks: ['fertilizer', 'thread'],
  },
];

let orderIdCounter = 0;

export class SupplyOrderSystem {
  public static getStreakMultiplier(consecutiveCompleted: number): number {
    if (consecutiveCompleted <= 0) return 1.0;
    if (consecutiveCompleted === 1) return 1.1;
    if (consecutiveCompleted === 2) return 1.2;
    return 1.3;
  }

  public static calculateOrderReward(order: SupplyOrder, streakBeforeCompletion: number): number {
    const mult = this.getStreakMultiplier(streakBeforeCompletion);
    return Math.floor(order.baseRewardCoins * mult);
  }

  public static canCompleteOrder(order: SupplyOrder, inventory: Record<OrderResourceType, number>): boolean {
    if (order.status !== 'active' || order.remainingSeconds <= 0) return false;
    for (const req of order.requirements) {
      if ((inventory[req.resource] || 0) < req.amount) {
        return false;
      }
    }
    return true;
  }

  public static generateOrder(
    existingTemplateIds: string[],
    unlocked: UnlockedProducts
  ): SupplyOrder {
    const eligible = ORDER_TEMPLATES.filter((t) => {
      return t.requiredUnlocks.every((res) => unlocked[res]);
    });

    let choices = eligible.filter((t) => !existingTemplateIds.includes(t.id));
    if (choices.length === 0) {
      choices = eligible.length > 0 ? eligible : [ORDER_TEMPLATES[0]];
    }

    const picked = choices[Math.floor(Math.random() * choices.length)] || ORDER_TEMPLATES[0];
    orderIdCounter++;

    return {
      id: `${picked.id}_${orderIdCounter}_${Date.now()}`,
      requirements: picked.requirements.map((r) => ({ ...r })),
      baseRewardCoins: picked.baseRewardCoins,
      durationSeconds: picked.durationSeconds,
      remainingSeconds: picked.durationSeconds,
      status: 'active',
      replacementTimer: 0,
    };
  }

  public static createTutorialOrder(): SupplyOrder {
    return {
      id: 'order_tutorial_1',
      requirements: [{ resource: 'stone', amount: 5 }],
      baseRewardCoins: 30,
      durationSeconds: Infinity,
      remainingSeconds: Infinity,
      status: 'active',
      replacementTimer: 0,
    };
  }

  public static createInitialOrders(unlocked: UnlockedProducts): SupplyOrder[] {
    const tutorialOrder = this.createTutorialOrder();
    const secondOrder = this.generateOrder(['order_tutorial'], unlocked);
    return [tutorialOrder, secondOrder];
  }
}
