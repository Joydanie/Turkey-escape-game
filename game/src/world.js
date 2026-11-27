// Gobble Run's world: the turkey, the farmer chasing it, the obstacles and
// pickups that scroll past, and the rules that decide caught or escaped.
// The turkey's screen x is fixed; the world scrolls left under it. Distance
// grows with the scroll, and reaching ESCAPE_DISTANCE wins.

import {
  FIELD, STEP, TURKEY, LIVES, FARMER, SPEED, SPAWN, SCORE, ESCAPE_DISTANCE,
  KIND_FENCE, KIND_HAY, KIND_OVEN, KIND_BRANCH, KIND_KNIFE, KIND_CORN, KIND_FEATHER,
} from './config.js';

export const EVENT_HIT = 1;
export const EVENT_OVER = 2;
export const EVENT_PICKUP = 4;
export const EVENT_ESCAPE = 8;

/** Ground obstacle shapes: width, height above the ground, and the way past.
 *  Kept low and narrow enough that the turkey's jump (a floaty 0.9 s arc)
 *  clears them with room to spare at any scroll speed. */
const GROUND_SHAPES = {
  [KIND_FENCE]: { width: 60, height: 48 },
  [KIND_HAY]: { width: 72, height: 56 },
  [KIND_OVEN]: { width: 80, height: 64 },
};
const BRANCH = { width: 130, height: 26, bottom: 52 };
const KNIFE_SHAPE = { width: 48, height: 14 };

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function createWorld(random) {
  const state = {
    time: 0,
    distance: 0,
    score: 0,
    /** Bonus points from corn and feathers, kept apart so the HUD adds up. */
    cornScore: 0,
    lives: LIVES,
    speed: SPEED.start,
    scroll: 0,
    gap: FARMER.startGap,
    turkey: { y: FIELD.groundY - TURKEY.height, vy: 0, onGround: true, ducking: false, invuln: 0, runPhase: 0 },
    obstacles: [],
    knives: [],
    pickups: [],
    spawnTimer: 0.9,
    knifeTimer: 2.2,
    cornTimer: 1.2,
    featherTimer: 9,
    over: null,
    shake: 0,
    flash: 0,
    best: 0,
  };

  function progress() {
    return Math.min(1, state.distance / ESCAPE_DISTANCE);
  }

  function currentSpeed(trim) {
    const base = lerp(SPEED.start, SPEED.end, progress());
    return base * (1 + trim * SPEED.trim);
  }

  function turkeyRect() {
    const t = state.turkey;
    const height = t.ducking ? TURKEY.duckHeight : TURKEY.height;
    return { x: TURKEY.x, y: t.y + (TURKEY.height - height), width: TURKEY.width, height };
  }

  function obstacleRect(ob) {
    if (ob.kind === KIND_BRANCH) {
      return { x: ob.x, y: FIELD.groundY - BRANCH.bottom - BRANCH.height, width: BRANCH.width, height: BRANCH.height };
    }
    const shape = GROUND_SHAPES[ob.kind];
    return { x: ob.x, y: FIELD.groundY - shape.height, width: shape.width, height: shape.height };
  }

  function overlaps(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }

  function lastObstacleX() {
    let x = -Infinity;
    for (const ob of state.obstacles) if (ob.x > x) x = ob.x;
    return x;
  }

  function spawnGroundObstacle() {
    // Keep a fair gap after the last obstacle so two never stack unfairly.
    if (lastObstacleX() > FIELD.width - state.speed * SPAWN.minGapSeconds) return;
    const roll = random();
    const kind = roll < 0.3 ? KIND_FENCE : roll < 0.58 ? KIND_HAY : roll < 0.8 ? KIND_OVEN : KIND_BRANCH;
    const shape = kind === KIND_BRANCH ? BRANCH : GROUND_SHAPES[kind];
    state.obstacles.push({ kind, x: FIELD.width + 40, width: shape.width, active: true });
  }

  function spawnKnife() {
    if (state.gap > FARMER.throwReach) return;
    const farmerX = TURKEY.x - state.gap - FARMER.width;
    state.knives.push({
      x: farmerX + FARMER.width - 10,
      y: FIELD.groundY - 44,
      vx: 430,
      spin: random() * Math.PI * 2,
      active: true,
    });
  }

  function spawnPickup(kind) {
    const y = kind === KIND_CORN
      ? FIELD.groundY - 46 - random() * 90
      : FIELD.groundY - 130 - random() * 60;
    state.pickups.push({ kind, x: FIELD.width + 40, y, taken: false, active: true, bob: random() * Math.PI * 2 });
  }

  function hit() {
    if (state.turkey.invuln > 0 || state.over) return 0;
    state.lives -= 1;
    state.turkey.invuln = TURKEY.invulnerable;
    state.gap = Math.max(0, state.gap - FARMER.hitShrink);
    state.shake = 0.35;
    state.flash = 0.25;
    if (state.lives <= 0 || state.gap <= 0) {
      state.over = 'caught';
      return EVENT_HIT | EVENT_OVER;
    }
    return EVENT_HIT;
  }

  function reset() {
    state.time = 0;
    state.distance = 0;
    state.score = 0;
    state.cornScore = 0;
    state.lives = LIVES;
    state.speed = SPEED.start;
    state.scroll = 0;
    state.gap = FARMER.startGap;
    state.turkey.y = FIELD.groundY - TURKEY.height;
    state.turkey.vy = 0;
    state.turkey.onGround = true;
    state.turkey.ducking = false;
    state.turkey.invuln = 0;
    state.turkey.runPhase = 0;
    state.obstacles = [];
    state.knives = [];
    state.pickups = [];
    state.spawnTimer = 0.9;
    state.knifeTimer = 2.2;
    state.cornTimer = 1.2;
    state.featherTimer = 9;
    state.over = null;
    state.shake = 0;
    state.flash = 0;
  }

  /**
   * Advance the world one fixed step.
   * controls: { jump (one-shot), duck (held), trim (-1, 0, 1) }.
   * demo: when true, the farmyard scrolls with the turkey running and nothing
   * can hurt it (the title screen's backdrop).
   * Returns EVENT_* flags.
   */
  function step(dt, controls, demo) {
    let events = 0;
    state.time += dt;
    state.speed = currentSpeed(demo ? 0 : controls.trim);
    const speed = state.speed;
    state.scroll += speed * dt;

    const t = state.turkey;
    t.runPhase += dt * (4 + progress() * 5);
    if (t.invuln > 0) t.invuln -= dt;
    if (state.shake > 0) state.shake -= dt;
    if (state.flash > 0) state.flash -= dt;

    // The turkey's vertical motion: jump, gravity, land. Ducking only counts
    // on the ground; it also makes the bird a smaller target.
    t.ducking = !demo && controls.duck && t.onGround;
    if (!demo && controls.jump && t.onGround && !t.ducking) {
      t.vy = TURKEY.jumpVelocity;
      t.onGround = false;
    }
    if (!t.onGround) {
      t.vy += TURKEY.gravity * dt;
      t.y += t.vy * dt;
      if (t.y >= FIELD.groundY - TURKEY.height) {
        t.y = FIELD.groundY - TURKEY.height;
        t.vy = 0;
        t.onGround = true;
      }
    }

    if (demo) {
      // Title backdrop: a gentle scroll, the farmer far behind, no hazards.
      state.gap = FARMER.maxGap;
      return 0;
    }

    state.distance += (speed * dt) / 50;
    state.score = Math.floor(state.distance) + state.cornScore;
    // Clean running pulls the turkey away from the farmer, up to the cap.
    state.gap = Math.min(FARMER.maxGap, state.gap + FARMER.recoverPerSecond * dt);

    // Spawning.
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      spawnGroundObstacle();
      state.spawnTimer = lerp(SPAWN.intervalStart, SPAWN.intervalEnd, progress()) * (0.85 + random() * 0.3);
    }
    state.knifeTimer -= dt;
    if (state.knifeTimer <= 0) {
      spawnKnife();
      state.knifeTimer = lerp(SPAWN.knifeIntervalStart, SPAWN.knifeIntervalEnd, progress()) * (0.9 + random() * 0.25);
    }
    state.cornTimer -= dt;
    if (state.cornTimer <= 0) {
      spawnPickup(KIND_CORN);
      state.cornTimer = SPAWN.cornInterval * (0.7 + random() * 0.6);
    }
    state.featherTimer -= dt;
    if (state.featherTimer <= 0) {
      spawnPickup(KIND_FEATHER);
      state.featherTimer = SPAWN.featherInterval * (0.8 + random() * 0.4);
    }

    // Move everything left with the world; knives fly right, past the turkey.
    for (const ob of state.obstacles) ob.x -= speed * dt;
    for (const p of state.pickups) p.x -= speed * dt;
    for (const k of state.knives) {
      k.x += k.vx * dt;
      k.spin += dt * 9;
    }
    state.obstacles = state.obstacles.filter((ob) => ob.x + ob.width > -120);
    state.pickups = state.pickups.filter((p) => p.x > -60 && !p.taken);
    state.knives = state.knives.filter((k) => k.x < FIELD.width + 120 && k.x > -120);

    // Collisions with ground obstacles and knives.
    const rect = turkeyRect();
    for (const ob of state.obstacles) {
      if (!ob.active || !overlaps(rect, obstacleRect(ob))) continue;
      ob.active = false;
      events |= hit();
      if (state.over) return events;
    }
    for (const k of state.knives) {
      if (!k.active) continue;
      const knifeRect = { x: k.x, y: k.y - KNIFE_SHAPE.height / 2, width: KNIFE_SHAPE.width, height: KNIFE_SHAPE.height };
      if (overlaps(rect, knifeRect)) {
        k.active = false;
        events |= hit();
        if (state.over) return events;
      }
    }

    // Pickups: corn adds score and pulls away from the farmer; a feather is
    // an extra life (up to the cap) or a score bonus at full lives.
    for (const p of state.pickups) {
      if (p.taken) continue;
      const pr = { x: p.x - 16, y: p.y - 16, width: 32, height: 32 };
      if (!overlaps(rect, pr)) continue;
      p.taken = true;
      if (p.kind === KIND_CORN) {
        state.cornScore += SCORE.corn;
        state.gap = Math.min(FARMER.maxGap, state.gap + FARMER.cornGrow);
      } else if (state.lives < LIVES) {
        state.lives += 1;
      } else {
        state.cornScore += SCORE.feather;
      }
      events |= EVENT_PICKUP;
    }

    // The farmer catches the turkey if the gap closes entirely.
    if (state.gap <= 0 && !state.over) {
      state.over = 'caught';
      events |= EVENT_OVER;
      return events;
    }
    // Reaching the forest wins the run.
    if (state.distance >= ESCAPE_DISTANCE && !state.over) {
      state.over = 'escaped';
      events |= EVENT_ESCAPE | EVENT_OVER;
      return events;
    }
    return events;
  }

  return {
    state,
    reset,
    step,
    progress,
    farmerX() {
      return TURKEY.x - state.gap - FARMER.width;
    },
  };
}
