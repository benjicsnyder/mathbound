(function () {
  "use strict";

  const MOVES = Object.freeze({
    add: { name: "Addition", damage: 10, symbol: "+" },
    subtract: { name: "Subtraction", damage: 16, symbol: "\u2212" },
    multiply: { name: "Multiplication", damage: 24, symbol: "\u00d7" },
    divide: { name: "Division", damage: 34, symbol: "\u00f7" }
  });
  function movesFor(strongest = "divide") {
    if (!Object.hasOwn(MOVES, strongest)) strongest = "divide";
    const ranking = Object.keys(MOVES).filter(move => move !== strongest).concat(strongest);
    return Object.fromEntries(Object.entries(MOVES).map(([key, move]) =>
      [key, { ...move, damage: [10, 16, 24, 34][ranking.indexOf(key)] }]));
  }

  function explainProblem(problem) {
    if (!problem || typeof problem.text !== "string" || problem.text.length > 100) return [];
    const tokens = problem.text.match(/\d+|[()+\u2212\u00d7\u00f7]/g);
    if (!tokens || tokens.join("") !== problem.text.replace(/\s/g, "")) return [];
    const steps = [];
    const symbols = { "+": "Add the numbers.", "\u2212": "Subtract the second number from the first.",
      "\u00d7": "Multiply: count equal groups.", "\u00f7": "Divide: find how many equal groups fit." };
    function reduce(values) {
      if (values.length % 2 !== 1 || values.some((v, i) => i % 2 ? !Object.hasOwn(symbols, v) : !Number.isSafeInteger(v))) return null;
      for (const priority of [["\u00d7", "\u00f7"], ["+", "\u2212"]]) {
        let i = 1;
        while (i < values.length) {
          const op = values[i];
          if (!priority.includes(op)) { i += 2; continue; }
          const a = values[i - 1], b = values[i + 1];
          const answer = op === "+" ? a + b : op === "\u2212" ? a - b : op === "\u00d7" ? a * b : a / b;
          if (!Number.isSafeInteger(answer)) return null;
          let tip = symbols[op];
          const firstPart = b >= 10 ? Math.floor(b / 10) * 10 : Math.floor(b / 2);
          const rest = b - firstPart;
          if (op === "+" && b > 1) {
            tip += ` Break ${b} into ${firstPart} and ${rest}: ${a} + ${firstPart} = ${a + firstPart}, then ${a + firstPart} + ${rest} = ${answer}.`;
          }
          if (op === "\u00d7" && b > 0) {
            tip += b <= 6 ? ` ${b} groups of ${a}: ${Array(b).fill(a).join(" + ")} = ${answer}.`
              : ` Split ${b} into ${firstPart} and ${rest}: ${a} \u00d7 ${firstPart} = ${a * firstPart} and ${a} \u00d7 ${rest} = ${a * rest}. Add ${a * firstPart} + ${a * rest} = ${answer}.`;
          }
          if (op === "\u00f7") tip += ` Check: ${b} \u00d7 ${answer} = ${a}.`;
          if (op === "\u2212") {
            if (b > 1) tip += ` Take away ${firstPart}, then ${rest}: ${a} \u2212 ${firstPart} = ${a - firstPart}, then ${a - firstPart} \u2212 ${rest} = ${answer}.`;
            tip += ` Check: ${b} + ${answer} = ${a}.`;
          }
          steps.push(`${a} ${op} ${b} = ${answer}. ${tip}`);
          values.splice(i - 1, 3, answer);
        }
      }
      return values[0];
    }
    const values = tokens.map(token => /^\d+$/.test(token) ? Number(token) : token);
    while (values.includes("(")) {
      const start = values.lastIndexOf("("), end = values.indexOf(")", start);
      if (end < 0) return [];
      const answer = reduce(values.slice(start + 1, end));
      if (answer === null) return [];
      values.splice(start, end - start + 1, answer);
    }
    const answer = reduce(values);
    return answer !== null && answer === problem.answer && steps.length ? steps : [];
  }
  const DIFFICULTIES = Object.freeze({
    easy: { name: "Easy", health: .65, attack: .55, counterDelay: 1, rage: 0, rageCap: 0, bossHeal: 30, sentryHeal: 12,
      description: "Small numbers, single-step counters, gentler enemies. No enrage." },
    normal: { name: "Normal", health: .85, attack: .8, counterDelay: 0, rage: 1, rageCap: 10, bossHeal: 20, sentryHeal: 8,
      description: "Medium numbers, some multi-step counters, and gradual enrage." },
    hard: { name: "Hard", health: 1, attack: 1, counterDelay: 0, rage: 2, rageCap: 16, bossHeal: 15, sentryHeal: 5,
      description: "Big numbers, multi-step counters, full-strength bosses, and fast enrage." }
  });
  const validDifficulty = value => Object.hasOwn(DIFFICULTIES, value) ? value : "hard";
  const BOSSES = [
    { name: "The Scribbler", hp: 110, damage: 18, every: 2, trait: "Counters every 2 turns. Gets stronger each turn.", caption: "GUARDIAN OF PLUSWOOD" },
    { name: "Minus Menace", hp: 140, damage: 22, every: 1, trait: "Beware the blizzard and its icy counters.", caption: "GUARDIAN OF MINUS DUNES" },
    { name: "Times Trouble", hp: 170, damage: 25, every: 1, trait: "Counters every move with multiplication.", caption: "GUARDIAN OF PRODUCT PEAKS" },
    { name: "The Divider", hp: 200, damage: 29, every: 1, trait: "Exact division. No room for guessing.", caption: "GUARDIAN OF FRACTION COAST" },
    { name: "King of Chaos", hp: 260, damage: 34, every: 1, trait: "Three-step counters. The ultimate math test.", caption: "RULER OF THE ZERO CITADEL" }
  ];

  function question(move, level, random = Math.random, difficulty = "hard") {
    const int = (min, max) => min + Math.floor(random() * (max - min + 1));
    const mode = validDifficulty(difficulty), easy = mode === "easy", normal = mode === "normal";
    let a, b, answer;
    switch (move) {
      case "add":
        a = int(easy ? 1 : normal ? 5 : 12, easy ? 12 + level * 2 : normal ? 25 + level * 12 : 35 + level * 22);
        b = int(easy ? 1 : normal ? 3 : 8, easy ? 10 + level * 2 : normal ? 20 + level * 10 : 30 + level * 16);
        answer = a + b; break;
      case "subtract":
        b = int(easy ? 1 : normal ? 5 : 12, easy ? 10 + level * 2 : normal ? 25 + level * 12 : 40 + level * 20);
        answer = int(easy ? 1 : normal ? 3 : 5, easy ? 10 + level : normal ? 20 + level * 10 : 25 + level * 16);
        a = b + answer; break;
      case "multiply":
        a = int(easy ? 2 : 3, easy ? 6 + level : normal ? 9 + level : 12 + level * 2);
        b = int(easy ? 2 : 3, easy ? 6 + level : normal ? 9 + level : 12 + level * 2);
        answer = a * b; break;
      case "divide":
        b = int(easy ? 2 : 3, easy ? 6 + level : normal ? 9 + level : 12 + level * 2);
        answer = int(easy ? 2 : 3, easy ? 6 + level : normal ? 10 + level * 2 : 14 + level * 3);
        a = b * answer; break;
      default: throw new Error("Unknown math move.");
    }
    return { text: `${a} ${MOVES[move].symbol} ${b}`, answer };
  }

  function counterQuestion(level, random = Math.random, difficulty = "hard") {
    const mode = validDifficulty(difficulty);
    if (mode === "easy" || (mode === "normal" && level < 2)) {
      return question(["add", "subtract", "multiply", "divide", "multiply"][level], level, random, mode);
    }
    const multiplier = mode === "normal" ? .6 : 1;
    const a = 4 + Math.floor(random() * (10 + level * 3) * multiplier);
    const b = 3 + Math.floor(random() * (8 + level * 2) * multiplier);
    const c = 2 + Math.floor(random() * (5 + level) * multiplier);
    if (level === 0) return { text: `${a} + ${b} + ${c}`, answer: a + b + c };
    if (level === 1) return { text: `${a + b + c} \u2212 ${b} + ${c}`, answer: a + 2 * c };
    if (level === 2) return { text: `${a} \u00d7 ${b} + ${c}`, answer: a * b + c };
    if (level === 3) return { text: `${a * b} \u00f7 ${b} + ${c}`, answer: a + c };
    if (mode === "normal") return { text: `(${a} + ${b}) \u00d7 ${c}`, answer: (a + b) * c };
    return { text: `(${a} + ${b}) \u00d7 ${c} \u2212 ${b}`, answer: (a + b) * c - b };
  }

  class Battle {
    constructor(random = Math.random, options = {}) {
      this.random = random;
      this.level = options.level ?? 0;
      this.difficulty = validDifficulty(options.difficulty);
      this.rules = DIFFICULTIES[this.difficulty];
      this.moves = movesFor(options.strongest);
      const base = options.enemy ?? BOSSES[this.level];
      this.isFinal = this.level === 4 && base === BOSSES[4];
      this.enemy = { ...base, hp: Math.round(base.hp * this.rules.health),
        damage: Math.max(1, Math.round(base.damage * this.rules.attack)), every: base.every + this.rules.counterDelay };
      this.hp = options.hp ?? 100;
      this.bossHp = this.enemy.hp;
      this.turn = 0;
      this.phase = "ready";
      this.problem = null;
      this.pendingDefense = false;
    }
    get boss() { return this.enemy; }
    get incomingDamage() { return this.boss.damage + Math.min(this.rules.rageCap, this.turn * this.rules.rage); }
    choose(move) {
      if (this.phase !== "ready" || !Object.hasOwn(MOVES, move)) return false;
      this.move = move;
      this.problem = question(move, this.level, this.random, this.difficulty);
      this.phase = "attack";
      return true;
    }
    submit(value) {
      if (!["attack", "defense"].includes(this.phase)) return null;
      const text = String(value).trim();
      if (!/^-?\d+$/.test(text) || !Number.isSafeInteger(Number(text))) return null;
      const correct = Number(text) === this.problem.answer;
      const result = { correct, solution: `${this.problem.text} = ${this.problem.answer}`, damage: 0, target: null };
      if (this.phase === "attack") {
        this.turn++;
        if (correct) {
          result.damage = Math.min(this.bossHp, this.moves[this.move].damage);
          result.target = "enemy";
          this.bossHp -= result.damage;
        }
        if (this.bossHp === 0) {
          this.phase = this.isFinal ? "won" : "boss-defeated";
          this.pendingDefense = false;
        } else {
          this.pendingDefense = !correct || this.turn % this.boss.every === 0;
          this.phase = "feedback";
        }
      } else {
        if (!correct) {
          result.damage = Math.min(this.hp, this.incomingDamage);
          result.target = "hero";
          this.hp -= result.damage;
        }
        this.pendingDefense = false;
        this.phase = this.hp === 0 ? "lost" : "feedback";
      }
      this.lastResult = result;
      return result;
    }
    advance() {
      if (this.phase === "feedback") {
        this.phase = this.pendingDefense ? "defense" : "ready";
        this.problem = this.pendingDefense ? counterQuestion(this.level, this.random, this.difficulty) : null;
      } else {
        return false;
      }
      return true;
    }
  }

  window.MathBattle = { Battle, MOVES, BOSSES, DIFFICULTIES, movesFor, explainProblem, question, counterQuestion };
})();
