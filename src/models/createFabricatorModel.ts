import * as THREE from 'three';
import { Materials, COLORS } from './materials';

export interface FabricatorModelParts {
  root: THREE.Group;
  chamber: THREE.Mesh;
  piston: THREE.Mesh;
  statusLight: THREE.Mesh;
  outputTray: THREE.Mesh;
  chevrons: THREE.Mesh[];
  queuePips: THREE.Mesh[];
}

export function createFabricatorModel(): FabricatorModelParts {
  const root = new THREE.Group();

  const steelMat = Materials.getStandard(COLORS.armorSteel, 0.4, 0.7);
  const baseMat = Materials.getStandard(COLORS.techBlueDark, 0.5, 0.5);

  // Base (heavy square)
  const baseGeo = new THREE.BoxGeometry(1.6, 0.4, 1.6);
  const base = new THREE.Mesh(baseGeo, steelMat);
  base.position.y = 0.2;
  base.castShadow = true;
  base.receiveShadow = true;
  root.add(base);

  // Main body
  const bodyGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
  const body = new THREE.Mesh(bodyGeo, baseMat); // using drillBase for steel tech look
  body.position.y = 1.0;
  body.castShadow = true;
  body.receiveShadow = true;
  root.add(body);

  // Input hopper (top)
  const hopperGeo = new THREE.CylinderGeometry(0.8, 0.4, 0.6, 8);
  const hopper = new THREE.Mesh(hopperGeo, steelMat);
  hopper.position.y = 1.9;
  hopper.castShadow = true;
  root.add(hopper);

  // Chamber (rotating part inside body)
  const chamberGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.2, 8);
  const chamber = new THREE.Mesh(chamberGeo, steelMat);
  chamber.position.y = 1.0;
  chamber.rotation.x = Math.PI / 2;
  root.add(chamber);

  // Piston (side)
  const pistonGeo = new THREE.BoxGeometry(0.3, 0.8, 0.3);
  const piston = new THREE.Mesh(pistonGeo, steelMat);
  piston.position.set(0.75, 1.0, 0);
  root.add(piston);

  // Status strip (cyan)
  const stripGeo = new THREE.BoxGeometry(1.25, 0.1, 0.1);
  const statusMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x008888, emissiveIntensity: 1.0 });
  const statusLight = new THREE.Mesh(stripGeo, statusMat);
  statusLight.position.set(0, 1.4, 0.6);
  root.add(statusLight);

  // Output tray
  const trayGeo = new THREE.BoxGeometry(1.0, 0.2, 0.8);
  const outputTray = new THREE.Mesh(trayGeo, steelMat);
  outputTray.position.set(0, 0.3, 1.0);
  outputTray.castShadow = true;
  outputTray.receiveShadow = true;
  root.add(outputTray);

  // Queue Pips
  const queuePips: THREE.Mesh[] = [];
  for(let i = 0; i < 2; i++) {
    const pipGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const pipMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
    const pip = new THREE.Mesh(pipGeo, pipMat);
    pip.position.set(-0.3 + i * 0.2, 1.7, 0.61);
    root.add(pip);
    queuePips.push(pip);
  }

  // Chevrons (Streak)
  const chevrons: THREE.Mesh[] = [];
  for(let i = 0; i < 3; i++) {
    const chevGeo = new THREE.ConeGeometry(0.1, 0.2, 3);
    const chevMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
    const chev = new THREE.Mesh(chevGeo, chevMat);
    chev.rotation.x = Math.PI / 2;
    chev.position.set(0.8, 0.5 + i * 0.3, 0.5);
    root.add(chev);
    chevrons.push(chev);
  }

  return { root, chamber, piston, statusLight, outputTray, chevrons, queuePips };
}
