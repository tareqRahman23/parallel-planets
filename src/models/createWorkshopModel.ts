import * as THREE from 'three';
import { Materials, COLORS } from './materials';

export interface WorkshopModelParts {
  root: THREE.Group;
  hammerArm: THREE.Group;
  sparksLight: THREE.PointLight;
  statusLight: THREE.Mesh;
  outputSlot1: THREE.Group;
  outputSlot2: THREE.Group;
}

export function createWorkshopModel(): WorkshopModelParts {
  const root = new THREE.Group();

  const woodMat = Materials.getStandard(COLORS.wood, 0.8, 0.1);
  const steelMat = Materials.getStandard(COLORS.armorSteel, 0.3, 0.7);
  const darkMetalMat = Materials.getStandard(COLORS.stoneDark, 0.6, 0.4);
  const orangeGlowMat = Materials.getEmissive(0xff6600, 0xff4400, 1.4);
  const cyanGlowMat = Materials.getEmissive(COLORS.techCyanGlow, COLORS.techCyanGlow, 1.4);
  const toolMat = Materials.getStandard(COLORS.armorHighlight, 0.2, 0.8);

  // 1. Heavy Stone / Steel Base Slab
  const slabGeo = new THREE.BoxGeometry(2.4, 0.3, 2.0);
  const slab = new THREE.Mesh(slabGeo, darkMetalMat);
  slab.position.y = 0.15;
  slab.receiveShadow = true;
  root.add(slab);

  // 2. Workbench Table
  const tableGeo = new THREE.BoxGeometry(2.0, 0.6, 1.2);
  const table = new THREE.Mesh(tableGeo, woodMat);
  table.position.set(0, 0.6, -0.2);
  table.castShadow = true;
  table.receiveShadow = true;
  root.add(table);

  // 3. Mini Forge / Furnace (Left side)
  const forgeGeo = new THREE.CylinderGeometry(0.35, 0.45, 0.8, 8);
  const forge = new THREE.Mesh(forgeGeo, darkMetalMat);
  forge.position.set(-0.7, 0.8, -0.2);
  forge.castShadow = true;
  root.add(forge);

  const forgeGlowGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 8);
  const forgeGlow = new THREE.Mesh(forgeGlowGeo, orangeGlowMat);
  forgeGlow.position.set(-0.7, 1.1, -0.2);
  root.add(forgeGlow);

  // 4. Anvil / Assembly Vise (Center)
  const anvilGeo = new THREE.BoxGeometry(0.35, 0.35, 0.5);
  const anvil = new THREE.Mesh(anvilGeo, steelMat);
  anvil.position.set(0, 1.05, -0.2);
  anvil.castShadow = true;
  root.add(anvil);

  // 5. Automated Hammer / Robotic Arm
  const hammerArm = new THREE.Group();
  hammerArm.position.set(0, 1.35, -0.2);
  root.add(hammerArm);

  const armGeo = new THREE.BoxGeometry(0.1, 0.4, 0.1);
  const arm = new THREE.Mesh(armGeo, steelMat);
  arm.position.y = 0.2;
  hammerArm.add(arm);

  const hammerHeadGeo = new THREE.BoxGeometry(0.25, 0.18, 0.2);
  const hammerHead = new THREE.Mesh(hammerHeadGeo, darkMetalMat);
  hammerHead.position.set(0, 0.4, 0);
  hammerArm.add(hammerHead);

  // 6. Tool Rack Wall (Back)
  const wallGeo = new THREE.BoxGeometry(2.0, 1.0, 0.1);
  const wall = new THREE.Mesh(wallGeo, woodMat);
  wall.position.set(0, 1.3, -0.75);
  wall.castShadow = true;
  root.add(wall);

  // Sword silhouette on wall
  const swordBladeGeo = new THREE.BoxGeometry(0.06, 0.6, 0.04);
  const swordBlade = new THREE.Mesh(swordBladeGeo, toolMat);
  swordBlade.position.set(-0.4, 1.35, -0.68);
  swordBlade.rotation.z = Math.PI / 4;
  root.add(swordBlade);

  // Gun silhouette on wall
  const gunBarrelGeo = new THREE.BoxGeometry(0.25, 0.08, 0.04);
  const gunBarrel = new THREE.Mesh(gunBarrelGeo, toolMat);
  gunBarrel.position.set(0.4, 1.35, -0.68);
  root.add(gunBarrel);

  // Status strip (cyan)
  const statusGeo = new THREE.BoxGeometry(1.8, 0.08, 0.06);
  const statusLight = new THREE.Mesh(statusGeo, cyanGlowMat);
  statusLight.position.set(0, 1.75, -0.7);
  root.add(statusLight);

  // 7. Output Table (Front)
  const outTableGeo = new THREE.BoxGeometry(1.4, 0.35, 0.5);
  const outTable = new THREE.Mesh(outTableGeo, steelMat);
  outTable.position.set(0, 0.35, 0.65);
  outTable.castShadow = true;
  root.add(outTable);

  const outputSlot1 = new THREE.Group();
  outputSlot1.position.set(-0.4, 0.6, 0.65);
  root.add(outputSlot1);

  const outputSlot2 = new THREE.Group();
  outputSlot2.position.set(0.4, 0.6, 0.65);
  root.add(outputSlot2);

  // Point light for sparks
  const sparksLight = new THREE.PointLight(0x79e4f2, 0, 4);
  sparksLight.position.set(0, 1.2, -0.1);
  root.add(sparksLight);

  return { root, hammerArm, sparksLight, statusLight, outputSlot1, outputSlot2 };
}
