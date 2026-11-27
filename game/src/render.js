// Gobble Run's renderer: every picture is drawn from canvas shapes — the
// autumn farmyard, the turkey, the farmer, the oven, the knives — no images,
// no network. The playfield is a fixed 1280x720 logical area, scaled to the
// canvas, so the game looks the same at any window size.

import {
  FIELD, TURKEY, FARMER, PALETTE, FONT, ESCAPE_DISTANCE,
  KIND_FENCE, KIND_HAY, KIND_OVEN, KIND_BRANCH, KIND_KNIFE, KIND_CORN, KIND_FEATHER,
} from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

/** A stable pseudo-random in [0, 1) for a world column, so scenery does not jump. */
function columnRandom(index) {
  const x = Math.sin(index * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.clientWidth || FIELD.width;
    const h = canvas.clientHeight || FIELD.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform((canvas.width / FIELD.width), 0, 0, (canvas.height / FIELD.height), 0, 0);
  }

  function drawSky(state) {
    const g = ctx.createLinearGradient(0, 0, 0, FIELD.groundY);
    g.addColorStop(0, PALETTE.skyTop);
    g.addColorStop(0.55, PALETTE.skyMid);
    g.addColorStop(1, PALETTE.skyBottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, FIELD.width, FIELD.groundY + 2);
    // Low sun, glowing.
    ctx.fillStyle = PALETTE.sunGlow;
    ctx.beginPath();
    ctx.arc(1050, 150, 110, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.sun;
    ctx.beginPath();
    ctx.arc(1050, 150, 62, 0, Math.PI * 2);
    ctx.fill();
    // Drifting clouds.
    ctx.fillStyle = PALETTE.cloud;
    for (let i = 0; i < 5; i += 1) {
      const cx = (((i * 340 + 120 - state.scroll * 0.06) % 1500) + 1500) % 1500 - 110;
      const cy = 70 + (i % 3) * 46;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 74, 20, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 52, cy + 6, 52, 15, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawHills(state) {
    // Far hills.
    ctx.fillStyle = PALETTE.hillFar;
    ctx.beginPath();
    ctx.moveTo(0, FIELD.groundY);
    for (let x = 0; x <= FIELD.width; x += 40) {
      const wx = x + state.scroll * 0.12;
      ctx.lineTo(x, FIELD.groundY - 118 - Math.sin(wx * 0.004) * 46 - Math.sin(wx * 0.0013) * 30);
    }
    ctx.lineTo(FIELD.width, FIELD.groundY);
    ctx.closePath();
    ctx.fill();
    // Near hills with trees.
    ctx.fillStyle = PALETTE.hillNear;
    ctx.beginPath();
    ctx.moveTo(0, FIELD.groundY);
    for (let x = 0; x <= FIELD.width; x += 40) {
      const wx = x + state.scroll * 0.3;
      ctx.lineTo(x, FIELD.groundY - 52 - Math.sin(wx * 0.006 + 2) * 26);
    }
    ctx.lineTo(FIELD.width, FIELD.groundY);
    ctx.closePath();
    ctx.fill();
    // Trees on the near hill, spaced by world column.
    const spacing = 190;
    const start = Math.floor((state.scroll * 0.3) / spacing) - 1;
    for (let i = start; i < start + 10; i += 1) {
      const sx = i * spacing - state.scroll * 0.3 + columnRandom(i) * 70;
      if (sx < -60 || sx > FIELD.width + 60) continue;
      const sy = FIELD.groundY - 52 - Math.sin((sx + state.scroll * 0.3) * 0.006 + 2) * 26;
      const size = 34 + columnRandom(i + 50) * 30;
      drawTree(sx, sy, size, i % 3 === 0 ? PALETTE.treeDark : PALETTE.treeMid);
    }
    // The red barn, passing every so often.
    const barnSpacing = 2600;
    const barnIndex = Math.floor(state.scroll / barnSpacing);
    for (let b = barnIndex - 1; b <= barnIndex + 1; b += 1) {
      const bx = b * barnSpacing - state.scroll * 0.55 + 500;
      if (bx < -260 || bx > FIELD.width + 60) continue;
      drawBarn(bx, FIELD.groundY - 96, 210, 96);
    }
  }

  function drawTree(x, baseY, size, colour) {
    ctx.fillStyle = '#5d3a1a';
    ctx.fillRect(x - 4, baseY - size * 0.35, 8, size * 0.35);
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.moveTo(x, baseY - size);
    ctx.lineTo(x - size * 0.45, baseY - size * 0.3);
    ctx.lineTo(x + size * 0.45, baseY - size * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, baseY - size * 0.8);
    ctx.lineTo(x - size * 0.36, baseY - size * 0.18);
    ctx.lineTo(x + size * 0.36, baseY - size * 0.18);
    ctx.closePath();
    ctx.fill();
  }

  function drawBarn(x, y, w, h) {
    ctx.fillStyle = PALETTE.barn;
    ctx.fillRect(x, y + h * 0.28, w, h * 0.72);
    ctx.fillStyle = PALETTE.barnRoof;
    ctx.beginPath();
    ctx.moveTo(x - 8, y + h * 0.32);
    ctx.lineTo(x + w / 2, y);
    ctx.lineTo(x + w + 8, y + h * 0.32);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = PALETTE.barnTrim;
    ctx.lineWidth = 4;
    ctx.strokeRect(x + w * 0.38, y + h * 0.45, w * 0.24, h * 0.55);
    ctx.beginPath();
    ctx.moveTo(x + w * 0.5, y + h * 0.45);
    ctx.lineTo(x + w * 0.5, y + h);
    ctx.moveTo(x + w * 0.38, y + h * 0.72);
    ctx.lineTo(x + w * 0.62, y + h * 0.72);
    ctx.stroke();
    ctx.fillStyle = PALETTE.barnTrim;
    ctx.fillRect(x + w * 0.1, y + h * 0.42, w * 0.14, w * 0.14);
    ctx.fillRect(x + w * 0.76, y + h * 0.42, w * 0.14, w * 0.14);
  }

  function drawGround(state) {
    ctx.fillStyle = PALETTE.ground;
    ctx.fillRect(0, FIELD.groundY, FIELD.width, FIELD.height - FIELD.groundY);
    ctx.fillStyle = PALETTE.groundDark;
    ctx.fillRect(0, FIELD.groundY, FIELD.width, 6);
    // A worn dirt path.
    ctx.fillStyle = PALETTE.path;
    ctx.fillRect(0, FIELD.groundY + 34, FIELD.width, 30);
    // Grass tufts and pebbles scrolling with the ground.
    const spacing = 90;
    const start = Math.floor(state.scroll / spacing) - 1;
    for (let i = start; i < start + 17; i += 1) {
      const sx = i * spacing - state.scroll + columnRandom(i) * 50;
      if (sx < -20 || sx > FIELD.width + 20) continue;
      ctx.strokeStyle = PALETTE.grass;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sx, FIELD.groundY + 12);
      ctx.lineTo(sx - 5, FIELD.groundY + 2);
      ctx.moveTo(sx + 4, FIELD.groundY + 12);
      ctx.lineTo(sx + 9, FIELD.groundY + 3);
      ctx.stroke();
      if (i % 4 === 0) {
        ctx.fillStyle = PALETTE.groundDark;
        ctx.beginPath();
        ctx.ellipse(sx + 20, FIELD.groundY + 52, 8, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Fence posts along the back of the field.
    ctx.fillStyle = PALETTE.fenceWood;
    const fenceSpacing = 130;
    const fstart = Math.floor(state.scroll / fenceSpacing) - 1;
    for (let i = fstart; i < fstart + 12; i += 1) {
      const sx = i * fenceSpacing - state.scroll;
      if (sx < -20 || sx > FIELD.width + 20) continue;
      ctx.fillRect(sx, FIELD.groundY - 44, 8, 44);
    }
    ctx.fillStyle = PALETTE.fenceWoodLight;
    ctx.fillRect(0, FIELD.groundY - 40, FIELD.width, 6);
    ctx.fillRect(0, FIELD.groundY - 24, FIELD.width, 6);
  }

  function drawTurkey(state, x, y, opts = {}) {
    const t = state.turkey;
    const ducking = opts.ducking ?? t.ducking;
    const invuln = t.invuln > 0 && Math.floor(state.time * 12) % 2 === 0;
    if (invuln && !opts.noFlash) return; // blink while invulnerable
    const phase = t.runPhase;
    const legSwing = t.onGround ? Math.sin(phase * 2.4) * 10 : 6;
    const bodyH = ducking ? TURKEY.duckHeight : TURKEY.height;
    const top = y + (TURKEY.height - bodyH);
    ctx.save();
    ctx.translate(x, top);
    // Tail fan.
    for (let i = 0; i < 5; i += 1) {
      const angle = -0.9 + i * 0.45;
      ctx.save();
      ctx.translate(16, bodyH * 0.55);
      ctx.rotate(angle);
      ctx.fillStyle = PALETTE.turkeyTail[i];
      ctx.beginPath();
      ctx.ellipse(-16, 0, 26, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // Body.
    ctx.fillStyle = PALETTE.turkeyBody;
    ctx.beginPath();
    ctx.ellipse(30, bodyH * 0.58, 30, bodyH * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.turkeyBelly;
    ctx.beginPath();
    ctx.ellipse(38, bodyH * 0.68, 18, bodyH * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();
    // Wing.
    ctx.fillStyle = '#6e3f22';
    ctx.beginPath();
    ctx.ellipse(30, bodyH * 0.55, 16, 9, -0.3, 0, Math.PI * 2);
    ctx.fill();
    // Head, beak, wattle, eye.
    const headY = ducking ? bodyH * 0.32 : 4;
    ctx.fillStyle = PALETTE.turkeyHead;
    ctx.beginPath();
    ctx.arc(56, headY + 8, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.turkeyBeak;
    ctx.beginPath();
    ctx.moveTo(65, headY + 6);
    ctx.lineTo(76, headY + 10);
    ctx.lineTo(65, headY + 13);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.turkeyWattle;
    ctx.beginPath();
    ctx.ellipse(60, headY + 17, 4, 7, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1d1d1d';
    ctx.beginPath();
    ctx.arc(59, headY + 5, 2.4, 0, Math.PI * 2);
    ctx.fill();
    // Legs.
    ctx.strokeStyle = PALETTE.turkeyLeg;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(24, bodyH - 4);
    ctx.lineTo(24 + legSwing, bodyH + 8);
    ctx.moveTo(38, bodyH - 4);
    ctx.lineTo(38 - legSwing, bodyH + 8);
    ctx.stroke();
    ctx.restore();
  }

  function drawFarmer(state, x) {
    const phase = state.turkey.runPhase * 1.05;
    const legSwing = Math.sin(phase * 2.4) * 12;
    const bob = Math.abs(Math.sin(phase * 2.4)) * 3;
    const y = FIELD.groundY - FARMER.height - bob;
    ctx.save();
    ctx.translate(x, y);
    // Legs (overalls).
    ctx.strokeStyle = PALETTE.farmerOveralls;
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(26, 52);
    ctx.lineTo(26 + legSwing, 88);
    ctx.moveTo(40, 52);
    ctx.lineTo(40 - legSwing, 88);
    ctx.stroke();
    // Boots.
    ctx.fillStyle = PALETTE.farmerBoot;
    ctx.fillRect(18 + legSwing, 84, 16, 8);
    ctx.fillRect(32 - legSwing, 84, 16, 8);
    // Shirt + overalls body.
    ctx.fillStyle = PALETTE.farmerShirt;
    roundRect(ctx, 12, 22, 44, 34, 8);
    ctx.fill();
    ctx.fillStyle = PALETTE.farmerOveralls;
    ctx.fillRect(16, 40, 36, 22);
    ctx.fillRect(16, 40, 8, 30);
    ctx.fillRect(44, 40, 8, 30);
    // Arms pumping.
    ctx.strokeStyle = PALETTE.farmerShirt;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(14, 28);
    ctx.lineTo(2, 44 - legSwing * 0.5);
    ctx.moveTo(54, 28);
    ctx.lineTo(66, 44 + legSwing * 0.5);
    ctx.stroke();
    // Head, beard, hat.
    ctx.fillStyle = PALETTE.farmerSkin;
    ctx.beginPath();
    ctx.arc(34, 12, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8e0d0';
    ctx.beginPath();
    ctx.ellipse(34, 20, 9, 6, 0, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = PALETTE.farmerHat;
    ctx.beginPath();
    ctx.ellipse(34, 4, 24, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(22, 4);
    ctx.lineTo(24, -12);
    ctx.lineTo(44, -12);
    ctx.lineTo(46, 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.farmerHatBand;
    ctx.fillRect(23, -2, 22, 4);
    // Moustache.
    ctx.fillStyle = '#e8e0d0';
    ctx.fillRect(28, 14, 12, 3);
    ctx.restore();
  }

  function drawOven(x) {
    const w = 80;
    const h = 64;
    const y = FIELD.groundY - h;
    // Heat glow on the ground.
    ctx.fillStyle = PALETTE.ovenGlow;
    ctx.beginPath();
    ctx.ellipse(x + w / 2, FIELD.groundY + 4, w * 0.75, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    // Body + chimney.
    ctx.fillStyle = PALETTE.ovenBody;
    roundRect(ctx, x, y, w, h, 7);
    ctx.fill();
    ctx.fillRect(x + w - 22, y - 26, 15, 30);
    // Door with a fire window.
    ctx.fillStyle = PALETTE.ovenDoor;
    roundRect(ctx, x + 13, y + 20, w - 26, 34, 5);
    ctx.fill();
    const flicker = 0.75 + Math.sin(Date.now() / 130) * 0.25;
    ctx.fillStyle = PALETTE.ovenFire;
    ctx.globalAlpha = flicker;
    ctx.beginPath();
    ctx.moveTo(x + 20, y + 50);
    ctx.lineTo(x + 30, y + 28);
    ctx.lineTo(x + 38, y + 44);
    ctx.lineTo(x + 46, y + 26);
    ctx.lineTo(x + 58, y + 50);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.ovenFireCore;
    ctx.beginPath();
    ctx.moveTo(x + 30, y + 50);
    ctx.lineTo(x + 38, y + 36);
    ctx.lineTo(x + 46, y + 50);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    // Handle + feet.
    ctx.fillStyle = '#2b2b31';
    ctx.fillRect(x + 24, y + 10, w - 48, 5);
    ctx.fillStyle = '#33333a';
    ctx.fillRect(x + 5, FIELD.groundY - 5, 10, 5);
    ctx.fillRect(x + w - 15, FIELD.groundY - 5, 10, 5);
    // Smoke.
    ctx.fillStyle = 'rgba(220, 220, 220, 0.5)';
    for (let i = 0; i < 3; i += 1) {
      const sy = y - 32 - i * 13 - ((Date.now() / 40 + i * 40) % 40);
      ctx.beginPath();
      ctx.arc(x + w - 14 + Math.sin(i * 2) * 4, sy, 6 + i * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawHay(x) {
    const w = 72;
    const h = 56;
    const y = FIELD.groundY - h;
    ctx.fillStyle = PALETTE.hay;
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.hayDark;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w / 2 - 9, h / 2 - 9, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w / 2 - 18, h / 2 - 17, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, 5, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawFenceObstacle(x) {
    const w = 60;
    const h = 48;
    const y = FIELD.groundY - h;
    ctx.fillStyle = PALETTE.fenceWood;
    ctx.fillRect(x + 4, y, 9, h);
    ctx.fillRect(x + w - 13, y, 9, h);
    ctx.fillStyle = PALETTE.fenceWoodLight;
    ctx.fillRect(x, y + 7, w, 7);
    ctx.fillRect(x, y + 26, w, 7);
    // Pointed tops.
    ctx.fillStyle = PALETTE.fenceWood;
    ctx.beginPath();
    ctx.moveTo(x + 4, y);
    ctx.lineTo(x + 8, y - 9);
    ctx.lineTo(x + 13, y);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + w - 13, y);
    ctx.lineTo(x + w - 9, y - 9);
    ctx.lineTo(x + w - 4, y);
    ctx.closePath();
    ctx.fill();
  }

  function drawBranch(x) {
    const w = 130;
    const top = FIELD.groundY - 78;
    ctx.strokeStyle = '#5d3a1a';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - 8, top + 4);
    ctx.lineTo(x + w + 8, top + 10);
    ctx.stroke();
    ctx.fillStyle = PALETTE.treeMid;
    for (let i = 0; i < 5; i += 1) {
      const lx = x + 12 + i * 24;
      ctx.beginPath();
      ctx.ellipse(lx, top + 16, 16, 9, (i % 2 ? -0.4 : 0.4), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = PALETTE.danger;
    ctx.font = `bold 13px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('DUCK!', x + w / 2, top - 10);
  }

  function drawKnife(k) {
    ctx.save();
    ctx.translate(k.x + 24, k.y);
    ctx.rotate(k.spin % (Math.PI * 2));
    ctx.fillStyle = PALETTE.knifeBlade;
    ctx.beginPath();
    ctx.moveTo(-22, -4);
    ctx.lineTo(14, -6);
    ctx.lineTo(22, 0);
    ctx.lineTo(14, 6);
    ctx.lineTo(-22, 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.knifeEdge;
    ctx.beginPath();
    ctx.moveTo(14, -6);
    ctx.lineTo(22, 0);
    ctx.lineTo(14, 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.knifeHandle;
    roundRect(ctx, -34, -5, 14, 10, 4);
    ctx.fill();
    ctx.restore();
  }

  function drawCorn(p, time) {
    const bob = Math.sin(time * 3 + p.bob) * 4;
    const x = p.x;
    const y = p.y + bob;
    ctx.fillStyle = PALETTE.cornHusk;
    ctx.beginPath();
    ctx.ellipse(x - 12, y + 8, 8, 14, -0.5, 0, Math.PI * 2);
    ctx.ellipse(x + 12, y + 8, 8, 14, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.corn;
    ctx.beginPath();
    ctx.ellipse(x, y, 10, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d9a92f';
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.arc(x + i * 5, y - 8, 2, 0, Math.PI * 2);
      ctx.arc(x + i * 5, y, 2, 0, Math.PI * 2);
      ctx.arc(x + i * 5, y + 8, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawFeather(p, time) {
    const bob = Math.sin(time * 3 + p.bob) * 4;
    const x = p.x;
    const y = p.y + bob;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(time * 1.5 + p.bob) * 0.3);
    ctx.fillStyle = PALETTE.featherWhite;
    ctx.beginPath();
    ctx.ellipse(0, 0, 9, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.featherGrey;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(0, 18);
    ctx.stroke();
    ctx.restore();
  }

  function drawHUD(state, best) {
    ctx.textBaseline = 'alphabetic';
    // Score (left).
    ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 30px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText(`Score ${state.score}`, 28, 52);
    // Distance + progress to the forest (centre).
    const done = Math.min(1, state.distance / ESCAPE_DISTANCE);
    ctx.font = `bold 26px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.floor(state.distance)} m to the forest`, FIELD.width / 2, 46);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    roundRect(ctx, FIELD.width / 2 - 170, 58, 340, 12, 6);
    ctx.fill();
    ctx.fillStyle = PALETTE.treeMid;
    roundRect(ctx, FIELD.width / 2 - 170, 58, 340 * done, 12, 6);
    ctx.fill();
    ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 13px ${FONT}`;
    ctx.fillText('FOREST', FIELD.width / 2 + 196, 70);
    // Lives (right): little hearts.
    ctx.textAlign = 'right';
    ctx.font = `bold 26px ${FONT}`;
    ctx.fillText('Lives', FIELD.width - 130, 48);
    for (let i = 0; i < 3; i += 1) {
      const hx = FIELD.width - 112 + i * 34;
      const hy = 40;
      ctx.fillStyle = i < state.lives ? PALETTE.heart : 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.moveTo(hx, hy + 8);
      ctx.bezierCurveTo(hx - 12, hy - 4, hx - 5, hy - 12, hx, hy - 4);
      ctx.bezierCurveTo(hx + 5, hy - 12, hx + 12, hy - 4, hx, hy + 8);
      ctx.fill();
    }
    // Farmer closing in: a warning under the HUD.
    if (state.gap < 130 && !state.over) {
      const blink = Math.floor(state.time * 4) % 2 === 0;
      if (blink) {
        ctx.fillStyle = PALETTE.danger;
        ctx.font = `bold 24px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.fillText('THE FARMER IS RIGHT BEHIND YOU!', FIELD.width / 2, 112);
      }
    }
    // Best score, small, bottom left.
    ctx.fillStyle = 'rgba(255, 248, 236, 0.8)';
    ctx.font = `16px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText(`Best ${Math.max(best, state.score)}`, 28, FIELD.height - 18);
  }

  function drawPanel(title, lines, accent) {
    const w = 620;
    const h = 300 + lines.length * 30;
    const x = (FIELD.width - w) / 2;
    const y = (FIELD.height - h) / 2 - 20;
    ctx.fillStyle = PALETTE.panel;
    roundRect(ctx, x, y, w, h, 18);
    ctx.fill();
    ctx.strokeStyle = PALETTE.panelEdge;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.font = `bold 52px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(title, FIELD.width / 2, y + 78);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `22px ${FONT}`;
    lines.forEach((line, i) => {
      ctx.fillText(line, FIELD.width / 2, y + 128 + i * 32);
    });
    const blink = Math.floor(Date.now() / 500) % 2 === 0;
    if (blink) {
      ctx.fillStyle = PALETTE.muted;
      ctx.font = `bold 20px ${FONT}`;
      ctx.fillText('Press Space or click to play again', FIELD.width / 2, y + h - 28);
    }
  }

  function drawTitle(state, best) {
    // The world keeps scrolling behind the title.
    drawSky(state);
    drawHills(state);
    drawGround(state);
    drawTurkey(state, TURKEY.x, state.turkey.y, { ducking: false });
    const farmerX = TURKEY.x - state.gap - FARMER.width;
    if (farmerX > -80) drawFarmer(state, farmerX);
    // Title.
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(43, 24, 8, 0.55)';
    roundRect(ctx, FIELD.width / 2 - 430, 96, 860, 210, 20);
    ctx.fill();
    ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 84px ${FONT}`;
    ctx.fillText('GOBBLE RUN', FIELD.width / 2, 178);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `bold 30px ${FONT}`;
    ctx.fillText('The Great Turkey Escape', FIELD.width / 2, 224);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `21px ${FONT}`;
    ctx.fillText('Thanksgiving is coming. The farmer is after you.', FIELD.width / 2, 268);
    ctx.font = `20px ${FONT}`;
    ctx.fillText('Jump the fences, hay and the oven — duck the low branches.', FIELD.width / 2, 330);
    ctx.fillText('Dodge the carving knives. Grab corn. Reach the forest, 1500 m away.', FIELD.width / 2, 360);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = 'rgba(43, 24, 8, 0.65)';
    ctx.lineWidth = 4;
    ctx.font = `bold 20px ${FONT}`;
    ctx.strokeText('Space / ↑ / click top = jump      ↓ / hold bottom = duck      P = pause', FIELD.width / 2, 408);
    ctx.fillText('Space / ↑ / click top = jump      ↓ / hold bottom = duck      P = pause', FIELD.width / 2, 408);
    if (best > 0) {
      ctx.fillStyle = PALETTE.text;
      ctx.font = `22px ${FONT}`;
      ctx.fillText(`Best score ${best}`, FIELD.width / 2, 448);
    }
    const blink = Math.floor(Date.now() / 500) % 2 === 0;
    if (blink) {
      ctx.fillStyle = PALETTE.text;
      ctx.font = `bold 26px ${FONT}`;
      ctx.fillText('Press Space or click to start', FIELD.width / 2, 500);
    }
  }

  function drawOver(state, best) {
    const escaped = state.over === 'escaped';
    drawPanel(
      escaped ? 'ESCAPED!' : 'CAUGHT!',
      escaped
        ? [
            'You made it to the forest — no Thanksgiving dinner for you!',
            `Distance ${Math.floor(state.distance)} m   •   Score ${state.score}`,
            `Best ${Math.max(best, state.score)}`,
          ]
        : [
            'The farmer got you. Thanksgiving dinner it is…',
            `Distance ${Math.floor(state.distance)} m   •   Score ${state.score}`,
            `Best ${Math.max(best, state.score)}`,
          ],
      escaped ? PALETTE.treeLight : PALETTE.danger,
    );
  }

  function draw(state, screen, best) {
    fit();
    ctx.save();
    // Screen shake on a hit.
    if (state.shake > 0) {
      const s = state.shake * 14;
      ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
    }
    if (screen === SCREEN_TITLE) {
      drawTitle(state, best);
      ctx.restore();
      return;
    }
    drawSky(state);
    drawHills(state);
    drawGround(state);
    // Pickups, then obstacles, then knives, then the farmer, then the turkey.
    for (const p of state.pickups) {
      if (p.kind === KIND_CORN) drawCorn(p, state.time);
      else drawFeather(p, state.time);
    }
    for (const ob of state.obstacles) {
      if (!ob.active) continue;
      if (ob.kind === KIND_FENCE) drawFenceObstacle(ob.x);
      else if (ob.kind === KIND_HAY) drawHay(ob.x);
      else if (ob.kind === KIND_OVEN) drawOven(ob.x);
      else if (ob.kind === KIND_BRANCH) drawBranch(ob.x);
    }
    for (const k of state.knives) if (k.active) drawKnife(k);
    const farmerX = TURKEY.x - state.gap - FARMER.width;
    if (farmerX > -90) drawFarmer(state, farmerX);
    drawTurkey(state, TURKEY.x, state.turkey.y);
    // Red flash on a hit.
    if (state.flash > 0) {
      ctx.fillStyle = `rgba(255, 60, 40, ${state.flash * 1.2})`;
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    }
    if (screen === SCREEN_PAUSED) {
      ctx.fillStyle = 'rgba(20, 12, 4, 0.55)';
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);
      ctx.fillStyle = PALETTE.text;
      ctx.font = `bold 56px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', FIELD.width / 2, FIELD.height / 2 - 10);
      ctx.font = `22px ${FONT}`;
      ctx.fillText('Press P or Space to keep running', FIELD.width / 2, FIELD.height / 2 + 34);
    } else if (screen === SCREEN_OVER) {
      drawOver(state, best);
    } else {
      drawHUD(state, best);
    }
    ctx.restore();
  }

  return { draw, fit };
}
