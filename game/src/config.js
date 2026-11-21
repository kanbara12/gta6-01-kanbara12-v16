// SUNCOAST: HEATLINE — shared tuning and mission table.
// All money figures are the design's own: 8 jobs, $22,450 total.
// `pay` is what each job adds; `cashAfter` is the running total the HUD shows
// as "JOB n/8 · $cashAfter" (the projected total once the job is done).

export const WORLD = {
  seed: 20261121,
  roadWidth: 9,
  blockSize: 46,
  cityHalf: 150,
  beachX: -150, // ocean sits west of this line; sand between beachX and the road
  oceanX: -215,
  sunAngle: 0.32, // low sunset sun over the ocean
};

export const CAR = {
  maxSpeed: 52, // m/s (~187 km/h)
  accel: 22,
  brake: 34,
  reverseMax: 12,
  steerMax: 0.55,
  grip: 6.5,
  driftBonus: 50,
};

// Individual payouts sum to 22,450.
export const JOBS = [
  { id: 1, name: 'Beachfront Pickup', pay: 1250, cashAfter: 1250, kind: 'pickup-deliver', blurb: 'Pick up Rae\u2019s cargo at the pier, drop it on Ocean Ave.' },
  { id: 2, name: 'Sunset Run', pay: 2500, cashAfter: 3750, kind: 'deliver', blurb: 'Rae is riding with you. Fast, clean, no scratches.' },
  { id: 3, name: 'Palms Courier', pay: 2300, cashAfter: 6050, kind: 'deliver', blurb: 'Two drops along the palm row before the light dies.' },
  { id: 4, name: 'Yard Sweep', pay: 3500, cashAfter: 9550, kind: 'onfoot', blurb: 'On foot. Clear Marlo\u2019s yard: 3 targets. Watch the muzzle flash.' },
  { id: 5, name: 'Heatline Escape', pay: 3650, cashAfter: 13200, kind: 'escape', blurb: '3-star heat. SKY-1 is overhead. Lose them on Ocean Ave.' },
  { id: 6, name: 'Rae\u2019s Return', pay: 3200, cashAfter: 16400, kind: 'deliver', blurb: 'Bring the ledger back to the pier. Sable is waiting.' },
  { id: 7, name: 'Night Market', pay: 2950, cashAfter: 19350, kind: 'deliver', blurb: 'Dusk run through downtown. Keep the GT intact.' },
  { id: 8, name: 'Heatline Finale', pay: 3100, cashAfter: 22450, kind: 'escape', blurb: 'One last run, full heat. Finish at the ferris wheel.' },
];

export const TOTAL_PAYOUT = JOBS.reduce((sum, job) => sum + job.pay, 0); // 22,450

export const FIXER = { name: 'Rae', color: 0xff5a7a };
export const RIVAL = { name: 'Marlo', color: 0xffb020 };
export const LOOKOUT = { name: 'Sable', color: 0x7ad0ff };

export const WANTED_MAX = 3;
