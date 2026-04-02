/*
  LevelManager.js
  ─────────────────────────────────────────────
  Manages level definitions and tracks which
  level the player is currently on.

  Each level object defines:
    name          — display name shown on the HUD
    dodgeGoal     — spikes to dodge to finish the level
    bgTint        — overlay color applied to the background [r,g,b,a]
    groundColor   — color of the ground line
    spikeAirChance — probability of air spikes (0.0–1.0)
    baseSpeed     — starting scroll speed for this level
    maxSpeedBonus — how much extra speed intensity adds
    spawnRateMin  — fastest spawn interval (frames) at max intensity
    spawnRateMax  — slowest spawn interval at zero intensity
    platformColor — hex string passed to Platform.js draw override
    message       — short flavour text shown on the level-clear screen

  LevelManager does NOT touch p5 or game objects directly —
  sketch.js reads the config and applies it each frame.
*/

class LevelManager {
  constructor() {
    this.levels = [
      // ── Level 1 — The City ──────────────────
      {
        name: "Level 1 — Fractured Skylines",
        dodgeGoal: 20,
        bgTint: null, // no extra tint; default pink city bg
        groundStroke: [40, 40, 40],
        airSpikeChance: 0.35,
        baseSpeed: 4,
        maxSpeedBonus: 1,
        spawnRateMin: 70,
        spawnRateMax: 100,
        platformColor: [222, 153, 182], // original pink
        message: "You survived Fractured Skylines! Heading deeper...",
      },

      // ── Level 2 — Sky ─────────────────
      {
        name: "Level 2 — Sky",
        dodgeGoal: 20,
        bgTint: [10, 20, 70, 100], // blue storm tint always on
        groundStroke: [80, 120, 200],
        airSpikeChance: 0.5, // more air spikes = trickier
        baseSpeed: 5, // faster than level 1
        maxSpeedBonus: 1.5,
        spawnRateMin: 60,
        spawnRateMax: 90,
        platformColor: [100, 140, 210], // blue-ish platforms
        message: "You cleared Sky! One final challenge awaits...",
      },

      // ── Level 3 — Cave ──────────────────
      {
        name: "Level 3 — Cave",
        dodgeGoal: 20,
        bgTint: [5, 0, 20, 180], // near-black void tint
        groundStroke: [180, 50, 220],
        airSpikeChance: 0.6, // mostly air spikes
        baseSpeed: 6, // fastest
        maxSpeedBonus: 2,
        spawnRateMin: 50,
        spawnRateMax: 80,
        platformColor: [120, 40, 180], // purple platforms
        message: "You escaped the Cave. You win!",
      },
    ];

    this.currentIndex = 0;
  }

  // ── Current level config object ──────────────
  get current() {
    return this.levels[this.currentIndex];
  }

  // ── How many levels exist ────────────────────
  get totalLevels() {
    return this.levels.length;
  }

  // ── Is there a next level? ───────────────────
  hasNext() {
    return this.currentIndex < this.levels.length - 1;
  }

  // ── Advance to next level ────────────────────
  advance() {
    if (this.hasNext()) {
      this.currentIndex++;
      return true;
    }
    return false; // no more levels → game won
  }

  // ── Reset back to level 1 ────────────────────
  reset() {
    this.currentIndex = 0;
  }
}
