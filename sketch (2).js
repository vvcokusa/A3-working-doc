// ── Canvas ───────────────────────────────────
const CANVAS_W = screen.width;
const CANVAS_H = 300;

// ── World heights ────────────────────────────
const GROUND = 230;
const PLATFORM_Y = 200;
const AIR_SPIKE_Y = 110;

// ── Intensity / boost constants ───────────────
const MAX_INTENSITY = 100;
const BOOST_DURATION = 200;

// ── Asset variables ───────────────────────────
let allBgLayers = [[], [], []]; // one array of images per level
let layerOffsets = []; // scrollX per layer
let imgIdle;
let imgRun;
let imgBoost;
let imgBird;
let raindrops = [];
let birds = [];

// ── Game-state variables ─────────────────────
let state = "start";
let startScreen = "title";

let player;
let spikeManager;
let platformManager;
let hud;
let levelManager;

let score = 0;
let levelScore = 0;
let intensity = 0;
let streak = 0;

let boostActive = false;
let boostTimer = 0;

let hearts = 5;
let hitCooldown = 0;

let misses = 0;
let shakeActive = false;
let shakeSuccess = 0;

let levelClearTimer = 0;

let checkpointReached = false;
let checkpointLevel = 0;
let checkpointData = null;

// ── p5 preload ────────────────────────────────
function preload() {
  levelManager = new LevelManager();

  for (let i = 0; i < levelManager.levels.length; i++) {
    allBgLayers[i] = levelManager.levels[i].bgLayers.map((l) =>
      loadImage(l.path),
    );
  }

  imgIdle = loadImage("assets/standing-skin.gif");
  imgRun = loadImage("assets/running-skin.gif");
  imgBoost = loadImage("assets/booster-skin.gif");
  imgBird = loadImage("assets/birdfly.png");
}

// ── p5 setup ─────────────────────────────────
function setup() {
  createCanvas(CANVAS_W, CANVAS_H);
  frameRate(60);

  player = new Player();
  spikeManager = new SpikeManager();
  platformManager = new PlatformManager();
  hud = new HUD();

  resetGame();
}

// ── Full game reset (back to level 1) ────────
function resetGame() {
  levelManager.reset();

  player.reset();
  spikeManager.reset();
  platformManager.reset();

  score = 0;
  levelScore = 0;
  intensity = 0;
  streak = 0;

  boostActive = false;
  boostTimer = 0;

  hearts = 5;
  hitCooldown = 0;

  misses = 0;
  shakeActive = false;
  shakeSuccess = 0;

  layerOffsets = [0, 0, 0, 0, 0];
  raindrops = [];
  birds = [];

  startScreen = "title";

  checkpointReached = false;
  checkpointLevel = 0;
  checkpointData = null;
}

// ── Start a fresh level (keeps score + hearts) ─
function startNextLevel() {
  player.reset();
  spikeManager.reset();
  platformManager.reset();

  levelScore = 0;
  intensity = 0;
  streak = 0;
  boostActive = false;
  boostTimer = 0;
  hitCooldown = 0;
  shakeActive = false;
  shakeSuccess = 0;
  misses = 0;

  layerOffsets = [0, 0, 0, 0, 0];
  raindrops = [];
  birds = [];

  checkpointReached = false;
  checkpointLevel = levelManager.currentIndex;
  checkpointData = null;
}

function getCheckpointGoal() {
  return Math.floor(levelManager.current.dodgeGoal / 2);
}

function saveCheckpoint() {
  checkpointReached = true;
  checkpointLevel = levelManager.currentIndex;

  checkpointData = {
    score: score,
    levelScore: levelScore,
    intensity: intensity,
    streak: streak,
    boostActive: boostActive,
    boostTimer: boostTimer,
    hearts: 5,
    hitCooldown: 0,
    misses: 0,
    shakeActive: false,
    shakeSuccess: 0,
    layerOffsets: [...layerOffsets]
  };
}

function respawnFromCheckpoint() {
  if (!checkpointReached || checkpointLevel !== levelManager.currentIndex || !checkpointData) {
    startNextLevel();
    state = "play";
    return;
  }

  player.reset();
  spikeManager.reset();
  platformManager.reset();

  score = checkpointData.score;
  levelScore = checkpointData.levelScore;
  intensity = checkpointData.intensity;
  streak = checkpointData.streak;
  boostActive = checkpointData.boostActive;
  boostTimer = checkpointData.boostTimer;

  hearts = checkpointData.hearts;
  hitCooldown = checkpointData.hitCooldown;

  misses = checkpointData.misses;
  shakeActive = checkpointData.shakeActive;
  shakeSuccess = checkpointData.shakeSuccess;

  layerOffsets = [...checkpointData.layerOffsets];
  raindrops = [];

  state = "play";
}

// ── Main draw loop ────────────────────────────
function draw() {
  background(245);

  const lvl = levelManager.current;

  // ── Parallax background layers ────────────
  const layers = allBgLayers[levelManager.currentIndex];
  for (let i = 0; i < layers.length; i++) {
    const img = layers[i];
    const layerSpeed = lvl.bgLayers[i].speed;

    if (state === "play") {
      let baseSpeed = map(intensity, 0, MAX_INTENSITY, 0.5, 2);
      if (shakeActive) baseSpeed *= 1.25;
      layerOffsets[i] -= baseSpeed * layerSpeed;
    }

    if (img) {
      let imgW = img.width;
      let x = layerOffsets[i] % imgW;
      if (x > 0) x -= imgW;
      for (let j = 0; j * imgW < width + imgW; j++) {
        image(img, x + j * imgW - 1, 0, imgW + 2, CANVAS_H);
      }
    }
  }

  // ── Per-level bg tint ─────────────────────
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

  // Ground line
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
      text("Between Floor", width / 2, height / 2 - 50);

      textStyle(NORMAL);
      fill(255);
      textSize(18);
      text("LEVELS", width / 2, height / 2 + 10);
      textSize(14);
      text("1. Fractured Skylines", width / 2, height / 2 + 34);
      text("2. Sky", width / 2, height / 2 + 54);
      text("3. Cave", width / 2, height / 2 + 74);

      stroke(255, 255, 255, 80);
      line(width / 2 - 120, height / 2 + 90, width / 2 + 120, height / 2 + 90);
      noStroke();

      fill(255);
      textSize(16);
      text("ENTER — Start Game", width / 2, height / 2 + 118);

      fill(180);
      textSize(13);
      text("I — Instructions", width / 2, height / 2 + 138);
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
        width / 2,
        100,
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
        width / 2,
        186,
      );

      fill(255);
      text("Clear 5 spikes in a row to activate a JUMP BOOST!", width / 2, 204);
      text(
        "If you hit a spike you enter SHAKE MODE! Clear 5 spikes to recover.",
        width / 2,
        222,
      );
      text(
        "You have 5 hearts. Hit a spike and lose 1 heart. Reach 0 and it's game over.",
        width / 2,
        240,
      );

      fill(180);
      textSize(12);
      text("B — Back to Title     |     ENTER — Start Game", width / 2, 270);
    }

    return;
  }

  // ══════════════════════════════════════════
  //  LEVEL INTRO SCREEN
  // ══════════════════════════════════════════
  if (state === "levelintro") {
    platformManager.draw();
    player.draw(false, imgIdle);

    fill(0, 0, 0, 200);
    rect(0, 0, width, height);

    textAlign(CENTER);
    fill(255, 220, 50);
    textSize(44);
    textStyle(BOLD);
    text(
      "Level " + (levelManager.currentIndex + 1),
      width / 2,
      height / 2 - 40,
    );

    textSize(28);
    text(
      levelManager.current.name.replace(/^Level \d+\s*—\s*/, ""),
      width / 2,
      height / 2,
    );

    textStyle(NORMAL);
    fill(255);
    textSize(14);
    text(levelManager.current.message, width / 2, height / 2 + 30);

    fill(180);
    textSize(13);
    text("ENTER — Begin Level", width / 2, height / 2 + 70);

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
      width / 2,
      height / 2 + 35,
    );

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
    text(
      "Total score: " + score + " spikes dodged",
      width / 2,
      height / 2 + 10,
    );

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

    let gameSpeed =
      lvl.baseSpeed + map(intensity, 0, MAX_INTENSITY, 0, lvl.maxSpeedBonus);
    if (shakeActive) gameSpeed *= 1.25;

    player.update(intensity, MAX_INTENSITY, platformManager.platforms);
    spikeManager.update(gameSpeed, intensity, MAX_INTENSITY, lvl);
    platformManager.update(gameSpeed);

    checkNearMiss();
    checkScore();
    checkCollision();

    // ── Birds (level 2 only) ──────────────
    if (levelManager.currentIndex === 1) {
      if (frameCount % floor(random(180, 300)) === 0) {
        spawnBird();
      }
      updateAndDrawBirds();
    }

    if (levelScore >= lvl.dodgeGoal) {
      state = "levelclear";
      levelClearTimer = 180;
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
      "Score: " + score + "   |   Press R to Retry Level",
      width / 2,
      height / 2 + 22,
    );
  }
}

// ── Advance to next level or trigger win ─────
function advanceLevel() {
  const advanced = levelManager.advance();
  if (advanced) {
    startNextLevel();
    state = "levelintro";
  } else {
    state = "win";
  }
}

// ── Bird spawning ─────────────────────────────
function spawnBird() {
  birds.push({
    x: width + 50,
    y: random(40, 160),
    speed: random(2, 4),
    frame: 0,
    frameTimer: 0,
    frameRate: 6,
  });
}

// ── Bird update + draw ────────────────────────
function updateAndDrawBirds() {
  for (let b of birds) {
    b.frameTimer++;
    if (b.frameTimer >= b.frameRate) {
      b.frame = (b.frame + 1) % 6;
      b.frameTimer = 0;
    }

    b.x -= b.speed;

    let sx = b.frame * 32;
    image(imgBird, b.x, b.y, 32, 32, sx, 0, 32, 32);

    const overlapX = player.x + player.w > b.x + 4 && player.x < b.x + 28;
    const overlapY = player.y + player.h > b.y + 4 && player.y < b.y + 28;

    if (overlapX && overlapY && hitCooldown <= 0) {
      hearts = max(0, hearts - 1);
      hitCooldown = 60;
      if (hearts <= 0) state = "lose";
    }
  }

  birds = birds.filter((b) => b.x > -50);
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
          if (checkpointReached && checkpointLevel === levelManager.currentIndex) {
            respawnFromCheckpoint();
          } else {
            state = "lose";
          }
          return;
        }
      } else {
        shakeActive = true;
        shakeSuccess = 0;
        boostActive = false;
        boostTimer = 0;
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

      if (!checkpointReached && levelScore >= getCheckpointGoal()) {
        saveCheckpoint();
      }

      if (shakeActive) {
        shakeSuccess++;
        if (shakeSuccess >= 5) {
          shakeActive = false;
          shakeSuccess = 0;
          misses = 0;
        }
      }

      if (!shakeActive && !boostActive) {
        streak++;
        if (streak >= 5) {
          boostActive = true;
          boostTimer = BOOST_DURATION;
          streak = 0;
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
      state = "levelintro";
    }
    if (key === "i" || key === "I") startScreen = "instructions";
    if ((key === "b" || key === "B") && startScreen === "instructions") {
      startScreen = "title";
    }
  }

  if (state === "levelintro" && keyCode === ENTER) {
    state = "play";
  }

  if (state === "levelclear" && keyCode === ENTER) {
    advanceLevel();
  }

  if (state === "play" && key === " ") {
    player.jump(boostActive);
  }

  if (
    (state === "lose" ||
      state === "play" ||
      state === "win" ||
      state === "levelclear") &&
    (key === "r" || key === "R")
  ) {
    if (state === "win") {
      resetGame();
      state = "play";
    } else {
      startNextLevel();
      state = "play";
    }
  }
}
