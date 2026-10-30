(function () {
  "use strict";
  const { Battle, MOVES, BOSSES, DIFFICULTIES, movesFor, explainProblem } = window.MathBattle;
  const { World, REGIONS } = window.MathWorld;
  const pixels = window.MathPixels;
  const $ = id => document.getElementById(id);
  const testing = new URLSearchParams(location.search).has("test");
  const saveKey = "mathbound-save-v1";
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const directions = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const keyDirections = { arrowup: "up", w: "up", arrowdown: "down", s: "down", arrowleft: "left", a: "left", arrowright: "right", d: "right" };
  let saved;
  try { if (!testing) saved = JSON.parse(localStorage.getItem(saveKey)); } catch { /* Storage may be unavailable in private browsers. */ }
  let world = new World(saved), battle = null, target = null;
  let heldDirection = null, lastMove = 0, lastRoam = 0, lastFrame = 0, battleEffect = null;
  let badgeTimer, previousRegion = -1, saveFailed = false;
  let practiceFact = null, requiredPractice = false, practiceComplete = false;
  function createVisual() {
    return { x: world.x, y: world.y, moving: false, gait: 0, walkPhase: 0, facing: "down",
      camera: pixels.cameraAt(world.x, world.y), tracks: [],
      roamers: world.roamers.map(p => ({ x: p.x, y: p.y, moving: false, facing: "down" })) };
  }
  let visual = createVisual();
  const landscape = pixels.createLandscape();
  const worldContext = $("world").getContext("2d");
  const battleContext = $("battle-art").getContext("2d");
  const miniContext = $("mini-map").getContext("2d");

  function save() {
    if (!testing) {
      try { localStorage.setItem(saveKey, JSON.stringify(world.save())); saveFailed = false; }
      catch { saveFailed = true; }
    }
    $("save-status").textContent = saveFailed ? "SAVING UNAVAILABLE" : "ADVENTURE SAVED";
  }
  function say(message) { $("world-message").textContent = message; }
  function updatePowers() {
    const moves = battle ? battle.moves : movesFor(world.strongest);
    $("strongest").value = world.strongest;
    $("strongest").disabled = Boolean(battle) || !$("math-facts").hidden;
    $("open-facts").disabled = Boolean(battle) || !$("math-facts").hidden;
    $("open-facts").textContent = `Math Facts (${world.facts.length})`;
    $("power-description").textContent = `${MOVES[world.strongest].name} deals 34 damage. Other moves keep their relative order at 10, 16, and 24 damage. Change between battles.`;
    document.querySelectorAll("[data-move]").forEach(button => {
      button.classList.toggle("strongest", button.dataset.move === world.strongest);
      button.querySelector("b").firstChild.textContent = moves[button.dataset.move].damage;
    });
  }
  function updateWorld() {
    updatePowers();
    $("difficulty").value = world.difficulty;
    $("difficulty").disabled = Boolean(battle);
    $("mode-description").textContent = DIFFICULTIES[world.difficulty].description;
    $("world-hp").textContent = world.hp;
    $("sigil-count").textContent = `${world.sigils}/4 SIGILS`;
    $("region-name").textContent = REGIONS[world.region].name.toUpperCase();
    $("quest-list").replaceChildren(...REGIONS.slice(0, 4).map((region, i) => {
      const item = document.createElement("li");
      item.className = world.cleared.includes(i) ? "cleared" : "";
      const icon = document.createElement("span"); icon.className = "sigil-icon"; icon.textContent = region.symbol;
      const name = document.createElement("span"); name.className = "region-label"; name.textContent = region.name;
      const state = document.createElement("small"); state.textContent = world.cleared.includes(i) ? "SIGIL RECOVERED" : "GUARDIAN UNDEFEATED";
      name.append(state); item.append(icon, name); return item;
    }));
    $("citadel-status").textContent = world.champion ? "CROWN CLAIMED. YOU ARE THE CHAMPION!" : world.sigils === 4 ? "CITADEL OPEN! HEAD NORTH." : `CITADEL LOCKED \u00b7 ${world.sigils} / 4`;
    pixels.drawMap(miniContext, $("mini-map"), world, landscape);
    if (world.region !== previousRegion) {
      previousRegion = world.region;
      const badge = $("location-badge");
      badge.replaceChildren(document.createTextNode(REGIONS[world.region].name.toUpperCase()));
      const subtitle = document.createElement("small"); subtitle.textContent = REGIONS[world.region].hint;
      badge.append(subtitle); badge.classList.remove("faded");
      clearTimeout(badgeTimer); badgeTimer = setTimeout(() => badge.classList.add("faded"), 3200);
    }
    const near = world.nearby();
    $("interact").textContent = near?.type === "fountain" ? "Heal [E]" : near?.type === "boss" ? "Challenge [E]" : near?.type === "guide" ? "Talk [E]" : "Interact [E]";
  }
  function worldIsActive() { return !battle && $("math-facts").hidden && $("map-overlay").hidden && !$("reset-dialog").open; }
  function move(direction) {
    if (!worldIsActive()) return;
    const [dx, dy] = directions[direction];
    visual.facing = direction;
    const previous = { x: world.x, y: world.y, direction, time: performance.now() };
    if (!world.move(dx, dy)) return;
    visual.tracks.push(previous);
    if (visual.tracks.length > 80) visual.tracks.shift();
    updateWorld(); save();
    const encounter = world.encounter();
    if (encounter) interact(encounter);
  }
  function interact(near = world.nearby()) {
    if (!worldIsActive()) return;
    if (!near) { say(REGIONS[world.region].hint + " Walk next to a figure or fountain, then press E."); return; }
    if (near.type === "guide") {
      say("GUIDE: Follow the snowy paths! Pluswood is northwest, snow dunes northeast, frozen peaks southwest, icy coast southeast. Get four sigils, then head north to the citadel! The warm fountain west of me heals you. Change difficulty above between fights.");
    } else if (near.type === "fountain") {
      world.hp = 100; save(); updateWorld();
      say("The equation fountain restores all your HP! Tip: multiplication and division happen before addition and subtraction. Parentheses come first.");
    } else if (near.locked) {
      say(`The Zero Citadel is sealed. Find ${4 - world.sigils} more guardian sigil${world.sigils === 3 ? "" : "s"} to open the gate.`);
    } else {
      startBattle(near);
    }
  }
  function startBattle(encounter) {
    target = encounter;
    const roamer = encounter.type === "sentry" ? world.roamers[encounter.id] : null;
    const level = roamer ? roamer.level : encounter.id;
    const enemy = roamer ? { name: roamer.name, hp: 48 + level * 14, damage: 12 + level * 3, every: 1 } : BOSSES[level];
    battle = new Battle(Math.random, { level, hp: world.hp, enemy, difficulty: world.difficulty, strongest: world.strongest });
    updatePowers();
    battleEffect = null;
    heldDirection = null;
    $("overworld").hidden = true; $("battle").hidden = false;
    $("battle-location").textContent = roamer ? "ROAMING ENEMY" : REGIONS[level].name.toUpperCase() + " GUARDIAN";
    $("difficulty").disabled = true;
    $("battle-message").textContent = `${enemy.name} challenges you on ${battle.rules.name}! Counters every ${battle.boss.every} turn${battle.boss.every === 1 ? "" : "s"}. A missed attack always triggers a counter.`;
    $("damage-pop").textContent = "";
    renderBattle(); document.querySelector("[data-move]").focus();
  }
  function panel(label, title, description) {
    $("panel-label").textContent = label; $("panel-title").textContent = title; $("panel-description").textContent = description;
  }
  function renderBattle() {
    const { phase, boss, hp, bossHp } = battle;
    $("boss-name").textContent = boss.name;
    $("hero-hp").textContent = `${hp} / 100 HP`; $("boss-hp").textContent = `${bossHp} / ${boss.hp} HP`;
    $("hero-bar").style.width = hp + "%"; $("boss-bar").style.width = (bossHp / boss.hp * 100) + "%";
    $("hero-meter").setAttribute("aria-valuenow", hp);
    $("boss-meter").setAttribute("aria-valuemax", boss.hp); $("boss-meter").setAttribute("aria-valuenow", bossHp);
    $("battle-turn").textContent = `TURN ${battle.turn + 1} \u00b7 ENEMY ATK ${battle.incomingDamage}`;
    $("moves").hidden = phase !== "ready";
    $("question-panel").hidden = !["attack", "defense"].includes(phase);
    $("result-panel").hidden = !["feedback", "boss-defeated", "won", "lost"].includes(phase);
    $("input-error").textContent = "";
    if (phase === "ready") {
      panel("YOUR TURN", "Choose your move.", battle.rules.rage
        ? `${MOVES[world.strongest].name} is your strongest move. Enemies grow stronger each turn, so make every answer count.`
        : "Easy mode: small numbers, gentler enemies, and no enrage. Take your time!");
    } else if (phase === "attack" || phase === "defense") {
      const defending = phase === "defense";
      panel(defending ? "ENEMY COUNTERATTACK" : "SOLVE TO STRIKE", defending ? "Raise your math shield!" : `${MOVES[battle.move].name} attack!`,
        defending ? `Solve to block ${battle.incomingDamage} damage. Parentheses first; then multiply/divide; then add/subtract.` : `Answer correctly to deal ${battle.moves[battle.move].damage} damage. No timer. Think it through.`);
      $("equation").textContent = `${battle.problem.text} = ?`;
      $("answer-button").textContent = defending ? "Block!" : "Attack!";
      $("answer").value = ""; $("answer").focus();
    } else if (phase === "boss-defeated" || phase === "won") {
      panel(phase === "won" ? "THE CROWN IS YOURS" : "VICTORY", phase === "won" ? "You are the Mathbound champion!" : `${boss.name} defeated!`,
        target.type === "boss" ? `The guardian's sigil is yours. Recover ${battle.rules.bossHeal} HP and return to the snow.`
          : `The snowy path is safer! Recover ${battle.rules.sentryHeal} HP and keep exploring.`);
      $("result-detail").textContent = phase === "won" ? "All four sigils. All five guardians. A whole world saved by your brain." : battle.lastResult.solution;
      $("continue").textContent = "Return to the world";
    } else if (phase === "lost") {
      panel("DEFEATED, NOT FINISHED", "Back to the village.", "You keep your sigils. This enemy will be at full health for the rematch.");
      $("result-detail").textContent = `${battle.lastResult.solution}. The village fountain will help you recover.`;
      $("continue").textContent = "Recover at Origin Village";
    }
  }
  function leaveBattle() {
    const won = ["won", "boss-defeated"].includes(battle.phase);
    const enemyName = battle.boss.name;
    if (won) world.complete(target, battle.hp);
    else world.respawn();
    battle = null; target = null; heldDirection = null; battleEffect = null;
    visual = createVisual();
    $("battle").hidden = true; $("overworld").hidden = false;
    updateWorld(); save();
    say(won ? world.champion ? "CHAMPION! The King of Chaos has fallen. Every region is free. Keep exploring your world!" : `${enemyName} defeated! ${world.sigils}/4 sigils. ${world.sigils === 4 ? "The citadel is open! Follow the central road north." : "Explore another region, or visit the fountain to heal."}` : "You wake up in Origin Village with full HP. Your sigils are safe. Practice your math, then try the guardian again!");
    $("world").focus();
  }
  document.querySelectorAll("[data-move]").forEach(button => {
    button.addEventListener("click", () => { if ($("math-facts").hidden && battle?.choose(button.dataset.move)) renderBattle(); });
  });
  $("question-panel").addEventListener("submit", event => {
    event.preventDefault();
    if (!battle || !$("math-facts").hidden) return;
    const defending = battle.phase === "defense", result = battle.submit($("answer").value);
    if (!result) { $("input-error").textContent = "Enter a whole number, then try again."; $("answer").focus(); return; }
    const message = result.correct ? defending ? "Perfect block! No damage." : `Direct hit! ${result.damage} damage.` : defending ? `You took ${result.damage} damage!` : "Your attack missed!";
    renderBattle();
    if (battle.phase === "feedback") {
      panel(result.correct ? "WELL PLAYED" : "LEARN & FIGHT ON", message, battle.pendingDefense ? "The enemy is striking back. Get ready to solve a harder question!" : "You're still standing. Choose your next move.");
      $("result-detail").textContent = result.solution;
      $("continue").textContent = battle.pendingDefense ? "Defend yourself" : "Next move";
    }
    $("battle-message").textContent = `${message} ${result.solution}`;
    battleEffect = { start: performance.now(), kind: defending && result.correct ? "block" : !result.correct && !defending ? "miss" : "attack",
      target: result.target ?? (defending ? "hero" : "enemy"), move: defending ? "multiply" : battle.move };
    if (result.target) {
      const pop = $("damage-pop"); pop.textContent = `-${result.damage}`; pop.className = "";
      void pop.offsetWidth; pop.className = result.target === "hero" ? "player animate" : "animate";
    }
    if (!result.correct) {
      const fact = world.recordMiss(battle.problem);
      save();
      openFacts(fact, true);
    } else $("continue").focus();
  });
  $("continue").addEventListener("click", () => {
    if (!battle || !$("math-facts").hidden) return;
    if (["won", "lost", "boss-defeated"].includes(battle.phase)) { leaveBattle(); return; }
    battle.advance(); renderBattle();
    if (battle.phase === "ready") document.querySelector("[data-move]").focus();
  });
  function toggleMap() {
    if (battle || !$("math-facts").hidden || $("reset-dialog").open) return;
    $("map-overlay").hidden = !$("map-overlay").hidden; heldDirection = null;
    if (!$("map-overlay").hidden) {
      pixels.drawMap($("full-map").getContext("2d"), $("full-map"), world, landscape, true);
      $("close-map").focus();
    } else $("world").focus();
  }
  $("map-button").addEventListener("click", toggleMap); $("close-map").addEventListener("click", toggleMap);
  $("interact").addEventListener("click", () => interact());
  function showLesson(fact) {
    practiceFact = fact; practiceComplete = false;
    $("fact-lesson").hidden = !fact;
    $("close-facts").hidden = requiredPractice;
    $("practice-feedback").textContent = "";
    $("practice-form").hidden = !fact;
    if (!fact) return;
    $("fact-solution").textContent = `${fact.text} = ${fact.answer}`;
    $("fact-steps").replaceChildren(...explainProblem(fact).map(step => {
      const item = document.createElement("li"); item.textContent = step; return item;
    }));
    $("practice-question").textContent = `Your turn: ${fact.text} = ?`;
    $("practice-answer").value = "";
    $("practice-answer").focus();
  }
  function renderFactList() {
    $("fact-list").replaceChildren(...world.facts.slice().reverse().map(fact => {
      const button = document.createElement("button"); button.type = "button";
      button.textContent = `${fact.text} = ? \u00b7 ${fact.practiced ? "Practiced" : "Needs practice"}`;
      button.addEventListener("click", () => { if (!requiredPractice) showLesson(fact); });
      return button;
    }));
  }
  function openFacts(fact = null, required = false) {
    heldDirection = null; requiredPractice = required;
    $("overworld").hidden = true; $("battle").hidden = true; $("math-facts").hidden = false;
    $("facts-intro").textContent = required
      ? "Let's learn the problem you just missed. Read the steps, then answer it correctly to return. Your battle is paused. Practice mistakes cost no HP."
      : world.facts.length ? "Your missed problems are saved here. Choose a problem to learn and practice again. No HP or turns are used."
        : "No missed problems yet! If you miss a battle question, it will appear here with steps to help you learn.";
    $("fact-history").hidden = required;
    $("close-facts").textContent = battle ? "Return to battle" : "Return to the world";
    $("difficulty").disabled = true;
    renderFactList(); showLesson(fact); updatePowers();
    if (!fact) $("close-facts").focus();
  }
  $("open-facts").addEventListener("click", () => {
    if (!battle && $("math-facts").hidden && !$("reset-dialog").open) {
      $("map-overlay").hidden = true;
      openFacts();
    }
  });
  $("practice-form").addEventListener("submit", event => {
    event.preventDefault();
    if ($("math-facts").hidden || !practiceFact || practiceComplete) return;
    const value = $("practice-answer").value.trim();
    if (!/^-?\d+$/.test(value) || !Number.isSafeInteger(Number(value))) {
      $("practice-feedback").textContent = "Enter a whole number, then try again.";
      $("practice-answer").focus(); return;
    }
    if (Number(value) !== practiceFact.answer) {
      $("practice-feedback").textContent = "Not quite. Read the steps above and try again. No HP lost!";
      $("practice-answer").select(); return;
    }
    practiceFact.practiced = true; practiceComplete = true;
    save(); renderFactList(); updatePowers();
    $("practice-feedback").textContent = "You got it! Great practice. You're ready to keep going.";
    $("practice-form").hidden = true; $("close-facts").hidden = false; $("close-facts").focus();
  });
  $("close-facts").addEventListener("click", () => {
    if ($("math-facts").hidden || (requiredPractice && !practiceComplete)) return;
    requiredPractice = false; practiceFact = null;
    $("math-facts").hidden = true;
    if (battle) {
      $("battle").hidden = false;
      // Keep the existing feedback or defeat screen; practice never changes battle results.
      $("continue").focus();
    } else { $("overworld").hidden = false; $("world").focus(); }
    $("difficulty").disabled = Boolean(battle);
    updatePowers();
  });
  $("strongest").addEventListener("change", () => {
    if (battle || !$("math-facts").hidden || !Object.hasOwn(MOVES, $("strongest").value)) {
      $("strongest").value = world.strongest; return;
    }
    heldDirection = null; world.strongest = $("strongest").value;
    updatePowers(); save();
    say(`${MOVES[world.strongest].name} is now your strongest move: 34 damage! Your choice is saved.`);
  });
  $("difficulty").addEventListener("change", () => {
    if (battle || !$("math-facts").hidden || !Object.hasOwn(DIFFICULTIES, $("difficulty").value)) {
      $("difficulty").value = world.difficulty; return;
    }
    heldDirection = null; world.difficulty = $("difficulty").value;
    updateWorld(); save();
    say(`${DIFFICULTIES[world.difficulty].name} mode selected! ${DIFFICULTIES[world.difficulty].description} Your sigils and progress are safe.`);
  });
  document.addEventListener("keydown", event => {
    if (event.target.matches("input, textarea, select") || $("reset-dialog").open) return;
    const key = event.key.toLowerCase();
    if (battle || !$("math-facts").hidden) return;
    if (key === "m" || (key === "escape" && !$("map-overlay").hidden)) { event.preventDefault(); if (!event.repeat) toggleMap(); return; }
    if (!worldIsActive()) return;
    if (keyDirections[key]) {
      event.preventDefault();
      if (!event.repeat) { heldDirection = keyDirections[key]; move(heldDirection); lastMove = performance.now(); }
    } else if ((key === "e" || key === " ") && !event.target.matches("button, a")) {
      event.preventDefault(); if (!event.repeat) interact();
    }
  });
  document.addEventListener("keyup", event => { if (keyDirections[event.key.toLowerCase()] === heldDirection) heldDirection = null; });
  window.addEventListener("blur", () => { heldDirection = null; });
  document.addEventListener("visibilitychange", () => { heldDirection = null; });
  document.querySelectorAll("[data-dir]").forEach(button => {
    button.addEventListener("pointerdown", event => {
      event.preventDefault(); button.setPointerCapture(event.pointerId);
      heldDirection = button.dataset.dir; move(heldDirection); lastMove = performance.now();
    });
    for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) button.addEventListener(type, () => { heldDirection = null; });
    button.addEventListener("click", event => { if (event.detail === 0) move(button.dataset.dir); });
  });
  $("restart").addEventListener("click", () => { heldDirection = null; $("reset-dialog").showModal(); });
  $("cancel-reset").addEventListener("click", () => $("reset-dialog").close());
  $("confirm-reset").addEventListener("click", () => {
    const difficulty = world.difficulty, strongest = world.strongest;
    $("reset-dialog").close(); world = new World(); world.difficulty = difficulty;
    world.strongest = strongest; practiceFact = null; requiredPractice = false; practiceComplete = false;
    battle = null; target = null; battleEffect = null; previousRegion = -1;
    visual = createVisual(); heldDirection = null;
    $("battle").hidden = true; $("math-facts").hidden = true; $("overworld").hidden = false; $("map-overlay").hidden = true;
    updateWorld(); save(); say("A new snow adventure begins! Talk to the blue guide with E, then follow the snowy paths to the four guardians."); $("world").focus();
  });
  function frame(now) {
    const delta = Math.min(100, now - lastFrame); lastFrame = now;
    if (!$("math-facts").hidden) { requestAnimationFrame(frame); return; }
    if (worldIsActive() && heldDirection && now - lastMove > 125) { move(heldDirection); lastMove = now; }
    if (worldIsActive() && now - lastRoam > 1000) { world.roam(); lastRoam = now; updateWorld(); }
    if (battle) {
      pixels.drawBattle(battleContext, battle.level, reducedMotion ? 0 : now, reducedMotion ? null : battleEffect);
    } else {
      const oldX = visual.x, oldY = visual.y;
      visual.x = reducedMotion ? world.x : pixels.approach(visual.x, world.x, delta);
      visual.y = reducedMotion ? world.y : pixels.approach(visual.y, world.y, delta);
      const distance = Math.hypot(visual.x - oldX, visual.y - oldY);
      visual.moving = Math.abs(world.x - visual.x) + Math.abs(world.y - visual.y) > .025;
      visual.walkPhase += distance * Math.PI * 2;
      visual.gait = reducedMotion ? 0 : pixels.approach(visual.gait, visual.moving ? 1 : 0, delta, 14);
      const camera = pixels.cameraAt(visual.x, visual.y);
      for (const axis of ["x", "y"]) visual.camera[axis] = reducedMotion ? camera[axis] : pixels.approach(visual.camera[axis], camera[axis], delta, 9);
      world.roamers.forEach((p, i) => {
        const shown = visual.roamers[i], difference = p.x - shown.x;
        if (Math.abs(difference) > .02) shown.facing = difference > 0 ? "right" : "left";
        shown.x = reducedMotion ? p.x : pixels.approach(shown.x, p.x, delta, 12);
        shown.moving = Math.abs(shown.x - p.x) > .02;
      });
      visual.clock = now;
      pixels.drawWorld(worldContext, world, landscape, visual, reducedMotion ? 0 : now);
    }
    requestAnimationFrame(frame);
  }
  updateWorld();
  if (saved) say("Welcome back, wanderer! Your adventure continues. " + REGIONS[world.region].hint);
  if (world.champion) say("Welcome back, champion! The regions are free. Explore the world you saved.");
  save(); requestAnimationFrame(frame);
})();
