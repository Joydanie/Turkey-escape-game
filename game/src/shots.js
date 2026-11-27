// The screenshot scenes behind ?shot=start|play|end|escaped. Each one plays the
// real rules forward from a fresh world for a fixed time, steered by a simple
// autopilot (jump the fences, hay, oven and knives in time; duck the low
// branches), so the frame is what a real run looks like and the same seed
// always gives the same frame. The end scene's pilot reacts far too late, so
// it is caught, as a hurried player is.

import { FIELD, STEP, TURKEY, ESCAPE_DISTANCE, KIND_BRANCH } from './config.js';
import { EVENT_OVER } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const START_SECONDS = 6;
const PLAY_SECONDS = 24;
const END_LIMIT_SECONDS = 300;

/**
 * How far ahead, in seconds of travel, the pilot reacts to an obstacle. The
 * good pilot jumps while the obstacle is still 0.25 s away, which puts the
 * turkey at the top of its floaty jump as the obstacle passes under it, at
 * any scroll speed; the bad pilot waits until 0.06 s, far too late.
 */
const REACTION_GOOD = 0.25;
const REACTION_BAD = 0.06;

function nearestObstacle(state) {
  let nearest = null;
  let nearestDist = Infinity;
  for (const ob of state.obstacles) {
    if (!ob.active) continue;
    const dist = ob.x - (TURKEY.x + TURKEY.width);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = ob;
    }
  }
  return { nearest, nearestDist };
}

function nearestKnife(state) {
  let knife = null;
  let knifeDist = Infinity;
  for (const k of state.knives) {
    if (!k.active) continue;
    const dist = TURKEY.x - (k.x + 48);
    if (dist < 0 || dist > 420) continue;
    if (dist < knifeDist) {
      knifeDist = dist;
      knife = k;
    }
  }
  return { knife, knifeDist };
}

/** The pilot's controls for one step: jump (one-shot), duck (held), trim.
 *  `reaction` is in seconds of travel: the pilot acts once an obstacle is
 *  that close, so the timing holds at any scroll speed. */
function autopilot(state, reaction, duckBranches) {
  const reach = state.speed * reaction;
  const { nearest, nearestDist } = nearestObstacle(state);
  const { knife, knifeDist } = nearestKnife(state);
  let jump = false;
  let duck = false;
  // An obstacle counts until its right edge is past the turkey's left edge.
  const stillThere = nearest && nearestDist > -(TURKEY.width + nearest.width);
  if (stillThere && nearestDist < reach) {
    if (nearest.kind === KIND_BRANCH) {
      // Duck while the branch is over the turkey, not just while it approaches.
      if (duckBranches && nearest.x + nearest.width > TURKEY.x - 10) duck = true;
    } else if (state.turkey.onGround) {
      jump = true;
    }
  }
  if (knife && knifeDist < reach * 0.8 && state.turkey.onGround) {
    jump = true;
  }
  return { jump, duck, trim: 0 };
}

/**
 * Set `world` to the named scene (start, play, end or escaped; any other name
 * is start) and return the screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'end' && name !== 'escaped') {
    for (let i = 0; i < START_SECONDS / STEP; i += 1) {
      world.step(STEP, { jump: false, duck: false, trim: 0 }, true);
    }
    return { screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'escaped') {
    // Start just short of the forest and let a good pilot finish the run.
    world.state.distance = ESCAPE_DISTANCE - 18;
    world.state.gap = 300;
    for (let i = 0; i < 30 / STEP; i += 1) {
      const events = world.step(STEP, autopilot(world.state, REACTION_GOOD, true), false);
      if (events & EVENT_OVER) break;
    }
    return { screen: SCREEN_OVER, best: world.state.score };
  }
  const limit = name === 'end' ? END_LIMIT_SECONDS : PLAY_SECONDS;
  const reaction = name === 'end' ? REACTION_BAD : REACTION_GOOD;
  const duckBranches = name !== 'end';
  for (let i = 0; i < limit / STEP; i += 1) {
    const events = world.step(STEP, autopilot(world.state, reaction, duckBranches), false);
    if (events & EVENT_OVER) break;
  }
  const over = world.state.over !== null;
  return { screen: over ? SCREEN_OVER : SCREEN_PLAY, best: world.state.score };
}
