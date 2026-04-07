/*
  PlatformManager.js
  ─────────────────────────────────────────────
  Spawns, scrolls, and culls elevated platforms.

  draw() now accepts an optional platformColor
  array [r,g,b] passed from the level config so
  platform colour changes between levels.
*/

/*
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
*/

class PlatformManager {
  constructor() {
    this.platforms = [];
    this._spawnTimer = 0;
    this._resetSpawnTimer();
    this.removedPlatforms = [];
  }

  reset() {
    this.platforms = [];
    this.removedPlatforms = [];
    this._resetSpawnTimer();
  }

  update(speed, lvl) {
    const isLevelOne = lvl && lvl.name === "Level 1 — Fractured Skylines";
    const isLevelTwo = lvl && lvl.name === "Level 2 — Sky";
    const driftFactor = isLevelTwo && shakeActive ? 2.5 : 1;
    const driftX = isLevelTwo ? sin(frameCount * 0.02) * 0.8 * driftFactor : 0;

    for (const p of this.platforms) {
      p.x -= speed;
      if (isLevelTwo) p.x += driftX;
      if (p.dissolveTimer != null) {
        p.dissolveTimer--;
        p.alpha = map(p.dissolveTimer, 0, p.dissolveDuration, 0, 255);
      }
      p.age++;
    }

    // Handle platform removal and respawning
    for (let i = this.platforms.length - 1; i >= 0; i--) {
      const p = this.platforms[i];
      const isOffScreen = p.x + p.w <= 0;
      const hasReachedFadeEnd = isLevelOne && p.age >= 120;

      if (p.dissolveTimer != null && p.dissolveTimer <= 0) {
        this.platforms.splice(i, 1);
      } else if (isOffScreen) {
        this.platforms.splice(i, 1);
      } else if (hasReachedFadeEnd) {
        // Platform reached end of fade lifecycle
        if (p.behavior === "fade_respawn") {
          // Mark for respawn
          this.removedPlatforms.push({
            platform: p,
            removalTime: frameCount,
            originalWidth: p.w,
          });
          this.platforms.splice(i, 1);
        } else if (p.behavior === "fade_only") {
          // Keep the platform but cap its alpha at ~0.3 so it's semi-visible
          p.alpha = 80; // semi-transparent but playable
          p.age = 120; // prevent further age increases
        }
      }
    }

    // Check if removed platforms should respawn (120 frames later)
    if (isLevelOne) {
      for (let i = this.removedPlatforms.length - 1; i >= 0; i--) {
        const removed = this.removedPlatforms[i];
        const timeSinceRemoval = frameCount - removed.removalTime;
        if (timeSinceRemoval >= 120) {
          // Respawn at a slightly different x position
          const newX = width + 40 + random(-80, 80);
          removed.platform.x = newX;
          removed.platform.age = 0;
          removed.platform.alpha = 255;
          this.platforms.push(removed.platform);
          this.removedPlatforms.splice(i, 1);
        }
      }
    } else {
      this.platforms = this.platforms.filter((p) => p.x + p.w > 0);
    }

    this._spawnTimer -= speed;
    if (this._spawnTimer <= 0) {
      this._spawnPlatform(lvl);
      this._resetSpawnTimer();
    }
  }

  // platformColor — optional [r,g,b] array from level config
  draw(platformColor) {
    for (const p of this.platforms) p.draw(platformColor);
  }

  _spawnPlatform(lvl) {
    const w = random(160, 250);
    const isLevelOne = lvl && lvl.name === "Level 1 — Fractured Skylines";
    const isLevelTwo = lvl && lvl.name === "Level 2 — Sky";
    // For level 1, randomly choose behavior: 50% fade-only, 50% fade-respawn
    const behavior =
      isLevelOne && random() < 0.5 ? "fade_only" : "fade_respawn";

    let y = PLATFORM_Y;
    if (isLevelTwo) {
      const cloudYs = [170, 185, 200];
      y = random(cloudYs);
    }

    this.platforms.push(new Platform(width + 40, y, w, 14, behavior));
  }

  _resetSpawnTimer() {
    this._spawnTimer = random(400, 600);
  }
}
