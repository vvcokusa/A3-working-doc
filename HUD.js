/*
  HUD.js
  ─────────────────────────────────────────────
  Draws all on-screen UI:
    • Score counter
    • Heart display
    • Mania Meter (replaces streak counter)
    • Level name + progress bar (spikes toward goal)
    • Centered flashing BOOST ACTIVE! banner
 
  Call HUD.draw() once per frame AFTER cam.end()
  so it renders on top of the world in screen space.
*/

class HUD {
  draw(
    score,
    intensity,
    maxIntensity,
    hearts,
    streak,
    boostActive,
    shakeActive,
    levelScore, // spikes dodged this level
    dodgeGoal, // spikes needed to clear level
    currentLevel, // 1-based display number
    totalLevels,
  ) {
    // ── Score ────────────────────────────────
    fill(0);
    noStroke();
    textAlign(LEFT);
    textSize(14);
    text("Score: " + score, 10, 20);

    // ── Hearts display ───────────────────────
    textAlign(CENTER);
    textSize(28);

    for (let i = 0; i < 5; i++) {
      if (i < hearts) {
        fill(255, 50, 50);
      } else {
        fill(100);
      }
      text("♥", 22 + i * 35, 55);
    }

    textSize(14);
    textAlign(LEFT);

    // ── Mania Meter ──────────────────────────
    const meterX = 10;
    const meterY = 68;
    const meterW = 160;
    const meterH = 14;
    const meterRadius = 4;

    noStroke();
    textSize(11);

    // Track background
    fill(60);
    rect(meterX, meterY, meterW, meterH, meterRadius);

    if (shakeActive) {
      // Shaking mode: red pulsing bar (full)
      const pulse = 0.6 + 0.4 * sin(frameCount * 0.2);
      fill(255 * pulse, 30, 30);
      rect(meterX, meterY, meterW, meterH, meterRadius);

      // Danger label
      fill(255, 60, 60);
      textSize(11);
      textAlign(LEFT);
      text("DANGER — clear 5 spikes to recover!", meterX, meterY + meterH + 13);
    } else if (boostActive) {
      // Boost mode: full golden bar with shimmer
      const shimmer = 0.85 + 0.15 * sin(frameCount * 0.3);
      fill(255 * shimmer, 200 * shimmer, 0);
      rect(meterX, meterY, meterW, meterH, meterRadius);

      // Shine highlight
      fill(255, 255, 180, 120);
      rect(meterX + 4, meterY + 2, meterW - 8, 4, 2);

      // No small label — replaced by the big centered banner below

      // ── Centered BOOST ACTIVE! banner ────────
      push();

      // Flash: alternates fully visible and semi-transparent
      const flashAlpha = map(sin(frameCount * 0.18), -1, 1, 140, 255);

      // Subtle dark pill behind the text for readability
      const bannerW = 320;
      const bannerH = 58;
      const bannerX = width / 2;
      const bannerY = height / 2 - 30;

      noStroke();
      fill(20, 10, 0, flashAlpha * 0.55);
      rectMode(CENTER);
      rect(bannerX, bannerY, bannerW, bannerH, 12);

      // Golden glow outline
      const glowPulse = 0.5 + 0.5 * sin(frameCount * 0.18);
      stroke(255, 200, 0, 180 * glowPulse);
      strokeWeight(2.5);
      noFill();
      rect(bannerX, bannerY, bannerW, bannerH, 12);

      // Main text — bold & large
      noStroke();
      fill(255, 220, 0, flashAlpha);
      textAlign(CENTER, CENTER);
      textStyle(BOLD);
      textSize(36);
      text("BOOST ACTIVE", bannerX, bannerY);

      pop();
    } else {
      // Normal: green fill based on streak (0–5)
      const fillW = map(streak, 0, 5, 0, meterW);
      fill(60, 200, 80);
      if (fillW > 0) rect(meterX, meterY, fillW, meterH, meterRadius);

      // Segment markers (4 lines dividing into 5 segments)
      stroke(30);
      strokeWeight(1);
      for (let i = 1; i < 5; i++) {
        const markerX = meterX + (meterW / 5) * i;
        line(markerX, meterY, markerX, meterY + meterH);
      }
      noStroke();

      // Status label
      fill(80);
      textSize(11);
      textAlign(LEFT);
      text(streak + " / 5 — dodge 5 for boost", meterX, meterY + meterH + 13);
    }

    // ── Level name (top-right) ───────────────
    textAlign(RIGHT);
    fill(0);
    textSize(13);
    text("Level " + currentLevel + " / " + totalLevels, width - 10, 20);

    // ── Level progress bar ───────────────────
    const barW = 160;
    const barH = 10;
    const barX = width - barW - 10;
    const barY = 28;

    fill(200);
    noStroke();
    rect(barX, barY, barW, barH, 3);

    const progress = constrain(levelScore / dodgeGoal, 0, 1);
    fill(80, 200, 100);
    rect(barX, barY, barW * progress, barH, 3);

    textAlign(RIGHT);
    fill(0);
    textSize(11);
    text(levelScore + " / " + dodgeGoal + " spikes", width - 10, 50);

    textAlign(LEFT); // reset
    textStyle(NORMAL); // reset
    rectMode(CORNER); // reset
  }
}
