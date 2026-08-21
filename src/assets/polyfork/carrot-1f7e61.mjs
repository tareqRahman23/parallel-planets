/*
 * Carrot
 * https://polyfork.dev/asset/carrot-1f7e61
 *
 * A parametric low-poly model for three.js: one import, no loader, no
 * textures, one draw call. createAsset() returns a ready THREE.Group.
 *
 * QUICK START
 *
 *   import { createAsset } from './carrot-1f7e61.mjs';
 *   scene.add(createAsset());
 *
 *   // or with knobs: 4 named colorways, per-zone colours, two proportion sliders
 *   scene.add(createAsset({ colorway: 'heirloom-purple', plumpness: 1.2 }));
 *
 * The bare "three" specifiers below resolve through any bundler, or through
 * an importmap in your page:
 *
 *   { "imports": { "three": "https://unpkg.com/three@0.180.0/build/three.module.js",
 *                  "three/addons/": "https://unpkg.com/three@0.180.0/examples/jsm/" } }
 *
 * Browsers refuse to load ES modules from file:// URLs, so a page of your own
 * that imports this file has to be served over http:  python3 -m http.server
 *
 * The index.html in this asset's .zip download sidesteps that and opens with
 * a double-click. The store page above has the same snippet for Unity, Godot,
 * Blender and GLB.
 *
 * SPECS  354 triangles, 1 material, 0.11 x 0.29 x 0.11 m (real-world scale).
 *
 * LICENSE  Personal and commercial use: games, apps, client work. Modify
 *          freely, no attribution required. Do not resell or redistribute
 *          the file itself as an asset. Terms: https://polyfork.dev/licensing
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const COLORWAYS = {
  'market':          { body: '#f07818', leaf: '#4ca13a', stem: '#357a28' },
  'heirloom-purple': { body: '#6e3b8a', leaf: '#4ca13a', stem: '#357a28' },
  'golden':          { body: '#f0a818', leaf: '#4ca13a', stem: '#357a28' },
  'white-chantenay': { body: '#f2e3c2', leaf: '#4ca13a', stem: '#357a28' },
};

export const presets = COLORWAYS;

export const params = {
  colorway: {
    type: 'choice', default: 'market', label: 'Colorway', affects: 'colors',
    options: ['market', 'heirloom-purple', 'golden', 'white-chantenay'],
    describe: 'Named colour scheme for the whole carrot. market is the reference: ' +
      'bright orange root with a mid-green top. heirloom-purple is the deep purple ' +
      'heritage carrot, golden is a yellow root, white-chantenay is a pale cream ' +
      'root — all three keep the same green foliage so the top still reads as ' +
      'leaves at thumbnail size. Sets all three colour zones unless a zone colour ' +
      'is passed explicitly, which wins.',
  },
  body: {
    type: 'color', default: '#f07818', label: 'Root', affects: 'colors',
    describe: 'Albedo of the whole root: the tapered body, both growth rings and ' +
      'the domed crown. This is the largest zone in the asset (~55% of the ' +
      'surface) and carries the read, so keep it a different hue from the ' +
      'foliage — matched to Leaf, the vegetable collapses into one green mass.',
  },
  leaf: {
    type: 'color', default: '#4ca13a', label: 'Leaf', affects: 'colors',
    describe: 'Albedo of the seven flattened frond blades fanning out of the ' +
      'crown — the feature that stops the silhouette reading as a plain cone. ' +
      'Keep it clearly LIGHTER than the frond stems so the two-part fronds stay ' +
      'legible, and a different hue from Root.',
  },
  plumpness: {
    type: 'range', default: 1.0, min: 0.78, max: 1.25, step: 0.01,
    label: 'Plumpness', affects: 'geometry',
    describe: 'Girth of the root as a ratio of the reference shoulder diameter ' +
      '(80 mm). 0.78 is a slender 62 mm finger carrot, 1.00 is the reference, ' +
      '1.25 is a fat 100 mm chantenay. This REBUILDS the lathe profile — every ' +
      'radius including the growth rings scales together, so the taper and the ' +
      'ring relief keep their proportions at every setting. Height, leaf fan ' +
      'and triangle count (354) are unchanged across the whole range.',
  },
  leafLength: {
    type: 'range', default: 1.0, min: 0.65, max: 1.45, step: 0.01,
    label: 'Leaf length', affects: 'geometry',
    describe: 'Length of the leafy top as a ratio of the reference (the longest ' +
      'frond is 118 mm stem-to-tip). 0.65 is a trimmed bunch, 1.00 the ' +
      'reference, 1.45 a lush 171 mm spray that roughly doubles the green mass ' +
      'above the shoulder. Stems and blades scale together so the fronds keep ' +
      'their bend; spread, root and triangle count (354) are unchanged across ' +
      'the whole range.',
  },
};

const parts = [];
const add = (g, c) => parts.push({ g, c });

function prep(geo, hex) {
  geo = geo.toNonIndexed();
  geo.deleteAttribute('uv');
  geo.deleteAttribute('normal');
  const c = new THREE.Color(hex);
  const n = geo.attributes.position.count;
  const col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
}

function finish(list) {
  const merged = mergeGeometries(list.map(p => prep(p.g, p.c)));
  merged.computeVertexNormals();
  return new THREE.Mesh(merged, new THREE.MeshStandardMaterial({
    vertexColors: true, flatShading: true, roughness: 0.85, metalness: 0,
  }));
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

const SIDES = 10;
const TOP_Y = 0.184;

const PROFILE = [
  [0.002, 0.000],
  [0.015, 0.032],
  [0.023, 0.062],
  [0.0265, 0.076],
  [0.0235, 0.090],
  [0.030, 0.122],
  [0.0355, 0.148],
  [0.0335, 0.162],
  [0.040, TOP_Y],
  [0.0365, 0.196],
  [0.003, 0.212],
];

const LEAVES = 7;
const STEM = 0.022;

export function createAsset(userParams = {}) {
  const P = {};
  for (const k of Object.keys(params)) P[k] = params[k].default;
  Object.assign(P, userParams);

  const way = COLORWAYS[P.colorway] || COLORWAYS['market'];
  const C = {
    body: userParams.body ?? (userParams.colorway ? way.body : params.body.default),
    leaf: userParams.leaf ?? (userParams.colorway ? way.leaf : params.leaf.default),
    stem: userParams.colorway ? way.stem : COLORWAYS['market'].stem,
  };

  const G = clamp(P.plumpness, params.plumpness.min, params.plumpness.max);
  const L = clamp(P.leafLength, params.leafLength.min, params.leafLength.max);

  const profile = PROFILE.map(([r, y]) => new THREE.Vector2(r * G, y));
  add(new THREE.LatheGeometry(profile, SIDES), C.body);

  const stemLen = STEM * L;
  for (let i = 0; i < LEAVES; i++) {
    const long = i % 2 === 0;
    const len = (long ? 0.096 : 0.076) * L;
    const tilt = long ? 0.44 : 0.24;
    const bend = 0.22;
    const angle = (i / LEAVES) * Math.PI * 2 + 0.4;

    const stem = new THREE.CylinderGeometry(0.0055, 0.009, stemLen, 3, 1, true)
      .translate(0, stemLen / 2, 0)
      .rotateZ(tilt)
      .rotateY(angle)
      .translate(0, TOP_Y + 0.008, 0);
    add(stem, C.stem);

    const blade = new THREE.CylinderGeometry(0.004, 0.024, len, 4)
      .scale(1, 1, 0.55)
      .translate(0, len / 2, 0)
      .rotateZ(bend)
      .translate(0, stemLen, 0)
      .rotateZ(tilt)
      .rotateY(angle)
      .translate(0, TOP_Y + 0.008, 0);
    add(blade, C.leaf);
  }

  const g = new THREE.Group();
  g.name = 'carrot';
  g.add(finish(parts));
  parts.length = 0;
  return g;
}

export const rig = {};
export const detach = [];
export const night = {};
