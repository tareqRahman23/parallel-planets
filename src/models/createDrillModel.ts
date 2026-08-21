import * as THREE from 'three';
import { Materials, COLORS } from './materials';

export interface DrillModelParts {
  root: THREE.Group;
  ghostGroup: THREE.Group;
  builtGroup: THREE.Group;
  drillHead: THREE.Group;
  drillBit: THREE.Mesh;
  piston: THREE.Mesh;
  setBuilt(built: boolean): void;
}

export function createDrillModel(): DrillModelParts {
  const root = new THREE.Group();

  // Materials
  const baseMat = Materials.getStandard(COLORS.stoneDark, 0.7, 0.4);
  const metalMat = Materials.getStandard(COLORS.armorSteel, 0.35, 0.75);
  const blueMat = Materials.getStandard(COLORS.techBlue, 0.4, 0.3);
  const glowMat = Materials.getEmissive(COLORS.techCyanGlow, COLORS.techCyanGlow, 1.4);
  const ghostMat = Materials.getTransparent(COLORS.techCyanGlow, 0.35, COLORS.techCyanGlow);

  // 1. Foundation Pad (Always visible)
  const padGeo = new THREE.CylinderGeometry(1.6, 1.7, 0.25, 8);
  const pad = new THREE.Mesh(padGeo, baseMat);
  pad.position.y = 0.12;
  pad.receiveShadow = true;
  root.add(pad);

  // Bolts on pad
  const boltGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.08, 6);
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const bolt = new THREE.Mesh(boltGeo, metalMat);
    bolt.position.set(Math.cos(angle) * 1.4, 0.25, Math.sin(angle) * 1.4);
    root.add(bolt);
  }

  // 2. Holographic Silhouette / Ghost (Unbuilt state)
  const ghostGroup = new THREE.Group();
  root.add(ghostGroup);

  const ghostTowerGeo = new THREE.BoxGeometry(0.8, 1.6, 0.8);
  const ghostTower = new THREE.Mesh(ghostTowerGeo, ghostMat);
  ghostTower.position.y = 1.0;
  ghostGroup.add(ghostTower);

  const ghostBitGeo = new THREE.ConeGeometry(0.6, 1.2, 8);
  const ghostBit = new THREE.Mesh(ghostBitGeo, ghostMat);
  ghostBit.rotation.x = Math.PI;
  ghostBit.position.y = 0.6;
  ghostGroup.add(ghostBit);

  // 3. Built Drill Structure
  const builtGroup = new THREE.Group();
  builtGroup.visible = false;
  root.add(builtGroup);

  // Motor Housing
  const motorGeo = new THREE.BoxGeometry(1.1, 1.2, 1.1);
  const motor = new THREE.Mesh(motorGeo, blueMat);
  motor.position.y = 1.6;
  motor.castShadow = true;
  builtGroup.add(motor);

  // Side vent grills
  const ventGeo = new THREE.BoxGeometry(0.1, 0.4, 0.7);
  const ventL = new THREE.Mesh(ventGeo, baseMat);
  ventL.position.set(-0.55, 1.6, 0);
  builtGroup.add(ventL);
  const ventR = new THREE.Mesh(ventGeo, baseMat);
  ventR.position.set(0.55, 1.6, 0);
  builtGroup.add(ventR);

  // Support Legs
  const legGeo = new THREE.BoxGeometry(0.2, 1.2, 0.2);
  const offsets = [
    [-0.5, 0.7, -0.5],
    [0.5, 0.7, -0.5],
    [-0.5, 0.7, 0.5],
    [0.5, 0.7, 0.5],
  ];
  offsets.forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(legGeo, metalMat);
    leg.position.set(x, y, z);
    leg.castShadow = true;
    builtGroup.add(leg);
  });

  // Glowing Power Core Cylinder
  const coreGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.6, 12);
  const core = new THREE.Mesh(coreGeo, glowMat);
  core.position.set(0, 1.6, 0.5);
  core.rotation.x = Math.PI / 2;
  builtGroup.add(core);

  // Output Hopper for rocks
  const hopperGeo = new THREE.BoxGeometry(0.6, 0.3, 0.5);
  const hopper = new THREE.Mesh(hopperGeo, metalMat);
  hopper.position.set(0, 0.4, 0.7);
  builtGroup.add(hopper);

  // Drill Head Assembly (Pumps up and down)
  const drillHead = new THREE.Group();
  drillHead.position.y = 1.0;
  builtGroup.add(drillHead);

  // Vertical Piston
  const pistonGeo = new THREE.CylinderGeometry(0.18, 0.18, 1.1, 10);
  const piston = new THREE.Mesh(pistonGeo, metalMat);
  piston.position.y = 0.4;
  piston.castShadow = true;
  drillHead.add(piston);

  // Large Conical Drill Bit (Spins)
  const bitGeo = new THREE.ConeGeometry(0.5, 0.9, 8);
  const drillBit = new THREE.Mesh(bitGeo, metalMat);
  drillBit.rotation.x = Math.PI;
  drillBit.position.y = -0.2;
  drillBit.castShadow = true;
  drillHead.add(drillBit);

  const setBuilt = (built: boolean) => {
    builtGroup.visible = built;
    ghostGroup.visible = !built;
  };

  return { root, ghostGroup, builtGroup, drillHead, drillBit, piston, setBuilt };
}
