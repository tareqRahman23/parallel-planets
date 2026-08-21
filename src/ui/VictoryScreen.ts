import { GameSession } from '../app/GameSession';
import { GameEvents } from '../app/GameEvents';

export class VictoryScreen {
  private session: GameSession;
  private modalEl: HTMLElement | null;
  private continueBtn: HTMLElement | null;
  private victoryTitleEl: HTMLElement | null;
  private statGridEl: HTMLElement | null;
  private victoryStarsEl: HTMLElement | null;
  private victorySummaryEl: HTMLElement | null;

  constructor(session: GameSession) {
    this.session = session;
    this.modalEl = document.getElementById('victory-modal');
    this.continueBtn = document.getElementById('play-again-btn');
    this.victoryTitleEl = document.querySelector('.badge-victory');
    this.statGridEl = document.getElementById('victory-stats-grid');
    this.victoryStarsEl = document.getElementById('victory-stars');
    this.victorySummaryEl = document.getElementById('victory-summary');

    this.setupListeners();
  }

  private setupListeners(): void {
    if (this.continueBtn) {
      this.continueBtn.onclick = () => {
        this.hide();
        this.session.continueHomeFromInvasion();
      };
    }

    GameEvents.on('mode-changed', (mode: string) => {
      if (mode === 'invasionResult') {
        this.show();
      } else {
        this.hide();
      }
    });
  }

  public show(): void {
    const inv = this.session.invasion;
    const settlement = inv.lootSettlement;

    const deployedIds = inv.deployedCreatureIds;
    const allDeployed = this.session.ownedCreatures.filter((c) => deployedIds.includes(c.id));
    const lostCreatures = allDeployed.filter((c) => c.invasionState === 'lost');
    const survivingCreatures = allDeployed.filter((c) => c.invasionState !== 'lost');
    const lostArmors = lostCreatures.filter((c) => c.armorEquipped).length;

    const stars = inv.stars;
    const star1 = stars.fiftyPercent ? '⭐' : '☆';
    const star2 = stars.core ? '⭐' : '☆';
    const star3 = stars.fullDestruction ? '⭐' : '☆';

    if (this.victoryStarsEl) {
      this.victoryStarsEl.innerHTML = `
        <div style="display: flex; justify-content: center; gap: 15px; font-size: 32px;">
          <span title="50% Base Destruction">${star1} 50%</span>
          <span title="Enemy Core Destroyed">${star2} Core</span>
          <span title="100% Full Destruction">${star3} 100%</span>
        </div>
      `;
    }

    if (this.victoryTitleEl) {
      if (stars.core) {
        this.victoryTitleEl.textContent = 'CAMPAIGN VICTORY - PLANET LIBERATED!';
        this.victoryTitleEl.style.color = '#2ecc71';
      } else if (stars.fiftyPercent) {
        this.victoryTitleEl.textContent = 'RESOURCE RAID SUCCESSFUL';
        this.victoryTitleEl.style.color = '#f1c40f';
      } else {
        this.victoryTitleEl.textContent = 'INVASION REPEDED';
        this.victoryTitleEl.style.color = '#e74c3c';
      }
    }

    if (this.victorySummaryEl) {
      if (stars.fullDestruction) {
        this.victorySummaryEl.textContent =
          'Flawless 100% Destruction! All enemy defenses dismantled, core obliterated, and extra bonus loot secured.';
      } else if (stars.core) {
        this.victorySummaryEl.textContent =
          'Enemy Core Destroyed! The invasion objective is accomplished. Surviving troops will recover back home.';
      } else if (stars.fiftyPercent) {
        this.victorySummaryEl.textContent =
          '50% Base Destruction reached. Secured resource loot before withdrawing.';
      } else {
        this.victorySummaryEl.textContent =
          'Invasion halted before reaching 50%. Regroup at Home, train stronger companions, and upgrade armor.';
      }
    }

    if (this.statGridEl) {
      const timeSpent = Math.floor(180 - inv.remainingSeconds);
      const m = Math.floor(timeSpent / 60);
      const s = timeSpent % 60;
      const timeStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

      this.statGridEl.innerHTML = `
        <div class="stat-box">
          <div class="stat-num">${inv.destructionPercent}%</div>
          <div class="stat-name">Base Destruction</div>
        </div>
        <div class="stat-box">
          <div class="stat-num">${timeStr}</div>
          <div class="stat-name">Battle Time</div>
        </div>
        <div class="stat-box">
          <div class="stat-num">🟡 +${settlement?.coinsAdded ?? 0}</div>
          <div class="stat-name">Coins Looted</div>
        </div>
        <div class="stat-box">
          <div class="stat-num">⚙️ ${settlement?.techPartsStored ?? 0} | 🪨 ${settlement?.stoneStored ?? 0}</div>
          <div class="stat-name">Goods Stored in Warehouse</div>
        </div>
        <div class="stat-box">
          <div class="stat-num">🟡 +${settlement?.overflowSaleCoins ?? 0}</div>
          <div class="stat-name">Overflow Auto-Sold</div>
        </div>
        <div class="stat-box">
          <div class="stat-num">${survivingCreatures.length} / ${deployedIds.length}</div>
          <div class="stat-name">Surviving Creatures</div>
        </div>
        <div class="stat-box">
          <div class="stat-num" style="color: #e74c3c;">${lostCreatures.length} (${lostArmors} Armor)</div>
          <div class="stat-name">Permanent Losses</div>
        </div>
        <div class="stat-box">
          <div class="stat-num" style="text-transform: capitalize;">${inv.selectedSupport || 'None'}</div>
          <div class="stat-name">Support Power Used</div>
        </div>
      `;
    }

    if (this.continueBtn) {
      this.continueBtn.innerHTML = `<span>CONTINUE TO HOME PLANET</span>`;
    }

    this.modalEl?.classList.remove('hidden');
  }

  public hide(): void {
    this.modalEl?.classList.add('hidden');
  }
}
