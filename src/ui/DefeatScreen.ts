import { GameEvents } from '../app/GameEvents';

export class DefeatScreen {
  private modalEl: HTMLElement | null;
  private retryBtn: HTMLElement | null;

  constructor() {
    this.modalEl = document.getElementById('defeat-modal');
    this.retryBtn = document.getElementById('retry-btn');

    this.setupListeners();
  }

  private setupListeners(): void {
    if (this.retryBtn) {
      this.retryBtn.onclick = () => {
        this.triggerRetry();
      };
    }

    GameEvents.on('phase-changed', (phase: string) => {
      if (phase === 'defeated') {
        this.show();
      } else {
        this.hide();
      }
    });
  }

  public triggerRetry(): void {
    this.hide();
    GameEvents.emit('retry-battle');
  }

  public show(): void {
    this.modalEl?.classList.remove('hidden');
  }

  public hide(): void {
    this.modalEl?.classList.add('hidden');
  }
}
