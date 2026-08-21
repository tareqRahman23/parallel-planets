import * as THREE from 'three';
import { Materials, COLORS } from './materials';

export interface RabbitModelParts {
  root: THREE.Group;
  body: THREE.Group;
  head: THREE.Group;
  leftEar: THREE.Group;
  rightEar: THREE.Group;
  leftFoot: THREE.Group;
  rightFoot: THREE.Group;
}

export function createRabbitModel(): RabbitModelParts {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  // Materials
  const furMat = Materials.getStandard(COLORS.rabbitFur, 0.6, 0.05);
  const furLightMat = Materials.getStandard(COLORS.rabbitFurLight, 0.6, 0.05);
  const earInnerMat = Materials.getStandard(COLORS.rabbitPink, 0.7, 0.0);
  const armorMat = Materials.getStandard(COLORS.armorSteel, 0.25, 0.8);
  const armorGoldMat = Materials.getStandard(COLORS.armorGold, 0.3, 0.7);
  const cyanGlowMat = Materials.getEmissive(COLORS.techCyanGlow, COLORS.techCyanGlow, 1.0);
  const eyeMat = Materials.getStandard(COLORS.black, 0.1, 0.9);

  // Body (Plump Egg/Sphere)
  const bodyGeo = new THREE.SphereGeometry(0.38, 12, 10);
  bodyGeo.scale(1, 1.15, 0.9);
  const bodyMesh = new THREE.Mesh(bodyGeo, furMat);
  bodyMesh.position.y = 0.45;
  bodyMesh.castShadow = true;
  body.add(bodyMesh);

  // Chest Armor Plate
  const chestPlateGeo = new THREE.CylinderGeometry(0.39, 0.39, 0.35, 10, 1, false, -Math.PI / 3, (2 * Math.PI) / 3);
  const chestPlate = new THREE.Mesh(chestPlateGeo, armorMat);
  chestPlate.position.set(0, 0.46, 0.02);
  chestPlate.castShadow = true;
  body.add(chestPlate);

  // Armor emblem (Golden star/crest)
  const crestGeo = new THREE.BoxGeometry(0.12, 0.12, 0.06);
  const crest = new THREE.Mesh(crestGeo, armorGoldMat);
  crest.position.set(0, 0.48, 0.4);
  body.add(crest);

  // Tail
  const tailGeo = new THREE.SphereGeometry(0.12, 8, 8);
  const tail = new THREE.Mesh(tailGeo, furLightMat);
  tail.position.set(0, 0.3, -0.38);
  tail.castShadow = true;
  body.add(tail);

  // Head Group
  const head = new THREE.Group();
  head.position.set(0, 0.85, 0.05);
  body.add(head);

  // Head base
  const headGeo = new THREE.SphereGeometry(0.32, 12, 10);
  const headMesh = new THREE.Mesh(headGeo, furMat);
  headMesh.castShadow = true;
  head.add(headMesh);

  // Snout / Cheeks
  const snoutGeo = new THREE.SphereGeometry(0.14, 8, 8);
  snoutGeo.scale(1.2, 0.8, 1);
  const snout = new THREE.Mesh(snoutGeo, furLightMat);
  snout.position.set(0, -0.06, 0.22);
  head.add(snout);

  // Nose
  const noseGeo = new THREE.SphereGeometry(0.04, 6, 6);
  const nose = new THREE.Mesh(noseGeo, earInnerMat);
  nose.position.set(0, -0.02, 0.34);
  head.add(nose);

  // Eyes
  const eyeGeo = new THREE.SphereGeometry(0.05, 8, 8);
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(-0.14, 0.04, 0.26);
  head.add(leftEye);
  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.position.set(0.14, 0.04, 0.26);
  head.add(rightEye);

  // Steel Helmet
  const helmetGeo = new THREE.SphereGeometry(0.36, 12, 10, 0, Math.PI * 2, 0, Math.PI / 1.7);
  const helmet = new THREE.Mesh(helmetGeo, armorMat);
  helmet.position.set(0, 0.06, -0.02);
  helmet.castShadow = true;
  head.add(helmet);

  // Helmet Crest
  const helmetCrestGeo = new THREE.BoxGeometry(0.08, 0.16, 0.4);
  const helmetCrest = new THREE.Mesh(helmetCrestGeo, armorGoldMat);
  helmetCrest.position.set(0, 0.38, -0.02);
  head.add(helmetCrest);

  // Small Glowing Visor Wing Accents
  const wingGeo = new THREE.ConeGeometry(0.05, 0.18, 5);
  const leftWing = new THREE.Mesh(wingGeo, cyanGlowMat);
  leftWing.rotation.z = Math.PI / 3;
  leftWing.position.set(-0.35, 0.15, 0);
  head.add(leftWing);
  const rightWing = new THREE.Mesh(wingGeo, cyanGlowMat);
  rightWing.rotation.z = -Math.PI / 3;
  rightWing.position.set(0.35, 0.15, 0);
  head.add(rightWing);

  // Ears
  const earGeo = new THREE.CylinderGeometry(0.06, 0.09, 0.55, 8);
  earGeo.scale(0.6, 1, 1.2);
  const earInnerGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.45, 8);
  earInnerGeo.scale(0.5, 1, 0.8);

  // Left Ear
  const leftEar = new THREE.Group();
  leftEar.position.set(-0.16, 0.35, -0.05);
  leftEar.rotation.z = 0.25;
  leftEar.rotation.x = -0.15;
  const leftEarMesh = new THREE.Mesh(earGeo, furMat);
  leftEarMesh.position.y = 0.25;
  leftEarMesh.castShadow = true;
  leftEar.add(leftEarMesh);
  const leftEarInner = new THREE.Mesh(earInnerGeo, earInnerMat);
  leftEarInner.position.set(0, 0.22, 0.04);
  leftEar.add(leftEarInner);
  head.add(leftEar);

  // Right Ear
  const rightEar = new THREE.Group();
  rightEar.position.set(0.16, 0.35, -0.05);
  rightEar.rotation.z = -0.25;
  rightEar.rotation.x = -0.15;
  const rightEarMesh = new THREE.Mesh(earGeo, furMat);
  rightEarMesh.position.y = 0.25;
  rightEarMesh.castShadow = true;
  rightEar.add(rightEarMesh);
  const rightEarInner = new THREE.Mesh(earInnerGeo, earInnerMat);
  rightEarInner.position.set(0, 0.22, 0.04);
  rightEar.add(rightEarInner);
  head.add(rightEar);

  // Feet / Legs
  const footGeo = new THREE.BoxGeometry(0.16, 0.12, 0.32);

  const leftFoot = new THREE.Group();
  leftFoot.position.set(-0.24, 0.06, 0.05);
  const leftFootMesh = new THREE.Mesh(footGeo, furMat);
  leftFootMesh.castShadow = true;
  leftFoot.add(leftFootMesh);
  root.add(leftFoot);

  const rightFoot = new THREE.Group();
  rightFoot.position.set(0.24, 0.06, 0.05);
  const rightFootMesh = new THREE.Mesh(footGeo, furMat);
  rightFootMesh.castShadow = true;
  rightFoot.add(rightFootMesh);
  root.add(rightFoot);

  return { root, body, head, leftEar, rightEar, leftFoot, rightFoot };
}
