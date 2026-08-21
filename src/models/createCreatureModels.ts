import * as THREE from 'three';
import { Materials, COLORS } from './materials';
import { GrowthStage } from '../creatures/CreatureData';
import { createPolyforkRabbit } from './polyforkAssets';

export interface CreatureModelParts {
  root: THREE.Group;
  body: THREE.Group;
  head: THREE.Group;
  leftEarOrHorn?: THREE.Object3D;
  rightEarOrHorn?: THREE.Object3D;
  leftFoot?: THREE.Group;
  rightFoot?: THREE.Group;
  frontLeftLeg?: THREE.Group;
  frontRightLeg?: THREE.Group;
  backLeftLeg?: THREE.Group;
  backRightLeg?: THREE.Group;
  visualRoot?: THREE.Group;
  armorGroup: THREE.Group;
  tuftsGroup?: THREE.Group;
  setStageAndArmor: (stage: GrowthStage, isArmored: boolean) => void;
}

export function createRabbitModelParts(): CreatureModelParts {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  // The bundled Polyfork rabbit gives the roster a much more expressive,
  // faceted silhouette while the hidden procedural rig remains the anchor for
  // our existing armor and status systems.
  const visualRoot = new THREE.Group();
  root.add(visualRoot);
  const polyforkRabbit = createPolyforkRabbit();
  polyforkRabbit.position.y = 0.02;
  visualRoot.add(polyforkRabbit);

  const furMat = Materials.getStandard(COLORS.rabbitFur, 0.6, 0.05);
  const furLightMat = Materials.getStandard(COLORS.rabbitFurLight, 0.6, 0.05);
  const earInnerMat = Materials.getStandard(COLORS.rabbitPink, 0.7, 0.0);
  const armorMat = Materials.getStandard(COLORS.armorSteel, 0.25, 0.8);
  const armorGoldMat = Materials.getStandard(COLORS.armorGold, 0.3, 0.7);
  const cyanGlowMat = Materials.getEmissive(COLORS.techCyanGlow, COLORS.techCyanGlow, 1.2);
  const eyeMat = Materials.getStandard(COLORS.black, 0.1, 0.9);

  // Body
  const bodyGeo = new THREE.SphereGeometry(0.38, 12, 10);
  bodyGeo.scale(1, 1.15, 0.9);
  const bodyMesh = new THREE.Mesh(bodyGeo, furMat);
  bodyMesh.position.y = 0.45;
  bodyMesh.castShadow = true;
  body.add(bodyMesh);

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

  // Stage 3 Tufts
  const tuftsGroup = new THREE.Group();
  tuftsGroup.visible = false;
  const tuftGeo = new THREE.ConeGeometry(0.08, 0.2, 4);
  const leftTuft = new THREE.Mesh(tuftGeo, furLightMat);
  leftTuft.rotation.z = Math.PI / 2.5;
  leftTuft.position.set(-0.32, -0.05, 0.1);
  tuftsGroup.add(leftTuft);
  const rightTuft = new THREE.Mesh(tuftGeo, furLightMat);
  rightTuft.rotation.z = -Math.PI / 2.5;
  rightTuft.position.set(0.32, -0.05, 0.1);
  tuftsGroup.add(rightTuft);
  head.add(tuftsGroup);

  // Ears
  const earGeo = new THREE.CylinderGeometry(0.06, 0.09, 0.55, 8);
  earGeo.scale(0.6, 1, 1.2);
  const earInnerGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.45, 8);
  earInnerGeo.scale(0.5, 1, 0.8);

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

  // Feet
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

  // --- Armor Group ---
  const armorGroup = new THREE.Group();
  armorGroup.visible = false;
  root.add(armorGroup);

  // Chest Armor Plate
  const chestPlateGeo = new THREE.CylinderGeometry(0.41, 0.41, 0.35, 10, 1, false, -Math.PI / 3, (2 * Math.PI) / 3);
  const chestPlate = new THREE.Mesh(chestPlateGeo, armorMat);
  chestPlate.position.set(0, 0.46, 0.02);
  chestPlate.castShadow = true;
  armorGroup.add(chestPlate);

  // Crest
  const crestGeo = new THREE.BoxGeometry(0.12, 0.12, 0.06);
  const crest = new THREE.Mesh(crestGeo, armorGoldMat);
  crest.position.set(0, 0.48, 0.42);
  armorGroup.add(crest);

  // Helmet on Head
  const helmetGroup = new THREE.Group();
  helmetGroup.position.set(0, 0.85, 0.05);
  armorGroup.add(helmetGroup);

  const helmetGeo = new THREE.SphereGeometry(0.36, 12, 10, 0, Math.PI * 2, 0, Math.PI / 1.7);
  const helmet = new THREE.Mesh(helmetGeo, armorMat);
  helmet.position.set(0, 0.06, -0.02);
  helmet.castShadow = true;
  helmetGroup.add(helmet);

  const helmetCrestGeo = new THREE.BoxGeometry(0.08, 0.16, 0.4);
  const helmetCrest = new THREE.Mesh(helmetCrestGeo, armorGoldMat);
  helmetCrest.position.set(0, 0.38, -0.02);
  helmetGroup.add(helmetCrest);

  const wingGeo = new THREE.ConeGeometry(0.05, 0.18, 5);
  const leftWing = new THREE.Mesh(wingGeo, cyanGlowMat);
  leftWing.rotation.z = Math.PI / 3;
  leftWing.position.set(-0.36, 0.15, 0);
  helmetGroup.add(leftWing);
  const rightWing = new THREE.Mesh(wingGeo, cyanGlowMat);
  rightWing.rotation.z = -Math.PI / 3;
  rightWing.position.set(0.36, 0.15, 0);
  helmetGroup.add(rightWing);

  const setStageAndArmor = (stage: GrowthStage, isArmored: boolean) => {
    let scale = 0.82;
    if (stage === 2) scale = 0.96;
    if (stage === 3) scale = 1.18;

    root.scale.set(scale, scale, scale);
    tuftsGroup.visible = stage === 3;
    armorGroup.visible = isArmored;
  };

  // The external model is the visible base creature. The procedural meshes
  // still supply stable attachment points for armor and game-state effects.
  body.visible = false;
  leftFoot.visible = false;
  rightFoot.visible = false;

  return {
    root,
    body,
    head,
    leftEarOrHorn: leftEar,
    rightEarOrHorn: rightEar,
    leftFoot,
    rightFoot,
    visualRoot,
    armorGroup,
    tuftsGroup,
    setStageAndArmor,
  };
}

export function createBullModelParts(): CreatureModelParts {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const hideMat = Materials.getStandard(COLORS.soil, 0.7, 0.1);
  const darkHideMat = Materials.getStandard(COLORS.soilDark, 0.8, 0.1);
  const hornMat = Materials.getStandard(COLORS.straw, 0.4, 0.2);
  const armorMat = Materials.getStandard(COLORS.armorSteel, 0.25, 0.8);
  const armorPlateMat = Materials.getStandard(COLORS.techBlueDark, 0.3, 0.6);
  const cyanGlowMat = Materials.getEmissive(COLORS.techCyanGlow, COLORS.techCyanGlow, 1.2);
  const eyeMat = Materials.getStandard(COLORS.black, 0.1, 0.9);

  // Main Torso / Shoulders
  const torsoGeo = new THREE.BoxGeometry(0.9, 0.9, 1.4);
  const torsoMesh = new THREE.Mesh(torsoGeo, hideMat);
  torsoMesh.position.y = 0.8;
  torsoMesh.castShadow = true;
  body.add(torsoMesh);

  // Back Hump / Ridge
  const humpGeo = new THREE.BoxGeometry(0.75, 0.45, 0.8);
  const humpMesh = new THREE.Mesh(humpGeo, darkHideMat);
  humpMesh.position.set(0, 1.35, 0.15);
  humpMesh.castShadow = true;
  body.add(humpMesh);

  // Head
  const head = new THREE.Group();
  head.position.set(0, 1.1, 0.85);
  body.add(head);

  const headGeo = new THREE.BoxGeometry(0.65, 0.65, 0.7);
  const headMesh = new THREE.Mesh(headGeo, hideMat);
  headMesh.castShadow = true;
  head.add(headMesh);

  // Muzzle
  const muzzleGeo = new THREE.BoxGeometry(0.5, 0.35, 0.35);
  const muzzle = new THREE.Mesh(muzzleGeo, darkHideMat);
  muzzle.position.set(0, -0.15, 0.45);
  head.add(muzzle);

  // Eyes
  const eyeGeo = new THREE.SphereGeometry(0.06, 8, 8);
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(-0.34, 0.1, 0.15);
  head.add(leftEye);
  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.position.set(0.34, 0.1, 0.15);
  head.add(rightEye);

  // Horns
  const hornGroup = new THREE.Group();
  head.add(hornGroup);

  const hornGeo = new THREE.ConeGeometry(0.12, 0.55, 6);
  const leftHorn = new THREE.Mesh(hornGeo, hornMat);
  leftHorn.rotation.z = Math.PI / 3;
  leftHorn.rotation.x = -Math.PI / 6;
  leftHorn.position.set(-0.45, 0.35, 0);
  leftHorn.castShadow = true;
  hornGroup.add(leftHorn);

  const rightHorn = new THREE.Mesh(hornGeo, hornMat);
  rightHorn.rotation.z = -Math.PI / 3;
  rightHorn.rotation.x = -Math.PI / 6;
  rightHorn.position.set(0.45, 0.35, 0);
  rightHorn.castShadow = true;
  hornGroup.add(rightHorn);

  // 4 Legs
  const legGeo = new THREE.BoxGeometry(0.24, 0.65, 0.26);

  const frontLeftLeg = new THREE.Group();
  frontLeftLeg.position.set(-0.35, 0.32, 0.45);
  const flMesh = new THREE.Mesh(legGeo, darkHideMat);
  flMesh.castShadow = true;
  frontLeftLeg.add(flMesh);
  root.add(frontLeftLeg);

  const frontRightLeg = new THREE.Group();
  frontRightLeg.position.set(0.35, 0.32, 0.45);
  const frMesh = new THREE.Mesh(legGeo, darkHideMat);
  frMesh.castShadow = true;
  frontRightLeg.add(frMesh);
  root.add(frontRightLeg);

  const backLeftLeg = new THREE.Group();
  backLeftLeg.position.set(-0.35, 0.32, -0.45);
  const blMesh = new THREE.Mesh(legGeo, darkHideMat);
  blMesh.castShadow = true;
  backLeftLeg.add(blMesh);
  root.add(backLeftLeg);

  const backRightLeg = new THREE.Group();
  backRightLeg.position.set(0.35, 0.32, -0.45);
  const brMesh = new THREE.Mesh(legGeo, darkHideMat);
  brMesh.castShadow = true;
  backRightLeg.add(brMesh);
  root.add(backRightLeg);

  // --- Armor Group ---
  const armorGroup = new THREE.Group();
  armorGroup.visible = false;
  root.add(armorGroup);

  // Forehead Steel Plate
  const foreheadPlateGeo = new THREE.BoxGeometry(0.45, 0.5, 0.1);
  const foreheadPlate = new THREE.Mesh(foreheadPlateGeo, armorMat);
  foreheadPlate.position.set(0, 1.25, 1.22);
  armorGroup.add(foreheadPlate);

  // Cyan Power Rivet on forehead
  const rivetGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.12, 6);
  const rivet = new THREE.Mesh(rivetGeo, cyanGlowMat);
  rivet.rotation.x = Math.PI / 2;
  rivet.position.set(0, 1.3, 1.28);
  armorGroup.add(rivet);

  // Broad Chest Plate
  const chestPlateGeo = new THREE.BoxGeometry(1.0, 0.65, 0.2);
  const chestPlate = new THREE.Mesh(chestPlateGeo, armorMat);
  chestPlate.position.set(0, 0.85, 0.72);
  chestPlate.castShadow = true;
  armorGroup.add(chestPlate);

  // Shoulder Guards
  const shoulderGeo = new THREE.BoxGeometry(0.2, 0.5, 0.7);
  const leftShoulder = new THREE.Mesh(shoulderGeo, armorPlateMat);
  leftShoulder.position.set(-0.52, 1.0, 0.2);
  armorGroup.add(leftShoulder);

  const rightShoulder = new THREE.Mesh(shoulderGeo, armorPlateMat);
  rightShoulder.position.set(0.52, 1.0, 0.2);
  armorGroup.add(rightShoulder);

  const setStageAndArmor = (stage: GrowthStage, isArmored: boolean) => {
    let scale = 0.9;
    if (stage === 2) scale = 1.1;
    if (stage === 3) scale = 1.35;

    root.scale.set(scale, scale, scale);
    hornGroup.scale.set(stage === 1 ? 0.7 : stage === 2 ? 1.0 : 1.4, stage === 1 ? 0.7 : stage === 2 ? 1.0 : 1.4, stage === 1 ? 0.7 : stage === 2 ? 1.0 : 1.4);
    armorGroup.visible = isArmored;
  };

  return {
    root,
    body,
    head,
    leftEarOrHorn: leftHorn,
    rightEarOrHorn: rightHorn,
    frontLeftLeg,
    frontRightLeg,
    backLeftLeg,
    backRightLeg,
    visualRoot: body,
    armorGroup,
    setStageAndArmor,
  };
}
