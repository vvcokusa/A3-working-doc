/*
  SpikeManager.js
  ─────────────────────────────────────────────
  Manages the full list of Spike objects:
  spawning, moving, culling, and drawing.

  update() now accepts the current level config
  object from LevelManager so spawn rate and
  air-spike chance scale per level.
*/

class SpikeManager {
  constructor() {
    this.spikes = [];
    this.currentSpeed = 7;
  }

  reset() {
    this.spikes = [];
    this.currentSpeed = 7;
  }

  // lvl — current level config from LevelManager
  update(speed, intensity, maxIntensity, lvl) {
    this.currentSpeed = speed;

    // Use per-level spawn rate range
    const minRate = lvl ? lvl.spawnRateMin : 70;
    const maxRate = lvl ? lvl.spawnRateMax : 100;
    const spawnRate = map(intensity, 0, maxIntensity, maxRate, minRate);

    if (frameCount % floor(spawnRate) === 0) this._spawn(lvl);

    for (const s of this.spikes) s.x -= speed;
    this.spikes = this.spikes.filter((s) => s.x + s.w > 0);
  }

  _spawn(lvl) {
    const airChance = lvl ? lvl.airSpikeChance : 0.35;
    if (random() < airChance) {
      this._spawnAir();
    } else {
      this._spawnGround();
    }
  }

  _spawnGround() {
    const groundBase = GROUND + 40;
    const h = random(40, 55);
    const w = random(28, 40);
    this.spikes.push(new Spike(width + 20, groundBase - h, w, h, "ground"));

    if (random() < 0.3) {
      const h2 = h - random(10, 15);
      this.spikes.push(
        new Spike(width + 20 + w, groundBase - h2, w, h2, "ground"),
      );
    }
  }

  _spawnAir() {
    const h = random(50, 70);
    const w = random(28, 40);
    this.spikes.push(new Spike(width + 20, AIR_SPIKE_Y, w, h, "air"));
  }

  draw(intensity, maxIntensity) {
    for (const s of this.spikes) s.draw(intensity, maxIntensity);
  }
}
