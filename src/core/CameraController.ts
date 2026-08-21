import * as THREE from 'three';
import { GameEvents } from '../app/GameEvents';

export class CameraController {
  public readonly camera: THREE.OrthographicCamera;
  private target: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private currentTarget: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private frustumSize: number = 22; // Default orthographic view scale
  private minFrustum: number = 14;
  private maxFrustum: number = 32;

  private shakeOffset: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private shakeIntensity: number = 0;
  private shakeDecay: number = 0;

  // Iso offset vector: 45 degree yaw, ~40 degree pitch
  private readonly isoOffset: THREE.Vector3 = new THREE.Vector3(20, 24, 20);

  constructor() {
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.OrthographicCamera(
      (-this.frustumSize * aspect) / 2,
      (this.frustumSize * aspect) / 2,
      this.frustumSize / 2,
      -this.frustumSize / 2,
      0.1,
      200
    );

    this.camera.position.copy(this.isoOffset);
    this.camera.lookAt(0, 0, 0);

    window.addEventListener('resize', this.onResize);
    GameEvents.on('screen-shake', this.onScreenShake);
  }

  private onResize = (): void => {
    this.updateFrustum();
  };

  public setFrustumSize(size: number): void {
    this.frustumSize = THREE.MathUtils.clamp(size, this.minFrustum, this.maxFrustum);
    this.updateFrustum();
  }

  public zoom(delta: number): void {
    this.setFrustumSize(this.frustumSize + delta);
  }

  public pan(deltaX: number, deltaZ: number): void {
    // Convert screen pan vector to isometric ground plane offset
    // In our iso projection (yaw 45 deg), moving right is (+x, -z) and moving up is (-x, -z)
    const panScale = this.frustumSize * 0.0015;
    const groundX = (deltaX - deltaZ) * panScale;
    const groundZ = (deltaX + deltaZ) * panScale;

    this.target.x = THREE.MathUtils.clamp(this.target.x + groundX, -10, 10);
    this.target.z = THREE.MathUtils.clamp(this.target.z + groundZ, -10, 10);
  }

  private updateFrustum(): void {
    const aspect = window.innerWidth / window.innerHeight;
    this.camera.left = (-this.frustumSize * aspect) / 2;
    this.camera.right = (this.frustumSize * aspect) / 2;
    this.camera.top = this.frustumSize / 2;
    this.camera.bottom = -this.frustumSize / 2;
    this.camera.updateProjectionMatrix();
  }

  public setTarget(pos: THREE.Vector3, immediate: boolean = false): void {
    this.target.copy(pos);
    this.target.x = THREE.MathUtils.clamp(this.target.x, -10, 10);
    this.target.z = THREE.MathUtils.clamp(this.target.z, -10, 10);
    if (immediate) {
      this.currentTarget.copy(this.target);
      this.updateCameraPosition();
    }
  }

  private onScreenShake = (data: { intensity?: number; duration?: number } = {}): void => {
    this.shakeIntensity = data.intensity ?? 0.4;
    this.shakeDecay = data.duration ? this.shakeIntensity / data.duration : 1.5;
  };

  public update(delta: number): void {
    const lerpFactor = 1 - Math.exp(-8 * delta);
    this.currentTarget.lerp(this.target, lerpFactor);

    if (this.shakeIntensity > 0) {
      this.shakeIntensity = Math.max(0, this.shakeIntensity - this.shakeDecay * delta);
      this.shakeOffset.set(
        (Math.random() - 0.5) * 2 * this.shakeIntensity,
        (Math.random() - 0.5) * 2 * this.shakeIntensity,
        (Math.random() - 0.5) * 2 * this.shakeIntensity
      );
    } else {
      this.shakeOffset.set(0, 0, 0);
    }

    this.updateCameraPosition();
  }

  private updateCameraPosition(): void {
    const lookAtPos = this.currentTarget.clone().add(this.shakeOffset);
    this.camera.position.copy(lookAtPos).add(this.isoOffset);
    this.camera.lookAt(lookAtPos);
  }

  public dispose(): void {
    window.removeEventListener('resize', this.onResize);
  }
}
