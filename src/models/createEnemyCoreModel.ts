import * as THREE from 'three';
import { Materials, COLORS } from './materials';

export interface EnemyCoreModelParts {
  root: THREE.Group;
  crystal: THREE.Mesh;
  ring1: THREE.Mesh;
  ring2: THREE.Mesh;
  shield: THREE.Mesh;
  light: THREE.PointLight;
  setShieldActive(active: boolean): void;
  update(delta: number, healthRatio: number): void;
}

export function createEnemyCoreModel(): EnemyCoreModelParts {
  const root = new THREE.Group();

  // Materials
  const pedestalMat = Materials.getStandard(COLORS.enemyDark, 0.6, 0.4, true);
  const ringMat = Materials.getStandard(COLORS.armorSteel, 0.3, 0.8);
  const crystalMat = Materials.getEmissive(COLORS.enemyRed, COLORS.enemyEmissive, 1.8);
  const shieldMat = Materials.getTransparent(COLORS.coreShield, 0.35, COLORS.coreShield);

  // 1. Pedestal Base
  const baseGeo = new THREE.CylinderGeometry(1.8, 2.2, 0.8, 8);
  const base = new THREE.Mesh(baseGeo, pedestalMat);
  base.position.y = 0.4;
  base.receiveShadow = true;
  base.castShadow = true;
  root.add(base);

  // Pylon Columns
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const pylonGeo = new THREE.BoxGeometry(0.35, 1.2, 0.35);
    const pylon = new THREE.Mesh(pylonGeo, pedestalMat);
    pylon.position.set(Math.cos(angle) * 1.5, 1.2, Math.sin(angle) * 1.5);
    pylon.castShadow = true;
    root.add(pylon);
  }

  // 2. Floating Crimson Crystal
  const crystalGeo = new THREE.OctahedronGeometry(1.0, 0);
  crystalGeo.scale(0.8, 1.4, 0.8);
  const crystal = new THREE.Mesh(crystalGeo, crystalMat);
  crystal.position.y = 2.2;
  crystal.castShadow = true;
  root.add(crystal);

  // 3. Counter-Rotating Gyro Rings
  const ring1Geo = new THREE.TorusGeometry(1.4, 0.08, 6, 24);
  const ring1 = new THREE.Mesh(ring1Geo, ringMat);
  ring1.position.y = 2.2;
  root.add(ring1);

  const ring2Geo = new THREE.TorusGeometry(1.7, 0.08, 6, 24);
  const ring2 = new THREE.Mesh(ring2Geo, ringMat);
  ring2.position.y = 2.2;
  ring2.rotation.x = Math.PI / 4;
  root.add(ring2);

  // 4. Translucent Protective Shield Sphere
  const shieldGeo = new THREE.SphereGeometry(2.3, 16, 12);
  const shield = new THREE.Mesh(shieldGeo, shieldMat);
  shield.position.y = 2.2;
  root.add(shield);

  // 5. Red Energy Point Light
  const light = new THREE.PointLight(COLORS.enemyEmissive, 2.5, 14);
  light.position.set(0, 2.4, 0);
  root.add(light);

  let timeAccumulator = 0;

  const setShieldActive = (active: boolean) => {
    shield.visible = active;
  };

  const update = (delta: number, healthRatio: number) => {
    timeAccumulator += delta;
    const speedMult = 1.0 + (1.0 - healthRatio) * 2.5;

    // Rotate crystal and rings
    crystal.rotation.y += delta * 1.2 * speedMult;
    crystal.position.y = 2.2 + Math.sin(timeAccumulator * 2.5) * 0.15;

    ring1.rotation.x += delta * 1.8 * speedMult;
    ring1.rotation.y += delta * 0.9 * speedMult;

    ring2.rotation.y -= delta * 2.2 * speedMult;
    ring2.rotation.z += delta * 1.1 * speedMult;

    if (shield.visible) {
      shield.rotation.y += delta * 0.5;
      const pulse = 1.0 + Math.sin(timeAccumulator * 4.0) * 0.03;
      shield.scale.set(pulse, pulse, pulse);
    }

    // Light instability as health drops
    const flicker = 1.0 + (1.0 - healthRatio) * (Math.random() - 0.5) * 0.8;
    light.intensity = 2.5 * flicker;
  };

  return { root, crystal, ring1, ring2, shield, light, setShieldActive, update };
}
