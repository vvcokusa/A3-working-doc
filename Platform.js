/*
  Platform.js
  ─────────────────────────────────────────────
  A single scrolling platform.

  draw() accepts an optional colOverride array
  [r, g, b] from the level config so platform
  colour changes per level. Falls back to the
  original pink if nothing is passed.
*/
/*class Platform {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  // colOverride — optional [r,g,b] from PlatformManager / level config
  draw(colOverride) {
    const [r, g, b] = colOverride || [222, 153, 182]; // default pink
    fill(r, g, b);
    noStroke();
    rect(this.x, this.y, this.w, this.h, 4);

    // Subtle top highlight
    fill(
      min(r + 30, 255),
      min(g + 30, 255),
      min(b + 30, 255),
    );
    rect(this.x + 4, this.y, this.w - 8, 3, 2);
  }
}
*/

class Platform {
  constructor(x, y, w, h, behavior = null) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.age = 0;
    this.alpha = 255;
    this.dissolveTimer = null;
    this.dissolveDuration = null;
    this.behavior = behavior || "fade_respawn";
  }

  // colOverride — optional [r,g,b] array from PlatformManager / level config
  draw(colOverride) {
    const [r, g, b] = colOverride || [222, 153, 182]; // default pink
    const alpha =
      this.dissolveTimer != null
        ? map(this.dissolveTimer, 0, this.dissolveDuration, 0, 255)
        : this.alpha;
    fill(r, g, b, alpha);
    noStroke();
    rect(this.x, this.y, this.w, this.h, 4);

    // Subtle top highlight
    fill(min(r + 30, 255), min(g + 30, 255), min(b + 30, 255), alpha);
    rect(this.x + 4, this.y, this.w - 8, 3, 2);
  }
}
