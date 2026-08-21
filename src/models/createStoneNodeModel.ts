import * as THREE from 'three';
import { Materials, COLORS } from './materials';

export interface StoneNodeModelParts {
  root: THREE.Group;
  cluster: THREE.Group;
  setSquash(scaleY: number): void;
}

export function createStoneNodeModel(seed: number = 0): StoneNodeModelParts {
  const root = new THREE.Group();
  const cluster = new THREE.Group();
  root.add(cluster);

  const stoneMat = Materials.getStandard(COLORS.stone, 0.8, 0.05, true);
  const stoneLightMat = Materials.getStandard(COLORS.stoneHighlight, 0.75, 0.05, true);
  const stoneDarkMat = Materials.getStandard(COLORS.stoneDark, 0.85, 0.05, true);

  // Pseudo random generator with deterministic seed
  const rand = (offset: number) => {
    const x = Math.sin(seed * 137.5 + offset * 93.7) * 10000;
    return x - Math.floor(x);
  };

  // Main Large Rock Formations (3 to 4 rocks per cluster)
  const rockConfigs = [
    { scale: [0.9, 1.2, 0.9], pos: [0, 0.6, 0], mat: stoneMat },
    { scale: [0.7, 0.9, 0.7], pos: [0.55, 0.45, 0.3], mat: stoneLightMat },
    { scale: [0.65, 0.8, 0.65], pos: [-0.5, 0.4, 0.2], mat: stoneDarkMat },
    { scale: [0.5, 0.6, 0.5], pos: [0.1, 0.3, -0.55], mat: stoneMat },
  ];

  rockConfigs.forEach((cfg, idx) => {
    const geo = new THREE.DodecahedronGeometry(0.6, 0);
    const mesh = new THREE.Mesh(geo, cfg.mat);
    mesh.scale.set(
      cfg.scale[0] * (0.9 + rand(idx * 2) * 0.2),
      cfg.scale[1] * (0.9 + rand(idx * 2 + 1) * 0.2),
      cfg.scale[2] * (0.9 + rand(idx * 3) * 0.2)
    );
    mesh.position.set(
      cfg.pos[0] + (rand(idx * 4) - 0.5) * 0.2,
      cfg.pos[1],
      cfg.pos[2] + (rand(idx * 5) - 0.5) * 0.2
    );
    mesh.rotation.set(rand(idx * 6) * Math.PI, rand(idx * 7) * Math.PI, rand(idx * 8) * Math.PI);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    cluster.add(mesh);
  });

  // Small Rubble / Chips around Base
  const chipGeo = new THREE.DodecahedronGeometry(0.12, 0);
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2 + rand(i) * 0.5;
    const dist = 0.9 + rand(i + 10) * 0.4;
    const chip = new THREE.Mesh(chipGeo, stoneLightMat);
    chip.position.set(Math.cos(angle) * dist, 0.08, Math.sin(angle) * dist);
    chip.rotation.set(rand(i + 20), rand(i + 21), rand(i + 22));
    chip.castShadow = true;
    cluster.add(chip);
  }

  const setSquash = (scaleY: number) => {
    const horizScale = 1 + (1 - scaleY) * 0.4;
    cluster.scale.set(horizScale, scaleY, horizScale);
  };

  return { root, cluster, setSquash };
}
