(() => {
'use strict';
const $app = document.getElementById('app');

/* ============ utilitaires ============ */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };
const vibrate = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch {} };
const clone = o => JSON.parse(JSON.stringify(o));

function toast(msg) {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}

function modal(html, wire) {
  const m = document.createElement('div');
  m.className = 'modal';
  m.innerHTML = `<div class="card">${html}</div>`;
  document.body.appendChild(m);
  m.addEventListener('click', e => { if (e.target === m) m.remove(); });
  if (wire) wire(m);
  return m;
}
function confirmBox(title, text, okLabel, onOk, danger) {
  modal(`<h3>${esc(title)}</h3><p>${esc(text)}</p>
    <button class="fab text ${danger ? 'pink' : ''}" id="ok">${esc(okLabel)}</button>
    <button class="fab text ghost" id="no">Cancelar</button>`, m => {
    m.querySelector('#no').onclick = () => m.remove();
    m.querySelector('#ok').onclick = () => { m.remove(); onOk(); };
  });
}

/* ============ constantes ============ */
const THEMES = [
  { id: 'arte',             label: 'Arte y literatura',      em: '🎨' },
  { id: 'entretenimiento',  label: 'Entretenimiento',        em: '🎬' },
  { id: 'deportes',         label: 'Deportes',               em: '🏀' },
  { id: 'historia',         label: 'Historia y política',    em: '🏛️' },
  { id: 'geografia',        label: 'Geografía y economía',   em: '🌍' },
  { id: 'gastronomia',      label: 'Gastronomía',            em: '🍔' },
  { id: 'ciencia',          label: 'Ciencia y tecnología',   em: '🧪' },
  { id: 'sociedad',         label: 'Sociedad y varios',      em: '🧩' },
];
const themeOf = id => THEMES.find(t => t.id === id) || { id, label: id, em: '❔' };
const COLORS = ['#fbb040', '#14d4c4', '#f42464', '#54b4fc'];
const DURATION = 60;
const KEYS = { settings: 'adivinueve_settings', seen: 'adivinueve_seen', teams: 'adivinueve_teams', bank: 'adivinueve_bank_v1' };

/* ============ iconos ============ */
const IC = {
  home: '<svg viewBox="0 0 24 24"><path d="M12 3 2 11.5h3V21h5.5v-6h3v6H19v-9.5h3z" fill="#fff"/></svg>',
  back: '<svg viewBox="0 0 24 24"><path d="M20 12H6M12 5l-7 7 7 7" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  skip: '<svg viewBox="0 0 28 24"><path d="M2.5 3v18L13 12zM14 3v18l10.5-9z" fill="#fff" stroke="#fff" stroke-width="2.4" stroke-linejoin="round"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M5 3.5v17L20 12z" fill="#fff" stroke="#fff" stroke-width="2.4" stroke-linejoin="round"/></svg>',
  pencil: '<svg viewBox="0 0 24 24"><path d="M3 21l1.2-5.2L16 4l4 4L8.2 19.8z" fill="#fff"/><path d="M14 6l4 4" stroke="#a64be8" stroke-width="1.6"/></svg>',
  scroll: '<svg viewBox="0 0 24 24"><path d="M7 3h12a2 2 0 0 1 2 2v1h-3v10a3 3 0 0 1-3 3H5a3 3 0 0 0 3-3V5a2 2 0 0 0-1-2z" fill="#fff"/><path d="M10 8h5M10 11h5M10 14h5" stroke="#f5b21f" stroke-width="1.5" stroke-linecap="round"/></svg>',
  sliders: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"><path d="M3 8h8M17 8h4M3 16h3M12 16h9"/><circle cx="14" cy="8" r="2.6"/><circle cx="9" cy="16" r="2.6"/></svg>',
  minus: '<svg viewBox="0 0 24 24"><path d="M6 12h12" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M6 12h12M12 6v12" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
  chev: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  bomb: '<svg viewBox="0 0 40 40"><circle cx="17" cy="24" r="13" fill="#4b4b52"/><ellipse cx="12" cy="19" rx="4.2" ry="2.6" fill="#7e7e89" transform="rotate(-30 12 19)"/><path d="M26 13c3-4 6-3 8-7" stroke="#e9b872" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M34 2l1.6 3.2 3.2 1.6-3.2 1.6L34 11.6l-1.6-3.2-3.2-1.6 3.2-1.6z" fill="#ffc84a"/></svg>',
  hold: '<svg class="ph" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#cf97f0"/><rect x="33" y="14" width="30" height="58" rx="5" fill="#2a2a2e"/><rect x="36" y="20" width="24" height="44" rx="2" fill="#fff"/><rect x="39" y="24" width="18" height="4" rx="2" fill="#c07af0"/><rect x="39" y="32" width="18" height="3" fill="#d8d8d8"/><rect x="39" y="38" width="13" height="3" fill="#d8d8d8"/><rect x="39" y="52" width="18" height="5" rx="2.5" fill="#e5265f"/><path d="M60 54c4-7 10-5 9 1l-3 11c-2 9-12 13-23 13-6 0-9 2-12 5l-5-5c4-6 10-9 17-9l10-1z" fill="#f9c6a0"/><path d="M24 84l15-13 11 17-13 12z" fill="#9a4fe0"/></svg>',
};

const LOGO = `
  <svg viewBox="0 0 200 215" style="width:30rem;height:32rem">
    <defs><radialGradient id="bg" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="#ffe796"/><stop offset="1" stop-color="#fbb040"/></radialGradient></defs>
    <g stroke="#f9b233" stroke-width="6" stroke-linecap="round"><path d="M100 6v16M50 24l9 12M150 24l-9 12"/></g>
    <path d="M100 40c-33 0-58 23-58 53 0 21 11 34 22 45 6 6 9 13 9 21h54c0-8 3-15 9-21 11-11 22-24 22-45 0-30-25-53-58-53z" fill="url(#bg)"/>
    <text x="100" y="122" text-anchor="middle" font-family="Quicksand,sans-serif" font-weight="700" font-size="92" fill="#fff">9</text>
    <rect x="68" y="166" width="64" height="9" rx="4.5" fill="#14d4c4"/><rect x="72" y="180" width="56" height="9" rx="4.5" fill="#14d4c4"/><rect x="82" y="194" width="36" height="9" rx="4.5" fill="#14d4c4"/>
  </svg>
  <div class="q" style="font-size:12.4rem;font-weight:700;line-height:1;background:linear-gradient(90deg,#f42464 0%,#fbb040 100%);-webkit-background-clip:text;background-clip:text;color:transparent;letter-spacing:.2rem">Adivinueve</div>`;

const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abdeg', 3: 'abcdg', 4: 'bcfg', 5: 'acdfg', 6: 'acdefg', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' };
const SEGP = { a: 'M5 3H17', b: 'M19 5V16', c: 'M19 20V31', d: 'M5 33H17', e: 'M3 20V31', f: 'M3 5V16', g: 'M5 18H17' };
function lcd(n) {
  const s = String(Math.max(0, n)).padStart(2, '0').slice(-2);
  return `<svg class="lcd" viewBox="0 0 48 36" fill="none" stroke="var(--team)" stroke-width="2.4" stroke-linecap="round">${
    [...s].map((d, i) => `<g transform="translate(${i * 25} 0)">${[...SEG[d]].map(k => `<path d="${SEGP[k]}"/>`).join('')}</g>`).join('')}</svg>`;
}

/* ============ estado ============ */
const BOMB_RATE = 50;
let S = Object.assign({ nTeams: 2, rounds: 5, themes: THEMES.map(t => t.id), same: false, jokers: false }, load(KEYS.settings, {}));
let teamCfg = load(KEYS.teams, []);
let G = null;
let timer = null, wake = null;
let BANK = null;

/* ============ banco de preguntas (guardado permanente) ============ */
function baseQuestions() { return clone(window.QBANK || []); }
function persistBank() { if (!save(KEYS.bank, BANK)) toast('⚠️ No se pudo guardar en este dispositivo'); }
function initBank() {
  const base = baseQuestions();
  let st = load(KEYS.bank, null);
  if (!st || !Array.isArray(st.items)) {
    st = { items: base, baseIds: base.map(q => q.id) };
  } else {
    const known = new Set(st.baseIds || []);
    st.baseIds = st.baseIds || [];
    base.forEach(q => { if (!known.has(q.id)) { st.items.push(q); st.baseIds.push(q.id); } });
  }
  BANK = st;
  persistBank();
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch {}
}

/* ============ lógica de partida ============ */
function usable(themes) { return BANK.items.filter(q => (!themes || themes.includes(q.t)) && q.a && q.a.length); }
function pickQuestion(themes, exclude) {
  const seen = new Set(load(KEYS.seen, []));
  let pool = usable(themes).filter(q => !exclude.includes(q.id));
  if (!pool.length) pool = usable(themes);
  if (!pool.length) pool = usable(null);
  if (!pool.length) return null;
  let fresh = pool.filter(q => !seen.has(q.id));
  if (!fresh.length) { pool.forEach(q => seen.delete(q.id)); fresh = pool; }
  const q = fresh[Math.floor(Math.random() * fresh.length)];
  seen.add(q.id);
  save(KEYS.seen, [...seen]);
  return q;
}

function buildCur(q, keep) {
  const items = q.a.map(([name, pts]) => ({ name, pts: Number(pts) || 0, trap: false }));
  items.sort((x, y) => x.name.localeCompare(y.name, 'es', { sensitivity: 'base' }));
  const hasTrap = !!(q.p && String(q.p).trim());
  const bomb = keep && typeof keep.bomb === 'boolean' ? keep.bomb : Math.random() * 100 < BOMB_RATE;
  if (hasTrap && bomb) {
    const tp = Number(q.tp);
    items.push({ name: String(q.p).trim(), pts: Number.isFinite(tp) && q.tp !== '' && q.tp != null ? tp : -5, trap: true });
  }
  return Object.assign({ qid: q.id, q: q.q, theme: q.t, items, found: new Set(), plus: false, mult: false, trapHit: false, bomb }, keep || {});
}
const realCount = c => c.items.filter(i => !i.trap).length;
function effPts(it) { return it.trap ? it.pts : (it.pts + (G.cur.plus ? 2 : 0)) * (G.cur.mult ? 2 : 1); }
function turnScore() {
  const c = G.cur;
  let s = 0;
  c.items.forEach((it, i) => { if (!it.trap && c.found.has(i)) s += effPts(it); });
  if (c.trapHit) { const t = c.items.find(i => i.trap); if (t) s += t.pts; }
  return s;
}

function newTurn(swap) {
  let themes = S.themes;
  if (S.same) {
    if (G.turn === 0 && !swap) G.roundTheme = themes[Math.floor(Math.random() * themes.length)];
    themes = [G.roundTheme];
  }
  if (swap && G.cur) themes = [G.cur.theme];
  const q = pickQuestion(themes, G.used);
  if (!q) return false;
  G.used.push(q.id);
  const keep = null;
  G.cur = buildCur(q, keep);
  return true;
}
function refreshCur() {
  const q = BANK.items.find(x => x.id === G.cur.qid);
  if (!q || !q.a.length) { newTurn(true); return; }
  G.cur = buildCur(q, { plus: G.cur.plus, mult: G.cur.mult, swapped: G.cur.swapped, bomb: G.cur.bomb });
}

/* ============ pantallas: base ============ */
function show(html) {
  $app.innerHTML = html;
  window.scrollTo(0, 0);
}
const on = (sel, fn) => { const el = $app.querySelector(sel); if (el) el.onclick = fn; };
const onAll = (sel, fn) => $app.querySelectorAll(sel).forEach(el => { el.onclick = e => fn(el, e); });
const setTeamColor = c => document.documentElement.style.setProperty('--team', c);
const hdr = (title, left, right, cls) => `
  <div class="hdr ${cls || ''}">${left || ''}<h1>${esc(title)}</h1>${right || ''}</div>`;
const backBtn = id => `<button class="circ sm" id="${id || 'back'}" aria-label="Atrás">${IC.back}</button>`;
const homeBtn = id => `<button class="circ sm" id="${id || 'home'}" aria-label="Inicio">${IC.home}</button>`;

/* ============ inicio ============ */
function screenHome() {
  stopTimer(); G = null; setTeamColor(COLORS[0]);
  show(`
  <div class="screen home">
    <button class="circ editfab" id="edit" aria-label="Editar preguntas">${IC.pencil}</button>
    <div class="hero"><div class="logo">${LOGO}</div><div class="go">¡VAMOS!</div></div>
    <div class="rays"></div>
    <div class="menu">
      <button class="pbtn" id="play">${IC.play}<span>JUGAR</span></button>
      <button class="pbtn yellow" id="rules">${IC.scroll}<span>REGLAS</span></button>
    </div>
    <div class="ver">beta · ${usable(null).length} preguntas</div>
  </div>`);
  on('#play', screenSettings);
  on('#rules', () => screenRules(0));
  on('#edit', screenEditor);
}

/* ============ reglas ============ */
function screenRules(start) {
  const titles = ['JUEGO MULTIJUGADOR', 'OBJETIVO DEL JUEGO', 'CÓMO JUGAR', 'EJEMPLO', 'COMODINES'];
  const handsIll = `<svg class="ill" viewBox="0 0 400 190"><path d="M0 150l60-60 40 26-48 66H0z" fill="#fbb040"/><path d="M60 92l22-16 14 20-18 18z" fill="#c396e9"/><path d="M92 82c10-14 28-14 34 0l20-10c6-6 14-2 12 6l-14 30c-8 12-34 14-52 4z" fill="#f9c6a0"/><rect x="190" y="30" width="70" height="120" rx="10" fill="#2a2a2e"/><rect x="197" y="44" width="56" height="88" rx="3" fill="#fff"/><rect x="205" y="54" width="40" height="8" rx="4" fill="#c07af0"/><rect x="205" y="70" width="40" height="6" fill="#d8d8d8"/><rect x="205" y="82" width="30" height="6" fill="#d8d8d8"/><rect x="205" y="110" width="40" height="9" rx="4.5" fill="#e5265f"/><path d="M400 150l-60-60-40 26 48 66h52z" fill="#14d4c4"/><path d="M340 92l-22-16-14 20 18 18z" fill="#c396e9"/><path d="M308 82c-8-12-26-12-32 0l-22 10c-8 4-6 14 2 14l24-6c14 6 28 4 32-2z" fill="#f9c6a0"/><path d="M168 76h-34m10-10l-10 10 10 10" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="translate(30 6)"/></svg>`;
  const slides = [
    `<div class="slide"><div class="txt" style="margin-top:12rem"><b>2 JUGADORES</b>son necesarios para jugar</div>${handsIll}
      <div class="card">El juego se juega en <b>un solo celular</b> que pasa de un equipo al otro después de cada turno</div></div>`,
    `<div class="slide"><div class="card" style="margin-top:6rem;font:700 7.2rem/1.1 'Quicksand',sans-serif;color:#000">Encuentra las<br><b style="font-size:9.6rem">9 RESPUESTAS</b><br>en 60 segundos<div class="bar2"><i></i></div></div>
      <div class="txt" style="margin-top:3rem">¡Cuidado con la respuesta trampa (falsa)!</div>
      <div class="bombs"><div style="width:11rem">${IC.bomb}</div><div style="width:18rem">${IC.bomb}</div><div style="width:11rem">${IC.bomb}</div></div>
      <div class="card" style="margin-top:4rem">El equipo que acumule <b>más puntos</b> gana la partida</div></div>`,
    `<div class="slide"><div class="card" style="margin-top:6rem;font-size:5rem;line-height:1.5">Cuando es el turno de un equipo, <b>un miembro del equipo contrario</b> toma el celular para leer la pregunta en voz alta y <b>validar</b> las respuestas</div>${handsIll}</div>`,
    `<div class="slide" style="gap:0"><div class="card exa">
        <div class="p t"><div class="nb">1</div><div class="bub">Juan lee la pregunta en voz alta</div><div class="face">😀</div></div>
        <div class="p o" style="flex-direction:row-reverse"><div class="nb" style="left:4rem">2</div><div class="bub">Sofía dice las respuestas en voz alta</div><div class="face" style="margin:0 auto 0 0">🤓</div></div>
        <div class="p t"><div class="nb">3</div><div class="bub">Juan valida las respuestas correctas de Sofía</div><div class="face">📱</div></div></div></div>`,
    `<div class="slide"><div class="card" style="margin-top:4rem;text-align:left;font-weight:500;font-size:4.2rem">Los comodines sirven para darle sabor al juego.<br><br>Hay 3 comodines en total. Cada uno se puede usar una vez por partida y por equipo, y solo uno por turno: no se pueden juntar.
        <div style="display:grid;gap:4rem;margin-top:5rem;font-weight:700">
          <div style="display:flex;align-items:center;gap:4rem"><div class="jk" style="width:20rem;height:20rem;flex:none;box-shadow:0 1rem 0 var(--strip);background:var(--purple)"><b style="color:#fff">+2</b></div>Suma 2 puntos a cada respuesta</div>
          <div style="display:flex;align-items:center;gap:4rem"><div class="jk" style="width:20rem;height:20rem;flex:none;box-shadow:0 1rem 0 var(--strip);background:var(--purple)"><b style="color:#fff">×2</b></div>Multiplica por 2 los puntos de cada respuesta</div>
          <div style="display:flex;align-items:center;gap:4rem"><div class="jk" style="width:20rem;height:20rem;flex:none;box-shadow:0 1rem 0 var(--strip);background:var(--purple)"><b style="color:#fff">🔄</b></div>Te da otra pregunta al azar del mismo tema</div>
        </div></div></div>`,
  ];
  show(`<div class="screen">
    ${hdr(titles[start || 0], homeBtn(), '', 'rt')}
    <div class="slides" id="sl">${slides.join('')}</div>
    <div class="dots">${slides.map((_, i) => `<i class="${i === (start || 0) ? 'on' : ''}"></i>`).join('')}</div>
  </div>`);
  const sl = $app.querySelector('#sl'), h1 = $app.querySelector('.hdr h1');
  h1.style.fontSize = '4.8rem';
  sl.scrollLeft = (start || 0) * sl.clientWidth;
  sl.addEventListener('scroll', () => {
    const i = Math.round(sl.scrollLeft / sl.clientWidth);
    h1.textContent = titles[i] || '';
    $app.querySelectorAll('.dots i').forEach((d, k) => d.classList.toggle('on', k === i));
  }, { passive: true });
  on('#home', screenHome);
}

/* ============ parámetros ============ */
function screenSettings() {
  show(`<div class="screen">
    ${hdr('PARÁMETROS DE JUEGO', backBtn(), '')}
    <div class="body">
      <div class="card">
        <div class="row"><div class="lbl">Número de equipos</div>
          <div class="step"><div class="b" data-k="nTeams" data-d="-1">${IC.minus}</div><div class="v" style="background:var(--orange)">${S.nTeams}</div><div class="b plus" data-k="nTeams" data-d="1">${IC.plus}</div></div></div>
        <div class="row"><div class="lbl">Número de rondas</div>
          <div class="step"><div class="b" data-k="rounds" data-d="-1">${IC.minus}</div><div class="v" style="background:var(--pink)">${S.rounds}</div><div class="b plus" data-k="rounds" data-d="1">${IC.plus}</div></div></div>
        <div class="row"><div class="lbl">Temas de preguntas <small>${S.themes.length}/${THEMES.length}</small></div><button class="sq" id="themes" aria-label="Temas">${IC.sliders}</button></div>        <div class="row" id="same" style="cursor:pointer"><div class="lbl">Mismo tema / ronda<span class="info" data-i="same">i</span></div><div class="sw ${S.same ? 'on' : ''}"></div></div>
        <div class="row" id="jok" style="cursor:pointer"><div class="lbl"><span style="font-size:5.4rem">🃏</span>Comodines<span class="info" data-i="jok">i</span></div><div class="sw ${S.jokers ? 'on' : ''}"></div></div>
      </div>
      <div style="flex:1"></div>
      <button class="fab" id="next" style="margin-top:6rem" ${S.themes.length ? '' : 'disabled'}>${IC.skip}</button>
    </div></div>`);
  on('#back', screenHome);
  onAll('.step .b', b => {
    const k = b.dataset.k, d = +b.dataset.d;
    const [min, max] = k === 'nTeams' ? [2, 4] : [1, 10];
    S[k] = Math.max(min, Math.min(max, S[k] + d)); save(KEYS.settings, S); screenSettings();
  });
  on('#themes', screenThemes);
  on('#same', e => { if (e.target.classList.contains('info')) return; S.same = !S.same; save(KEYS.settings, S); screenSettings(); });
  on('#jok', e => { if (e.target.classList.contains('info')) return; S.jokers = !S.jokers; save(KEYS.settings, S); screenSettings(); });
  onAll('.info', (el, e) => {
    e.stopPropagation();
    if (el.dataset.i === 'jok') return screenRules(4);
    modal(`<h3>Mismo tema / ronda</h3><p>Todos los equipos juegan el mismo tema en cada ronda, con preguntas distintas.</p><button class="fab text" id="ok">OK</button>`, m => { m.querySelector('#ok').onclick = () => m.remove(); });
  });
  on('#next', () => { teamStep = 0; screenTeams(); });
}

function screenThemes() {
  const all = S.themes.length === THEMES.length;
  show(`<div class="screen">
    ${hdr('TEMAS DE PREGUNTAS', backBtn(), '')}
    <div class="body"><div class="card">
      <div class="row theme" data-t="*"><div class="lbl">Todos los temas</div><div class="sw ${all ? 'on' : ''}"></div></div>
      ${THEMES.map(t => `<div class="row theme" data-t="${t.id}"><div class="lbl"><span class="em">${t.em}</span>${esc(t.label)}</div><div class="sw ${S.themes.includes(t.id) ? 'on' : ''}"></div></div>`).join('')}
    </div></div></div>`);
  on('#back', screenSettings);
  onAll('.row.theme', r => {
    const id = r.dataset.t;
    if (id === '*') S.themes = all ? [] : THEMES.map(t => t.id);
    else S.themes = S.themes.includes(id) ? S.themes.filter(x => x !== id) : [...S.themes, id];
    save(KEYS.settings, S); screenThemes();
  });
}

/* ============ equipos ============ */
let teamStep = 0;
function ensureTeams() {
  for (let i = 0; i < 4; i++) if (!teamCfg[i]) teamCfg[i] = { name: '', color: COLORS[i] };
  const used = new Set();
  for (let i = 0; i < S.nTeams; i++) {
    if (used.has(teamCfg[i].color)) teamCfg[i].color = COLORS.find(c => !used.has(c));
    used.add(teamCfg[i].color);
  }
}
function screenTeams() {
  ensureTeams();
  const i = teamStep, t = teamCfg[i], last = i === S.nTeams - 1;
  const taken = new Set(teamCfg.slice(0, i).map(x => x.color));
  show(`<div class="screen">
    ${hdr('EQUIPOS', backBtn(), '')}
    <div class="body"><div class="card tcard">
      <div class="cnt">${i + 1}/${S.nTeams}</div>
      <div class="lab">Elige el color del equipo</div>
      <div class="cols">${COLORS.map(c => `<button class="col ${t.color === c ? 'sel' : ''} ${taken.has(c) ? 'taken' : ''}" style="background:${c}" data-c="${c}" aria-label="color"></button>`).join('')}</div>
      <div class="lab l2">Escribe el nombre del equipo</div>
      <input class="tin" id="name" maxlength="18" placeholder="EQUIPO ${i + 1}" value="${esc(t.name)}" autocomplete="off">
      <div class="tbtns">${i > 0 ? `<button class="tbtn sm" id="prev">${IC.play.replace('<path', '<path transform="rotate(180 12 12)"')}</button>` : '<span></span>'}
        <button class="tbtn" id="nx">${last ? '¡LISTO!' : 'SIGUIENTE'}</button></div>
    </div></div></div>`);
  const sync = () => { t.name = $app.querySelector('#name').value.trim(); save(KEYS.teams, teamCfg); };
  on('#back', () => { sync(); if (i > 0) { teamStep--; screenTeams(); } else screenSettings(); });
  on('#prev', () => { sync(); teamStep--; screenTeams(); });
  onAll('.col', c => { sync(); t.color = c.dataset.c; save(KEYS.teams, teamCfg); screenTeams(); });
  on('#nx', () => { sync(); if (last) startGame(); else { teamStep++; ensureTeams(); screenTeams(); } });
}

/* ============ partida ============ */
function startGame() {
  ensureTeams();
  G = {
    round: 1, turn: 0, used: [], roundTheme: null, cur: null,
    teams: teamCfg.slice(0, S.nTeams).map((t, i) => ({ name: t.name || `Equipo ${i + 1}`, color: t.color, score: 0, jokers: { plus: true, mult: true, swap: true } })),
  };
  if (!newTurn(false)) { toast('No hay preguntas en los temas elegidos'); G = null; return screenHome(); }
  screenVS();
}

function screenVS() {
  const n = G.teams.length, d = 2.8, g = .55;
  const yk = k => k / n * 100;
  const bands = G.teams.map((t, i) => {
    const tl = i === 0 ? 0 : yk(i) + d + g, tr = i === 0 ? 0 : yk(i) - d + g;
    const bl = i === n - 1 ? 100 : yk(i + 1) + d - g, br = i === n - 1 ? 100 : yk(i + 1) - d - g;
    const mid = (yk(i) + yk(i + 1)) / 2;
    return `<div class="band" style="background:${t.color};clip-path:polygon(0 ${tl}%,100% ${tr}%,100% ${br}%,0 ${bl}%)"><span style="position:absolute;left:0;right:0;top:${mid}%;transform:translateY(-50%);padding:0 6rem">${esc(t.name)}</span></div>`;
  }).join('');
  const badges = Array.from({ length: n - 1 }, (_, k) => `<div class="badge" style="top:${yk(k + 1)}%">VS</div>`).join('');
  show(`<div class="vs">${bands}${badges}</div>`);
  const go = () => { if ($app.querySelector('.vs')) screenIntro(); };
  $app.querySelector('.vs').onclick = go;
  setTimeout(go, 1900);
}

const holderOf = i => (i + 1) % G.teams.length;
const teamTxt = t => `<span style="color:${t.color === '#fbb040' ? '#e79a1f' : t.color}">${esc(t.name)}</span>`;

function screenIntro() {
  const team = G.teams[G.turn], holder = G.teams[holderOf(G.turn)], th = themeOf(G.cur.theme);
  setTeamColor(team.color);
  const J = team.jokers, c = G.cur;
  const busy = c.plus || c.mult || c.swapped;
  const dis = (k, avail) => (busy && !c[k]) || (!avail && !c[k]) ? 'disabled' : '';
  const jokers = S.jokers ? `<div class="slot">
      <button class="jk ${c.plus ? 'on' : ''}" id="jp" ${dis('plus', J.plus)}><b>+2</b><small>por respuesta</small></button>
      <button class="jk ${c.mult ? 'on' : ''}" id="jm" ${dis('mult', J.mult)}><b>×2</b><small>puntos dobles</small></button>
      <button class="jk ${c.swapped ? 'on' : ''}" id="js" ${c.swapped ? 'disabled' : dis('swapped', J.swap)}><b>🔄</b><small>otra del mismo tema</small></button></div>` : '<div style="height:26.3rem"></div>';
  show(`<div class="screen">
    <div class="topbar"><button class="circ l" id="quit" aria-label="Inicio">${IC.home}</button><div class="pill">${esc(team.name)}</div><button class="circ r" id="edq" aria-label="Editar pregunta">${IC.pencil}</button></div>
    <div class="intro">
      <div class="rnd"><i>${th.em}</i>RONDA ${G.round}/${S.rounds}</div>
      <div class="qtext">${esc(G.cur.q)}</div>
      <div class="go">¡A jugar!</div>
      <button class="pbtn" id="go">${IC.play}<span>JUGAR</span></button>
    </div>
    ${jokers}
    <div class="hold">${IC.hold}<p>${teamTxt(holder)} tiene el celular.<br>${teamTxt(team)} responde la pregunta.</p></div>
  </div>`);
  on('#quit', confirmQuit);
  on('#go', screenPlay);
  on('#edq', () => editQuestion(G.cur.qid, () => { refreshCur(); screenIntro(); }));
  on('#jp', () => toggleJoker('plus'));
  on('#jm', () => toggleJoker('mult'));
  on('#js', () => { team.jokers.swap = false; newTurn(true); G.cur.swapped = true; screenIntro(); });
}
function toggleJoker(kind) {
  const team = G.teams[G.turn];
  if (!G.cur[kind] && (G.cur.plus || G.cur.mult || G.cur.swapped)) return;
  if (G.cur[kind]) { G.cur[kind] = false; team.jokers[kind] = true; }
  else if (team.jokers[kind]) { G.cur[kind] = true; team.jokers[kind] = false; }
  screenIntro();
}
function confirmQuit() {
  confirmBox('¿Salir de la partida?', 'Se perderá el progreso.', 'SALIR', () => { stopTimer(); G = null; screenHome(); }, true);
}

function screenPlay() {
  const team = G.teams[G.turn], c = G.cur;
  setTeamColor(team.color);
  show(`<div class="screen">
    <div class="topbar"><button class="circ l" id="quit" aria-label="Inicio">${IC.home}</button><div class="pill">${esc(team.name)}</div></div>
    <div class="board">
      <div class="qhead"><div class="qtext">${esc(c.q)}</div>
        <div class="timer"><div id="lcd">${lcd(DURATION)}</div><div class="bar" id="bar"><i id="fill"></i></div></div></div>
      <div class="rows">${c.items.map((it, i) => `
        <button class="ans ${it.trap ? 'trap' : ''}" data-i="${i}">${it.trap ? IC.bomb : ''}<span class="t">${esc(it.name)}</span><span class="p">${effPts(it)}</span></button>`).join('')}</div>
    </div>
    <button class="fab" id="skip" aria-label="Terminar turno">${IC.skip}</button>
  </div>`);
  on('#quit', confirmQuit);
  on('#skip', finishTurn);
  onAll('.ans', tapAnswer);
  startTimer();
}

function tapAnswer(el) {
  const i = +el.dataset.i, c = G.cur, it = c.items[i];
  if (it.trap) {
    c.trapHit = !c.trapHit;
    el.classList.remove('hit'); void el.offsetWidth;
    el.classList.toggle('hit', c.trapHit);
    if (c.trapHit) vibrate([60, 40, 90]);
    return;
  }
  if (c.found.has(i)) { c.found.delete(i); el.classList.remove('on'); }
  else {
    c.found.add(i); el.classList.add('on'); vibrate(20);
    if (c.found.size === realCount(c)) setTimeout(() => { if (timer) finishTurn(); }, 600);
  }
}

function startTimer() {
  stopTimer();
  const end = Date.now() + DURATION * 1000;
  requestWake();
  let shown = DURATION;
  const tick = () => {
    const left = Math.max(0, (end - Date.now()) / 1000);
    const fill = document.getElementById('fill');
    if (!fill) { stopTimer(); return; }
    const sec = Math.ceil(left);
    if (sec !== shown) { shown = sec; document.getElementById('lcd').innerHTML = lcd(sec); }
    fill.style.width = (left / DURATION * 100) + '%';
    document.getElementById('bar').classList.toggle('low', left <= 10);
    if (left <= 0) finishTurn();
  };
  timer = setInterval(tick, 200);
}
function stopTimer() {
  if (timer) { clearInterval(timer); timer = null; }
  if (wake) { try { wake.release(); } catch {} wake = null; }
}
async function requestWake() { try { if (navigator.wakeLock) wake = await navigator.wakeLock.request('screen'); } catch {} }

function finishTurn() {
  if (!timer) return;
  stopTimer(); vibrate(200);
  const delta = turnScore();
  G.teams[G.turn].score += delta;
  G.last = { delta, cur: G.cur };
  screenScores();
}

function screenScores() {
  const { delta, cur } = G.last;
  const max = Math.max(1, ...G.teams.map(t => t.score));
  const missed = cur.items.map((it, i) => ({ it, i })).filter(({ it, i }) => !it.trap && !cur.found.has(i));
  const trap = cur.items.find(i => i.trap);
  const lastTurn = G.turn === G.teams.length - 1, lastRound = G.round === S.rounds;
  show(`<div class="screen">
    <div class="hdr center" style="height:max(34.3rem,calc(env(safe-area-inset-top) + 24rem))"><h1>PUNTUACIONES</h1>
      <button class="circ sm" id="edq" style="position:absolute;right:4.3rem;bottom:8rem" aria-label="Editar pregunta">${IC.pencil}</button></div>
    <div class="body" style="padding-top:0">
      <div class="rtitle"><span style="color:#fff">RONDA ${G.round}/${S.rounds}</span><span style="color:#fff">${delta > 0 ? '+' : ''}${delta} PTS</span></div>
      ${G.teams.map(t => `<div class="sc" style="--c:${t.color}"><div class="n">${esc(t.name)}</div>
        <div class="l"><div class="tr"><i style="width:${Math.max(0, t.score) / max * 100}%"></i></div><div class="v">${t.score} PTS</div></div></div>`).join('')}
      ${cur.trapHit && trap ? `<div class="note">💥 Respuesta trampa: ${esc(trap.name)} (${trap.pts})</div>` : ''}
      ${missed.length ? `<details class="missed"><summary>Ver ${missed.length} respuesta${missed.length > 1 ? 's' : ''} no encontrada${missed.length > 1 ? 's' : ''}</summary>
        <ul>${missed.map(({ it }) => `<li>${esc(it.name)} <span>(${effPts(it)})</span></li>`).join('')}</ul></details>` : '<div class="note">🔥 ¡Las encontraron todas!</div>'}
      <div style="flex:1"></div>
      <button class="fab" id="next" aria-label="Siguiente">${lastTurn && lastRound ? '<span style="font:700 5rem Quicksand;color:#fff">🏆</span>' : IC.skip}</button>
    </div></div>`);
  on('#edq', () => editQuestion(cur.qid, screenScores));
  on('#next', () => {
    if (lastTurn && lastRound) return screenEnd();
    if (lastTurn) { G.round++; G.turn = 0; } else G.turn++;
    if (!newTurn(false)) { toast('No hay más preguntas'); return screenEnd(); }
    screenIntro();
  });
}

function screenEnd() {
  const sorted = [...G.teams].sort((a, b) => b.score - a.score);
  const winners = sorted.filter(t => t.score === sorted[0].score);
  const max = Math.max(1, sorted[0].score);
  setTeamColor(winners[0].color);
  show(`<div class="screen">
    ${hdr('RESULTADO', '', '', 'center')}
    <div class="body" style="padding-top:0">
      <div class="rtitle" style="justify-content:center;font-size:6rem;height:24rem;padding-top:2rem;text-align:center;flex-direction:column;gap:1.6rem">
        <span style="font-size:9rem">🏆</span><span>${winners.length > 1 ? '¡Empate!' : esc(winners[0].name) + ' gana'}</span></div>
      ${sorted.map(t => `<div class="sc" style="--c:${t.color}"><div class="n">${esc(t.name)}</div>
        <div class="l"><div class="tr"><i style="width:${Math.max(0, t.score) / max * 100}%"></i></div><div class="v">${t.score} PTS</div></div></div>`).join('')}
      <div style="flex:1"></div>
      <div class="menu" style="margin-top:8rem;gap:5.4rem"><button class="pbtn" id="again">${IC.play}<span>OTRA VEZ</span></button>
      <button class="pbtn yellow" id="home">${IC.home}<span>INICIO</span></button></div>
    </div></div>`);
  on('#again', () => { G = null; screenSettings(); });
  on('#home', screenHome);
}

/* ============ editor de preguntas ============ */
const ED = { search: '', theme: 'all' };
function screenEditor() {
  stopTimer();
  const term = ED.search.trim().toLowerCase();
  const list = BANK.items.filter(q => (ED.theme === 'all' || q.t === ED.theme) &&
    (!term || q.q.toLowerCase().includes(term) || q.a.some(a => String(a[0]).toLowerCase().includes(term)) || String(q.p || '').toLowerCase().includes(term)));
  show(`<div class="screen">
    ${hdr('EDITOR', backBtn(), '')}
    <div class="body">
      <div style="padding:0 3.5rem">
        <input class="search" id="s" placeholder="Buscar pregunta o respuesta…" value="${esc(ED.search)}" autocomplete="off">
        <div class="chips"><button class="chip ${ED.theme === 'all' ? 'on' : ''}" data-t="all">Todos (${BANK.items.length})</button>
          ${THEMES.map(t => `<button class="chip ${ED.theme === t.id ? 'on' : ''}" data-t="${t.id}">${t.em} ${BANK.items.filter(q => q.t === t.id).length}</button>`).join('')}</div>
      </div>
      <button class="pbtn teal" id="new" style="margin-top:4rem;width:80rem;height:12rem;font-size:5rem">${IC.plus.replace('currentColor', '#fff')}<span>NUEVA PREGUNTA</span></button>
      <div class="card" style="margin-top:5rem">
        ${list.length ? list.map(q => `<button class="qrow" data-id="${esc(q.id)}"><span class="em">${themeOf(q.t).em}</span>
          <span class="qt"><span class="qq">${esc(q.q)}</span><span class="qm">${q.a.length} respuestas${q.p ? ' · 💣 ' + esc(q.p) : ''}</span></span><span class="go2">${IC.chev}</span></button>`).join('')
          : '<div class="empty">No hay preguntas que coincidan.</div>'}
      </div>
      <div class="tools">
        <button class="tool" id="exp">⬇️ Exportar copia</button>
        <button class="tool" id="imp">⬆️ Importar copia</button>
        <button class="tool danger full" id="rst">↺ Restaurar las preguntas originales</button>
      </div>
      <div class="note" style="font-size:2.8rem;opacity:.75;margin-bottom:4rem">Los cambios se guardan en este celular.</div>
    </div></div>`);
  on('#back', screenHome);
  const s = $app.querySelector('#s');
  s.oninput = () => { ED.search = s.value; const pos = s.selectionStart; screenEditor(); const n = $app.querySelector('#s'); n.focus(); n.setSelectionRange(pos, pos); };
  onAll('.chip', c => { ED.theme = c.dataset.t; screenEditor(); });
  onAll('.qrow', r => editQuestion(r.dataset.id, screenEditor));
  on('#new', () => editQuestion(null, screenEditor));
  on('#exp', exportBank);
  on('#imp', importBank);
  on('#rst', () => confirmBox('¿Restaurar originales?', 'Se borrarán TODOS tus cambios y las preguntas nuevas que creaste.', 'RESTAURAR', () => {
    const base = baseQuestions();
    BANK = { items: base, baseIds: base.map(q => q.id) }; persistBank(); save(KEYS.seen, []);
    toast('Preguntas restauradas'); screenEditor();
  }, true));
}

function exportBank() {
  const data = JSON.stringify({ app: 'adivinueve', version: 1, items: BANK.items }, null, 1);
  const name = 'adivinueve-preguntas-' + new Date().toISOString().slice(0, 10) + '.json';
  try {
    const file = new File([data], name, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file], title: 'Adivinueve' }).catch(() => {}); return; }
  } catch {}
  const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}
function importBank() {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'application/json,.json';
  inp.onchange = () => {
    const f = inp.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const j = JSON.parse(r.result);
        const items = Array.isArray(j) ? j : j.items;
        if (!Array.isArray(items) || !items.every(q => q && q.id && q.t && q.q && Array.isArray(q.a))) throw new Error('formato');
        confirmBox('¿Reemplazar preguntas?', `Se cargarán ${items.length} preguntas y se reemplazarán las actuales.`, 'IMPORTAR', () => {
          BANK = { items, baseIds: baseQuestions().map(q => q.id) }; persistBank(); toast('Importado ✓'); screenEditor();
        });
      } catch { toast('Archivo no válido'); }
    };
    r.readAsText(f);
  };
  inp.click();
}

let EF = null, EBACK = null;
function editQuestion(id, back) {
  const q = id ? BANK.items.find(x => x.id === id) : null;
  EF = q ? { id: q.id, t: q.t, q: q.q, a: q.a.map(x => [x[0], x[1]]), p: q.p || '', tp: Math.abs(q.tp ?? 5) || 5 }
         : { id: null, t: ED.theme !== 'all' ? ED.theme : THEMES[0].id, q: '', a: Array.from({ length: 9 }, () => ['', 1]), p: '', tp: 5 };
  EBACK = back || screenEditor;
  screenQEdit();
}
function syncEF() {
  const g = s => $app.querySelector(s);
  if (!g('#eq')) return;
  EF.q = g('#eq').value; EF.t = g('#et').value; EF.p = g('#ep').value; EF.tp = g('#etp').value;
  EF.a = [...$app.querySelectorAll('.arow')].map(r => [r.querySelector('.nm').value, r.querySelector('.pts').value]);
}
function screenQEdit() {
  const isNew = !EF.id;
  show(`<div class="screen">
    ${hdr(isNew ? 'NUEVA PREGUNTA' : 'EDITAR PREGUNTA', backBtn(), '')}
    <div class="body">
      <div class="card">
        <div class="fld"><div class="lab">Tema</div><select class="inp" id="et">${THEMES.map(t => `<option value="${t.id}" ${EF.t === t.id ? 'selected' : ''}>${t.em} ${esc(t.label)}</option>`).join('')}</select></div>
        <div class="fld"><div class="lab">Pregunta</div><textarea class="inp" id="eq" placeholder="Menciona 9…">${esc(EF.q)}</textarea></div>
        <div class="fld"><div class="lab">Respuestas y puntos (1 fácil · 2 · 5 difícil)</div>
          ${EF.a.map((a, i) => `<div class="arow"><input class="inp nm" placeholder="Respuesta ${i + 1}" value="${esc(a[0])}" autocomplete="off"><input class="inp pts" type="number" inputmode="numeric" value="${esc(a[1])}"><button class="x" data-i="${i}" aria-label="Quitar">✕</button></div>`).join('')}
          <button class="add" id="addA">＋ Añadir respuesta</button></div>
        <div class="fld" style="padding-bottom:4.4rem"><div class="trapbox" style="margin:0">
          <div class="lab">💣 Respuesta trampa (opcional)</div>
          <input class="inp" id="ep" placeholder="Una respuesta falsa pero creíble" value="${esc(EF.p)}" autocomplete="off">
          <div class="lab" style="margin-top:2.4rem">Puntos que se pierden</div>
          <input class="inp" id="etp" type="number" inputmode="numeric" value="${esc(EF.tp)}" style="width:20rem"></div></div>
      </div>
      <div class="savebar"><button class="pbtn teal" id="save">GUARDAR</button>${isNew ? '' : '<button class="pbtn sm" id="del" style="font-size:4.4rem">BORRAR</button>'}</div>
      <button class="cancel" id="cancel">Cancelar</button>
    </div></div>`);
  const back = () => { EBACK(); };
  on('#back', back); on('#cancel', back);
  on('#addA', () => { syncEF(); EF.a.push(['', 1]); screenQEdit(); const rs = $app.querySelectorAll('.arow .nm'); rs[rs.length - 1].focus(); });
  onAll('.arow .x', b => { syncEF(); EF.a.splice(+b.dataset.i, 1); screenQEdit(); });
  on('#save', () => {
    syncEF();
    const q = EF.q.trim();
    if (!q) return toast('Escribe la pregunta');
    const a = EF.a.map(([n, p]) => [String(n).trim(), Number(p) || 0]).filter(([n]) => n);
    if (!a.length) return toast('Añade al menos una respuesta');
    const tp = -Math.abs(Number(EF.tp) || 5);
    const obj = { id: EF.id || ('u' + Date.now().toString(36)), t: EF.t, q, a, p: EF.p.trim(), tp };
    const k = BANK.items.findIndex(x => x.id === obj.id);
    if (k >= 0) BANK.items[k] = obj; else BANK.items.push(obj);
    persistBank(); toast('Guardado ✓'); EBACK();
  });
  on('#del', () => confirmBox('¿Borrar la pregunta?', 'No se puede deshacer (salvo restaurando los originales).', 'BORRAR', () => {
    BANK.items = BANK.items.filter(x => x.id !== EF.id); persistBank(); toast('Pregunta borrada'); EBACK();
  }, true));
}

/* ============ arranque ============ */
initBank();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
screenHome();
})();
