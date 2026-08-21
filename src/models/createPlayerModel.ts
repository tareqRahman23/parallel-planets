import * as THREE from 'three';
import { Materials, COLORS } from './materials';

export interface PlayerModelParts {
  root: THREE.Group;
  body: THREE.Group;
  head: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  tool: THREE.Group;
}

export function createPlayerModel(): PlayerModelParts {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  // Materials
  const suitMat = Materials.getStandard(COLORS.playerSuit, 0.4, 0.1);
  const suitWhiteMat = Materials.getStandard(COLORS.playerWhite, 0.5, 0.05);
  const visorMat = Materials.getStandard(COLORS.playerVisor, 0.1, 0.9);
  const backpackMat = Materials.getStandard(COLORS.playerBackpack, 0.4, 0.2);
  const darkMat = Materials.getStandard(COLORS.enemyDark, 0.7, 0.2);
  const toolMat = Materials.getStandard(COLORS.armorSteel, 0.3, 0.7);
  const toolGlowMat = Materials.getEmissive(COLORS.techCyanGlow, COLORS.techCyanGlow, 1.2);

  // Torso
  const torsoGeo = new THREE.CylinderGeometry(0.32, 0.28, 0.65, 8);
  const torso = new THREE.Mesh(torsoGeo, suitMat);
  torso.position.y = 0.65;
  torso.castShadow = true;
  body.add(torso);

  // Belt / Details
  const beltGeo = new THREE.CylinderGeometry(0.33, 0.33, 0.12, 8);
  const belt = new THREE.Mesh(beltGeo, darkMat);
  belt.position.y = 0.42;
  body.add(belt);

  // Chest emblem
  const chestGeo = new THREE.BoxGeometry(0.24, 0.2, 0.1);
  const chest = new THREE.Mesh(chestGeo, suitWhiteMat);
  chest.position.set(0, 0.72, 0.26);
  body.add(chest);

  // Backpack Canister
  const backpackGeo = new THREE.BoxGeometry(0.38, 0.45, 0.2);
  const backpack = new THREE.Mesh(backpackGeo, backpackMat);
  backpack.position.set(0, 0.7, -0.25);
  backpack.castShadow = true;
  body.add(backpack);

  // Backpack cylinders
  const tankGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.48, 8);
  const tankL = new THREE.Mesh(tankGeo, toolMat);
  tankL.position.set(-0.1, 0.7, -0.32);
  body.add(tankL);
  const tankR = new THREE.Mesh(tankGeo, toolMat);
  tankR.position.set(0.1, 0.7, -0.32);
  body.add(tankR);

  // Head
  const head = new THREE.Group();
  head.position.y = 1.15;
  body.add(head);

  const helmetGeo = new THREE.SphereGeometry(0.35, 12, 10);
  const helmet = new THREE.Mesh(helmetGeo, suitMat);
  helmet.castShadow = true;
  head.add(helmet);

  const visorGeo = new THREE.SphereGeometry(0.26, 12, 10, 0, Math.PI, 0, Math.PI);
  const visor = new THREE.Mesh(visorGeo, visorMat);
  visor.rotation.x = Math.PI / 2;
  visor.position.set(0, 0.02, 0.16);
  head.add(visor);

  // Helmet antenna
  const antennaGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.2, 6);
  const antenna = new THREE.Mesh(antennaGeo, toolMat);
  antenna.position.set(0.24, 0.3, 0);
  antenna.rotation.z = -0.3;
  head.add(antenna);
  const antennaTipGeo = new THREE.SphereGeometry(0.04, 6, 6);
  const antennaTip = new THREE.Mesh(antennaTipGeo, toolGlowMat);
  antennaTip.position.set(0.29, 0.38, 0);
  head.add(antennaTip);

  // Limbs
  const armGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.42, 8);
  const handGeo = new THREE.SphereGeometry(0.1, 8, 8);

  // Left Arm
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.4, 0.82, 0);
  const leftArmMesh = new THREE.Mesh(armGeo, suitMat);
  leftArmMesh.position.y = -0.2;
  leftArmMesh.castShadow = true;
  leftArm.add(leftArmMesh);
  const leftHand = new THREE.Mesh(handGeo, suitWhiteMat);
  leftHand.position.y = -0.4;
  leftArm.add(leftHand);
  body.add(leftArm);

  // Right Arm (holds tool)
  const rightArm = new THREE.Group();
  rightArm.position.set(0.4, 0.82, 0);
  const rightArmMesh = new THREE.Mesh(armGeo, suitMat);
  rightArmMesh.position.y = -0.2;
  rightArmMesh.castShadow = true;
  rightArm.add(rightArmMesh);
  const rightHand = new THREE.Mesh(handGeo, suitWhiteMat);
  rightHand.position.y = -0.4;
  rightArm.add(rightHand);

  // Tool
  const tool = new THREE.Group();
  tool.position.set(0, -0.42, 0.15);
  tool.rotation.x = Math.PI / 3;

  const handleGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.55, 6);
  const handle = new THREE.Mesh(handleGeo, darkMat);
  tool.add(handle);

  const headPickGeo = new THREE.BoxGeometry(0.12, 0.15, 0.35);
  const pickHead = new THREE.Mesh(headPickGeo, toolMat);
  pickHead.position.set(0, 0.25, 0.05);
  tool.add(pickHead);

  const emitterGeo = new THREE.ConeGeometry(0.06, 0.18, 6);
  const emitter = new THREE.Mesh(emitterGeo, toolGlowMat);
  emitter.rotation.x = -Math.PI / 2;
  emitter.position.set(0, 0.25, 0.26);
  tool.add(emitter);

  rightArm.add(tool);
  body.add(rightArm);

  // Legs
  const legGeo = new THREE.CylinderGeometry(0.11, 0.09, 0.45, 8);
  const bootGeo = new THREE.BoxGeometry(0.18, 0.14, 0.25);

  // Left Leg
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.18, 0.4, 0);
  const leftLegMesh = new THREE.Mesh(legGeo, suitMat);
  leftLegMesh.position.y = -0.2;
  leftLegMesh.castShadow = true;
  leftLeg.add(leftLegMesh);
  const leftBoot = new THREE.Mesh(bootGeo, darkMat);
  leftBoot.position.set(0, -0.4, 0.04);
  leftBoot.castShadow = true;
  leftLeg.add(leftBoot);
  root.add(leftLeg);

  // Right Leg
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.18, 0.4, 0);
  const rightLegMesh = new THREE.Mesh(legGeo, suitMat);
  rightLegMesh.position.y = -0.2;
  rightLegMesh.castShadow = true;
  rightLeg.add(rightLegMesh);
  const rightBoot = new THREE.Mesh(bootGeo, darkMat);
  rightBoot.position.set(0, -0.4, 0.04);
  rightBoot.castShadow = true;
  rightLeg.add(rightBoot);
  root.add(rightLeg);

  return { root, body, head, leftArm, rightArm, leftLeg, rightLeg, tool };
}
