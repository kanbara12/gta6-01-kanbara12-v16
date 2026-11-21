// SUNCOAST: HEATLINE — screenshot mode (?shot=start|play|chase|mission).
// Each preset deterministically stages one genuine gameplay frame: the
// camera, the car, the job state, the time of day and the heat. The game
// is still rendering live — these are real frames, not stills.

export const SHOT_NAMES = ['start', 'play', 'chase', 'mission'];

export function applyShot(game, name) {
  const { vehicle, missions, world, camera, npcs, police } = game;
  if (name === 'start') {
    // JOB 1/8 $1,250: wide high shot, ferris wheel, ocean + sun + palms.
    missions.jobIndex = 0;
    missions.legIndex = 0;
    missions.cash = 0;
    missions.rep = 0;
    missions.wanted = 0;
    missions.done = false;
    missions.onFoot = false;
    missions.showMarker();
    police.setHeat(0, { x: -84, z: 40 });
    world.setTimeOfDay('sunset');
    vehicle.place(-120, 0, Math.PI);
    vehicle.speed = 0;
    camera.position.set(-185, 30, 120);
    camera.lookAt(-190, 5, -60);
    game.cameraMode = 'fixed';
  } else if (name === 'play') {
    // JOB 2/8 $3,750: low rear 3/4, 141 km/h, heli rotor intact, cone + pool, Rae.
    missions.jobIndex = 1;
    missions.legIndex = 0;
    missions.cash = 1250;
    missions.rep = 1;
    missions.wanted = 1;
    missions.done = false;
    missions.onFoot = false;
    missions.showMarker();
    police.setHeat(1, { x: -84, z: 40 });
    police.heli.altitude = 14;
    police.heli.orbit = 2.82; // hover north-east of the car, in frame
    police.heli.group.position.set(-76, 14, 130);
    world.setTimeOfDay('sunset');
    vehicle.place(-84, 140, Math.PI);
    vehicle.speed = 39.2; // 141 km/h
    npcs.named.Rae.position.set(-80, 0, 138);
    camera.position.set(-88, 3.5, 156);
    camera.lookAt(-66, 6, 136);
    game.cameraMode = 'fixed';
  } else if (name === 'chase') {
    // JOB 5/8 $13,200: downtown Ocean Ave DUSK, intact car, heli + cone +
    // pool, DRIFT x3 +$150, Sable, 5-row police panel, wanted 3.
    missions.jobIndex = 4;
    missions.legIndex = 0;
    missions.cash = 9550;
    missions.rep = 4;
    missions.wanted = 3;
    missions.done = false;
    missions.onFoot = false;
    missions.showMarker();
    police.setHeat(3, { x: -40, z: 150 });
    police.heli.altitude = 26;
    police.heli.orbit = Math.PI; // hover north of the car, in frame
    police.heli.group.position.set(-84, 26, 124);
    world.setTimeOfDay('dusk');
    vehicle.place(-84, 150, Math.PI);
    vehicle.speed = 28;
    vehicle.driftCount = 3;
    missions.lastDriftCount = 3;
    npcs.named.Sable.position.set(-88, 0, 146);
    camera.position.set(-88, 5, 178);
    camera.lookAt(-66, 4, 140);
    game.cameraMode = 'fixed';
  } else if (name === 'mission') {
    // JOB 4/8 $9,550: on foot, pistol + muzzle flash, 3 enemies with
    // health bars, Marlo, TARGETS 2/3.
    missions.jobIndex = 3;
    missions.legIndex = 0;
    missions.cash = 6050;
    missions.rep = 3;
    missions.wanted = 1;
    missions.done = false;
    missions.targetsDown = 2;
    missions.onFoot = true;
    missions.showMarker();
    police.setHeat(1, { x: 30, z: 90 });
    world.setTimeOfDay('sunset');
    if (!missions.walker) missions.enterOnFoot();
    missions.walker.position.set(-100, 0, 48);
    missions.walker.rotation.y = Math.PI - 0.45; // 3/4 view toward the crew
    missions.walkerHeading = Math.PI - 0.45;
    if (missions.muzzle) missions.muzzle.intensity = 26;
    if (missions.flash) missions.flash.visible = true;
    missions.muzzleTimer = 60; // frozen frame: keep the flash lit
    npcs.spawnYardCrew();
    // Two targets already down, one left standing at partial HP.
    npcs.enemies[0].damage(100);
    npcs.enemies[1].damage(100);
    npcs.enemies[2].damage(34);
    missions.targetsDown = 2;
    vehicle.place(-84, 60, Math.PI);
    camera.position.set(-106, 4, 38);
    camera.lookAt(-100, 1.5, 68);
    game.cameraMode = 'fixed';
  }
  game.hud.render(missions.getState(vehicle.speedKmh, vehicle.driftCount));
}
