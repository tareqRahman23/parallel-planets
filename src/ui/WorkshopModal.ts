import { GameSession } from '../app/GameSession';
import { GAME_CONFIG } from '../app/GameConfig';
import { GameEvents } from '../app/GameEvents';

export class WorkshopModal {
  private session: GameSession;
  private modalEl: HTMLElement | null = null;
  private recipesGridEl: HTMLElement | null = null;
  private queueContainerEl: HTMLElement | null = null;

  constructor(session: GameSession) {
    this.session = session;
    this.createModalDOM();
    this.setupListeners();
  }

  private createModalDOM(): void {
    let modal = document.getElementById('workshop-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'workshop-modal';
      modal.className = 'modal-overlay hidden';
      modal.innerHTML = `
        <div class="modal-card workshop-card">
          <div class="modal-header">
            <div class="badge-title">FABRICATION ARMORY</div>
            <h2 class="modal-title">CRAFTING WORKSHOP</h2>
            <button class="modal-close-btn" id="workshop-close-btn">✕</button>
          </div>
          <div class="workshop-queue-bar" id="workshop-queue-bar"></div>
          <div class="workshop-recipes-grid" id="workshop-recipes-grid"></div>
        </div>
      `;
      document.getElementById('app-container')?.appendChild(modal);
    }
    this.modalEl = modal;
    this.recipesGridEl = document.getElementById('workshop-recipes-grid');
    this.queueContainerEl = document.getElementById('workshop-queue-bar');

    document.getElementById('workshop-close-btn')?.addEventListener('click', () => this.hide());
  }

  private setupListeners(): void {
    GameEvents.on('open-workshop-modal', () => this.show());
    GameEvents.on('workshop-job-queued', () => this.render());
    GameEvents.on('workshop-output-ready', () => this.render());
    GameEvents.on('workshop-item-collected', () => this.render());

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
    if (!this.recipesGridEl || !this.queueContainerEl) return;

    const ws = this.session.workshop;
    const recipes = GAME_CONFIG.workshop.recipes;

    // Render Queue
    const activeText = ws.activeJob
      ? `Active: ${(recipes as any)[ws.activeJob.recipeId]?.name} (${Math.ceil(ws.activeJob.durationSeconds - ws.activeJob.elapsedSeconds)}s)`
      : 'Workshop Idle';
    const queuedText = ws.queuedJobs.length > 0
      ? `Queue (${ws.queuedJobs.length}/2): ${ws.queuedJobs.map((q) => (recipes as any)[q]?.name).join(', ')}`
      : 'Queue Empty';
    const readyText = ws.readyOutputs.length > 0
      ? `<span class="ready-outputs-alert">Ready: ${ws.readyOutputs.map((r) => (recipes as any)[r]?.name).join(', ')}</span>`
      : '';

    this.queueContainerEl.innerHTML = `
      <div class="ws-queue-status">
        <div class="ws-status-active">🔨 ${activeText}</div>
        <div class="ws-status-queued">📋 ${queuedText}</div>
        <div class="ws-status-ready">
          ${readyText}
          ${ws.readyOutputs.length > 0 ? `<button class="btn-collect-ws-item" id="btn-collect-all-ws">Collect All</button>` : ''}
        </div>
      </div>
    `;

    document.getElementById('btn-collect-all-ws')?.addEventListener('click', () => {
      const ready = [...this.session.workshop.readyOutputs];
      ready.forEach((r) => this.session.collectWorkshopItem(r));
      this.render();
    });

    // Render Recipes
    const recipeKeys = Object.keys(recipes);
    this.recipesGridEl.innerHTML = recipeKeys
      .map((key) => {
        const recipe = (recipes as any)[key];
        const canCraft = this.session.canQueueWorkshopRecipe(key);
        const eq = this.session.equipment;

        let statusBadge = '';
        if (key === 'swordSupport' && eq.swordSupportUnlocked) statusBadge = '<span class="recipe-crafted-tag">✓ UNLOCKED</span>';
        if (key === 'gunSupport' && eq.gunSupportUnlocked) statusBadge = '<span class="recipe-crafted-tag">✓ UNLOCKED</span>';
        if (key === 'rocketRepair' && this.session.isRocketRepaired) statusBadge = '<span class="recipe-crafted-tag">✓ REPAIRED</span>';
        if (key === 'cargoUpgrade1' && this.session.cargoLevel >= 1) statusBadge = '<span class="recipe-crafted-tag">✓ INSTALLED</span>';
        if (key === 'cargoUpgrade2' && this.session.cargoLevel >= 2) statusBadge = '<span class="recipe-crafted-tag">✓ INSTALLED</span>';

        const costParts: string[] = [];
        if (recipe.stone > 0) costParts.push(`${recipe.stone} Stone`);
        if (recipe.fabric > 0) costParts.push(`${recipe.fabric} Fabric`);
        if (recipe.techParts > 0) costParts.push(`${recipe.techParts} Tech Parts`);
        if (recipe.coins > 0) costParts.push(`${recipe.coins} Coins`);

        return `
          <div class="workshop-recipe-card ${canCraft ? 'craftable' : 'disabled'}">
            <div class="recipe-header">
              <span class="recipe-name">${recipe.name}</span>
              ${statusBadge}
            </div>
            <div class="recipe-cost-row">
              <span>Cost: <strong>${costParts.join(' + ')}</strong></span>
              <span>Time: <strong>${recipe.durationSeconds}s</strong></span>
            </div>
            <button class="btn-craft-recipe" data-id="${key}" ${canCraft ? '' : 'disabled'}>
              ${statusBadge ? 'Already Crafted' : 'Craft Item'}
            </button>
          </div>
        `;
      })
      .join('');

    this.recipesGridEl.querySelectorAll('.btn-craft-recipe').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).dataset.id!;
        if (this.session.queueWorkshopRecipe(id)) {
          this.render();
        }
      });
    });
  }
}
