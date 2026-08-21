export type UpdateCallback = (delta: number) => void;

export class GameLoop {
  private updateFn: UpdateCallback;
  private isRunning: boolean = false;
  private lastTime: number = 0;
  private animFrameId: number = 0;

  constructor(updateFn: UpdateCallback) {
    this.updateFn = updateFn;
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
    this.animFrameId = requestAnimationFrame(this.loop);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
  }

  private loop(currentTime: number): void {
    if (!this.isRunning) return;

    // Delta time in seconds, clamped to 0.05s to prevent simulation spikes
    const rawDelta = (currentTime - this.lastTime) / 1000;
    const delta = Math.min(rawDelta, 0.05);
    this.lastTime = currentTime;

    this.updateFn(delta);

    this.animFrameId = requestAnimationFrame(this.loop);
  }
}
