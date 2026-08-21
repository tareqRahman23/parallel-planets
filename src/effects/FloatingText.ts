import * as THREE from 'three';

export class FloatingText {
  private container: HTMLElement;

  constructor() {
    let el = document.getElementById('floating-text-container');
    if (!el) {
      el = document.createElement('div');
      el.id = 'floating-text-container';
      el.className = 'floating-text-container';
      document.getElementById('app-container')?.appendChild(el);
    }
    this.container = el;
  }

  public spawn(worldPos: THREE.Vector3, text: string, type: 'stone' | 'carrot' | 'damage' | 'heal', camera: THREE.Camera): void {
    const screenPos = worldPos.clone().project(camera);

    // Convert normalized device coords to screen pixels
    const x = ((screenPos.x + 1) / 2) * window.innerWidth;
    const y = ((-screenPos.y + 1) / 2) * window.innerHeight;

    // Slight random horizontal offset to prevent overlap
    const offsetX = (Math.random() - 0.5) * 30;

    const span = document.createElement('div');
    span.className = `floating-text-item float-${type}`;
    span.textContent = text;
    span.style.left = `${x + offsetX}px`;
    span.style.top = `${y}px`;

    this.container.appendChild(span);

    // Remove automatically after animation finishes
    setTimeout(() => {
      if (span.parentNode) {
        span.parentNode.removeChild(span);
      }
    }, 1200);
  }

  public dispose(): void {
    this.container.innerHTML = '';
  }
}
