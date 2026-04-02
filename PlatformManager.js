/*
  PlatformManager.js
  ─────────────────────────────────────────────
  Spawns, scrolls, and culls elevated platforms.

  draw() now accepts an optional platformColor
  array [r,g,b] passed from the level config so
  platform colour changes between levels.
*/

class PlatformManager {
  constructor() {
    this.platforms = [];
    this._spawnTimer = 0;
    this._resetSpawnTimer();
  }

  reset() {
    this.platforms = [];
    this._resetSpawnTimer();
  }

  update(speed) {
    for (const p of this.platforms) p.x -= speed;
    this.platforms = this.platforms.filter((p) => p.x + p.w > 0);

    this._spawnTimer -= speed;
    if (this._spawnTimer <= 0) {
      this._spawnPlatform();
      this._resetSpawnTimer();
    }
  }

  // platformColor — optional [r,g,b] array from level config
  draw(platformColor) {
    for (const p of this.platforms) p.draw(platformColor);
  }

  _spawnPlatform() {
    const w = random(160, 250);
    this.platforms.push(new Platform(width + 40, PLATFORM_Y, w, 14));
  }

  _resetSpawnTimer() {
    this._spawnTimer = random(400, 600);
  }
}
