import { GameSession, PlacementTool } from '../app/GameSession';
import { GameEvents } from '../app/GameEvents';
import { AudioManager } from '../core/AudioManager';
import { GAME_CONFIG } from '../app/GameConfig';
import { SupplyOrderSystem } from '../systems/SupplyOrderSystem';

export class HUD {
  private session: GameSession;
  private audioManager: AudioManager;

  // DOM Elements
  private stoneValEl: HTMLElement | null;
  private furValEl: HTMLElement | null;
  private fertilizerValEl: HTMLElement | null;
  private threadValEl: HTMLElement | null;
  private fabricValEl: HTMLElement | null;
  private techPartsValEl: HTMLElement | null;

  private coinsValEl: HTMLElement | null;
  private warehouseCapacityTextEl: HTMLElement | null;
  private warehouseStatusTextEl: HTMLElement | null;
  private productionReadoutEl: HTMLElement | null;
  private upgradeWarehouseBtn: HTMLButtonElement | null;
  private fertilizerStockTextEl: HTMLElement | null;

  private buyRabbitBtn: HTMLButtonElement | null;
  private buyBullBtn: HTMLButtonElement | null;
  private toolCarrotBtn: HTMLButtonElement | null;
  private toolFertilizerBtn: HTMLButtonElement | null;

  private rabbitOwnedCountEl: HTMLElement | null;
  private bullOwnedCountEl: HTMLElement | null;
  private ordersContainerEl: HTMLElement | null;

  private raidWarningPanelEl: HTMLElement | null;
  private raidWarningTimerEl: HTMLElement | null;

  private invasionHudEl: HTMLElement | null;
  private invasionStarsTrackerEl: HTMLElement | null;
  private invasionBattleTimerEl: HTMLElement | null;
  private invasionLootTrackerEl: HTMLElement | null;
  private invasionTroopsCardsEl: HTMLElement | null;
  private invasionSupportCardEl: HTMLElement | null;
  private btnInvasionRetreat: HTMLElement | null;

  private milestoneBannerEl: HTMLElement | null;
  private milestoneIconEl: HTMLElement | null;
  private milestoneTextEl: HTMLElement | null;
  private audioBtnEl: HTMLElement | null;
  private audioIconEl: HTMLElement | null;
  private missionTimerEl: HTMLElement | null;

  private milestoneTimeout: number | null = null;
  private unsubscribeEvents: (() => void)[] = [];

  constructor(session: GameSession, audioManager: AudioManager) {
    this.session = session;
    this.audioManager = audioManager;

    this.stoneValEl = document.getElementById('stone-counter');
    this.furValEl = document.getElementById('fur-counter');
    this.fertilizerValEl = document.getElementById('fertilizer-counter');
    this.threadValEl = document.getElementById('thread-counter');
    this.fabricValEl = document.getElementById('fabric-counter');
    this.techPartsValEl = document.getElementById('tech-parts-counter');

    this.coinsValEl = document.getElementById('coins-counter');
    this.warehouseCapacityTextEl = document.getElementById('warehouse-capacity-text');
    this.warehouseStatusTextEl = document.getElementById('warehouse-status-text');
    this.productionReadoutEl = document.getElementById('production-readout');
    this.upgradeWarehouseBtn = document.getElementById('upgrade-warehouse-btn') as HTMLButtonElement;
    this.fertilizerStockTextEl = document.getElementById('fertilizer-stock-text');

    this.buyRabbitBtn = document.getElementById('buy-rabbit-btn') as HTMLButtonElement;
    this.buyBullBtn = document.getElementById('buy-bull-btn') as HTMLButtonElement;
    this.toolCarrotBtn = document.getElementById('tool-carrot-btn') as HTMLButtonElement;
    this.toolFertilizerBtn = document.getElementById('tool-fertilizer-btn') as HTMLButtonElement;

    this.rabbitOwnedCountEl = document.getElementById('rabbit-owned-count');
    this.bullOwnedCountEl = document.getElementById('bull-owned-count');
    this.ordersContainerEl = document.getElementById('orders-container');

    this.raidWarningPanelEl = document.getElementById('raid-warning-panel');
    this.raidWarningTimerEl = document.getElementById('raid-warning-timer');

    this.invasionHudEl = document.getElementById('invasion-hud');
    this.invasionStarsTrackerEl = document.getElementById('invasion-stars-tracker');
    this.invasionBattleTimerEl = document.getElementById('invasion-battle-timer');
    this.invasionLootTrackerEl = document.getElementById('invasion-loot-tracker');
    this.invasionTroopsCardsEl = document.getElementById('invasion-troops-cards');
    this.invasionSupportCardEl = document.getElementById('invasion-support-card');
    this.btnInvasionRetreat = document.getElementById('btn-invasion-retreat');

    this.milestoneBannerEl = document.getElementById('milestone-banner');
    this.milestoneIconEl = document.getElementById('milestone-icon');
    this.milestoneTextEl = document.getElementById('milestone-text');
    this.audioBtnEl = document.getElementById('audio-toggle-btn');
    this.audioIconEl = document.getElementById('audio-icon');
    this.missionTimerEl = document.getElementById('mission-timer-text');

    this.setupListeners();
    this.setupTopBarInputs();
    this.updateAll();
  }

  private setupTopBarInputs(): void {
    this.buyRabbitBtn?.addEventListener('click', () => {
      this.session.purchaseCreature('rabbit');
      this.updateEconomyAndPurchases();
    });

    this.buyBullBtn?.addEventListener('click', () => {
      this.session.purchaseCreature('bull');
      this.updateEconomyAndPurchases();
    });

    this.toolCarrotBtn?.addEventListener('click', () => {
      const current = this.session.home.activePlacementTool;
      GameEvents.emit('set-placement-tool', current === 'carrot' ? 'none' : 'carrot');
    });

    this.toolFertilizerBtn?.addEventListener('click', () => {
      const current = this.session.home.activePlacementTool;
      GameEvents.emit('set-placement-tool', current === 'fertilizer' ? 'none' : 'fertilizer');
    });

    this.upgradeWarehouseBtn?.addEventListener('click', () => {
      this.session.upgradeWarehouse();
      this.updateWarehouseDOM();
      this.updateEconomyAndPurchases();
    });

    document.getElementById('open-build-btn')?.addEventListener('click', () => {
      GameEvents.emit('open-build-modal');
    });

    document.getElementById('open-roster-btn')?.addEventListener('click', () => {
      GameEvents.emit('open-roster-modal');
    });

    document.getElementById('open-market-btn')?.addEventListener('click', () => {
      GameEvents.emit('open-market-modal');
    });

    this.btnInvasionRetreat?.addEventListener('click', () => {
      if (!this.session.invasion.timerStarted) {
        this.session.returnFromPreview();
        return;
      }
      if (confirm('Are you sure you want to retreat from invasion? (Knocked-out deployed units will be lost)')) {
        this.session.finalizeInvasionResult();
      }
    });
  }

  private setupListeners(): void {
    if (this.audioBtnEl) {
      this.audioBtnEl.onclick = () => {
        const isMuted = this.audioManager.toggleMute();
        if (this.audioIconEl) {
          this.audioIconEl.textContent = isMuted ? '🔇' : '🔊';
        }
      };
    }

    const unsubs = [
      GameEvents.on('stone-changed', () => this.updateResources()),
      GameEvents.on('fur-changed', () => this.updateResources()),
      GameEvents.on('fertilizer-changed', () => this.updateResources()),
      GameEvents.on('thread-changed', () => this.updateResources()),
      GameEvents.on('fabric-changed', () => this.updateResources()),
      GameEvents.on('techParts-changed', () => this.updateResources()),
      GameEvents.on('coins-changed', () => this.updateEconomyAndPurchases()),
      GameEvents.on('warehouse-upgraded', () => this.updateWarehouseDOM()),
      GameEvents.on('machine-built', () => this.updateProductionReadout()),
      GameEvents.on('machine-output-ready', () => this.updateProductionReadout()),
      GameEvents.on('machine-upgraded', () => this.updateProductionReadout()),
      GameEvents.on('machine-input-missing', () => this.showMilestone('This machine needs more input resources', '📦')),
      GameEvents.on('creature-purchased', () => this.updateEconomyAndPurchases()),
      GameEvents.on('creature-delivered', () => this.updateEconomyAndPurchases()),
      GameEvents.on('order-completed', () => this.updateEconomyAndPurchases()),
      GameEvents.on('order-expired', () => this.updateOrdersDOM()),
      GameEvents.on('order-replaced', () => this.updateOrdersDOM()),
      GameEvents.on('placement-tool-changed', (tool: PlacementTool) => this.updateToolButtons(tool)),
      GameEvents.on('mode-changed', () => this.updateModeHUD()),
      GameEvents.on('invasion-finalized', () => this.updateInvasionHUD()),
      GameEvents.on('star-earned', () => this.updateInvasionHUD()),
      GameEvents.on('depot-looted', () => this.updateInvasionHUD()),
      GameEvents.on('milestone-reached', (data: { title: string; icon?: string }) => {
        this.showMilestone(data.title, data.icon);
      }),
      GameEvents.on('session-reset', () => this.updateAll()),
    ];
    this.unsubscribeEvents.push(...unsubs);
  }

  public showMilestone(text: string, icon: string = '✨'): void {
    if (!this.milestoneBannerEl || !this.milestoneTextEl) return;

    if (this.milestoneIconEl) {
      this.milestoneIconEl.textContent = icon;
    }
    this.milestoneTextEl.textContent = text;
    this.milestoneBannerEl.classList.remove('hidden');

    if (this.milestoneTimeout) {
      clearTimeout(this.milestoneTimeout);
    }
    this.milestoneTimeout = window.setTimeout(() => {
      this.milestoneBannerEl?.classList.add('hidden');
      this.milestoneTimeout = null;
    }, 2800);
  }

  public updateToolButtons(tool: PlacementTool): void {
    this.toolCarrotBtn?.classList.toggle('active', tool === 'carrot');
    this.toolFertilizerBtn?.classList.toggle('active', tool === 'fertilizer');
  }

  public updateResources(): void {
    if (this.stoneValEl) this.stoneValEl.textContent = this.session.stone.toString();
    if (this.furValEl) this.furValEl.textContent = this.session.fur.toString();
    if (this.fertilizerValEl) this.fertilizerValEl.textContent = this.session.fertilizer.toString();
    if (this.threadValEl) this.threadValEl.textContent = this.session.thread.toString();
    if (this.fabricValEl) this.fabricValEl.textContent = this.session.fabric.toString();
    if (this.techPartsValEl) this.techPartsValEl.textContent = this.session.techParts.toString();

    if (this.fertilizerStockTextEl) {
      this.fertilizerStockTextEl.textContent = `x${this.session.fertilizer}`;
    }

    this.updateWarehouseDOM();
    this.updateOrdersDOM();
  }

  public updateWarehouseDOM(): void {
    const stored = this.session.totalStoredGoods;
    const cap = this.session.warehouseCapacity;
    const fillRatio = cap > 0 ? stored / cap : 0;
    if (this.warehouseCapacityTextEl) {
      this.warehouseCapacityTextEl.textContent = `${stored} / ${cap}`;
      if (fillRatio >= 1) {
        this.warehouseCapacityTextEl.style.color = '#e74c3c';
      } else if (fillRatio >= 0.8) {
        this.warehouseCapacityTextEl.style.color = '#d98700';
      } else {
        this.warehouseCapacityTextEl.style.color = '#238cd4';
      }
    }

    if (this.warehouseStatusTextEl) {
      const isFull = fillRatio >= 1;
      const isNearFull = fillRatio >= 0.8;
      this.warehouseStatusTextEl.textContent = isFull ? 'FULL — OUTPUT SPILLS' : isNearFull ? 'NEAR FULL' : 'READY';
      this.warehouseStatusTextEl.className = `warehouse-status${isFull ? ' is-full' : isNearFull ? ' is-near-full' : ''}`;
    }

    if (this.upgradeWarehouseBtn) {
      const lvl = this.session.economy.warehouseLevel;
      if (lvl >= 2) {
        this.upgradeWarehouseBtn.style.display = 'none';
      } else {
        this.upgradeWarehouseBtn.style.display = 'block';
        const cost = GAME_CONFIG.economy.warehouse.upgradeCosts[(lvl + 1) as 1 | 2];
        this.upgradeWarehouseBtn.disabled = this.session.coins < cost;
        this.upgradeWarehouseBtn.textContent = `+${cost}`;
        this.upgradeWarehouseBtn.title = `Upgrade Warehouse (+15 Capacity) - 🟡 ${cost} Coins`;
      }
    }
  }

  public updateEconomyAndPurchases(): void {
    if (this.coinsValEl) this.coinsValEl.textContent = this.session.coins.toString();

    const rabbitCount = this.session.ownedCreatures.filter((c) => c.kind === 'rabbit').length;
    const bullCount = this.session.ownedCreatures.filter((c) => c.kind === 'bull').length;

    if (this.rabbitOwnedCountEl) this.rabbitOwnedCountEl.textContent = rabbitCount.toString();
    if (this.bullOwnedCountEl) this.bullOwnedCountEl.textContent = bullCount.toString();

    const atCap = this.session.livingCreatureCount >= GAME_CONFIG.economy.populationCap;
    if (this.buyRabbitBtn) {
      this.buyRabbitBtn.disabled = this.session.coins < 50 || atCap;
    }
    if (this.buyBullBtn) {
      this.buyBullBtn.disabled = this.session.coins < 250 || atCap;
    }
    if (this.toolCarrotBtn) {
      this.toolCarrotBtn.disabled = this.session.coins < 3;
    }
    if (this.toolFertilizerBtn) {
      this.toolFertilizerBtn.disabled = this.session.fertilizer <= 0;
    }

    this.updateWarehouseDOM();
    this.updateOrdersDOM();
  }

  private updateProductionReadout(): void {
    if (!this.productionReadoutEl) return;

    const active = this.session.machines.filter((machine) =>
      machine.status === 'processing' && machine.activeJob && machine.kind !== 'workshop'
    );
    const built = this.session.machines.filter((machine) =>
      machine.status === 'idle' && machine.kind !== 'workshop'
    );

    if (active.length === 0) {
      const readyManualMachine = built.find((machine) => machine.kind !== 'drill' && this.session.canQueueMachineJob(machine.id));
      if (readyManualMachine) {
        const recipes: Record<string, string> = {
          spinnery: 'Click Spinnery: 2 Fur → 1 Thread',
          tailor: 'Click Tailor: 2 Thread → 1 Fabric',
          stoneForge: 'Click Stone Forge: 5 Stone → 1 Tech Part',
        };
        this.productionReadoutEl.textContent = recipes[readyManualMachine.kind] ?? 'Click a machine to start a batch';
        this.productionReadoutEl.classList.remove('is-running');
        return;
      }
      this.productionReadoutEl.textContent = built.length > 0
        ? `${built.length} line${built.length === 1 ? '' : 's'} standing by for materials`
        : 'No production lines online';
      this.productionReadoutEl.classList.remove('is-running');
      return;
    }

    const lead = active[0];
    const job = lead.activeJob!;
    const remaining = Math.max(0, Math.ceil(job.durationSeconds - job.elapsedSeconds));
    const output = job.outputKind === 'techPart' ? 'tech part' : job.outputKind;
    const names: Record<string, string> = { drill: 'Mining Drill', stoneForge: 'Stone Forge', spinnery: 'Spinnery', tailor: 'Tailor' };
    const extra = active.length > 1 ? ` +${active.length - 1} more` : '';
    this.productionReadoutEl.textContent = `${names[lead.kind] ?? lead.kind}: ${job.outputAmount} ${output} in ${remaining}s${extra}`;
    this.productionReadoutEl.classList.add('is-running');
  }

  public updateOrdersDOM(): void {
    if (!this.ordersContainerEl) return;

    if (this.session.mode !== 'home' && this.session.mode !== 'homeRaid') {
      this.ordersContainerEl.innerHTML = '';
      return;
    }

    const orders = this.session.orders.active;
    const streak = this.session.orders.streak;
    const multText = streak > 0 ? `<div class="streak-indicator">Streak x${SupplyOrderSystem.getStreakMultiplier(streak).toFixed(1)}</div>` : '';

    const cardsHTML = orders
      .map((order) => {
        const canDeliver = SupplyOrderSystem.canCompleteOrder(order, this.session.inventory);
        const reward = SupplyOrderSystem.calculateOrderReward(order, streak);
        const remaining = order.durationSeconds === Infinity ? 'Tutorial' : `${Math.max(0, Math.ceil(order.remainingSeconds))}s`;

        const reqsText = order.requirements
          .map((r) => {
            let icon = '🪨';
            if (r.resource === 'fur') icon = '🧶';
            if (r.resource === 'fertilizer') icon = '🌱';
            if (r.resource === 'thread') icon = '🧵';
            if (r.resource === 'fabric') icon = '📜';
            if (r.resource === 'techParts') icon = '⚙️';
            return `${icon} ${r.amount}`;
          })
          .join(' + ');

        if (order.status === 'expired') {
          return `
            <div class="order-card expired">
              <div class="order-header-row">
                <span>ORDER EXPIRED</span>
                <span class="order-timer">${Math.ceil(order.replacementTimer)}s</span>
              </div>
              <div class="order-reqs-row">${reqsText}</div>
            </div>
          `;
        }

        if (order.status === 'completed') {
          return `
            <div class="order-card" style="border-color: #27ae60;">
              <div class="order-header-row">
                <span style="color: #27ae60;">DELIVERED!</span>
                <span class="order-timer">${Math.ceil(order.replacementTimer)}s</span>
              </div>
              <div class="order-reqs-row">🟡 +${reward} Coins</div>
            </div>
          `;
        }

        return `
          <div class="order-card">
            <div class="order-header-row">
              <span>SUPPLY ORDER</span>
              <span class="order-timer">⏱️ ${remaining}</span>
            </div>
            <div class="order-reqs-row">${reqsText}</div>
            <div class="order-bottom-row">
              <span class="order-reward">🟡 ${reward}</span>
              <button class="btn-deliver-order" data-id="${order.id}" ${canDeliver ? '' : 'disabled'}>
                Deliver
              </button>
            </div>
          </div>
        `;
      })
      .join('');

    this.ordersContainerEl.innerHTML = multText + cardsHTML;

    this.ordersContainerEl.querySelectorAll('.btn-deliver-order').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).dataset.id!;
        this.session.completeOrder(id);
      });
    });
  }

  public updateModeHUD(): void {
    const isHome = this.session.mode === 'home' || this.session.mode === 'homeRaid';
    const isInvasion = this.session.mode === 'invasion' || this.session.mode === 'invasionPreview';

    const topBar = document.getElementById('top-purchase-bar');
    if (topBar) topBar.style.display = isHome ? 'grid' : 'none';

    const hudLayer = document.getElementById('hud');
    if (hudLayer) hudLayer.style.display = isHome ? 'grid' : 'none';

    if (this.invasionHudEl) {
      this.invasionHudEl.classList.toggle('hidden', !isInvasion);
    }

    if (isInvasion) {
      this.updateInvasionHUD();
    }
  }

  public updateInvasionHUD(): void {
    const inv = this.session.invasion;

    if (this.btnInvasionRetreat) {
      this.btnInvasionRetreat.textContent = inv.timerStarted ? '🏳️ RETREAT' : '↩ RETURN HOME';
    }

    // Stars Tracker
    if (this.invasionStarsTrackerEl) {
      const s1 = inv.stars.fiftyPercent ? '⭐' : '☆';
      const s2 = inv.stars.core ? '⭐' : '☆';
      const s3 = inv.stars.fullDestruction ? '⭐' : '☆';
      this.invasionStarsTrackerEl.innerHTML = `<span>${s1}${s2}${s3} ${inv.destructionPercent}% Destr</span>`;
    }

    // Battle Timer
    if (this.invasionBattleTimerEl) {
      const remaining = Math.ceil(inv.remainingSeconds);
      const m = Math.floor(remaining / 60);
      const s = remaining % 60;
      this.invasionBattleTimerEl.textContent = `⏱️ ${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    // Loot Tracker
    if (this.invasionLootTrackerEl) {
      this.invasionLootTrackerEl.innerHTML = `<span>🟡 ${inv.lootEscrow.coins} | 🪨 ${inv.lootEscrow.stone} | ⚙️ ${inv.lootEscrow.techParts}</span>`;
    }

    // Troop Deployment Cards
    if (this.invasionTroopsCardsEl) {
      const undeployed = this.session.ownedCreatures.filter((c) => c.invasionState === 'undeployed');
      const rabbits = undeployed.filter((c) => c.kind === 'rabbit');
      const bulls = undeployed.filter((c) => c.kind === 'bull');

      this.invasionTroopsCardsEl.innerHTML = `
        <button class="troop-deploy-card" data-kind="rabbit" ${rabbits.length > 0 ? '' : 'disabled'}>
          <span style="font-size: 22px;">🐰</span>
          <span>Deploy Rabbit (x${rabbits.length})</span>
        </button>
        <button class="troop-deploy-card" data-kind="bull" ${bulls.length > 0 ? '' : 'disabled'}>
          <span style="font-size: 22px;">🐂</span>
          <span>Deploy Bull (x${bulls.length})</span>
        </button>
      `;

      this.invasionTroopsCardsEl.querySelectorAll('.troop-deploy-card').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          const kind = (e.currentTarget as HTMLElement).dataset.kind as 'rabbit' | 'bull';
          this.invasionTroopsCardsEl?.querySelectorAll('.troop-deploy-card').forEach((b) => b.classList.remove('selected'));
          (e.currentTarget as HTMLElement).classList.add('selected');
          GameEvents.emit('select-deploy-troop', kind);
        });
      });
    }

    // Support Power Card
    if (this.invasionSupportCardEl) {
      const p = inv.selectedSupport;
      if (p === 'sword' || p === 'gun') {
        const icon = p === 'sword' ? '⚔️' : '🔫';
        const name = p === 'sword' ? 'Orbital Sword' : 'Orbital Gun';
        const charges = inv.supportChargesRemaining;
        const cd = Math.ceil(inv.supportCooldownRemainingSeconds);

        this.invasionSupportCardEl.innerHTML = `
          <button class="support-active-card" id="btn-active-support" ${charges > 0 && cd <= 0 ? '' : 'disabled'}>
            <span>${icon}</span>
            <span>${name} (${charges} Charges${cd > 0 ? ` - ${cd}s` : ''})</span>
          </button>
        `;

        document.getElementById('btn-active-support')?.addEventListener('click', () => {
          this.invasionSupportCardEl?.querySelector('.support-active-card')?.classList.toggle('selected');
          GameEvents.emit('select-support-power', p);
        });
      } else {
        this.invasionSupportCardEl.innerHTML = '';
      }
    }
  }

  public update(_delta: number): void {
    this.updateProductionReadout();
    if (this.missionTimerEl) {
      const elapsed = Math.floor(this.session.stats.missionTimerSeconds);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      this.missionTimerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Raid warning banner
    const raid = this.session.home.raid;
    if (this.raidWarningPanelEl && this.raidWarningTimerEl) {
      if (raid.phase === 'warning') {
        this.raidWarningPanelEl.classList.remove('hidden');
        this.raidWarningTimerEl.textContent = `${Math.ceil(raid.warningRemainingSeconds)}s`;
      } else if (raid.phase === 'active') {
        this.raidWarningPanelEl.classList.remove('hidden');
        this.raidWarningPanelEl.textContent = `🚨 ALIEN RAID ACTIVE 🚨`;
      } else {
        this.raidWarningPanelEl.classList.add('hidden');
      }
    }

    // Invasion HUD update
    if (this.session.mode === 'invasion' || this.session.mode === 'invasionPreview') {
      this.updateInvasionHUD();
    }
  }

  public updateAll(): void {
    this.updateResources();
    this.updateEconomyAndPurchases();
    this.updateModeHUD();
  }

  public dispose(): void {
    this.unsubscribeEvents.forEach((fn) => fn());
    this.unsubscribeEvents = [];
    if (this.milestoneTimeout) clearTimeout(this.milestoneTimeout);
  }
}
