import * as THREE from 'three';
import { MachineState } from '../app/GameSession';
import { Materials, COLORS } from '../models/materials';
import { createDrillModel, DrillModelParts } from '../models/createDrillModel';
import { createFabricatorModel } from '../models/createFabricatorModel';
import { createFeedPressModel } from '../models/createFeedPressModel';
import { createWorkshopModel } from '../models/createWorkshopModel';

export class MachineEntity {
  public readonly machine: MachineState;
  public readonly group: THREE.Group;
  public readonly position: THREE.Vector3;

  private unbuiltPadGroup: THREE.Group;
  private constructionGroup: THREE.Group;
  private builtGroup: THREE.Group;
  private drillParts: DrillModelParts | null = null;
  private outputMeshes: THREE.Mesh[] = [];
  private progressFill: THREE.Sprite;
  private levelPips: THREE.Sprite[] = [];
  private activationFeedbackRemaining = 0;

  constructor(machine: MachineState, position: [number, number, number]) {
    this.machine = machine;
    this.position = new THREE.Vector3(...position);
    this.group = new THREE.Group();
    this.group.position.copy(this.position);

    this.unbuiltPadGroup = new THREE.Group();
    this.constructionGroup = new THREE.Group();
    this.builtGroup = new THREE.Group();

    this.group.add(this.unbuiltPadGroup);
    this.group.add(this.constructionGroup);
    this.group.add(this.builtGroup);

    const progressBackground = new THREE.Sprite(new THREE.SpriteMaterial({
      color: 0x172027,
      transparent: true,
      opacity: 0.9,
      depthTest: false,
    }));
    progressBackground.position.set(0, 2.85, 0);
    progressBackground.scale.set(1.55, 0.18, 1);
    this.group.add(progressBackground);

    this.progressFill = new THREE.Sprite(new THREE.SpriteMaterial({
      color: 0x32d583,
      transparent: true,
      opacity: 0.96,
      depthTest: false,
    }));
    this.progressFill.position.set(0, 2.85, 0.01);
    this.group.add(this.progressFill);

    for (let index = 0; index < 3; index++) {
      const pip = new THREE.Sprite(new THREE.SpriteMaterial({
        color: 0xffc857,
        depthTest: false,
      }));
      pip.position.set(-0.25 + index * 0.25, 3.12, 0.01);
      pip.scale.set(0.13, 0.13, 1);
      this.levelPips.push(pip);
      this.group.add(pip);
    }

    this.buildUnbuiltPad();
    this.buildConstructionScaffolding();
    this.buildMachineModel();
  }

  private buildUnbuiltPad(): void {
    const padGeo = new THREE.CylinderGeometry(1.6, 1.7, 0.1, 16);
    const padMat = Materials.getStandard(COLORS.rocketDark, 0.8, 0.2);
    const padMesh = new THREE.Mesh(padGeo, padMat);
    padMesh.receiveShadow = true;
    padMesh.position.y = 0.05;
    this.unbuiltPadGroup.add(padMesh);

    // Blue dotted outline ring
    const ringGeo = new THREE.RingGeometry(1.55, 1.7, 16);
    const ringMat = Materials.getTransparent(COLORS.playerSuit, 0.7);
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.11;
    this.unbuiltPadGroup.add(ringMesh);
  }

  private buildConstructionScaffolding(): void {
    const scaffoldMat = Materials.getStandard(COLORS.armorGold, 0.4, 0.2);
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const x = Math.cos(angle) * 1.2;
      const z = Math.sin(angle) * 1.2;

      const beamGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.0, 6);
      const beam = new THREE.Mesh(beamGeo, scaffoldMat);
      beam.position.set(x, 1.0, z);
      this.constructionGroup.add(beam);
    }
  }

  private buildMachineModel(): void {
    const kind = this.machine.kind;

    if (kind === 'drill') {
      this.drillParts = createDrillModel();
      this.builtGroup.add(this.drillParts.root);
    } else if (kind === 'spinnery') {
      const spinneryParts = createFeedPressModel();
      this.builtGroup.add(spinneryParts.root);
    } else if (kind === 'tailor') {
      const tailorParts = createFabricatorModel();
      this.builtGroup.add(tailorParts.root);
    } else if (kind === 'stoneForge') {
      const forgeParts = createFabricatorModel();
      forgeParts.root.scale.set(1.2, 1.2, 1.2);
      this.builtGroup.add(forgeParts.root);
    } else if (kind === 'workshop') {
      const wsParts = createWorkshopModel();
      this.builtGroup.add(wsParts.root);
    }

    // Output tray visual slots
    for (let i = 0; i < this.machine.maxOutputSlots; i++) {
      const outGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
      const outMesh = new THREE.Mesh(outGeo, Materials.getStandard(COLORS.techBlue, 0.5, 0.3));
      outMesh.position.set(1.1, 0.25, -0.6 + i * 0.5);
      outMesh.visible = false;
      this.builtGroup.add(outMesh);
      this.outputMeshes.push(outMesh);
    }
  }

  public update(delta: number): void {
    const status = this.machine.status;

    this.unbuiltPadGroup.visible = status === 'unbuilt';
    this.constructionGroup.visible = status === 'constructing';
    this.builtGroup.visible = status !== 'unbuilt' && status !== 'constructing';

    if (status === 'constructing') {
      this.constructionGroup.rotation.y += delta * 1.5;
    }

    if (this.drillParts && status === 'processing') {
      this.drillParts.drillHead.rotation.y += delta * 6;
      this.drillParts.piston.position.y = 1.2 + Math.sin(Date.now() * 0.008) * 0.1;
    }

    // Update Output tray visibility
    const trayCount = this.machine.outputTray.length;
    this.outputMeshes.forEach((mesh, idx) => {
      mesh.visible = idx < trayCount;
      if (idx < trayCount) {
        mesh.rotation.y += delta * 2;
      }
    });

    if (status === 'disabled') {
      this.builtGroup.position.y = -0.1; // Tilted slightly
    } else {
      this.builtGroup.position.y = 0;
    }

    this.activationFeedbackRemaining = Math.max(0, this.activationFeedbackRemaining - delta);
    const activationPulse = this.activationFeedbackRemaining > 0
      ? Math.sin((0.28 - this.activationFeedbackRemaining) * 32) * 0.07
      : 0;
    this.builtGroup.scale.setScalar(1 + activationPulse);

    const visible = status !== 'unbuilt' && status !== 'constructing';
    const job = this.machine.activeJob;
    const progress = job ? THREE.MathUtils.clamp(job.elapsedSeconds / job.durationSeconds, 0.03, 1) : 0.03;
    this.progressFill.visible = visible;
    this.progressFill.scale.set(1.45 * progress, 0.1, 1);
    this.progressFill.position.x = -0.725 + (1.45 * progress) / 2;
    (this.progressFill.material as THREE.SpriteMaterial).color.setHex(
      status === 'disabled' ? 0xe2424b : job ? 0x32d583 : 0x3fa7d6
    );
    this.levelPips.forEach((pip, index) => {
      pip.visible = visible;
      (pip.material as THREE.SpriteMaterial).opacity = index < this.machine.level ? 1 : 0.2;
    });
  }

  public playActivationFeedback(): void {
    this.activationFeedbackRemaining = 0.28;
  }

  public dispose(): void {
    if (this.group.parent) {
      this.group.parent.remove(this.group);
    }
  }
}
