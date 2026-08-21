import * as THREE from 'three';
import { createAsset as createCarrot } from '../assets/polyfork/carrot-1f7e61.mjs';
import { createAsset as createForestRabbit } from '../assets/polyfork/forest-rabbit-ea2da0.mjs';
import { createAsset as createSpaceMine } from '../assets/polyfork/space-mine-3a1654.mjs';

/**
 * Locally bundled free Polyfork models. Keeping these behind small factories
 * makes their scale and shadow setup consistent with the game's dioramas.
 */
export function createPolyforkCarrot(): THREE.Group {
  const carrot = createCarrot();
  carrot.scale.setScalar(1.55);
  carrot.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return carrot;
}

export function createPolyforkRabbit(): THREE.Group {
  const rabbit = createForestRabbit({ colorway: 'snow-hare', pose: 'crouch', facets: 'chunky' });
  rabbit.scale.setScalar(6.0);
  rabbit.rotation.y = Math.PI;
  rabbit.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return rabbit;
}

export function createPolyforkSpaceMine(): THREE.Group {
  const mine = createSpaceMine({ colorway: 'coalition', spikes: 10, spikeLength: 0.16 });
  mine.scale.setScalar(0.7);
  mine.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return mine;
}
