import { GameSession } from '../app/GameSession';
import { GameEvents } from '../app/GameEvents';
import { getCreatureStats, getGrowthStage, getNextCarrotThreshold } from '../creatures/CreatureData';

export class RosterModal {
  private session: GameSession;
  private modalEl: HTMLElement | null = null;
  private listEl: HTMLElement | null = null;

  constructor(session: GameSession) {
    this.session = session;
    this.createModalDOM();
    this.setupListeners();
  }

  private createModalDOM(): void {
    let modal = document.getElementById('roster-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'roster-modal';
      modal.className = 'modal-overlay hidden';
      modal.innerHTML = `
        <div class="modal-card roster-card">
          <div class="modal-header">
            <div class="badge-title">COLONY COMPANIONS</div>
            <h2 class="modal-title">CREATURE ROSTER & ARMORY</h2>
            <button class="modal-close-btn" id="roster-close-btn">✕</button>
          </div>
          <div class="roster-equipment-bar" id="roster-equipment-bar"></div>
          <div class="roster-creatures-list" id="roster-creatures-list"></div>
        </div>
      `;
      document.getElementById('app-container')?.appendChild(modal);
    }
    this.modalEl = modal;
    this.listEl = document.getElementById('roster-creatures-list');

    document.getElementById('roster-close-btn')?.addEventListener('click', () => this.hide());
  }

  private setupListeners(): void {
    GameEvents.on('open-roster-modal', () => this.show());
    GameEvents.on('creature-delivered', () => this.render());
    GameEvents.on('creature-fed', () => this.render());
    GameEvents.on('creature-growth', () => this.render());
    GameEvents.on('armor-assigned', () => this.render());

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.modalEl?.classList.contains('hidden')) {
        this.hide();
      }
    });
  }

  public show(): void {
    this.render();
    this.modalEl?.classList.remove('hidden');
  }

  public hide(): void {
    this.modalEl?.classList.add('hidden');
  }

  public render(): void {
    if (!this.listEl) return;

    const owned = this.session.ownedCreatures;
    const eq = this.session.equipment;

    // Equipment stock bar
    const eqBar = document.getElementById('roster-equipment-bar');
    if (eqBar) {
      eqBar.innerHTML = `
        <div class="eq-stock-item">
          <span>🐰 Rabbit Armor in Stock: <strong>${eq.rabbitArmor}</strong></span>
        </div>
        <div class="eq-stock-item">
          <span>🐂 Bull Armor in Stock: <strong>${eq.bullArmor}</strong></span>
        </div>
      `;
    }

    if (owned.length === 0) {
      this.listEl.innerHTML = `
        <div class="roster-empty-state">
          <p>No creatures currently owned. Purchase Rabbits (50 Coins) or Bulls (250 Coins) from the top bar to raise an army!</p>
        </div>
      `;
      return;
    }

    this.listEl.innerHTML = owned
      .map((creature) => {
        const stats = getCreatureStats(creature);
        const stage = getGrowthStage(creature.kind, creature.carrotsEaten);
        const nextThreshold = getNextCarrotThreshold(creature.kind, stage);
        const progressText = nextThreshold !== null ? `${creature.carrotsEaten} / ${nextThreshold} Carrots to next Stage` : 'Max Stage Reached';

        const canEquipArmor = !creature.armorEquipped && (creature.kind === 'rabbit' ? eq.rabbitArmor > 0 : eq.bullArmor > 0);
        const isRecovering = creature.homeState === 'recovering';

        return `
          <div class="roster-creature-card">
            <div class="roster-avatar">${creature.kind === 'rabbit' ? '🐰' : '🐂'}</div>
            <div class="roster-info">
              <div class="roster-header-row">
                <span class="roster-name">${creature.name}</span>
                <span class="roster-stage">Stage ${stage}: ${stats.stageName}</span>
                <span class="roster-weight">${stats.weight} Weight</span>
              </div>
              <div class="roster-sub-row">${progressText}</div>
              <div class="roster-stats-row">
                <span>❤️ ${Math.ceil(creature.currentHealth)} / ${stats.maxHealth} HP</span>
                <span>⚔️ ${stats.damage} Dmg</span>
                <span>🛡️ ${(stats.damageReduction * 100).toFixed(0)}% Def</span>
                ${creature.armorEquipped ? '<span class="badge-armored">🛡️ Armored</span>' : ''}
                ${isRecovering ? `<span style="color: #e67e22;">⏳ Recovering (${Math.ceil(creature.recoveryRemainingSeconds)}s)</span>` : ''}
              </div>
            </div>
            <div class="roster-actions">
              ${
                creature.armorEquipped
                  ? '<span class="armored-tag">✓ Armored</span>'
                  : `<button class="btn-assign-armor" data-id="${creature.id}" data-kind="${creature.kind}" ${canEquipArmor ? '' : 'disabled'}>
                      Equip ${creature.kind === 'rabbit' ? 'Rabbit' : 'Bull'} Armor
                    </button>`
              }
            </div>
          </div>
        `;
      })
      .join('');

    this.listEl.querySelectorAll('.btn-assign-armor').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).dataset.id!;
        const kind = (e.currentTarget as HTMLElement).dataset.kind as 'rabbit' | 'bull';
        const armorKind = kind === 'rabbit' ? 'rabbitArmor' : 'bullArmor';
        if (this.session.assignArmor(id, armorKind)) {
          this.render();
        }
      });
    });
  }
}
