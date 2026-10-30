(function () {
  "use strict";
  const { WIDTH, HEIGHT, TILE, REGIONS, SHRINES, FOUNTAIN, GUIDE, hash, regionAt, terrain } = window.MathWorld;
  const rect = (c, color, x, y, w, h) => { c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), w, h); };
  const approach = (value, target, delta, rate = 22) => target + (value - target) * Math.exp(-rate * Math.max(0, delta) / 1000);
  const cameraAt = (x, y) => ({
    x: Math.max(0, Math.min(WIDTH * TILE - 640, x * TILE + 8 - 320)),
    y: Math.max(0, Math.min(HEIGHT * TILE - 352, y * TILE + 8 - 176))
  });
  function text(c, value, x, y, color = "#f4edc9", size = 9) {
    c.fillStyle = color; c.font = `bold ${size}px monospace`; c.textAlign = "center";
    c.fillText(value, Math.round(x), Math.round(y));
  }
  function tile(c, x, y) {
    const t = terrain(x, y), r = regionAt(x, y), p = REGIONS[r], n = hash(x, y), sx = x * TILE, sy = y * TILE;
    rect(c, p.color, sx, sy, 16, 16);
    if (t === "water") {
      rect(c, "#83b4cd", sx, sy, 16, 16);
      rect(c, "#bfe6ed", sx + 2, sy + (n % 7) + 3, 8, 1);
      rect(c, "#ccecf1", sx, sy + 13, 6, 1);
      rect(c, "#6c9dbb", sx + 9, sy + 10, 1, 5);
      rect(c, "#6c9dbb", sx + 10, sy + 9, 4, 1);
      if (n % 6 === 0) text(c, "/", sx + 8, sy + 11, "#e9f9fc", 11);
    } else if (t === "bridge") {
      rect(c, "#547e8d", sx, sy, 16, 16);
      rect(c, "#b89261", sx, sy + 1, 16, 14);
      for (let i = 1; i < 16; i += 4) rect(c, "#826645", sx + i, sy + 1, 1, 14);
      rect(c, "#f6fbff", sx, sy, 16, 3); rect(c, "#d6e6ed", sx, sy + 13, 16, 3);
    } else if (t === "road") {
      rect(c, r === 4 ? "#b6c6df" : "#c7dbe7", sx, sy, 16, 16);
      rect(c, "#adc5d6", sx + n % 10, sy + (n >> 4) % 12, 3, 1);
      if (n % 4 === 0) rect(c, "#f3faff", sx + 4, sy + 10, 7, 2);
    } else if (t === "wall") {
      rect(c, p.dark, sx, sy, 16, 16);
      rect(c, "#b2c4d3", sx + 1, sy + 2, 13, 5); rect(c, "#9fb1c9", sx + 3, sy + 9, 11, 5);
      rect(c, "#f5fbff", sx, sy, 16, 3);
    } else {
      rect(c, "#c5d6e5", sx + (n % 12), sy + ((n >> 3) % 13), 3, 1);
      rect(c, "#ffffff", sx + (n >> 6) % 12, sy + 9, 3, 1);
      if (t === "tree") tree(c, sx, sy, 1);
      else if (t === "rock") {
        if (r === 1) {
          rect(c, "#9aa7cc", sx + 6, sy + 3, 5, 12); rect(c, "#d7e6f6", sx + 7, sy + 4, 2, 10);
          rect(c, "#fafcff", sx + 4, sy + 1, 9, 3); rect(c, "#727d9f", sx + 5, sy + 7, 7, 2);
        } else {
          rect(c, p.dark, sx + 3, sy + 5, 11, 10); rect(c, "#b6c9e0", sx + 5, sy + 2, 6, 10);
          rect(c, "#ffffff", sx + 3, sy + 2, 10, 3);
          text(c, r === 2 ? "\u00d7" : "/", sx + 8, sy + 12, "#637c9f", 11);
        }
      } else if (t === "grass" && n % 13 === 0 && r !== 5) {
        text(c, ["+", "\u2212", "\u00d7", "\u00f7", "0"][r], sx + 8, sy + 12, p.dark, 10);
      } else if (n % 23 === 0) {
        rect(c, "#ffffff", sx + 6, sy + 6, 5, 1); rect(c, "#ffffff", sx + 8, sy + 4, 1, 5);
      }
    }
  }
  function tree(c, x, y, scale) {
    c.save(); c.translate(x, y); c.scale(scale, scale);
    rect(c, "#b4cbd5", 3, 12, 12, 3); rect(c, "#7c7b80", 7, 9, 3, 7);
    rect(c, "#487b83", 1, 4, 14, 6); rect(c, "#487b83", 5, 0, 6, 14);
    rect(c, "#9cbec8", 2, 4, 12, 4); rect(c, "#c2dce5", 6, 0, 4, 12);
    rect(c, "#ffffff", 1, 3, 14, 3); rect(c, "#f5fcff", 5, 0, 6, 5);
    rect(c, "#f5fcff", 5, 10, 6, 2); c.restore();
  }
  function house(c, x, y, symbol) {
    rect(c, "#b5cbdc", x - 2, y + 35, 70, 15);
    rect(c, "#c5d7df", x + 3, y + 13, 58, 33);
    rect(c, "#a3614e", x, y + 4, 64, 15); rect(c, "#c58360", x + 5, y, 54, 12);
    for (let i = 4; i < 60; i += 10) rect(c, "#874d47", x + i, y + 9, 7, 2);
    rect(c, "#fafcff", x + 3, y - 2, 58, 9); rect(c, "#e2eef5", x, y + 5, 64, 5);
    for (let i = 8; i < 60; i += 13) rect(c, "#d6e6ef", x + i, y + 9, 2, 5);
    rect(c, "#786d7c", x + 44, y - 10, 7, 9); rect(c, "#fffaff", x + 42, y - 12, 11, 3);
    rect(c, "#6a634c", x + 25, y + 28, 13, 18); rect(c, "#d9b66b", x + 8, y + 26, 9, 9);
    rect(c, "#f6d58c", x + 46, y + 26, 9, 9); text(c, symbol, x + 32, y + 24, "#536d87", 12);
    rect(c, "#f8fdff", x, y + 42, 20, 5); rect(c, "#f8fdff", x + 45, y + 42, 19, 5);
  }
  function castle(c) {
    const x = 40 * TILE, y = TILE;
    rect(c, "#3d3a52", x + 8, y + 15, 128, 56);
    rect(c, "#9290a2", x + 8, y + 11, 128, 48);
    for (let i = 0; i < 5; i++) {
      rect(c, "#b0a7b8", x + 5 + i * 28, y, 16, 20);
      rect(c, "#6d6883", x + 7 + i * 28, y + 22, 11, 28);
      rect(c, "#f3f8ff", x + 3 + i * 28, y - 2, 20, 5);
      rect(c, "#d1e6f1", x + 8 + i * 28, y + 3, 2, 6);
    }
    rect(c, "#282938", x + 56, y + 30, 30, 40);
    rect(c, "#dac88e", x + 58, y + 30, 26, 4);
    text(c, "0", x + 71, y + 24, "#e8d495", 18);
  }
  function stick(c, x, y, color, scale = 1, crown = false, pose = {}) {
    c.save(); c.translate(Math.round(x), Math.round(y));
    const facing = pose.facing === "left" ? -1 : 1;
    const box = (shade, px, py, w, h) => rect(c, shade, px * scale, py * scale, Math.max(1, Math.round(w * scale)), Math.max(1, Math.round(h * scale)));
    const swing = pose.stride ?? 0, breath = pose.breath ?? 0;
    box("#526e8a38", -8, 0, 17, 2);
    const joints = [
      [[0, -12 + breath], [0, -5]],
      [[0, -11 + breath], [-4 * facing, -8 - swing], [(-7 + swing) * facing, -6 - swing]],
      [[0, -11 + breath], [4 * facing, -8 + swing], [(7 - swing) * facing, -6 + swing]],
      [[0, -5], [-3 - swing, -3], [-5 - swing * 2, -Math.max(0, swing)]],
      [[0, -5], [3 - swing, -3], [5 - swing * 2, Math.min(0, swing)]]
    ];
    // Rasterize articulated limbs at screen resolution so large sprites move in single pixels.
    for (const [shade, thickness] of [["#435c76", 3.5], [color, 2]]) {
      for (const joint of joints) for (let i = 1; i < joint.length; i++) {
        const [ax, ay] = joint[i - 1], [bx, by] = joint[i];
        const steps = Math.ceil(Math.max(Math.abs(bx - ax), Math.abs(by - ay)) * scale);
        for (let step = 0; step <= steps; step++) {
          const t = steps ? step / steps : 0;
          box(shade, ax + (bx - ax) * t - thickness / 2, ay + (by - ay) * t - thickness / 2, thickness, thickness);
        }
      }
    }
    const head = [[-3,-21,6,2],[-5,-19,2,5],[3,-19,2,5],[-3,-14,6,2]];
    for (const [px,py,w,h] of head) box("#435c76", px - .7, py + breath - .7, w + 1.4, h + 1.4);
    for (const [px,py,w,h] of head) box(color, px, py + breath, w, h);
    box("#a9c4d4", -2, -18 + breath, 4, 3);
    if (pose.facing !== "up") {
      box(color === "#141820" ? "#ef7c86" : "#344961", -2, -18 + breath, 1, 1);
      box(color === "#141820" ? "#ef7c86" : "#344961", 1, -18 + breath, 1, 1);
    }
    if (color !== "#141820") {
      const scarf = color === "#72c9e4" ? "#f3d99c" : "#c26879";
      box(scarf, -5, -20 + breath, 10, 2);
      box(scarf, -8, -19 + breath, 4, 2); box(scarf, -10, -18 + breath + swing * .4, 3, 2);
    }
    if (crown) {
      box("#edc865", -6, -24 + breath, 12, 4);
      for (let i = -6; i <= 6; i += 5) box("#f7df8b", i, -27 + breath, 2, 4);
    }
    c.restore();
  }
  function snow(c, width, height, time, count = 65) {
    c.save();
    for (let i = 0; i < count; i++) {
      const near = i % 3 === 0, speed = near ? .027 : .012;
      const x = ((hash(i, 92) % width + time * speed * .45 + Math.sin(time / 1800 + i) * 9) % width + width) % width;
      const y = (hash(i, 48) % height + time * speed) % height;
      c.globalAlpha = near ? .8 : .4;
      rect(c, "#ffffff", x, y, near ? 2 : 1, near ? 2 : 1);
    }
    c.restore();
  }
  function shrine(c, p, i, cleared) {
    const x = p.x * TILE + 8, y = p.y * TILE + 8, color = REGIONS[i].dark;
    rect(c, color, x - 20, y - 8, 40, 23); rect(c, "#e6f4fa", x - 18, y - 10, 36, 20);
    rect(c, color, x - 14, y - 7, 28, 14);
    text(c, REGIONS[i].symbol, x, y + 4, "#f0e9ba", 15);
    for (const dx of [-22, 18]) {
      rect(c, "#525c58", x + dx, y - 25, 5, 26); rect(c, cleared ? "#e8e59b" : "#9588ac", x + dx - 1, y - 27, 7, 7);
      rect(c, "#faffff", x + dx - 2, y - 28, 9, 2);
    }
  }
  function createLandscape() {
    const image = document.createElement("canvas");
    image.width = WIDTH * TILE; image.height = HEIGHT * TILE;
    const c = image.getContext("2d"); c.imageSmoothingEnabled = false;
    for (let y = 0; y < HEIGHT; y++) for (let x = 0; x < WIDTH; x++) tile(c, x, y);
    house(c, 38 * TILE, 29 * TILE, "+"); house(c, 47 * TILE, 29 * TILE, "=");
    castle(c);
    for (const [label, x, y] of [["PLUSWOOD", 13, 10], ["MINUS DUNES", 74, 10], ["PRODUCT PEAKS", 15, 57], ["FRACTION COAST", 74, 54], ["ORIGIN", 44, 28]]) {
      rect(c, "#49637d", x * TILE - 47, y * TILE - 10, 94, 15);
      rect(c, "#f8fdff", x * TILE - 48, y * TILE - 12, 96, 3); text(c, label, x * TILE, y * TILE, "#eef9ff", 9);
    }
    return image;
  }
  function drawWorld(c, world, landscape, player, time) {
    const camera = player.camera ?? cameraAt(player.x, player.y);
    c.imageSmoothingEnabled = false;
    c.clearRect(0, 0, 640, 352);
    c.save(); c.translate(-Math.round(camera.x), -Math.round(camera.y));
    c.drawImage(landscape, 0, 0);
    c.save();
    for (const track of player.tracks ?? []) {
      const age = Math.max(0, (player.clock ?? time) - track.time);
      c.globalAlpha = Math.max(0, .4 * (1 - age / 12000));
      const horizontal = track.direction === "left" || track.direction === "right";
      rect(c, "#7d9fb9", track.x * TILE + 4, track.y * TILE + 10, 2, 1);
      rect(c, "#7d9fb9", track.x * TILE + (horizontal ? 11 : 8), track.y * TILE + (horizontal ? 12 : 15), 2, 1);
    }
    c.restore();
    for (let i = 0; i < SHRINES.length; i++) shrine(c, SHRINES[i], i, world.cleared.includes(i));
    const fx = FOUNTAIN.x * TILE, fy = FOUNTAIN.y * TILE;
    rect(c, "#506e71", fx - 5, fy, 26, 18); rect(c, "#94d7d4", fx - 3, fy + 2, 22, 12);
    rect(c, "#e6f7fa", fx + 5, fy - 9, 5, 19); rect(c, "#65b5d0", fx + 6, fy - 12 + Math.sin(time / 250), 3, 13);
    text(c, "+ HP", fx + 8, fy - 16, "#487190", 8);
    for (const hx of [38, 47]) for (let puff = 0; puff < 3; puff++) {
      const progress = (time / 2400 + puff / 3) % 1;
      c.save(); c.globalAlpha = (1 - progress) * .5;
      rect(c, "#ffffff", hx * TILE + 47 + Math.sin(progress * 3) * 9, 29 * TILE - 16 - progress * 27, 4 + progress * 5, 4 + progress * 4);
      c.restore();
    }
    const bob = Math.sin(time / 550) * .6;
    stick(c, GUIDE.x * TILE + 8, GUIDE.y * TILE + 14, "#72c9e4", 1, false, { breath: bob });
    text(c, "?", GUIDE.x * TILE + 8, GUIDE.y * TILE - 10 - bob, "#fcf1b6", 11);
    const actors = world.roamers.filter(p => !world.sentries.includes(p.id)).map(p => ({ ...p, ...player.roamers?.[p.id], sentry: true }));
    SHRINES.forEach((p, id) => {
      if (!world.cleared.includes(id)) actors.push({ ...p, crown: id === 4 });
      else text(c, "OK", p.x * TILE + 8, p.y * TILE - 10, "#fff7bf", 9);
    });
    actors.push({ x: player.x, y: player.y, hero: true });
    actors.sort((a, b) => a.y - b.y);
    for (const p of actors) {
      const x = p.x * TILE + 8, y = p.y * TILE + 14;
      const stride = p.hero ? Math.sin(player.walkPhase) * player.gait : p.sentry ? Math.sin(time / 120) * (p.moving ? .8 : 0) : 0;
      stick(c, x, y, p.hero ? "#ffffff" : "#141820", p.hero || p.sentry ? 1 : 2, p.crown,
        { stride, breath: bob, facing: p.hero ? player.facing : p.facing });
      if (!p.hero && !p.sentry) text(c, "!", x, y - 60 - bob, "#fff3b5", 10);
      if (p.hero) {
        const breath = (time / 2200) % 1;
        c.save(); c.globalAlpha = (1 - breath) * .55;
        rect(c, "#ffffff", x + 6 + breath * 10, y - 18 - breath * 6, 2 + breath * 3, 2);
        c.restore();
      }
    }
    c.restore();
    snow(c, 640, 352, time);
  }
  function drawMap(c, canvas, world, landscape, labels = false) {
    const sx = canvas.width / (WIDTH * TILE), sy = canvas.height / (HEIGHT * TILE);
    c.imageSmoothingEnabled = false;
    c.drawImage(landscape, 0, 0, canvas.width, canvas.height);
    for (let i = 0; i < SHRINES.length; i++) {
      const p = SHRINES[i], x = (p.x * TILE + 8) * sx, y = (p.y * TILE + 8) * sy;
      rect(c, world.cleared.includes(i) ? "#d8f38e" : "#242632", x - 3, y - 3, 6, 6);
      if (labels) text(c, REGIONS[i].name.toUpperCase(), x, y + (i === 4 ? 19 : -9), "#fff9db", 9);
    }
    const x = (world.x * TILE + 8) * sx, y = (world.y * TILE + 8) * sy;
    rect(c, "#223b37", x - 4, y - 4, 9, 9);
    rect(c, "#fffbe5", x - 1, y - 4, 3, 9); rect(c, "#fffbe5", x - 4, y - 1, 9, 3);
  }
  function drawBattle(c, region, time, effect) {
    const p = REGIONS[region], breath = Math.sin(time / 600) * .35;
    rect(c, region === 4 ? "#8e9ebc" : "#b7d0e2", 0, 0, 640, 260);
    rect(c, "#deebf3", 0, 54, 640, 30);
    for (let i = 0; i < 12; i++) {
      const x = i * 62 - 15, height = 20 + hash(i, region) % 33;
      if (region === 0 || region === 5) tree(c, x, 90 - height, 4);
      else {
        for (let row = 0; row < height; row += 5) rect(c, p.dark, x + height - row, 95 - height + row, row * 2 + 10, 5);
        for (let row = 0; row < 10; row += 3) rect(c, "#f5fbff", x + height - row, 95 - height + row, row * 2 + 10, 3);
        text(c, p.symbol, x + height, 80, "#eef9ff", 15);
      }
    }
    rect(c, p.color, 0, 100, 640, 160);
    for (let i = 0; i < 40; i++) {
      const x = hash(i, 6) % 640, y = 110 + hash(i, 7) % 150;
      rect(c, "#b7cbdc", x, y, 5, 1); rect(c, "#faffff", x + 4, y + 2, 9, 1);
    }
    rect(c, p.dark, 393, 138, 180, 15); rect(c, "#f8fdff", 406, 128, 155, 17);
    rect(c, p.dark, 60, 231, 230, 17); rect(c, "#f8fdff", 75, 220, 200, 20);
    const progress = effect ? Math.max(0, Math.min(1, (time - effect.start) / 800)) : 1;
    const attacking = effect && effect.kind !== "block" && progress < 1;
    const lunge = attacking ? Math.sin(Math.min(1, progress / .55) * Math.PI) * 23 : 0;
    const recoil = attacking && effect.kind !== "miss" && progress > .4 ? Math.sin((progress - .4) * 35) * Math.max(0, 1 - progress) * 7 : 0;
    const playerAttacks = effect?.target === "enemy";
    const heroX = 178 + (attacking ? playerAttacks ? lunge : recoil : 0);
    const enemyX = 484 + (attacking ? playerAttacks ? recoil : -lunge : 0);
    stick(c, heroX, 224, "#ffffff", 5, false, { breath, stride: attacking && playerAttacks ? lunge / 30 : 0 });
    stick(c, enemyX, 135, "#141820", 4, region === 4, { breath: -breath, facing: "left", stride: attacking && !playerAttacks ? -lunge / 30 : 0 });
    if (effect && progress < 1) {
      const tx = playerAttacks ? enemyX : heroX, ty = playerAttacks ? 90 : 175;
      c.save();
      if (effect.kind === "block") {
        c.globalAlpha = Math.sin(progress * Math.PI) * .85;
        for (let angle = 0; angle < Math.PI * 2; angle += .09) {
          rect(c, "#79bce6", heroX + Math.cos(angle) * 49, 165 + Math.sin(angle) * 61, 3, 3);
        }
        text(c, "BLOCK", heroX, 102, "#416d9c", 13);
      } else {
        const travel = Math.min(1, progress / .46);
        const sx = playerAttacks ? heroX + 30 : enemyX - 30, sy = playerAttacks ? 155 : 90;
        const px = sx + (tx - sx) * travel, py = sy + (ty - sy) * travel - Math.sin(travel * Math.PI) * 42;
        const glow = effect.move === "divide" ? "#667ad1" : effect.move === "multiply" ? "#a077bf" : "#4b98b9";
        if (progress < .5) {
          for (let i = 1; i < 6; i++) rect(c, glow, px - (playerAttacks ? 1 : -1) * i * 6, py + i * 2, 4, 4);
          text(c, effect.kind === "miss" ? "?" : { add: "+", subtract: "\u2212", multiply: "\u00d7", divide: "\u00f7" }[effect.move] ?? "!", px, py + 7, glow, 30);
        }
        if (progress > .4 && effect.kind !== "miss") {
          const burst = (progress - .4) / .6;
          c.globalAlpha = 1 - burst;
          for (let i = 0; i < 12; i++) {
            const angle = i * Math.PI / 6;
            rect(c, i % 2 ? glow : "#ffffff", tx + Math.cos(angle) * burst * 55, ty + Math.sin(angle) * burst * 40, 4, 4);
          }
        }
      }
      c.restore();
    }
    snow(c, 640, 260, time, 40);
  }
  window.MathPixels = { createLandscape, drawWorld, drawMap, drawBattle, approach, cameraAt };
})();
