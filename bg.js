import * as THREE from 'three';

const canvas = document.getElementById('bg');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0A0F24, 0.08);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 8;

// JCI-blue wireframe icosahedron — "debate arena"
const geo = new THREE.IcosahedronGeometry(3, 1);
const mat = new THREE.MeshBasicMaterial({ color: 0x0051C7, wireframe: true, transparent: true, opacity: 0.35 });
const mesh = new THREE.Mesh(geo, mat);
scene.add(mesh);

const geo2 = new THREE.IcosahedronGeometry(2, 0);
const mat2 = new THREE.MeshBasicMaterial({ color: 0xFFC72C, wireframe: true, transparent: true, opacity: 0.2 });
const mesh2 = new THREE.Mesh(geo2, mat2);
scene.add(mesh2);

// Star particles
const starGeo = new THREE.BufferGeometry();
const starCount = 400;
const pos = new Float32Array(starCount * 3);
for (let i = 0; i < starCount * 3; i++) pos[i] = (Math.random() - 0.5) * 40;
starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, transparent: true, opacity: 0.6 }));
scene.add(stars);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate(t) {
  requestAnimationFrame(animate);
  mesh.rotation.x = t * 0.0002;
  mesh.rotation.y = t * 0.0003;
  mesh2.rotation.x = -t * 0.0003;
  mesh2.rotation.y = -t * 0.0002;
  stars.rotation.y = t * 0.00005;
  renderer.render(scene, camera);
}
animate(0);
