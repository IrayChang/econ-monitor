mount('tpl-gdp');
/* ---------- GDP brief: official contributions, quarterly ---------- */
const G = window.ALL_DATA.gdp, GQ = G.hist.quarters, GS = G.hist.series, NQ = GQ.length;
const K = { src: 'Bureau of Economic Analysis' };
const sv = k => { const s = GS[k], a = new Array(NQ).fill(null); if (s) s.v.forEach((x, j) => { a[s.o + j] = x; }); return a; };
const GL = (() => { const g = sv('gdp'); for (let t = NQ - 1; t >= 0; t--) if (g[t] != null) return t; return NQ - 1; })();
const qzh = q => `${q.slice(0, 4)} 年第 ${q.slice(-1)} 季`, qlab = q => `${q.slice(5)} '${q.slice(2, 4)}`;
const saar = a => a.map((x, t) => t && x != null && a[t - 1] != null ? (Math.pow(x / a[t - 1], 4) - 1) * 100 : null);
const yoy4 = a => a.map((x, t) => t >= 4 && x != null && a[t - 4] != null ? (x / a[t - 4] - 1) * 100 : null);
const S = {
  gdp: sv('gdp'), fspdp: sv('fspdp'), fsdp: sv('fsdp'), pcer: sv('pcer'), gdi: sv('gdi'), defl: sv('defl'),
  ngdp: saar(sv('ngdp')), gdpy: yoy4(sv('rgdp')), ngdpy: yoy4(sv('ngdp')), now: sv('now')
};
// contribution tree (official BEA contributions to percent change in real GDP, SAAR)
const T = {
  gdp: { n: 'Real GDP', zh: '實質 GDP', kids: ['c:pce', 'c:gpdi', 'c:nx', 'c:gov'] },
  'c:pce': { n: 'Consumer spending', zh: '民間消費', kids: ['c:goods', 'c:serv'] },
  'c:goods': { n: 'Goods', zh: '商品消費' }, 'c:serv': { n: 'Services', zh: '服務消費' },
  'c:gpdi': { n: 'Private investment', zh: '民間投資', kids: ['c:fixed', 'c:inv'] },
  'c:fixed': { n: 'Fixed investment', zh: '固定投資', kids: ['c:nonres', 'c:resid'] },
  'c:nonres': { n: 'Business investment', zh: '企業投資', kids: ['c:equip', 'c:ipp', 'c:struct'] },
  'c:equip': { n: 'Equipment', zh: '設備' }, 'c:ipp': { n: 'Intellectual property', zh: '智慧財產' }, 'c:struct': { n: 'Structures', zh: '建築' },
  'c:resid': { n: 'Residential', zh: '住宅投資' }, 'c:inv': { n: 'Inventories', zh: '存貨' },
  'c:nx': { n: 'Net exports', zh: '淨出口', kids: ['c:exp', 'c:imp'] }, 'c:exp': { n: 'Exports', zh: '出口' }, 'c:imp': { n: 'Imports', zh: '進口' },
  'c:gov': { n: 'Government', zh: '政府支出' }
};
for (const k in T) { T[k].v = k === 'gdp' ? S.gdp : sv(k); for (const c of T[k].kids || []) T[c].p = k; }
const lq = GQ[GL], nx = G.meta.next || {}, nc = G.meta.nowcast || {};

/* ---------- article ---------- */
const g0 = S.gdp[GL], core = S.fspdp[GL], cn = k => T[k].v[GL];
document.getElementById('dt').textContent = `Data through ${lq.slice(5)} ${lq.slice(0, 4)}`;
document.getElementById('demo').textContent = `Demo：Economy in Brief 的版面與出版圖風格，加上互動。GDP 為季資料，貢獻是 BEA 公布的官方數字。資料至 ${qzh(lq)}。`;
document.getElementById('hd').textContent = `美國第 ${lq.slice(-1)} 季實質 GDP 年率 ${f1(g0)}%，核心 GDP ${f1(core)}%`;
const sgn = v => (v >= 0 ? '+' : '') + v.toFixed(2);
document.getElementById('gp1').innerHTML = `<p>美國${qzh(lq)}實質 GDP 季增年率 ${f1(g0)}%，前一季 ${f1(S.gdp[GL - 1])}%，年增 ${f1(S.gdpy[GL])}%。排除存貨、淨出口與政府支出的「核心 GDP」（對國內民間買家的最終銷售）成長 ${f1(core)}%，${core > g0 + 0.5 ? '高於總體，內需比總數看起來更強' : core < g0 - 0.5 ? '低於總體，總數有部分來自波動較大的項目' : '與總體接近'}。</p>
<p>各項貢獻：民間消費 ${sgn(cn('c:pce'))} 個百分點、民間投資 ${sgn(cn('c:gpdi'))}（其中存貨 ${sgn(cn('c:inv'))}）、淨出口 ${sgn(cn('c:nx'))}、政府 ${sgn(cn('c:gov'))}。所得面的 GDI 成長 ${f1(S.gdi[GL])}%，GDP 價格指數上漲 ${f1(S.defl[GL])}%。${nx.date ? `下一次發布是 ${fmtDate(nx.date)}（${qzh(nx.q)}初值），市場預期 ${f1(nx.cons)}%` : ''}${nc.v != null ? `，亞特蘭大聯準銀行 GDPNow 估 ${f1(nc.v)}%` : ''}。</p>`;

/* ---------- overview ---------- */
(function overview() {
  const rows = [['Real GDP', S.gdp, S.gdpy, 0], ['Core GDP (private final sales)', S.fspdp, null, 1], ['Final sales of domestic product', S.fsdp, null, 1],
    ['Real consumer spending', S.pcer, null, 1], ['Real GDI (income side)', S.gdi, null, 0], ['GDP price index', S.defl, null, 0], ['Nominal GDP', S.ngdp, S.ngdpy, 0]];
  const qs = [GL, GL - 1, GL - 2, GL - 3];
  let h = `<thead><tr class="grp"><th>Real GDP & related (% chg, SAAR)</th><th class="vl" colspan="4">Quarter</th><th class="vl">4Q avg.</th><th class="vl">Y/Y</th><th class="vl">12 qtrs</th></tr>
<tr><th></th>${qs.map((t, j) => `<th${j ? '' : ' class="vl"'}>${qlab(GQ[t])}</th>`).join('')}<th class="vl"></th><th class="vl">${qlab(GQ[GL])}</th><th class="vl"></th></tr></thead><tbody>`;
  for (const [n, a, y, pad] of rows) {
    const avg = qs.map(t => a[t]).filter(v => v != null), av = avg.length ? avg.reduce((p, c) => p + c, 0) / avg.length : null;
    h += `<tr><td style="padding-left:${9 + pad * 14}px">${esc(n)}</td>${qs.map((t, j) => `<td${j ? '' : ' class="vl"'}>${j ? f1(a[t]) : `<b>${f1(a[t])}</b>`}</td>`).join('')}<td class="vl">${f1(av)}</td><td class="vl">${y ? f1(y[GL]) : ''}</td><td class="vl" style="padding:2px 9px">${sparkline(a.slice(0, GL + 1), 12)}</td></tr>`;
  }
  if (nc.v != null) h += `<tr><td>GDPNow nowcast, ${qlab(nc.q)}</td><td class="vl note" colspan="4" style="text-align:left">Atlanta Fed${nx.cons != null ? ` · consensus ${f1(nx.cons)}%` : ''}${nx.date ? ` · release ${fmtDate(nx.date)}` : ''}</td><td class="vl"></td><td class="vl"><b>${f1(nc.v)}</b></td><td class="vl"></td></tr>`;
  document.getElementById('govt').innerHTML = h + '</tbody>';
})();

/* ---------- contributions: stacked chart + drill table ---------- */
const GR = { '4Q': 4, '8Q': 8, '3Y': 12, '5Y': 20, Max: 0 };
const GST = Object.assign({ node: 'gdp', r: '5Y', hl: null }, store.get('gstk') || {});
if (!T[GST.node] || !T[GST.node].kids) GST.node = 'gdp';
if (!(GST.r in GR)) GST.r = '5Y';
const gopen = new Set(['gdp']);
function gStack() {
  const el = document.getElementById('gstk'), node = T[GST.node], kids = node.kids;
  const narrow = el.clientWidth < 560, W = narrow ? 460 : 900, H = narrow ? 340 : 360, x0 = 40, x1 = W - 40, y0 = 50, y1 = H - 46;
  const isRoot = GST.node === 'gdp', e = isRoot && nc.v != null ? GL + 1 : GL;
  const s = GR[GST.r] ? Math.max(0, GL + 1 - GR[GST.r]) : 0, n = e - s, xw = (x1 - x0) / (n + 1), X = i => x0 + (i - s + 0.5) * xw;
  const tot = node.v, segs = kids.map((k, j) => ({ k, name: T[k].n, v: T[k].v, c: `--k${j % 10}` }));
  const other = tot.map((x, t) => x == null ? null : x - segs.reduce((p, q) => p + (q.v[t] || 0), 0));
  segs.push({ k: null, name: 'Other / residual', v: other, c: '--kx' });
  let lo = 0, hi = 0;
  for (let t = s; t <= GL; t++) { let p = 0, q = 0; for (const g of segs) { const v = g.v[t]; if (v > 0) p += v; else if (v < 0) q += v; } hi = Math.max(hi, p, tot[t] ?? 0); lo = Math.min(lo, q, tot[t] ?? 0); }
  if (e > GL) { hi = Math.max(hi, nc.v); lo = Math.min(lo, nc.v); }
  const ax = nice(lo, hi, 5), Yv = v => y1 - (v - ax.lo) / (ax.hi - ax.lo) * (y1 - y0);
  let g = '';
  for (let v = ax.lo; v <= ax.hi + 1e-9; v += ax.step) g += `<line x1="${x0}" x2="${x1}" y1="${Yv(v)}" y2="${Yv(v)}" stroke="${css('--grid')}"/><text x="${x0 - 5}" y="${Yv(v) + 3.5}" font-size="10" text-anchor="end">${fmtT(v, ax.step)}</text><text x="${x1 + 5}" y="${Yv(v) + 3.5}" font-size="10">${fmtT(v, ax.step)}</text>`;
  const bw = Math.max(1.5, Math.min(40, xw * 0.74));
  for (let t = s; t <= GL; t++) {
    let up = 0, dn = 0;
    segs.forEach(sg_ => {
      const v = sg_.v[t]; if (v == null || Math.abs(v) < 1e-6) return;
      const a = v > 0 ? up : dn, b = a + v; if (v > 0) up = b; else dn = b;
      const fade = GST.hl && GST.hl !== sg_.k ? ' opacity=".28"' : '';
      g += `<rect class="seg" data-k="${sg_.k || ''}" x="${X(t) - bw / 2}" y="${Yv(Math.max(a, b))}" width="${bw}" height="${Math.max(.4, Math.abs(Yv(a) - Yv(b)))}" fill="${css(sg_.c)}"${fade}/>`;
    });
  }
  g += `<line x1="${x0}" x2="${x1}" y1="${Yv(0)}" y2="${Yv(0)}" stroke="${css('--axis')}" stroke-width=".8"/>`;
  let d = '', pen = false;
  for (let t = s; t <= GL; t++) { if (tot[t] == null) { pen = false; continue; } d += (pen ? 'L' : 'M') + X(t).toFixed(1) + ' ' + Yv(tot[t]).toFixed(1); pen = true; }
  g += `<path d="${d}" fill="none" stroke="${css('--paper')}" stroke-width="3.6"/><path d="${d}" fill="none" stroke="${css('--tot')}" stroke-width="1.6"/>`;
  for (let t = s; t <= GL; t++) if (tot[t] != null && n < 40) g += `<circle cx="${X(t)}" cy="${Yv(tot[t])}" r="2.4" fill="${css('--tot')}"/>`;
  if (e > GL) {
    g += `<rect x="${X(e) - bw / 2}" y="${Yv(Math.max(0, nc.v))}" width="${bw}" height="${Math.abs(Yv(nc.v) - Yv(0))}" fill="none" stroke="${css('--tot')}" stroke-dasharray="3 2"/>`;
    g += `<text x="${X(e)}" y="${Yv(Math.max(0, nc.v)) - 5}" font-size="9.5" text-anchor="middle">GDPNow ${f1(nc.v)}</text>`;
  }
  const yrs = [...new Set(GQ.slice(s, e + 1).map(q => q.slice(0, 4)))];
  for (let t = s; t <= e; t++) if (t > 0 && GQ[t].endsWith('Q1')) g += `<line x1="${X(t) - xw / 2}" x2="${X(t) - xw / 2}" y1="${y1}" y2="${y1 + 5}" stroke="${css('--axis')}"/>`;
  if (n < 13) for (let t = s; t <= e; t++) { g += `<text x="${X(t)}" y="${y1 + 14}" font-size="9.5" text-anchor="middle">${GQ[t].slice(5)}</text>`; if (GQ[t].endsWith('Q1') || t === s) g += `<text x="${X(t)}" y="${y1 + 27}" font-size="10" font-weight="700" text-anchor="${t === s ? 'start' : 'middle'}">${GQ[t].slice(0, 4)}</text>`; }
  else yrs.forEach((yr, k) => { if (n > 36 && (yrs.length - 1 - k) % 2) return; const idx = []; for (let t = s; t <= e; t++) if (GQ[t].startsWith(yr)) idx.push(t); if (idx.length >= 2) g += `<text x="${(X(idx[0]) + X(idx[idx.length - 1])) / 2}" y="${y1 + 15}" font-size="10.5" text-anchor="middle">${yr.slice(2)}</text>`; });
  g += `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" fill="none" stroke="${css('--frame')}" stroke-width=".8"/>`;
  const title = isRoot ? 'Contributions to Real GDP Growth' : `Contributions to Real GDP Growth: ${node.n}`;
  g += `<text x="${W / 2}" y="16" font-size="12.5" text-anchor="middle" style="fill:${css('--ink')}">${title}</text><text x="${W / 2}" y="31" font-size="11" text-anchor="middle" style="fill:${css('--ink')}">% Change, SAAR, Percentage Points</text>`;
  g += `<text x="${x0 - 30}" y="${H - 4}" font-size="9.5">Source:  Bureau of Economic Analysis${narrow ? '' : '; nowcast: Federal Reserve Bank of Atlanta'}</text>`;
  g += `<line class="xh" y1="${y0}" y2="${y1}" stroke="${css('--axis')}" stroke-width=".6" visibility="hidden"/>`;
  el.innerHTML = `<div class="plot"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${title}">${g}</svg><div class="tip"></div></div><div class="tb"></div>`;
  const path = []; for (let k = GST.node; k; k = T[k].p) path.unshift(k);
  el.querySelector('.tb').innerHTML = `<span class="crumb">${path.map((k, j) => j === path.length - 1 ? `<b>${T[k].n}</b>` : `<button type="button" data-go="${k}">${T[k].n}</button> ›`).join(' ')}</span>` +
    `<span class="seg" role="group" aria-label="Range">${Object.keys(GR).map(k => `<button type="button" data-r="${k}" aria-pressed="${GST.r === k}">${k}</button>`).join('')}</span>` +
    `<span class="klg"><button type="button" disabled style="cursor:default"><i class="ln"></i><span>${node.n}</span><em>${f1(tot[GL])}</em></button>` +
    segs.map(sg_ => `<button type="button" data-k="${sg_.k || ''}" class="${GST.hl === sg_.k ? 'on' : ''}" ${sg_.k ? '' : 'disabled style="cursor:default"'}><i style="background:${css(sg_.c)}"></i><span>${sg_.name}</span><em>${sg_.v[GL] == null ? 'n.a.' : sgn(sg_.v[GL])}</em>${sg_.k && T[sg_.k].kids ? '<span class="dn">▸</span>' : ''}</button>`).join('') + '</span>';
  const svg = el.querySelector('svg'), tip = el.querySelector('.tip'), xl = el.querySelector('.xh');
  const move = ev => {
    const r = svg.getBoundingClientRect(), p = ev.touches ? ev.touches[0] : ev, sx = (p.clientX - r.left) / r.width * W;
    if (sx < x0 || sx > x1) return out();
    const t = Math.max(s, Math.min(e, Math.floor(s + (sx - x0) / xw)));
    xl.setAttribute('x1', X(t)); xl.setAttribute('x2', X(t)); xl.setAttribute('visibility', 'visible');
    tip.innerHTML = t > GL ? `<b>${plab(GQ[t])}</b><br>GDPNow nowcast: ${f1(nc.v)}%${nx.cons != null ? `<br>Consensus: ${f1(nx.cons)}%` : ''}` :
      `<b>${plab(GQ[t])} · ${node.n} ${f1(tot[t])}</b><br>` + segs.map(q => [q, q.v[t]]).filter(x => x[1] != null).sort((a, b) => b[1] - a[1]).map(([q, v]) => `<span style="color:${css(q.c)}">■</span> ${q.name}: ${sgn(v)} pp`).join('<br>');
    tip.style.display = 'block';
    const px = X(t) / W * r.width, tw = tip.offsetWidth;
    tip.style.left = Math.max(0, px + 14 + tw > r.width ? px - tw - 4 : px + 14) + 'px'; tip.style.top = (y0 / H * r.height + 6) + 'px';
  };
  const out = () => { tip.style.display = 'none'; xl.setAttribute('visibility', 'hidden'); };
  svg.addEventListener('mousemove', move); svg.addEventListener('mouseleave', out);
  svg.addEventListener('touchstart', move, { passive: true }); svg.addEventListener('touchmove', move, { passive: true });
  store.set('gstk', { node: GST.node, r: GST.r });
}
function gCols() {
  if (GR[GST.r] && GR[GST.r] <= 8) { const cols = []; for (let t = GL; t > GL - GR[GST.r]; t--) cols.push({ lab: qlab(GQ[t]), f: a => a[t] }); return [{ g: 'Contribution, pp (SAAR)', cols }]; }
  const cy = +lq.slice(0, 4), first = +GQ[0].slice(0, 4), ny = { '3Y': 3, '5Y': 5 }[GST.r] || cy - first;
  const avgY = (a, y) => { const xs = GQ.map((q, t) => q.startsWith(y) && t <= GL ? a[t] : null).filter(v => v != null); return xs.length ? xs.reduce((p, c) => p + c, 0) / xs.length : null; };
  const cols = [{ lab: `${cy} (${lq.slice(5)})`, f: a => avgY(a, String(cy)) }];
  for (let y = cy - 1; y >= Math.max(first, cy - ny); y--) cols.push({ lab: String(y), f: a => avgY(a, String(y)) });
  return [{ g: 'Avg. of quarterly contributions, pp', cols }];
}
function gRow(k, depth) {
  const x = T[k], kids = x.kids || [], TCg = gCols();
  const cr = kids.length ? `<button type="button" class="cr" data-t="${k}" aria-expanded="${gopen.has(k)}">${gopen.has(k) ? '▾' : '▸'}</button>` : '<span class="sp"></span>';
  let h = `<tr class="${GST.hl === k || (GST.node === k && k !== 'gdp') ? 'sel' : ''}"><td style="padding-left:${6 + depth * 14}px">${cr}<button type="button" class="nm" data-p="${k}">${x.n}</button> <span class="note">${x.zh}</span></td>` +
    TCg.map(g => g.cols.map((c, j) => `<td${j ? '' : ' class="vl"'}>${c.f(x.v) == null ? 'n.a.' : (k === 'gdp' ? f1(c.f(x.v)) : sgn(c.f(x.v)))}</td>`).join('')).join('') + '</tr>';
  if (gopen.has(k)) for (const c of kids) h += gRow(c, depth + 1);
  return h;
}
function gTable() {
  const TCg = gCols();
  document.getElementById('gtbl').innerHTML = `<thead><tr class="grp"><th>Real GDP (% chg, SAAR) and contributions</th>${TCg.map(g => `<th class="vl" colspan="${g.cols.length}">${g.g}</th>`).join('')}</tr><tr><th></th>${TCg.map(g => g.cols.map((c, j) => `<th${j ? '' : ' class="vl"'}>${c.lab}</th>`).join('')).join('')}</tr></thead><tbody>${gRow('gdp', 0)}</tbody>`;
}
function gSelect(k, scroll) {
  if (T[k].kids) { GST.node = k; GST.hl = null; gopen.add(k); } else { GST.node = T[k].p || 'gdp'; GST.hl = k; }
  for (let j = T[k].p; j; j = T[j].p) gopen.add(j);
  gStack(); gTable();
  if (scroll) document.getElementById('gcompo').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
document.getElementById('gstk').addEventListener('click', ev => {
  const r = ev.target.closest('rect.seg'); if (r) { if (r.dataset.k) gSelect(r.dataset.k); return; }
  const b = ev.target.closest('button'); if (!b || b.disabled) return;
  if (b.dataset.go) gSelect(b.dataset.go); else if (b.dataset.k) gSelect(b.dataset.k); else if (b.dataset.r) { GST.r = b.dataset.r; gStack(); gTable(); }
});
document.getElementById('gtbl').addEventListener('click', ev => {
  const b = ev.target.closest('button'); if (!b) return;
  if (b.dataset.t) { gopen.has(b.dataset.t) ? gopen.delete(b.dataset.t) : gopen.add(b.dataset.t); gTable(); }
  else if (b.dataset.p) gSelect(b.dataset.p);
});
gStack(); gTable();

/* ---------- revisions ---------- */
(function revisions() {
  const V = G.hist.vint || {}, qs = Object.keys(V).sort().slice(-6).reverse();
  const nm_ = ['Advance', 'Second', 'Third'];
  let h = `<thead><tr><th>Quarter</th>${nm_.map((n, j) => `<th class="vl">${n}</th><th>Consensus</th>`).join('')}<th class="vl">Latest</th><th>Advance → latest</th></tr></thead><tbody>`;
  for (const q of qs) {
    const est = V[q], t = GQ.indexOf(q), latest = t >= 0 ? S.gdp[t] : null;
    h += `<tr><td>${qlab(q)}</td>${[0, 1, 2].map(j => est[j] ? `<td class="vl">${f1(est[j].v)}</td><td class="note">${est[j].f != null ? f1(est[j].f) : ''}</td>` : '<td class="vl"></td><td></td>').join('')}<td class="vl"><b>${f1(latest)}</b></td><td>${latest != null && est[0] ? sgn(latest - est[0].v) : ''}</td></tr>`;
  }
  document.getElementById('grev').innerHTML = h + '</tbody>';
})();

/* ---------- analysis charts ---------- */
const CAT = [
  { k: 'gdp', n: 'Real GDP', v: S.gdp, grp: 'Growth, % SAAR' }, { k: 'fspdp', n: 'Core GDP (private final sales)', v: S.fspdp, grp: 'Growth, % SAAR' },
  { k: 'fsdp', n: 'Final sales of domestic product', v: S.fsdp, grp: 'Growth, % SAAR' }, { k: 'pcer', n: 'Real consumer spending', v: S.pcer, grp: 'Growth, % SAAR' },
  { k: 'gdi', n: 'Real GDI', v: S.gdi, grp: 'Growth, % SAAR' }, { k: 'ngdp', n: 'Nominal GDP', v: S.ngdp, grp: 'Growth, % SAAR' }, { k: 'defl', n: 'GDP price index', v: S.defl, grp: 'Growth, % SAAR' },
  { k: 'gdpy', n: 'Real GDP, Y/Y', v: S.gdpy, grp: 'Growth, % Y/Y' }, { k: 'ngdpy', n: 'Nominal GDP, Y/Y', v: S.ngdpy, grp: 'Growth, % Y/Y' },
  ...Object.keys(T).filter(k => k !== 'gdp').map(k => ({ k, n: 'Contribution: ' + T[k].n, v: T[k].v, grp: 'Contributions, pp' }))
].map(c => ({ ...c, v: c.v.slice(0, GL + 1) }));
const GRR = { '2Y': 8, '3Y': 12, '5Y': 20, Max: 0 };
const QM = GQ.slice(0, GL + 1), pct = v => f1(v) + '%';
seriesChart('gch1', { months: QM, cat: CAT, ranges: GRR, fmt: pct, W: 460, H: 330, def: { title: 'Real GDP vs. Core GDP', sub: '% Change, SAAR', r: '5Y', ids: [{ k: 'gdp' }, { k: 'fspdp' }] } });
seriesChart('gch2', { months: QM, cat: CAT, ranges: GRR, fmt: pct, W: 460, H: 330, def: { title: 'Real GDP vs. Real GDI', sub: '% Change, SAAR', r: '5Y', ids: [{ k: 'gdp' }, { k: 'gdi' }] } });
seriesChart('gch3', { months: QM, cat: CAT, ranges: GRR, fmt: pct, W: 460, H: 330, def: { title: 'Real & Nominal GDP', sub: '% Change Y/Y', r: 'Max', ids: [{ k: 'gdpy' }, { k: 'ngdpy' }] } });
seriesChart('gch4', { months: QM, cat: CAT, ranges: GRR, fmt: pct, W: 460, H: 330, def: { title: 'GDP Price Index', sub: '% Change, SAAR', r: '5Y', ref: 2, ids: [{ k: 'defl' }] } });
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { gStack(); for (const k in SC) SC[k].draw(); });
