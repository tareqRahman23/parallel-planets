import { World } from './World';
import { HomeWorld } from './HomeWorld';
import { EnemyWorld } from './EnemyWorld';
import { GameSession } from '../app/GameSession';
import { CameraController } from '../core/CameraController';
import { GameEvents } from '../app/GameEvents';

export class WorldManager {
  private activeWorld: World | null = null;
  private session: GameSession;
  private cameraController: CameraController;
  private isTransitioning: boolean = false;

  constructor(session: GameSession, cameraController: CameraController) {
    this.session = session;
    this.cameraController = cameraController;

    this.setupListeners();
  }

  private setupListeners(): void {
    GameEvents.on('mode-changed', (newMode: string) => {
      if (newMode === 'invasionPreview' && !(this.activeWorld instanceof EnemyWorld) && !this.isTransitioning) {
        this.performLaunchTransition();
      } else if (newMode === 'home' && !(this.activeWorld instanceof HomeWorld) && !this.isTransitioning) {
        this.loadHomeWorld();
      }
    });

    GameEvents.on('session-reset', () => {
      this.loadHomeWorld();
    });
  }

  public loadHomeWorld(): void {
    if (this.activeWorld) {
      this.activeWorld.dispose();
      this.activeWorld = null;
    }

    this.activeWorld = new HomeWorld(this.session);
    this.activeWorld.init(this.cameraController);
  }

  public loadEnemyWorld(): void {
    if (this.activeWorld) {
      this.activeWorld.dispose();
      this.activeWorld = null;
    }

    this.activeWorld = new EnemyWorld(this.session);
    this.activeWorld.init(this.cameraController);
  }

  private performLaunchTransition(): void {
    this.isTransitioning = true;
    const fadeEl = document.getElementById('screen-fade');

    fadeEl?.classList.add('active');
    setTimeout(() => {
      this.loadEnemyWorld();
      setTimeout(() => {
        fadeEl?.classList.remove('active');
        this.isTransitioning = false;
      }, 500);
    }, 600);
  }

  public get currentWorld(): World | null {
    return this.activeWorld;
  }

  public dispose(): void {
    if (this.activeWorld) {
      this.activeWorld.dispose();
      this.activeWorld = null;
    }
  }
}
