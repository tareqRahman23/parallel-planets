import * as THREE from 'three';
import { Materials, COLORS } from './materials';

export interface RabbitPenModelParts {
  root: THREE.Group;
  gate: THREE.Group;
  setRecruited(recruited: boolean): void;
}

export function createRabbitPenModel(): RabbitPenModelParts {
  const root = new THREE.Group();

  // Materials
  const woodMat = Materials.getStandard(COLORS.wood, 0.8, 0.1);
  const strawMat = Materials.getStandard(COLORS.straw, 0.85, 0.0);
  const stoneMat = Materials.getStandard(COLORS.stone, 0.7, 0.1);
  const carrotMat = Materials.getStandard(COLORS.carrotOrange, 0.5, 0.1);
  const bowlMat = Materials.getStandard(COLORS.playerVisor, 0.4, 0.2);

  // Straw Bed Base
  const baseGeo = new THREE.CylinderGeometry(1.6, 1.7, 0.15, 10);
  const base = new THREE.Mesh(baseGeo, strawMat);
  base.position.y = 0.08;
  base.receiveShadow = true;
  root.add(base);

  // Fence Posts and Rails (around pen with front entrance)
  const postGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.7, 6);
  const railGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.1, 4);

  const numSections = 6;
  for (let i = 0; i < numSections; i++) {
    const angle = (i / numSections) * Math.PI * 1.5 - Math.PI * 0.75;
    const x = Math.cos(angle) * 1.5;
    const z = Math.sin(angle) * 1.5;

    const post = new THREE.Mesh(postGeo, woodMat);
    post.position.set(x, 0.35, z);
    post.castShadow = true;
    root.add(post);

    if (i < numSections - 1) {
      const nextAngle = ((i + 1) / numSections) * Math.PI * 1.5 - Math.PI * 0.75;
      const midX = (x + Math.cos(nextAngle) * 1.5) / 2;
      const midZ = (z + Math.sin(nextAngle) * 1.5) / 2;
      const railAngle = Math.atan2(Math.sin(nextAngle) * 1.5 - z, Math.cos(nextAngle) * 1.5 - x);

      const rail1 = new THREE.Mesh(railGeo, woodMat);
      rail1.rotation.y = -railAngle;
      rail1.rotation.z = Math.PI / 2;
      rail1.position.set(midX, 0.28, midZ);
      root.add(rail1);

      const rail2 = new THREE.Mesh(railGeo, woodMat);
      rail2.rotation.y = -railAngle;
      rail2.rotation.z = Math.PI / 2;
      rail2.position.set(midX, 0.5, midZ);
      root.add(rail2);
    }
  }

  // Food Bowl
  const bowlGeo = new THREE.CylinderGeometry(0.24, 0.18, 0.14, 8);
  const bowl = new THREE.Mesh(bowlGeo, bowlMat);
  bowl.position.set(0.6, 0.2, 0.4);
  bowl.castShadow = true;
  root.add(bowl);

  // Carrots in bowl
  const carrotGeo = new THREE.ConeGeometry(0.06, 0.2, 6);
  const miniCarrot = new THREE.Mesh(carrotGeo, carrotMat);
  miniCarrot.rotation.x = Math.PI / 3;
  miniCarrot.position.set(0.6, 0.28, 0.4);
  root.add(miniCarrot);

  // Pen Signpost with Rabbit/Carrot Crest
  const signGroup = new THREE.Group();
  signGroup.position.set(-1.4, 0, 1.0);
  signGroup.rotation.y = Math.PI / 4;

  const signPost = new THREE.Mesh(postGeo, woodMat);
  signPost.position.y = 0.5;
  signPost.castShadow = true;
  signGroup.add(signPost);

  const signBoardGeo = new THREE.BoxGeometry(0.6, 0.4, 0.08);
  const signBoard = new THREE.Mesh(signBoardGeo, stoneMat);
  signBoard.position.set(0, 0.8, 0);
  signGroup.add(signBoard);

  const crestIcon = new THREE.Mesh(carrotGeo, carrotMat);
  crestIcon.rotation.z = Math.PI;
  crestIcon.position.set(0, 0.8, 0.05);
  signGroup.add(crestIcon);
  root.add(signGroup);

  // Gate (Swings open when rabbit is recruited)
  const gate = new THREE.Group();
  gate.position.set(0.3, 0, 1.4);
  const gatePost = new THREE.Mesh(postGeo, woodMat);
  gatePost.position.y = 0.35;
  gate.add(gatePost);
  const gateRail = new THREE.Mesh(railGeo, woodMat);
  gateRail.position.set(0.4, 0.35, 0);
  gateRail.rotation.z = Math.PI / 2;
  gate.add(gateRail);
  root.add(gate);

  const setRecruited = (recruited: boolean) => {
    gate.rotation.y = recruited ? Math.PI / 2 : 0;
  };

  return { root, gate, setRecruited };
}
