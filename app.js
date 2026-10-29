/* ============================================================
   Pocket Pals: game logic.  (pets.js = species + SVG rig, pet.css = animations)
   Sections: 1 data · 2 state, saving & sound · 3 animation state machine · 4 actions
             5 tray + mini-games · 6 shop, goals & naming · 7 pet card · 8 drawing the UI · 9 start-up
   ============================================================ */
const $ = (s, r = document) => r.querySelector(s),
  cl = (v) => Math.max(0, Math.min(100, v)),
  rnd = (n) => Math.random() * n;
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

/* ---------- 1. DATA ---------- */
// Food menu: cost in coins, h=hunger removed, j=joy gained, e=energy gained, xp/c = rewards
const FOODS = [
  { n: "Kibble", cost: 0, h: 25, j: 2, e: 0, xp: 3, c: 1 },
  { n: "Fish", cost: 5, h: 45, j: 8, e: 0, xp: 6, c: 0 },
  { n: "Cake", cost: 12, h: 20, j: 30, e: 10, xp: 8, c: 2 },
];
// One-time goals. S.q counts progress, S.qd lists the ones already paid out.
const QUESTS = [
  { id: "feed", t: "Feed 3 times", n: 3, r: 10 },
  { id: "play", t: "Play 3 times", n: 3, r: 10 },
  { id: "stars", t: "Catch 10 stars", n: 10, r: 15 },
  { id: "wear", t: "Wear an accessory", n: 1, r: 8 },
  { id: "pat", t: "Pat your pal 10 times", n: 10, r: 10 },
  { id: "nap", t: "Take a nap", n: 1, r: 8 },
  { id: "cake", t: "Share a cake", n: 1, r: 12 },
  { id: "fish", t: "Treat them to fish", n: 1, r: 8 },
  { id: "feed10", t: "Feed 10 times", n: 10, r: 20 },
  { id: "play10", t: "Play 10 times", n: 10, r: 20 },
  { id: "stars30", t: "Catch 30 stars", n: 30, r: 25 },
  { id: "best", t: "Catch 8 stars in one game", n: 8, r: 20 },
  { id: "shop", t: "Own 3 accessories", n: 3, r: 25 },
  { id: "level", t: "Reach level 3", n: 3, r: 30 },
  { id: "friend", t: "Unlock a new friend", n: 1, r: 30 },
  { id: "rich", t: "Save up 100 coins", n: 100, r: 30 },
  { id: "named", t: "Give your pal a name", n: 1, r: 10 },
  { id: "memo", t: "Win Memory Match", n: 1, r: 20 },
  { id: "memo3", t: "Win Memory Match 3 times", n: 3, r: 30 },
  { id: "share", t: "Make a pet card", n: 1, r: 15 },
];
const ASK = { hungry: "Feed me?", sad: "Play with me?", tired: "So sleepy…" }; // speech bubble per mood
const LABEL = {
  sleep: "is dreaming",
  hungry: "wants a snack",
  sad: "needs some fun",
  tired: "is sleepy",
  happy: "is glowing",
  ok: "is doing fine",
};

/* ---------- 2. STATE, SAVING & SOUND ---------- */
const KEY = "pocketpals_v1";
const DEF = () => ({
  v: 1,
  pet: "cat",
  unlocked: ["cat"],
  owned: [],
  eq: { cat: [], bunny: [], bear: [] },
  names: {},
  snd: true,
  born: Date.now(),
  hunger: 40,
  happy: 70,
  energy: 80,
  coins: 20,
  xp: 0,
  level: 1,
  sleep: false,
  q: {},
  qd: [],
  t: Date.now(),
});
function load() {
  try {
    const j = JSON.parse(localStorage.getItem(KEY));
    if (j && j.v === 1 && SP[j.pet]) {
      const d = DEF();
      return Object.assign(d, j, {
        eq: Object.assign(d.eq, j.eq || {}),
        names: Object.assign({}, j.names),
      });
    }
  } catch (e) {}
  return DEF();
}
function save() {
  S.t = Date.now();
  try {
    localStorage.setItem(KEY, JSON.stringify(S));
  } catch (e) {}
}
// Stats drift over time. k scales the speed (used for offline time).
function decay(s, k = 1) {
  s *= k;
  if (S.sleep) {
    S.energy = cl(S.energy + 0.35 * s);
    S.hunger = cl(S.hunger + 0.05 * s);
  } else {
    S.hunger = cl(S.hunger + 0.12 * s);
    S.energy = cl(S.energy - 0.05 * s);
    S.happy = cl(S.happy - (S.hunger > 70 ? 0.16 : 0.07) * s);
  }
}
let S = load();
decay(Math.min((Date.now() - S.t) / 1000, 28800), 0.3);
const nm = (id = S.pet) => S.names[id] || SP[id].name; // the pet's display name (custom name wins)

// Tiny synth: every sound is made with the browser's WebAudio, so there are no audio files to load.
let ax;
function tone(f, d = 0.12, type = "sine", v = 0.12, at = 0, to = 0) {
  if (!S.snd) return;
  try {
    ax = ax || new (window.AudioContext || window.webkitAudioContext)();
    if (ax.state === "suspended") ax.resume();
    const t = ax.currentTime + at,
      o = ax.createOscillator(),
      g = ax.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    to && o.frequency.exponentialRampToValueAtTime(to, t + d);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g);
    g.connect(ax.destination);
    o.start(t);
    o.stop(t + d + 0.05);
  } catch (e) {}
}
const notes = (a, d, type, v, gap) =>
  a.forEach((f, i) => tone(f, d, type, v, i * gap));
const SFX = {
  pop: () => tone(520, 0.09, "sine", 0.12, 0, 860),
  eat: () => {
    for (let i = 0; i < 5; i++)
      tone(150 + rnd(80), 0.07, "square", 0.05, i * 0.14, 70);
  },
  pat: () => notes([700, 940], 0.1, "triangle", 0.1, 0.08),
  play: () => notes([392, 523, 659], 0.12, "triangle", 0.11, 0.09),
  coin: () => notes([988, 1319], 0.12, "square", 0.06, 0.07),
  star: (n) =>
    tone(660 + Math.min(n || 0, 12) * 55, 0.14, "triangle", 0.14, 0, 1500),
  flip: () => tone(420, 0.06, "triangle", 0.09, 0, 640),
  match: () => notes([784, 1047], 0.14, "triangle", 0.12, 0.08),
  level: () => notes([523, 659, 784, 1047], 0.2, "triangle", 0.13, 0.1),
  goal: () => notes([659, 880, 1175], 0.16, "triangle", 0.12, 0.1),
  win: () =>
    notes([523, 659, 784, 659, 784, 1047], 0.16, "triangle", 0.12, 0.09),
  sleep: () => notes([392, 330, 262], 0.45, "sine", 0.09, 0.28),
  wake: () => notes([330, 392, 523], 0.18, "sine", 0.1, 0.1),
  unlock: () => notes([523, 784, 1047, 1319], 0.2, "sine", 0.11, 0.08),
  no: () => tone(210, 0.2, "sawtooth", 0.07, 0, 120),
};
const sfx = (k, a) => SFX[k] && SFX[k](a);

/* ---------- 3. ANIMATION STATE MACHINE ----------
   cur = the one temporary action running ('feed' | 'play' | 'happy' | null).
   act() starts one (cancelling any other) and endAct() always cleans up, so the pet returns to idle. */
const stage = $("#stage"),
  pet = $("#pet"),
  pa = $(".pa"),
  fx = $("#fx"),
  bowl = $("#bowl"),
  toys = $("#toys"),
  ring = $("#ring");
let cur = null,
  svg,
  T = [],
  zInt = 0,
  lastSig = "",
  trayOpts = [],
  gaming = false; // gaming = a mini-game round is in progress
const later = (f, ms) => T.push(setTimeout(f, ms)),
  clearT = () => {
    T.forEach(clearTimeout);
    T = [];
  };
function act(n, ms, start, end) {
  clearT();
  cur = n;
  pet.dataset.act = n;
  stage.dataset.busy = 1;
  start && start();
  later(() => {
    endAct();
    end && end();
  }, ms);
  render();
}
function endAct() {
  clearT();
  cur = null;
  gaming = false;
  pet.dataset.act = "";
  delete stage.dataset.busy;
  bowl.classList.remove("show");
  toys.classList.remove("on");
  $("#field").innerHTML = "";
  const sc = $("#score");
  sc.hidden = true;
  sc.style.top = sc.style.bottom = "";
  render();
}
// floating particle (heart, spark, text). Removes itself when its animation ends.
function pt(txt, cls, x, y, dx, dy, d) {
  const e = document.createElement("span");
  e.className = "pt " + cls;
  e.textContent = txt;
  e.style.cssText = `left:${x}%;top:${y}%;--dx:${dx}px;--dy:${dy}px;--d:${d}s`;
  while (fx.children.length > 24) fx.firstChild.remove();
  e.addEventListener("animationend", () => e.remove());
  fx.append(e);
}
const say = (t, x = 50) => {
  if (/^(Need|Not |Too |Finish)/.test(t)) sfx("no");
  pt(t, "fl", x, 34, 0, -100, 1.8);
};
// The pet's mood comes only from real stats. exOf() picks the face from mood + current action.
function mood() {
  if (S.sleep) return "sleep";
  if (S.hunger >= 70) return "hungry";
  if (S.happy < 30) return "sad";
  if (S.energy < 25) return "tired";
  return S.happy >= 75 && S.hunger < 40 ? "happy" : "ok";
}
function exOf() {
  if (S.sleep) return "sleep";
  if (cur === "feed") return "chew";
  if (cur === "happy" || cur === "play") return "happy";
  const m = mood();
  return m === "hungry" || m === "sad"
    ? "sad"
    : m === "tired"
      ? "tired"
      : "idle";
}

/* ---------- 4. ACTIONS ---------- */
const LOG = [];
function ev(t) {
  LOG.unshift(t);
  LOG.length = Math.min(LOG.length, 4);
  $("#log").innerHTML = LOG.map((x) => `<li>${esc(x)}</li>`).join("");
}
function reward(xp, co) {
  S.xp += xp;
  S.coins += co;
  setTimeout(() => say("+" + xp + " XP", co ? 36 : 50), 0);
  if (co) {
    setTimeout(() => say("+" + co + " coins", 64), 250);
    sfx("coin");
  }
  while (S.xp >= S.level * 25) {
    S.xp -= S.level * 25;
    S.level++;
    setTimeout(() => {
      say("Level up!");
      sfx("level");
    }, 650);
  }
}
function wake() {
  if (S.sleep) {
    S.sleep = false;
    syncSleep();
    sfx("wake");
  }
}
function burst(ms = 1500) {
  act("happy", ms, () => {
    for (let i = 0; i < 5; i++)
      later(
        () =>
          pt(
            i % 2 ? "♥" : "✦",
            i % 2 ? "hrt" : "spk",
            40 + rnd(20),
            40,
            rnd(80) - 40,
            -90 - rnd(40),
            1.5,
          ),
        i * 180,
      );
  });
}
function feed(f) {
  wake();
  if (S.hunger < 8) {
    say("Not hungry!");
    return;
  }
  if (S.coins < f.cost) {
    say("Need " + f.cost + " coins");
    return;
  }
  S.coins -= f.cost;
  S.hunger = cl(S.hunger - f.h);
  S.happy = cl(S.happy + f.j);
  S.energy = cl(S.energy + f.e);
  ev("Fed " + nm() + " " + f.n);
  reward(f.xp, f.c);
  bump("feed");
  bump("feed10");
  if (f.n === "Cake") bump("cake");
  if (f.n === "Fish") bump("fish");
  save();
  act(
    "feed",
    2800,
    () => {
      bowl.classList.add("show");
      later(() => sfx("eat"), 650);
      for (let i = 0; i < 6; i++)
        later(
          () =>
            pt("•", "crumb", 44 + rnd(14), 64, rnd(60) - 30, 45 + rnd(20), 1),
          700 + i * 330,
        );
      later(() => pt("Yum!", "fl", 50, 30, 0, -100, 1.9), 1000);
    },
    () => burst(1400),
  );
}
function play() {
  wake();
  if (S.energy < 15) {
    say("Too tired…");
    return;
  }
  S.happy = cl(S.happy + 22);
  S.energy = cl(S.energy - 14);
  S.hunger = cl(S.hunger + 8);
  ev("Played fetch with " + nm());
  reward(8, 4);
  bump("play");
  bump("play10");
  save();
  act("play", 2900, () => {
    sfx("play");
    toys.classList.add("on");
    for (let i = 0; i < 6; i++)
      later(
        () => pt("★", "spk", 35 + rnd(30), 40, rnd(120) - 60, -90, 1.3),
        400 + i * 380,
      );
  });
}
function toggleSleep() {
  if (gaming) {
    say("Finish the game first!");
    return;
  }
  closeTray();
  if (S.sleep) S.sleep = false;
  else {
    endAct();
    S.sleep = true;
    bump("nap");
  }
  sfx(S.sleep ? "sleep" : "wake");
  ev(S.sleep ? "Lights out" : "Rise and shine");
  syncSleep();
  render();
  save();
}
function syncSleep() {
  clearInterval(zInt);
  if (S.sleep) {
    const z = () => pt("Z", "zz", 58, 30, 16 + rnd(14), -75, 2.6);
    z();
    zInt = setInterval(z, 1500);
  }
}
function pat() {
  if (S.sleep) {
    toggleSleep();
    return;
  }
  if (cur && cur !== "happy") return;
  S.happy = cl(S.happy + 3);
  bump("pat");
  sfx("pat");
  burst(1500);
}

/* ---------- 5. TRAY + MINI-GAMES (star catch, memory match) ----------
   Feed and Play open bubbles above their button. Each option is {t:title, s:subtitle, no:dimmed?, go:function}. */
const TRAYS = {
  feed: () =>
    FOODS.map((f) => ({
      t: f.n,
      s: f.cost ? f.cost + " coins" : "free",
      no: S.coins < f.cost,
      go: () => feed(f),
    })),
  play: () => [
    { t: "Fetch", s: "quick fun", no: S.energy < 15, go: play },
    {
      t: "Star catch",
      s: "tap falling stars · 10s",
      no: S.energy < 10,
      go: starGame,
    },
    {
      t: "Memory match",
      s: "find the pairs · 30s",
      no: S.energy < 8,
      go: memoryGame,
    },
  ],
};
// The tray pops up as bubbles right above the dock button that opened it.
const TRAYBTN = { feed: "#bFeed", play: "#bPlay" };
function openTray(k) {
  if (gaming) {
    say("Finish the game first!");
    return;
  }
  const tray = $("#tray");
  if (tray.dataset.k === k) return closeTray();
  document.body.classList.remove("open");
  $("#bDeck").setAttribute("aria-expanded", false);
  trayOpts = TRAYS[k]();
  tray.dataset.k = k;
  tray.innerHTML = trayOpts
    .map(
      (o, i) =>
        `<button data-i="${i}" style="--i:${i}"${o.no ? ' class="no"' : ""}><b>${o.t}</b><small>${o.s}</small></button>`,
    )
    .join("");
  // place it centred above the button (kept inside the screen), then reveal
  const btn = $(TRAYBTN[k]),
    r = btn.getBoundingClientRect();
  tray.style.bottom = innerHeight - r.top + 8 + "px";
  tray.style.left = r.left + r.width / 2 + "px";
  const w = tray.offsetWidth;
  tray.style.left =
    Math.max(
      w / 2 + 8,
      Math.min(innerWidth - w / 2 - 8, r.left + r.width / 2),
    ) + "px";
  tray.classList.add("on");
  stage.dataset.tray = 1;
  sfx("pop");
  Object.entries(TRAYBTN).forEach(([id, s]) => {
    const b = $(s);
    b.classList.toggle("sel", id === k);
    b.setAttribute("aria-expanded", id === k);
  });
}
function closeTray() {
  $("#tray").classList.remove("on");
  delete $("#tray").dataset.k;
  delete stage.dataset.tray;
  Object.values(TRAYBTN).forEach((s) => {
    const b = $(s);
    b.classList.remove("sel");
    b.setAttribute("aria-expanded", false);
  });
}
$("#tray").onclick = (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  const o = trayOpts[b.dataset.i];
  closeTray();
  o.go();
};
// tap anywhere else (or resize / rotate) to dismiss the bubbles
document.addEventListener("pointerdown", (e) => {
  if (
    $("#tray").classList.contains("on") &&
    !e.target.closest("#tray,#bFeed,#bPlay")
  )
    closeTray();
});
addEventListener("resize", closeTray);

// Star catch: stars fall for 10 seconds. Stars are caught on pointer-DOWN (a falling target can slip away before a full click finishes).
function starGame() {
  wake();
  if (S.energy < 10) {
    say("Too tired…");
    return;
  }
  let got = 0,
    left = 10;
  const score = $("#score");
  act(
    "play",
    10500,
    () => {
      gaming = true;
      score.hidden = false;
      const show = () =>
        (score.textContent = "★ " + got + "  ·  " + left + "s");
      show();
      say("Tap the falling stars!");
      const tick = () => {
        left = Math.max(0, left - 1);
        show();
        later(tick, 1000);
      };
      later(tick, 1000);
      const drop = () => {
        const b = document.createElement("button");
        b.className = "star";
        b.textContent = "★";
        b.setAttribute("aria-label", "Catch star");
        b.style.left = 8 + rnd(84) + "%";
        b.style.animationDuration = 3.4 + rnd(1.4) + "s";
        b.addEventListener("animationend", () => b.remove());
        const grab = () => {
          if (b.dataset.c || !gaming) return;
          b.dataset.c = 1;
          got++;
          show();
          sfx("star", got);
          const r = fx.getBoundingClientRect(),
            q = b.getBoundingClientRect(),
            x = ((q.left + q.width / 2 - r.left) / r.width) * 100,
            y = ((q.top + q.height / 2 - r.top) / r.height) * 100;
          pt("+1", "spk", x, y, 0, -50, 0.9);
          for (let i = 0; i < 3; i++)
            pt("✦", "spk", x, y, rnd(80) - 40, -30 - rnd(40), 0.7);
          b.remove();
        };
        b.addEventListener("pointerdown", (e) => {
          e.preventDefault();
          grab();
        });
        b.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            grab();
          }
        });
        $("#field").append(b);
        later(drop, 550 + rnd(400));
      };
      drop();
    },
    () => {
      S.energy = cl(S.energy - 10);
      S.happy = cl(S.happy + Math.min(30, got * 3));
      ev("Caught " + got + " stars");
      reward(got * 2, got);
      bump("play");
      bump("play10");
      bump("stars", got);
      bump("stars30", got);
      setQ("best", Math.max(S.q.best || 0, got));
      if (got >= 5) sfx("win");
      save();
      burst(1500);
    },
  );
}

// Memory match: 8 cards (4 pairs), 30 seconds. Flip two at a time; matching pairs stay up. Finishing early wins.
function memoryGame() {
  wake();
  if (S.energy < 8) {
    say("Too tired…");
    return;
  }
  const SYM = [
    ["★", "#ffd36b"],
    ["♥", "#ff6f91"],
    ["✦", "#5ef0d4"],
    ["☾", "#b39bff"],
  ];
  const deck = SYM.concat(SYM).sort(() => Math.random() - 0.5);
  let open = [],
    found = 0,
    left = 30,
    lock = false,
    done = false;
  const score = $("#score");
  const show = () =>
    (score.textContent = "♥ " + found + "/4  ·  " + left + "s");
  const finish = () => {
    if (done) return;
    done = true;
    const won = found === 4;
    S.energy = cl(S.energy - 8);
    S.happy = cl(S.happy + found * 5 + (won ? 8 : 0));
    ev(won ? "Won Memory Match!" : "Matched " + found + " of 4 pairs");
    reward(found * 3 + (won ? 6 : 0), found + (won ? 3 : 0));
    bump("play");
    bump("play10");
    if (won) {
      bump("memo");
      bump("memo3");
      sfx("win");
    }
    save();
    burst(1500);
  };
  act(
    "play",
    30500,
    () => {
      gaming = true;
      score.hidden = false;
      score.style.top = "auto";
      score.style.bottom = "2%";
      show();
      say("Match the pairs!");
      const grid = document.createElement("div");
      grid.id = "memo";
      deck.forEach(([sym, col], i) => {
        const b = document.createElement("button");
        b.className = "card";
        b.style.setProperty("--c", col);
        b.style.animationDelay = i * 50 + "ms";
        b.setAttribute("aria-label", "Card " + (i + 1));
        b.innerHTML =
          '<span class="cb">?</span><span class="cf">' + sym + "</span>";
        b.onclick = () => {
          if (lock || b.classList.contains("up")) return;
          b.classList.add("up");
          sfx("flip");
          open.push([b, sym]);
          if (open.length < 2) return;
          const [[a, x], [d, y]] = open;
          open = [];
          lock = true;
          if (x === y)
            later(() => {
              a.classList.add("ok");
              d.classList.add("ok");
              found++;
              show();
              sfx("match");
              lock = false;
              if (found === 4)
                later(() => {
                  clearT();
                  endAct();
                  finish();
                }, 700);
            }, 350);
          else
            later(() => {
              a.classList.remove("up");
              d.classList.remove("up");
              lock = false;
            }, 750);
        };
        grid.append(b);
      });
      $("#field").append(grid);
      const tick = () => {
        left = Math.max(0, left - 1);
        show();
        later(tick, 1000);
      };
      later(tick, 1000);
    },
    finish,
  );
}

/* ---------- 6. SHOP, WARDROBE, GOALS & NAMING ---------- */
// bump = add progress; setQ = set progress to a value (for "reach / own" style goals)
function setQ(id, v) {
  const q = QUESTS.find((x) => x.id === id);
  if (!q) return;
  S.q[id] = v;
  if (S.q[id] >= q.n && !S.qd.includes(id)) {
    S.qd.push(id);
    S.coins += q.r;
    ev("Goal done: " + q.t);
    setTimeout(() => {
      say("Goal! +" + q.r + " coins");
      sfx("goal");
    }, 900);
  }
}
const bump = (id, n = 1) => setQ(id, (S.q[id] || 0) + n);
// goals that depend on the current state (also run at start-up so older saves get credit)
function syncGoals() {
  setQ("level", S.level);
  setQ("shop", S.owned.length);
  setQ("friend", S.unlocked.length - 1);
  setQ("rich", Math.max(S.q.rich || 0, S.coins));
}
function applyAcc() {
  S.eq[S.pet] = S.eq[S.pet] || [];
  Object.keys(AC).forEach((a) =>
    svg.classList.toggle("has-" + a, S.eq[S.pet].includes(a)),
  );
}
function mount(reveal) {
  endAct();
  const id = S.pet;
  pet.style.setProperty("--sp", SP[id].spd);
  pa.innerHTML = petSVG(id);
  svg = $("svg", pa);
  applyAcc();
  $("#name").textContent = nm();
  $("#nameIn").value = nm();
  $("#nameIn").placeholder = SP[id].name;
  if (reveal) {
    pa.classList.remove("reveal");
    void pa.offsetWidth;
    pa.classList.add("reveal");
    ring.classList.remove("go");
    void ring.offsetWidth;
    ring.classList.add("go");
    for (let i = 0; i < 6; i++)
      pt(
        "✦",
        "spk",
        50,
        55,
        Math.cos(i * 1.05) * 110,
        Math.sin(i * 1.05) * 90 - 30,
        1.4,
      );
  }
  render();
  save();
}
pa.addEventListener("animationend", (e) => {
  if (e.target === pa) pa.classList.remove("reveal");
});
function pick(id) {
  if (S.unlocked.includes(id)) {
    if (S.pet !== id) {
      S.pet = id;
      mount(false);
    }
    return;
  }
  const c = SP[id].cost;
  if (S.coins < c) {
    say("Need " + c + " coins");
    return;
  }
  S.coins -= c;
  S.unlocked.push(id);
  S.pet = id;
  sfx("unlock");
  ev("Unlocked " + nm(id));
  mount(true);
}
function wear(a) {
  const cost = AC[a][1],
    eq = S.eq[S.pet];
  let on;
  if (!S.owned.includes(a)) {
    if (S.coins < cost) {
      say("Need " + cost + " coins");
      return;
    }
    S.coins -= cost;
    S.owned.push(a);
    eq.push(a);
    on = true;
  } else {
    on = !eq.includes(a);
    on ? eq.push(a) : eq.splice(eq.indexOf(a), 1);
  }
  applyAcc();
  sfx("pop");
  if (on) {
    bump("wear");
    const el = $("." + a, svg);
    el.classList.remove("pop");
    void el.getBoundingClientRect();
    el.classList.add("pop");
    el.addEventListener("animationend", () => el.classList.remove("pop"), {
      once: true,
    });
    pt("✦", "spk", 50, 40, rnd(60) - 30, -60, 1.2);
  }
  save();
  render();
}
// Naming: an empty name goes back to the species name. Names are stored per pet.
function rename() {
  const v = $("#nameIn").value.trim().replace(/\s+/g, " ").slice(0, 12);
  if (v && v !== SP[S.pet].name) {
    S.names[S.pet] = v;
    bump("named");
    ev("Now called " + v);
    sfx("goal");
  } else {
    delete S.names[S.pet];
  }
  $("#name").textContent = nm();
  $("#nameIn").value = nm();
  save();
  render();
}

/* ---------- 7. PET CARD (a PNG you can download or share) ---------- */
const PAL = {
  ok: ["#ff9a6b", "#d6479b", "#3b2a8f"],
  happy: ["#ffd36b", "#ff6f91", "#7a3fc9"],
  hungry: ["#ff6a4d", "#b3173d", "#3a0f2e"],
  sad: ["#6d86ff", "#3b3f9e", "#14143a"],
  tired: ["#8a7cff", "#4a3b9a", "#1b1540"],
  sleep: ["#3c4fb8", "#231a5e", "#0b0a24"],
};
let cardBlob = null,
  cardUrl = "";
function rr(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
async function petCard() {
  // 1) the current pet as a standalone SVG image (page CSS does not apply there, so the few rules it needs are inlined; the face is always happy)
  const c = svg.cloneNode(true),
    NS = "http://www.w3.org/2000/svg";
  c.setAttribute("xmlns", NS);
  c.setAttribute("width", 760);
  c.setAttribute("height", 760);
  const st = document.createElementNS(NS, "style");
  st.textContent =
    ".e-happy,.e-closed,.m-open,.m-sad,.m-flat,.brow,.tear,.acc,.e-open{display:none}.e-happy{display:block}.has-hat .hat,.has-glasses .glasses,.has-bow .bow,.has-scarf .scarf{display:block}";
  c.insertBefore(st, c.firstChild);
  const url = URL.createObjectURL(
      new Blob([new XMLSerializer().serializeToString(c)], {
        type: "image/svg+xml;charset=utf-8",
      }),
    ),
    img = new Image();
  await new Promise((r) => {
    img.onload = img.onerror = r;
    img.src = url;
  });
  // 2) draw the card
  const W = 1080,
    H = 1350,
    cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const g = cv.getContext("2d"),
    P = PAL[mood()] || PAL.ok,
    F = '"Bricolage Grotesque","DM Sans",system-ui,sans-serif';
  let b = g.createLinearGradient(0, 0, W * 0.5, H);
  b.addColorStop(0, P[2]);
  b.addColorStop(1, "#0b0a1c");
  g.fillStyle = b;
  g.fillRect(0, 0, W, H);
  b = g.createRadialGradient(W / 2, 640, 20, W / 2, 640, 620);
  b.addColorStop(0, P[0]);
  b.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = b;
  g.fillRect(0, 0, W, H);
  b = g.createRadialGradient(0, H, 10, 0, H, 700);
  b.addColorStop(0, P[1]);
  b.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = b;
  g.fillRect(0, 0, W, H);
  g.textAlign = "center";
  const name = nm();
  let fs = 320;
  g.font = "800 " + fs + "px " + F;
  while (g.measureText(name.toLowerCase()).width > W - 80 && fs > 90) {
    fs -= 10;
    g.font = "800 " + fs + "px " + F;
  }
  g.fillStyle = "rgba(255,255,255,.14)";
  g.fillText(name.toLowerCase(), W / 2, 330);
  g.fillStyle = "rgba(0,0,0,.35)";
  g.beginPath();
  g.ellipse(W / 2, 1040, 280, 38, 0, 0, 7);
  g.fill();
  g.drawImage(img, W / 2 - 380, 290, 760, 760);
  URL.revokeObjectURL(url);
  g.fillStyle = "#fff";
  fs = 120;
  g.font = "800 " + fs + "px " + F;
  while (g.measureText(name).width > W - 140 && fs > 50) {
    fs -= 6;
    g.font = "800 " + fs + "px " + F;
  }
  g.fillText(name, W / 2, 1150);
  g.fillStyle = "rgba(255,247,240,.72)";
  g.font = "500 38px " + F;
  g.fillText(
    "Level " + S.level + "  ·  " + SP[S.pet].trait + " " + S.pet,
    W / 2,
    1208,
  );
  [
    ["belly", 100 - S.hunger, "#ffb347", "#ff4f6d"],
    ["joy", S.happy, "#ff7ac6", "#8f5bff"],
    ["energy", S.energy, "#5ef0d4", "#3d7bff"],
  ].forEach(([l, v, c1, c2], i) => {
    const x = 90 + i * 300,
      w = 270;
    g.textAlign = "left";
    g.fillStyle = "rgba(255,247,240,.7)";
    g.font = "700 26px " + F;
    g.fillText(l.toUpperCase(), x, 1262);
    g.fillStyle = "rgba(10,6,30,.5)";
    rr(g, x, 1276, w, 20, 10);
    g.fill();
    const lg = g.createLinearGradient(x, 0, x + w, 0);
    lg.addColorStop(0, c1);
    lg.addColorStop(1, c2);
    g.fillStyle = lg;
    rr(g, x, 1276, Math.max(20, (w * v) / 100), 20, 10);
    g.fill();
  });
  g.textAlign = "center";
  g.fillStyle = "rgba(255,247,240,.5)";
  g.font = "500 26px " + F;
  const days = Math.max(
    1,
    Math.ceil((Date.now() - (S.born || Date.now())) / 864e5),
  );
  g.fillText(
    "together for " + days + (days > 1 ? " days" : " day") + "  ·  pocket pals",
    W / 2,
    1330,
  );
  // 3) show it
  cardBlob = await new Promise((r) => cv.toBlob(r, "image/png"));
  if (!cardBlob) return;
  if (cardUrl) URL.revokeObjectURL(cardUrl);
  cardUrl = URL.createObjectURL(cardBlob);
  $("#cardImg").src = cardUrl;
  document.body.classList.remove("open");
  $("#bDeck").setAttribute("aria-expanded", false);
  $("#card").hidden = false;
  $("#cardX").focus();
  bump("share");
  sfx("unlock");
  save();
  render();
}
const closeCard = () => {
  $("#card").hidden = true;
};
function cardFile() {
  return new File(
    [cardBlob],
    "pocket-pals-" +
      nm()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-") +
      ".png",
    { type: "image/png" },
  );
}
function cardDownload() {
  const a = document.createElement("a");
  a.href = cardUrl;
  a.download = cardFile().name;
  document.body.append(a);
  a.click();
  a.remove();
}
async function cardShare() {
  if (!cardBlob) return;
  const f = cardFile();
  try {
    if (navigator.canShare && navigator.canShare({ files: [f] }))
      await navigator.share({
        files: [f],
        title: "Meet " + nm() + "!",
        text: nm() + " is level " + S.level + " in Pocket Pals",
      });
    else cardDownload();
  } catch (e) {
    /* share dialog dismissed */
  }
}

/* ---------- 8. DRAWING THE UI ---------- */
function panel() {
  const sig = JSON.stringify([
    S.pet,
    S.unlocked,
    S.owned,
    S.eq,
    S.names,
    S.coins,
    S.q,
    S.qd,
  ]);
  if (sig === lastSig) return;
  lastSig = sig; // only rebuild when something changed
  $("#pets").innerHTML = Object.entries(SP)
    .map(([id, c]) => {
      const own = S.unlocked.includes(id),
        on = S.pet === id;
      return `<button class="row${on ? " on" : ""}${own ? "" : " lock"}" data-pet="${id}">${petSVG(id, 1)}<span><b>${esc(nm(id))}</b><small>${c.trait}</small></span><em>${on ? "Active" : own ? "Select" : c.cost + " coins"}</em></button>`;
    })
    .join("");
  $("#acc").innerHTML = Object.entries(AC)
    .map(([a, [n, cost]]) => {
      const o = S.owned.includes(a),
        w = (S.eq[S.pet] || []).includes(a);
      return `<button class="sw${w ? " on" : ""}" data-acc="${a}" role="switch" aria-checked="${w}"><span>${n}</span><em>${w ? "Worn" : o ? "Owned" : cost + " coins"}</em><i></i></button>`;
    })
    .join("");
  $("#quests").innerHTML = QUESTS.map((q) => {
    const n = Math.min(S.q[q.id] || 0, q.n),
      d = S.qd.includes(q.id);
    return `<div class="goal${d ? " done" : ""}"><span>${q.t}</span><em>${d ? "Done" : n + "/" + q.n + " · " + q.r + " coins"}</em><i style="--p:${(n / q.n) * 100}%"></i></div>`;
  }).join("");
}
function render() {
  syncGoals();
  const m = mood();
  stage.dataset.mood = m;
  pet.dataset.ex = exOf();
  [100 - S.hunger, S.happy, S.energy].forEach((v, i) => {
    const b = $("#b" + i);
    b.style.setProperty("--v", v);
    b.dataset.l = v < 30 ? "low" : v < 60 ? "mid" : "ok";
    $("#n" + i).textContent = Math.round(v);
  });
  $("#coins").textContent = S.coins;
  $("#lvl").textContent = S.level;
  $("#xp").style.width = (S.xp / (S.level * 25)) * 100 + "%";
  if (ASK[m]) $("#askT").textContent = ASK[m];
  stage.toggleAttribute("data-ask", !!ASK[m]);
  $("#status").textContent = nm() + " " + LABEL[m];
  $("#bSleep span").textContent = S.sleep ? "Wake" : "Sleep";
  $("#bSnd").classList.toggle("off", !S.snd);
  $("#bSnd").setAttribute("aria-pressed", !!S.snd);
  panel();
}

/* ---------- 9. START-UP: buttons, keyboard, clock ---------- */
$("#bFeed").onclick = () => openTray("feed");
$("#bPlay").onclick = () => openTray("play");
$("#bSleep").onclick = toggleSleep;
$("#bDeck").onclick = () => {
  closeTray();
  const o = document.body.classList.toggle("open");
  $("#bDeck").setAttribute("aria-expanded", o);
};
$("#bClose").onclick = () => {
  document.body.classList.remove("open");
  $("#bDeck").setAttribute("aria-expanded", false);
};
$("#bSnd").onclick = () => {
  S.snd = !S.snd;
  save();
  render();
  sfx("pop");
};
$("#pets").onclick = (e) => {
  const b = e.target.closest("[data-pet]");
  b && pick(b.dataset.pet);
};
$("#acc").onclick = (e) => {
  const b = e.target.closest("[data-acc]");
  b && wear(b.dataset.acc);
};
$("#nameSave").onclick = rename;
$("#nameIn").onkeydown = (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    rename();
  }
};
$("#bCard").onclick = petCard;
$("#cardX").onclick = closeCard;
$("#cardDl").onclick = cardDownload;
$("#cardSh").onclick = cardShare;
$("#card").onclick = (e) => {
  if (e.target.id === "card") closeCard();
};
pet.onclick = pat;
pet.onkeydown = (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    pat();
  }
};
$("#reset").onclick = () => {
  if (confirm("Reset your pets and progress?")) {
    const snd = S.snd;
    S = DEF();
    S.snd = snd;
    syncSleep();
    closeTray();
    mount(true);
    lastSig = "";
  }
};
addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeTray();
    closeCard();
    document.body.classList.remove("open");
  }
  if (e.target.closest("button,input") || e.metaKey || e.ctrlKey) return;
  ({ f: () => openTray("feed"), p: () => openTray("play"), s: toggleSleep })[
    e.key.toLowerCase()
  ]?.();
});
// Clock: once a second, apply real elapsed time (so background tabs stay correct) and redraw.
let last = Date.now(),
  n = 0;
setInterval(() => {
  const now = Date.now(),
    dt = (now - last) / 1000;
  last = now;
  decay(dt, dt > 5 ? 0.3 : 1);
  n++;
  if (S.sleep && S.energy >= 100) toggleSleep();
  if (mood() === "happy" && !cur && !S.sleep && n % 8 === 0)
    pt("♥", "hrt", 55, 40, 10, -60, 1.6);
  render();
  if (n % 5 === 0) save();
}, 1000);
addEventListener("pagehide", save);
document.addEventListener("visibilitychange", () => document.hidden && save());
// keep the collection drawer below the top bar (so level & coins stay visible)
const setHud = () =>
  document.documentElement.style.setProperty(
    "--hud",
    $(".hud").offsetHeight + 4 + "px",
  );
setHud();
addEventListener("resize", setHud);
document.fonts && document.fonts.ready.then(setHud);
mount(false);
syncSleep();
