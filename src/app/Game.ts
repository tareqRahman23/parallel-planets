import * as THREE from 'three';
import { GameSession } from './GameSession';
import { GameLoop } from './GameLoop';
import { GameEvents } from './GameEvents';
import { Renderer } from '../core/Renderer';
import { Input } from '../core/Input';
import { CameraController } from '../core/CameraController';
import { AudioManager } from '../core/AudioManager';
import { WorldManager } from '../worlds/WorldManager';
import { HUD } from '../ui/HUD';
import { ObjectiveDisplay } from '../ui/ObjectiveDisplay';
import { VictoryScreen } from '../ui/VictoryScreen';
import { RosterModal } from '../ui/RosterModal';
import { WorkshopModal } from '../ui/WorkshopModal';
import { DeploymentModal } from '../ui/DeploymentModal';
import { BuildModal } from '../ui/BuildModal';
import { MarketModal } from '../ui/MarketModal';
import { FloatingText } from '../effects/FloatingText';
import { GAME_CONFIG } from './GameConfig';

export class Game {
  private canvas: HTMLCanvasElement;
  private renderer: Renderer;
  private input: Input;
  private audioManager: AudioManager;
  private cameraController: CameraController;
  private session: GameSession;
  private worldManager: WorldManager;
  private hud: HUD;
  private objectiveDisplay: ObjectiveDisplay;
  public readonly victoryScreen: VictoryScreen;
  public readonly rosterModal: RosterModal;
  public readonly workshopModal: WorkshopModal;
  public readonly deploymentModal: DeploymentModal;
  public readonly buildModal: BuildModal;
  public readonly marketModal: MarketModal;
  private floatingText: FloatingText;
  private gameLoop: GameLoop;
  private hasStartedExpedition = false;
  private isPaused = false;
  private mainMenuEl: HTMLElement | null;
  private pauseMenuEl: HTMLElement | null;
  private mainMenuPlayBtn: HTMLButtonElement | null;
  private menuHelpBtn: HTMLButtonElement | null;
  private menuHelpEl: HTMLElement | null;
  private resumeBtn: HTMLButtonElement | null;
  private pauseWikiBtn: HTMLButtonElement | null;
  private pauseWikiEl: HTMLElement | null;
  private returnMainMenuBtn: HTMLButtonElement | null;
  private pauseBtn: HTMLButtonElement | null;
  private onKeyDownBound: (event: KeyboardEvent) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new Renderer(this.canvas);
    this.input = new Input();
    this.audioManager = new AudioManager();
    this.cameraController = new CameraController();
    this.session = new GameSession();
    this.floatingText = new FloatingText();

    this.worldManager = new WorldManager(this.session, this.cameraController);
    this.hud = new HUD(this.session, this.audioManager);
    this.objectiveDisplay = new ObjectiveDisplay(this.session);
    this.victoryScreen = new VictoryScreen(this.session);
    this.rosterModal = new RosterModal(this.session);
    this.workshopModal = new WorkshopModal(this.session);
    this.deploymentModal = new DeploymentModal(this.session);
    this.buildModal = new BuildModal(this.session);
    this.marketModal = new MarketModal(this.session);

    this.mainMenuEl = document.getElementById('main-menu');
    this.pauseMenuEl = document.getElementById('pause-menu');
    this.mainMenuPlayBtn = document.getElementById('main-menu-play-btn') as HTMLButtonElement;
    this.menuHelpBtn = document.getElementById('main-menu-help-btn') as HTMLButtonElement;
    this.menuHelpEl = document.getElementById('main-menu-help');
    this.resumeBtn = document.getElementById('resume-game-btn') as HTMLButtonElement;
    this.pauseWikiBtn = document.getElementById('pause-wiki-btn') as HTMLButtonElement;
    this.pauseWikiEl = document.getElementById('pause-wiki');
    this.returnMainMenuBtn = document.getElementById('return-main-menu-btn') as HTMLButtonElement;
    this.pauseBtn = document.getElementById('pause-game-btn') as HTMLButtonElement;
    this.onKeyDownBound = this.handleMenuKeyDown.bind(this);

    this.setupFXListeners();
    this.setupMenuControls();

    // Start with Home World
    this.worldManager.loadHomeWorld();

    this.gameLoop = new GameLoop(this.update.bind(this));
  }

  private setupFXListeners(): void {
    GameEvents.on('stone-mined', (data: { position: THREE.Vector3; amount: number }) => {
      this.floatingText.spawn(data.position, `+${data.amount} Stone`, 'stone', this.cameraController.camera);
    });

    GameEvents.on('order-completed', (data: { reward: number }) => {
      this.floatingText.spawn(new THREE.Vector3(0, 2, 0), `+${data.reward} Coins`, 'carrot', this.cameraController.camera);
    });

    GameEvents.on('product-collected', (product: any) => {
      this.floatingText.spawn(new THREE.Vector3(...product.worldPosition), `+1 ${product.kind}`, 'carrot', this.cameraController.camera);
    });

    GameEvents.on('machine-output-stored', (data: { machine: { padId: string }; resource: string; amount: number }) => {
      const pad = GAME_CONFIG.homeLayout.machinePads.find((item) => item.id === data.machine.padId);
      if (!pad) return;
      const label = data.resource === 'techParts' ? 'Tech Part' : data.resource[0].toUpperCase() + data.resource.slice(1);
      this.floatingText.spawn(new THREE.Vector3(pad.position[0], 2.4, pad.position[2]), `+${data.amount} ${label}`, 'carrot', this.cameraController.camera);
    });

    GameEvents.on('machine-output-spilled', (data: { machine: { padId: string } }) => {
      const pad = GAME_CONFIG.homeLayout.machinePads.find((item) => item.id === data.machine.padId);
      if (pad) this.floatingText.spawn(new THREE.Vector3(pad.position[0], 2.4, pad.position[2]), 'Warehouse full', 'damage', this.cameraController.camera);
    });

    GameEvents.on('depot-looted', (data: any) => {
      this.floatingText.spawn(new THREE.Vector3(0, 3, 0), `+${data.coins} Coins`, 'carrot', this.cameraController.camera);
    });

    GameEvents.on('combat-hit', (data: { position: THREE.Vector3; isEnemy?: boolean }) => {
      this.floatingText.spawn(data.position, `-hit`, 'damage', this.cameraController.camera);
    });
  }

  public start(): void {
    this.gameLoop.start();
  }

  private setupMenuControls(): void {
    this.mainMenuPlayBtn?.addEventListener('click', () => this.beginOrResumeExpedition());
    this.resumeBtn?.addEventListener('click', () => this.resumeExpedition());
    this.pauseWikiBtn?.addEventListener('click', () => {
      const isHidden = this.pauseWikiEl?.classList.contains('hidden') ?? true;
      this.pauseWikiEl?.classList.toggle('hidden', !isHidden);
      this.pauseWikiBtn?.setAttribute('aria-expanded', String(isHidden));
      if (this.pauseWikiBtn) {
        this.pauseWikiBtn.textContent = isHidden ? 'Close field wiki' : 'Open field wiki';
      }
    });
    this.returnMainMenuBtn?.addEventListener('click', () => this.returnToMainMenu());
    this.pauseBtn?.addEventListener('click', () => this.pauseExpedition());
    this.menuHelpBtn?.addEventListener('click', () => {
      const isHidden = this.menuHelpEl?.classList.contains('hidden') ?? true;
      this.menuHelpEl?.classList.toggle('hidden', !isHidden);
      this.menuHelpBtn?.setAttribute('aria-expanded', String(isHidden));
      this.menuHelpBtn?.classList.toggle('active', isHidden);
    });

    // Capture runs before modal key handlers, so Escape closes an active modal
    // without accidentally pausing the entire game at the same time.
    window.addEventListener('keydown', this.onKeyDownBound, true);
  }

  private handleMenuKeyDown(event: KeyboardEvent): void {
    if (event.repeat || !this.hasStartedExpedition) return;
    const key = event.key.toLowerCase();
    if (key !== 'p' && key !== 'escape') return;

    if (!this.isPaused && this.isAnyGameModalOpen()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (this.isPaused) {
      this.resumeExpedition();
    } else {
      this.pauseExpedition();
    }
  }

  private isAnyGameModalOpen(): boolean {
    return Array.from(document.querySelectorAll('.modal-overlay')).some((modal) => !modal.classList.contains('hidden'));
  }

  private beginOrResumeExpedition(): void {
    this.hasStartedExpedition = true;
    this.isPaused = false;
    this.mainMenuEl?.classList.add('hidden');
    this.pauseMenuEl?.classList.add('hidden');
    this.pauseBtn?.removeAttribute('disabled');
    this.input.endFrame();
  }

  private pauseExpedition(): void {
    if (!this.hasStartedExpedition || this.isPaused) return;
    this.isPaused = true;
    this.pauseMenuEl?.classList.remove('hidden');
    this.pauseBtn?.setAttribute('disabled', 'true');
    this.resumeBtn?.focus();
    this.input.endFrame();
  }

  private resumeExpedition(): void {
    if (!this.hasStartedExpedition) return;
    this.isPaused = false;
    this.pauseMenuEl?.classList.add('hidden');
    this.mainMenuEl?.classList.add('hidden');
    this.pauseBtn?.removeAttribute('disabled');
    this.input.endFrame();
  }

  private returnToMainMenu(): void {
    this.isPaused = true;
    this.pauseMenuEl?.classList.add('hidden');
    this.mainMenuEl?.classList.remove('hidden');
    this.pauseBtn?.setAttribute('disabled', 'true');
    if (this.mainMenuPlayBtn) {
      this.mainMenuPlayBtn.textContent = 'RESUME EXPEDITION';
      this.mainMenuPlayBtn.focus();
    }
  }

  private update(delta: number): void {
    if (!this.hasStartedExpedition || this.isPaused) {
      const pausedWorld = this.worldManager.currentWorld;
      if (pausedWorld) this.renderer.render(pausedWorld.scene, this.cameraController.camera);
      this.input.endFrame();
      return;
    }

    this.session.update(delta);
    this.hud.update(delta);

    const currentWorld = this.worldManager.currentWorld;
    if (currentWorld) {
      // 1. Update active world
      currentWorld.update(delta, this.input, this.cameraController);

      // 2. Update camera damping & screen shake
      this.cameraController.update(delta);

      // 3. Update Objectives
      const enemiesRemaining = currentWorld.getEnemiesRemaining();
      this.objectiveDisplay.update(enemiesRemaining);

      // 4. Render Scene
      this.renderer.render(currentWorld.scene, this.cameraController.camera);
    }

    // 5. Reset edge triggers
    this.input.endFrame();
  }

  public dispose(): void {
    this.gameLoop.stop();
    this.worldManager.dispose();
    this.renderer.dispose();
    this.input.dispose();
    window.removeEventListener('keydown', this.onKeyDownBound, true);
    this.audioManager.dispose();
    this.cameraController.dispose();
    this.hud.dispose();
    this.floatingText.dispose();
  }
}
