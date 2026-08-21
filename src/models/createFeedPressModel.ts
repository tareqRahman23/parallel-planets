import * as THREE from 'three';
import { Materials, COLORS } from './materials';

export interface FeedPressModelParts {
  root: THREE.Group;
  drum: THREE.Mesh;
  pressPump: THREE.Mesh;
  crank: THREE.Group;
  outputShelf: THREE.Mesh;
  chevrons: THREE.Mesh[];
  queuePips: THREE.Mesh[];
}

export function createFeedPressModel(): FeedPressModelParts {
  const root = new THREE.Group();

  const steelMat = Materials.getStandard(COLORS.armorSteel, 0.4, 0.7);

  // Base (wooden/painted metal)
  const baseGeo = new THREE.CylinderGeometry(1.0, 1.2, 0.6, 8);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.9 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = 0.3;
  base.castShadow = true;
  base.receiveShadow = true;
  root.add(base);

  // Main body
  const bodyGeo = new THREE.CylinderGeometry(0.9, 0.9, 1.0, 8);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4caf50, roughness: 0.8 }); // green
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 1.1;
  body.castShadow = true;
  body.receiveShadow = true;
  root.add(body);

  // Input basket (top)
  const basketGeo = new THREE.CylinderGeometry(0.8, 0.5, 0.5, 8, 1, true);
  const basketMat = new THREE.MeshStandardMaterial({ color: 0xdeb887, side: THREE.DoubleSide });
  const basket = new THREE.Mesh(basketGeo, basketMat);
  basket.position.y = 1.85;
  basket.castShadow = true;
  root.add(basket);

  // Drum (inside body)
  const drumGeo = new THREE.CylinderGeometry(0.7, 0.7, 1.05, 8);
  const drumMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
  const drum = new THREE.Mesh(drumGeo, drumMat);
  drum.position.y = 1.1;
  drum.rotation.z = Math.PI / 2;
  root.add(drum);

  // Press Pump (top pushing down)
  const pumpGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.8);
  const pump = new THREE.Mesh(pumpGeo, steelMat);
  pump.position.y = 1.8;
  root.add(pump);

  // Crank (side wheel)
  const crank = new THREE.Group();
  crank.position.set(0.95, 1.1, 0);
  root.add(crank);

  const wheelGeo = new THREE.TorusGeometry(0.3, 0.05, 8, 12);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });
  const wheel = new THREE.Mesh(wheelGeo, wheelMat);
  wheel.rotation.y = Math.PI / 2;
  crank.add(wheel);

  const handleGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.2);
  const handle = new THREE.Mesh(handleGeo, steelMat);
  handle.position.set(0.1, 0.3, 0);
  handle.rotation.z = Math.PI / 2;
  crank.add(handle);

  // Output Shelf
  const shelfGeo = new THREE.BoxGeometry(1.2, 0.1, 0.6);
  const outputShelf = new THREE.Mesh(shelfGeo, baseMat);
  outputShelf.position.set(0, 0.5, 1.0);
  outputShelf.castShadow = true;
  outputShelf.receiveShadow = true;
  root.add(outputShelf);

  // Queue Pips
  const queuePips: THREE.Mesh[] = [];
  for(let i = 0; i < 2; i++) {
    const pipGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const pipMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
    const pip = new THREE.Mesh(pipGeo, pipMat);
    pip.position.set(-0.2 + i * 0.4, 1.5, 0.85);
    root.add(pip);
    queuePips.push(pip);
  }

  // Chevrons (Leaves for FeedPress)
  const chevrons: THREE.Mesh[] = [];
  for(let i = 0; i < 3; i++) {
    const leafGeo = new THREE.ConeGeometry(0.1, 0.2, 4);
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.rotation.x = Math.PI / 2;
    leaf.position.set(0.8, 0.6 + i * 0.3, 0.7);
    root.add(leaf);
    chevrons.push(leaf);
  }

  return { root, drum, pressPump: pump, crank, outputShelf, chevrons, queuePips };
}
