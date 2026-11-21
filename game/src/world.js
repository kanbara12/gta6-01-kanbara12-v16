// SUNCOAST: HEATLINE — the world: ocean, beach, coastline, waterfront
// district, downtown Ocean Ave, ferris wheel, palms and the hotel pool deck.
// Everything is built from Three.js primitives; no external assets.

import * as THREE from '../vendor/three.module.js';
import { WORLD } from './config.js';
import { mulberry32, range } from './random.js';

const PALETTE = {
  sunsetSky: 0xff9a56,
  duskSky: 0x2a1e4f,
  ocean: 0x1a5f8a,
  oceanDeep: 0x0d3a5c,
  sand: 0xe8c98f,
  sandWet: 0xc9a86a,
  asphalt: 0x2b2f36,
  sidewalk: 0x8f8a80,
  building: [0xcf8f6a, 0xb0705f, 0x7a6a8f, 0x5f7a8f, 0xd0a060],
  windowLit: 0xffd27a,
  windowDark: 0x2a3542,
  palmTrunk: 0x7a5230,
  palmLeaf: 0x2e8b57,
  ferris: 0xff5a7a,
  pool: 0x35c8e8,
  deck: 0xd8cfc0,
};

function box(w, h, d, color, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshLambertMaterial({ color }),
  );
  mesh.position.set(x, y, z);
  return mesh;
}

export class World {
  constructor(scene) {
    this.scene = scene;
    this.rng = mulberry32(WORLD.seed);
    this.oceanMesh = null;
    this.oceanBase = null;
    this.ferrisWheel = null;
    this.sunMesh = null;
    this.sunLight = null;
    this.colliders = []; // { x, z, r } circles the police use for avoidance
    this.build();
  }

  build() {
    const { scene, rng } = this;
    scene.fog = new THREE.Fog(0xffb37a, 220, 700);

    // Sky dome colour is the background; the sun disc hangs over the ocean.
    this.sunLight = new THREE.DirectionalLight(0xffb37a, 2.2);
    this.sunLight.position.set(-180, 55, -60);
    scene.add(this.sunLight);
    scene.add(new THREE.AmbientLight(0xffc9a0, 0.55));
    const hemi = new THREE.HemisphereLight(0xffd0a0, 0x3a2a1a, 0.5);
    scene.add(hemi);

    this.sunMesh = new THREE.Mesh(
      new THREE.CircleGeometry(26, 40),
      new THREE.MeshBasicMaterial({ color: 0xffd23e, fog: false }),
    );
    this.sunMesh.position.set(-320, 42, -40);
    this.sunMesh.lookAt(0, 42, 0);
    scene.add(this.sunMesh);

    // Ocean: a subdivided plane whose vertices we animate as swell.
    const oceanGeo = new THREE.PlaneGeometry(260, 700, 18, 40);
    oceanGeo.rotateX(-Math.PI / 2);
    this.oceanBase = oceanGeo.attributes.position.array.slice();
    this.oceanMesh = new THREE.Mesh(
      oceanGeo,
      new THREE.MeshLambertMaterial({ color: PALETTE.ocean }),
    );
    this.oceanMesh.position.set(WORLD.oceanX - 110, 0.4, 0);
    scene.add(this.oceanMesh);

    // Wet sand strip, then dry beach. The wet strip meets the ocean edge.
    const wet = new THREE.Mesh(
      new THREE.PlaneGeometry(44, 700),
      new THREE.MeshLambertMaterial({ color: PALETTE.sandWet }),
    );
    wet.rotation.x = -Math.PI / 2;
    wet.position.set(-173, 0.5, 0);
    scene.add(wet);
    const sand = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 700),
      new THREE.MeshLambertMaterial({ color: PALETTE.sand }),
    );
    sand.rotation.x = -Math.PI / 2;
    sand.position.set(-122, 0.45, 0);
    scene.add(sand);

    // Ground for the city.
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(560, 700),
      new THREE.MeshLambertMaterial({ color: 0x6f6a5e }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(130, 0.4, 0);
    scene.add(ground);

    this.buildRoads();
    this.buildDistrict();
    this.buildPalms();
    this.buildFerrisWheel();
    this.buildPoolDeck();
    this.buildProps();
  }

  buildRoads() {
    const { scene } = this;
    // Ocean Ave runs north-south along the beachfront; cross streets east.
    const ave = new THREE.Mesh(
      new THREE.PlaneGeometry(WORLD.roadWidth, 680),
      new THREE.MeshLambertMaterial({ color: PALETTE.asphalt }),
    );
    ave.rotation.x = -Math.PI / 2;
    ave.position.set(-84, 0.55, 0);
    scene.add(ave);
    for (const z of [-180, -90, 0, 90, 180]) {
      const street = new THREE.Mesh(
        new THREE.PlaneGeometry(320, WORLD.roadWidth),
        new THREE.MeshLambertMaterial({ color: PALETTE.asphalt }),
      );
      street.rotation.x = -Math.PI / 2;
      street.position.set(60, 0.55, z);
      scene.add(street);
      // Centre dashes.
      for (let x = -70; x < 210; x += 12) {
        const dash = box(4, 0.1, 0.5, 0xf5d76a, x, 0.6, z);
        scene.add(dash);
      }
    }
    // Sidewalks flanking Ocean Ave.
    for (const x of [-90.5, -77.5]) {
      const walk = new THREE.Mesh(
        new THREE.PlaneGeometry(3, 680),
        new THREE.MeshLambertMaterial({ color: PALETTE.sidewalk }),
      );
      walk.rotation.x = -Math.PI / 2;
      walk.position.set(x, 0.58, 0);
      scene.add(walk);
    }
  }

  buildDistrict() {
    const { scene, rng } = this;
    // Waterfront hotels west row + downtown blocks east of Ocean Ave.
    // The two plots facing the hotel pool deck stay open (a pool courtyard),
    // so the pool reads from Ocean Ave. Heights are drawn either way so the
    // seeded layout downstream does not shift.
    const spots = [];
    for (let z = -200; z <= 200; z += 46) {
      const hWest = range(rng, 26, 55);
      if (z + 8 !== 130) spots.push({ x: -62, z: z + 8, h: hWest, w: 22 });
      const hWest2 = range(rng, 14, 26);
      if (z - 12 !== 156) spots.push({ x: -58, z: z - 12, h: hWest2, w: 16 });
    }
    for (let gx = -20; gx <= 140; gx += 46) {
      for (let gz = -180; gz <= 180; gz += 46) {
        if (Math.abs(gz) < 12) continue; // keep cross streets clear
        spots.push({ x: gx, z: gz, h: range(rng, 12, 44), w: 26 });
      }
    }
    for (const spot of spots) {
      const color = PALETTE.building[Math.floor(rng() * PALETTE.building.length)];
      const tower = box(spot.w, spot.h, spot.w, color, spot.x, spot.h / 2, spot.z);
      scene.add(tower);
      this.colliders.push({ x: spot.x, z: spot.z, r: spot.w * 0.75 });
      // Lit windows on the street faces (kept sparse: one draw call each).
      if (spot.h < 18) continue;
      const rows = Math.floor(spot.h / 8);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < 3; c++) {
          if (rng() < 0.65) continue;
          const lit = rng() < 0.5;
          const win = box(2.2, 2.6, 0.2, lit ? PALETTE.windowLit : PALETTE.windowDark,
            spot.x - spot.w / 2 - 0.15, 4 + r * 5, spot.z - spot.w / 2 + 3 + c * 5);
          scene.add(win);
        }
      }
    }
  }

  buildPalms() {
    const { scene, rng } = this;
    for (let z = -320; z <= 320; z += 16) {
      if (rng() < 0.2) continue;
      for (const x of [-94, -74]) {
        const palm = new THREE.Group();
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.35, 0.55, 7, 6),
          new THREE.MeshLambertMaterial({ color: PALETTE.palmTrunk }),
        );
        trunk.position.y = 3.5;
        trunk.rotation.z = range(rng, -0.12, 0.12);
        palm.add(trunk);
        for (let leaf = 0; leaf < 6; leaf++) {
          const frond = new THREE.Mesh(
            new THREE.ConeGeometry(0.7, 4.4, 4),
            new THREE.MeshLambertMaterial({ color: PALETTE.palmLeaf }),
          );
          const angle = (leaf / 6) * Math.PI * 2;
          frond.position.set(Math.cos(angle) * 1.6, 7.2, Math.sin(angle) * 1.6);
          frond.rotation.z = Math.cos(angle) * 1.1;
          frond.rotation.x = -Math.sin(angle) * 1.1;
          palm.add(frond);
        }
        palm.position.set(x + range(rng, -1, 1), 0, z + range(rng, -3, 3));
        scene.add(palm);
      }
    }
  }

  buildFerrisWheel() {
    const { scene } = this;
    const group = new THREE.Group();
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(22, 0.9, 8, 40),
      new THREE.MeshLambertMaterial({ color: PALETTE.ferris }),
    );
    group.add(rim);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const spoke = box(0.7, 44, 0.7, 0xffffff, 0, 0, 0);
      spoke.rotation.z = angle;
      group.add(spoke);
      const cabin = box(3.4, 2.6, 2.6, i % 2 ? 0x35c8e8 : 0xffd23e,
        Math.cos(angle) * 22, Math.sin(angle) * 22, 0);
      group.add(cabin);
    }
    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.2, 2, 12),
      new THREE.MeshLambertMaterial({ color: 0xffffff }),
    );
    hub.rotation.x = Math.PI / 2;
    group.add(hub);
    const legL = box(1.4, 30, 1.4, 0xdddddd, -9, -24, 0);
    legL.rotation.z = 0.35;
    const legR = box(1.4, 30, 1.4, 0xdddddd, 9, -24, 0);
    legR.rotation.z = -0.35;
    group.add(legL, legR);
    group.position.set(-120, 40, -190);
    scene.add(group);
    this.ferrisWheel = group;
  }

  buildPoolDeck() {
    const { scene } = this;
    // Hotel pool deck east of Ocean Ave, south end — the "pool" in the shots.
    const deck = new THREE.Mesh(
      new THREE.PlaneGeometry(46, 30),
      new THREE.MeshLambertMaterial({ color: PALETTE.deck }),
    );
    deck.rotation.x = -Math.PI / 2;
    deck.position.set(-40, 0.6, 150);
    scene.add(deck);
    const pool = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 16),
      new THREE.MeshLambertMaterial({ color: PALETTE.pool }),
    );
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(-40, 0.7, 150);
    scene.add(pool);
    for (let i = 0; i < 6; i++) {
      const lounger = box(1.2, 0.5, 3, 0xffffff, -58 + i * 7, 0.9, 136);
      scene.add(lounger);
    }
  }

  buildProps() {
    const { scene, rng } = this;
    // Traffic cones on Ocean Ave and near the pool deck.
    for (let i = 0; i < 10; i++) {
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(0.5, 1.3, 10),
        new THREE.MeshLambertMaterial({ color: 0xff6a00 }),
      );
      cone.position.set(-86 + i * 2.0, 1.2, 128);
      scene.add(cone);
    }
    for (let i = 0; i < 4; i++) {
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(0.5, 1.3, 10),
        new THREE.MeshLambertMaterial({ color: 0xff6a00 }),
      );
      cone.position.set(-64 + i * 3, 1.2, 148);
      scene.add(cone);
    }
    for (const [cx, cz] of [[-24, 148], [-20, 152]]) {
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(0.5, 1.3, 10),
        new THREE.MeshLambertMaterial({ color: 0xff6a00 }),
      );
      cone.position.set(cx, 1.2, cz);
      scene.add(cone);
    }
  }

  setTimeOfDay(mode) {
    if (mode === 'dusk') {
      this.scene.background = new THREE.Color(PALETTE.duskSky);
      this.scene.fog.color.set(0x4a3560);
      this.sunLight.color.set(0xff7a5a);
      this.sunLight.intensity = 1.2;
      this.sunMesh.material.color.set(0xff8a3e);
      this.sunMesh.position.set(-320, 18, -40);
    } else {
      this.scene.background = new THREE.Color(PALETTE.sunsetSky);
      this.scene.fog.color.set(0xffb37a);
      this.sunLight.color.set(0xffb37a);
      this.sunLight.intensity = 2.2;
      this.sunMesh.material.color.set(0xffd23e);
      this.sunMesh.position.set(-320, 42, -40);
    }
  }

  update(time) {
    // Ocean swell: animate HEIGHT (local Y after the -90° X rotation),
    // adding the wave to the base position — never overwriting a base axis,
    // or the whole plane collapses into a strip.
    if (this.oceanMesh) {
      const pos = this.oceanMesh.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const bx = this.oceanBase[i * 3];
        const bz = this.oceanBase[i * 3 + 2];
        pos.array[i * 3 + 1] = Math.sin(bx * 0.08 + time * 0.9) * 0.7
          + Math.cos(bz * 0.06 + time * 0.6) * 0.5;
      }
      pos.needsUpdate = true;
      // Normals stay as built: recomputing them every frame is the
      // slowest call in the loop under software rendering.
    }
    if (this.ferrisWheel) this.ferrisWheel.rotation.z = time * 0.05;
  }
}
