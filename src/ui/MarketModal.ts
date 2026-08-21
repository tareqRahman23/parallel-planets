import { GameSession } from '../app/GameSession';
import { GAME_CONFIG } from '../app/GameConfig';
import { OrderResourceType } from '../systems/SupplyOrderSystem';
import { GameEvents } from '../app/GameEvents';

export class MarketModal {
  private session: GameSession;
  private modalEl: HTMLElement | null = null;
  private listEl: HTMLElement | null = null;

  constructor(session: GameSession) {
    this.session = session;
    this.createModalDOM();
    this.setupListeners();
  }

  private createModalDOM(): void {
    let modal = document.getElementById('market-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'market-modal';
      modal.className = 'modal-overlay hidden';
      modal.innerHTML = `
        <div class="modal-card market-card">
          <div class="modal-header">
            <div class="badge-title">EMERGENCY COMMERCE</div>
            <h2 class="modal-title">QUICK SALE MARKET</h2>
            <button class="modal-close-btn" id="market-close-btn">✕</button>
          </div>
          <p class="modal-subtitle" style="color: #e67e22; font-size: 13px; margin-bottom: 12px;">
            ⚠️ Quick Sale - Lower Price than Supply Orders. Sell excess inventory immediately for emergency funds.
          </p>
          <div class="market-items-list" id="market-items-list"></div>
        </div>
      `;
      document.getElementById('app-container')?.appendChild(modal);
    }
    this.modalEl = modal;
    this.listEl = document.getElementById('market-items-list');

    document.getElementById('market-close-btn')?.addEventListener('click', () => this.hide());
  }

  private setupListeners(): void {
    GameEvents.on('open-market-modal', () => this.show());
    GameEvents.on('market-sold', () => this.render());
    GameEvents.on('stone-changed', () => this.renderIfOpen());
    GameEvents.on('fur-changed', () => this.renderIfOpen());
    GameEvents.on('fertilizer-changed', () => this.renderIfOpen());
    GameEvents.on('thread-changed', () => this.renderIfOpen());
    GameEvents.on('fabric-changed', () => this.renderIfOpen());
    GameEvents.on('techParts-changed', () => this.renderIfOpen());

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.modalEl?.classList.contains('hidden')) {
        this.hide();
      }
    });
  }

  private renderIfOpen(): void {
    if (!this.modalEl?.classList.contains('hidden')) {
      this.render();
    }
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

    const resources: Array<{ key: OrderResourceType; name: string; icon: string }> = [
      { key: 'stone', name: 'Stone', icon: '🪨' },
      { key: 'fur', name: 'Rabbit Fur', icon: '🧶' },
      { key: 'fertilizer', name: 'Fertilizer Sack', icon: '🌱' },
      { key: 'thread', name: 'Thread Spool', icon: '🧵' },
      { key: 'fabric', name: 'Fabric Fold', icon: '📜' },
      { key: 'techParts', name: 'Tech Part', icon: '⚙️' },
    ];

    const inventory = this.session.inventory;
    const marketPrices = GAME_CONFIG.economy.market;

    this.listEl.innerHTML = resources
      .map((item) => {
        const count = inventory[item.key] || 0;
        const price = marketPrices[item.key];
        const canSell = count > 0;

        return `
          <div class="market-row-item ${canSell ? '' : 'disabled'}">
            <div class="market-item-info">
              <span class="market-item-icon">${item.icon}</span>
              <div>
                <div class="market-item-name">${item.name}</div>
                <div class="market-item-owned">Owned: <strong>${count}</strong> | Rate: <strong>🟡 ${price} each</strong></div>
              </div>
            </div>
            <div class="market-actions">
              <button class="btn-market-sell" data-res="${item.key}" data-amount="1" ${canSell ? '' : 'disabled'}>
                Sell 1 (+🟡${price})
              </button>
              <button class="btn-market-sell btn-sell-all" data-res="${item.key}" data-amount="${count}" ${canSell ? '' : 'disabled'}>
                Sell All (+🟡${count * price})
              </button>
            </div>
          </div>
        `;
      })
      .join('');

    this.listEl.querySelectorAll('.btn-market-sell').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const res = (e.currentTarget as HTMLElement).dataset.res as OrderResourceType;
        const amount = parseInt((e.currentTarget as HTMLElement).dataset.amount || '1', 10);
        if (this.session.sellToMarket(res, amount)) {
          this.render();
        }
      });
    });
  }
}
