import * as THREE from 'three';
import { Materials, COLORS } from './materials';

export interface EnemyModelParts {
  root: THREE.Group;
  body: THREE.Group;
  eye: THREE.Mesh;
  leftClaw: THREE.Group;
  rightClaw: THREE.Group;
  legs: THREE.Group[];
}

export function createEnemyModel(variant: 'A' | 'B' = 'A'): EnemyModelParts {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  // Materials
  const chassisMat = Materials.getStandard(COLORS.enemyDark, 0.5, 0.4, true);
  const accentMat = Materials.getStandard(variant === 'A' ? COLORS.enemyRed : 0xaa2244, 0.4, 0.3, true);
  const eyeMat = Materials.getEmissive(COLORS.enemyEmissive, COLORS.enemyEmissive, 1.8);
  const bladeMat = Materials.getEmissive(0xff2244, 0xff0033, 1.5);
  const metalMat = Materials.getStandard(COLORS.armorSteel, 0.3, 0.7);

  // Main Angular Hull / Head
  const hullGeo = new THREE.DodecahedronGeometry(0.48, 0);
  hullGeo.scale(1.1, 0.8, 1.2);
  const hull = new THREE.Mesh(hullGeo, chassisMat);
  hull.position.y = 0.65;
  hull.castShadow = true;
  body.add(hull);

  // Back Armor Carapace
  const carapaceGeo = new THREE.BoxGeometry(0.7, 0.35, 0.65);
  const carapace = new THREE.Mesh(carapaceGeo, accentMat);
  carapace.position.set(0, 0.82, -0.15);
  carapace.castShadow = true;
  body.add(carapace);

  // Variant Features (Horns/Fins)
  if (variant === 'A') {
    const finGeo = new THREE.ConeGeometry(0.08, 0.35, 4);
    const finL = new THREE.Mesh(finGeo, accentMat);
    finL.rotation.set(-0.3, 0, 0.4);
    finL.position.set(-0.32, 0.95, -0.2);
    body.add(finL);

    const finR = new THREE.Mesh(finGeo, accentMat);
    finR.rotation.set(-0.3, 0, -0.4);
    finR.position.set(0.32, 0.95, -0.2);
    body.add(finR);
  } else {
    const spineGeo = new THREE.BoxGeometry(0.12, 0.25, 0.7);
    const spine = new THREE.Mesh(spineGeo, accentMat);
    spine.position.set(0, 0.98, -0.1);
    spine.rotation.x = -0.2;
    body.add(spine);
  }

  // Glowing Mono-Eye Visor
  const eyeGeo = new THREE.SphereGeometry(0.16, 8, 8);
  eyeGeo.scale(1.6, 0.6, 0.8);
  const eye = new THREE.Mesh(eyeGeo, eyeMat);
  eye.position.set(0, 0.62, 0.45);
  body.add(eye);

  // Energy Blades / Claws
  const clawGeo = new THREE.ConeGeometry(0.08, 0.45, 4);

  // Left Claw
  const leftClaw = new THREE.Group();
  leftClaw.position.set(-0.45, 0.55, 0.25);
  const clawArmL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.3), metalMat);
  clawArmL.position.set(0, 0, 0.1);
  leftClaw.add(clawArmL);
  const bladeL = new THREE.Mesh(clawGeo, bladeMat);
  bladeL.rotation.x = Math.PI / 2;
  bladeL.position.set(0, 0, 0.35);
  leftClaw.add(bladeL);
  body.add(leftClaw);

  // Right Claw
  const rightClaw = new THREE.Group();
  rightClaw.position.set(0.45, 0.55, 0.25);
  const clawArmR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.3), metalMat);
  clawArmR.position.set(0, 0, 0.1);
  rightClaw.add(clawArmR);
  const bladeR = new THREE.Mesh(clawGeo, bladeMat);
  bladeR.rotation.x = Math.PI / 2;
  bladeR.position.set(0, 0, 0.35);
  rightClaw.add(bladeR);
  body.add(rightClaw);

  // 4 Spider-like Legs
  const legs: THREE.Group[] = [];
  const legUpperGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.4, 5);
  const legLowerGeo = new THREE.CylinderGeometry(0.04, 0.02, 0.45, 5);

  const legPositions = [
    { x: -0.38, z: 0.2, rotY: 0.5 },
    { x: 0.38, z: 0.2, rotY: -0.5 },
    { x: -0.38, z: -0.3, rotY: 2.5 },
    { x: 0.38, z: -0.3, rotY: -2.5 },
  ];

  legPositions.forEach((pos) => {
    const legGroup = new THREE.Group();
    legGroup.position.set(pos.x, 0.45, pos.z);
    legGroup.rotation.y = pos.rotY;

    const upper = new THREE.Mesh(legUpperGeo, chassisMat);
    upper.rotation.z = Math.PI / 3;
    upper.position.set(0.15, 0.08, 0);
    upper.castShadow = true;
    legGroup.add(upper);

    const lower = new THREE.Mesh(legLowerGeo, metalMat);
    lower.rotation.z = -Math.PI / 3.5;
    lower.position.set(0.32, -0.15, 0);
    lower.castShadow = true;
    legGroup.add(lower);

    body.add(legGroup);
    legs.push(legGroup);
  });

  return { root, body, eye, leftClaw, rightClaw, legs };
}
