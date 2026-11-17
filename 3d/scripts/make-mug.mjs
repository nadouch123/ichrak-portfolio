// Builds the default model for /3d/ (a ceramic mug with two swappable handles and a saucer)
// from code, then writes it as a GLB. Compress afterwards with gltf-transform (see three-d/README.md).
// Run: node three-d/scripts/make-mug.mjs /tmp/studio-mug.raw.glb
import { writeFileSync } from 'node:fs';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// GLTFExporter reads its binary output through FileReader, which Node does not have.
globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(b => { this.result = b; this.onloadend?.(); }); }
  readAsDataURL(blob) { blob.arrayBuffer().then(b => { this.result = 'data:' + blob.type + ';base64,' + Buffer.from(b).toString('base64'); this.onloadend?.(); }); }
};

const out = process.argv[2] || 'studio-mug.raw.glb';
const SEG = 72;
const mat = (name, color, roughness, metalness = 0) =>
  Object.assign(new THREE.MeshStandardMaterial({ color, roughness, metalness }), { name });

const glaze = mat('Glaze', '#2457a6', 0.18);
const interior = mat('Interior', '#f4efe6', 0.25);
const clay = mat('Clay', '#c9a27e', 0.9);

const mug = new THREE.Group();
mug.name = 'StudioMug';

// Outer wall: a lathe profile from the foot up to the rim (units in decimetres, mug ~1 tall).
const outer = [
  [0.0, 0.04], [0.33, 0.04], [0.36, 0.05], [0.38, 0.09], [0.4, 0.3], [0.41, 0.6], [0.42, 0.9], [0.425, 0.97],
].map(([x, y]) => new THREE.Vector2(x, y));
const body = new THREE.Mesh(mergeVertices(new THREE.LatheGeometry(outer, SEG)), glaze);
body.name = 'Body';

// Rim + inside wall + inner floor share the cream interior glaze.
const inner = [
  [0.425, 0.97], [0.418, 0.995], [0.395, 0.99], [0.385, 0.93], [0.37, 0.6], [0.355, 0.25], [0.33, 0.14], [0.0, 0.13],
].map(([x, y]) => new THREE.Vector2(x, y));
const inside = new THREE.Mesh(mergeVertices(new THREE.LatheGeometry(inner, SEG)), interior);
inside.name = 'Interior';

// Unglazed foot ring: raw clay, like real stoneware.
const foot = [[0.0, 0.0], [0.3, 0.0], [0.335, 0.012], [0.345, 0.04], [0.33, 0.04], [0.0, 0.04]].map(([x, y]) => new THREE.Vector2(x, y));
const footMesh = new THREE.Mesh(mergeVertices(new THREE.LatheGeometry(foot, SEG)), clay);
footMesh.name = 'Foot';

// Handle A: a classic loop.
const loop = new THREE.CatmullRomCurve3([
  [0.37, 0.82], [0.56, 0.84], [0.66, 0.72], [0.66, 0.46], [0.56, 0.3], [0.375, 0.3],
].map(([x, y]) => new THREE.Vector3(x, y, 0)));
const handleRound = new THREE.Mesh(new THREE.TubeGeometry(loop, 64, 0.045, 18), glaze);
handleRound.name = 'Handle_Loop';

// Handle B: a squared-off modern handle, flattened like a strap.
const strapPath = new THREE.CatmullRomCurve3([
  [0.37, 0.86], [0.62, 0.86], [0.7, 0.8], [0.7, 0.36], [0.62, 0.3], [0.375, 0.3],
].map(([x, y]) => new THREE.Vector3(x, y, 0)), false, 'catmullrom', 0.1);
const strapGeo = new THREE.TubeGeometry(strapPath, 80, 0.05, 18);
strapGeo.scale(1, 1, 1.25);
const handleStrap = new THREE.Mesh(strapGeo, glaze);
handleStrap.name = 'Handle_Strap';
handleStrap.visible = true;

// Saucer.
const saucerProfile = [
  [0.0, -0.06], [0.36, -0.06], [0.42, -0.045], [0.7, 0.0], [0.74, 0.03], [0.73, 0.045], [0.68, 0.03], [0.44, -0.005], [0.0, -0.005],
].map(([x, y]) => new THREE.Vector2(x, y));
const saucer = new THREE.Mesh(mergeVertices(new THREE.LatheGeometry(saucerProfile, SEG)), glaze);
saucer.name = 'Saucer';

for (const m of [body, inside, footMesh, handleRound, handleStrap, saucer]) {
  m.geometry.computeVertexNormals();
  mug.add(m);
}

const scene = new THREE.Scene();
scene.add(mug);
new GLTFExporter().parse(scene, (glb) => {
  writeFileSync(out, Buffer.from(glb));
  console.log('wrote', out, glb.byteLength, 'bytes');
}, (e) => { console.error(e); process.exit(1); }, { binary: true });
