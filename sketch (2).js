/*
  sketch.js
  ─────────────────────────────────────────────
  A2 Mid-Term Runner — Main Sketch
  Course: GBDA302

  This file owns:
    • Global constants (canvas, physics, heights)
    • Game-state variables (score, intensity, etc.)
    • setup / draw / keyPressed
    • Collision detection (Player ↔ Spikes)
    • Screen-state machine:
        "start" → "play" → "levelclear" → "play" (next level)
                                        → "win"  (after level 3)
                         → "lose"

  Level configuration is read from LevelManager.js.
  Each level changes speed, spike rates, air-spike
  chance, tint colour, and platform colour.
  After dodging 100 spikes the player clears the level.

  To change how things LOOK or MOVE, edit the
  matching class file instead of this one:
    Player.js         — player physics & drawing
    Spike.js          — single spike drawing (ground + air)
    SpikeManager.js   — spawn rates, air spike chance
    Platform.js       — single platform drawing
    PlatformManager.js — spawn gaps, platform width
    HUD.js            — all on-screen UI text & bars
    LevelManager.js   — level configs (speed, tint, goals…)
*/

// ── Canvas ───────────────────────────────────
const CANVAS_W = screen.width;
const CANVAS_H = 300;

// ── World heights (edit here to rebalance) ───
const GROUND = 230;
const PLATFORM_Y = 200;
const AIR_SPIKE_Y = 110;

// ── Intensity / boost constants ───────────────
const MAX_INTENSITY = 100;
const BOOST_DURATION = 200;

// ── Asset variables ───────────────────────────
let imgBg;
let imgIdle;
let imgRun;
let imgBoost;
let bgX = 0;
let raindrops = [];

// ── Game-state variables ─────────────────────
let state = "start"; // "start" | "play" | "levelclear" | "win" | "lose"
let startScreen = "title"; // "title" | "instructions"

let player;
let spikeManager;
let platformManager;
let hud;
let levelManager;

let score = 0;        // total spikes dodged across the whole run
let levelScore = 0;   // spikes dodged THIS level (resets each level)
let intensity = 0;
let streak = 0;

let boostActive = false;
let boostTimer = 0;

let hearts = 5;
let hitCooldown = 0;

let misses = 0;
let shakeActive = false;
let shakeSuccess = 0;

let levelClearTimer = 0; // countdown (frames) before auto-advancing

// ── p5 preload ────────────────────────────────
function preload() {
  imgBg    = loadImage("assets/10_17.png");
  imgIdle  = loadImage("assets/standing-skin.gif");
  imgRun   = loadImage("assets/running-skin.gif");
  imgBoost = loadImage("assets/booster-skin.gif");
}

// ── p5 setup ─────────────────────────────────
function setup() {
  createCanvas(CANVAS_W, CANVAS_H);
  frameRate(60);

  levelManager    = new LevelManager();
  player          = new Player();
  spikeManager    = new SpikeManager();
  platformManager = new PlatformManager();
  hud             = new HUD();

  resetGame();
}

// ── Full game reset (back to level 1) ────────
function resetGame() {
  levelManager.reset();

  player.reset();
  spikeManager.reset();
  platformManager.reset();

  score      = 0;
  levelScore = 0;
  intensity  = 0;
  streak     = 0;

  boostActive = false;
  boostTimer  = 0;

  hearts      = 5;
  hitCooldown = 0;

  misses       = 0;
  shakeActive  = false;
  shakeSuccess = 0;

  bgX       = 0;
  raindrops = [];

  startScreen = "title";
}

// ── Start a fresh level (keeps score + hearts) ─
function startNextLevel() {
  player.reset();
  spikeManager.reset();
  platformManager.reset();

  levelScore  = 0;
  intensity   = 0;
  streak      = 0;
  boostActive = false;
  boostTimer  = 0;
  hitCooldown = 0;
  shakeActive  = false;
  shakeSuccess = 0;
  misses       = 0;
  raindrops    = [];
}

// ── Main draw loop ────────────────────────────
function draw() {
  background(245);

  const lvl = levelManager.current; // shortcut to current level config

  // ── Scrolling background ──────────────────
  if (state === "play") {
    let bgSpeed = map(intensity, 0, MAX_INTENSITY, 0.5, 2);
    if (shakeActive) bgSpeed *= 1.25;
    bgX -= bgSpeed;
  }

  if (imgBg) {
    let imgW = imgBg.width;
    let x = bgX % imgW;
    if (x > 0) x -= imgW;
    for (let i = 0; i * imgW < width + imgW; i++) {
      image(imgBg, x + i * imgW, 0, imgW, CANVAS_H);
    }
  }

  // ── Per-level bg tint (always drawn over bg) ──
  if (lvl.bgTint && state === "play") {
    noStroke();
    fill(...lvl.bgTint);
    rect(0, 0, width, height);
  }

  // ── Dark blue shake overlay ───────────────
  if (shakeActive) {
    noStroke();
    fill(10, 20, 80, 140);
    rect(0, 0, width, height);
  }

  updateAndDrawRain();

  // Ground line (colour changes per level)
  stroke(...lvl.groundStroke);
  line(0, GROUND + player.h, width, GROUND + player.h);
  noStroke();

  // ══════════════════════════════════════════
  //  START SCREEN
  // ══════════════════════════════════════════
  if (state === "start") {
    platformManager.draw();
    player.draw(false, imgIdle);

    if (startScreen === "title") {
      fill(0, 0, 0, 200);
      rect(0, 0, width, height);

      textAlign(CENTER);
      fill(255, 220, 50);
      textSize(100);
      textStyle(BOLD);
      text("BPDash", width / 2, height / 2 + 10);

      stroke(255, 255, 255, 80);
      line(width / 2 - 120, height / 2 + 30, width / 2 + 120, height / 2 + 30);
      noStroke();

      fill(255);
      textSize(16);
      text("ENTER — Start Game", width / 2, height / 2 + 57);

      fill(180);
      textSize(13);
      text("I — Instructions", width / 2, height / 2 + 80);
    }

    if (startScreen === "instructions") {
      fill(0, 0, 0, 200);
      rect(0, 0, width, height);

      textAlign(CENTER);
      fill(255, 220, 50);
      textSize(22);
      textStyle(BOLD);
      text("HOW TO PLAY", width / 2, 52);
      textStyle(NORMAL);

      stroke(255, 255, 255, 60);
      line(width / 2 - 140, 62, width / 2 + 140, 62);
      noStroke();

      fill(160, 210, 255);
      textSize(13);
      text("CONTROLS", width / 2, 82);

      fill(255);
      textSize(13);
      text(
        "SPACE — Jump     |     R — Restart     |     DOUBLE SPACE — Double Jump",
        width / 2, 100,
      );

      stroke(255, 255, 255, 40);
      line(width / 2 - 120, 112, width / 2 + 120, 112);
      noStroke();

      fill(160, 210, 255);
      textSize(13);
      text("RULES", width / 2, 130);

      fill(255);
      textSize(12);
      text("Dodge spikes by jumping over them.", width / 2, 150);
      text("Dodge 100 spikes to clear each level!", width / 2, 168);

      fill(255, 130, 130);
      text(
        "Red hanging spikes are dangerous when you're on a platform!",
        width / 2, 186,
      );

      fill(255);
      text("Clear 5 spikes in a row to activate a JUMP BOOST!", width / 2, 204);
      text(
        "If you hit a spike you enter SHAKE MODE! Clear 5 spikes to recover.",
        width / 2, 222,
      );
      text(
        "You have 5 hearts. Hit a spike and lose 1 heart. Reach 0 and it's game over.",
        width / 2, 240,
      );

      fill(180);
      textSize(12);
      text("B — Back to Title     |     ENTER — Start Game", width / 2, 270);
    }

    return;
  }

  // ══════════════════════════════════════════
  //  LEVEL CLEAR SCREEN
  // ══════════════════════════════════════════
  if (state === "levelclear") {
    platformManager.draw();
    player.draw(false, imgRun);

    fill(0, 0, 0, 170);
    rect(0, 0, width, height);

    textAlign(CENTER);
    fill(255, 220, 50);
    textStyle(BOLD);
    textSize(36);
    text("LEVEL CLEAR!", width / 2, height / 2 - 30);
    textStyle(NORMAL);

    fill(255);
    textSize(15);
    text(lvl.message, width / 2, height / 2 + 5);

    fill(180);
    textSize(13);
    text(
      "ENTER — Continue   |   R — Restart from Level 1",
      width / 2, height / 2 + 35,
    );

    // Auto-advance after 3 seconds (180 frames)
    levelClearTimer--;
    if (levelClearTimer <= 0) advanceLevel();

    return;
  }

  // ══════════════════════════════════════════
  //  WIN SCREEN
  // ══════════════════════════════════════════
  if (state === "win") {
    fill(0, 0, 0, 200);
    rect(0, 0, width, height);

    textAlign(CENTER);
    fill(255, 220, 50);
    textStyle(BOLD);
    textSize(42);
    text("YOU WIN!", width / 2, height / 2 - 30);
    textStyle(NORMAL);

    fill(255);
    textSize(16);
    text("Total score: " + score + " spikes dodged", width / 2, height / 2 + 10);

    fill(180);
    textSize(13);
    text("R — Play Again", width / 2, height / 2 + 40);

    return;
  }

  // ══════════════════════════════════════════
  //  PLAY SCREEN
  // ══════════════════════════════════════════
  if (state === "play") {
    intensity = constrain(intensity + 0.04, 0, MAX_INTENSITY);

    if (boostActive) {
      boostTimer--;
      if (boostTimer <= 0) boostActive = false;
    }

    if (hitCooldown > 0) hitCooldown--;

    // Speed uses per-level base + bonus
    let gameSpeed = lvl.baseSpeed + map(intensity, 0, MAX_INTENSITY, 0, lvl.maxSpeedBonus);
    if (shakeActive) gameSpeed *= 1.25;

    player.update(intensity, MAX_INTENSITY, platformManager.platforms);
    spikeManager.update(gameSpeed, intensity, MAX_INTENSITY, lvl);
    platformManager.update(gameSpeed);

    checkNearMiss();
    checkScore();
    checkCollision();

    // Check level-clear condition
    if (levelScore >= lvl.dodgeGoal) {
      state = "levelclear";
      levelClearTimer = 180; // 3 seconds at 60 fps
      return;
    }

    push();
    if (shakeActive) translate(random(-4, 4), random(-4, 4));
    platformManager.draw(lvl.platformColor);
    spikeManager.draw(intensity, MAX_INTENSITY);
    player.draw(boostActive, boostActive ? imgBoost : imgRun);
    pop();

    hud.draw(
      score,
      intensity,
      MAX_INTENSITY,
      hearts,
      streak,
      boostActive,
      shakeActive,
      levelScore,
      lvl.dodgeGoal,
      levelManager.currentIndex + 1,
      levelManager.totalLevels,
    );
  }

  // ══════════════════════════════════════════
  //  LOSE SCREEN
  // ══════════════════════════════════════════
  if (state === "lose") {
    platformManager.draw(lvl.platformColor);
    spikeManager.draw(intensity, MAX_INTENSITY);
    player.draw(false, imgRun);
    fill(0, 0, 0, 120);
    rect(0, 0, width, height);

    textAlign(CENTER);
    fill(255);
    textSize(28);
    text("GAME OVER", width / 2, height / 2 - 10);
    textSize(18);
    text(
      "Score: " + score + "   |   Press R to Restart",
      width / 2, height / 2 + 22,
    );
  }
}

// ── Advance to next level or trigger win ─────
function advanceLevel() {
  const advanced = levelManager.advance();
  if (advanced) {
    startNextLevel();
    state = "play";
  } else {
    state = "win";
  }
}

// ── Rain effect ───────────────────────────────
function updateAndDrawRain() {
  if (!shakeActive) {
    raindrops = [];
    return;
  }

  for (let i = 0; i < 5; i++) {
    raindrops.push({
      x: random(width),
      y: random(-20, 0),
      speed: random(8, 14),
      len: random(10, 20),
      alpha: random(100, 200),
    });
  }

  for (let d of raindrops) {
    d.y += d.speed;
    d.x -= 1.5;
    stroke(150, 180, 255, d.alpha);
    strokeWeight(1);
    line(d.x, d.y, d.x + 2, d.y + d.len);
  }

  raindrops = raindrops.filter((d) => d.y < height);
}

// ── Collision: player hits a spike ───────────
function checkCollision() {
  if (hitCooldown > 0) return;

  for (const s of spikeManager.spikes) {
    const overlapX = player.x + player.w > s.x + 4 && player.x < s.x + s.w - 4;
    if (!overlapX) continue;

    let hit = false;

    if (s.type === "ground") {
      const playerFeet = player.y + player.h;
      if (playerFeet > s.y + 8) hit = true;
    } else {
      const playerTop = player.y;
      const spikeBase = s.y + s.h;
      if (playerTop < spikeBase - 8 && player.y + player.h > s.y) hit = true;
    }

    if (hit) {
      hitCooldown = 15;

      if (shakeActive) {
        hearts = max(0, hearts - 1);
        if (hearts <= 0) {
          state = "lose";
          return;
        }
      } else {
        shakeActive  = true;
        shakeSuccess = 0;
        boostActive  = false;
        boostTimer   = 0;
      }

      streak = 0;
      return;
    }
  }
}

// ── Scoring: spike fully passed the player ────
function checkScore() {
  for (const s of spikeManager.spikes) {
    if (!s.scored && s.x + s.w < player.x) {
      score++;
      levelScore++;
      s.scored = true;

      if (shakeActive) {
        shakeSuccess++;
        if (shakeSuccess >= 5) {
          shakeActive  = false;
          shakeSuccess = 0;
          misses       = 0;
        }
      }

      if (!shakeActive && !boostActive) {
        streak++;
        if (streak >= 5) {
          boostActive = true;
          boostTimer  = BOOST_DURATION;
          streak      = 0;
        }
      }
    }
  }
}

// ── Near-miss ─────────────────────────────────
function checkNearMiss() {
  for (const s of spikeManager.spikes) {
    if (s.type !== "ground") continue;

    const closeX = s.x < player.x + player.w + 10 && s.x + s.w > player.x - 10;
    const closeY = abs(player.y + player.h - s.y) < 10;

    if (closeX && closeY && !s.nearMiss) {
      intensity = constrain(intensity + 10, 0, MAX_INTENSITY);
      s.nearMiss = true;
    }
  }
}

// ── Key input ─────────────────────────────────
function keyPressed() {
  if (state === "start") {
    if (keyCode === ENTER) {
      startScreen = "title";
      state = "play";
    }
    if (key === "i" || key === "I") startScreen = "instructions";
    if ((key === "b" || key === "B") && startScreen === "instructions") {
      startScreen = "title";
    }
  }

  if (state === "levelclear" && keyCode === ENTER) {
    advanceLevel();
  }

  if (state === "play" && key === " ") {
    player.jump(boostActive);
  }

  if ((state === "lose" || state === "play" || state === "win" || state === "levelclear") &&
      (key === "r" || key === "R")) {
    resetGame();
    state = "play";
  }
}
