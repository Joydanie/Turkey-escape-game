// Gobble Run — every tuning number and colour in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to the
// window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720, groundY: 620 };

/** The simulation's fixed step, in seconds: 60 updates a second. */
export const STEP = 1 / 60;

/** Distance, in metres, the turkey must cover to reach the forest and escape. */
export const ESCAPE_DISTANCE = 1500;

export const TURKEY = {
  /** Screen x of the turkey; the world scrolls past it. */
  x: 300,
  width: 64,
  height: 58,
  duckHeight: 30,
  jumpVelocity: -900,
  gravity: 1800,
  /** Seconds of mercy after a hit, during which nothing else can hurt it. */
  invulnerable: 1.6,
};

export const LIVES = 3;

/** The farmer's gap behind the turkey, in pixels. A hit shrinks it; clean running
 *  grows it back. At zero he grabs the turkey. */
export const FARMER = {
  width: 64,
  height: 92,
  startGap: 280,
  maxGap: 330,
  hitShrink: 55,
  cornGrow: 8,
  recoverPerSecond: 5,
  /** He only throws a knife while this close (on screen). */
  throwReach: 260,
};

export const SPEED = {
  /** World scroll speed, px/s, at the start and at the escape. */
  start: 330,
  end: 640,
  /** Left/Right keys trim the run speed by this fraction. */
  trim: 0.16,
};

/** Obstacle kinds. Jump clears fence, hay, oven and knife; duck clears branch. */
export const KIND_FENCE = 'fence';
export const KIND_HAY = 'hay';
export const KIND_OVEN = 'oven';
export const KIND_BRANCH = 'branch';
export const KIND_KNIFE = 'knife';
export const KIND_CORN = 'corn';
export const KIND_FEATHER = 'feather';

export const SPAWN = {
  /** Seconds between ground obstacles, shrinking as the run goes on. Kept
   *  above the jump's air time so the turkey can land and jump again. */
  intervalStart: 2.0,
  intervalEnd: 1.3,
  /** The smallest gap, in seconds of travel, between two obstacles. */
  minGapSeconds: 1.2,
  /** Seconds between the farmer's knife throws, shrinking with distance. */
  knifeIntervalStart: 3.0,
  knifeIntervalEnd: 2.0,
  /** Corn appears this often, on average, in seconds. */
  cornInterval: 1.5,
  /** A feather (extra life) appears this often, on average, in seconds. */
  featherInterval: 14,
};

export const SCORE = { corn: 10, feather: 25 };

export const PALETTE = {
  skyTop: '#ff8c42',
  skyMid: '#ffb347',
  skyBottom: '#ffd166',
  sun: '#fff3b0',
  sunGlow: 'rgba(255, 243, 176, 0.45)',
  cloud: 'rgba(255, 248, 235, 0.85)',
  hillFar: '#c97b4a',
  hillNear: '#a35d33',
  treeDark: '#3f6b34',
  treeMid: '#4c7a3a',
  treeLight: '#5d8a44',
  barn: '#b3392e',
  barnRoof: '#7d2a20',
  barnTrim: '#f5ead6',
  ground: '#8a5a2b',
  groundDark: '#6e451f',
  grass: '#7a9b3f',
  path: '#c9a06a',
  fenceWood: '#6b4423',
  fenceWoodLight: '#8a5a2b',
  turkeyBody: '#8a5230',
  turkeyBelly: '#a06a3f',
  turkeyTail: ['#d2691e', '#e8a33c', '#c0392b', '#e67e22', '#f1c40f'],
  turkeyHead: '#d9a066',
  turkeyBeak: '#e67e22',
  turkeyWattle: '#e5534b',
  turkeyLeg: '#e67e22',
  farmerShirt: '#c0392b',
  farmerOveralls: '#2e5fa3',
  farmerSkin: '#e8b88a',
  farmerHat: '#e8c85a',
  farmerHatBand: '#7a4a26',
  farmerBoot: '#5d3a1a',
  ovenBody: '#4a4a52',
  ovenDoor: '#2b2b31',
  ovenFire: '#ff7b1c',
  ovenFireCore: '#ffd166',
  ovenGlow: 'rgba(255, 123, 28, 0.35)',
  hay: '#e8c85a',
  hayDark: '#c9a227',
  knifeBlade: '#dfe3e8',
  knifeEdge: '#aab2bd',
  knifeHandle: '#7a4a26',
  corn: '#f2c94c',
  cornHusk: '#5d8a44',
  featherWhite: '#f5f0e6',
  featherGrey: '#c9c2b4',
  panel: 'rgba(43, 24, 8, 0.82)',
  panelEdge: '#e8a33c',
  text: '#fff8ec',
  textDark: '#3a2410',
  muted: '#f2c94c',
  danger: '#ff5a3c',
  heart: '#ff5a3c',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'gobble-run.best';
