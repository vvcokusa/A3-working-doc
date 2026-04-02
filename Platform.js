/*
  Platform.js
  ─────────────────────────────────────────────
  A single scrolling platform.

  draw() accepts an optional colOverride array
  [r, g, b] from the level config so platform
  colour changes per level. Falls back to the
  original pink if nothing is passed.
*/

class Platform {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.standTimer = 0;
    this.alpha = 255;
    this.isFading = false;
    this.fadeTimer = 0;
    this.toRemove = false;
    this.color = [222, 153, 182]; // default pink
    this.isWarm = true; // default is warm
  }

  update() {
    // Only fade if not the default pink color (level 1), but now we have isFading flag
    if (this.isFading && this.standTimer > 0) {
      this.toRemove = true;
    }
  }

  // colOverride — optional [r,g,b] from PlatformManager / level config
  draw(colOverride) {
    if (colOverride) {
      this.color = colOverride;
      this.isWarm = this.color[0] > this.color[1] && this.color[0] > this.color[2];
      // Disable fading for level 1 (pink color)
      if (colOverride[0] === 222 && colOverride[1] === 153 && colOverride[2] === 182) {
        this.isFading = false;
      }
    }
    const [r, g, b] = this.color;
    fill(r, g, b, this.alpha);
    noStroke();
    rect(this.x, this.y, this.w, this.h, 4);

    // Subtle top highlight
    fill(
      min(r + 30, 255),
      min(g + 30, 255),
      min(b + 30, 255),
      this.alpha
    );
    rect(this.x + 4, this.y, this.w - 8, 3, 2);
  }
}
