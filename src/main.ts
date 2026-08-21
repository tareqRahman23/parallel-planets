import './style.css';
import { Game } from './app/Game';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) {
    throw new Error('Could not find #game-canvas element in DOM');
  }

  const game = new Game(canvas);
  game.start();

  // Expose game instance for debugging/testing
  (window as any).__PARALLEL_PLANETS__ = game;
});
