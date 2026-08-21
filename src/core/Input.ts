import * as THREE from 'three';
import { GameEvents } from '../app/GameEvents';

export class Input {
  private keysDown: Set<string> = new Set();
  private keysPressed: Set<string> = new Set();

  public mousePosition: THREE.Vector2 = new THREE.Vector2(); // Normalized device coordinates (-1 to +1)
  public mouseScreenPosition: THREE.Vector2 = new THREE.Vector2(); // Window pixels
  public isLeftMouseDown: boolean = false;
  public isMiddleMouseDown: boolean = false;
  public isRightMouseDown: boolean = false;

  public leftMouseClicked: boolean = false;
  public rightMouseClicked: boolean = false;
  public mouseDragDelta: THREE.Vector2 = new THREE.Vector2();
  public wheelDelta: number = 0;

  private lastMousePos: THREE.Vector2 = new THREE.Vector2();

  private onKeyDownBound: (e: KeyboardEvent) => void;
  private onKeyUpBound: (e: KeyboardEvent) => void;
  private onMouseDownBound: (e: MouseEvent) => void;
  private onMouseUpBound: (e: MouseEvent) => void;
  private onMouseMoveBound: (e: MouseEvent) => void;
  private onWheelBound: (e: WheelEvent) => void;
  private onContextMenuBound: (e: MouseEvent) => void;

  constructor() {
    this.onKeyDownBound = this.onKeyDown.bind(this);
    this.onKeyUpBound = this.onKeyUp.bind(this);
    this.onMouseDownBound = this.onMouseDown.bind(this);
    this.onMouseUpBound = this.onMouseUp.bind(this);
    this.onMouseMoveBound = this.onMouseMove.bind(this);
    this.onWheelBound = this.onWheel.bind(this);
    this.onContextMenuBound = (e: MouseEvent) => e.preventDefault();

    window.addEventListener('keydown', this.onKeyDownBound);
    window.addEventListener('keyup', this.onKeyUpBound);
    window.addEventListener('mousedown', this.onMouseDownBound);
    window.addEventListener('mouseup', this.onMouseUpBound);
    window.addEventListener('mousemove', this.onMouseMoveBound);
    window.addEventListener('wheel', this.onWheelBound, { passive: false });
    window.addEventListener('contextmenu', this.onContextMenuBound);
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (e.repeat) return;
    const key = e.key.toLowerCase();
    this.keysDown.add(key);
    this.keysPressed.add(key);

    if (key === 'escape') {
      GameEvents.emit('escape-pressed');
    }
    if (key === ' ') {
      GameEvents.emit('space-pressed');
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    const key = e.key.toLowerCase();
    this.keysDown.delete(key);
  }

  private onMouseDown(e: MouseEvent): void {
    const isUI = !!(e.target as HTMLElement)?.closest('.hud-layer, .top-purchase-bar, .modal-overlay, .modal-card, .main-menu-overlay, .pause-overlay, button, input');
    if (isUI) return;

    if (e.button === 0) {
      this.isLeftMouseDown = true;
      this.leftMouseClicked = true;
    } else if (e.button === 1) {
      this.isMiddleMouseDown = true;
    } else if (e.button === 2) {
      this.isRightMouseDown = true;
      this.rightMouseClicked = true;
    }

    this.lastMousePos.set(e.clientX, e.clientY);
  }

  private onMouseUp(e: MouseEvent): void {
    if (e.button === 0) {
      this.isLeftMouseDown = false;
    } else if (e.button === 1) {
      this.isMiddleMouseDown = false;
    } else if (e.button === 2) {
      this.isRightMouseDown = false;
    }
  }

  private onMouseMove(e: MouseEvent): void {
    this.mouseScreenPosition.set(e.clientX, e.clientY);
    this.mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mousePosition.y = -(e.clientY / window.innerHeight) * 2 + 1;

    if (this.isMiddleMouseDown || (this.isRightMouseDown && !this.keysDown.has('c'))) {
      const dx = e.clientX - this.lastMousePos.x;
      const dy = e.clientY - this.lastMousePos.y;
      this.mouseDragDelta.set(dx, dy);
    }
    this.lastMousePos.set(e.clientX, e.clientY);
  }

  private onWheel(e: WheelEvent): void {
    const isUI = !!(e.target as HTMLElement)?.closest('.modal-card, .deployment-creatures-list, .workshop-recipes-grid');
    if (!isUI) {
      e.preventDefault();
      this.wheelDelta += Math.sign(e.deltaY) * 1.5;
    }
  }

  public isKeyDown(key: string): boolean {
    return this.keysDown.has(key.toLowerCase());
  }

  public isKeyPressed(key: string): boolean {
    return this.keysPressed.has(key.toLowerCase());
  }

  public endFrame(): void {
    this.keysPressed.clear();
    this.leftMouseClicked = false;
    this.rightMouseClicked = false;
    this.mouseDragDelta.set(0, 0);
    this.wheelDelta = 0;
  }

  public dispose(): void {
    window.removeEventListener('keydown', this.onKeyDownBound);
    window.removeEventListener('keyup', this.onKeyUpBound);
    window.removeEventListener('mousedown', this.onMouseDownBound);
    window.removeEventListener('mouseup', this.onMouseUpBound);
    window.removeEventListener('mousemove', this.onMouseMoveBound);
    window.removeEventListener('wheel', this.onWheelBound);
    window.removeEventListener('contextmenu', this.onContextMenuBound);
  }
}
