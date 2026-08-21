import * as THREE from 'three';
import { GameSession, PlacementTool } from '../app/GameSession';
import { Input } from '../core/Input';
import { GameEvents } from '../app/GameEvents';

export class PlacementSystem {
  private session: GameSession;
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private groundPlane: THREE.Plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  // Ghost visuals
  private ghostGroup: THREE.Group;
  private ghostCarrotMesh: THREE.Mesh;
  private ghostMatValid: THREE.MeshBasicMaterial;
  private ghostMatInvalid: THREE.MeshBasicMaterial;

  public activeTool: PlacementTool = 'none';
  public currentHoverPos: THREE.Vector3 = new THREE.Vector3();
  public isValidPlacement: boolean = false;

  constructor(session: GameSession, scene: THREE.Scene, camera: THREE.Camera) {
    this.session = session;
    this.scene = scene;
    this.camera = camera;

    this.ghostGroup = new THREE.Group();
    this.ghostMatValid = new THREE.MeshBasicMaterial({ color: 0x2ecc71, transparent: true, opacity: 0.6 });
    this.ghostMatInvalid = new THREE.MeshBasicMaterial({ color: 0xe74c3c, transparent: true, opacity: 0.6 });

    // Ghost carrot patch mesh
    const patchGeo = new THREE.CylinderGeometry(1.0, 1.1, 0.1, 16);
    this.ghostCarrotMesh = new THREE.Mesh(patchGeo, this.ghostMatValid);
    this.ghostGroup.add(this.ghostCarrotMesh);
    this.ghostGroup.visible = false;
    this.scene.add(this.ghostGroup);

    this.setupListeners();
  }

  private setupListeners(): void {
    GameEvents.on('set-placement-tool', (tool: PlacementTool) => {
      this.setTool(tool);
    });
    GameEvents.on('escape-pressed', () => {
      if (this.activeTool !== 'none') {
        this.setTool('none');
      }
    });
  }

  public setTool(tool: PlacementTool): void {
    this.activeTool = tool;
    this.session.home.activePlacementTool = tool;
    this.ghostGroup.visible = tool === 'carrot';
    GameEvents.emit('placement-tool-changed', tool);
  }

  public update(input: Input): void {
    if (input.rightMouseClicked) {
      if (this.activeTool !== 'none') {
        this.setTool('none');
        return;
      }
    }

    if (this.activeTool === 'none') {
      this.ghostGroup.visible = false;
      return;
    }

    // Raycast against ground plane
    this.raycaster.setFromCamera(input.mousePosition, this.camera);
    const hitPoint = new THREE.Vector3();
    const hit = this.raycaster.ray.intersectPlane(this.groundPlane, hitPoint);

    if (hit) {
      this.currentHoverPos.copy(hitPoint);

      if (this.activeTool === 'carrot') {
        this.ghostGroup.visible = true;
        this.ghostGroup.position.copy(hitPoint);
        this.ghostGroup.position.y = 0.05;

        const posTuple: [number, number, number] = [hitPoint.x, 0, hitPoint.z];
        this.isValidPlacement = this.session.canPlaceCarrot(posTuple);
        this.ghostCarrotMesh.material = this.isValidPlacement ? this.ghostMatValid : this.ghostMatInvalid;

        if (input.leftMouseClicked && this.isValidPlacement) {
          const patch = this.session.placeCarrot(posTuple);
          if (patch) {
            if (this.session.coins < 3) {
              this.setTool('none');
            }
          }
        }
      }
    } else {
      this.ghostGroup.visible = false;
    }
  }

  public dispose(): void {
    this.scene.remove(this.ghostGroup);
    this.ghostCarrotMesh.geometry.dispose();
    this.ghostMatValid.dispose();
    this.ghostMatInvalid.dispose();
  }
}
