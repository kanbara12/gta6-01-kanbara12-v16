// SUNCOAST: HEATLINE — the HUD: money, job, REP, wanted stars, speed,
// objective, police panel and message toasts. Hideable with H or ?hud=0.
// All values come from the game state; the HUD never invents a number.

export class Hud {
  constructor(root) {
    this.root = root;
    this.visible = true;
    this.root.innerHTML = `
      <div id="hud-top-left">
        <div id="hud-cash">$0</div>
        <div id="hud-job">JOB 1/8 · $1,250</div>
        <div id="hud-rep">REP 0</div>
      </div>
      <div id="hud-top-right">
        <div id="hud-wanted"></div>
        <div id="hud-speed">0 km/h</div>
        <div id="hud-drift"></div>
      </div>
      <div id="hud-objective"></div>
      <div id="hud-police"></div>
      <div id="hud-toast"></div>
      <div id="hud-controls">WASD drive · E interact · F shoot · H hide HUD · M mute · R restart job</div>`;
    this.cashEl = root.querySelector('#hud-cash');
    this.jobEl = root.querySelector('#hud-job');
    this.repEl = root.querySelector('#hud-rep');
    this.wantedEl = root.querySelector('#hud-wanted');
    this.speedEl = root.querySelector('#hud-speed');
    this.driftEl = root.querySelector('#hud-drift');
    this.objectiveEl = root.querySelector('#hud-objective');
    this.policeEl = root.querySelector('#hud-police');
    this.toastEl = root.querySelector('#hud-toast');
    this.toastTimer = null;
  }

  setVisible(show) {
    this.visible = show;
    this.root.style.display = show ? 'block' : 'none';
  }

  render(state) {
    if (!this.visible) return;
    this.cashEl.textContent = `$${state.cash.toLocaleString('en-US')}`;
    this.jobEl.textContent = `JOB ${state.jobIndex + 1}/8 · $${state.job.cashAfter.toLocaleString('en-US')}`;
    this.repEl.textContent = `REP ${state.rep}`;
    this.wantedEl.textContent = state.wanted > 0 ? '★'.repeat(state.wanted) + '☆'.repeat(3 - state.wanted) : '';
    this.wantedEl.style.color = state.wanted > 0 ? '#ff3a3a' : '';
    this.speedEl.textContent = `${Math.round(state.speedKmh)} km/h`;
    this.driftEl.textContent = state.driftCount > 0 ? `DRIFT x${state.driftCount} +$${state.driftCount * 50}` : '';
    this.objectiveEl.textContent = state.objective;
    if (state.wanted >= 3) {
      this.policeEl.innerHTML = ['SKY-1 overhead', 'UNIT 12 — Ocean Ave', 'UNIT 07 — 5th St',
        'UNIT 23 — Pier Rd', 'UNIT 31 — Downtown'].map((row) => `<div>${row}</div>`).join('');
    } else if (state.wanted > 0) {
      this.policeEl.innerHTML = '<div>SKY-1 overhead</div><div>UNIT 12 — Ocean Ave</div>';
    } else {
      this.policeEl.innerHTML = '';
    }
  }

  toast(message, ms = 2600) {
    this.toastEl.textContent = message;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => { this.toastEl.textContent = ''; }, ms);
  }
}
