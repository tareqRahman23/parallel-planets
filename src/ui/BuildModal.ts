import { GameSession, MachineKind, DefenseKind } from '../app/GameSession';
import { GAME_CONFIG } from '../app/GameConfig';
import { GameEvents } from '../app/GameEvents';

const MACHINE_DETAILS: Record<MachineKind, {
  description: string;
  input: { label: string; tooltip: string };
  output: { label: string; tooltip: string };
}> = {
  drill: {
    description: 'An unattended extractor that keeps the stone supply moving.',
    input: { label: '↻ Automatic', tooltip: 'Input: none. The Mining Drill runs by itself while powered on.' },
    output: { label: '🪨 2 Stone', tooltip: 'Output: deposits 2 Stone into the warehouse every 4 seconds at Level 1.' },
  },
  spinnery: {
    description: 'Refines Rabbit Fur into thread for the tailoring chain.',
    input: { label: '🧶 2 Fur', tooltip: 'Input: consumes 2 Fur when you click the Spinnery in the world.' },
    output: { label: '🧵 1 Thread', tooltip: 'Output: deposits 1 Thread into the warehouse after a 6-second batch at Level 1.' },
  },
  tailor: {
    description: 'Weaves thread into fabric for advanced equipment and upgrades.',
    input: { label: '🧵 2 Thread', tooltip: 'Input: consumes 2 Thread when you click the Tailor in the world.' },
    output: { label: '📜 1 Fabric', tooltip: 'Output: deposits 1 Fabric into the warehouse after a 10-second batch at Level 1.' },
  },
  stoneForge: {
    description: 'Forges raw stone into Tech Parts for the armory and rocket.',
    input: { label: '🪨 5 Stone', tooltip: 'Input: consumes 5 Stone when you click the Stone Forge in the world.' },
    output: { label: '⚙️ 1 Tech Part', tooltip: 'Output: deposits 1 Tech Part into the warehouse after an 8-second batch at Level 1.' },
  },
  workshop: {
    description: 'A specialist armory for creature armor, rocket work, and orbital support.',
    input: { label: '📦 Recipe costs', tooltip: 'Input: each selected recipe consumes its listed Stone, Fabric, Tech Parts, and Coins.' },
    output: { label: '🛡️ Equipment', tooltip: 'Output: crafted armor, rocket upgrades, and orbital support are collected from the Workshop.' },
  },
};

export class BuildModal {
  private session: GameSession;
  private modalEl: HTMLElement | null = null;
  private machinesGridEl: HTMLElement | null = null;
  private defensesGridEl: HTMLElement | null = null;

  constructor(session: GameSession) {
    this.session = session;
    this.createModalDOM();
    this.setupListeners();
  }

  private createModalDOM(): void {
    let modal = document.getElementById('build-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'build-modal';
      modal.className = 'modal-overlay hidden';
      modal.innerHTML = `
        <div class="modal-card build-card">
          <div class="modal-header">
            <div class="badge-title">CONSTRUCTION & DEFENSE</div>
            <h2 class="modal-title">BUILD DISTRICT</h2>
            <button class="modal-close-btn" id="build-close-btn">✕</button>
          </div>
          
          <div class="build-section-title">🏭 PRODUCTION MACHINES</div>
          <div class="build-grid" id="build-machines-grid"></div>

          <div class="build-section-title" style="margin-top: 20px;">🛡️ DEFENSE STATIONS</div>
          <div class="build-grid" id="build-defenses-grid"></div>
        </div>
      `;
      document.getElementById('app-container')?.appendChild(modal);
    }
    this.modalEl = modal;
    this.machinesGridEl = document.getElementById('build-machines-grid');
    this.defensesGridEl = document.getElementById('build-defenses-grid');

    document.getElementById('build-close-btn')?.addEventListener('click', () => this.hide());
  }

  private setupListeners(): void {
    GameEvents.on('open-build-modal', () => this.show());
    GameEvents.on('machine-purchased', () => this.render());
    GameEvents.on('machine-upgraded', () => this.render());
    GameEvents.on('defense-purchased', () => this.render());
    GameEvents.on('coins-changed', () => {
      if (!this.modalEl?.classList.contains('hidden')) {
        this.render();
      }
    });

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
    if (!this.machinesGridEl || !this.defensesGridEl) return;

    const machines = this.session.machines;
    const cfgMachines = GAME_CONFIG.machines;

    // Render Machines
    this.machinesGridEl.innerHTML = machines
      .map((m) => {
        const kind = m.kind;
        const info = (cfgMachines as any)[kind];
        const price = info?.price || 0;
        const details = MACHINE_DETAILS[kind];
        const canAfford = this.session.coins >= price;
        const isBuilt = m.status !== 'unbuilt';
        const upgradeCost = this.session.getMachineUpgradeCost(m);
        const canUpgrade = upgradeCost !== null && this.session.coins >= upgradeCost && m.status !== 'constructing';

        let prereqText = '';
        let isLocked = false;
        if (kind === 'tailor') {
          const spinnery = machines.find((item) => item.kind === 'spinnery');
          if (!spinnery || spinnery.status === 'unbuilt') {
            prereqText = 'Requires Spinnery';
            isLocked = true;
          }
        } else if (kind === 'stoneForge') {
          const drill = machines.find((item) => item.kind === 'drill');
          if (!drill || drill.status === 'unbuilt') {
            prereqText = 'Requires Mining Drill';
            isLocked = true;
          }
        } else if (kind === 'workshop') {
          const tailor = machines.find((item) => item.kind === 'tailor');
          const forge = machines.find((item) => item.kind === 'stoneForge');
          if (!tailor || tailor.status === 'unbuilt' || !forge || forge.status === 'unbuilt') {
            prereqText = 'Requires Tailor & Stone Forge';
            isLocked = true;
          }
        }

        return `
          <div class="build-card-item ${isBuilt ? 'built' : isLocked ? 'locked' : canAfford ? 'purchasable' : 'disabled'}">
            <div class="build-card-header">
              <span class="build-name">${info?.name || kind}</span>
              <span class="build-price">🟡 ${price}</span>
            </div>
            <div class="build-card-meta">
              <span>Status: <strong>${m.status.toUpperCase()}</strong></span>
              <span>Level ${m.level}/3 · ${m.level === 1 ? '100' : m.level === 2 ? '135' : '170'}% speed</span>
              <p class="machine-description">${details.description}</p>
              <div class="machine-io" aria-label="${info?.name || kind} production inputs and outputs">
                <span class="machine-io-item machine-input" data-tooltip="${details.input.tooltip}" tabindex="0">IN&nbsp; ${details.input.label}</span>
                <span class="machine-io-arrow">→</span>
                <span class="machine-io-item machine-output" data-tooltip="${details.output.tooltip}" tabindex="0">OUT&nbsp; ${details.output.label}</span>
              </div>
              ${isBuilt && ['spinnery', 'tailor', 'stoneForge'].includes(kind) ? '<span class="machine-control-note">Click it in the world to run one batch</span>' : ''}
              ${prereqText ? `<div class="prereq-warning">⚠️ ${prereqText}</div>` : ''}
            </div>
            ${isBuilt
              ? `<button class="btn-machine-upgrade" data-id="${m.id}" ${canUpgrade ? '' : 'disabled'}>${upgradeCost === null ? 'Maximum Level' : `Upgrade to L${m.level + 1} (🟡 ${upgradeCost})`}</button>`
              : `<button class="btn-purchase-build" data-kind="${kind}" data-type="machine" ${!isLocked && canAfford ? '' : 'disabled'}>${isLocked ? 'Locked' : 'Construct (5s)'}</button>`}
          </div>
        `;
      })
      .join('');

    // Render Defenses
    const defenses = this.session.defenses;
    const defTypes: DefenseKind[] = ['pulseTurret', 'snareTotem', 'repairBeacon'];
    const defPads = GAME_CONFIG.homeLayout.defensePads;

    this.defensesGridEl.innerHTML = defPads
      .map((pad) => {
        const currentDef = defenses.find((d) => d.padId === pad.id);
        const isBuilt = currentDef && currentDef.status !== 'unbuilt';

        if (isBuilt) {
          const cfg = GAME_CONFIG.defenses[currentDef.kind];
          return `
            <div class="build-card-item built">
              <div class="build-card-header">
                <span class="build-name">${pad.name}</span>
                <span class="build-price">Active: ${cfg.name}</span>
              </div>
              <div class="build-card-meta">
                <span>HP: ${Math.ceil(currentDef.health)} / ${currentDef.maxHealth}</span>
                <span>Status: <strong>${currentDef.status.toUpperCase()}</strong></span>
              </div>
              <button disabled class="btn-purchase-build">Built on Pad</button>
            </div>
          `;
        }

        return `
          <div class="build-card-item purchasable">
            <div class="build-card-header">
              <span class="build-name">${pad.name}</span>
              <span class="build-price">Available</span>
            </div>
            <div class="def-options-row">
              ${defTypes
                .map((dtype) => {
                  const cfg = GAME_CONFIG.defenses[dtype];
                  const canAfford = this.session.coins >= cfg.price;
                  return `
                    <button class="btn-build-defense-option" data-pad="${pad.id}" data-dtype="${dtype}" ${canAfford ? '' : 'disabled'}>
                      ${cfg.name} (🟡 ${cfg.price})
                    </button>
                  `;
                })
                .join('')}
            </div>
          </div>
        `;
      })
      .join('');

    // Bind machine purchase clicks
    this.machinesGridEl.querySelectorAll('.btn-purchase-build').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const kind = (e.currentTarget as HTMLElement).dataset.kind as MachineKind;
        if (this.session.purchaseMachine(kind)) {
          this.render();
        }
      });
    });

    this.machinesGridEl.querySelectorAll('.btn-machine-upgrade').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const machineId = (e.currentTarget as HTMLElement).dataset.id!;
        if (this.session.upgradeMachine(machineId)) {
          this.render();
        }
      });
    });

    // Bind defense purchase clicks
    this.defensesGridEl.querySelectorAll('.btn-build-defense-option').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const padId = (e.currentTarget as HTMLElement).dataset.pad!;
        const dtype = (e.currentTarget as HTMLElement).dataset.dtype as DefenseKind;
        if (this.session.purchaseDefense(dtype, padId)) {
          this.render();
        }
      });
    });
  }
}
