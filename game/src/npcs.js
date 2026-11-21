// SUNCOAST: HEATLINE — pedestrians, named characters and enemies.
// Pedestrians stroll the sidewalks on seeded loops. Rae is the fixer who
// hands over cargo; Sable is the lookout; Marlo leads the yard crew in
// job 4, where three enemies carry health bars and must be cleared.

import * as THREE from '../vendor/three.module.js';
import { mulberry32, range, pick } from './random.js';
import { FIXER, RIVAL, LOOKOUT } from './config.js';

const SHIRTS = [0xff5a7a, 0x7ad0ff, 0xffd23e, 0x7aff8a, 0xffffff, 0xff8a3e, 0xc07aff];

export function buildPersonMesh(shirtColor, skinColor = 0xc98a5e) {
  const group = new THREE.Group();
  const shirt = new THREE.MeshLambertMaterial({ color: shirtColor });
  const skin = new THREE.MeshLambertMaterial({ color: skinColor });
  const pants = new THREE.MeshLambertMaterial({ color: 0x2a2f3a });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 0.95, 8), shirt);
  body.position.y = 1.05;
  group.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8), skin);
  head.position.y = 1.78;
  group.add(head);
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.6, 0.16), pants);
  legL.position.set(-0.14, 0.3, 0);
  const legR = legL.clone();
  legR.position.x = 0.14;
  group.add(legL, legR);
  group.userData.legs = [legL, legR];
  return group;
}

export class Pedestrian {
  constructor(mesh, path, speed) {
    this.mesh = mesh;
    this.path = path; // [{x,z}...] loop
    this.speed = speed;
    this.leg = 0;
    this.target = 1;
    this.walkPhase = Math.random() * 6;
  }

  update(dt) {
    const goal = this.path[this.target];
    const dx = goal.x - this.mesh.position.x;
    const dz = goal.z - this.mesh.position.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.6) {
      this.target = (this.target + 1) % this.path.length;
      return;
    }
    const step = Math.min(dist, this.speed * dt);
    this.mesh.position.x += (dx / dist) * step;
    this.mesh.position.z += (dz / dist) * step;
    this.mesh.rotation.y = Math.atan2(dx, dz);
    this.walkPhase += dt * 6;
    const swing = Math.sin(this.walkPhase) * 0.4;
    this.mesh.userData.legs[0].rotation.x = swing;
    this.mesh.userData.legs[1].rotation.x = -swing;
  }
}

export class Enemy {
  constructor(mesh, x, z, name) {
    this.mesh = mesh;
    this.name = name;
    this.hp = 100;
    this.alive = true;
    this.mesh.position.set(x, 0, z);
    // Health bar: green quad floating above the head, scaled by hp.
    // Sized generously (3 m wide, white border) so it reads in a
    // screenshot from 25 m. The border is four strips around the bar —
    // never a panel behind it, so it cannot cover the fill from any side.
    const barGeo = new THREE.PlaneGeometry(3.0, 0.5);
    this.barMat = new THREE.MeshBasicMaterial({ color: 0x39d353, side: THREE.DoubleSide });
    this.bar = new THREE.Mesh(barGeo, this.barMat);
    this.barGroup = new THREE.Group();
    this.barGroup.position.set(0, 2.7, 0);
    this.barGroup.add(this.bar);
    const borderMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    const strip = (w, h, x, y) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), borderMat);
      m.position.set(x, y, 0);
      this.barGroup.add(m);
    };
    strip(3.2, 0.09, 0, 0.295);
    strip(3.2, 0.09, 0, -0.295);
    strip(0.09, 0.5, -1.555, 0);
    strip(0.09, 0.5, 1.555, 0);
    this.mesh.add(this.barGroup);
  }

  damage(amount) {
    if (!this.alive) return false;
    this.hp = Math.max(0, this.hp - amount);
    this.bar.scale.x = Math.max(0.02, this.hp / 100);
    this.barMat.color.set(this.hp > 50 ? 0x39d353 : this.hp > 25 ? 0xffd23e : 0xff3a3a);
    if (this.hp <= 0) {
      this.alive = false;
      this.mesh.rotation.z = Math.PI / 2;
      this.mesh.position.y = 0.3;
      if (this.barGroup) this.barGroup.visible = false;
      return true;
    }
    return false;
  }
}

export class NpcManager {
  constructor(scene, seed) {
    this.scene = scene;
    this.rng = mulberry32(seed);
    this.pedestrians = [];
    this.enemies = [];
    this.named = {};
    this.buildPedestrians();
    this.buildNamed();
  }

  buildPedestrians() {
    // Stroll the Ocean Ave sidewalks and the cross streets.
    for (let i = 0; i < 14; i++) {
      const side = this.rng < 0.5 ? -90.5 : -77.5;
      const z0 = range(this.rng, -280, 280);
      const z1 = z0 + range(this.rng, 40, 120) * (this.rng() < 0.5 ? 1 : -1);
      const mesh = buildPersonMesh(pick(this.rng, SHIRTS));
      mesh.position.set(side + range(this.rng, -0.8, 0.8), 0, z0);
      this.scene.add(mesh);
      this.pedestrians.push(new Pedestrian(mesh,
        [{ x: side, z: z0 }, { x: side, z: z1 }], range(this.rng, 1.0, 1.8)));
    }
    // A few on the cross streets.
    for (let i = 0; i < 6; i++) {
      const z = pick(this.rng, [-180, -90, 0, 90, 180]);
      const x0 = range(this.rng, -60, 140);
      const mesh = buildPersonMesh(pick(this.rng, SHIRTS));
      mesh.position.set(x0, 0, z + 5);
      this.scene.add(mesh);
      this.pedestrians.push(new Pedestrian(mesh,
        [{ x: x0, z: z + 5 }, { x: x0 + range(this.rng, 40, 90), z: z + 5 }],
        range(this.rng, 1.0, 1.6)));
    }
  }

  buildNamed() {
    const rae = buildPersonMesh(FIXER.color);
    rae.position.set(-88, 0, 24);
    this.scene.add(rae);
    this.named.Rae = rae;
    const sable = buildPersonMesh(LOOKOUT.color);
    sable.position.set(-88, 0, 150);
    this.scene.add(sable);
    this.named.Sable = sable;
    const marlo = buildPersonMesh(RIVAL.color);
    marlo.position.set(-98, 0, 64);
    this.scene.add(marlo);
    this.named.Marlo = marlo;
  }

  spawnYardCrew() {
    this.clearYardCrew();
    // Marlo's yard is open sand west of Ocean Ave — no buildings there.
    // The crew stands close to the walker so health bars read in a shot.
    const spots = [[-106, 56], [-94, 58], [-100, 62]];
    const names = ['Vex', 'Kilo', 'Bram'];
    spots.forEach(([x, z], i) => {
      const mesh = buildPersonMesh(0x3a3f4a);
      this.scene.add(mesh);
      this.enemies.push(new Enemy(mesh, x, z, names[i]));
    });
  }

  clearYardCrew() {
    for (const enemy of this.enemies) this.scene.remove(enemy.mesh);
    this.enemies = [];
  }

  update(dt) {
    for (const ped of this.pedestrians) ped.update(dt);
  }
}
