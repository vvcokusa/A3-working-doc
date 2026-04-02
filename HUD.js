/*
  HUD.js
  ─────────────────────────────────────────────
  Draws all on-screen UI:
    • Score counter
    • Heart display
    • Streak / boost / shake status text
    • Level name + progress bar (spikes toward goal)

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
    levelScore,   // spikes dodged this level
    dodgeGoal,    // spikes needed to clear level
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

    // ── Status line ──────────────────────────
    if (shakeActive) {
      fill(255, 60, 60);
      text("DANGER — hearts draining! Clear 5 spikes to recover!", 10, 80);
    } else if (boostActive) {
      fill(255, 200, 0);
      text("BOOST ACTIVE!", 10, 80);
    } else {
      fill(0);
      text("Streak: " + streak + " / 5 for boost", 10, 80);
    }

    // ── Level name (top-right) ───────────────
    textAlign(RIGHT);
    fill(0);
    textSize(13);
    text("Level " + currentLevel + " / " + totalLevels, width - 10, 20);

    // ── Level progress bar ───────────────────
    // Track: grey background
    const barW = 160;
    const barH = 10;
    const barX = width - barW - 10;
    const barY = 28;

    fill(200);
    noStroke();
    rect(barX, barY, barW, barH, 3);

    // Fill: green progress
    const progress = constrain(levelScore / dodgeGoal, 0, 1);
    fill(80, 200, 100);
    rect(barX, barY, barW * progress, barH, 3);

    // Label
    textAlign(RIGHT);
    fill(0);
    textSize(11);
    text(levelScore + " / " + dodgeGoal + " spikes", width - 10, 50);

    textAlign(LEFT); // reset
  }
}
