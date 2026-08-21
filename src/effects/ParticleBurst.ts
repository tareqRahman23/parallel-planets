import * as THREE from 'three';
import { Materials, COLORS } from '../models/materials';

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  rotationSpeed: THREE.Vector3;
  initialScale: number;
}

export class ParticleBurst {
  private group: THREE.Group = new THREE.Group();
  private particles: Particle[] = [];
  private pool: THREE.Mesh[] = [];

  constructor(parent: THREE.Group) {
    parent.add(this.group);
  }

  private getPooledMesh(color: number, size: number = 0.1): THREE.Mesh {
    let mesh = this.pool.pop();
    if (!mesh) {
      const geo = new THREE.DodecahedronGeometry(1, 0);
      const mat = Materials.getStandard(color, 0.6, 0.2, true);
      mesh = new THREE.Mesh(geo, mat);
    } else {
      (mesh.material as THREE.MeshStandardMaterial).color.setHex(color);
    }
    mesh.scale.set(size, size, size);
    mesh.visible = true;
    this.group.add(mesh);
    return mesh;
  }

  public emit(options: {
    origin: THREE.Vector3;
    count?: number;
    color?: number;
    size?: number;
    speed?: number;
    life?: number;
    gravity?: number;
    upwardBias?: number;
  }): void {
    const count = options.count ?? 8;
    const color = options.color ?? COLORS.stone;
    const size = options.size ?? 0.12;
    const speed = options.speed ?? 3.5;
    const life = options.life ?? 0.6;
    const upward = options.upwardBias ?? 2.5;

    for (let i = 0; i < count; i++) {
      const mesh = this.getPooledMesh(color, size);
      mesh.position.copy(options.origin);

      const angle = Math.random() * Math.PI * 2;
      const horizSpeed = (0.4 + Math.random() * 0.6) * speed;
      const velocity = new THREE.Vector3(
        Math.cos(angle) * horizSpeed,
        Math.random() * speed + upward,
        Math.sin(angle) * horizSpeed
      );

      const rotationSpeed = new THREE.Vector3(
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 12
      );

      this.particles.push({
        mesh,
        velocity,
        life,
        maxLife: life,
        rotationSpeed,
        initialScale: size,
      });
    }
  }

  public emitRockChips(origin: THREE.Vector3): void {
    this.emit({
      origin,
      count: 10,
      color: COLORS.stoneHighlight,
      size: 0.14,
      speed: 3.2,
      life: 0.55,
      upwardBias: 2.8,
    });
  }

  public emitLeaves(origin: THREE.Vector3): void {
    this.emit({
      origin,
      count: 12,
      color: COLORS.leafGreenLight,
      size: 0.12,
      speed: 2.8,
      life: 0.7,
      upwardBias: 3.2,
    });
  }

  public emitSparks(origin: THREE.Vector3): void {
    this.emit({
      origin,
      count: 14,
      color: 0xffcc00,
      size: 0.08,
      speed: 4.5,
      life: 0.45,
      upwardBias: 3.0,
    });
  }

  public emitHit(origin: THREE.Vector3, isEnemy: boolean = false): void {
    this.emit({
      origin,
      count: 8,
      color: isEnemy ? COLORS.enemyEmissive : COLORS.techCyanGlow,
      size: 0.1,
      speed: 4.0,
      life: 0.4,
      upwardBias: 1.5,
    });
  }

  public emitExplosion(origin: THREE.Vector3): void {
    this.emit({
      origin,
      count: 36,
      color: COLORS.enemyEmissive,
      size: 0.22,
      speed: 7.0,
      life: 1.1,
      upwardBias: 5.0,
    });
    this.emit({
      origin,
      count: 24,
      color: COLORS.enemyDark,
      size: 0.35,
      speed: 5.0,
      life: 1.3,
      upwardBias: 3.5,
    });
  }

  public update(delta: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta;

      if (p.life <= 0) {
        p.mesh.visible = false;
        this.group.remove(p.mesh);
        this.pool.push(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }

      // Physics integration
      p.velocity.y -= 9.8 * delta; // Gravity
      p.mesh.position.addScaledVector(p.velocity, delta);

      // Floor bounce clamp
      if (p.mesh.position.y < 0.05) {
        p.mesh.position.y = 0.05;
        p.velocity.y = -p.velocity.y * 0.35;
        p.velocity.x *= 0.7;
        p.velocity.z *= 0.7;
      }

      // Rotation & Shrink
      p.mesh.rotation.x += p.rotationSpeed.x * delta;
      p.mesh.rotation.y += p.rotationSpeed.y * delta;
      p.mesh.rotation.z += p.rotationSpeed.z * delta;

      const progress = p.life / p.maxLife;
      const currentScale = p.initialScale * Math.min(1, progress * 1.5);
      p.mesh.scale.set(currentScale, currentScale, currentScale);
    }
  }

  public dispose(): void {
    this.particles.forEach((p) => {
      this.group.remove(p.mesh);
      p.mesh.geometry.dispose();
    });
    this.pool.forEach((mesh) => {
      mesh.geometry.dispose();
    });
    this.particles = [];
    this.pool = [];
    if (this.group.parent) {
      this.group.parent.remove(this.group);
    }
  }
}
