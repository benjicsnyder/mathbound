(function () {
  "use strict";
  const WIDTH = 88, HEIGHT = 64, TILE = 16;
  const REGIONS = [
    { name: "Pluswood", color: "#e1edf1", dark: "#7398ab", symbol: "+", hint: "Northwest: snowy addition pines and the Scribbler." },
    { name: "Minus Dunes", color: "#ebe8f5", dark: "#9495b3", symbol: "\u2212", hint: "Northeast: snow dunes, ice pillars, and Minus Menace." },
    { name: "Product Peaks", color: "#dbe4f4", dark: "#8495b8", symbol: "\u00d7", hint: "Southwest: frozen crystal peaks and Times Trouble." },
    { name: "Fraction Coast", color: "#deeff3", dark: "#6ca4b7", symbol: "\u00f7", hint: "Southeast: frozen fraction islands and the Divider." },
    { name: "Zero Citadel", color: "#d2dced", dark: "#7a85a8", symbol: "0", hint: "Far north: collect all four sigils to challenge the ice king." },
    { name: "Origin Village", color: "#eaf2f5", dark: "#8ca9ba", symbol: "=", hint: "The warm fountain heals you. Snowy paths lead to every guardian." }
  ];
  const SHRINES = [
    { x: 13, y: 14 }, { x: 74, y: 14 }, { x: 15, y: 52 }, { x: 74, y: 49 }, { x: 44, y: 6 }
  ];
  const SENTRY_SPAWNS = [
    { x: 30, y: 34, level: 0, name: "Plus Punk" },
    { x: 55, y: 34, level: 1, name: "Snow Scrawler" },
    { x: 44, y: 22, level: 1, name: "Number Ninja" },
    { x: 25, y: 52, level: 2, name: "Product Imp" },
    { x: 74, y: 30, level: 3, name: "Fraction Fiend" },
    { x: 54, y: 49, level: 3, name: "Remainder Rogue" }
  ];
  const FOUNTAIN = { x: 42, y: 34 };
  const GUIDE = { x: 45, y: 36 };
  const hash = (x, y) => ((x * 374761393 + y * 668265263) ^ (x * y * 1274126177)) >>> 0;

  function regionAt(x, y) {
    if (Math.abs(x - 44) < 8 && Math.abs(y - 34) < 6) return 5;
    if (x > 36 && x < 52 && y < 12) return 4;
    return y < 34 ? (x < 44 ? 0 : 1) : (x < 44 ? 2 : 3);
  }
  function terrain(x, y) {
    if (x < 1 || y < 1 || x >= WIDTH - 1 || y >= HEIGHT - 1) return "wall";
    if (x >= 40 && x <= 48 && y >= 2 && y <= 4) return "wall";
    const river = 62 + Math.round(Math.sin(y / 5) * 2);
    const water = Math.abs(x - river) < 2 || (x > 77 && y > 42 && hash(x >> 2, y >> 2) % 5 !== 0);
    const road = (Math.abs(y - 34) <= 1 && x >= 8 && x <= 80) ||
      (Math.abs(x - 44) <= 1 && y >= 5 && y <= 57) ||
      (Math.abs(x - 13) <= 1 && y >= 13 && y <= 34) ||
      (Math.abs(x - 74) <= 1 && y >= 13 && y <= 50) ||
      (Math.abs(x - 15) <= 1 && y >= 34 && y <= 53) ||
      (Math.abs(y - 52) <= 1 && x >= 14 && x <= 45) ||
      (Math.abs(y - 49) <= 1 && x >= 44 && x <= 75);
    if (road) return water ? "bridge" : "road";
    if ((x >= 38 && x <= 41 && y >= 29 && y <= 31) || (x >= 47 && x <= 50 && y >= 29 && y <= 31)) return "house";
    if (regionAt(x, y) === 5 || SHRINES.some(p => Math.abs(x - p.x) <= 2 && Math.abs(y - p.y) <= 2)) return "grass";
    if (water) return "water";
    if (hash(x, y) % 17 === 0) return regionAt(x, y) === 0 ? "tree" : "rock";
    return "grass";
  }
  function walkable(x, y) { return ["grass", "road", "bridge"].includes(terrain(x, y)); }

  class World {
    constructor(saved) {
      this.x = 44; this.y = 36; this.hp = 100;
      this.difficulty = "normal";
      this.strongest = "divide";
      this.facts = [];
      this.cleared = []; this.sentries = [];
      this.roamers = SENTRY_SPAWNS.map((p, id) => ({ ...p, id, homeX: p.x, step: 0 }));
      if (saved && saved.version === 1) {
        this.difficulty = Object.hasOwn(window.MathBattle.DIFFICULTIES, saved.difficulty) ? saved.difficulty : "hard";
        if (Object.hasOwn(window.MathBattle.MOVES, saved.strongest)) this.strongest = saved.strongest;
        if (Array.isArray(saved.facts)) {
          for (const fact of saved.facts.slice(-100)) {
            if (window.MathBattle.explainProblem(fact).length && !this.facts.some(p => p.text === fact.text)) {
              this.facts.push({ text: fact.text, answer: fact.answer, practiced: fact.practiced === true });
            }
          }
        }
        if (Array.isArray(saved.cleared)) this.cleared = [...new Set(saved.cleared.filter(n => Number.isInteger(n) && n >= 0 && n < 5))];
        if (this.cleared.includes(4) && ![0, 1, 2, 3].every(n => this.cleared.includes(n))) this.cleared = this.cleared.filter(n => n !== 4);
        if (Array.isArray(saved.sentries)) this.sentries = [...new Set(saved.sentries.filter(n => Number.isInteger(n) && n >= 0 && n < SENTRY_SPAWNS.length))];
        if (Number.isInteger(saved.hp) && saved.hp > 0 && saved.hp <= 100) this.hp = saved.hp;
        if (Number.isInteger(saved.x) && Number.isInteger(saved.y) && walkable(saved.x, saved.y)) {
          this.x = saved.x; this.y = saved.y;
        }
      }
    }
    get sigils() { return this.cleared.filter(n => n < 4).length; }
    get champion() { return this.cleared.includes(4); }
    get region() { return regionAt(this.x, this.y); }
    move(dx, dy) {
      if (Math.abs(dx) + Math.abs(dy) !== 1 || !walkable(this.x + dx, this.y + dy)) return false;
      if ([FOUNTAIN, GUIDE].some(p => p.x === this.x + dx && p.y === this.y + dy)) return false;
      this.x += dx; this.y += dy;
      return true;
    }
    nearby() {
      const near = p => Math.abs(p.x - this.x) + Math.abs(p.y - this.y) <= 1;
      if (near(FOUNTAIN)) return { type: "fountain" };
      if (near(GUIDE)) return { type: "guide" };
      const boss = SHRINES.findIndex((p, i) => !this.cleared.includes(i) && near(p));
      if (boss >= 0) return { type: "boss", id: boss, locked: boss === 4 && this.sigils < 4 };
      const sentry = this.roamers.find(p => !this.sentries.includes(p.id) && near(p));
      return sentry ? { type: "sentry", id: sentry.id } : null;
    }
    encounter() {
      const boss = SHRINES.findIndex((p, i) => !this.cleared.includes(i) && p.x === this.x && p.y === this.y);
      if (boss >= 0) return { type: "boss", id: boss, locked: boss === 4 && this.sigils < 4 };
      const sentry = this.roamers.find(p => !this.sentries.includes(p.id) && p.x === this.x && p.y === this.y);
      return sentry ? { type: "sentry", id: sentry.id } : null;
    }
    roam() {
      for (const p of this.roamers) {
        p.step = (p.step + 1) % 4;
        const x = p.homeX + [0, 1, 2, 1][p.step];
        if (walkable(x, p.y) && !(this.x === x && this.y === p.y)) p.x = x;
      }
    }
    complete(target, hp) {
      const rules = window.MathBattle.DIFFICULTIES[this.difficulty];
      this.hp = Math.min(100, hp + (target.type === "boss" ? rules.bossHeal : rules.sentryHeal));
      const list = target.type === "boss" ? this.cleared : this.sentries;
      if (!list.includes(target.id)) list.push(target.id);
    }
    respawn() { this.x = 44; this.y = 36; this.hp = 100; }
    recordMiss(problem) {
      let fact = this.facts.find(p => p.text === problem.text);
      if (fact) fact.practiced = false;
      else {
        fact = { text: problem.text, answer: problem.answer, practiced: false };
        this.facts.push(fact);
        if (this.facts.length > 100) this.facts.shift();
      }
      return fact;
    }
    save() { return { version: 1, x: this.x, y: this.y, hp: this.hp, difficulty: this.difficulty, strongest: this.strongest,
      facts: this.facts, cleared: this.cleared, sentries: this.sentries }; }
  }
  window.MathWorld = { World, WIDTH, HEIGHT, TILE, REGIONS, SHRINES, FOUNTAIN, GUIDE, hash, regionAt, terrain, walkable };
})();
