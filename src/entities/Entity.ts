import * as THREE from 'three';
import { GameSession } from '../app/GameSession';

export interface InteractionContext {
  session: GameSession;
  playerPos: THREE.Vector3;
}

export interface InteractionResult {
  success: boolean;
  message?: string;
}

export interface Interactable {
  position: THREE.Vector3;
  interactionRadius?: number;
  getPrompt(session: GameSession): string | null;
  canInteract(session: GameSession): boolean;
  interact(context: InteractionContext): InteractionResult;
}

export interface ICombatant {
  readonly position: THREE.Vector3;
  readonly isDead: boolean;
  readonly isAlive?: boolean;
  readonly currentHealth: number;
  readonly maxHealth: number;
  takeDamage(amount: number): number;
}
