// SUNCOAST: HEATLINE — the mission state machine: 8 jobs, $22,450.
// Each job is a chain of legs (drive to a marker, pick up, deliver, clear
// a yard on foot, escape the heat). Completing a job pays its `pay`, adds
// REP, and advances the HUD to the next job's projected total.

import * as THREE from '../vendor/three.module.js';
import { JOBS, WANTED_MAX } from './config.js';
import { buildPersonMesh } from './npcs.js';

function markerMesh(color) {
  const group = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(4, 0.35, 8, 32),
    new THREE.MeshBasicMaterial({ color }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.6;
  group.add(ring);
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 0.7, 26, 10, 1, true),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }),
  );
  beam.position.y = 13;
  group.add(beam);
  return group;
}

const JOB_LEGS = [
  [ // 1 — Beachfront Pickup
    { x: -84, z: -20, label: 'Pick up Rae\u2019s cargo at the pier', action: 'pickup' },
    { x: -84, z: -110, label: 'Deliver to Ocean Ave North', action: 'deliver' },
  ],
  [ // 2 — Sunset Run (Rae rides along)
    { x: 60, z: 0, label: 'Drop the cargo at Sable\u2019s corner', action: 'deliver' },
  ],
  [ // 3 — Palms Courier
    { x: -40, z: 150, label: 'Drop 1/2: hotel pool deck', action: 'deliver' },
    { x: 140, z: 0, label: 'Drop 2/2: east downtown', action: 'deliver' },
  ],
  [ // 4 — Yard Sweep (on foot)
    { x: -112, z: 60, label: 'Clear Marlo\u2019s yard — TARGETS 0/3', action: 'clear' },
  ],
  [ // 5 — Heatline Escape
    { x: -120, z: -190, label: 'Lose the heat at the ferris wheel', action: 'escape' },
  ],
  [ // 6 — Rae's Return
    { x: -84, z: 24, label: 'Bring the ledger back to Rae', action: 'deliver' },
  ],
  [ // 7 — Night Market
    { x: 100, z: 0, label: 'Dusk drop: downtown market', action: 'deliver' },
  ],
  [ // 8 — Heatline Finale
    { x: -120, z: -190, label: 'Finish at the ferris wheel — full heat', action: 'escape' },
  ],
];

export class MissionManager {
  constructor(scene, npcs, police, audio, hud) {
    this.scene = scene;
    this.npcs = npcs;
    this.police = police;
    this.audio = audio;
    this.hud = hud;
    this.jobIndex = 0;
    this.legIndex = 0;
    this.cash = 0;
    this.rep = 0;
    this.wanted = 0;
    this.done = false;
    this.onFoot = false;
    this.targetsDown = 0;
    this.marker = null;
    this.walker = null;
    this.muzzle = null;
    this.muzzleTimer = 0;
    this.lastDriftCount = 0;
    this.startJob(0);
  }

  get job() {
    return JOBS[Math.min(this.jobIndex, JOBS.length - 1)];
  }

  get objective() {
    if (this.done) return 'All 8 jobs done — $22,450. Suncoast is yours.';
    const leg = JOB_LEGS[this.jobIndex][this.legIndex];
    if (this.jobIndex === 3 && this.onFoot) {
      return `Clear Marlo\u2019s yard — TARGETS ${this.targetsDown}/3`;
    }
    return leg.label;
  }

  startJob(index) {
    this.jobIndex = index;
    this.legIndex = 0;
    this.onFoot = false;
    this.targetsDown = 0;
    this.wanted = index === 4 || index === 7 ? WANTED_MAX : 0;
    if (this.walker) {
      this.scene.remove(this.walker);
      this.walker = null;
    }
    if (index === 3) this.enterOnFoot();
    this.police.setHeat(this.wanted, { x: -84, z: 40 });
    this.showMarker();
    this.hud.toast(`${this.job.name} — JOB ${index + 1}/8 · $${this.job.cashAfter.toLocaleString('en-US')}`);
  }

  enterOnFoot() {
    this.onFoot = true;
    this.npcs.spawnYardCrew();
    const walker = buildPersonMesh(0xff5a1f);
    walker.position.set(-100, 0, 48);
    this.scene.add(walker);
    this.walker = walker;
    // Pistol + muzzle flash light.
    const pistol = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.5),
      new THREE.MeshLambertMaterial({ color: 0x111318 }));
    pistol.position.set(0.35, 1.15, 0.4);
    walker.add(pistol);
    this.muzzle = new THREE.PointLight(0xffd23e, 0, 12);
    this.muzzle.position.set(0.35, 1.2, 0.9);
    walker.add(this.muzzle);
    // Visible muzzle-flash quad so the shot reads in a still frame.
    this.flash = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6),
      new THREE.MeshBasicMaterial({ color: 0xffe95a, side: THREE.DoubleSide, transparent: true, opacity: 0.95 }));
    this.flash.position.set(0.35, 1.2, 1.15);
    this.flash.visible = false;
    walker.add(this.flash);
    this.walkerHeading = Math.PI;
  }

  showMarker() {
    if (this.marker) this.scene.remove(this.marker);
    if (this.done) {
      this.marker = null;
      return;
    }
    const leg = JOB_LEGS[this.jobIndex][this.legIndex];
    this.marker = markerMesh(this.onFoot ? 0xff3a3a : 0xffd23e);
    this.marker.position.set(leg.x, 0, leg.z);
    this.scene.add(this.marker);
  }

  // Drive legs complete on arrival (7 m) or on E.
  update(dt, playerPos, input, vehicle) {
    if (this.done) return;
    if (this.marker) this.marker.rotation.y += dt;
    if (this.muzzleTimer > 0) {
      this.muzzleTimer -= dt;
      if (this.muzzleTimer <= 0 && this.muzzle) {
        this.muzzle.intensity = 0;
        if (this.flash) this.flash.visible = false;
      }
    }
    const leg = JOB_LEGS[this.jobIndex][this.legIndex];
    if (this.onFoot) {
      this.updateWalker(dt, input);
      if (this.targetsDown >= 3) this.completeLeg();
      return;
    }
    const dx = leg.x - playerPos.x;
    const dz = leg.z - playerPos.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 7 || input.wasPressed('e')) {
      if (leg.action === 'pickup') {
        this.audio.chime();
        this.hud.toast('Cargo secured — Rae says drive clean.');
      }
      this.completeLeg();
    }
    // Drift bonus: +$50 per drift, live.
    if (vehicle && vehicle.driftCount > this.lastDriftCount) {
      const gained = (vehicle.driftCount - this.lastDriftCount) * 50;
      this.cash += gained;
      this.lastDriftCount = vehicle.driftCount;
      this.audio.cash();
      this.hud.toast(`DRIFT x${vehicle.driftCount} +$${gained}`);
    }
  }

  updateWalker(dt, input) {
    if (!this.walker) return;
    const speed = 6;
    let mx = 0;
    let mz = 0;
    if (input.down('w', 'arrowup')) mz -= 1;
    if (input.down('s', 'arrowdown')) mz += 1;
    if (input.down('a', 'arrowleft')) mx -= 1;
    if (input.down('d', 'arrowright')) mx += 1;
    if (mx !== 0 || mz !== 0) {
      const len = Math.hypot(mx, mz);
      this.walker.position.x += (mx / len) * speed * dt;
      this.walker.position.z += (mz / len) * speed * dt;
      this.walkerHeading = Math.atan2(mx, mz);
      this.walker.rotation.y = this.walkerHeading;
      const swing = Math.sin(performance.now() / 90) * 0.35;
      this.walker.userData.legs[0].rotation.x = swing;
      this.walker.userData.legs[1].rotation.x = -swing;
    }
    if (input.wasPressed('f')) this.shoot();
  }

  shoot() {
    if (!this.walker) return;
    this.audio.gunshot();
    if (this.muzzle) {
      this.muzzle.intensity = 26;
      this.muzzleTimer = 0.07;
    }
    if (this.flash) this.flash.visible = true;
    const wx = this.walker.position.x;
    const wz = this.walker.position.z;
    const fx = Math.sin(this.walkerHeading);
    const fz = Math.cos(this.walkerHeading);
    let best = null;
    let bestDist = 32;
    for (const enemy of this.npcs.enemies) {
      if (!enemy.alive) continue;
      const dx = enemy.mesh.position.x - wx;
      const dz = enemy.mesh.position.z - wz;
      const dist = Math.hypot(dx, dz);
      if (dist > bestDist) continue;
      const dot = (dx * fx + dz * fz) / (dist || 1);
      if (dot < 0.86) continue; // must be roughly in front
      best = enemy;
      bestDist = dist;
    }
    if (best) {
      const down = best.damage(34);
      this.hud.toast(down ? `${best.name} down.` : `Hit ${best.name} — ${best.hp} HP left.`);
      if (down) {
        this.targetsDown += 1;
        this.audio.chime();
      }
    }
  }

  completeLeg() {
    this.legIndex += 1;
    if (this.legIndex < JOB_LEGS[this.jobIndex].length) {
      this.showMarker();
      this.audio.chime();
      return;
    }
    // Job complete: pay, REP, advance.
    const finished = this.job;
    this.cash += finished.pay;
    this.rep += 1;
    this.audio.cash();
    this.hud.toast(`${finished.name} complete +$${finished.pay.toLocaleString('en-US')} — cash $${this.cash.toLocaleString('en-US')}`);
    this.npcs.clearYardCrew();
    this.jobIndex += 1;
    this.legIndex = 0;
    if (this.jobIndex >= JOBS.length) {
      this.done = true;
      this.wanted = 0;
      this.police.setHeat(0, { x: 0, z: 0 });
      if (this.marker) this.scene.remove(this.marker);
      this.marker = null;
      return;
    }
    this.startJob(this.jobIndex);
  }

  restartJob(vehicle) {
    this.cash = JOBS.slice(0, this.jobIndex).reduce((s, j) => s + j.pay, 0);
    this.rep = this.jobIndex;
    this.lastDriftCount = vehicle ? vehicle.driftCount : 0;
    this.startJob(this.jobIndex);
  }

  getState(speedKmh, driftCount) {
    return {
      cash: this.cash,
      jobIndex: this.jobIndex,
      job: this.job,
      rep: this.rep,
      wanted: this.wanted,
      speedKmh,
      driftCount,
      driftBonus: driftCount * 50,
      objective: this.objective,
      onFoot: this.onFoot,
      targets: this.targetsDown,
      targetsTotal: 3,
      done: this.done,
    };
  }
}
