// SUNCOAST: HEATLINE — bootstrap and game loop.
// Renders the world, drives the car (or the walker on foot in job 4),
// chases with the camera, and exposes window.__game so tests can read
// live state: cash, job, REP, wanted, speed, console errors.

import * as THREE from '../vendor/three.module.js';
import { WORLD } from './config.js';
import { Input } from './input.js';
import { World } from './world.js';
import { buildCarMesh, Vehicle } from './vehicle.js';
import { NpcManager } from './npcs.js';
import { PoliceManager } from './police.js';
import { MissionManager } from './missions.js';
import { AudioEngine } from './audio.js';
import { Hud } from './hud.js';
import { applyShot } from './shots.js';

const params = new URLSearchParams(window.location.search);
const seed = Number(params.get('seed') || WORLD.seed);

const canvasHost = document.getElementById('game-host');
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
canvasHost.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xff9a56);
const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 1200);

const world = new World(scene);
const carMesh = buildCarMesh(0xff5a1f);
scene.add(carMesh);
const vehicle = new Vehicle(carMesh);
const npcs = new NpcManager(scene, seed);
const police = new PoliceManager(scene, world.colliders, seed);
const audio = new AudioEngine();
const hud = new Hud(document.getElementById('hud'));
const missions = new MissionManager(scene, npcs, police, audio, hud);
const input = new Input();

if (params.get('hud') === '0') hud.setVisible(false);

const game = {
  scene, camera, renderer, world, vehicle, npcs, police, missions, audio, hud, input,
  cameraMode: 'chase',
  time: 0,
  frames: 0,
  errors: [],
};

window.addEventListener('error', (event) => game.errors.push(String(event.message || event.error)));
window.addEventListener('unhandledrejection', (event) => game.errors.push(String(event.reason)));

function updateCamera(dt) {
  if (game.cameraMode === 'fixed') return;
  // Chase camera: behind and above the car (or the walker on foot).
  const target = missions.onFoot && missions.walker
    ? { x: missions.walker.position.x, z: missions.walker.position.z, heading: missions.walkerHeading || 0 }
    : { x: vehicle.x, z: vehicle.z, heading: vehicle.heading };
  const back = 11;
  const wantX = target.x - Math.sin(target.heading) * back;
  const wantZ = target.z - Math.cos(target.heading) * back;
  const k = Math.min(1, dt * 5);
  camera.position.x += (wantX - camera.position.x) * k;
  camera.position.z += (wantZ - camera.position.z) * k;
  camera.position.y += (7.5 - camera.position.y) * k;
  camera.lookAt(target.x + Math.sin(target.heading) * 8, 1.5, target.z + Math.cos(target.heading) * 8);
}

let last = performance.now();
function loop(now) {
  // Clamped at 0.1 so the game still advances on slow software renderers.
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  game.time += dt;
  game.frames += 1;

  if (input.wasPressed('h')) hud.setVisible(!hud.visible);
  if (input.wasPressed('m')) audio.toggleMute();
  if (input.wasPressed('r')) {
    missions.restartJob(vehicle);
    if (!missions.onFoot) vehicle.place(-84, 40, Math.PI);
  }
  if (input.down('w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright')) {
    audio.unlock();
  }

  world.update(game.time);
  if (!game.shotMode) npcs.update(dt);
  if (!game.shotMode) {
    if (missions.onFoot) {
      missions.update(dt, { x: missions.walker.position.x, z: missions.walker.position.z }, input, vehicle);
    } else {
      vehicle.update(dt, input);
      missions.update(dt, { x: vehicle.x, z: vehicle.z }, input, vehicle);
    }
  }
  if (!game.shotMode) police.update(dt, { x: vehicle.x, z: vehicle.z }, game.time);
  audio.setEngine(vehicle.speedKmh, !missions.onFoot && Math.abs(vehicle.speed) > 1);
  audio.setSiren(missions.wanted > 0, dt);
  updateCamera(dt);
  hud.render(missions.getState(vehicle.speedKmh, vehicle.driftCount));
  input.endFrame();
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

window.__game = {
  game,
  getState() {
    const state = missions.getState(vehicle.speedKmh, vehicle.driftCount);
    return {
      ...state,
      speedKmh: vehicle.speedKmh,
      x: vehicle.x,
      z: vehicle.z,
      frames: game.frames,
      time: game.time,
      errors: game.errors,
      heliVisible: police.heli.group.visible,
      cruisers: police.cruisers.length,
    };
  },
  drive(throttleKey, ms) {
    return new Promise((resolve) => {
      input.keys.add(throttleKey);
      setTimeout(() => {
        input.keys.delete(throttleKey);
        resolve();
      }, ms);
    });
  },
  shot(name) {
    applyShot(game, name);
  },
};

camera.position.set(-84, 7.5, 51);
camera.lookAt(-84, 1.5, 32);

const shot = params.get('shot');
game.shotMode = !!shot;
if (shot) {
  // Stage the shot, then let a few frames settle before flagging ready.
  applyShot(game, shot);
  let settle = 0;
  const settleLoop = () => {
    world.update(game.time);
    renderer.render(scene, camera);
    settle += 1;
    if (settle < 5) requestAnimationFrame(settleLoop);
    else window.__ready = true;
  };
  requestAnimationFrame(settleLoop);
} else {
  window.__ready = true;
}
requestAnimationFrame(loop);
