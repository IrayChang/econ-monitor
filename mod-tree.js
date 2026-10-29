mount('tpl-tree');
const ALL = window.ALL_DATA;
const CFG = {
  cpi: { tab: 'CPI', long: 'Consumer Price Index', zh: '消費者物價指數（CPI）', src: 'Bureau of Labor Statistics', base: 'Index, 1982-84=100, SA', ref: 2,
    top: 'All items', core: 'All items less food and energy', food: 'Food', energy: 'Energy',
    goods: 'Commodities less food and energy commodities', svc: 'Services less energy services', ex: 'Shelter', exZh: '住房（shelter）',
    sc: 'Services less shelter (supercore)', coreZh: '排除食品與能源的核心 CPI', search: 'rent、airline、used cars',
    short: { 'All items': 'Total', 'All items less food and energy': 'Excl. Food & Energy', 'Services less energy services': 'Services less Energy',
      'Commodities less food and energy commodities': 'Goods less Food & Energy', 'Gasoline (all types)': 'Gasoline', 'Services less shelter (supercore)': 'Services less Shelter (supercore)' },
    wNote: '權重為最新的相對重要性（%）；各月權重以相對價格回推，屬估算。', srcNote: 'CPI 資料由勞工統計局（BLS）每月發布。2025 年 10 月因政府停擺未發布。' },
  pce: { tab: 'PCE', long: 'PCE Price Index', zh: '個人消費支出物價指數（PCE）', src: 'Bureau of Economic Analysis', base: 'Index, 2017=100, SA', ref: 2,
    top: 'Personal consumption expenditures', core: 'PCE excluding food and energy', food: 'Food and beverages purchased for off-premises consumption', energy: 'Energy goods and services',
    goods: 'PCE goods excluding food and energy', svc: 'PCE services excluding energy', ex: 'Housing', exZh: '住房（housing）',
    sc: 'PCE services excluding energy and housing (supercore)', coreZh: '排除食品與能源的核心 PCE', search: 'rent、airline、portfolio、hospital',
    short: { 'Personal consumption expenditures': 'PCE', 'PCE excluding food and energy': 'Core PCE', 'Food and beverages purchased for off-premises consumption': 'Food (off-premises)',
      'Energy goods and services': 'Energy', 'PCE goods excluding food and energy': 'Core Goods', 'PCE services excluding energy': 'Services less Energy',
      'PCE services excluding energy and housing (supercore)': 'Services less Energy & Housing (supercore)',
      'Household consumption expenditures (for services)': 'Household services', 'Final consumption expenditures of nonprofit institutions serving households (NPISHs)': 'Nonprofits (NPISHs)' },
    wNote: '權重為 BEA 名目支出占比（%），每月實際值，貢獻依前期占比計算。', srcNote: 'PCE 物價指數由經濟分析局（BEA）每月發布，只有季調數字，年增也以季調指數計算；聯準會 2% 目標以 PCE 為準。' },
  ppi: { tab: 'PPI', long: 'Producer Price Index', zh: '生產者物價指數（PPI）', src: 'Bureau of Labor Statistics', base: 'Index, Nov 2009=100, SA', ref: null,
    top: 'Final demand', core: 'Final demand less foods, energy, and trade services', core2: 'Final demand less foods and energy', food: 'Final demand foods', energy: 'Final demand energy',
    goods: 'Final demand goods less foods and energy', svc: 'Final demand services', ex: 'Final demand trade services', exZh: '貿易服務（批發零售利潤）',
    coreZh: '排除食品、能源與貿易服務的核心 PPI', search: 'airline、portfolio、hospital、steel',
    short: { 'Final demand': 'Final Demand', 'Final demand less foods, energy, and trade services': 'Excl. Food, Energy & Trade', 'Final demand less foods and energy': 'Excl. Food & Energy',
      'Final demand goods': 'Goods', 'Final demand foods': 'Foods', 'Final demand energy': 'Energy', 'Final demand goods less foods and energy': 'Goods less Food & Energy',
      'Final demand services': 'Services', 'Final demand trade services': 'Trade Services', 'Final demand transportation and warehousing services': 'Transportation & Warehousing',
      'Final demand services less trade, transportation, and warehousing': 'Services less Trade & Transport', 'Final demand construction': 'Construction' },
    wNote: '權重為最新的相對重要性（%）；各月權重以相對價格回推，屬估算。斜體灰字是 BLS 表 2 的主要產品，沒有權重，不列入貢獻。', srcNote: 'PPI 資料由勞工統計局（BLS）每月發布。2025 年 10 月因政府停擺未發布。' },
  retail: { kind: 'retail', tab: 'Retail', long: 'Retail Sales', zh: '零售銷售', src: 'Census Bureau', base: 'Millions of $, SA', ref: null,
    top: 'Retail and food services, total', core: 'Control group (ex autos, gas, building materials, food services)', search: 'nonstore、gasoline、furniture',
    short: { 'Retail and food services, total': 'Retail & Food Services', 'Control group (ex autos, gas, building materials, food services)': 'Control Group',
      'Retail trade (ex food services)': 'Retail ex Food Services', 'Total ex motor vehicles and parts': 'Ex Autos', 'Total ex autos and gasoline': 'Ex Autos & Gas',
      'Nonstore retailers (e-commerce)': 'Nonstore (e-commerce)', 'Food services and drinking places': 'Food Services & Drinking', 'Motor vehicle and parts dealers': 'Motor Vehicles & Parts',
      'Gasoline stations': 'Gasoline Stations', 'Building materials and garden': 'Building Materials' },
    wNote: '權重為占零售總額的比重（%），每月實際值；貢獻＝細項金額變動 ÷ 上期總額，加總精確等於總額變動。', srcNote: '零售銷售由普查局每月發布，為名目金額、未扣除物價；控制組（扣除汽車、加油站、建材與餐飲）直接進入 GDP 的消費估算。' },
  nfp: { kind: 'nfp', tab: 'Payrolls', long: 'Nonfarm Payrolls', zh: '非農就業', src: 'Bureau of Labor Statistics', base: 'Thous., SA', ref: null,
    top: 'Total nonfarm', core: 'Total private', search: 'health、temporary、unemployment rate',
    short: { 'Total nonfarm': 'Nonfarm Payrolls', 'Total private': 'Private', 'Private service-providing': 'Private Services', 'Trade, transportation, and utilities': 'Trade, Transport & Utilities',
      'Professional and business services': 'Prof. & Business Services', 'Private education and health services': 'Education & Health', 'Health care and social assistance': 'Health Care & Social Assist.',
      'Average hourly earnings, all employees': 'Avg. Hourly Earnings', 'Average hourly earnings, production and nonsupervisory': 'AHE, Production & Nonsupervisory',
      'Unemployment rate': 'Unemployment Rate', 'U-6 underutilization rate': 'U-6 Rate', 'Labor force participation rate': 'Participation Rate', 'Employment-population ratio': 'Employment-Population Ratio',
      'Employment-population ratio, 25-54 yrs': 'Prime-Age (25-54) EPOP', 'Average weekly hours, all employees': 'Avg. Weekly Hours' },
    wNote: '權重為占非農就業總數的比重（%）。', srcNote: '就業資料由勞工統計局（BLS）每月發布，最近兩個月為初值，之後會修正。' }
};
for (const k of ['cpi', 'pce', 'ppi']) Object.assign(CFG[k], { kind: 'price' });
const K = CFG[DK], D = ALL[DK];
const KIND = K.kind, UPGOOD = KIND !== 'price';
const M = D.months, N = M.length, L = N - 1, IT = D.items;
const has = a => a != null && a.some(v => v != null);
const HASWH = !!(D.wh && D.wh.some(x => x));
D.nsa = D.nsa.map((x, i) => x || D.sa[i]);
IT.forEach((it, i) => { if (it.w == null && !it.a && i) it.p = 1; });
// Supercore (core services less shelter/housing) is not in the CPI or PCE datasets: chain it from core services
// and shelter, weighting each step by the period's weights (PCE: nominal shares; CPI: relative importance rolled back with relative prices).
if (K.sc && !IT.some(it => it.n === K.sc)) (function addSupercore() {
  const ix = n => IT.findIndex(it => it.n === n), sv = ix(K.svc), sh = ix(K.ex);
  const wp = D.nsa, wt = (i, t) => HASWH && D.wh[i] ? D.wh[i][t] : IT[i].w * wp[i][t] / wp[i][L];
  const build = src => {
    const a = src[sv], b = src[sh], out = new Array(N).fill(null);
    let prev = null;
    for (let t = 0; t < N; t++) {
      if (a[t] == null || b[t] == null) continue;
      if (prev == null) { out[t] = 100; prev = t; continue; }
      const Wv = wt(sv, prev), Wh = wt(sh, prev);
      const g = (Wv * (a[t] / a[prev] - 1) - Wh * (b[t] / b[prev] - 1)) / (Wv - Wh);
      out[t] = out[prev] * (1 + g); prev = t;
    }
    return out;
  };
  const sa = build(D.sa); D.sa.push(sa); D.nsa.push(D.nsa[sv] === D.sa[sv] ? sa : build(D.nsa));
  if (HASWH) D.wh.push(D.wh[sv].map((v, t) => v == null || D.wh[sh][t] == null ? null : v - D.wh[sh][t]));
  IT.push({ n: K.sc, d: 2, a: 1, w: +(IT[sv].w - IT[sh].w).toFixed(3) });
})();
IT.forEach(it => { if (!it.u) it.u = KIND === 'price' ? 'idx' : '$'; });
const IDX = Object.fromEntries(IT.map((it, i) => [it.n, i]));
/* ---------- measures ---------- */
const PCT = {
  yoy:  { lab: 'Y/Y',      sub: '% Change Y/Y',                    unit: '%', ref: 2 },
  mom:  { lab: 'M/M',      sub: '% Change M/M, SA',                unit: '%', bar: 1 },
  ann3: { lab: '3M ann.',  sub: '% Change, 3-Mo. Annualized, SA',  unit: '%', ref: 2 },
  lvl:  { lab: KIND === 'price' ? 'Index' : 'Level', sub: K.base,  unit: '' }
};
const MEAS = KIND === 'nfp' ? {
  dk:   { lab: 'M/M Chg',  sub: 'Change, Thous., SA',              bar: 1, add: 1 },
  dk3:  { lab: '3M Avg',   sub: '3-Mo. Avg. Change, Thous., SA',   bar: 1, add: 1 },
  d12:  { lab: '12M Chg',  sub: '12-Mo. Change, Thous.',           add: 1 },
  yoy:  PCT.yoy, lvl: PCT.lvl
} : KIND === 'retail' ? { mom: PCT.mom, yoy: PCT.yoy, ann3: PCT.ann3, lvl: PCT.lvl } : PCT;
const STK_MS = KIND === 'nfp' ? ['dk', 'dk3', 'd12'] : KIND === 'retail' ? ['mom', 'yoy'] : ['yoy', 'mom'];
const LAG = { yoy: 12, d12: 12, mom: 1, dk: 1, ann3: 3, dk3: 3 };
// subtitle, bar style and number format depend on the measure and on the first series' unit
function subFor(m, u) {
  if (m === 'lvl') return { '%': '%, SA', k: 'Thous., SA', hrs: 'Hours, SA' }[u] || (KIND === 'nfp' ? '$, SA' : K.base);
  if (u === '%') return { mom: 'Change, % Pts', dk: 'Change, % Pts', ann3: '3-Mo. Change, % Pts', dk3: '3-Mo. Avg. Change, % Pts', yoy: '12-Mo. Change, % Pts', d12: '12-Mo. Change, % Pts' }[m];
  if (MEAS[m] && MEAS[m].add && u !== 'k') return PCT[{ dk: 'mom', dk3: 'ann3', d12: 'yoy' }[m]].sub;
  return (MEAS[m] || PCT[m]).sub;
}
function fmtFor(m, u) {
  if (m === 'lvl') return v => v.toLocaleString('en-US', { maximumFractionDigits: u === 'k' || u === '$' ? 0 : 2 });
  if (u === '%') return v => (v > 0 ? '+' : '') + v.toFixed(2) + ' pp';
  if (MEAS[m] && MEAS[m].add && u === 'k') return v => (v > 0 ? '+' : '') + Math.round(v).toLocaleString('en-US') + 'k';
  return v => f1(v) + '%';
}
const fk = v => v == null ? 'n.a.' : Math.round(v).toLocaleString('en-US');
const cache = {};
function val(i, m) {
  const k = i + m; if (cache[k]) return cache[k];
  const sa = D.sa[i], nsa = D.nsa[i], nsaOnly = !has(sa), u = IT[i].u;
  const base = m === 'yoy' || m === 'd12' ? (has(nsa) ? nsa : sa) : (nsaOnly ? nsa : sa);
  const lag = LAG[m], diff = u === '%' || (u === 'k' && MEAS[m] && MEAS[m].add);
  const pm = { dk: 'mom', dk3: 'ann3', d12: 'yoy' }[m] || m;
  const v = m === 'lvl' ? base.slice() : base.map((x, t) => (t >= lag && x != null && base[t - lag] != null)
    ? (diff ? (x - base[t - lag]) / (m === 'dk3' ? 3 : 1)
      : pm === 'ann3' ? (Math.pow(x / base[t - lag], 4) - 1) * 100 : x / base[t - lag] * 100 - 100) : null);
  return cache[k] = { v, nsa: m !== 'yoy' && nsaOnly };
}
const Y = n => val(IDX[n], 'yoy').v, MM = n => val(IDX[n], 'mom').v;

/* short legend names for the common aggregates */
const SHORT = K.short;
const nm = i => SHORT[IT[i].n] || IT[i].n;
const parentOf = i => { if (IT[i].a) return IDX[K.top]; for (let j = i - 1; j >= 0; j--) if (!IT[j].a && IT[j].d < IT[i].d) return j; return null; };
const childrenOf = i => { const out = []; for (let j = i + 1; j < IT.length && !IT[j].a && IT[j].d > IT[i].d; j++) if (IT[j].d === IT[i].d + 1) out.push(j); return out; };
const weightedKids = i => childrenOf(i).filter(k => !IT[k].p);

/* ---------- interactive chart: Haver figure + quiet toolbar ---------- */
const COLS = ['--c1', '--c2', '--c3', '--c4'];
const RANGE_KEYS = ['3M', '6M', 'YTD', '2Y', '3Y', '5Y', 'Max'];
// first month shown for a range; 'Max' falls back to the first month with data
function rangeStart(r, first) {
  const back = { '3M': 3, '6M': 6, '2Y': 24, '3Y': 36, '5Y': 60 }[r];
  if (back) return Math.max(first, N - back);
  if (r === 'YTD') return Math.max(first, M.indexOf(M[L].slice(0, 4) + '-01'));
  return first;
}
const CH = {};
function chart(id, def) {
  const el = document.getElementById(id);
  el.innerHTML = '<div class="plot"></div><div class="tb"></div><div class="pop" role="dialog" aria-label="Add item"><input type="search" placeholder="搜尋項目（英文名稱），例如 ' + K.search + '" aria-label="搜尋項目"><ul></ul><div class="ft">最多 4 條線；滿了會取代最後一條。Esc 關閉</div></div>';
  const st = Object.assign(structuredClone(def), store.get(id) || {});
  st.ids = st.ids.filter(x => IT[x.i]);
  if (!MEAS[st.m]) st.m = def.m;
  const c = CH[id] = { st, def, el, draw: null };
  const plot = el.querySelector('.plot'), tb = el.querySelector('.tb'), pop = el.querySelector('.pop');
  const inp = pop.querySelector('input'), ul = pop.querySelector('ul');

  c.draw = () => {
    const m = MEAS[st.m];
    const series = st.ids.map((x, k) => { const r = val(x.i, st.m); return { name: nm(x.i), v: r.v, nsa: r.nsa, c: COLS[k], axis: x.ax || 'L', dash: x.dash }; });
    const first = series.reduce((a, q) => { const f = q.v.findIndex(v => v != null); return Math.min(a, f < 0 ? N : f); }, N);
    const start = Math.min(rangeStart(st.r, first === N ? 0 : first), L);
    const same = JSON.stringify(st.ids.map(x => x.i)) === JSON.stringify(def.ids.map(x => x.i));
    const title = same && def.title ? def.title : st.ids.length === 1 ? K.tab + ': ' + nm(st.ids[0].i) : st.ids.length === 2 ? `${K.tab}: ${nm(st.ids[0].i)} vs. ${nm(st.ids[1].i)}` : K.long;
    const short = title.length > 62 ? K.long : title;
    const nw = el.clientWidth < 560;
    const u0 = st.ids.length ? IT[st.ids[0].i].u : 'idx';
    hv(plot, { W: nw ? 460 : def.W, H: nw ? 330 : def.H, title: series.length ? short : 'Add an item', sub: subFor(st.m, u0), start, fmt: fmtFor(st.m, u0), ref: def.ref && K.ref ? m.ref : null, bar: m.bar, zeroLine: 1, series });
    const pressed = (a, b) => `aria-pressed="${a === b}"`;
    tb.innerHTML =
      `<span class="seg" role="group" aria-label="Measure">${Object.entries(MEAS).map(([k, v]) => `<button type="button" data-m="${k}" ${pressed(k, st.m)}>${v.lab}</button>`).join('')}</span>` +
      `<span class="seg" role="group" aria-label="Range">${RANGE_KEYS.map(k => `<button type="button" data-r="${k}" ${pressed(k, st.r)}>${k}</button>`).join('')}</span>` +
      `<button type="button" class="rst" ${same && st.m === def.m && st.r === def.r && st.ids.every((x, k) => x.ax === def.ids[k].ax) ? 'hidden' : ''}>Reset</button>` +
      `<span class="chips">${st.ids.map((x, k) => `<span class="chip"><i style="background:${css(COLS[k])}"></i><span title="${esc(IT[x.i].n)}">${esc(nm(x.i))}</span>` +
        (st.ids.length > 1 && !m.bar ? `<button type="button" data-ax="${k}" title="切換左右軸" aria-label="Move ${esc(nm(x.i))} to ${x.ax === 'R' ? 'left' : 'right'} axis">${x.ax === 'R' ? 'R' : 'L'}</button>` : '') +
        `<button type="button" data-rm="${k}" aria-label="Remove ${esc(nm(x.i))}">✕</button></span>`).join('')}` +
      `<button type="button" class="add" aria-haspopup="dialog">＋ Item</button></span>`;
  };
  c.add = i => {
    if (st.ids.some(x => x.i === i)) return;
    if (st.ids.length >= 4) st.ids.pop();
    st.ids.push({ i, ax: 'L' }); save();
  };
  const save = () => { store.set(id, { m: st.m, r: st.r, ids: st.ids }); c.draw(); };
  c.save = save;
  tb.addEventListener('click', ev => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.m) st.m = b.dataset.m;
    else if (b.dataset.r) st.r = b.dataset.r;
    else if (b.dataset.rm != null) st.ids.splice(+b.dataset.rm, 1);
    else if (b.dataset.ax != null) { const x = st.ids[+b.dataset.ax]; x.ax = x.ax === 'R' ? 'L' : 'R'; }
    else if (b.classList.contains('rst')) { Object.assign(st, structuredClone(def)); }
    else if (b.classList.contains('add')) { openPop(); return; }
    save();
  });
  // item picker
  let hits = [], cur = 0;
  const list = q => {
    q = q.trim().toLowerCase();
    let html = '';
    hits = [];
    const row = (i, pad) => { hits.push(i); return `<li data-i="${i}" style="padding-left:${10 + pad * 12}px">${esc(IT[i].n)}${IT[i].w != null ? `<span class="w">${IT[i].w.toFixed(1)}</span>` : ''}</li>`; };
    if (!q) {
      if (IT.some(it => it.a && !it.x)) html += '<li class="h">Special aggregates</li>';
      IT.forEach((it, i) => { if (it.a && !it.x) html += row(i, 0); });
      if (IT.some(it => it.x)) { html += '<li class="h">Other indicators</li>'; IT.forEach((it, i) => { if (it.x) html += row(i, 0); }); }
      html += '<li class="h">Item tree</li>';
      IT.forEach((it, i) => { if (!it.a) html += row(i, it.d); });
    } else IT.forEach((it, i) => { if (it.n.toLowerCase().includes(q)) html += row(i, 0); });
    ul.innerHTML = html || '<li class="h">沒有符合的項目</li>';
    cur = 0; mark();
  };
  const mark = () => ul.querySelectorAll('li[data-i]').forEach((li, k) => li.classList.toggle('on', k === cur));
  const openPop = () => { pop.style.display = 'block'; inp.value = ''; list(''); inp.focus(); };
  const closePop = () => { pop.style.display = 'none'; };
  c.closePop = closePop;
  inp.addEventListener('input', () => list(inp.value));
  inp.addEventListener('keydown', ev => {
    if (ev.key === 'Escape') { closePop(); tb.querySelector('.add').focus(); }
    else if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { ev.preventDefault(); cur = Math.max(0, Math.min(hits.length - 1, cur + (ev.key === 'ArrowDown' ? 1 : -1))); mark(); ul.querySelector('li.on')?.scrollIntoView({ block: 'nearest' }); }
    else if (ev.key === 'Enter' && hits.length) { closePop(); c.add(hits[cur]); }
  });
  ul.addEventListener('click', ev => { const li = ev.target.closest('li[data-i]'); if (li) { closePop(); c.add(+li.dataset.i); } });
  c.draw();
  return c;
}
document.addEventListener('mousedown', ev => { for (const k in CH) if (!CH[k].el.contains(ev.target)) CH[k].closePop(); });

/* ---------- article ---------- */
const lm = M[L], A = K.top, C = K.core;
const mA = MM(A)[L], mC = MM(C)[L], yA = Y(A)[L], yC = Y(C)[L];
const HD = document.getElementById('hd');
const verb = (v, p) => v > p + 0.05 ? '加速至' : v < p - 0.05 ? '放緩至' : '持平於';
const chg = v => v == null ? '資料缺' : Math.abs(v) < 0.05 ? '持平' : (v > 0 ? '上漲 ' : '下跌 ') + f1(Math.abs(v)) + '%';
const E = K.energy, F = K.food, SV = K.svc, GD = K.goods, SH = K.ex;
document.getElementById('dt').textContent = D.pub ? fmtDate(D.pub) : `Data through ${mlab(lm)} ${lm.slice(0, 4)}`;
if (KIND === 'price') HD.textContent =
  `美國 ${+lm.slice(5)} 月 ${K.tab} ${mA >= 0 ? '上漲' : '下跌'} ${f1(Math.abs(mA))}%，${MM(E)[L] > 1 ? '能源推升總體，' : MM(E)[L] < -1 ? '能源拉低總體，' : ''}核心${verb(mC, MM(C)[L - 1])} ${f1(mC)}%`;
document.getElementById('demo').textContent = `Demo：Economy in Brief 的版面與出版圖風格，加上互動。同一個版型套用物價、就業、零售等資料，用上方按鈕切換。資料為頁面現有 ${K.tab}（至 ${mzh(lm)}）。`;
document.getElementById('note').textContent = KIND !== 'price' ? `${K.srcNote}${K.wNote}${KIND === 'nfp' ? '堆疊圖的貢獻是各產業就業人數的變動（千人），加總等於上層的變動；' : '堆疊圖的貢獻加總等於上層的變動；'}細項加總與上層的差額列為 Other / residual。` : `${K.srcNote}月變動與年化為季節調整後數字${D.nsa.some((x, i) => x !== D.sa[i]) ? '（無季調序列的項目改用未季調，標示 NSA），年增與年度平均變動為未季調數字' : ''}。${K.wNote}堆疊圖的貢獻＝細項變動 × 細項權重 ÷ 上層權重；細項加總與上層的差額列為 Other / residual。`;
document.getElementById('nItems').textContent = IT.length;
const since = (arr, v) => { for (let i = L - 1; i >= 0; i--) if (arr[i] != null && arr[i] >= v) return M[i]; return null; };
const sy = since(Y(A), yA);
function ann(i, k) { const v = val(i, 'lvl').v, p = val(i, 'lvl').v[L - k]; return v[L] != null && p != null ? (Math.pow(v[L] / p, 12 / k) - 1) * 100 : null; }
function spark(arr) {
  const s = L - 23, pts = []; let lo = Infinity, hi = -Infinity;
  for (let t = s; t <= L; t++) if (arr[t] != null) { lo = Math.min(lo, arr[t]); hi = Math.max(hi, arr[t]); }
  if (!isFinite(lo)) return '';
  const W = 72, H = 22, X = t => 2 + (t - s) / 23 * (W - 6), Yy = v => H - 3 - (v - lo) / ((hi - lo) || 1) * (H - 6);
  let d = '', pen = false;
  for (let t = s; t <= L; t++) { if (arr[t] == null) { pen = false; continue; } d += (pen ? 'L' : 'M') + X(t).toFixed(1) + ' ' + Yy(arr[t]).toFixed(1); pen = true; }
  const two = KIND === 'price' && lo < 2 && hi > 2 ? `<line x1="2" x2="${W - 4}" y1="${Yy(2)}" y2="${Yy(2)}" stroke="var(--frame)" stroke-dasharray="2 2"/>` : '';
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true">${two}<path d="${d}" fill="none" stroke="var(--c1)" stroke-width="1.3"/><circle cx="${X(L)}" cy="${Yy(arr[L])}" r="2" fill="var(--c1)"/></svg>`;
}
const OV = (DK === 'retail'
  ? [[A, 0], ['Total ex motor vehicles and parts', 1], ['Total ex autos and gasoline', 1], [C, 1], ['Nonstore retailers (e-commerce)', 2], ['Motor vehicle and parts dealers', 1], ['Gasoline stations', 1], ['Food services and drinking places', 1]]
  : DK === 'ppi'
  ? [[A, 0], [K.core2, 0], [C, 0], ['Final demand goods', 1], [F, 2], [E, 2], [GD, 2], [SV, 1], [SH, 2], ['Final demand transportation and warehousing services', 2], ['Final demand services less trade, transportation, and warehousing', 2]]
  : [[A, 0], [C, 0], [F, 1], [E, 1], [GD, 1], [SV, 1], [SH, 2], [K.sc, 2]]).filter(r => IDX[r[0]] != null);
const MOM_T = KIND === 'retail' ? 1 : 0.3;
const momTag = (d, thr) => d == null ? '' : d > thr ? `<span style="color:var(${UPGOOD ? '--c3' : '--c2'})">▲ 加速</span>` : d < -thr ? `<span style="color:var(${UPGOOD ? '--c2' : '--c1'})">▼ ${UPGOOD ? '放緩' : '降溫'}</span>` : '<span class="note">— 持平</span>';
if (KIND !== 'nfp') (function drawOverview() {
  const lb = `${mlab(M[L])} '${M[L].slice(2, 4)}`;
  let h = `<thead><tr class="grp"><th>${K.long}</th><th></th><th class="vl" colspan="2">M/M, SA</th><th class="vl" colspan="2">Annualized, SA</th><th class="vl" colspan="3">Y/Y</th><th class="vl">Momentum</th><th class="vl">Y/Y, 24 mo.</th></tr>
<tr><th></th><th>Wt.</th><th class="vl">${lb}</th><th>${mlab(M[L - 1])}</th><th class="vl">3M</th><th>6M</th><th class="vl">${lb}</th><th>${mlab(M[L - 1])}</th><th>${mlab(M[L - 12])} '${M[L - 12].slice(2, 4)}</th><th class="vl"></th><th class="vl"></th></tr></thead><tbody>`;
  for (const [n, pad] of OV) {
    const i = IDX[n], yy = val(i, 'yoy').v, a3 = ann(i, 3), d = a3 != null && yy[L] != null ? a3 - yy[L] : null;
    const mo = momTag(d, MOM_T);
    h += `<tr data-i="${i}"><td style="padding-left:${9 + pad * 14}px"><button type="button" class="nm" data-ov="${i}">${esc(nm(i))}</button></td><td>${IT[i].w != null ? IT[i].w.toFixed(1) : ''}</td>` +
      `<td class="vl">${f1(val(i, 'mom').v[L])}</td><td>${f1(val(i, 'mom').v[L - 1])}</td><td class="vl">${f1(a3)}</td><td>${f1(ann(i, 6))}</td>` +
      `<td class="vl"><b>${f1(yy[L])}</b></td><td>${f1(yy[L - 1])}</td><td>${f1(yy[L - 12])}</td><td class="vl" style="text-align:left">${mo}</td><td class="vl" style="padding:2px 9px">${spark(yy)}</td></tr>`;
  }
  const el = document.getElementById('ovt');
  el.innerHTML = h + '</tbody>';
  el.addEventListener('click', ev => { const b = ev.target.closest('button[data-ov]'); if (b) selectItem(+b.dataset.ov, 'compo'); });
})();
const trendY = (v, p) => Math.abs(v - p) < 0.3 ? '持平' : v > p ? '走高' : '走低';
if (KIND === 'price') document.getElementById('p1').innerHTML = `
<p>美國 ${mzh(lm)}${K.zh}季調後${chg(mA)}，前月為 ${f1(MM(A)[L - 1])}%，再前月為 ${f1(MM(A)[L - 2])}%。年增率由 ${f1(Y(A)[L - 1])}% ${yA > Y(A)[L - 1] ? '升至' : yA < Y(A)[L - 1] ? '降至' : '持平於'} ${f1(yA)}%${K.ref ? '，聯準會目標為 2%' : ''}。${K.coreZh}${chg(mC)}，年增 ${f1(yC)}%；核心年增率在過去一年大致${trendY(yC, Y(C)[L - 12])}，${yC < yA ? '總體高於核心，差距主要來自能源與食品。' : '總體低於核心，能源與食品壓低了總體。'}</p>
<p>能源價格${chg(MM(E)[L])}，年增 ${f1(Y(E)[L])}%。食品價格${chg(MM(F)[L])}，年增 ${f1(Y(F)[L])}%。</p>`;
if (KIND === 'price') document.getElementById('p2').innerHTML = `
<p>核心項目中，${nm(IDX[SV])}月增 ${f1(MM(SV)[L])}%，年增 ${f1(Y(SV)[L])}%；其中${K.exZh}${chg(MM(SH)[L])}，年增 ${f1(Y(SH)[L])}%，過去一年${trendY(Y(SH)[L], Y(SH)[L - 12])}。${nm(IDX[GD])}月增 ${sg(MM(GD)[L])}%，年增 ${f1(Y(GD)[L])}%。</p>`;

/* ---------- non-price narratives ---------- */
const zhn = i => IT[i].zh || nm(i);
const chgS = v => v == null ? '資料缺' : Math.abs(v) < 0.05 ? '持平' : (v > 0 ? '增加 ' : '減少 ') + f1(Math.abs(v)) + '%';
const sgk = v => v == null ? 'n.a.' : (v >= 0 ? '+' : '−') + Math.abs(Math.round(v)).toLocaleString('en-US') + 'k';
// biggest movers among a set of items for a measure, by contribution
function movers(ids, m, n = 3) { const xs = ids.map(i => [i, val(i, m).v[L]]).filter(x => x[1] != null); xs.sort((a, b) => b[1] - a[1]); return { up: xs.slice(0, n), dn: xs.slice(-2).reverse().filter(x => x[1] < 0) }; }
if (KIND === 'retail') {
  const cats = weightedKids(IDX['Retail trade (ex food services)']).concat(IDX['Food services and drinking places']);
  const tot0 = D.sa[IDX[A]][L - 1], dc = i => (D.sa[i][L] - D.sa[i][L - 1]) / tot0 * 100;
  const mv = cats.map(i => [i, dc(i)]).sort((a, b) => b[1] - a[1]);
  HD.textContent = `美國 ${+lm.slice(5)} 月零售銷售${chgS(mA)}，控制組${chgS(mC)}`;
  document.getElementById('p1').innerHTML = `<p>美國 ${mzh(lm)}零售與餐飲銷售季調後${chgS(mA)}，前月為 ${f1(MM(A)[L - 1])}%，年增 ${f1(yA)}%。扣除汽車後${chgS(MM('Total ex motor vehicles and parts')[L])}，再扣除加油站後${chgS(MM('Total ex autos and gasoline')[L])}。進入 GDP 消費估算的控制組${chgS(mC)}，3 個月年化 ${f1(ann(IDX[C], 3))}%，年增 ${f1(yC)}%。</p>
<p>本月拉動最多的是${mv.slice(0, 3).map(([i, v]) => `${zhn(i)}（${v >= 0 ? '+' : ''}${v.toFixed(2)} 個百分點）`).join('、')}；拖累最多的是${mv.slice(-2).reverse().map(([i, v]) => `${zhn(i)}（${v.toFixed(2)}）`).join('、')}。這些是名目金額，物價上漲也會推高銷售。</p>`;
  document.getElementById('p2').innerHTML = `<p>電商（非店面零售）年增 ${f1(Y('Nonstore retailers (e-commerce)')[L])}%，餐飲年增 ${f1(Y('Food services and drinking places')[L])}%；汽車經銷商年增 ${f1(Y('Motor vehicle and parts dealers')[L])}%，加油站年增 ${f1(Y('Gasoline stations')[L])}%（主要反映油價）。</p>`;
  document.getElementById('ovHow').textContent = `動能＝3 個月年化相對年增：高出 1 個百分點以上為加速（綠），低 1 以上為放緩（紅）。點列可在 Components 拆開該項目。`;
}
if (KIND === 'nfp') {
  const dk = i => val(i, 'dk').v, dk3 = i => val(i, 'dk3').v, a12 = i => { const v = D.sa[i]; return v[L] != null && v[L - 12] != null ? (v[L] - v[L - 12]) / 12 : null; };
  const lv = n => D.sa[IDX[n]], U = 'Unemployment rate', AH = 'Average hourly earnings, all employees';
  const sect = IT.map((it, i) => i).filter(i => !IT[i].x && (IT[i].d === 3 || IT[i].n === 'Government'));
  const mv = movers(sect, 'dk');
  HD.textContent = `美國 ${+lm.slice(5)} 月非農就業${dk(IDX[A])[L] >= 0 ? '增加' : '減少'} ${fk(Math.abs(dk(IDX[A])[L]))}k，失業率 ${lv(U)[L].toFixed(1)}%`;
  document.getElementById('p1').innerHTML = `<p>美國 ${mzh(lm)}非農就業${dk(IDX[A])[L] >= 0 ? '增加' : '減少'} ${fk(Math.abs(dk(IDX[A])[L]))} 千人，前月 ${sgk(dk(IDX[A])[L - 1])}，3 個月平均 ${sgk(dk3(IDX[A])[L])}，過去 12 個月平均 ${sgk(a12(IDX[A]))}${D.prelim ? `（${D.prelim.map(mzh).join('、')}為初值）` : ''}。民間部門 ${sgk(dk(IDX[C])[L])}，政府 ${sgk(dk(IDX['Government'])[L])}。</p>
<p>產業別中增加最多的是${mv.up.map(([i, v]) => `${zhn(i)}（${sgk(v)}）`).join('、')}${mv.dn.length ? `；減少最多的是${mv.dn.map(([i, v]) => `${zhn(i)}（${sgk(v)}）`).join('、')}` : ''}。</p>`;
  document.getElementById('p2').innerHTML = `<p>家計調查方面，失業率 ${lv(U)[L].toFixed(1)}%（前月 ${lv(U)[L - 1].toFixed(1)}%，一年前 ${lv(U)[L - 12].toFixed(1)}%），25–54 歲就業人口比 ${lv('Employment-population ratio, 25-54 yrs')[L].toFixed(1)}%，勞參率 ${lv('Labor force participation rate')[L].toFixed(1)}%。平均時薪年增 ${f1(Y(AH)[L])}%，月增 ${f1(MM(AH)[L])}%。</p>`;
  document.getElementById('ovHow').textContent = `動能＝近 3 個月平均新增就業相對 12 個月平均：高出四分之一以上為加速（綠），低四分之一以上為放緩（紅）。點列可在 Components 拆開該產業。`;
  const OVN = [[A, 0], [C, 1], ['Goods-producing', 2], ['Construction', 3], ['Manufacturing', 3], ['Private service-providing', 2], ['Health care and social assistance', 3], ['Leisure and hospitality', 3], ['Professional and business services', 3], ['Government', 1]].filter(r => IDX[r[0]] != null);
  const lb = `${mlab(M[L])} '${M[L].slice(2, 4)}`;
  let h = `<thead><tr class="grp"><th>Nonfarm Payrolls (thous.)</th><th></th><th class="vl" colspan="2">Change</th><th class="vl" colspan="3">Avg. monthly change</th><th class="vl">Y/Y</th><th class="vl">Momentum</th><th class="vl">3M avg. chg, 24 mo.</th></tr>
<tr><th></th><th>Level</th><th class="vl">${lb}</th><th>${mlab(M[L - 1])}</th><th class="vl">3M</th><th>6M</th><th>12M</th><th class="vl">%</th><th class="vl"></th><th class="vl"></th></tr></thead><tbody>`;
  for (const [n, pad] of OVN) {
    const i = IDX[n], a3 = dk3(i)[L], s6 = D.sa[i][L - 6] != null ? (D.sa[i][L] - D.sa[i][L - 6]) / 6 : null, b12 = a12(i);
    const d = a3 != null && b12 != null ? a3 - b12 : null, thr = Math.max(5, Math.abs(b12 || 0) * 0.25);
    h += `<tr><td style="padding-left:${9 + pad * 14}px"><button type="button" class="nm" data-ov="${i}">${esc(nm(i))}</button></td><td>${fk(D.sa[i][L])}</td>` +
      `<td class="vl"><b>${sgk(dk(i)[L])}</b></td><td>${sgk(dk(i)[L - 1])}</td><td class="vl">${sgk(a3)}</td><td>${sgk(s6)}</td><td>${sgk(b12)}</td><td class="vl">${f1(Y(n)[L])}</td>` +
      `<td class="vl" style="text-align:left">${momTag(d, thr)}</td><td class="vl" style="padding:2px 9px">${spark(dk3(i))}</td></tr>`;
  }
  const el = document.getElementById('ovt'); el.innerHTML = h + '</tbody>';
  el.addEventListener('click', ev => { const b = ev.target.closest('button[data-ov]'); if (b) selectItem(+b.dataset.ov, 'compo'); });
  // household survey and wages
  const HH = [['Unemployment rate', 'lvl', 1], ['U-6 underutilization rate', 'lvl', 1], ['Labor force participation rate', 'lvl', 0], ['Employment-population ratio, 25-54 yrs', 'lvl', 0], [AH, 'yoy', 1], ['Average hourly earnings, production and nonsupervisory', 'yoy', 1], ['Average weekly hours, all employees', 'lvl', 0]].filter(r => IDX[r[0]] != null);
  let h2 = `<thead><tr class="grp"><th>Household survey & wages</th><th class="vl" colspan="2">Latest</th><th class="vl" colspan="2">Earlier</th><th class="vl">12M chg</th><th class="vl">24 mo.</th></tr>
<tr><th></th><th class="vl">${lb}</th><th>${mlab(M[L - 1])}</th><th class="vl">3M ago</th><th>12M ago</th><th class="vl"></th><th class="vl"></th></tr></thead><tbody>`;
  for (const [n, m, inv] of HH) {
    const v = val(IDX[n], m).v, dd = v[L] != null && v[L - 12] != null ? v[L] - v[L - 12] : null, unit = m === 'yoy' ? '% Y/Y' : IT[IDX[n]].u === '%' ? '%' : '';
    h2 += `<tr><td><button type="button" class="nm" data-hh="${IDX[n]}">${esc(nm(IDX[n]))}</button> <span class="note">${unit}</span></td><td class="vl"><b>${f1(v[L])}</b></td><td>${f1(v[L - 1])}</td><td class="vl">${f1(v[L - 3])}</td><td>${f1(v[L - 12])}</td><td class="vl">${dd == null ? '' : (dd > 0 ? '+' : '') + dd.toFixed(1)}</td><td class="vl" style="padding:2px 9px">${spark(v)}</td></tr>`;
  }
  const w2 = document.getElementById('ovt2w'); w2.hidden = false;
  const el2 = document.getElementById('ovt2'); el2.innerHTML = h2 + '</tbody>';
  el2.addEventListener('click', ev => { const b = ev.target.closest('button[data-hh]'); if (!b) return; const c = CH.ch5; c.st.ids = [{ i: +b.dataset.hh, ax: 'L' }]; c.st.m = IT[+b.dataset.hh].u === '%' ? 'lvl' : 'yoy'; c.save(); document.getElementById('ch5').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); });
}

/* ---------- drill-down table ---------- */
// average-level % change of year yr over yr-1, over months 1..upTo (12 = full year, less = year to date)
function annual(i, yr, upTo = 12) {
  const arr = has(D.nsa[i]) ? D.nsa[i] : D.sa[i], a = [], b = [];
  M.forEach((m, t) => { if (arr[t] == null || +m.slice(5) > upTo) return; if (m.startsWith(yr)) a.push(arr[t]); if (m.startsWith(String(yr - 1))) b.push(arr[t]); });
  if (a.length < upTo - 1 || b.length < upTo - 1 || !a.length || !b.length) return null;
  const av = x => x.reduce((p, c) => p + c, 0) / x.length;
  return av(a) / av(b) * 100 - 100;
}
// table columns follow the stacked chart: monthly for 3M/6M/YTD, yearly averages for longer ranges
// average monthly change within a year (Dec to Dec, or Dec to the latest month for the current year)
function avgChg(i, yr, upTo = 12) {
  const a = D.sa[i], t1 = M.indexOf(`${yr}-${String(upTo).padStart(2, '0')}`), t0 = M.indexOf(`${yr - 1}-12`);
  return t1 < 0 || t0 < 0 || a[t1] == null || a[t0] == null ? null : (a[t1] - a[t0]) / (t1 - t0);
}
function tableCols() {
  const m = STK.m, lbl = t => t === L || M[t].endsWith('-01') ? `${mlab(M[t])} '${M[t].slice(2, 4)}` : mlab(M[t]);
  const add = MEAS[m].add, other = add || m !== 'yoy' ? 'yoy' : 'mom', cf = add ? fk : f1;
  const tail = { g: other === 'yoy' ? 'Y/Y %' : 'M/M %, SA', cols: [{ lab: lbl(L), f: i => val(i, other).v[L] }] };
  if (['3M', '6M', 'YTD'].includes(STK.r)) {
    const s = rangeStart(STK.r, 0), cols = [];
    for (let t = L; t >= s; t--) cols.push({ lab: lbl(t), f: i => val(i, m).v[t], fmt: cf });
    return [{ g: MEAS[m].lab + (add ? ', thous.' : ' %') + ` · ${STK.r === 'YTD' ? 'year to date' : 'last ' + cols.length + ' months'}`, cols }, tail];
  }
  const cy = +M[L].slice(0, 4), mo = +M[L].slice(5), firstY = +M[0].slice(0, 4) + 1;
  const n = { '2Y': 2, '3Y': 3, '5Y': 5 }[STK.r] || cy - firstY;
  const yf = add ? (i, y, up) => avgChg(i, y, up) : annual;
  const cols = [{ lab: `${cy} YTD`, f: i => yf(i, cy, mo), fmt: cf }];
  for (let y = cy - 1; y >= Math.max(firstY, cy - n); y--) cols.push({ lab: String(y), f: i => yf(i, y, 12), fmt: cf });
  const first = add ? { lab: `Chg ${mlab(M[L])}`, f: i => val(i, 'dk').v[L], fmt: fk } : { lab: `M/M ${mlab(M[L])}`, f: i => val(i, 'mom').v[L] };
  return [{ g: add ? 'Avg. monthly chg, thous.' : 'Annual avg. % chg', cols }, { g: 'Latest', cols: [first, { lab: `Y/Y ${mlab(M[L])}`, f: i => val(i, 'yoy').v[L] }] }];
}
let TC = null;
const open = new Set([IDX[A]]);
let selI = null;
function rowHtml(i, depth) {
  const kids = IT[i].a ? [] : childrenOf(i), mm = val(i, 'mom');
  const cr = kids.length ? `<button type="button" class="cr" data-t="${i}" aria-expanded="${open.has(i)}" aria-label="${open.has(i) ? 'Collapse' : 'Expand'} ${esc(IT[i].n)}">${open.has(i) ? '▾' : '▸'}</button>` : '<span class="sp"></span>';
  let h = `<tr data-i="${i}" class="${selI === i ? 'sel' : ''}${IT[i].p ? ' prod' : ''}"><td style="padding-left:${6 + depth * 14}px">${cr}<button type="button" class="nm" data-p="${i}">${esc(nm(i) === IT[i].n ? IT[i].n : nm(i))}</button>${mm.nsa ? ' <span class="note">NSA</span>' : ''}</td>` +
    `<td>${IT[i].w != null ? IT[i].w.toFixed(1) : ''}</td>` +
    TC.map(g => g.cols.map((c, j) => `<td${j ? '' : ' class="vl"'}>${(c.fmt || f1)(c.f(i))}</td>`).join('')).join('') + '</tr>';
  if (open.has(i)) for (const k of kids) h += rowHtml(k, depth + 1);
  return h;
}
const AGG_OPEN = { v: false };
function drawTable() {
  TC = tableCols();
  const nc = 2 + TC.reduce((a, g) => a + g.cols.length, 0);
  let h = `<thead><tr class="grp"><th>${K.long} (${KIND === 'nfp' ? 'thous.' : '% chg'})</th><th></th>${TC.map(g => `<th class="vl" colspan="${g.cols.length}">${esc(g.g)}</th>`).join('')}</tr>
<tr><th></th><th>Wt.</th>${TC.map(g => g.cols.map((c, j) => `<th${j ? '' : ' class="vl"'}>${esc(c.lab)}</th>`).join('')).join('')}</tr></thead><tbody>`;
  h += rowHtml(IDX[A], 0);
  if (IT.some(it => it.a && !it.x)) h += `<tr class="gh"><td colspan="${nc}"><button type="button" class="cr" data-agg aria-expanded="${AGG_OPEN.v}">${AGG_OPEN.v ? '▾' : '▸'}</button>Special aggregates</td></tr>`;
  if (AGG_OPEN.v) IT.forEach((it, i) => { if (it.a && !it.x) h += rowHtml(i, 1); });
  document.getElementById('tbl').innerHTML = h + '</tbody>';
}
document.getElementById('tbl').addEventListener('click', ev => {
  const b = ev.target.closest('button'); if (!b) return;
  if (b.dataset.agg != null) { AGG_OPEN.v = !AGG_OPEN.v; drawTable(); return; }
  if (b.dataset.t) { const i = +b.dataset.t; open.has(i) ? open.delete(i) : open.add(i); drawTable(); document.querySelector(`#tbl button[data-t="${i}"]`)?.focus(); return; }
  if (b.dataset.p) { selectItem(+b.dataset.p, 'stk'); }
});

/* ---------- contributions ---------- */
// Weights: latest BLS relative importance, rolled back with each item's relative price (NSA),
// which is how relative importance drifts between basket updates. Contributions are approximate.
const wAt = (i, t) => { if (HASWH && D.wh[i]) return D.wh[i][t]; const p = has(D.nsa[i]) ? D.nsa[i] : D.sa[i]; return IT[i].w != null && p[t] != null && p[L] != null ? IT[i].w * p[t] / p[L] : null; };
function contrib(node, m) {
  const kids = weightedKids(node), lag = LAG[m];
  const tot = val(node, m).v;
  const cats = kids.map(k => {
    const ch = val(k, m).v;
    if (MEAS[m].add) return { i: k, v: ch };
    return { i: k, v: tot.map((_, t) => { if (t < lag || ch[t] == null) return null; const wk = wAt(k, t - lag), wp = wAt(node, t - lag); return wk == null || !wp ? null : wk / wp * ch[t]; }) };
  });
  const other = tot.map((x, t) => { if (x == null) return null; let s = 0; for (const c of cats) s += c.v[t] || 0; return x - s; });
  return { tot, cats, other };
}
const STK = Object.assign({ node: IDX[A], m: STK_MS[0], r: KIND === 'price' ? '5Y' : '2Y', hl: null }, store.get('stk') || {});
if (!STK_MS.includes(STK.m)) STK.m = STK_MS[0];
if (!IT[STK.node] || !weightedKids(STK.node).length) STK.node = IDX[A];
const KC = i => `--k${i % 10}`;
function drawStack() {
  const el = document.getElementById('stk');
  const { tot, cats, other } = contrib(STK.node, STK.m);
  const narrow = el.clientWidth < 560, W = narrow ? 460 : 900, H = narrow ? 340 : 360, x0 = 40, x1 = W - 40, y0 = 50, y1 = H - 46;
  const ft = tot.findIndex(v => v != null), s = Math.min(L, rangeStart(STK.r, Math.max(ft < 0 ? 0 : ft, LAG[STK.m]))), e = L, n = e - s, xw = (x1 - x0) / (n + 1);
  const X = i => x0 + (i - s + 0.5) * xw;
  const segs = [...cats.filter(c => c.v.some(v => v != null)).map((c, k) => ({ ...c, c: KC(k), name: nm(c.i) })), { i: -1, v: other, c: '--kx', name: 'Other / residual' }];
  let lo = 0, hi = 0;
  for (let t = s; t <= e; t++) {
    let p = 0, q = 0; for (const g of segs) { const v = g.v[t]; if (v > 0) p += v; else if (v < 0) q += v; }
    hi = Math.max(hi, p, tot[t] ?? 0); lo = Math.min(lo, q, tot[t] ?? 0);
  }
  const A_ = nice(lo, hi, 5), Yv = v => y1 - (v - A_.lo) / (A_.hi - A_.lo) * (y1 - y0);
  let g = '';
  for (let v = A_.lo; v <= A_.hi + 1e-9; v += A_.step) {
    g += `<line x1="${x0}" x2="${x1}" y1="${Yv(v)}" y2="${Yv(v)}" stroke="${css('--grid')}"/>`;
    g += `<text x="${x0 - 5}" y="${Yv(v) + 3.5}" font-size="10" text-anchor="end">${fmtT(v, A_.step)}</text><text x="${x1 + 5}" y="${Yv(v) + 3.5}" font-size="10">${fmtT(v, A_.step)}</text>`;
  }
  for (let t = s; t <= e; t++) if (tot[t] == null) g += `<rect x="${X(t) - xw / 2}" y="${y0}" width="${xw}" height="${y1 - y0}" fill="${css('--shade')}"/>`;
  const bw = Math.max(1.5, Math.min(40, xw * 0.74));
  for (let t = s; t <= e; t++) {
    let up = 0, dn = 0;
    segs.forEach((sg_, k) => {
      const v = sg_.v[t]; if (v == null || Math.abs(v) < 1e-6) return;
      const a = v > 0 ? up : dn, b = a + v; if (v > 0) up = b; else dn = b;
      const ya = Yv(Math.max(a, b)), h = Math.abs(Yv(a) - Yv(b));
      const fade = STK.hl != null && STK.hl !== sg_.i ? ' opacity=".28"' : '';
      g += `<rect class="seg" data-i="${sg_.i}" x="${X(t) - bw / 2}" y="${ya}" width="${bw}" height="${Math.max(.4, h)}" fill="${css(sg_.c)}"${fade}/>`;
    });
  }
  g += `<line x1="${x0}" x2="${x1}" y1="${Yv(0)}" y2="${Yv(0)}" stroke="${css('--axis')}" stroke-width=".8"/>`;
  let d = '', pen = false;
  for (let t = s; t <= e; t++) { if (tot[t] == null) { pen = false; continue; } d += (pen ? 'L' : 'M') + X(t).toFixed(1) + ' ' + Yv(tot[t]).toFixed(1); pen = true; }
  g += `<path d="${d}" fill="none" stroke="${css('--paper')}" stroke-width="3.6"/><path d="${d}" fill="none" stroke="${css('--tot')}" stroke-width="1.6"/>`;
  for (let t = s; t <= e; t++) if (tot[t] != null && n < 40) g += `<circle cx="${X(t)}" cy="${Yv(tot[t])}" r="2.4" fill="${css('--tot')}"/>`;
  // x axis
  for (let t = s; t <= e; t++) if (M[t].endsWith('-01')) g += `<line x1="${X(t) - xw / 2}" x2="${X(t) - xw / 2}" y1="${y1}" y2="${y1 + 5}" stroke="${css('--axis')}"/>`;
  if (n < 30) for (let t = s; t <= e; t++) { const mo = +M[t].slice(5);
    if (n < 12 || (mo - 1) % 3 === 0) g += `<text x="${X(t)}" y="${y1 + 14}" font-size="9.5" text-anchor="middle">${MON[mo - 1]}</text>`;
    if (mo === 1 || (t === s && (mo < 10 || n < 12))) g += `<text x="${X(t)}" y="${y1 + 27}" font-size="10" font-weight="700" text-anchor="${t === s ? 'start' : 'middle'}">${M[t].slice(0, 4)}</text>`; }
  else [...new Set(M.slice(s, e + 1).map(m => m.slice(0, 4)))].forEach(yr => {
    const idx = []; for (let t = s; t <= e; t++) if (M[t].startsWith(yr)) idx.push(t);
    if (idx.length >= 4) g += `<text x="${(X(idx[0]) + X(idx[idx.length - 1])) / 2}" y="${y1 + 15}" font-size="10.5" text-anchor="middle">${yr.slice(2)}</text>`; });
  g += `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" fill="none" stroke="${css('--frame')}" stroke-width=".8"/>`;
  const title = `Contributions to ${STK.node === IDX[A] ? K.long : K.tab + ': ' + nm(STK.node)}`;
  g += `<text x="${W / 2}" y="16" font-size="12.5" text-anchor="middle" style="fill:${css('--ink')}">${esc(title)}</text>`;
  g += `<text x="${W / 2}" y="31" font-size="11" text-anchor="middle" style="fill:${css('--ink')}">${MEAS[STK.m].sub}${MEAS[STK.m].add ? '' : ', Percentage Points'}</text>`;
  g += `<text x="${x0 - 30}" y="${H - 4}" font-size="9.5">Source:  ${K.src}${narrow ? '' : KIND === 'nfp' ? '; contributions are job changes by industry' : KIND === 'retail' ? '; contributions from sales shares' : HASWH ? '; contributions from nominal shares' : '; contributions estimated from relative importance'}</text>`;
  g += `<line class="xh" y1="${y0}" y2="${y1}" stroke="${css('--axis')}" stroke-width=".6" visibility="hidden"/>`;
  el.innerHTML = `<div class="plot"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)}">${g}</svg><div class="tip"></div></div><div class="tb"></div>`;
  // toolbar: breadcrumb, measure, range, legend
  const path = []; for (let i = STK.node; i != null; i = IT[i].a ? (i === IDX[A] ? null : IDX[A]) : parentOf(i)) path.unshift(i);
  const last = segs.map(sg_ => sg_.v[L]);
  el.querySelector('.tb').innerHTML =
    `<span class="crumb">${path.map((i, k) => k === path.length - 1 ? `<b>${esc(nm(i))}</b>` : `<button type="button" data-go="${i}">${esc(nm(i))}</button> ›`).join(' ')}</span>` +
    `<span class="seg" role="group" aria-label="Measure">${STK_MS.map(k => `<button type="button" data-m="${k}" aria-pressed="${STK.m === k}">${MEAS[k].lab}</button>`).join('')}</span>` +
    `<span class="seg" role="group" aria-label="Range">${RANGE_KEYS.map(k => `<button type="button" data-r="${k}" aria-pressed="${STK.r === k}">${k}</button>`).join('')}</span>` +
    `<span class="klg"><button type="button" disabled style="cursor:default"><i class="ln"></i><span>${esc(nm(STK.node))}</span><em>${MEAS[STK.m].add ? fk(tot[L]) : f1(tot[L])}</em></button>` +
    segs.map((sg_, k) => `<button type="button" data-k="${sg_.i}" class="${STK.hl === sg_.i ? 'on' : ''}" ${sg_.i < 0 ? 'disabled style="cursor:default"' : ''} title="${sg_.i >= 0 && weightedKids(sg_.i).length ? '再往下拆' : ''}"><i style="background:${css(sg_.c)}"></i><span>${esc(sg_.name)}</span><em>${last[k] == null ? 'n.a.' : (last[k] >= 0 ? '+' : '') + (MEAS[STK.m].add ? Math.round(last[k]).toLocaleString('en-US') : (Math.abs(last[k]) < 0.005 ? 0 : last[k]).toFixed(2))}</em>${sg_.i >= 0 && weightedKids(sg_.i).length ? '<span class="dn">▸</span>' : ''}</button>`).join('') + '</span>';
  // hover
  const svg = el.querySelector('svg'), tip = el.querySelector('.tip'), xl = el.querySelector('.xh');
  const move = ev => {
    const r = svg.getBoundingClientRect(), p = ev.touches ? ev.touches[0] : ev;
    const sx = (p.clientX - r.left) / r.width * W;
    if (sx < x0 || sx > x1) return out();
    const t = Math.max(s, Math.min(e, Math.floor(s + (sx - x0) / xw)));
    xl.setAttribute('x1', X(t)); xl.setAttribute('x2', X(t)); xl.setAttribute('visibility', 'visible');
    const rows = segs.map(sg_ => [sg_, sg_.v[t]]).filter(r_ => r_[1] != null).sort((a, b) => b[1] - a[1]);
    tip.innerHTML = `<b>${mlab(M[t])} ${M[t].slice(0, 4)} · ${esc(nm(STK.node))} ${MEAS[STK.m].add ? fk(tot[t]) + 'k' : f1(tot[t]) + '%'}</b><br>` +
      rows.map(([sg_, v]) => `<span style="color:${css(sg_.c)}">■</span> ${esc(sg_.name)}: ${v > 0 ? '+' : ''}${MEAS[STK.m].add ? Math.round(v).toLocaleString('en-US') + 'k' : v.toFixed(2) + ' pp'}`).join('<br>');
    tip.style.display = 'block';
    const px = X(t) / W * r.width, tw = tip.offsetWidth;
    tip.style.left = Math.max(0, px + 14 + tw > r.width ? px - tw - 4 : px + 14) + 'px';
    tip.style.top = (y0 / H * r.height + 6) + 'px';
  };
  const out = () => { tip.style.display = 'none'; xl.setAttribute('visibility', 'hidden'); };
  svg.addEventListener('mousemove', move); svg.addEventListener('mouseleave', out);
  svg.addEventListener('touchstart', move, { passive: true }); svg.addEventListener('touchmove', move, { passive: true });
  store.set('stk', { node: STK.node, m: STK.m, r: STK.r });
}
// select an item from anywhere: drill the stack, sync the table and the line chart
function selectItem(i, scrollTo) {
  const kids = IT[i].a ? [] : weightedKids(i);
  if (kids.length) { STK.node = i; STK.hl = null; }
  else { const p = parentOf(i); if (p != null && weightedKids(p).includes(i)) STK.node = p; STK.hl = i; }
  // open the table path down to the item
  for (let j = IT[i].a ? null : parentOf(i); j != null; j = parentOf(j)) open.add(j);
  if (kids.length) open.add(i);
  selI = i;
  const p = parentOf(i), c = CH.ch5;
  if (c) { c.st.ids = [{ i, ax: 'L' }]; if (p != null && p !== i) c.st.ids.push({ i: p, ax: 'L' }); c.save(); }
  drawStack(); drawTable();
  if (scrollTo) document.getElementById(scrollTo).scrollIntoView({ behavior: 'smooth', block: scrollTo === 'compo' ? 'start' : 'nearest' });
}
document.getElementById('stk').addEventListener('click', ev => {
  const r = ev.target.closest('rect.seg');
  if (r) { const i = +r.dataset.i; if (i >= 0) selectItem(i); return; }
  const b = ev.target.closest('button'); if (!b || b.disabled) return;
  if (b.dataset.go) selectItem(+b.dataset.go);
  else if (b.dataset.k) selectItem(+b.dataset.k);
  else if (b.dataset.m) { STK.m = b.dataset.m; drawStack(); drawTable(); }
  else if (b.dataset.r) { STK.r = b.dataset.r; drawStack(); drawTable(); }
});

/* ---------- breadth (PCE dispersion) ---------- */
let BREADTH_REDRAW = null;
if (D.disp) (function breadth() {
  const P = D.disp, sec = document.getElementById('brd'); sec.hidden = false;
  const BM = P.y12.map((_, k) => { const y = +P.start.slice(0, 4) + Math.floor((+P.start.slice(5) - 1 + k) / 12), m = (+P.start.slice(5) - 1 + k) % 12 + 1; return `${y}-${String(m).padStart(2, '0')}`; });
  const BL = BM.length - 1, last = P.comps.length, thr = P.thr;
  const y12 = P.y12[BL], a6 = P.a6[BL];
  const peakA6 = Math.max(...P.a6), peakA6m = BM[P.a6.indexOf(peakA6)];
  const cmp = (v, pre) => v > pre + 3 ? '仍明顯高於' : v < pre - 3 ? '已低於' : '接近';
  document.getElementById('brdTxt').innerHTML =
    `過去 12 個月，PCE 籃子 <b>${last}</b> 個細項中有 <b>${y12.toFixed(0)}%</b> 漲幅超過 ${thr}%，低於疫後高點 ${P.peak.v.toFixed(0)}%（${mzh(P.peak.m)}），但${cmp(y12, P.pre_y12)}疫情前二十年（1995–2019）的平均 ${P.pre_y12.toFixed(0)}%。` +
    `只看過去 6 個月（年化），比例為 <b>${a6.toFixed(0)}%</b>，疫後高點 ${peakA6.toFixed(0)}%（${mzh(peakA6m)}），疫前平均 ${P.pre_a6.toFixed(0)}%，結論${Math.sign(y12 - P.pre_y12) === Math.sign(a6 - P.pre_a6) ? '相同' : '不同'}。資料至 ${mzh(BM[BL])}。`;
  // trend chart
  let br = store.get('brdR') || 'Max';
  const RK = ['5Y', '10Y', '20Y', 'Max'], RB = { '5Y': 60, '10Y': 120, '20Y': 240 };
  const tsEl = document.getElementById('brdTs');
  tsEl.innerHTML = '<div class="plot"></div><div class="tb"></div>';
  const drawTs = () => {
    const s = RB[br] ? Math.max(0, BM.length - RB[br]) : 0;
    hv(tsEl.querySelector('.plot'), { months: BM, start: s, title: `Share of PCE Components Rising Faster than ${thr}%`, sub: '% of Components', unit: '%', src: 'Bureau of Economic Analysis',
      series: [{ name: '12-Mo. % Change', v: P.y12, c: '--c1', axis: 'L' }, { name: '6-Mo. Annualized', v: P.a6, c: '--c2', axis: 'L' },
        { name: `1995–2019 avg., 12-Mo. (${P.pre_y12.toFixed(0)}%)`, v: P.y12.map(() => P.pre_y12), c: '--frame', axis: 'L', dash: 1 }] });
    tsEl.querySelector('.tb').innerHTML = `<span class="seg" role="group" aria-label="Range">${RK.map(k => `<button type="button" data-r="${k}" aria-pressed="${k === br}">${k}</button>`).join('')}</span>`;
  };
  tsEl.querySelector('.tb').addEventListener('click', ev => { const b = ev.target.closest('button[data-r]'); if (b) { br = b.dataset.r; store.set('brdR', br); drawTs(); } });
  drawTs();
  // distribution of component price changes
  const EDG = [-Infinity, -2, 0, 1, 2, 3, 4, 5, 7.5, 10, Infinity];
  const LBL = ['< -2', '-2–0', '0–1', '1–2', '2–3', '3–4', '4–5', '5–7.5', '7.5–10', '> 10'];
  let hm = store.get('brdM') || 'y12', sel = null;
  const hEl = document.getElementById('brdHist'), list = document.getElementById('brdList');
  hEl.innerHTML = '<div class="plot"></div><div class="tb"></div>';
  const drawHist = () => {
    const col = hm === 'y12' ? 1 : 2, bins = LBL.map(() => []);
    for (const c of P.comps) { const v = c[col]; if (v == null) continue; const k = EDG.findIndex((e, j) => v >= e && v < EDG[j + 1]); bins[k].push(c); }
    const tot = bins.reduce((a, b) => a + b.length, 0), pct = bins.map(b => b.length / tot * 100);
    const W = 460, H = 330, x0 = 40, x1 = W - 40, y0 = 50, y1 = H - 46, bw = (x1 - x0) / LBL.length;
    const ax = nice(0, Math.max(...pct), 5), Yv = v => y1 - v / ax.hi * (y1 - y0);
    let g = '';
    for (let v = 0; v <= ax.hi + 1e-9; v += ax.step) g += `<line x1="${x0}" x2="${x1}" y1="${Yv(v)}" y2="${Yv(v)}" stroke="${css('--grid')}"/><text x="${x0 - 5}" y="${Yv(v) + 3.5}" font-size="10" text-anchor="end">${fmtT(v, ax.step)}</text><text x="${x1 + 5}" y="${Yv(v) + 3.5}" font-size="10">${fmtT(v, ax.step)}</text>`;
    pct.forEach((p, k) => {
      const x = x0 + k * bw, hot = EDG[k] >= thr, fade = sel != null && sel !== k ? ' opacity=".35"' : '';
      g += `<rect class="bin" data-k="${k}" x="${x + bw * 0.12}" y="${Yv(p)}" width="${bw * 0.76}" height="${y1 - Yv(p)}" fill="${css(hot ? '--c2' : '--c1')}"${fade}/>`;
      g += `<text x="${x + bw / 2}" y="${Yv(p) - 4}" font-size="9.5" text-anchor="middle">${p.toFixed(0)}</text>`;
      g += `<text x="${x + bw / 2}" y="${y1 + 14}" font-size="9" text-anchor="middle">${LBL[k]}</text>`;
    });
    const xt = x0 + 5 * bw;
    g += `<line x1="${xt}" x2="${xt}" y1="${y0}" y2="${y1}" stroke="${css('--axis')}" stroke-dasharray="3 3"/><text x="${xt + 4}" y="${y0 + 12}" font-size="10" style="fill:${css('--c2')}">Above ${thr}%: ${(pct.slice(5).reduce((a, b) => a + b, 0)).toFixed(0)}%</text>`;
    g += `<text x="${xt - 4}" y="${y0 + 12}" font-size="10" text-anchor="end" style="fill:${css('--c1')}">Below: ${(pct.slice(0, 5).reduce((a, b) => a + b, 0)).toFixed(0)}%</text>`;
    g += `<text x="${(x0 + x1) / 2}" y="${y1 + 30}" font-size="10" text-anchor="middle">Price change, %</text>`;
    g += `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" fill="none" stroke="${css('--frame')}" stroke-width=".8"/>`;
    g += `<text x="${W / 2}" y="16" font-size="12.5" text-anchor="middle" style="fill:${css('--ink')}">PCE Components by Price Change, ${mlab(BM[BL])} ${BM[BL].slice(0, 4)}</text>`;
    g += `<text x="${W / 2}" y="31" font-size="11" text-anchor="middle" style="fill:${css('--ink')}">% of ${tot} Components, ${hm === 'y12' ? '12-Mo. % Change' : '6-Mo. % Change, Annualized'}</text>`;
    g += `<text x="${x0 - 30}" y="${H - 4}" font-size="9.5">Source:  Bureau of Economic Analysis</text>`;
    hEl.querySelector('.plot').innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Distribution of PCE component price changes">${g}</svg><div class="tip"></div>`;
    hEl.querySelector('.tb').innerHTML = `<span class="seg" role="group" aria-label="Horizon">${[['y12', '12M'], ['a6', '6M ann.']].map(([k, l]) => `<button type="button" data-h="${k}" aria-pressed="${k === hm}">${l}</button>`).join('')}</span><span class="note">點長條看該區間的細項</span>`;
    const svg = hEl.querySelector('svg'), tip = hEl.querySelector('.tip');
    svg.querySelectorAll('rect.bin').forEach(r => {
      r.addEventListener('mousemove', ev => {
        const k = +r.dataset.k, b = bins[k].slice().sort((p, q) => q[col] - p[col]), rc = svg.getBoundingClientRect();
        tip.innerHTML = `<b>${LBL[k]}%: ${b.length} 項</b><br>` + b.slice(0, 6).map(c => `${esc(c[0])} ${c[col].toFixed(1)}`).join('<br>') + (b.length > 6 ? `<br>… +${b.length - 6}` : '');
        tip.style.display = 'block';
        const px = ev.clientX - rc.left, tw = tip.offsetWidth;
        tip.style.left = (px + 14 + tw > rc.width ? px - tw - 8 : px + 14) + 'px'; tip.style.top = '40px';
      });
      r.addEventListener('mouseleave', () => { tip.style.display = 'none'; });
    });
    if (sel == null) { list.hidden = true; return; }
    const b = bins[sel].slice().sort((p, q) => q[col] - p[col]);
    list.hidden = false;
    list.innerHTML = `<h3>${LBL[sel]}%（${hm === 'y12' ? '12 個月' : '6 個月年化'}）：${b.length} 項 · 點名稱在 Components 拆開</h3><ol>${b.map(c => `<li><button type="button" class="nm" data-n="${esc(c[0])}">${esc(c[0])}</button><span>${c[col].toFixed(1)}</span></li>`).join('')}</ol>`;
  };
  hEl.addEventListener('click', ev => {
    const b = ev.target.closest('button[data-h]'); if (b) { hm = b.dataset.h; store.set('brdM', hm); drawHist(); return; }
    const r = ev.target.closest('rect.bin'); if (r) { sel = sel === +r.dataset.k ? null : +r.dataset.k; drawHist(); }
  });
  list.addEventListener('click', ev => { const b = ev.target.closest('button[data-n]'); if (b && IDX[b.dataset.n] != null) selectItem(IDX[b.dataset.n], 'compo'); });
  drawHist();
  BREADTH_REDRAW = () => { drawTs(); drawHist(); };
})();

/* ---------- charts ---------- */
const I = n => IDX[n];
const DEF = KIND === 'price' ? {
  ch1: { title: K.long, m: 'yoy', r: 'Max', ref: 1, ids: [{ i: I(A), ax: 'L' }, { i: I(C), ax: 'L' }] },
  ch2: { title: K.long, m: 'mom', r: '2Y', ids: [{ i: I(A), ax: 'L' }, { i: I(C), ax: 'L' }] },
  ch3: { title: `${K.tab}: Core Goods vs. Core Services`, m: 'yoy', r: 'Max', ids: [{ i: I(SV), ax: 'L' }, { i: I(GD), ax: 'L' }, { i: I(SH), ax: 'L', dash: 1 }] },
  ch4: { title: `${K.tab}: Energy & Food`, m: 'yoy', r: 'Max', ids: [{ i: I(E), ax: 'L' }, { i: I(F), ax: 'R' }] },
  ch5: { title: '', m: 'yoy', r: '5Y', ref: 1, W: 900, H: 360, ids: [{ i: I(SH), ax: 'L' }, { i: parentOf(I(SH)), ax: 'L' }] }
} : KIND === 'retail' ? {
  ch1: { title: 'Retail Sales', m: 'yoy', r: '5Y', ids: [{ i: I(A), ax: 'L' }, { i: I(C), ax: 'L' }] },
  ch2: { title: 'Retail Sales', m: 'mom', r: '2Y', ids: [{ i: I(A), ax: 'L' }, { i: I(C), ax: 'L' }] },
  ch3: { title: 'Retail Sales: Nonstore vs. Food Services', m: 'yoy', r: 'Max', ids: [{ i: I('Nonstore retailers (e-commerce)'), ax: 'L' }, { i: I('Food services and drinking places'), ax: 'L' }] },
  ch4: { title: 'Retail Sales: Autos & Gasoline', m: 'yoy', r: 'Max', ids: [{ i: I('Motor vehicle and parts dealers'), ax: 'L' }, { i: I('Gasoline stations'), ax: 'R' }] },
  ch5: { title: '', m: 'yoy', r: '5Y', W: 900, H: 360, ids: [{ i: I('Nonstore retailers (e-commerce)'), ax: 'L' }, { i: parentOf(I('Nonstore retailers (e-commerce)')), ax: 'L' }] }
} : {
  ch1: { title: 'Nonfarm Payrolls', m: 'dk', r: '2Y', ids: [{ i: I(A), ax: 'L' }] },
  ch2: { title: 'Unemployment Rate', m: 'lvl', r: 'Max', ids: [{ i: I('Unemployment rate'), ax: 'L' }, { i: I('U-6 underutilization rate'), ax: 'L' }] },
  ch3: { title: 'Prime-Age Employment & Participation', m: 'lvl', r: 'Max', ids: [{ i: I('Employment-population ratio, 25-54 yrs'), ax: 'L' }, { i: I('Labor force participation rate'), ax: 'R' }] },
  ch4: { title: 'Average Hourly Earnings', m: 'yoy', r: 'Max', ids: [{ i: I('Average hourly earnings, all employees'), ax: 'L' }, { i: I('Average hourly earnings, production and nonsupervisory'), ax: 'L' }] },
  ch5: { title: '', m: 'dk3', r: '3Y', W: 900, H: 360, ids: [{ i: I('Health care and social assistance'), ax: 'L' }, { i: parentOf(I('Health care and social assistance')), ax: 'L' }] }
};
for (const id in DEF) chart(id, DEF[id]);
const s5 = store.get('ch5'); if (s5 && s5.ids[0]) selI = s5.ids[0].i;
drawTable();
drawStack();
let rzT, lastW = innerWidth < 600;
addEventListener('resize', () => { clearTimeout(rzT); rzT = setTimeout(() => { const nw = innerWidth < 600; if (nw !== lastW) { lastW = nw; CH.ch5.draw(); drawStack(); } }, 150); });
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { for (const k in CH) CH[k].draw(); drawStack(); BREADTH_REDRAW && BREADTH_REDRAW(); });