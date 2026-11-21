// SUNCOAST: HEATLINE — the heat: police cruisers that pursue with
// collision avoidance, and the SKY-1 helicopter with a spinning rotor
// and a spotlight cone that tracks the player while wanted.

import * as THREE from '../vendor/three.module.js';
import { buildCarMesh } from './vehicle.js';
import { mulberry32, range } from './random.js';

export class PoliceCar {
  constructor(scene, x, z) {
    this.mesh = buildCarMesh(0x1a2f5e);
    // Light bar.
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.18, 0.5),
      new THREE.MeshBasicMaterial({ color: 0xff2a2a }));
    bar.position.set(0, 1.45, -0.3);
    this.mesh.add(bar);
    this.lightMat = bar.material;
    this.mesh.position.set(x, 0, z);
    scene.add(this.mesh);
    this.x = x;
    this.z = z;
    this.heading = 0;
    this.speed = 0;
    this.flashPhase = Math.random() * 6;
  }

  // Pursuit with avoidance: steer at the player, but push away from
  // buildings (colliders) and from other cruisers.
  update(dt, target, colliders, others, time) {
    const dx = target.x - this.x;
    const dz = target.z - this.z;
    const dist = Math.hypot(dx, dz) || 1;
    let steerX = dx / dist;
    let steerZ = dz / dist;
    for (const c of colliders) {
      const cx = this.x - c.x;
      const cz = this.z - c.z;
      const cd = Math.hypot(cx, cz);
      const min = c.r + 6;
      if (cd < min && cd > 0.01) {
        const push = (min - cd) / min * 2.2;
        steerX += (cx / cd) * push;
        steerZ += (cz / cd) * push;
      }
    }
    for (const other of others) {
      if (other === this) continue;
      const ox = this.x - other.x;
      const oz = this.z - other.z;
      const od = Math.hypot(ox, oz);
      if (od < 7 && od > 0.01) {
        steerX += (ox / od) * 1.2;
        steerZ += (oz / od) * 1.2;
      }
    }
    const wantHeading = Math.atan2(steerX, steerZ);
    let diff = wantHeading - this.heading;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.heading += Math.max(-2.4 * dt, Math.min(2.4 * dt, diff));
    const cruise = dist > 26 ? 34 : 24;
    this.speed += (cruise - this.speed) * Math.min(1, dt * 0.8);
    this.x += Math.sin(this.heading) * this.speed * dt;
    this.z += Math.cos(this.heading) * this.speed * dt;
    this.mesh.position.set(this.x, 0, this.z);
    this.mesh.rotation.y = this.heading;
    // Flashing light bar.
    this.flashPhase += dt * 10;
    this.lightMat.color.set(Math.sin(this.flashPhase) > 0 ? 0xff2a2a : 0x2a5aff);
  }
}

export class Heli {
  constructor(scene) {
    this.group = new THREE.Group();
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x22262e });
    const body = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.6, 6.5), bodyMat);
    this.group.add(body);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.0, 1.6),
      new THREE.MeshLambertMaterial({ color: 0x9fd8ff }));
    glass.position.set(0, 0.2, 2.6);
    this.group.add(glass);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 5), bodyMat);
    tail.position.set(0, 0.4, -5.2);
    this.group.add(tail);
    // Rotor: two blades on a mast — must stay intact (never detached).
    this.rotor = new THREE.Group();
    const bladeGeo = new THREE.BoxGeometry(11, 0.08, 0.5);
    const bladeMat = new THREE.MeshLambertMaterial({ color: 0x111318 });
    const b1 = new THREE.Mesh(bladeGeo, bladeMat);
    const b2 = new THREE.Mesh(bladeGeo, bladeMat);
    b2.rotation.y = Math.PI / 2;
    this.rotor.add(b1, b2);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.0, 8), bodyMat);
    mast.position.y = 0.5;
    this.rotor.add(mast);
    this.rotor.position.y = 1.3;
    this.group.add(this.rotor);
    const tailRotor = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.4, 0.4), bladeMat);
    tailRotor.position.set(0.5, 0.6, -7.4);
    this.group.add(tailRotor);
    this.tailRotor = tailRotor;
    // Spotlight cone under the heli.
    const coneGeo = new THREE.ConeGeometry(7, 34, 20, 1, true);
    this.coneMat = new THREE.MeshBasicMaterial({
      color: 0xfff2b0, transparent: true, opacity: 0.16,
      side: THREE.DoubleSide, depthWrite: false,
    });
    this.cone = new THREE.Mesh(coneGeo, this.coneMat);
    this.cone.position.y = -17;
    this.cone.rotation.x = Math.PI; // apex up at the heli
    this.group.add(this.cone);
    this.group.position.set(-84, 55, 40);
    scene.add(this.group);
    this.orbit = 0;
    this.altitude = 52; // staged shots lower this so the heli stays in frame
  }

  update(dt, target, time) {
    this.orbit += dt * 0.25;
    const ox = target.x + Math.sin(this.orbit) * 26;
    const oz = target.z + Math.cos(this.orbit) * 26;
    this.group.position.x += (ox - this.group.position.x) * Math.min(1, dt * 1.2);
    this.group.position.z += (oz - this.group.position.z) * Math.min(1, dt * 1.2);
    this.group.position.y = this.altitude + Math.sin(time * 0.5) * 2;
    this.group.rotation.y = Math.atan2(target.x - this.group.position.x, target.z - this.group.position.z);
    this.rotor.rotation.y += dt * 22; // rotor spins, stays attached
    this.tailRotor.rotation.x += dt * 30;
    // Spotlight pool on the ground under the heli.
    this.cone.lookAt(target.x, 0, target.z);
  }
}

export class PoliceManager {
  constructor(scene, colliders, seed) {
    this.scene = scene;
    this.colliders = colliders;
    this.rng = mulberry32(seed + 7);
    this.cruisers = [];
    this.heli = new Heli(scene);
    this.active = false;
  }

  setHeat(level, playerPos) {
    const want = level >= 1 ? 2 : 0;
    while (this.cruisers.length < want) {
      const c = new PoliceCar(this.scene,
        playerPos.x + range(this.rng, -60, 60), playerPos.z + range(this.rng, -80, -30));
      this.cruisers.push(c);
    }
    while (this.cruisers.length > want) {
      const c = this.cruisers.pop();
      this.scene.remove(c.mesh);
    }
    this.active = level >= 1;
    this.heli.group.visible = level >= 1;
    this.heli.cone.visible = level >= 1;
  }

  update(dt, playerPos, time) {
    if (!this.active) return;
    for (const cruiser of this.cruisers) {
      cruiser.update(dt, playerPos, this.colliders, this.cruisers, time);
    }
    this.heli.update(dt, playerPos, time);
  }
}
