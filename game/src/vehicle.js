// SUNCOAST: HEATLINE — the HEATLINE GT: mesh, arcade driving, drift.
// Built from boxes and cylinders; the paint is sunset orange with a black
// roof and a rear spoiler. Drift is detected from sideways slip while
// steering hard at speed, and pays the DRIFT bonus.

import * as THREE from '../vendor/three.module.js';
import { CAR } from './config.js';

export function buildCarMesh(paint = 0xff5a1f) {
  const car = new THREE.Group();
  const paintMat = new THREE.MeshLambertMaterial({ color: paint });
  const darkMat = new THREE.MeshLambertMaterial({ color: 0x14161a });
  const glassMat = new THREE.MeshLambertMaterial({ color: 0x1a2f42 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.55, 4.6), paintMat);
  body.position.y = 0.55;
  car.add(body);
  const nose = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.4, 0.9), paintMat);
  nose.position.set(0, 0.45, 2.5);
  car.add(nose);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.5, 2.2), glassMat);
  cabin.position.set(0, 1.05, -0.3);
  car.add(cabin);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.12, 2.0), darkMat);
  roof.position.set(0, 1.32, -0.3);
  car.add(roof);
  const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.08, 0.4), darkMat);
  spoiler.position.set(0, 1.05, -2.2);
  car.add(spoiler);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 4.6), darkMat);
  stripe.position.set(0, 0.84, 0);
  car.add(stripe);

  const headMat = new THREE.MeshBasicMaterial({ color: 0xfff2b0 });
  for (const x of [-0.7, 0.7]) {
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.18, 0.1), headMat);
    head.position.set(x, 0.6, 2.96);
    car.add(head);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.18, 0.1),
      new THREE.MeshBasicMaterial({ color: 0xff2a2a }));
    tail.position.set(x, 0.6, -2.36);
    car.add(tail);
  }

  car.userData.wheels = [];
  const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.3, 14);
  wheelGeo.rotateZ(Math.PI / 2);
  for (const [x, z] of [[-0.95, 1.5], [0.95, 1.5], [-0.95, -1.5], [0.95, -1.5]]) {
    const wheel = new THREE.Mesh(wheelGeo, darkMat);
    wheel.position.set(x, 0.38, z);
    car.add(wheel);
    car.userData.wheels.push(wheel);
  }
  return car;
}

export class Vehicle {
  constructor(mesh) {
    this.mesh = mesh;
    this.x = -84;
    this.z = 40;
    this.heading = Math.PI; // facing north (-z) up Ocean Ave
    this.speed = 0;
    this.drifting = false;
    this.driftTime = 0;
    this.driftCount = 0;
    this.distance = 0;
  }

  get speedKmh() {
    return Math.abs(this.speed) * 3.6;
  }

  forward() {
    return { x: Math.sin(this.heading), z: Math.cos(this.heading) };
  }

  update(dt, input) {
    const throttle = input.throttle;
    const steer = input.steer;
    if (throttle > 0) this.speed += CAR.accel * throttle * dt;
    else if (throttle < 0) {
      this.speed += (this.speed > 0.5 ? -CAR.brake : CAR.accel * 0.5) * dt;
    } else {
      this.speed -= Math.sign(this.speed) * Math.min(Math.abs(this.speed), 8 * dt);
    }
    this.speed = Math.max(-CAR.reverseMax, Math.min(CAR.maxSpeed, this.speed));

    // Steering bites harder at speed; hard steering at speed breaks traction.
    const steerAngle = steer * CAR.steerMax * Math.min(1, Math.abs(this.speed) / 14 + 0.25);
    this.heading += steerAngle * (this.speed / CAR.maxSpeed) * 3.2 * dt * (this.speed >= 0 ? 1 : -1);
    const slip = Math.abs(steer) > 0.7 && Math.abs(this.speed) > 18;
    if (slip) {
      this.driftTime += dt;
      if (!this.drifting && this.driftTime > 0.6) {
        this.drifting = true;
        this.driftCount += 1;
      }
    } else {
      this.drifting = false;
      this.driftTime = 0;
    }

    const fwd = this.forward();
    const step = this.speed * dt;
    this.x += fwd.x * step;
    this.z += fwd.z * step;
    this.distance += Math.abs(step);
    // Soft world bounds.
    this.x = Math.max(-200, Math.min(260, this.x));
    this.z = Math.max(-330, Math.min(330, this.z));

    this.mesh.position.set(this.x, 0, this.z);
    this.mesh.rotation.y = this.heading;
    // Body roll into corners, squat on drift.
    this.mesh.rotation.z = -steer * 0.05 * Math.min(1, Math.abs(this.speed) / 20);
    for (const wheel of this.mesh.userData.wheels) wheel.rotation.x += this.speed * dt * 2.4;
  }

  place(x, z, heading) {
    this.x = x;
    this.z = z;
    this.heading = heading;
    this.speed = 0;
    this.mesh.position.set(x, 0, z);
    this.mesh.rotation.y = heading;
  }
}
