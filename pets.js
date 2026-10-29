// Species are data; petSVG() is the single shared rig (body/head/ears/tail/paws/eyes/mouth + accessory layers).
const E = "#2b2540";
const AC = {
  hat: ["Party hat", 15],
  glasses: ["Round glasses", 20],
  bow: ["Bow", 15],
  scarf: ["Scarf", 25],
};
// Species = data only. One shared rig (petSVG) + one shared animation system.
const SP = {
  cat: {
    name: "Mochi",
    trait: "Curious",
    cost: 0,
    spd: 1,
    fur: "#f4a24c",
    dark: "#b8691f",
    belly: "#fff1dc",
    inner: "#ff9fb2",
    bw: 48,
    tox: "146px",
    toy: "152px",
    hat: [0, 0],
    bow: [132, 60],
    ear: (c) =>
      `<path d="M60 72L56 28L94 54Z" fill="${c.fur}" stroke="${c.fur}" stroke-width="7" stroke-linejoin="round"/><path d="M65 62L63 40L80 53Z" fill="${c.inner}"/>`,
    tail: (c) =>
      `<path d="M146 152C192 152 194 108 170 98" fill="none" stroke="${c.fur}" stroke-width="15" stroke-linecap="round"/>`,
    mark: (c) =>
      `<path d="M100 52v10M90 54l2 8M110 54l-2 8" stroke="${c.dark}" stroke-width="3" stroke-linecap="round"/>`,
    nose: (c) => `<path d="M96 94h8l-4 5z" fill="${c.inner}"/>`,
  },
  bunny: {
    name: "Clover",
    trait: "Bouncy",
    cost: 40,
    spd: 0.8,
    fur: "#efe6fa",
    dark: "#b79bdc",
    belly: "#ffffff",
    inner: "#ffb3cf",
    bw: 44,
    tox: "150px",
    toy: "162px",
    hat: [0, 4],
    bow: [128, 66],
    ear: (c) =>
      `<g transform="rotate(-10 78 66)"><ellipse cx="74" cy="34" rx="13" ry="33" fill="${c.fur}"/><ellipse cx="74" cy="38" rx="6" ry="23" fill="${c.inner}"/></g>`,
    tail: (c) => `<circle cx="150" cy="162" r="14" fill="#fff"/>`,
    mark: (c) =>
      `<ellipse cx="100" cy="100" rx="14" ry="9" fill="${c.belly}"/>`,
    nose: (c) =>
      `<ellipse cx="100" cy="95" rx="4.5" ry="3.2" fill="${c.inner}"/>`,
  },
  bear: {
    name: "Biscuit",
    trait: "Sleepy",
    cost: 80,
    spd: 1.35,
    fur: "#a9745a",
    dark: "#6f4636",
    belly: "#ecd2b8",
    inner: "#d99d86",
    bw: 52,
    tox: "148px",
    toy: "166px",
    hat: [0, 2],
    bow: [134, 58],
    ear: (c) =>
      `<circle cx="64" cy="56" r="16" fill="${c.fur}"/><circle cx="64" cy="58" r="8" fill="${c.inner}"/>`,
    tail: (c) => `<circle cx="150" cy="166" r="10" fill="${c.fur}"/>`,
    mark: (c) =>
      `<ellipse cx="100" cy="100" rx="19" ry="13" fill="${c.belly}"/>`,
    nose: (c) => `<ellipse cx="100" cy="95" rx="6" ry="4" fill="#3a2a2a"/>`,
  },
};
function petSVG(id, mini) {
  const c = SP[id],
    ear = (s) =>
      `<g class="ed ${s}"><g class="ear ${s}"><g${s == "r" ? ' transform="matrix(-1 0 0 1 200 0)"' : ""}>${c.ear(c)}</g></g></g>`;
  return `<svg viewBox="0 0 200 200" class="ps${mini ? " mini" : ""}" style="--tox:${c.tox};--toy:${c.toy}" aria-hidden="true">
<g class="tw"><g class="tail">${c.tail(c)}</g></g>
<g class="body"><ellipse cx="100" cy="142" rx="${c.bw}" ry="38" fill="${c.fur}"/><ellipse cx="100" cy="152" rx="${c.bw * 0.58}" ry="25" fill="${c.belly}"/></g>
<ellipse class="paw" cx="78" cy="176" rx="14" ry="9" fill="${c.fur}"/><ellipse class="paw" cx="122" cy="176" rx="14" ry="9" fill="${c.fur}"/>
<g class="acc scarf"><path d="M62 122Q100 146 138 122L136 138Q100 160 64 138Z" fill="#5b8def"/><path d="M116 142l6 26 15-4-6-26z" fill="#4a77d4"/><path d="M70 134l4-6M90 142l3-6M110 142l-3-6M128 134l-4-6" stroke="#fff" stroke-width="3" stroke-linecap="round"/></g>
<g class="hl"><g class="head">${ear("l")}${ear("r")}
<ellipse cx="100" cy="88" rx="46" ry="38" fill="${c.fur}"/>${c.mark(c)}
<ellipse cx="68" cy="99" rx="8" ry="5" fill="#ff8fab" opacity=".45"/><ellipse cx="132" cy="99" rx="8" ry="5" fill="#ff8fab" opacity=".45"/>
<g class="eyes"><g class="e-open"><circle cx="80" cy="88" r="7.5" fill="${E}"/><circle cx="120" cy="88" r="7.5" fill="${E}"/><circle cx="82.5" cy="85" r="2.6" fill="#fff"/><circle cx="122.5" cy="85" r="2.6" fill="#fff"/></g>
<path class="e-happy" d="M72 90Q80 78 88 90M112 90Q120 78 128 90" fill="none" stroke="${E}" stroke-width="3.5" stroke-linecap="round"/>
<path class="e-closed" d="M72 87Q80 94 88 87M112 87Q120 94 128 87" fill="none" stroke="${E}" stroke-width="3.5" stroke-linecap="round"/></g>
<path class="brow" d="M70 78L90 72M130 78L110 72" stroke="${E}" stroke-width="3" stroke-linecap="round"/>
<path class="tear" d="M74 98q-5 9 0 11q5-2 0-11z" fill="#7ec8ff"/>
${c.nose(c)}
<g class="mouth"><path class="m-smile" d="M100 99Q94 107 89 102M100 99Q106 107 111 102" fill="none" stroke="${E}" stroke-width="2.6" stroke-linecap="round"/>
<path class="m-open" d="M91 101Q100 118 109 101Z" fill="#7a2e2e" stroke="${E}" stroke-width="2" stroke-linejoin="round"/>
<path class="m-sad" d="M92 107Q100 99 108 107" fill="none" stroke="${E}" stroke-width="2.6" stroke-linecap="round"/>
<path class="m-flat" d="M94 103h12" stroke="${E}" stroke-width="2.6" stroke-linecap="round"/></g>
<g class="acc glasses" fill="rgba(160,210,255,.3)" stroke="${E}" stroke-width="3"><circle cx="80" cy="88" r="14"/><circle cx="120" cy="88" r="14"/><path d="M94 88h12"/></g>
<g transform="translate(${c.hat})"><g class="acc hat"><path d="M80 56L100 12L120 56Z" fill="#ff6f91"/><path d="M85 44h30M90 32h20" stroke="#fff" stroke-width="4"/><circle cx="100" cy="12" r="6" fill="#ffc24b"/></g></g>
<g transform="translate(${c.bow})"><g class="acc bow"><path d="M0 0L-17-11V11ZM0 0L17-11V11Z" fill="#ff6f91"/><circle r="5" fill="#e0446b"/></g></g>
</g></g></svg>`;
}
