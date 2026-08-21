import * as THREE from 'three';
import { Materials, COLORS } from './materials';

export interface FarmModelParts {
  root: THREE.Group;
  sproutsGroups: THREE.Group[];
  matureCarrotMeshes: THREE.Group[];
  setRowStage: (row: number, stage: 'empty' | 'growing' | 'mature', progress?: number) => void;
  setCarrotVisible: (index: number, visible: boolean) => void;
}

export function createFarmModel(): FarmModelParts {
  const root = new THREE.Group();

  // Materials
  const soilMat = Materials.getStandard(COLORS.soil, 0.9, 0.05);
  const soilDarkMat = Materials.getStandard(COLORS.soilDark, 0.95, 0.0);
  const woodMat = Materials.getStandard(COLORS.wood, 0.8, 0.1);
  const ropeMat = Materials.getStandard(COLORS.straw, 0.8, 0.0);
  const leafMat = Materials.getStandard(COLORS.leafGreen, 0.6, 0.1);
  const carrotMat = Materials.getStandard(COLORS.carrotOrange, 0.5, 0.1);

  // Main Soil Base
  const baseGeo = new THREE.BoxGeometry(3.6, 0.25, 2.6);
  const baseMesh = new THREE.Mesh(baseGeo, soilMat);
  baseMesh.position.y = 0.12;
  baseMesh.receiveShadow = true;
  root.add(baseMesh);

  // Tilled Dirt Ridges / Furrows
  for (let r = -0.8; r <= 0.8; r += 0.8) {
    const ridgeGeo = new THREE.CylinderGeometry(0.22, 0.28, 3.2, 8);
    const ridge = new THREE.Mesh(ridgeGeo, soilDarkMat);
    ridge.rotation.z = Math.PI / 2;
    ridge.position.set(0, 0.24, r);
    ridge.receiveShadow = true;
    root.add(ridge);
  }

  // Wooden Perimeter Fence Posts & Ropes
  const postGeo = new THREE.CylinderGeometry(0.07, 0.09, 0.6, 6);
  const postCoords: [number, number][] = [
    [-1.9, -1.4], [0, -1.4], [1.9, -1.4],
    [-1.9, 1.4], [0, 1.4], [1.9, 1.4],
    [-1.9, 0], [1.9, 0],
  ];
  postCoords.forEach(([x, z]) => {
    const post = new THREE.Mesh(postGeo, woodMat);
    post.position.set(x, 0.3, z);
    post.castShadow = true;
    root.add(post);
  });

  const ropeGeoX = new THREE.CylinderGeometry(0.02, 0.02, 3.8, 4);
  const ropeFront = new THREE.Mesh(ropeGeoX, ropeMat);
  ropeFront.rotation.z = Math.PI / 2;
  ropeFront.position.set(0, 0.45, -1.4);
  root.add(ropeFront);

  const ropeBack = new THREE.Mesh(ropeGeoX, ropeMat);
  ropeBack.rotation.z = Math.PI / 2;
  ropeBack.position.set(0, 0.45, 1.4);
  root.add(ropeBack);

  // Farm Signboard
  const signGroup = new THREE.Group();
  signGroup.position.set(-2.2, 0, -1.2);
  signGroup.rotation.y = Math.PI / 6;

  const signPostGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.9, 6);
  const signPost = new THREE.Mesh(signPostGeo, woodMat);
  signPost.position.y = 0.45;
  signPost.castShadow = true;
  signGroup.add(signPost);

  const boardGeo = new THREE.BoxGeometry(0.65, 0.45, 0.08);
  const board = new THREE.Mesh(boardGeo, woodMat);
  board.position.set(0, 0.75, 0);
  signGroup.add(board);

  const carrotSignGeo = new THREE.ConeGeometry(0.1, 0.25, 6);
  const carrotSign = new THREE.Mesh(carrotSignGeo, carrotMat);
  carrotSign.rotation.z = Math.PI;
  carrotSign.position.set(0, 0.75, 0.05);
  signGroup.add(carrotSign);
  root.add(signGroup);

  // ---------------- Crop Visuals (3 rows x 3 carrots) ----------------
  const carrotPositions: [number, number][] = [
    [-1.0, -0.8], [0.0, -0.8], [1.0, -0.8], // Row 0
    [-1.0, 0.0],  [0.0, 0.0],  [1.0, 0.0],  // Row 1
    [-1.0, 0.8],  [0.0, 0.8],  [1.0, 0.8],  // Row 2
  ];

  const sproutsGroups: THREE.Group[] = [];
  for (let r = 0; r < 3; r++) {
    const rowSprouts = new THREE.Group();
    rowSprouts.visible = false;
    root.add(rowSprouts);

    const sproutLeafGeo = new THREE.ConeGeometry(0.06, 0.22, 5);
    for (let c = 0; c < 3; c++) {
      const idx = r * 3 + c;
      const [x, z] = carrotPositions[idx];
      const sprout = new THREE.Group();
      sprout.position.set(x, 0.3, z);

      const leaf1 = new THREE.Mesh(sproutLeafGeo, leafMat);
      leaf1.rotation.z = 0.4;
      leaf1.position.x = -0.04;
      sprout.add(leaf1);

      const leaf2 = new THREE.Mesh(sproutLeafGeo, leafMat);
      leaf2.rotation.z = -0.4;
      leaf2.position.x = 0.04;
      sprout.add(leaf2);

      rowSprouts.add(sprout);
    }
    sproutsGroups.push(rowSprouts);
  }

  const matureCarrotMeshes: THREE.Group[] = [];
  const carrotRootGeo = new THREE.ConeGeometry(0.14, 0.45, 8);
  const matureLeafGeo = new THREE.ConeGeometry(0.09, 0.38, 5);

  carrotPositions.forEach(([x, z]) => {
    const carrot = new THREE.Group();
    carrot.position.set(x, 0.32, z);
    carrot.visible = false;

    const rootMesh = new THREE.Mesh(carrotRootGeo, carrotMat);
    rootMesh.rotation.z = Math.PI;
    rootMesh.position.y = 0.06;
    rootMesh.castShadow = true;
    carrot.add(rootMesh);

    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const leaf = new THREE.Mesh(matureLeafGeo, leafMat);
      leaf.position.set(Math.cos(angle) * 0.05, 0.32, Math.sin(angle) * 0.05);
      leaf.rotation.set(Math.sin(angle) * 0.3, 0, -Math.cos(angle) * 0.3);
      leaf.castShadow = true;
      carrot.add(leaf);
    }

    root.add(carrot);
    matureCarrotMeshes.push(carrot);
  });

  const setRowStage = (row: number, stage: 'empty' | 'growing' | 'mature', progress: number = 0) => {
    const sprouts = sproutsGroups[row];
    if (!sprouts) return;

    if (stage === 'empty') {
      sprouts.visible = false;
      for (let c = 0; c < 3; c++) {
        matureCarrotMeshes[row * 3 + c].visible = false;
      }
    } else if (stage === 'growing') {
      sprouts.visible = true;
      const scale = 0.3 + progress * 0.7;
      sprouts.scale.set(scale, scale, scale);
      for (let c = 0; c < 3; c++) {
        matureCarrotMeshes[row * 3 + c].visible = false;
      }
    } else if (stage === 'mature') {
      sprouts.visible = false;
      for (let c = 0; c < 3; c++) {
        matureCarrotMeshes[row * 3 + c].visible = true;
      }
    }
  };

  const setCarrotVisible = (index: number, visible: boolean) => {
    if (matureCarrotMeshes[index]) {
      matureCarrotMeshes[index].visible = visible;
    }
  };

  return { root, sproutsGroups, matureCarrotMeshes, setRowStage, setCarrotVisible };
}
