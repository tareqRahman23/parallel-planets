import { GameSession } from '../app/GameSession';
import { GameEvents } from '../app/GameEvents';
import { getCreatureStats, getGrowthStage } from '../creatures/CreatureData';

export class DeploymentModal {
  private session: GameSession;
  private modalEl: HTMLElement | null = null;
  private listEl: HTMLElement | null = null;
  private capacityBarEl: HTMLElement | null = null;
  private supportSelection: 'sword' | 'gun' | 'none' | null = null;

  constructor(session: GameSession) {
    this.session = session;
    this.createModalDOM();
    this.setupListeners();
  }

  private createModalDOM(): void {
    let modal = document.getElementById('deployment-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'deployment-modal';
      modal.className = 'modal-overlay hidden';
      modal.innerHTML = `
        <div class="modal-card deployment-card">
          <div class="modal-header">
            <div class="badge-title">INVASION FORCE PREPARATION</div>
            <h2 class="modal-title">ROCKET ARMY LOADOUT</h2>
            <button class="modal-close-btn" id="deployment-close-btn">✕</button>
          </div>
          
          <div class="deployment-capacity-container">
            <div class="capacity-labels">
              <span>CARGO CAPACITY</span>
              <span id="deployment-capacity-text">0 / 5 Weight Units</span>
            </div>
            <div class="capacity-bar-track">
              <div class="capacity-bar-fill" id="deployment-capacity-fill" style="width: 0%"></div>
            </div>
          </div>

          <!-- Support Power Selection -->
          <div class="support-selection-container">
            <div class="section-title">ORBITAL SUPPORT POWER (SELECT ONE)</div>
            <div class="support-options-row">
              <button class="support-choice-btn" data-power="sword" id="support-btn-sword">
                <span class="power-icon">⚔️</span>
                <div class="power-info">
                  <div class="power-name">Orbital Sword</div>
                  <div class="power-desc">2 Charges | Line Area Damage (170/240)</div>
                </div>
              </button>

              <button class="support-choice-btn" data-power="gun" id="support-btn-gun">
                <span class="power-icon">🔫</span>
                <div class="power-info">
                  <div class="power-name">Orbital Gun</div>
                  <div class="power-desc">3 Charges | Precision Target Burst (260/80)</div>
                </div>
              </button>

              <button class="support-choice-btn" data-power="none" id="support-btn-none">
                <span class="power-icon">🚫</span>
                <div class="power-info">
                  <div class="power-name">No Support</div>
                  <div class="power-desc">Deploy without orbital power</div>
                </div>
              </button>
            </div>
          </div>

          <div class="deployment-presets-row">
            <button class="preset-btn" id="preset-best-rabbits">Preset: Best Rabbits</button>
            <button class="preset-btn" id="preset-strongest-bull">Preset: Strongest Bull</button>
            <button class="preset-btn btn-secondary" id="preset-clear">Clear Selection</button>
          </div>

          <div class="deployment-creatures-list" id="deployment-list"></div>

          <div class="deployment-footer">
            <div class="deployment-summary" id="deployment-summary-text">Select your army & support power</div>
            <button class="primary-btn btn-shine" id="btn-confirm-launch">
              <span>CONFIRM LOADOUT & PREVIEW INVASION</span>
            </button>
          </div>
        </div>
      `;
      document.getElementById('app-container')?.appendChild(modal);
    }
    this.modalEl = modal;
    this.listEl = document.getElementById('deployment-list');
    this.capacityBarEl = document.getElementById('deployment-capacity-fill');

    document.getElementById('deployment-close-btn')?.addEventListener('click', () => this.hide());
    document.getElementById('preset-best-rabbits')?.addEventListener('click', () => {
      this.selectPreset('best_rabbits');
      this.render();
    });
    document.getElementById('preset-strongest-bull')?.addEventListener('click', () => {
      this.selectPreset('strongest_bull');
      this.render();
    });
    document.getElementById('preset-clear')?.addEventListener('click', () => {
      this.session.clearArmySelection();
      this.render();
    });

    // Support button choices
    this.modalEl.querySelectorAll('.support-choice-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const power = (e.currentTarget as HTMLElement).dataset.power as 'sword' | 'gun' | 'none';
        this.supportSelection = power;
        this.render();
      });
    });

    document.getElementById('btn-confirm-launch')?.addEventListener('click', () => {
      if (this.supportSelection === null) {
        alert('Please choose a support power option (Orbital Sword, Orbital Gun, or No Support).');
        return;
      }
      if (this.session.confirmLoadout(this.supportSelection)) {
        this.hide();
      }
    });
  }

  private setupListeners(): void {
    GameEvents.on('open-deployment-modal', () => this.show());
    GameEvents.on('army-selection-changed', () => this.render());

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.modalEl?.classList.contains('hidden')) {
        this.hide();
      }
    });
  }

  public show(): void {
    if (this.session.mode !== 'home' || this.session.home.raid.phase === 'warning' || this.session.home.raid.phase === 'active') {
      return;
    }
    this.supportSelection = null;
    this.session.setMode('loadout');
    this.render();
    this.modalEl?.classList.remove('hidden');
  }

  public hide(): void {
    this.modalEl?.classList.add('hidden');
    if (this.session.mode === 'loadout') {
      this.session.setMode('home');
    }
  }

  private selectPreset(preset: 'best_rabbits' | 'strongest_bull'): void {
    this.session.clearArmySelection();
    if (preset === 'best_rabbits') {
      const rabbits = this.session.ownedCreatures
        .filter((c) => c.kind === 'rabbit' && c.homeState !== 'recovering')
        .sort((a, b) => b.carrotsEaten - a.carrotsEaten);
      for (const r of rabbits) {
        if (this.session.selectedArmyWeight + 1 <= this.session.rocketCapacity) {
          this.session.selectCreatureForLaunch(r.id);
        }
      }
    } else if (preset === 'strongest_bull') {
      const bulls = this.session.ownedCreatures
        .filter((c) => c.kind === 'bull' && c.homeState !== 'recovering')
        .sort((a, b) => b.carrotsEaten - a.carrotsEaten);
      for (const b of bulls) {
        if (this.session.selectedArmyWeight + 5 <= this.session.rocketCapacity) {
          this.session.selectCreatureForLaunch(b.id);
        }
      }
    }
  }

  public render(): void {
    if (!this.listEl || !this.capacityBarEl) return;

    const owned = this.session.ownedCreatures;
    const selectedIds = this.session.selectedCreatureIds;
    const weight = this.session.selectedArmyWeight;
    const maxCapacity = this.session.rocketCapacity;

    // Capacity Bar
    const capText = document.getElementById('deployment-capacity-text');
    if (capText) capText.textContent = `${weight} / ${maxCapacity} Weight Units`;
    const pct = Math.min(100, (weight / maxCapacity) * 100);
    this.capacityBarEl.style.width = `${pct}%`;
    this.capacityBarEl.style.backgroundColor = pct >= 100 ? '#e74c3c' : '#3fa7d6';

    // Support Buttons styling
    const eq = this.session.equipment;
    const swordBtn = document.getElementById('support-btn-sword') as HTMLButtonElement;
    const gunBtn = document.getElementById('support-btn-gun') as HTMLButtonElement;
    const noneBtn = document.getElementById('support-btn-none') as HTMLButtonElement;

    if (swordBtn) {
      swordBtn.disabled = !eq.swordSupportUnlocked;
      swordBtn.classList.toggle('selected', this.supportSelection === 'sword');
      if (!eq.swordSupportUnlocked) swordBtn.title = 'Unlock by crafting Orbital Sword at Workshop';
    }
    if (gunBtn) {
      gunBtn.disabled = !eq.gunSupportUnlocked;
      gunBtn.classList.toggle('selected', this.supportSelection === 'gun');
      if (!eq.gunSupportUnlocked) gunBtn.title = 'Unlock by crafting Orbital Gun at Workshop';
    }
    if (noneBtn) {
      noneBtn.classList.toggle('selected', this.supportSelection === 'none');
    }

    // Creature List
    if (owned.length === 0) {
      this.listEl.innerHTML = `
        <div class="roster-empty-state">
          <p>No creatures available. Buy Rabbits (50 Coins) or Bulls (250 Coins) from the top menu first!</p>
        </div>
      `;
      return;
    }

    this.listEl.innerHTML = owned
      .map((creature) => {
        const stats = getCreatureStats(creature);
        const stage = getGrowthStage(creature.kind, creature.carrotsEaten);
        const isSelected = this.session.selectedCreatureIds.includes(creature.id);
        const canAdd = isSelected || weight + stats.weight <= maxCapacity;
        const isRecovering = creature.homeState === 'recovering';

        return `
          <div class="deployment-creature-item ${isSelected ? 'selected' : ''} ${canAdd && !isRecovering ? '' : 'disabled'}">
            <div class="creature-avatar">${creature.kind === 'rabbit' ? '🐰' : '🐂'}</div>
            <div class="creature-details">
              <div class="creature-header-row">
                <span class="creature-name">${creature.name}</span>
                <span class="creature-stage-badge">Stage ${stage}: ${stats.stageName}</span>
                <span class="creature-weight-tag">${stats.weight} Weight</span>
              </div>
              <div class="creature-stats-row">
                <span>❤️ ${Math.ceil(creature.currentHealth)}/${stats.maxHealth} HP</span>
                <span>⚔️ ${stats.damage} Dmg</span>
                <span>🛡️ ${(stats.damageReduction * 100).toFixed(0)}% Def</span>
                ${creature.armorEquipped ? '<span class="badge-armored">🛡️ Armored</span>' : ''}
                ${isRecovering ? `<span class="badge-recovering" style="color: #e67e22;">⏳ Recovering (${Math.ceil(creature.recoveryRemainingSeconds)}s)</span>` : ''}
              </div>
            </div>
            <button class="btn-toggle-deployment ${isSelected ? 'btn-remove' : 'btn-select'}" data-id="${creature.id}" ${canAdd && !isRecovering ? '' : 'disabled'}>
              ${isSelected ? 'Remove from Rocket' : 'Board Rocket'}
            </button>
          </div>
        `;
      })
      .join('');

    this.listEl.querySelectorAll('.btn-toggle-deployment').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).dataset.id!;
        this.session.selectCreatureForLaunch(id);
        this.render();
      });
    });

    // Summary Text
    const summaryEl = document.getElementById('deployment-summary-text');
    if (summaryEl) {
      const selectedCreatures = this.session.ownedCreatures.filter((c) => selectedIds.includes(c.id));
      const rCount = selectedCreatures.filter((c) => c.kind === 'rabbit').length;
      const bCount = selectedCreatures.filter((c) => c.kind === 'bull').length;
      const armCount = selectedCreatures.filter((c) => c.armorEquipped).length;
      summaryEl.textContent = `Selected: ${selectedCreatures.length} Units (${rCount}R / ${bCount}B, ${armCount} Armored) | Support: ${this.supportSelection ? this.supportSelection.toUpperCase() : 'None'}`;
    }
  }
}
