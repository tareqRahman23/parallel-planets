import * as THREE from 'three';

export const COLORS = {
  homeGrass: 0x78a85a,
  homeGrassLight: 0x9bcb70,
  soil: 0x6b4932,
  soilDark: 0x4d3321,
  wood: 0x8b5a2b,
  straw: 0xd4b870,
  stone: 0x7d8790,
  stoneHighlight: 0xaab3b8,
  stoneDark: 0x5a636a,
  carrotOrange: 0xf27a32,
  carrotHighlight: 0xffa057,
  leafGreen: 0x4e9b4a,
  leafGreenLight: 0x6bc466,
  techBlue: 0x3fa7d6,
  techBlueDark: 0x1d6a94,
  techCyanGlow: 0x79e4f2,
  playerSuit: 0x3498db,
  playerWhite: 0xeaecee,
  playerVisor: 0x1c2833,
  playerBackpack: 0xf39c12,
  rabbitFur: 0xf5deb3,
  rabbitFurLight: 0xffeed1,
  rabbitPink: 0xffb6c1,
  armorSteel: 0x71808f,
  armorHighlight: 0xa9bbc7,
  armorGold: 0xf1c40f,
  rocketCream: 0xe7e1ce,
  rocketRed: 0xd45145,
  rocketDark: 0x34495e,
  enemyGround: 0x493a5a,
  enemyGroundDark: 0x2b2236,
  enemyDark: 0x24202d,
  enemyRed: 0xd84452,
  enemyEmissive: 0xff3355,
  coreShield: 0x00f0ff,
  white: 0xffffff,
  black: 0x111111,
};

export class Materials {
  private static cache: Map<string, THREE.Material> = new Map();

  static getStandard(color: number, roughness: number = 0.6, metalness: number = 0.1, flatShading: boolean = false): THREE.MeshStandardMaterial {
    const key = `std_${color}_${roughness}_${metalness}_${flatShading}`;
    if (!this.cache.has(key)) {
      this.cache.set(
        key,
        new THREE.MeshStandardMaterial({
          color,
          roughness,
          metalness,
          flatShading,
        })
      );
    }
    return this.cache.get(key) as THREE.MeshStandardMaterial;
  }

  static getEmissive(color: number, emissiveColor: number, emissiveIntensity: number = 1.0, roughness: number = 0.3): THREE.MeshStandardMaterial {
    const key = `emi_${color}_${emissiveColor}_${emissiveIntensity}_${roughness}`;
    if (!this.cache.has(key)) {
      this.cache.set(
        key,
        new THREE.MeshStandardMaterial({
          color,
          emissive: emissiveColor,
          emissiveIntensity,
          roughness,
          metalness: 0.2,
        })
      );
    }
    return this.cache.get(key) as THREE.MeshStandardMaterial;
  }

  static getTransparent(color: number, opacity: number = 0.5, emissiveColor?: number): THREE.MeshStandardMaterial {
    const key = `trans_${color}_${opacity}_${emissiveColor || 0}`;
    if (!this.cache.has(key)) {
      this.cache.set(
        key,
        new THREE.MeshStandardMaterial({
          color,
          transparent: true,
          opacity,
          roughness: 0.2,
          metalness: 0.1,
          emissive: emissiveColor || 0x000000,
          emissiveIntensity: emissiveColor ? 0.8 : 0,
          depthWrite: false,
        })
      );
    }
    return this.cache.get(key) as THREE.MeshStandardMaterial;
  }

  static clear(): void {
    this.cache.forEach((mat) => mat.dispose());
    this.cache.clear();
  }
}
