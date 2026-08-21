import * as THREE from 'three';
import { DefenseState } from '../app/GameSession';
import { Materials, COLORS } from '../models/materials';

export class DefenseEntity {
  public readonly defense: DefenseState;
  public readonly group: THREE.Group;
  public readonly position: THREE.Vector3;

  private unbuiltPadGroup: THREE.Group;
  private constructionGroup: THREE.Group;
  private builtGroup: THREE.Group;
  private rotatingTurretMesh: THREE.Group | null = null;
  private totemRings: THREE.Mesh[] = [];

  constructor(defense: DefenseState, position: [number, number, number]) {
    this.defense = defense;
    this.position = new THREE.Vector3(...position);
    this.group = new THREE.Group();
    this.group.position.copy(this.position);

    this.unbuiltPadGroup = new THREE.Group();
    this.constructionGroup = new THREE.Group();
    this.builtGroup = new THREE.Group();

    this.group.add(this.unbuiltPadGroup);
    this.group.add(this.constructionGroup);
    this.group.add(this.builtGroup);

    this.buildUnbuiltPad();
    this.buildConstructionScaffolding();
    this.buildDefenseModel();
  }

  private buildUnbuiltPad(): void {
    const padGeo = new THREE.CylinderGeometry(1.3, 1.4, 0.1, 16);
    const padMat = Materials.getStandard(COLORS.rocketDark, 0.8, 0.2);
    const padMesh = new THREE.Mesh(padGeo, padMat);
    padMesh.receiveShadow = true;
    padMesh.position.y = 0.05;
    this.unbuiltPadGroup.add(padMesh);

    // Green ring outline
    const ringGeo = new THREE.RingGeometry(1.25, 1.4, 16);
    const ringMat = Materials.getTransparent(COLORS.leafGreenLight, 0.7);
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.11;
    this.unbuiltPadGroup.add(ringMesh);
  }

  private buildConstructionScaffolding(): void {
    const scaffoldMat = Materials.getStandard(COLORS.armorGold, 0.4, 0.2);
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const x = Math.cos(angle) * 0.9;
      const z = Math.sin(angle) * 0.9;

      const beamGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.8, 6);
      const beam = new THREE.Mesh(beamGeo, scaffoldMat);
      beam.position.set(x, 0.9, z);
      this.constructionGroup.add(beam);
    }
  }

  public buildDefenseModel(): void {
    while (this.builtGroup.children.length > 0) {
      this.builtGroup.remove(this.builtGroup.children[0]);
    }
    this.rotatingTurretMesh = null;
    this.totemRings = [];

    const kind = this.defense.kind;

    if (kind === 'pulseTurret') {
      // Base pedestal
      const baseGeo = new THREE.CylinderGeometry(0.8, 1.0, 0.6, 8);
      const baseMesh = new THREE.Mesh(baseGeo, Materials.getStandard(COLORS.stoneDark, 0.6, 0.5));
      baseMesh.position.y = 0.3;
      baseMesh.castShadow = true;
      this.builtGroup.add(baseMesh);

      // Rotating turret head
      this.rotatingTurretMesh = new THREE.Group();
      this.rotatingTurretMesh.position.y = 0.7;

      const headGeo = new THREE.BoxGeometry(0.6, 0.4, 0.8);
      const headMesh = new THREE.Mesh(headGeo, Materials.getStandard(COLORS.techBlue, 0.4, 0.3));
      headMesh.castShadow = true;
      this.rotatingTurretMesh.add(headMesh);

      const barrelGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.7, 8);
      const barrel = new THREE.Mesh(barrelGeo, Materials.getStandard(COLORS.armorSteel, 0.3, 0.8));
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0, 0.6);
      this.rotatingTurretMesh.add(barrel);

      this.builtGroup.add(this.rotatingTurretMesh);
    } else if (kind === 'snareTotem') {
      // Totem pole
      const poleGeo = new THREE.CylinderGeometry(0.2, 0.3, 1.6, 6);
      const poleMat = Materials.getStandard(0x8e44ad, 0.5, 0.2);
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.y = 0.8;
      pole.castShadow = true;
      this.builtGroup.add(pole);

      // Floating energy rings
      for (let i = 0; i < 2; i++) {
        const ringGeo = new THREE.TorusGeometry(0.45, 0.06, 6, 16);
        const ringMat = Materials.getEmissive(0x9b59b6, 0x8e44ad, 1.5);
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.7 + i * 0.5;
        this.totemRings.push(ring);
        this.builtGroup.add(ring);
      }
    } else if (kind === 'repairBeacon') {
      // Antenna base
      const baseGeo = new THREE.CylinderGeometry(0.7, 0.9, 0.4, 8);
      const baseMesh = new THREE.Mesh(baseGeo, Materials.getStandard(COLORS.stoneDark, 0.6, 0.4));
      baseMesh.position.y = 0.2;
      this.builtGroup.add(baseMesh);

      // Green flower / antenna dish
      const dishGeo = new THREE.CylinderGeometry(0.8, 0.2, 0.4, 6);
      const dishMat = Materials.getStandard(COLORS.leafGreen, 0.4, 0.1);
      const dish = new THREE.Mesh(dishGeo, dishMat);
      dish.position.y = 1.0;
      dish.castShadow = true;
      this.builtGroup.add(dish);

      const lightGeo = new THREE.SphereGeometry(0.2, 8, 8);
      const lightMat = Materials.getEmissive(COLORS.leafGreenLight, COLORS.leafGreenLight, 1.5);
      const lightMesh = new THREE.Mesh(lightGeo, lightMat);
      lightMesh.position.y = 1.35;
      this.builtGroup.add(lightMesh);
    }
  }

  public update(delta: number): void {
    const status = this.defense.status;

    this.unbuiltPadGroup.visible = status === 'unbuilt';
    this.constructionGroup.visible = status === 'constructing';
    this.builtGroup.visible = status !== 'unbuilt' && status !== 'constructing';

    if (status === 'constructing') {
      this.constructionGroup.rotation.y += delta * 1.5;
    }

    if (status === 'active') {
      if (this.rotatingTurretMesh) {
        this.rotatingTurretMesh.rotation.y += delta * 0.8;
      }
      this.totemRings.forEach((ring, idx) => {
        ring.rotation.z += delta * (idx === 0 ? 2 : -2);
      });
    }
  }

  public dispose(): void {
    if (this.group.parent) {
      this.group.parent.remove(this.group);
    }
  }
}
