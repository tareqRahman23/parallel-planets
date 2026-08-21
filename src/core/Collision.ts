import * as THREE from 'three';

export interface CircleCollider {
  x: number;
  z: number;
  radius: number;
}

export class Collision {
  /**
   * Clamps a position vector inside a circular boundary
   */
  static clampToCircle(pos: THREE.Vector3, maxRadius: number): void {
    const distSq = pos.x * pos.x + pos.z * pos.z;
    if (distSq > maxRadius * maxRadius) {
      const dist = Math.sqrt(distSq);
      pos.x = (pos.x / dist) * maxRadius;
      pos.z = (pos.z / dist) * maxRadius;
    }
  }

  /**
   * Pushes pos out of static obstacle circle if overlapping
   */
  static resolveCircleObstacle(pos: THREE.Vector3, entityRadius: number, obstacle: CircleCollider): void {
    const dx = pos.x - obstacle.x;
    const dz = pos.z - obstacle.z;
    const minDist = entityRadius + obstacle.radius;
    const distSq = dx * dx + dz * dz;

    if (distSq < minDist * minDist && distSq > 0.0001) {
      const dist = Math.sqrt(distSq);
      const overlap = minDist - dist;
      pos.x += (dx / dist) * overlap;
      pos.z += (dz / dist) * overlap;
    }
  }

  /**
   * Check 2D distance between two Vector3s on the XZ plane
   */
  static distanceXZ(a: THREE.Vector3, b: THREE.Vector3): number {
    const dx = a.x - b.x;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }
}
