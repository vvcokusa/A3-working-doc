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
    this.respawnList = [];
    this._spawnTimer = 0;
    this.spawnCounter = 0;
    this._resetSpawnTimer();
  }

  reset() {
    this.platforms = [];
    this.respawnList = [];
    this._resetSpawnTimer();
  }

  update(speed) {
    for (const p of this.platforms) {
      p.update();
      p.x -= speed;
    }
    // Remove platforms marked for removal and add to respawn list
    this.platforms = this.platforms.filter((p) => {
      if (p.toRemove) {
        this.respawnList.push({ x: p.x, timer: 120 });
        return false;
      }
      return p.x + p.w > 0;
    });

    // Update respawn timers
    for (let i = this.respawnList.length - 1; i >= 0; i--) {
      this.respawnList[i].timer--;
      if (this.respawnList[i].timer <= 0) {
        this._spawnPlatformAtOffset(random(-100, 100));
        this.respawnList.splice(i, 1);
      }
    }

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
    const p = new Platform(width + 40, PLATFORM_Y, w, 14);
    this.spawnCounter++;
    if (this.spawnCounter % 2 === 1) {
      p.isFading = true;
      p.color = [222, 153, 182]; // pink for fading
    } else {
      p.isFading = false;
      p.color = [180, 180, 180]; // gray for non-fading
    }
    this.platforms.push(p);
  }

  _spawnPlatformAtOffset(offset) {
    const w = random(160, 250);
    const p = new Platform(width + 40 + offset, PLATFORM_Y, w, 14);
    this.spawnCounter++;
    if (this.spawnCounter % 2 === 1) {
      p.isFading = true;
      p.color = [222, 153, 182]; // pink for fading
    } else {
      p.isFading = false;
      p.color = [180, 180, 180]; // gray for non-fading
    }
    this.platforms.push(p);
  }

  _resetSpawnTimer() {
    this._spawnTimer = random(400, 600);
  }
}
