import * as THREE from 'three';
import { GameSession } from '../app/GameSession';
import { Input } from '../core/Input';
import { CameraController } from '../core/CameraController';
import { IDisposable } from '../core/Disposable';

export abstract class World implements IDisposable {
  public readonly scene: THREE.Scene;
  protected session: GameSession;

  constructor(session: GameSession) {
    this.session = session;
    this.scene = new THREE.Scene();
  }

  public abstract init(cameraController: CameraController): void;
  public abstract update(delta: number, input: Input, cameraController: CameraController): void;
  public abstract getEnemiesRemaining(): number;
  public abstract dispose(): void;
}
