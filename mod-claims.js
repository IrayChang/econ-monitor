mount('tpl-claims');
/* ---------- weekly labor pulse: jobless claims, ADP, CPS flows ---------- */
const P = window.ALL_DATA.pulse, W = P.hist.weeks, MM_ = P.hist.months, IT_ = P.meta.items;
const K = { src: 'Department of Labor' };
const get = (k, axis) => { const s = (P.hist.series[k] || {}).v, ax = axis === 'w' ? W : MM_, a = new Array(ax.length).fill(null); if (s) s.v.forEach((x, j) => { if (s.o + j < a.length) a[s.o + j] = x; }); return a; };
const lastIdx = a => { for (let t = a.length - 1; t >= 0; t--) if (a[t] != null) return t; return -1; };
const th = a => a.map(v => v == null ? null : v / 1000);
const dif = a => a.map((v, t) => t && v != null && a[t - 1] != null ? v - a[t - 1] : null);
const ICSA = th(get('ICSA', 'w')), IC4 = th(get('IC4WSA', 'w')), CCSA = th(get('CCSA', 'w')), CC4 = th(get('CC4WSA', 'w')), IUR = get('IURSA', 'w'), ADPW = get('ADPW', 'w');
const LW = lastIdx(ICSA), LC = lastIdx(CCSA), wk = W[LW];
const fk = v => v == null ? 'n.a.' : Math.round(v).toLocaleString('en-US');
const sgk = v => v == null ? '' : (v >= 0 ? '+' : '−') + Math.abs(Math.round(v)).toLocaleString('en-US');
const wlab = s => `${MON[+s.slice(5, 7) - 1]} ${+s.slice(8)}`;
document.getElementById('dt').textContent = `Week ending ${fmtDate(wk)}`;
document.getElementById('demo').textContent = `Demo：Economy in Brief 的版面與出版圖風格，加上互動。週資料只有單一序列、沒有細項，所以只用總覽表加出版圖。資料至 ${fmtDate(wk)} 當週。`;
document.getElementById('hd').textContent = `美國 ${wlab(wk)} 當週初領失業金 ${fk(ICSA[LW])} 千人，續領 ${(CCSA[LC] / 1000).toFixed(3)} 百萬人`;
// lowest/highest since helper for the narrative
const since = (a, t, low) => { for (let j = t - 1; j >= 0; j--) if (a[j] != null && (low ? a[j] <= a[t] : a[j] >= a[t])) return W[j]; return null; };
const lowS = since(ICSA, LW, ICSA[LW] < ICSA[LW - 1]);
document.getElementById('cp1').innerHTML = `<p>截至 ${fmtDate(wk)} 當週，初領失業金人數${ICSA[LW] < ICSA[LW - 1] ? '減少' : '增加'} ${fk(Math.abs(ICSA[LW] - ICSA[LW - 1]))} 千人至 ${fk(ICSA[LW])} 千人${lowS ? `，為 ${fmtDate(lowS)} 當週以來${ICSA[LW] < ICSA[LW - 1] ? '最低' : '最高'}` : ''}。4 週平均 ${fk(IC4[LW])} 千人（前週 ${fk(IC4[LW - 1])}），一年前為 ${fk(IC4[LW - 52])}。</p>
<p>續領人數（晚一週公布）在 ${fmtDate(W[LC])} 當週為 ${fk(CCSA[LC])} 千人，${CCSA[LC] >= CCSA[LC - 1] ? '增加' : '減少'} ${fk(Math.abs(CCSA[LC] - CCSA[LC - 1]))} 千人；投保失業率 ${f1(IUR[LC])}%。續領偏高代表失業者找到工作的速度變慢，初領偏低代表裁員仍少。</p>`;

/* ---------- overview: weekly ---------- */
(function weekly() {
  const rows = [['Initial claims', ICSA, LW, 'k'], ['Initial claims, 4-week avg.', IC4, LW, 'k'], ['Continuing claims', CCSA, LC, 'k'], ['Continuing claims, 4-week avg.', CC4, LC, 'k'], ['Insured unemployment rate', IUR, LC, '%']];
  const adpL = lastIdx(ADPW); if (adpL > 0) rows.push(['ADP private employment, weekly', ADPW, adpL, 'lvl']);
  let h = `<thead><tr class="grp"><th>Weekly (thous., SA)</th><th class="vl">Week</th><th class="vl" colspan="2">Latest</th><th class="vl" colspan="2">Earlier</th><th class="vl">Y/Y</th><th class="vl">52 wks</th></tr>
<tr><th></th><th class="vl">ending</th><th class="vl">Value</th><th>Chg</th><th class="vl">4 wks ago</th><th>52 wks ago</th><th class="vl">%</th><th class="vl"></th></tr></thead><tbody>`;
  for (const [n, a, t, u] of rows) {
    const v = a[t], fm = u === '%' ? x => f1(x) : fk;
    // claims and the insured rate up are bad; ADP employment is a level, so only its changes are shaded
    const tn = u === 'lvl' ? 'good' : 'bad', st = u === 'lvl' ? null : heatStat(a, W, t), hz = (x, html, cls) => heatTd(html, heatZ(x, st), tn, cls);
    const yy = a.map((x, j) => j >= 52 && x != null && a[j - 52] ? (x / a[j - 52] - 1) * 100 : null), dd = dif(a);
    h += `<tr><td>${n}</td><td class="vl note">${wlab(W[t])}</td>${hz(v, `<b>${fm(v)}</b>`, 'vl')}` +
      heatTd(u === '%' ? (v - a[t - 1] ? sg(v - a[t - 1]) : '0.0') : sgk(v - a[t - 1]), heatZ(dd[t], heatStat(dd, W, t)), tn) +
      `${hz(a[t - 4], fm(a[t - 4]), 'vl')}${hz(a[t - 52], fm(a[t - 52]))}${u === '%' ? '<td class="vl"></td>' : heatTd(f1(yy[t]), heatZ(yy[t], heatStat(yy, W, t)), tn, 'vl')}<td class="vl" style="padding:2px 9px">${sparkline(a.slice(0, t + 1), 52)}</td></tr>`;
  }
  document.getElementById('cov').innerHTML = h + '</tbody>';
  document.getElementById('cLg').innerHTML = heatLegend('good', '綠＝初領、續領與投保失業率低於疫情前常態（勞動市場較緊），赭紅＝高於常態。顏色深淺＝與該項目 2016–2019 年的平均相比，差距以平常的波動幅度衡量（約 2.5 倍時為滿色）；ADP 為人數水準，只比較變動。'); 
})();
/* ---------- overview: monthly companions ---------- */
const MON_ITEMS = IT_.filter(it => it.axis === 'm' && it.grp !== 'adp_ind' && it.grp !== 'adp_size' && it.k !== 'CNP16OV');
(function monthly() {
  let h = `<thead><tr class="grp"><th>Monthly companions</th><th class="vl" colspan="2">Latest</th><th class="vl" colspan="2">Earlier</th><th class="vl">24 mo.</th></tr><tr><th></th><th class="vl">Value</th><th>Prior</th><th class="vl">3M ago</th><th>12M ago</th><th class="vl"></th></tr></thead><tbody>`;
  for (const it of MON_ITEMS) {
    let a = get(it.k, 'm'); const isLvl = it.k === 'ADP'; if (isLvl) a = dif(a);
    const t = lastIdx(a); if (t < 0) continue;
    const fm = it.unit === '%' ? f1 : isLvl ? sgk : fk;
    // ADP hiring up is good; pay growth reads like a price; the unemployment counts up are bad
    const tn = isLvl ? 'good' : it.grp === 'pay' ? 'price' : 'bad', st = heatStat(a, MM_, t), hz = (j, cls, b) => heatTd(b ? `<b>${fm(a[j])}</b>` : fm(a[j]), heatZ(a[j], st), tn, cls);
    h += `<tr><td>${esc(isLvl ? 'ADP private employment, monthly change' : it.n)} <span class="note">${esc(it.zh)}${it.unit === '%' ? ' · %' : ''} · ${plab(MM_[t])}</span></td>${hz(t, 'vl', 1)}${hz(t - 1)}${hz(t - 3, 'vl')}${hz(t - 12)}<td class="vl" style="padding:2px 9px">${sparkline(a.slice(0, t + 1), 24)}</td></tr>`;
  }
  document.getElementById('cov2').innerHTML = h + '</tbody>';
  document.getElementById('cLg2').innerHTML = heatLegend('good', '綠＝對就業有利（失業人數少、ADP 增加多），赭紅＝不利；薪資成長改用藍（低）與赭紅（高）。顏色深淺＝與該項目 2016–2019 年（疫情前）的平均相比，差距以平常的波動幅度衡量。');
})();

/* ---------- charts ---------- */
const WR = { '3M': 13, '6M': 26, '1Y': 52, '2Y': 104, '5Y': 260, Max: 0 };
const WL = W.slice(0, LW + 1), cut = a => a.slice(0, LW + 1);
const WCAT = [
  { k: 'icsa', n: 'Initial Claims', v: cut(ICSA), grp: 'Claims, thous.' }, { k: 'ic4', n: 'Initial Claims, 4-Week Moving Average', v: cut(IC4), grp: 'Claims, thous.', dash: 0 },
  { k: 'ccsa', n: 'Continuing Claims', v: cut(CCSA), grp: 'Claims, thous.' }, { k: 'cc4', n: 'Continuing Claims, 4-Week Moving Average', v: cut(CC4), grp: 'Claims, thous.' },
  { k: 'iur', n: 'Insured Unemployment Rate', v: cut(IUR), grp: 'Rate, %', sub: '%, SA' },
  { k: 'adpw', n: 'ADP Private Employment, Weekly Change', v: cut(dif(ADPW)), grp: 'ADP, thous.', sub: 'Change, Thous.' }
];
const wopt = (def, Wd = 460, H = 330) => ({ months: WL, cat: WCAT, ranges: WR, fmt: v => Math.abs(v) >= 100 ? fk(v) : v.toFixed(2), src: 'Department of Labor', W: Wd, H, def });
seriesChart('cch1', wopt({ title: 'Initial Jobless Insurance Claims', sub: 'SA, Thous.', r: '2Y', ids: [{ k: 'icsa' }, { k: 'ic4' }] }));
seriesChart('cch2', wopt({ title: 'Continuing Claims', sub: 'SA, Thous.', r: '2Y', ids: [{ k: 'ccsa' }, { k: 'cc4' }] }));
seriesChart('cch3', wopt({ title: 'Insured Unemployment Rate', sub: '%, SA', r: '5Y', ids: [{ k: 'iur' }] }));
seriesChart('cch4', wopt({ title: 'Initial Claims, 4-Week Moving Average', sub: 'SA, Thous.', r: 'Max', ids: [{ k: 'ic4' }] }));
const LM = Math.max(...MON_ITEMS.map(it => lastIdx(get(it.k, 'm'))));
const MCAT = MON_ITEMS.map(it => ({ k: it.k, n: it.k === 'ADP' ? 'ADP Private Employment, Monthly Change' : it.n, v: (it.k === 'ADP' ? dif(get(it.k, 'm')) : get(it.k, 'm')).slice(0, LM + 1), grp: { cps: 'Unemployed by reason (CPS), thous.', adp: 'ADP', pay: 'ADP Pay Insights, % Y/Y' }[it.grp] || it.grp }));
const MR = { '1Y': 12, '2Y': 24, '5Y': 60, Max: 0 };
const mopt = def => ({ months: MM_.slice(0, LM + 1), cat: MCAT, ranges: MR, fmt: v => Math.abs(v) >= 100 ? fk(v) : v.toFixed(1), src: 'BLS; ADP Research', W: 460, H: 330, def });
seriesChart('cch5', mopt({ title: 'Unemployed: Job Losers vs. Job Leavers', sub: 'Thous., SA', r: '5Y', ids: [{ k: 'LNS13023621' }, { k: 'LNS13023705', ax: 'R' }] }));
seriesChart('cch6', mopt({ title: 'ADP Pay Growth: Job-Stayers vs. Job-Changers', sub: 'Median Annual Pay Change, %', r: '5Y', ids: [{ k: 'PAY:Job-stayers:base' }, { k: 'PAY:Job-changers:base' }] }));
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { for (const k in SC) SC[k].draw(); });
