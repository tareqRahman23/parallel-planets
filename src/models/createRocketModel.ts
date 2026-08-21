import * as THREE from 'three';
import { Materials, COLORS } from './materials';

export interface RocketModelParts {
  root: THREE.Group;
  rocketBody: THREE.Group;
  damagedHull: THREE.Mesh;
  repairedHull: THREE.Mesh;
  glowRings: THREE.Mesh;
  engineFire: THREE.Group;
  cargoLevel1Pods: THREE.Group;
  cargoLevel2Pods: THREE.Group;
  setRepaired(repaired: boolean): void;
  setLaunching(launching: boolean): void;
  setCargoLevel(level: 0 | 1 | 2): void;
}

export function createRocketModel(): RocketModelParts {
  const root = new THREE.Group();

  // Materials
  const padMat = Materials.getStandard(COLORS.stoneDark, 0.7, 0.4);
  const hazardMat = Materials.getStandard(COLORS.armorGold, 0.5, 0.2);
  const creamMat = Materials.getStandard(COLORS.rocketCream, 0.35, 0.15);
  const redMat = Materials.getStandard(COLORS.rocketRed, 0.35, 0.2);
  const darkHullMat = Materials.getStandard(COLORS.rocketDark, 0.8, 0.3);
  const metalMat = Materials.getStandard(COLORS.armorSteel, 0.3, 0.8);
  const windowMat = Materials.getStandard(COLORS.playerVisor, 0.1, 0.9);
  const glowMat = Materials.getEmissive(COLORS.techCyanGlow, COLORS.techCyanGlow, 1.4);
  const fireMat = Materials.getEmissive(0xff5500, 0xffaa00, 2.5);

  // 1. Launchpad Base
  const padGeo = new THREE.CylinderGeometry(2.2, 2.4, 0.3, 12);
  const pad = new THREE.Mesh(padGeo, padMat);
  pad.position.y = 0.15;
  pad.receiveShadow = true;
  root.add(pad);

  // Launchpad yellow hazard rim
  const rimGeo = new THREE.TorusGeometry(2.1, 0.08, 6, 24);
  const rim = new THREE.Mesh(rimGeo, hazardMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.3;
  root.add(rim);

  // 2. Rocket Fuselage Group
  const rocketBody = new THREE.Group();
  rocketBody.position.y = 0.3;
  root.add(rocketBody);

  // Engine Nozzle
  const nozzleGeo = new THREE.CylinderGeometry(0.5, 0.8, 0.6, 12);
  const nozzle = new THREE.Mesh(nozzleGeo, metalMat);
  nozzle.position.y = 0.4;
  nozzle.castShadow = true;
  rocketBody.add(nozzle);

  // Main Cream Fuselage Cylinder
  const bodyGeo = new THREE.CylinderGeometry(0.85, 0.9, 3.2, 14);
  const mainHull = new THREE.Mesh(bodyGeo, creamMat);
  mainHull.position.y = 2.2;
  mainHull.castShadow = true;
  rocketBody.add(mainHull);

  // Damaged hull panel
  const damagedPanelGeo = new THREE.BoxGeometry(0.7, 1.1, 0.2);
  const damagedHull = new THREE.Mesh(damagedPanelGeo, darkHullMat);
  damagedHull.position.set(0.6, 2.0, 0.6);
  damagedHull.rotation.y = 0.4;
  damagedHull.castShadow = true;
  rocketBody.add(damagedHull);

  // Repaired hull patch
  const repairedHull = new THREE.Mesh(damagedPanelGeo, creamMat);
  repairedHull.position.set(0.6, 2.0, 0.6);
  repairedHull.rotation.y = 0.4;
  repairedHull.visible = false;
  rocketBody.add(repairedHull);

  // Conical Nose Cone (Red)
  const noseGeo = new THREE.ConeGeometry(0.86, 1.8, 14);
  const nose = new THREE.Mesh(noseGeo, redMat);
  nose.position.y = 4.65;
  nose.castShadow = true;
  rocketBody.add(nose);

  // 3 Stabilizer Fins
  const finGeo = new THREE.BoxGeometry(0.12, 1.4, 0.9);
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    const fin = new THREE.Mesh(finGeo, redMat);
    fin.position.set(Math.cos(angle) * 1.1, 1.2, Math.sin(angle) * 1.1);
    fin.rotation.y = -angle;
    fin.castShadow = true;
    rocketBody.add(fin);
  }

  // Porthole Window
  const windowFrameGeo = new THREE.TorusGeometry(0.3, 0.06, 8, 16);
  const windowFrame = new THREE.Mesh(windowFrameGeo, metalMat);
  windowFrame.position.set(0, 2.8, 0.88);
  rocketBody.add(windowFrame);

  const glassGeo = new THREE.CircleGeometry(0.28, 16);
  const glass = new THREE.Mesh(glassGeo, windowMat);
  glass.position.set(0, 2.8, 0.9);
  rocketBody.add(glass);

  // Glowing Tech Bands
  const ringGeo = new THREE.TorusGeometry(0.88, 0.05, 8, 24);
  const glowRings = new THREE.Mesh(ringGeo, glowMat);
  glowRings.rotation.x = Math.PI / 2;
  glowRings.position.y = 3.6;
  glowRings.visible = false;
  rocketBody.add(glowRings);

  // --- Cargo Upgrade Level 1 Pods ---
  const cargoLevel1Pods = new THREE.Group();
  cargoLevel1Pods.visible = false;
  rocketBody.add(cargoLevel1Pods);

  const podGeo = new THREE.BoxGeometry(0.35, 1.2, 0.5);
  const leftPod = new THREE.Mesh(podGeo, metalMat);
  leftPod.position.set(-1.0, 2.0, 0);
  cargoLevel1Pods.add(leftPod);
  const rightPod = new THREE.Mesh(podGeo, metalMat);
  rightPod.position.set(1.0, 2.0, 0);
  cargoLevel1Pods.add(rightPod);

  // --- Cargo Upgrade Level 2 Pods ---
  const cargoLevel2Pods = new THREE.Group();
  cargoLevel2Pods.visible = false;
  rocketBody.add(cargoLevel2Pods);

  const pod2Geo = new THREE.BoxGeometry(0.5, 1.4, 0.35);
  const frontPod = new THREE.Mesh(pod2Geo, metalMat);
  frontPod.position.set(0, 2.0, -1.0);
  cargoLevel2Pods.add(frontPod);

  const conduitGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.6);
  const conduit = new THREE.Mesh(conduitGeo, glowMat);
  conduit.position.set(0, 2.0, -1.2);
  cargoLevel2Pods.add(conduit);

  // Engine Fire
  const engineFire = new THREE.Group();
  engineFire.visible = false;
  rocketBody.add(engineFire);

  const flameGeo1 = new THREE.ConeGeometry(0.6, 2.2, 10);
  const flame1 = new THREE.Mesh(flameGeo1, fireMat);
  flame1.rotation.x = Math.PI;
  flame1.position.y = -1.0;
  engineFire.add(flame1);

  const flameGeo2 = new THREE.ConeGeometry(0.35, 3.2, 8);
  const flame2 = new THREE.Mesh(flameGeo2, Materials.getEmissive(0xffff00, 0xffffff, 3.0));
  flame2.rotation.x = Math.PI;
  flame2.position.y = -1.4;
  engineFire.add(flame2);

  const setRepaired = (repaired: boolean) => {
    damagedHull.visible = !repaired;
    repairedHull.visible = repaired;
    glowRings.visible = repaired;
  };

  const setLaunching = (launching: boolean) => {
    engineFire.visible = launching;
  };

  const setCargoLevel = (level: 0 | 1 | 2) => {
    cargoLevel1Pods.visible = level >= 1;
    cargoLevel2Pods.visible = level >= 2;
  };

  return {
    root,
    rocketBody,
    damagedHull,
    repairedHull,
    glowRings,
    engineFire,
    cargoLevel1Pods,
    cargoLevel2Pods,
    setRepaired,
    setLaunching,
    setCargoLevel,
  };
}
