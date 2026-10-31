/* Macro brief core: shared helpers, Haver-style chart, navigation and module loader */
const ROUTES = { overview: 'ov', cpi: 'tree', pce: 'tree', ppi: 'tree', nfp: 'tree', retail: 'tree', gdp: 'gdp', ism: 'survey', spgi: 'survey', pulse: 'claims' };
const NAV = [['', [['overview', 'Overview']]], ['Inflation', [['cpi', 'CPI'], ['pce', 'PCE'], ['ppi', 'PPI']]], ['Labor', [['nfp', 'Payrolls'], ['pulse', 'Claims']]],
  ['Activity', [['retail', 'Retail'], ['gdp', 'GDP']]], ['Surveys', [['ism', 'ISM'], ['spgi', 'S&P PMI']]]];
const DK = ROUTES[location.hash.slice(1)] ? location.hash.slice(1) : 'overview', MOD = ROUTES[DK];
addEventListener('hashchange', () => location.reload());
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const f1 = v => v == null || !isFinite(v) ? 'n.a.' : (Math.abs(v) < 0.05 ? 0 : v).toFixed(1);
const sg = v => v == null ? 'n.a.' : (v > 0 ? '+' : '') + v.toFixed(1);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const mlab = m => MON[+m.slice(5) - 1];
// period helpers for monthly, quarterly and weekly axes
const perYear = s => /Q\d$/.test(s) ? 4 : s.length === 10 ? 52 : 12;
const subOf = s => /Q\d$/.test(s) ? +s.slice(-1) : +s.slice(5, 7);
const yearStart = (A, i) => i > 0 && A[i].slice(0, 4) !== A[i - 1].slice(0, 4);
const plab = s => /Q\d$/.test(s) ? `${s.slice(5)} ${s.slice(0, 4)}` : s.length === 10 ? `${MON[+s.slice(5, 7) - 1]} ${+s.slice(8)} ${s.slice(0, 4)}` : `${MON[+s.slice(5) - 1]} ${s.slice(0, 4)}`;
const mzh = m => `${+m.slice(0, 4)} 年 ${+m.slice(5)} 月`;
const store = { get(k) { try { return JSON.parse(localStorage.getItem('hvdemo.' + DK + '.' + k)); } catch (e) { return null; } },
                set(k, v) { try { localStorage.setItem('hvdemo.' + DK + '.' + k, JSON.stringify(v)); } catch (e) {} } };


/* ---------- Haver-style chart ---------- */
/* ---------- Haver-style chart ---------- */
function nice(lo, hi, n) {
  if (!isFinite(lo)) { lo = 0; hi = 1; }
  const span = hi - lo || Math.abs(hi) || 1, raw = span / n, p = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map(s => s * p).find(s => span / s <= n) || 10 * p;
  return { lo: Math.floor(lo / step) * step, hi: Math.ceil(hi / step) * step || step, step };
}
function ext(arrs, s, e) {
  let lo = Infinity, hi = -Infinity;
  for (const a of arrs) for (let i = s; i <= e; i++) if (a[i] != null) { lo = Math.min(lo, a[i]); hi = Math.max(hi, a[i]); }
  return [lo, hi];
}
const fmtT = (v, step) => (Math.abs(v) < 1e-9 ? 0 : v).toFixed(Math.abs(step * 10 - Math.round(step * 10)) > 1e-9 ? 2 : Math.abs(step - Math.round(step)) > 1e-9 ? 1 : 0);

function hv(el, o) {
  const W = o.W || 460, H = o.H || 330, pl = 40, pr = 40, pt = 50, pb = 46;
  const x0 = pl, x1 = W - pr, y0 = pt, y1 = H - pb;
  const MO = o.months || M, s = o.start, e = MO.length - 1, n = e - s;
  const xw = (x1 - x0) / (n + 1);
  const X = i => x0 + (i - s + 0.5) * xw;
  const axes = {};
  for (const side of ['L', 'R']) {
    const ss = o.series.filter(q => q.axis === side);
    if (!ss.length) continue;
    let [lo, hi] = ext(ss.map(q => q.v), s, e);
    if (o.bar || (lo > 0 && o.zero)) { lo = Math.min(lo, 0); hi = Math.max(hi, 0); }
    const t = nice(lo, hi, 5);
    axes[side] = { ...t, Y: v => y1 - (v - t.lo) / (t.hi - t.lo) * (y1 - y0) };
  }
  if (!axes.L) { axes.L = axes.R; o.series.forEach(q => q.axis = 'L'); delete axes.R; }
  const dual = !!axes.R, AL = axes.L;
  const sideCol = side => css(o.series.find(q => q.axis === side).c);
  let g = '';
  for (let v = AL.lo; v <= AL.hi + 1e-9; v += AL.step) {
    const y = AL.Y(v);
    g += `<line x1="${x0}" x2="${x1}" y1="${y}" y2="${y}" stroke="${css('--grid')}"/>`;
    g += `<text x="${x0 - 5}" y="${y + 3.5}" font-size="10" text-anchor="end" ${dual ? `style="fill:${sideCol('L')}"` : ''}>${fmtT(v, AL.step)}</text>`;
    if (!dual) g += `<text x="${x1 + 5}" y="${y + 3.5}" font-size="10">${fmtT(v, AL.step)}</text>`;
  }
  if (dual) for (let v = axes.R.lo; v <= axes.R.hi + 1e-9; v += axes.R.step)
    g += `<text x="${x1 + 5}" y="${axes.R.Y(v) + 3.5}" font-size="10" style="fill:${sideCol('R')}">${fmtT(v, axes.R.step)}</text>`;
  if (AL.lo < 0 && AL.hi > 0) g += `<line x1="${x0}" x2="${x1}" y1="${AL.Y(0)}" y2="${AL.Y(0)}" stroke="${css('--axis')}" stroke-width=".8"/>`;
  if (o.ref != null && o.ref > AL.lo && o.ref < AL.hi) g += `<line x1="${x0}" x2="${x1}" y1="${AL.Y(o.ref)}" y2="${AL.Y(o.ref)}" stroke="${css('--axis')}" stroke-dasharray="3 3" stroke-width=".8"/>`;
  for (let i = s; i <= e; i++) if (o.series.every(q => q.v[i] == null) && o.series.some(q => q.v.slice(0, i).some(v => v != null)))
    g += `<rect x="${X(i) - xw / 2}" y="${y0}" width="${xw}" height="${y1 - y0}" fill="${css('--shade')}"/>`;
  // x axis: works for months (YYYY-MM), quarters (YYYY-Qn) and weeks (YYYY-MM-DD)
  const ppy = perYear(MO[0]), short = n < (ppy === 4 ? 13 : ppy === 52 ? 20 : 30);
  for (let i = s; i <= e; i++) if (yearStart(MO, i))
    g += `<line x1="${X(i) - xw / 2}" x2="${X(i) - xw / 2}" y1="${y1}" y2="${y1 + 5}" stroke="${css('--axis')}"/>`;
  if (short) {
    for (let i = s; i <= e; i++) {
      const sub = subOf(MO[i]), lab = ppy === 52 ? (i === s || subOf(MO[i - 1]) !== sub ? MON[sub - 1] : '') : ppy === 4 ? 'Q' + sub : MON[sub - 1];
      if (lab && (ppy !== 12 || n < 12 || (sub - 1) % 3 === 0)) g += `<text x="${X(i)}" y="${y1 + 14}" font-size="9.5" text-anchor="middle">${lab}</text>`;
      if (yearStart(MO, i) || i === s) g += `<text x="${X(i)}" y="${y1 + 27}" font-size="10" text-anchor="${i === s ? 'start' : 'middle'}" font-weight="700">${MO[i].slice(0, 4)}</text>`;
    }
  } else {
    const yrs = [...new Set(MO.slice(s, e + 1).map(m => m.slice(0, 4)))];
    const pxPerYr = ppy * xw;
    const every = pxPerYr < 9 ? 5 : pxPerYr < 22 ? 2 : 1;
    yrs.forEach((yr, k) => {
      if ((yrs.length - 1 - k) % every) return;
      const idx = []; for (let i = s; i <= e; i++) if (MO[i].startsWith(yr)) idx.push(i);
      if (idx.length < ppy / 3) return;
      g += `<text x="${(X(idx[0]) + X(idx[idx.length - 1])) / 2}" y="${y1 + 15}" font-size="10.5" text-anchor="middle">${yr.slice(2)}</text>`;
    });
  }
  // series
  const nb = o.bar ? o.series.length : 0; let bk = 0;
  for (const q of o.series) {
    const A = axes[q.axis], col = css(q.c);
    if (o.bar) {
      const bw = Math.max(1, Math.min(28, xw * 0.72 / nb)), off = (bk - (nb - 1) / 2) * bw; bk++;
      for (let i = s; i <= e; i++) if (q.v[i] != null) {
        const ya = A.Y(Math.max(0, q.v[i])), yb = A.Y(Math.min(0, q.v[i]));
        g += `<rect x="${X(i) + off - bw / 2}" y="${ya}" width="${bw}" height="${Math.max(.6, yb - ya)}" fill="${col}"/>`;
      }
    } else {
      let d = '', pen = false;
      for (let i = s; i <= e; i++) {
        if (q.v[i] == null) { pen = false; continue; }
        d += (pen ? 'L' : 'M') + X(i).toFixed(1) + ' ' + A.Y(q.v[i]).toFixed(1); pen = true;
      }
      g += `<path d="${d}" fill="none" stroke="${col}" stroke-width="1.4" ${q.dash ? 'stroke-dasharray="4 2.5"' : ''} stroke-linejoin="round"/>`;
      if (n < 12) for (let i = s; i <= e; i++) if (q.v[i] != null) g += `<circle cx="${X(i)}" cy="${A.Y(q.v[i])}" r="2.6" fill="${col}"/>`;
    }
  }
  g += `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" fill="none" stroke="${css('--frame')}" stroke-width=".8"/>`;
  g += `<text x="${W / 2}" y="16" font-size="12.5" text-anchor="middle" style="fill:${css('--ink')}">${esc(o.title)}</text>`;
  g += `<text x="${W / 2}" y="31" font-size="11" text-anchor="middle" style="fill:${css('--ink')}">${esc(o.sub)}</text>`;
  o.series.forEach((q, k) => {
    const ly = y0 + 12 + k * 13, col = css(q.c);
    g += o.bar ? `<rect x="${x0 + 7}" y="${ly - 6}" width="12" height="7" fill="${col}"/>`
      : `<line x1="${x0 + 6}" x2="${x0 + 20}" y1="${ly - 3}" y2="${ly - 3}" stroke="${col}" stroke-width="1.6" ${q.dash ? 'stroke-dasharray="4 2.5"' : ''}/>`;
    g += `<text x="${x0 + 25}" y="${ly}" font-size="10" style="fill:${col}">${esc(q.name)}${q.nsa ? ' (NSA)' : ''}${dual ? ` (${q.axis})` : ''}</text>`;
  });
  g += `<text x="${x0 - 30}" y="${H - 4}" font-size="9.5">Source:  ${o.src || K.src}</text>`;
  g += `<line class="xh" y1="${y0}" y2="${y1}" stroke="${css('--axis')}" stroke-width=".6" visibility="hidden"/>`;
  g += `<rect class="hit" x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" fill="transparent"/>`;
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.title + ', ' + o.sub)}">${g}</svg><div class="tip"></div>`;
  const svg = el.querySelector('svg'), tip = el.querySelector('.tip'), xl = el.querySelector('.xh'), hit = el.querySelector('.hit');
  const move = ev => {
    const r = svg.getBoundingClientRect(), p = ev.touches ? ev.touches[0] : ev;
    const sx = (p.clientX - r.left) / r.width * W;
    const i = Math.max(s, Math.min(e, Math.floor(s + (sx - x0) / xw)));
    xl.setAttribute('x1', X(i)); xl.setAttribute('x2', X(i)); xl.setAttribute('visibility', 'visible');
    tip.innerHTML = `<b>${plab(MO[i])}</b><br>` + o.series.map(q =>
      `<span style="color:${css(q.c)}">■</span> ${esc(q.name)}: ${q.v[i] == null ? 'n.a.' : o.fmt ? o.fmt(q.v[i]) : (o.unit ? f1(q.v[i]) + o.unit : q.v[i].toFixed(1))}`).join('<br>');
    tip.style.display = 'block';
    const px = X(i) / W * r.width, tw = tip.offsetWidth;
    tip.style.left = (px + 14 + tw > r.width ? px - tw - 4 : px + 14) + 'px';
    tip.style.top = (y0 / H * r.height + 8) + 'px';
  };
  const out = () => { tip.style.display = 'none'; xl.setAttribute('visibility', 'hidden'); };
  hit.addEventListener('mousemove', move); hit.addEventListener('mouseleave', out);
  hit.addEventListener('touchstart', move, { passive: true }); hit.addEventListener('touchmove', move, { passive: true });
  hit.addEventListener('touchend', out);
  if (o.big) return;
  // click (or the corner button on touch screens) opens the same chart enlarged
  el.insertAdjacentHTML('beforeend', '<button type="button" class="zoom" aria-label="放大圖表" title="放大">⤢</button>');
  el.querySelector('.zoom').addEventListener('click', () => openChart(o));
  if (!matchMedia('(hover: none)').matches) { svg.style.cursor = 'zoom-in'; svg.addEventListener('click', () => openChart(o)); }
}
function closeChart() {
  const ov = document.getElementById('hvzoom'); if (!ov || ov.hidden) return;
  ov.hidden = true; ov.querySelector('.zc').innerHTML = ''; document.body.style.overflow = '';
}
function openChart(o) {
  let ov = document.getElementById('hvzoom');
  if (!ov) {
    ov = document.createElement('div'); ov.id = 'hvzoom'; ov.hidden = true;
    ov.innerHTML = '<div class="zbox" role="dialog" aria-modal="true" aria-label="放大圖表"><button type="button" class="zx" aria-label="關閉">✕</button><div class="zc"></div></div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', ev => { if (ev.target === ov || ev.target.closest('.zx')) closeChart(); });
    addEventListener('keydown', ev => { if (ev.key === 'Escape') closeChart(); });
  }
  const narrow = innerWidth < 700;
  ov.hidden = false; document.body.style.overflow = 'hidden';
  hv(ov.querySelector('.zc'), { ...o, W: narrow ? 460 : 900, H: narrow ? 400 : 520, big: true });
  ov.querySelector('.zx').focus();
}


/* ---------- series chart with picker (used by GDP, surveys, claims) ---------- */
// cat: [{ k, n, v, grp, u }] all on the same period axis; def: { title, sub, ids: [{ k, ax }], r, bar, ref }
const SC = {};
function seriesChart(id, o) {
  const el = document.getElementById(id), def = o.def, cat = o.cat, by = Object.fromEntries(cat.map(c => [c.k, c]));
  el.innerHTML = '<div class="plot"></div><div class="tb"></div><div class="pop" role="dialog" aria-label="Add series"><input type="search" placeholder="搜尋序列" aria-label="搜尋序列"><ul></ul><div class="ft">最多 4 條線；滿了會取代最後一條。Esc 關閉</div></div>';
  const st = Object.assign(structuredClone({ ids: def.ids, r: def.r }), store.get(id) || {});
  st.ids = st.ids.filter(x => by[x.k]); if (!(st.r in o.ranges)) st.r = def.r;
  const plot = el.querySelector('.plot'), tb = el.querySelector('.tb'), pop = el.querySelector('.pop'), inp = pop.querySelector('input'), ul = pop.querySelector('ul');
  const COL = ['--c1', '--c2', '--c3', '--c4'], N_ = o.months.length;
  const c = SC[id] = { st };
  c.draw = () => {
    const series = st.ids.map((x, k) => ({ name: by[x.k].n, v: by[x.k].v, c: COL[k], axis: x.ax || 'L', dash: by[x.k].dash }));
    const first = series.reduce((a, q) => { const f = q.v.findIndex(v => v != null); return Math.min(a, f < 0 ? N_ : f); }, N_);
    const back = o.ranges[st.r], start = Math.min(N_ - 2, back ? Math.max(first, N_ - back) : first);
    const same = JSON.stringify(st.ids.map(x => x.k)) === JSON.stringify(def.ids.map(x => x.k));
    const title = same ? def.title : st.ids.length === 1 ? by[st.ids[0].k].n : st.ids.length === 2 ? `${by[st.ids[0].k].n} vs. ${by[st.ids[1].k].n}` : def.title;
    const u0 = st.ids.length ? by[st.ids[0].k] : null;
    const nw = el.clientWidth < 560;
    hv(plot, { W: nw ? 460 : o.W, H: nw ? 330 : o.H, months: o.months, title: title.length > 62 ? def.title : title, sub: same ? def.sub : (u0 && u0.sub) || def.sub, start, bar: def.bar && same, ref: def.ref, fmt: o.fmt, src: o.src, series });
    tb.innerHTML = `<span class="seg" role="group" aria-label="Range">${Object.keys(o.ranges).map(k => `<button type="button" data-r="${k}" aria-pressed="${k === st.r}">${k}</button>`).join('')}</span>` +
      `<button type="button" class="rst" ${same && st.r === def.r && st.ids.every((x, k) => (x.ax || 'L') === (def.ids[k].ax || 'L')) ? 'hidden' : ''}>Reset</button>` +
      `<span class="chips">${st.ids.map((x, k) => `<span class="chip"><i style="background:${css(COL[k])}"></i><span>${esc(by[x.k].n)}</span>` +
      (st.ids.length > 1 ? `<button type="button" data-ax="${k}" title="切換左右軸">${x.ax === 'R' ? 'R' : 'L'}</button>` : '') +
      `<button type="button" data-rm="${k}" aria-label="Remove ${esc(by[x.k].n)}">✕</button></span>`).join('')}<button type="button" class="add" aria-haspopup="dialog">＋ Series</button></span>`;
  };
  const save = () => { store.set(id, { ids: st.ids, r: st.r }); c.draw(); };
  c.set = ids => { st.ids = ids; save(); };
  tb.addEventListener('click', ev => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.r) st.r = b.dataset.r;
    else if (b.dataset.rm != null) st.ids.splice(+b.dataset.rm, 1);
    else if (b.dataset.ax != null) { const x = st.ids[+b.dataset.ax]; x.ax = x.ax === 'R' ? 'L' : 'R'; }
    else if (b.classList.contains('rst')) { st.ids = structuredClone(def.ids); st.r = def.r; }
    else if (b.classList.contains('add')) { pop.style.display = 'block'; inp.value = ''; list(''); inp.focus(); return; }
    save();
  });
  let hits = [];
  const list = q => {
    q = q.trim().toLowerCase(); hits = []; let h = '', g0 = null;
    for (const x of cat) { if (q && !x.n.toLowerCase().includes(q) && !(x.zh || '').includes(q)) continue; if (x.grp !== g0) { g0 = x.grp; if (g0) h += `<li class="h">${esc(g0)}</li>`; } hits.push(x.k); h += `<li data-k="${esc(x.k)}">${esc(x.n)}</li>`; }
    ul.innerHTML = h || '<li class="h">沒有符合的序列</li>';
  };
  const addK = k => { pop.style.display = 'none'; if (st.ids.some(x => x.k === k)) return; if (st.ids.length >= 4) st.ids.pop(); st.ids.push({ k, ax: 'L' }); save(); };
  inp.addEventListener('input', () => list(inp.value));
  inp.addEventListener('keydown', ev => { if (ev.key === 'Escape') pop.style.display = 'none'; else if (ev.key === 'Enter' && hits.length) addK(hits[0]); });
  ul.addEventListener('click', ev => { const li = ev.target.closest('li[data-k]'); if (li) addK(li.dataset.k); });
  document.addEventListener('mousedown', ev => { if (!el.contains(ev.target)) pop.style.display = 'none'; });
  c.draw();
  return c;
}
// tiny sparkline for overview tables
function sparkline(arr, n = 24, ref = null) {
  const L_ = arr.length - 1, s = Math.max(0, L_ - n + 1); let lo = Infinity, hi = -Infinity;
  for (let t = s; t <= L_; t++) if (arr[t] != null) { lo = Math.min(lo, arr[t]); hi = Math.max(hi, arr[t]); }
  if (!isFinite(lo)) return '';
  const W = 72, H = 22, X = t => 2 + (t - s) / Math.max(1, L_ - s) * (W - 6), Yy = v => H - 3 - (v - lo) / ((hi - lo) || 1) * (H - 6);
  let d = '', pen = false, lt = s;
  for (let t = s; t <= L_; t++) { if (arr[t] == null) { pen = false; continue; } d += (pen ? 'L' : 'M') + X(t).toFixed(1) + ' ' + Yy(arr[t]).toFixed(1); pen = true; lt = t; }
  const r = ref != null && lo < ref && hi > ref ? `<line x1="2" x2="${W - 4}" y1="${Yy(ref)}" y2="${Yy(ref)}" stroke="var(--frame)" stroke-dasharray="2 2"/>` : '';
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true">${r}<path d="${d}" fill="none" stroke="var(--c1)" stroke-width="1.3"/><circle cx="${X(lt)}" cy="${Yy(arr[lt])}" r="2" fill="var(--c1)"/></svg>`;
}
const fmtDate = s => { const [y, m, d] = s.split('-'); return `${MON[+m - 1]} ${+d} ${y}`; };

/* ---------- page shell ---------- */
/* ---------- heatmap shading (Bloomberg ECAN style), shared by every table ---------- */
// Each cell is compared with its own series: centred on the 2016-2019 average (the pre-pandemic norm;
// the whole sample when that is too short) and scaled by the series' robust spread (1.4826 x median
// absolute deviation over all periods), so the 2020 swings do not wash the colours out.
function heatStat(a, D, upTo = a.length - 1) {
  const x = [], base = [];
  for (let t = 0; t <= upTo; t++) { const v = a[t]; if (v == null || !isFinite(v)) continue; x.push(v); if (D[t] >= '2016' && D[t] < '2020') base.push(v); }
  if (x.length < 16) return null;
  const med = q => { const b = [...q].sort((p, r) => p - r), k = b.length >> 1; return b.length % 2 ? b[k] : (b[k - 1] + b[k]) / 2; };
  const ref = base.length >= 12 ? base : x, mu = ref.reduce((p, r) => p + r, 0) / ref.length;
  const m0 = med(x), sd = 1.4826 * med(x.map(v => Math.abs(v - m0)));
  return sd > 1e-9 ? { mu, sd } : null;
}
const heatZ = (v, st) => v == null || !isFinite(v) || !st ? null : (v - st.mu) / st.sd;
// z within one row, for columns that have no history of their own (annual averages)
function heatRowZ(vals) {
  const x = vals.filter(v => v != null && isFinite(v)); if (x.length < 3) return vals.map(() => null);
  const mu = x.reduce((p, r) => p + r, 0) / x.length, sd = Math.sqrt(x.reduce((p, r) => p + (r - mu) ** 2, 0) / x.length);
  return vals.map(v => v == null || sd < 1e-9 ? null : (v - mu) / sd);
}
// tone: 'price' (high = terracotta, low = blue), 'good' (high = green, low = terracotta), 'bad' (the reverse)
function heatBg(z, tone) {
  if (z == null || !isFinite(z)) return '';
  const a = Math.min(1, Math.abs(z) / 2.5);
  if (a < 0.12) return '';
  const up = z > 0, col = tone === 'good' ? (up ? '--c3' : '--c2') : tone === 'bad' ? (up ? '--c2' : '--c3') : (up ? '--c2' : '--c1');
  return ` style="background:color-mix(in srgb, var(${col}) ${Math.round(a * 62)}%, transparent)"`;
}
const heatTd = (html, z, tone, cls = '') => `<td class="hm${cls ? ' ' + cls : ''}"${heatBg(z, tone)}>${html}</td>`;
function heatLegend(kind, note) {
  const sw = c => `<i style="background:color-mix(in srgb, var(${c}) 55%, transparent)"></i>`;
  const keys = kind === 'price' ? `${sw('--c1')}低於常態 ${sw('--c2')}高於常態` : `${sw('--c3')}優於常態（對景氣有利）${sw('--c2')}劣於常態`;
  return `${keys}<span>${note || '顏色深淺＝與該項目自己 2016–2019 年（疫情前）同一衡量的平均相比，差距以該項目平常的波動幅度衡量（約 2.5 倍時為滿色）。'}</span>`;
}
function mount(id) { document.getElementById('app').appendChild(document.getElementById(id).content.cloneNode(true)); }
(function nav() {
  document.getElementById('nav').innerHTML = NAV.map(([g, xs]) => `<span class="ng">${g ? `<span class="ngl">${g}</span>` : ''}${xs.map(([k, l]) =>
    `<a href="#${k}"${k === DK ? ' aria-current="page"' : ''}>${l}</a>`).join('')}</span>`).join('');
})();
(function load() {
  const add = src => new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.body.appendChild(s); });
  add(`data-${MOD}.js`).then(() => add(`mod-${MOD}.js`)).then(() => add('data-lead.js')).then(() => add('mod-lead.js')).catch(() => { document.getElementById('app').textContent = '資料載入失敗，請重新整理。'; });
})();
