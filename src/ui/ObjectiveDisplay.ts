import { GameSession } from '../app/GameSession';
import { ObjectiveSystem } from '../systems/ObjectiveSystem';

export class ObjectiveDisplay {
  private session: GameSession;
  private textEl: HTMLElement | null;
  private lastText: string = '';

  constructor(session: GameSession) {
    this.session = session;
    this.textEl = document.getElementById('objective-text');
  }

  public update(enemiesRemaining: number = 2): void {
    const text = ObjectiveSystem.getObjectiveText(this.session, enemiesRemaining);
    if (text !== this.lastText && this.textEl) {
      this.lastText = text;
      this.textEl.textContent = text;
    }
  }
}
