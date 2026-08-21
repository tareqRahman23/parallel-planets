import * as THREE from 'three';
import { Materials, COLORS } from './materials';

export function createHomePlanetEnvironment(): { group: THREE.Group; update(delta: number): void } {
  const group = new THREE.Group();

  // Materials
  const grassMat = Materials.getStandard(COLORS.homeGrass, 0.8, 0.05, true);
  const grassLightMat = Materials.getStandard(COLORS.homeGrassLight, 0.75, 0.05, true);
  const soilMat = Materials.getStandard(COLORS.soilDark, 0.9, 0.05, true);
  const dirtPathMat = Materials.getStandard(0x997750, 0.85, 0.05, true);
  const woodMat = Materials.getStandard(COLORS.wood, 0.8, 0.1);
  const leafMat = Materials.getStandard(COLORS.leafGreen, 0.7, 0.05, true);
  const leafLightMat = Materials.getStandard(COLORS.leafGreenLight, 0.7, 0.05, true);
  const flowerWhiteMat = Materials.getStandard(COLORS.white, 0.5, 0.0);
  const flowerYellowMat = Materials.getStandard(COLORS.armorGold, 0.5, 0.0);
  const baseOutpostMat = Materials.getStandard(COLORS.playerWhite, 0.4, 0.2);
  const baseBlueMat = Materials.getStandard(COLORS.playerSuit, 0.4, 0.2);
  const enemyMetalMat = Materials.getStandard(COLORS.enemyDark, 0.5, 0.5, true);
  const enemyEyeGlowMat = Materials.getEmissive(COLORS.enemyEmissive, COLORS.enemyEmissive, 2.0);

  // 1. Main Island Body
  const islandGeo = new THREE.CylinderGeometry(11.5, 10.0, 2.0, 24);
  const islandBody = new THREE.Mesh(islandGeo, soilMat);
  islandBody.position.y = -1.0;
  islandBody.receiveShadow = true;
  group.add(islandBody);

  // Top Lush Grass Cap
  const grassCapGeo = new THREE.CylinderGeometry(11.6, 11.5, 0.3, 24);
  const grassCap = new THREE.Mesh(grassCapGeo, grassMat);
  grassCap.position.y = 0.0;
  grassCap.receiveShadow = true;
  group.add(grassCap);

  // Layered surface dressing gives the island a readable grass texture from
  // the isometric camera without introducing a large texture asset.
  const grassBladeMat = Materials.getStandard(0x5c9e35, 0.8, 0.03, true);
  const grassBladeLightMat = Materials.getStandard(0x8ac653, 0.75, 0.03, true);
  const grassBladeGeo = new THREE.ConeGeometry(0.055, 0.3, 3);
  const grassBlades = new THREE.InstancedMesh(grassBladeGeo, grassBladeMat, 260);
  const grassBladeHighlights = new THREE.InstancedMesh(grassBladeGeo, grassBladeLightMat, 110);
  const surfaceDummy = new THREE.Object3D();
  const placeSurfaceDetail = (mesh: THREE.InstancedMesh, count: number, seedOffset: number) => {
    for (let i = 0; i < count; i++) {
      const seed = i + seedOffset;
      const angle = seed * 2.3999632297;
      const radialNoise = (Math.sin(seed * 12.9898) + 1) * 0.5;
      const radius = 2.3 + Math.sqrt(((seed * 0.61803398875) % 1)) * 8.6;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      surfaceDummy.position.set(x, 0.22, z);
      surfaceDummy.rotation.set(0, angle + radialNoise * 1.8, (radialNoise - 0.5) * 0.16);
      const scale = 0.55 + radialNoise * 0.9;
      surfaceDummy.scale.set(scale, 0.75 + radialNoise * 0.75, scale);
      surfaceDummy.updateMatrix();
      mesh.setMatrixAt(i, surfaceDummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  };
  placeSurfaceDetail(grassBlades, 260, 1);
  placeSurfaceDetail(grassBladeHighlights, 110, 401);
  grassBlades.castShadow = true;
  grassBladeHighlights.castShadow = true;
  group.add(grassBlades, grassBladeHighlights);

  const turfPatchMat = Materials.getStandard(0x6caf3c, 0.9, 0.02, true);
  const turfPatches = [
    [-4.7, 3.8, 1.6, 0.9, 0.2], [5.9, 4.9, 1.2, 0.7, -0.7],
    [-7.4, -1.8, 1.4, 0.75, 0.5], [3.7, -7.8, 1.8, 0.8, 0.1],
    [8.0, -2.8, 1.3, 0.65, -0.35], [-1.7, 7.4, 1.5, 0.75, 0.8],
  ];
  turfPatches.forEach(([x, z, sx, sz, rot]) => {
    const patch = new THREE.Mesh(new THREE.CircleGeometry(1, 12), turfPatchMat);
    patch.rotation.x = -Math.PI / 2;
    patch.rotation.z = rot;
    patch.scale.set(sx, sz, 1);
    patch.position.set(x, 0.165, z);
    patch.receiveShadow = true;
    group.add(patch);
  });

  const pebbleMat = Materials.getStandard(0x70814a, 0.9, 0.03, true);
  const pebbleGeo = new THREE.DodecahedronGeometry(0.09, 0);
  const pebbles = new THREE.InstancedMesh(pebbleGeo, pebbleMat, 95);
  for (let i = 0; i < 95; i++) {
    const seed = i + 811;
    const angle = seed * 2.3999632297;
    const radius = 3.4 + ((seed * 0.754877666) % 1) * 7.4;
    surfaceDummy.position.set(Math.cos(angle) * radius, 0.19, Math.sin(angle) * radius);
    surfaceDummy.rotation.set(seed * 0.3, seed * 0.7, seed * 0.2);
    const scale = 0.45 + ((seed * 0.321) % 1) * 0.75;
    surfaceDummy.scale.set(scale * 1.25, scale * 0.45, scale);
    surfaceDummy.updateMatrix();
    pebbles.setMatrixAt(i, surfaceDummy.matrix);
  }
  pebbles.instanceMatrix.needsUpdate = true;
  pebbles.castShadow = true;
  group.add(pebbles);

  // Soft Rolling Grass Mound in Background
  const moundGeo = new THREE.SphereGeometry(6.0, 16, 10);
  moundGeo.scale(1.2, 0.3, 1.0);
  const mound = new THREE.Mesh(moundGeo, grassLightMat);
  mound.position.set(-3.0, -0.6, -7.0);
  mound.receiveShadow = true;
  group.add(mound);

  // 2. Dirt Paths (connecting central spawn, farm, drill, rabbit pen, rocket)
  const pathConfigs = [
    { scale: [2.5, 0.02, 6.0], pos: [-2.0, 0.02, 2.0], rotY: 0.4 },
    { scale: [2.2, 0.02, 7.0], pos: [3.0, 0.02, 3.5], rotY: -0.6 },
    { scale: [2.8, 0.02, 4.0], pos: [0.0, 0.02, 0.0], rotY: 0.0 },
  ];
  pathConfigs.forEach((cfg) => {
    const pathMesh = new THREE.Mesh(new THREE.BoxGeometry(cfg.scale[0], cfg.scale[1], cfg.scale[2]), dirtPathMat);
    pathMesh.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
    pathMesh.rotation.y = cfg.rotY;
    pathMesh.receiveShadow = true;
    group.add(pathMesh);
  });

  // 3. Decorative Base Station Outpost (Visual reference landmark)
  const outpost = new THREE.Group();
  outpost.position.set(-6.5, 0, -6.5);
  outpost.rotation.y = Math.PI / 4;

  const outpostBase = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, 1.4, 12), baseOutpostMat);
  outpostBase.position.y = 0.7;
  outpostBase.castShadow = true;
  outpost.add(outpostBase);

  const outpostDome = new THREE.Mesh(new THREE.SphereGeometry(2.1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), baseBlueMat);
  outpostDome.position.y = 1.4;
  outpostDome.castShadow = true;
  outpost.add(outpostDome);

  const beaconTower = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 1.2, 8), baseOutpostMat);
  beaconTower.position.y = 2.4;
  outpost.add(beaconTower);

  const beaconLight = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), Materials.getEmissive(0xffd700, 0xffaa00, 1.8));
  beaconLight.position.y = 3.1;
  outpost.add(beaconLight);

  group.add(outpost);

  // 4. Stylized Low-Poly Trees
  const treeCoords = [
    [-9.0, -2.5], [-8.5, -4.5], [-9.5, 1.0],
    [-2.0, -9.0], [2.0, -9.2], [6.0, -8.0],
    [9.5, -1.0], [10.0, 3.0],
  ];
  treeCoords.forEach(([x, z], idx) => {
    const tree = new THREE.Group();
    tree.position.set(x, 0, z);

    // Trunk
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 1.4, 6), woodMat);
    trunk.position.y = 0.7;
    trunk.castShadow = true;
    tree.add(trunk);

    // Leaves layers
    const foliageMat = idx % 2 === 0 ? leafMat : leafLightMat;
    const l1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.1, 0), foliageMat);
    l1.position.y = 1.8;
    l1.castShadow = true;
    tree.add(l1);

    const l2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8, 0), foliageMat);
    l2.position.y = 2.6;
    l2.castShadow = true;
    tree.add(l2);

    group.add(tree);
  });

  // 5. Flowers and Small Bushes
  const flowerGeo = new THREE.CylinderGeometry(0.12, 0.05, 0.05, 5);
  for (let i = 0; i < 28; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 3.0 + Math.random() * 7.5;
    const fx = Math.cos(angle) * dist;
    const fz = Math.sin(angle) * dist;

    // Avoid main spawn center
    if (Math.abs(fx) < 1.5 && Math.abs(fz) < 1.5) continue;

    const flower = new THREE.Mesh(flowerGeo, i % 3 === 0 ? flowerYellowMat : flowerWhiteMat);
    flower.position.set(fx, 0.04, fz);
    flower.rotation.y = Math.random() * Math.PI;
    group.add(flower);
  }

  // 6. Floating Backdrop Islands (as seen in the reference visual)
  const floatingIsles: THREE.Group[] = [];
  const isleConfigs = [
    { x: -16, y: 5, z: -18, scale: 2.2 },
    { x: 2, y: 7, z: -24, scale: 2.8 },
    { x: 18, y: 4, z: -20, scale: 2.0 },
  ];
  isleConfigs.forEach((cfg) => {
    const isle = new THREE.Group();
    isle.position.set(cfg.x, cfg.y, cfg.z);
    isle.scale.set(cfg.scale, cfg.scale, cfg.scale);

    const isleMesh = new THREE.Mesh(new THREE.ConeGeometry(1.8, 2.2, 7), soilMat);
    isleMesh.rotation.x = Math.PI;
    isleMesh.position.y = -1.1;
    isle.add(isleMesh);

    const isleGrass = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.3, 7), grassMat);
    isleGrass.position.y = 0.0;
    isle.add(isleGrass);

    // Mini tree on floating isle
    const miniTree = new THREE.Mesh(new THREE.DodecahedronGeometry(0.7, 0), leafMat);
    miniTree.position.set(0.2, 0.8, 0);
    isle.add(miniTree);

    group.add(isle);
    floatingIsles.push(isle);
  });

  // 7. Distant Mechanical Enemy Planet in Horizon Sky (Matching visual reference!)
  const mechPlanet = new THREE.Group();
  mechPlanet.position.set(22, 10, -32);

  const mechBody = new THREE.Mesh(new THREE.DodecahedronGeometry(6.5, 1), enemyMetalMat);
  mechPlanet.add(mechBody);

  // Red glowing central core eye
  const mechEye = new THREE.Mesh(new THREE.SphereGeometry(1.6, 12, 10), enemyEyeGlowMat);
  mechEye.position.set(-2.5, 1.0, 5.0);
  mechPlanet.add(mechEye);

  // Spikes / Cannons on mech planet
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.8, 3.2, 5), enemyMetalMat);
    spike.position.set(Math.cos(angle) * 6.5, Math.sin(angle) * 6.5, 0);
    spike.rotation.z = angle - Math.PI / 2;
    mechPlanet.add(spike);
  }
  group.add(mechPlanet);

  let timeAccum = 0;
  const update = (delta: number) => {
    timeAccum += delta;
    // Gentle floating motion for backdrop isles
    floatingIsles.forEach((isle, idx) => {
      isle.position.y += Math.sin(timeAccum * 1.2 + idx * 2.0) * 0.003;
    });
    // Slow ominous rotation of distant enemy planet
    mechPlanet.rotation.y += delta * 0.05;
  };

  return { group, update };
}

export function createEnemyPlanetEnvironment(): { group: THREE.Group; update(delta: number): void } {
  const group = new THREE.Group();

  const groundMat = Materials.getStandard(COLORS.enemyGround, 0.75, 0.2, true);
  const darkRockMat = Materials.getStandard(COLORS.enemyGroundDark, 0.85, 0.25, true);
  const fissureGlowMat = Materials.getEmissive(COLORS.enemyRed, COLORS.enemyEmissive, 1.8);
  const shardMat = Materials.getStandard(COLORS.enemyDark, 0.3, 0.7, true);

  // 1. Jagged Dark Island Base
  const islandGeo = new THREE.CylinderGeometry(12.5, 10.5, 2.5, 16);
  const island = new THREE.Mesh(islandGeo, darkRockMat);
  island.position.y = -1.25;
  island.receiveShadow = true;
  group.add(island);

  const topCap = new THREE.Mesh(new THREE.CylinderGeometry(12.6, 12.5, 0.4, 16), groundMat);
  topCap.position.y = 0;
  topCap.receiveShadow = true;
  group.add(topCap);

  // 2. Glowing Lava / Energy Fissures on Surface
  const fissureConfigs = [
    { scale: [0.35, 0.05, 5.5], pos: [-3, 0.05, -2], rotY: 0.6 },
    { scale: [0.35, 0.05, 6.0], pos: [3.5, 0.05, -1], rotY: -0.5 },
    { scale: [0.4, 0.05, 4.0], pos: [0, 0.05, -4.5], rotY: 0.1 },
  ];
  fissureConfigs.forEach((cfg) => {
    const fissure = new THREE.Mesh(new THREE.BoxGeometry(cfg.scale[0], cfg.scale[1], cfg.scale[2]), fissureGlowMat);
    fissure.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
    fissure.rotation.y = cfg.rotY;
    group.add(fissure);
  });

  // 3. Dark Crystal Shards around Arena Perimeter
  const shards: THREE.Group[] = [];
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const dist = 10.0 + Math.random() * 1.5;
    const shardGroup = new THREE.Group();
    shardGroup.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);

    const shardGeo = new THREE.ConeGeometry(0.4 + Math.random() * 0.4, 2.2 + Math.random() * 1.5, 5);
    const shardMesh = new THREE.Mesh(shardGeo, shardMat);
    shardMesh.position.y = 1.0;
    shardMesh.rotation.set((Math.random() - 0.5) * 0.4, Math.random() * Math.PI, (Math.random() - 0.5) * 0.4);
    shardMesh.castShadow = true;
    shardGroup.add(shardMesh);

    group.add(shardGroup);
    shards.push(shardGroup);
  }

  // 4. Floating Dark Rock Fragments in Backdrop
  const floatingRocks: THREE.Mesh[] = [];
  for (let i = 0; i < 8; i++) {
    const geo = new THREE.DodecahedronGeometry(0.8 + Math.random() * 0.8, 0);
    const rock = new THREE.Mesh(geo, darkRockMat);
    rock.position.set(
      (Math.random() - 0.5) * 32,
      2 + Math.random() * 6,
      -14 - Math.random() * 12
    );
    group.add(rock);
    floatingRocks.push(rock);
  }

  let timeAccum = 0;
  const update = (delta: number) => {
    timeAccum += delta;
    floatingRocks.forEach((rock, idx) => {
      rock.rotation.x += delta * 0.2;
      rock.rotation.y += delta * 0.3;
      rock.position.y += Math.sin(timeAccum * 1.5 + idx) * 0.004;
    });
  };

  return { group, update };
}
