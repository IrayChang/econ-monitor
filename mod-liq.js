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
// daily: rates in %, operations and TGA in $ billions
const SOFR = d('SOFR'), EFFR = d('EFFR'), IORB = d('IORB'), RRPR = d('RRPR'), SRFR = d('SRFR'), SOFR99 = d('SOFR99'), SOFRV = d('SOFRV');
const RRP = d('RRP'), SRF = d('SRF'), TGA = d('TGA'), FFTL = d('FFTL'), FFTU = d('FFTU');
const S_IORB = bp(SOFR, IORB), E_IORB = bp(EFFR, IORB), S99_IORB = bp(SOFR99, IORB);
const LW = lastI(WALCL), LD = Math.max(lastI(SOFR), lastI(TGA), lastI(RRP));
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
<p>利率：${fmtDate(DY[tS])} SOFR ${f2(SOFR[tS])}%、EFFR ${f2(EFFR[tE])}%、IORB ${f2(IORB[tS])}%、ON RRP ${f2(RRPR[lastOn(RRPR, LD)])}%、常備附買回（SRF）最低利率 ${f2(SRFR[lastOn(SRFR, LD)])}%。SOFR 減 IORB 為 ${sbp(sp)} bp，近 20 個交易日平均 ${sbp(a20)} bp${a20 > 2 ? '，附買回市場資金偏緊' : a20 < -2 ? '，附買回市場資金寬鬆' : '，資金大致充足但已不寬鬆'}。SRF ${SRF[tF] >= 0.05 ? `${fmtDate(DY[tF])} 使用 ${y(SRF[tF])}` : `${fmtDate(DY[tF])} 未被使用`}。</p>`;
})();

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
seriesChart('lb1', wopt({ title: 'Federal Reserve Total Assets', sub: '$ bn, Wednesday Level', r: 'Max', ids: [{ k: 'walcl' }, { k: 'ust' }, { k: 'mbs' }] }));
seriesChart('lb2', wopt({ title: 'Balance Sheet Runoff Pace', sub: '13-Week Change ÷ 3, $ bn per Month', r: '5Y', ref: 0, ids: [{ k: 'ust13' }, { k: 'mbs13' }] }));
seriesChart('lb3', wopt({ title: 'Reserves, TGA and ON RRP', sub: '$ bn, Wednesday Level', r: '5Y', ids: [{ k: 'res' }, { k: 'tgaw' }, { k: 'onrrpw' }] }));
seriesChart('lb4', wopt({ title: 'Net Liquidity vs. Reserve Balances', sub: '$ bn, Wednesday Level', r: '5Y', ids: [{ k: 'netl' }, { k: 'res' }] }));
seriesChart('lt1', dopt({ title: 'Treasury General Account', sub: '$ bn, Daily Closing Balance', r: '2Y', ids: [{ k: 'tga' }] }, 'U.S. Treasury, Daily Treasury Statement'));
seriesChart('lt2', wopt({ title: 'Backstop Borrowing: Discount Window and Repo', sub: '$ bn, Wednesday Level', r: '5Y', ids: [{ k: 'pcr' }, { k: 'repo' }] }));
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { for (const k in SC) SC[k].draw(); });
