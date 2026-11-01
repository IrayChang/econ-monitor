mount('tpl-liq');
/* ---------- Fed balance sheet, reserves, TGA, money-market rates and facilities ---------- */
const Q = window.LIQ_DATA, WK = Q.weeks, DY = Q.days;
const w = k => Q.w[k] || WK.map(() => null), d = k => Q.d[k] || DY.map(() => null);
const lastI = a => { for (let t = a.length - 1; t >= 0; t--) if (a[t] != null) return t; return -1; };
const minus = (a, b) => a.map((v, t) => v == null || b[t] == null ? null : v - b[t]);
const bp = (a, b) => a.map((v, t) => v == null || b[t] == null ? null : Math.round((v - b[t]) * 100));
const chg = (a, k) => a.map((v, t) => t >= k && v != null && a[t - k] != null ? v - a[t - k] : null);
// weekly: H.4.1 Wednesday levels, $ billions
const WALCL = w('WALCL'), UST = w('TREAST'), MBS = w('MBS'), RES = w('RES'), TGAW = w('TGAW'), FRRP = w('FRRP'), PCR = w('PCR'), REPO = w('REPO');
const ONRRPW = minus(w('RRPW'), FRRP), NETL = minus(minus(WALCL, TGAW), ONRRPW);
// reserve ampleness: reserves as % of commercial bank total assets (H.8, seasonally adjusted)
const BTA = w('BTA'), RESR = RES.map((v, t) => v == null || BTA[t] == null ? null : v / BTA[t] * 100);
// daily: rates in %, operations and TGA in $ billions
const SOFR = d('SOFR'), EFFR = d('EFFR'), IORB = d('IORB'), RRPR = d('RRPR'), SRFR = d('SRFR'), SOFR99 = d('SOFR99'), SOFRV = d('SOFRV');
const RRP = d('RRP'), SRF = d('SRF'), TGA = d('TGA'), FFTL = d('FFTL'), FFTU = d('FFTU');
const S_IORB = bp(SOFR, IORB), E_IORB = bp(EFFR, IORB), S99_IORB = bp(SOFR99, IORB);
const LW = lastI(WALCL), LD = Math.max(lastI(SOFR), lastI(TGA), lastI(RRP));
// EFFR − IORB averaged over each H.4.1 week (Thursday to Wednesday), to set against the weekly reserve ratio
const E_IORBW = WK.map((wd, t) => { const a = []; for (let j = 0; j < DY.length; j++) if (DY[j] <= wd && (t === 0 || DY[j] > WK[t - 1]) && E_IORB[j] != null) a.push(E_IORB[j]); return a.length ? a.reduce((p, q) => p + q, 0) / a.length : null; });
// New York Fed Reserve Demand Elasticity: bp change in EFFR − IORB for a rise in reserves equal to 1% of bank assets
const RD = Q.rdates || [], r_ = k => (Q.r || {})[k] || RD.map(() => null);
const RDE = r_('RDE'), RDE025 = r_('RDE025'), RDE975 = r_('RDE975'), RDE16 = r_('RDE16'), RDE84 = r_('RDE84'), LR = lastI(RDE);
const fb = v => v == null ? 'n.a.' : Math.round(v).toLocaleString('en-US');
const fb1 = v => v == null ? 'n.a.' : v < 10 && v > -10 ? v.toFixed(1) : fb(v);
const sgb = v => v == null ? 'n.a.' : (v > 0 ? '+' : v < 0 ? '−' : '') + fb1(Math.abs(v));
const f2 = v => v == null ? 'n.a.' : v.toFixed(2);
const tn = v => v == null ? 'n.a.' : (v / 1000).toFixed(2);   // $ bn -> $ tn
const sbp = v => v == null ? 'n.a.' : (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v);
const at = (a, t) => t >= 0 ? a[t] : null;
const wlab = s => `${MON[+s.slice(5, 7) - 1]} ${+s.slice(8)}`;
const lastOn = (a, t) => { for (let j = t; j >= 0; j--) if (a[j] != null) return j; return -1; };

document.getElementById('dt').textContent = `Week ending ${fmtDate(WK[LW])} · Daily to ${fmtDate(DY[LD])}`;
document.getElementById('demo').textContent = `Demo：聯準會資產負債表（H.4.1，每週四公布週三數字）、準備金、財政部 TGA，以及貨幣市場利率與央行操作（每日）。週資料至 ${fmtDate(WK[LW])}，日資料至 ${fmtDate(DY[LD])}。`;
const tS = lastOn(SOFR, LD), sp = S_IORB[tS];
document.getElementById('hd').textContent = `聯準會總資產 ${tn(WALCL[LW])} 兆美元，準備金 ${tn(RES[LW])} 兆，SOFR ${sp > 0 ? '高於' : sp < 0 ? '低於' : '等於'} IORB ${Math.abs(sp)} bp`;

// narrative: balance sheet, liabilities, rates ($ bn shown as 億美元: 1 bn = 10 億)
(function lede() {
  const y = v => v == null ? 'n.a.' : `${fb(Math.abs(v) * 10)} 億美元`, ud = v => v < 0 ? '減少' : '增加';
  const q13 = chg(UST, 13)[LW] / 3, m13 = chg(MBS, 13)[LW] / 3, r4 = chg(RES, 4)[LW], g4 = chg(TGAW, 4)[LW], w1 = chg(WALCL, 1)[LW];
  const tE = lastOn(EFFR, LD), tR = lastOn(RRP, LD), tF = lastOn(SRF, LD), s20 = S_IORB.slice(tS - 19, tS + 1).filter(v => v != null), a20 = Math.round(s20.reduce((a, b) => a + b, 0) / s20.length);
  document.getElementById('lp1').innerHTML = `<p>截至 ${fmtDate(WK[LW])}，聯準會總資產 ${tn(WALCL[LW])} 兆美元，較前週${ud(w1)} ${y(w1)}；其中公債 ${tn(UST[LW])} 兆、MBS ${tn(MBS[LW])} 兆。過去 13 週平均每月公債${ud(q13)} ${y(q13)}、MBS ${ud(m13)} ${y(m13)}${q13 > 0 ? '：公債部位在增加，MBS 到期的資金轉買公債，縮表已停止' : ''}。</p>
<p>負債端：銀行準備金 ${tn(RES[LW])} 兆美元，4 週${ud(r4)} ${y(r4)}；財政部 TGA ${tn(TGAW[LW])} 兆，4 週${ud(g4)} ${y(g4)}。TGA 增加會把資金從銀行體系抽走，壓低準備金。ON RRP 只剩 ${y(RRP[tR])}（${fmtDate(DY[tR])}），先前緩衝縮表的閒置資金已幾乎用完，TGA 的波動現在直接反映在準備金上。</p>
<p>利率：${fmtDate(DY[tS])} SOFR ${f2(SOFR[tS])}%、EFFR ${f2(EFFR[tE])}%、IORB ${f2(IORB[tS])}%、ON RRP ${f2(RRPR[lastOn(RRPR, LD)])}%、常備附買回（SRF）最低利率 ${f2(SRFR[lastOn(SRFR, LD)])}%。SOFR 減 IORB 為 ${sbp(sp)} bp，近 20 個交易日平均 ${sbp(a20)} bp${a20 > 2 ? '，附買回市場資金偏緊' : a20 < -2 ? '，附買回市場資金寬鬆' : '，資金大致充足但已不寬鬆'}。SRF ${SRF[tF] >= 0.05 ? `${fmtDate(DY[tF])} 使用 ${y(SRF[tF])}` : `${fmtDate(DY[tF])} 未被使用`}。</p>` + ample();
})();

// reserve ampleness: the reserve ratio, and the New York Fed's elasticity with its 95% band
function ample() {
  const tA = lastI(RESR); if (tA < 0 && LR < 0) return '';
  const yA = lastOn(RESR, tA - 52), pct = v => v == null ? 'n.a.' : v.toFixed(1) + '%', b2 = v => v == null ? 'n.a.' : v.toFixed(2);
  let txt = tA < 0 ? '' : `準備金占商業銀行總資產 ${pct(RESR[tA])}（${fmtDate(WK[tA])}，H.8 比 H.4.1 晚一週），一年前 ${pct(at(RESR, yA))}。`;
  if (LR >= 0) {
    const m = RDE[LR], lo = RDE025[LR], hi = RDE975[LR];
    let since = -1; for (let j = LR - 1; j >= 0; j--) if (RDE[j] != null && RDE[j] <= m) { since = j; break; }
    const sig = hi < 0 ? '95% 區間全部低於 0，統計上顯著為負：EFFR 已開始對準備金減少有反應，準備金由「過剩」進入「充足」區間'
      : m < 0 ? '中位數為負，但 95% 區間仍包含 0，準備金介於「過剩」與「充足」之間，尚無「稀缺」的跡象' : '接近 0，準備金仍屬「過剩」';
    txt += `紐約聯準銀行準備金需求彈性（${fmtDate(RD[LR])}）為 ${b2(m)} bp（95% 區間 ${b2(lo)} 至 ${b2(hi)}）：準備金增加相當於銀行資產 1%，EFFR 減 IORB 約變動 ${b2(m)} bp。${sig}${since >= 0 && m < 0 && LR - since > 26 ? `；彈性為 ${fmtDate(RD[since])} 以來最負` : ''}。`;
  }
  return `<p>${txt}</p>`;
}

/* ---------- overview tables ---------- */
(function tables() {
  const wrows = [['Total assets', '總資產', WALCL], ['Treasury securities', '公債', UST], ['Mortgage-backed securities', 'MBS', MBS],
    ['Reserve balances', '銀行準備金', RES], ['Treasury General Account (TGA)', '財政部存款', TGAW], ['ON RRP (ex foreign official)', '隔夜逆回購', ONRRPW],
    ['Foreign official reverse repo', '外國官方逆回購', FRRP], ['Net liquidity (assets − TGA − ON RRP)', '淨流動性', NETL],
    ['Primary credit (discount window)', '貼現窗口', PCR], ['Repurchase agreements (SRF, FIMA)', '附買回', REPO]];
  let h = `<thead><tr class="grp"><th>Weekly, Wednesday level ($ bn)</th><th class="vl">Latest</th><th class="vl" colspan="4">Change over</th><th class="vl">52 wks</th></tr>
<tr><th></th><th class="vl">${wlab(WK[LW])}</th><th class="vl">1 wk</th><th>4 wks</th><th>13 wks</th><th>52 wks</th><th class="vl"></th></tr></thead><tbody>`;
  for (const [n, zh, a] of wrows) h += `<tr><td>${n} <span class="note">${zh}</span></td><td class="vl"><b>${fb1(a[LW])}</b></td>` +
    [1, 4, 13, 52].map((k, j) => `<td${j ? '' : ' class="vl"'}>${sgb(chg(a, k)[LW])}</td>`).join('') + `<td class="vl" style="padding:2px 9px">${sparkline(a.slice(0, LW + 1), 52)}</td></tr>`;
  document.getElementById('lw').innerHTML = h + '</tbody>';
  const drows = [['SOFR', '擔保隔夜融資利率', SOFR, '%'], ['Effective fed funds rate (EFFR)', '有效聯邦資金利率', EFFR, '%'], ['Interest on reserve balances (IORB)', '準備金利率', IORB, '%'],
    ['ON RRP offering rate', '隔夜逆回購利率（下限）', RRPR, '%'], ['Standing repo facility (ON RP) minimum bid', '常備附買回利率（上限）', SRFR, '%'],
    ['SOFR − IORB', 'bp', S_IORB, 'bp'], ['EFFR − IORB', 'bp', E_IORB, 'bp'], ['SOFR 99th percentile − IORB', 'bp', S99_IORB, 'bp'],
    ['SOFR volume', '$ bn', SOFRV, '$'], ['ON RRP take-up', '$ bn', RRP, '$'], ['Standing repo facility take-up', '$ bn', SRF, '$'], ['TGA closing balance', '$ bn, Daily Treasury Statement', TGA, '$']];
  const back = { '1 wk': 5, '1 mo': 21, '1 yr': 252 };
  h = `<thead><tr class="grp"><th>Daily</th><th class="vl" colspan="2">Latest</th><th class="vl" colspan="3">Earlier</th><th class="vl">3 mo.</th></tr>
<tr><th></th><th class="vl">Date</th><th>Value</th>${Object.keys(back).map((k, j) => `<th${j ? '' : ' class="vl"'}>${k} ago</th>`).join('')}<th class="vl"></th></tr></thead><tbody>`;
  for (const [n, zh, a, u] of drows) {
    const t = lastOn(a, LD); if (t < 0) continue;
    const fm = u === '%' ? f2 : u === 'bp' ? sbp : fb1;
    h += `<tr><td>${n} <span class="note">${zh}</span></td><td class="vl note">${wlab(DY[t])}</td><td><b>${fm(a[t])}</b></td>` +
      Object.values(back).map((k, j) => `<td${j ? '' : ' class="vl"'}>${fm(at(a, lastOn(a, t - k)))}</td>`).join('') + `<td class="vl" style="padding:2px 9px">${sparkline(a.slice(0, t + 1), 63, u === 'bp' ? 0 : null)}</td></tr>`;
  }
  document.getElementById('ld').innerHTML = h + '</tbody>';
})();

/* ---------- charts ---------- */
const WR = { '1Y': 52, '2Y': 104, '5Y': 260, Max: 0 }, DR = { '3M': 63, '6M': 126, '1Y': 252, '2Y': 504, '5Y': 1260, Max: 0 };
const cw = a => a.slice(0, LW + 1), cd = a => a.slice(0, LD + 1);
const WCAT = [
  { k: 'walcl', n: 'Fed Total Assets', v: cw(WALCL), grp: 'Assets, $ bn' }, { k: 'ust', n: 'Treasury Securities Held Outright', v: cw(UST), grp: 'Assets, $ bn' },
  { k: 'mbs', n: 'Mortgage-Backed Securities', v: cw(MBS), grp: 'Assets, $ bn' },
  { k: 'ust13', n: 'Treasuries: 13-Week Change ÷ 3 (Monthly Pace)', v: cw(chg(UST, 13).map(v => v == null ? null : v / 3)), grp: 'Runoff pace, $ bn per month' },
  { k: 'mbs13', n: 'MBS: 13-Week Change ÷ 3 (Monthly Pace)', v: cw(chg(MBS, 13).map(v => v == null ? null : v / 3)), grp: 'Runoff pace, $ bn per month' },
  { k: 'res', n: 'Reserve Balances', v: cw(RES), grp: 'Liabilities, $ bn' }, { k: 'tgaw', n: 'Treasury General Account', v: cw(TGAW), grp: 'Liabilities, $ bn' },
  { k: 'onrrpw', n: 'ON RRP (ex Foreign Official)', v: cw(ONRRPW), grp: 'Liabilities, $ bn' }, { k: 'frrp', n: 'Foreign Official Reverse Repo', v: cw(FRRP), grp: 'Liabilities, $ bn' },
  { k: 'netl', n: 'Net Liquidity (Assets − TGA − ON RRP)', v: cw(NETL), grp: 'Liabilities, $ bn' },
  { k: 'resr', n: 'Reserves as % of Bank Assets', v: cw(RESR), grp: 'Reserve ampleness' }, { k: 'eiorbw', n: 'EFFR − IORB, Weekly Average (bp)', v: cw(E_IORBW), grp: 'Reserve ampleness' },
  { k: 'bta', n: 'Commercial Bank Total Assets (H.8)', v: cw(BTA), grp: 'Reserve ampleness' },
  { k: 'pcr', n: 'Primary Credit (Discount Window)', v: cw(PCR), grp: 'Backstops, $ bn' }, { k: 'repo', n: 'Repurchase Agreements (SRF, FIMA)', v: cw(REPO), grp: 'Backstops, $ bn' }
];
const DCAT = [
  { k: 'sofr', n: 'SOFR', v: cd(SOFR), grp: 'Rates, %' }, { k: 'effr', n: 'Effective Fed Funds Rate', v: cd(EFFR), grp: 'Rates, %' },
  { k: 'iorb', n: 'Interest on Reserve Balances', v: cd(IORB), grp: 'Rates, %', dash: 1 }, { k: 'rrpr', n: 'ON RRP Offering Rate', v: cd(RRPR), grp: 'Rates, %', dash: 1 },
  { k: 'srfr', n: 'Standing Repo Facility Minimum Bid', v: cd(SRFR), grp: 'Rates, %', dash: 1 },
  { k: 's_iorb', n: 'SOFR − IORB', v: cd(S_IORB), grp: 'Spreads, bp' }, { k: 'e_iorb', n: 'EFFR − IORB', v: cd(E_IORB), grp: 'Spreads, bp' },
  { k: 's99', n: 'SOFR 99th Percentile − IORB', v: cd(S99_IORB), grp: 'Spreads, bp' },
  { k: 'rrp', n: 'ON RRP Take-Up', v: cd(RRP), grp: 'Operations, $ bn' }, { k: 'srf', n: 'Standing Repo Facility Take-Up', v: cd(SRF), grp: 'Operations, $ bn' },
  { k: 'tga', n: 'TGA Closing Balance (Daily)', v: cd(TGA), grp: 'Operations, $ bn' }, { k: 'sofrv', n: 'SOFR Volume', v: cd(SOFRV), grp: 'Operations, $ bn' }
];
const fmtv = v => Math.abs(v) >= 100 ? fb(v) : Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(2);
const wopt = def => ({ months: WK.slice(0, LW + 1), cat: WCAT, ranges: WR, fmt: fmtv, src: 'Federal Reserve Board H.4.1', W: 460, H: 330, def });
const dopt = (def, src) => ({ months: DY.slice(0, LD + 1), cat: DCAT, ranges: DR, fmt: fmtv, src: src || 'Federal Reserve Bank of New York', W: 460, H: 330, def });

// the policy corridor: five rates on one chart, so it keeps its own range buttons instead of the four-line picker
(function corridor() {
  const el = document.getElementById('lc1'); el.innerHTML = '<div class="plot"></div><div class="tb"></div>';
  const plot = el.querySelector('.plot'), tb = el.querySelector('.tb'), months = DY.slice(0, LD + 1);
  const series = [{ name: 'Standing Repo Facility Min. Bid (ON RP)', v: cd(SRFR), c: '--axis', dash: 1 }, { name: 'IORB', v: cd(IORB), c: '--c4', dash: 1 },
    { name: 'SOFR', v: cd(SOFR), c: '--c1' }, { name: 'EFFR', v: cd(EFFR), c: '--c2' }, { name: 'ON RRP Offering Rate', v: cd(RRPR), c: '--c3', dash: 1 }].map(s => ({ ...s, axis: 'L' }));
  let r = store.get('lc1') || '1Y'; if (!(r in DR)) r = '1Y';
  const draw = () => {
    const N = months.length, start = DR[r] ? Math.max(0, N - DR[r]) : 0, nw = el.clientWidth < 560;
    hv(plot, { W: nw ? 460 : 940, H: nw ? 360 : 360, months, start, title: nw ? 'Policy Rate Corridor' : 'Policy Rate Corridor and Overnight Money-Market Rates', sub: nw ? '%, Overnight Rates' : '%', src: 'Federal Reserve Board; Federal Reserve Bank of New York', series, fmt: v => v.toFixed(2) });
    tb.innerHTML = `<span class="seg" role="group" aria-label="Range">${Object.keys(DR).map(k => `<button type="button" data-r="${k}" aria-pressed="${k === r}">${k}</button>`).join('')}</span>`;
  };
  tb.addEventListener('click', ev => { const b = ev.target.closest('button[data-r]'); if (!b) return; r = b.dataset.r; store.set('lc1', r); draw(); });
  draw(); SC.lc1 = { draw };
})();
seriesChart('lc2', dopt({ title: 'Repo Pressure: Overnight Rates Less IORB', sub: 'Basis points', r: '1Y', ref: 0, ids: [{ k: 's_iorb' }, { k: 'e_iorb' }, { k: 's99' }] }));
seriesChart('lc3', dopt({ title: 'Fed Facilities: ON RRP and Standing Repo Take-Up', sub: '$ bn, Daily', r: '2Y', ids: [{ k: 'rrp' }, { k: 'srf', ax: 'R' }] }));
seriesChart('la1', { ...wopt({ title: 'Reserves as a Share of Bank Assets', sub: '%, Wednesday Level; EFFR − IORB, bp (R)', r: 'Max', ids: [{ k: 'resr' }, { k: 'eiorbw', ax: 'R' }] }),
  src: 'FRB H.4.1, H.8; FRBNY' });

// reserve demand curve: each week's reserve ratio against that week's average EFFR − IORB
(function demandCurve() {
  const el = document.getElementById('la2'), pts = [];
  for (let t = 0; t <= LW; t++) if (RESR[t] != null && E_IORBW[t] != null) pts.push({ t, x: RESR[t], y: E_IORBW[t] });
  if (!pts.length) return;
  const yrs = [...new Set(pts.map(p => WK[p.t].slice(0, 4)))], y0n = +yrs[0], y1n = +yrs[yrs.length - 1];
  const draw = () => {
    const W = fitW(el, 460), H = el.clientWidth < 560 ? 330 : 330, pl = 40, pr = 40, pt = 50, pb = 46, x0 = pl, x1 = W - pr, ya = pt, yb = H - pb;
    const gx = nice(Math.min(...pts.map(p => p.x)), Math.max(...pts.map(p => p.x)), 6), gy = nice(Math.min(...pts.map(p => p.y)), Math.max(...pts.map(p => p.y)), 5);
    const X = v => x0 + (v - gx.lo) / (gx.hi - gx.lo) * (x1 - x0), Y = v => yb - (v - gy.lo) / (gy.hi - gy.lo) * (yb - ya);
    let g = '';
    for (let v = gy.lo; v <= gy.hi + 1e-9; v += gy.step) g += `<line x1="${x0}" x2="${x1}" y1="${Y(v)}" y2="${Y(v)}" stroke="${css('--grid')}"/><text x="${x0 - 5}" y="${Y(v) + 3.5}" font-size="10" text-anchor="end">${fmtT(v, gy.step)}</text><text x="${x1 + 5}" y="${Y(v) + 3.5}" font-size="10">${fmtT(v, gy.step)}</text>`;
    for (let v = gx.lo; v <= gx.hi + 1e-9; v += gx.step) g += `<line x1="${X(v)}" x2="${X(v)}" y1="${yb}" y2="${yb + 4}" stroke="${css('--axis')}"/><text x="${X(v)}" y="${yb + 15}" font-size="10" text-anchor="middle">${fmtT(v, gx.step)}</text>`;
    if (gy.lo < 0 && gy.hi > 0) g += `<line x1="${x0}" x2="${x1}" y1="${Y(0)}" y2="${Y(0)}" stroke="${css('--axis')}" stroke-width=".8"/>`;
    g += `<text x="${(x0 + x1) / 2}" y="${yb + 29}" font-size="10" text-anchor="middle">Reserves, % of commercial bank total assets</text>`;
    // older weeks fade; the latest 13 weeks are drawn in the second colour, the latest week ringed
    const c1 = css('--c1'), c2 = css('--c2'), recent = pts.length - 13;
    pts.forEach((p, k) => { const op = k >= recent ? .95 : .18 + .6 * ((+WK[p.t].slice(0, 4) - y0n) / Math.max(1, y1n - y0n));
      g += `<circle cx="${X(p.x).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="${k === pts.length - 1 ? 4 : 2.4}" fill="${k >= recent ? c2 : c1}" fill-opacity="${op.toFixed(2)}"${k === pts.length - 1 ? ` stroke="${css('--ink')}" stroke-width="1"` : ''}/>`; });
    g += `<rect x="${x0}" y="${ya}" width="${x1 - x0}" height="${yb - ya}" fill="none" stroke="${css('--frame')}" stroke-width=".8"/>`;
    g += `<text x="${W / 2}" y="16" font-size="12.5" text-anchor="middle" style="fill:${css('--ink')}">Reserve Demand Curve</text><text x="${W / 2}" y="31" font-size="11" text-anchor="middle" style="fill:${css('--ink')}">${W < 420 ? 'EFFR − IORB (bp) vs. Reserve Ratio (%)' : 'EFFR − IORB (bp, Weekly Average) vs. Reserve Ratio'}</text>`;
    g += `<circle cx="${x1 - 150}" cy="${ya + 10}" r="3" fill="${c1}" fill-opacity=".6"/><text x="${x1 - 143}" y="${ya + 13.5}" font-size="10" style="fill:${c1}">${yrs[0]}–${y1n} (lighter = earlier)</text>`;
    g += `<circle cx="${x1 - 150}" cy="${ya + 23}" r="3" fill="${c2}"/><text x="${x1 - 143}" y="${ya + 26.5}" font-size="10" style="fill:${c2}">Latest 13 weeks</text>`;
    g += `<text x="${x0 - 30}" y="${H - 4}" font-size="10">Source:  FRB H.4.1, H.8; FRBNY</text>`;
    g += `<rect class="hit" x="${x0}" y="${ya}" width="${x1 - x0}" height="${yb - ya}" fill="transparent"/>`;
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Reserve demand curve: EFFR minus IORB against reserves as a share of bank assets">${g}</svg><div class="tip"></div>`;
    const svg = el.querySelector('svg'), tip = el.querySelector('.tip'), hit = el.querySelector('.hit');
    const move = ev => {
      const r = svg.getBoundingClientRect(), p = ev.touches ? ev.touches[0] : ev, sx = (p.clientX - r.left) / r.width * W, sy = (p.clientY - r.top) / r.height * H;
      let best = null, bd = Infinity; for (const q of pts) { const dd = (X(q.x) - sx) ** 2 + (Y(q.y) - sy) ** 2; if (dd < bd) { bd = dd; best = q; } }
      if (!best || bd > 400) { tip.style.display = 'none'; return; }
      tip.innerHTML = `<b>Week ending ${fmtDate(WK[best.t])}</b><br>Reserves: ${best.x.toFixed(2)}% of bank assets<br>EFFR − IORB: ${best.y.toFixed(1)} bp`;
      tip.style.display = 'block'; const px = X(best.x) / W * r.width, tw = tip.offsetWidth;
      tip.style.left = (px + 14 + tw > r.width ? px - tw - 8 : px + 14) + 'px'; tip.style.top = (Y(best.y) / H * r.height - 10) + 'px';
    };
    hit.addEventListener('mousemove', move); hit.addEventListener('mouseleave', () => tip.style.display = 'none');
    hit.addEventListener('touchstart', move, { passive: true }); hit.addEventListener('touchmove', move, { passive: true });
  };
  refit(el, draw); draw(); SC.la2 = { draw };
})();

// New York Fed reserve demand elasticity with its 68% and 95% bands; keeps its own range buttons
(function elasticity() {
  const el = document.getElementById('la3'); if (LR < 0) return;
  el.innerHTML = '<div class="plot"></div><div class="tb"></div>';
  const plot = el.querySelector('.plot'), tb = el.querySelector('.tb'), months = RD.slice(0, LR + 1), RR = { '2Y': 2, '5Y': 5, '10Y': 10, Max: 0 };
  let r = store.get('la3') || '5Y'; if (!(r in RR)) r = '5Y';
  const draw = () => {
    const cut = RR[r] ? `${+RD[LR].slice(0, 4) - RR[r]}${RD[LR].slice(4)}` : '', start = Math.max(0, months.findIndex(m => m > cut)), nw = el.clientWidth < 560;
    hv(plot, { W: nw ? 460 : 940, H: 360, months, start, title: nw ? 'Reserve Demand Elasticity' : 'Reserve Demand Elasticity (New York Fed)',
      sub: nw ? 'bp per 1% of Bank Assets' : 'bp Change in EFFR − IORB per Rise in Reserves Equal to 1% of Bank Assets', src: 'Federal Reserve Bank of New York',
      series: [{ name: 'Elasticity (median)', v: RDE.slice(0, LR + 1), c: '--c1', axis: 'L' }],
      bands: [{ name: '95% band', lo: RDE025, hi: RDE975, c: '--c1', op: .12 }, { name: '68% band', lo: RDE16, hi: RDE84, c: '--c1', op: .22 }], fmt: v => v.toFixed(2) });
    tb.innerHTML = `<span class="seg" role="group" aria-label="Range">${Object.keys(RR).map(k => `<button type="button" data-r="${k}" aria-pressed="${k === r}">${k}</button>`).join('')}</span>`;
  };
  tb.addEventListener('click', ev => { const b = ev.target.closest('button[data-r]'); if (!b) return; r = b.dataset.r; store.set('la3', r); draw(); });
  draw(); SC.la3 = { draw };
})();
seriesChart('lb1', wopt({ title: 'Federal Reserve Total Assets', sub: '$ bn, Wednesday Level', r: 'Max', ids: [{ k: 'walcl' }, { k: 'ust' }, { k: 'mbs' }] }));
seriesChart('lb2', wopt({ title: 'Balance Sheet Runoff Pace', sub: '13-Week Change ÷ 3, $ bn per Month', r: '5Y', ref: 0, ids: [{ k: 'ust13' }, { k: 'mbs13' }] }));
seriesChart('lb3', wopt({ title: 'Reserves, TGA and ON RRP', sub: '$ bn, Wednesday Level', r: '5Y', ids: [{ k: 'res' }, { k: 'tgaw' }, { k: 'onrrpw' }] }));
seriesChart('lb4', wopt({ title: 'Net Liquidity vs. Reserve Balances', sub: '$ bn, Wednesday Level', r: '5Y', ids: [{ k: 'netl' }, { k: 'res' }] }));
seriesChart('lt1', dopt({ title: 'Treasury General Account', sub: '$ bn, Daily Closing Balance', r: '2Y', ids: [{ k: 'tga' }] }, 'U.S. Treasury, Daily Treasury Statement'));
seriesChart('lt2', wopt({ title: 'Backstop Borrowing: Discount Window and Repo', sub: '$ bn, Wednesday Level', r: '5Y', ids: [{ k: 'pcr' }, { k: 'repo' }] }));
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { for (const k in SC) SC[k].draw(); });
