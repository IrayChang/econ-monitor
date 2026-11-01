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
const CURR = w('CURR'), BILLS = w('BILLS'), BTA = w('BTA'), RESR = RES.map((v, t) => v == null || BTA[t] == null ? null : v / BTA[t] * 100);
// daily: rates in %, operations and TGA in $ billions
const SOFR = d('SOFR'), EFFR = d('EFFR'), IORB = d('IORB'), RRPR = d('RRPR'), SRFR = d('SRFR'), SOFR99 = d('SOFR99'), SOFRV = d('SOFRV');
const SOFR25 = d('SOFR25'), SOFR75 = d('SOFR75'), SOFR1 = d('SOFR1'), TGCR = d('TGCR');
const RRP = d('RRP'), SRF = d('SRF'), TGA = d('TGA'), FFTL = d('FFTL'), FFTU = d('FFTU');
const S_IORB = bp(SOFR, IORB), E_IORB = bp(EFFR, IORB), S99_IORB = bp(SOFR99, IORB), T_IORB = bp(TGCR, IORB);
// repo against the ceiling: SOFR percentiles less the SRP rate (Anderson et al. 2026, Figure 5c)
const S25_SRP = bp(SOFR25, SRFR), S75_SRP = bp(SOFR75, SRFR), S99_SRP = bp(SOFR99, SRFR);
// 15-business-day rolling standard deviation of a bp spread (Figure 5b)
const rsd = (a, n = 15) => a.map((v, t) => { if (v == null || t < n - 1) return null; const x = a.slice(t - n + 1, t + 1).filter(q => q != null); if (x.length < n - 2) return null;
  const m = x.reduce((p, q) => p + q, 0) / x.length; return Math.sqrt(x.reduce((p, q) => p + (q - m) ** 2, 0) / (x.length - 1)); });
const E_SD = rsd(E_IORB), T_SD = rsd(T_IORB);
// bounds on the share of SOFR volume at or above IORB, read off the published percentiles (1st, 25th, median, 75th, 99th):
// a percentile at or above IORB puts at least the volume above it there; one below puts at least the volume under it below
const PCT = [[SOFR1, 99], [SOFR25, 75], [SOFR, 50], [SOFR75, 25], [SOFR99, 1]];
const SHL = DY.map((_, t) => { if (IORB[t] == null || SOFR[t] == null) return null; for (const [a, s] of PCT) if (a[t] != null && a[t] >= IORB[t] - 1e-9) return s; return 0; });
const SHH = DY.map((_, t) => { if (IORB[t] == null || SOFR[t] == null) return null; for (const [a, s] of [...PCT].reverse()) if (a[t] != null && a[t] < IORB[t] - 1e-9) return s; return 100; });
const avg = (a, n = 20) => a.map((v, t) => { if (t < n - 1) return null; const x = a.slice(t - n + 1, t + 1).filter(q => q != null); return x.length >= n - 3 ? x.reduce((p, q) => p + q, 0) / x.length : null; });
const SHL20 = avg(SHL), SHH20 = avg(SHH);
// nominal GDP (BEA, $ bn SAAR) for each week's quarter; weeks past the latest published quarter carry that quarter forward
const GQ = (Q.gdp || { q: [], v: [] }), gq = {}; GQ.q.forEach((q, k) => { if (GQ.v[k] != null) gq[q] = GQ.v[k]; });
const GLAST = GQ.q.filter(q => gq[q] != null).pop();
const GDPW = WK.map(d => { const q = `${d.slice(0, 4)}-Q${Math.ceil(+d.slice(5, 7) / 3)}`; return gq[q] != null ? gq[q] : q > GLAST ? gq[GLAST] : null; });
const pctG = a => a.map((v, t) => v == null || GDPW[t] == null ? null : v / GDPW[t] * 100), RESG = pctG(RES);
// Fed liabilities and capital: the named items, with the remainder (other liabilities and capital) making up total assets
const OTHL = WALCL.map((v, t) => [RES, CURR, TGAW, FRRP, ONRRPW].some(a => a[t] == null) || v == null ? null : v - RES[t] - CURR[t] - TGAW[t] - FRRP[t] - ONRRPW[t]);
const LW = lastI(WALCL), LD = Math.max(lastI(SOFR), lastI(TGA), lastI(RRP));
// EFFR − IORB averaged over each H.4.1 week (Thursday to Wednesday), to set against the weekly reserve ratio
const E_IORBW = WK.map((wd, t) => { const a = []; for (let j = 0; j < DY.length; j++) if (DY[j] <= wd && (t === 0 || DY[j] > WK[t - 1]) && E_IORB[j] != null) a.push(E_IORB[j]); return a.length ? a.reduce((p, q) => p + q, 0) / a.length : null; });
// New York Fed Reserve Demand Elasticity: bp change in EFFR − IORB for a rise in reserves equal to 1% of bank assets
const RD = Q.rdates || [], r_ = k => (Q.r || {})[k] || RD.map(() => null);
const RDE = r_('RDE'), RDE025 = r_('RDE025'), RDE975 = r_('RDE975'), RDE16 = r_('RDE16'), RDE84 = r_('RDE84'), LR = lastI(RDE);
// high-pressure days: Treasury coupon settlements, month-ends and quarterly corporate tax dates (Apr, Jun, Sep, Dec 15)
const HL = {};
(function () {
  const add = (d, why) => { let t = DY.findIndex(x => x >= d); if (t < 0 || t > LD) return; HL[t] = HL[t] ? HL[t] + '; ' + why : why; };
  for (const [d, v] of Object.entries(Q.cpn || {})) add(d, `Coupon settlement $${Math.round(v)} bn`);
  for (let t = 0; t < LD; t++) if (DY[t].slice(5, 7) !== DY[t + 1].slice(5, 7)) HL[t] = HL[t] ? HL[t] + '; month-end' : 'Month-end';
  for (const y of new Set(DY.map(d => d.slice(0, 4)))) for (const m of ['04', '06', '09', '12']) add(`${y}-${m}-15`, 'Tax date');
})();
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
  const q13 = chg(UST, 13)[LW] / 3, b13 = chg(BILLS, 13)[LW] / 3, m13 = chg(MBS, 13)[LW] / 3, r4 = chg(RES, 4)[LW], g4 = chg(TGAW, 4)[LW], w1 = chg(WALCL, 1)[LW];
  const tE = lastOn(EFFR, LD), tR = lastOn(RRP, LD), tF = lastOn(SRF, LD), s20 = S_IORB.slice(tS - 19, tS + 1).filter(v => v != null), a20 = Math.round(s20.reduce((a, b) => a + b, 0) / s20.length);
  document.getElementById('lp1').innerHTML = `<p>截至 ${fmtDate(WK[LW])}，聯準會總資產 ${tn(WALCL[LW])} 兆美元，較前週${ud(w1)} ${y(w1)}；其中公債 ${tn(UST[LW])} 兆、MBS ${tn(MBS[LW])} 兆。過去 13 週平均每月公債${ud(q13)} ${y(q13)}、MBS ${ud(m13)} ${y(m13)}；其中國庫券（T-bill）持有 ${fb(BILLS[LW] * 10)} 億美元，每月${ud(b13)} ${y(b13)}${b13 > 0 && q13 > 0 ? '。公債增加以國庫券為主，來自 MBS 到期資金轉投資國庫券，以及聯準會為維持準備金充足而進行的準備金管理購買（RMP）；縮表已停止，資產負債表轉為隨準備金需求擴張' : ''}。</p>
<p>負債端：銀行準備金 ${tn(RES[LW])} 兆美元，4 週${ud(r4)} ${y(r4)}；財政部 TGA ${tn(TGAW[LW])} 兆，4 週${ud(g4)} ${y(g4)}。TGA 增加會把資金從銀行體系抽走，壓低準備金。ON RRP 只剩 ${y(RRP[tR])}（${fmtDate(DY[tR])}），先前緩衝縮表的閒置資金已幾乎用完，TGA 的波動現在直接反映在準備金上。</p>
<p>利率：${fmtDate(DY[tS])} SOFR ${f2(SOFR[tS])}%、EFFR ${f2(EFFR[tE])}%、IORB ${f2(IORB[tS])}%、ON RRP ${f2(RRPR[lastOn(RRPR, LD)])}%、常備附買回操作（SRP）利率 ${f2(SRFR[lastOn(SRFR, LD)])}%。SOFR 減 IORB 為 ${sbp(sp)} bp，近 20 個交易日平均 ${sbp(a20)} bp${a20 > 2 ? '，附買回市場資金偏緊' : a20 < -2 ? '，附買回市場資金寬鬆' : '，資金大致充足但已不寬鬆'}。SRP ${SRF[tF] >= 0.05 ? `${fmtDate(DY[tF])} 使用 ${y(SRF[tF])}` : `${fmtDate(DY[tF])} 未被使用`}。</p>` + ample();
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
  // repo side: the indicator the Fed staff paper and New York Fed speeches single out in the late-2025 episode
  const tq = lastOn(SHL20, LD), q1 = [], q1h = [];
  DY.forEach((dd, t) => { if (dd >= '2019-01-01' && dd < '2019-04-01') { if (SHL[t] != null) q1.push(SHL[t]); if (SHH[t] != null) q1h.push(SHH[t]); } });
  const mn = a => a.length ? a.reduce((p, q) => p + q, 0) / a.length : null, pc0 = v => v == null ? 'n.a.' : Math.round(v) + '%';
  const tp = lastOn(S75_SRP, LD), above = S99_SRP.slice(Math.max(0, tp - 19), tp + 1).filter(v => v != null && v > 0).length;
  if (tq >= 0) txt += `附買回市場：近 20 個交易日，SOFR 交易量中利率在 IORB 以上（含）的比例至少 ${pc0(SHL20[tq])}、至多 ${pc0(SHH20[tq])}（由公布的百分位推得的區間；2019 年第一季平均為至少 ${pc0(mn(q1))}、至多 ${pc0(mn(q1h))}）。`;
  if (tp >= 0) txt += `${fmtDate(DY[tp])} SOFR 第 75 百分位減 SRP 利率 ${sbp(S75_SRP[tp])} bp；近 20 個交易日有 ${above} 天第 99 百分位高於 SRP 利率。`;
  return `<p>${txt}</p>`;
}

/* ---------- overview tables ---------- */
(function tables() {
  const wrows = [['Total assets', '總資產', WALCL], ['Treasury securities', '公債', UST], ['of which Treasury bills', '國庫券（RMP）', BILLS], ['Mortgage-backed securities', 'MBS', MBS],
    ['Reserve balances', '銀行準備金', RES], ['Treasury General Account (TGA)', '財政部存款', TGAW], ['ON RRP (ex foreign official)', '隔夜逆回購', ONRRPW],
    ['Foreign official reverse repo', '外國官方逆回購', FRRP], ['Net liquidity (assets − TGA − ON RRP)', '淨流動性', NETL],
    ['Primary credit (discount window)', '貼現窗口', PCR], ['Repurchase agreements (SRP, FIMA)', '附買回', REPO]];
  let h = `<thead><tr class="grp"><th>Weekly, Wednesday level ($ bn)</th><th class="vl">Latest</th><th class="vl" colspan="4">Change over</th><th class="vl">52 wks</th></tr>
<tr><th></th><th class="vl">${wlab(WK[LW])}</th><th class="vl">1 wk</th><th>4 wks</th><th>13 wks</th><th>52 wks</th><th class="vl"></th></tr></thead><tbody>`;
  for (const [n, zh, a] of wrows) h += `<tr><td>${n} <span class="note">${zh}</span></td><td class="vl"><b>${fb1(a[LW])}</b></td>` +
    [1, 4, 13, 52].map((k, j) => `<td${j ? '' : ' class="vl"'}>${sgb(chg(a, k)[LW])}</td>`).join('') + `<td class="vl" style="padding:2px 9px">${sparkline(a.slice(0, LW + 1), 52)}</td></tr>`;
  document.getElementById('lw').innerHTML = h + '</tbody>';
  const drows = [['SOFR', '擔保隔夜融資利率', SOFR, '%'], ['Effective fed funds rate (EFFR)', '有效聯邦資金利率', EFFR, '%'], ['Interest on reserve balances (IORB)', '準備金利率', IORB, '%'],
    ['ON RRP offering rate', '隔夜逆回購利率（下限）', RRPR, '%'], ['Standing repo operations (SRP) rate', '常備附買回操作利率（上限）', SRFR, '%'],
    ['SOFR − IORB', 'bp', S_IORB, 'bp'], ['EFFR − IORB', 'bp', E_IORB, 'bp'], ['SOFR 99th percentile − IORB', 'bp', S99_IORB, 'bp'], ['TGCR − IORB', 'bp', T_IORB, 'bp'],
    ['SOFR 75th percentile − SRP rate', 'bp, 上限壓力', S75_SRP, 'bp'], ['EFFR − IORB, 15-day volatility', 'bp, 標準差', E_SD, 'bpf'],
    ['SOFR volume', '$ bn', SOFRV, '$'], ['ON RRP take-up', '$ bn', RRP, '$'], ['Standing repo operations (SRP) take-up', '$ bn', SRF, '$'], ['TGA closing balance', '$ bn, Daily Treasury Statement', TGA, '$']];
  const back = { '1 wk': 5, '1 mo': 21, '1 yr': 252 };
  h = `<thead><tr class="grp"><th>Daily</th><th class="vl" colspan="2">Latest</th><th class="vl" colspan="3">Earlier</th><th class="vl">3 mo.</th></tr>
<tr><th></th><th class="vl">Date</th><th>Value</th>${Object.keys(back).map((k, j) => `<th${j ? '' : ' class="vl"'}>${k} ago</th>`).join('')}<th class="vl"></th></tr></thead><tbody>`;
  for (const [n, zh, a, u] of drows) {
    const t = lastOn(a, LD); if (t < 0) continue;
    const fm = u === '%' ? f2 : u === 'bp' ? sbp : u === 'bpf' ? (v => v == null ? 'n.a.' : v.toFixed(1)) : fb1;
    h += `<tr><td>${n} <span class="note">${zh}</span></td><td class="vl note">${wlab(DY[t])}</td><td><b>${fm(a[t])}</b></td>` +
      Object.values(back).map((k, j) => `<td${j ? '' : ' class="vl"'}>${fm(at(a, lastOn(a, t - k)))}</td>`).join('') + `<td class="vl" style="padding:2px 9px">${sparkline(a.slice(0, t + 1), 63, u === 'bp' ? 0 : null)}</td></tr>`;
  }
  document.getElementById('ld').innerHTML = h + '</tbody>';
})();

/* ---------- reserve ampleness checklist: each indicator now, a year ago, and in Q1 2019 (the last time reserves were tight) ---------- */
(function checklist() {
  const win = (a, t, n = 20) => { if (t < 0) return null; const x = a.slice(Math.max(0, t - n + 1), t + 1).filter(v => v != null); return x.length ? x.reduce((p, q) => p + q, 0) / x.length : null; };
  const cnt = (a, t, n = 20) => t < n - 1 ? null : a.slice(t - n + 1, t + 1).filter(v => v != null && v > 0).length;
  const tot = (a, t, n = 20) => t < n - 1 ? null : a.slice(t - n + 1, t + 1).reduce((p, q) => p + (q || 0), 0);
  const q19 = (D, a) => { const x = []; D.forEach((d, t) => { if (d >= '2019-01-01' && d < '2019-04-01' && a[t] != null) x.push(a[t]); }); return x.length ? x.reduce((p, q) => p + q, 0) / x.length : null; };
  const dayAgo = t => lastOn(SOFR, t - 252), tD = LD, tY = dayAgo(LD), wR = lastI(RESR), wG = lastI(RESG);
  const srpOn = DY.findIndex(d => d >= '2021-07-28');
  // [indicator, note, latest, 1 yr ago, Q1 2019, format, +1 if a higher value means scarcer reserves, change treated as no change]
  const rows = [
    ['Reserve demand elasticity', 'NY Fed, bp per 1% of bank assets', RDE[LR], at(RDE, lastOn(RDE, RD.findIndex(d => d > `${+RD[LR].slice(0, 4) - 1}${RD[LR].slice(4)}`) - 1)), q19(RD, RDE), v => v.toFixed(2), -1, .05],
    ['Reserves, % of bank assets', 'H.4.1 ÷ H.8', RESR[wR], at(RESR, wR - 52), q19(WK, RESR), v => v.toFixed(1) + '%', -1, .2],
    ['Reserves, % of GDP', 'H.4.1 ÷ BEA', RESG[wG], at(RESG, wG - 52), q19(WK, RESG), v => v.toFixed(1) + '%', -1, .2],
    ['EFFR − IORB', '20-day avg., bp', win(E_IORB, tD), win(E_IORB, tY), q19(DY, E_IORB), v => sbp(Math.round(v * 10) / 10), 1, .5],
    ['TGCR − IORB', '20-day avg., bp', win(T_IORB, tD), win(T_IORB, tY), q19(DY, T_IORB), v => sbp(Math.round(v * 10) / 10), 1, .5],
    ['SOFR volume at or above IORB', 'lower bound, 20-day avg.', SHL20[lastOn(SHL20, tD)], at(SHL20, lastOn(SHL20, tY)), q19(DY, SHL), v => Math.round(v) + '%', 1, 3],
    ['TGCR − IORB volatility', '15-day std. dev., bp', T_SD[lastOn(T_SD, tD)], at(T_SD, lastOn(T_SD, tY)), q19(DY, T_SD), v => v.toFixed(1), 1, .3],
    ['Days SOFR 99th pct. > SRP rate', 'of last 20', cnt(S99_SRP, tD), tY > srpOn + 20 ? cnt(S99_SRP, tY) : null, null, v => String(v), 1, .5],
    ['SRP take-up', '20-day total, $ bn', tot(SRF, tD), tY > srpOn + 20 ? tot(SRF, tY) : null, null, v => fb1(v), 1, 1],
    ['ON RRP (ex foreign official)', 'buffer left, $ bn', ONRRPW[LW], at(ONRRPW, LW - 52), q19(WK, ONRRPW), v => fb1(v), -1, 5]];
  let h = `<thead><tr class="grp"><th>Reserve ampleness checklist</th><th class="vl">Latest</th><th class="vl">1 yr ago</th><th>Q1 2019</th><th class="vl">vs. 1 yr ago</th></tr></thead><tbody>`;
  for (const [n, zh, v, y, q, fm, dir, eps] of rows) {
    const f = x => x == null || !isFinite(x) ? 'n.a.' : fm(x), d = v == null || y == null ? 0 : (v - y) * dir;
    const tag = v == null || y == null ? '' : Math.abs(v - y) <= eps ? '<span class="note">≈ unchanged</span>' : d > 0 ? '<b style="color:var(--rd)">tighter</b>' : '<b style="color:var(--bl)">looser</b>';
    h += `<tr><td>${n} <span class="note">${zh}</span></td><td class="vl"><b>${f(v)}</b></td><td class="vl">${f(y)}</td><td>${f(q)}</td><td class="vl">${tag}</td></tr>`;
  }
  document.getElementById('lk').innerHTML = h + '</tbody>';
})();

/* ---------- charts ---------- */
const WR = { '1Y': 52, '2Y': 104, '5Y': 260, Max: 0 }, DR = { '3M': 63, '6M': 126, '1Y': 252, '2Y': 504, '5Y': 1260, Max: 0 };
const cw = a => a.slice(0, LW + 1), cd = a => a.slice(0, LD + 1);
const WCAT = [
  { k: 'walcl', n: 'Fed Total Assets', v: cw(WALCL), grp: 'Assets, $ bn' }, { k: 'ust', n: 'Treasury Securities Held Outright', v: cw(UST), grp: 'Assets, $ bn' },
  { k: 'mbs', n: 'Mortgage-Backed Securities', v: cw(MBS), grp: 'Assets, $ bn' }, { k: 'bills', n: 'Treasury Bills Held Outright', v: cw(BILLS), grp: 'Assets, $ bn' },
  { k: 'bills13', n: 'Treasury Bills: 13-Week Change ÷ 3 (Monthly Pace)', v: cw(chg(BILLS, 13).map(v => v == null ? null : v / 3)), grp: 'Runoff pace, $ bn per month' },
  { k: 'ust13', n: 'Treasuries: 13-Week Change ÷ 3 (Monthly Pace)', v: cw(chg(UST, 13).map(v => v == null ? null : v / 3)), grp: 'Runoff pace, $ bn per month' },
  { k: 'mbs13', n: 'MBS: 13-Week Change ÷ 3 (Monthly Pace)', v: cw(chg(MBS, 13).map(v => v == null ? null : v / 3)), grp: 'Runoff pace, $ bn per month' },
  { k: 'res', n: 'Reserve Balances', v: cw(RES), grp: 'Liabilities, $ bn' }, { k: 'tgaw', n: 'Treasury General Account', v: cw(TGAW), grp: 'Liabilities, $ bn' },
  { k: 'onrrpw', n: 'ON RRP (ex Foreign Official)', v: cw(ONRRPW), grp: 'Liabilities, $ bn' }, { k: 'frrp', n: 'Foreign Official Reverse Repo', v: cw(FRRP), grp: 'Liabilities, $ bn' },
  { k: 'netl', n: 'Net Liquidity (Assets − TGA − ON RRP)', v: cw(NETL), grp: 'Liabilities, $ bn' },
  { k: 'resr', n: 'Reserves as % of Bank Assets', v: cw(RESR), grp: 'Reserve ampleness' }, { k: 'eiorbw', n: 'EFFR − IORB, Weekly Average (bp)', v: cw(E_IORBW), grp: 'Reserve ampleness' },
  { k: 'bta', n: 'Commercial Bank Total Assets (H.8)', v: cw(BTA), grp: 'Reserve ampleness' }, { k: 'resg', n: 'Reserves as % of GDP', v: cw(RESG), grp: 'Reserve ampleness' },
  { k: 'curr', n: 'Currency in Circulation', v: cw(CURR), grp: 'Liabilities, $ bn' },
  { k: 'pcr', n: 'Primary Credit (Discount Window)', v: cw(PCR), grp: 'Backstops, $ bn' }, { k: 'repo', n: 'Repurchase Agreements (SRP, FIMA)', v: cw(REPO), grp: 'Backstops, $ bn' }
];
const DCAT = [
  { k: 'sofr', n: 'SOFR', v: cd(SOFR), grp: 'Rates, %' }, { k: 'effr', n: 'Effective Fed Funds Rate', v: cd(EFFR), grp: 'Rates, %' },
  { k: 'iorb', n: 'Interest on Reserve Balances', v: cd(IORB), grp: 'Rates, %', dash: 1 }, { k: 'rrpr', n: 'ON RRP Offering Rate', v: cd(RRPR), grp: 'Rates, %', dash: 1 },
  { k: 'srfr', n: 'Standing Repo Operations (SRP) Rate', v: cd(SRFR), grp: 'Rates, %', dash: 1 },
  { k: 's_iorb', n: 'SOFR − IORB', v: cd(S_IORB), grp: 'Spreads, bp' }, { k: 'e_iorb', n: 'EFFR − IORB', v: cd(E_IORB), grp: 'Spreads, bp' },
  { k: 's99', n: 'SOFR 99th Percentile − IORB', v: cd(S99_IORB), grp: 'Spreads, bp' }, { k: 't_iorb', n: 'TGCR − IORB', v: cd(T_IORB), grp: 'Spreads, bp' },
  { k: 's25srp', n: 'SOFR 25th Percentile − SRP Rate', v: cd(S25_SRP), grp: 'Repo vs. SRP ceiling, bp' }, { k: 's75srp', n: 'SOFR 75th Percentile − SRP Rate', v: cd(S75_SRP), grp: 'Repo vs. SRP ceiling, bp' },
  { k: 's99srp', n: 'SOFR 99th Percentile − SRP Rate', v: cd(S99_SRP), grp: 'Repo vs. SRP ceiling, bp' },
  { k: 'esd', n: 'EFFR − IORB, 15-Day Std. Dev.', v: cd(E_SD), grp: 'Volatility, bp' }, { k: 'tsd', n: 'TGCR − IORB, 15-Day Std. Dev.', v: cd(T_SD), grp: 'Volatility, bp' },
  { k: 'shl', n: 'At Least (Lower Bound)', v: cd(SHL20), grp: 'SOFR volume at or above IORB, %' }, { k: 'shh', n: 'At Most (Upper Bound)', v: cd(SHH20), grp: 'SOFR volume at or above IORB, %', dash: 1 },
  { k: 'rrp', n: 'ON RRP Take-Up', v: cd(RRP), grp: 'Operations, $ bn' }, { k: 'srf', n: 'Standing Repo Operations (SRP) Take-Up', v: cd(SRF), grp: 'Operations, $ bn' },
  { k: 'tga', n: 'TGA Closing Balance (Daily)', v: cd(TGA), grp: 'Operations, $ bn' }, { k: 'sofrv', n: 'SOFR Volume', v: cd(SOFRV), grp: 'Operations, $ bn' }
];
const fmtv = v => Math.abs(v) >= 100 ? fb(v) : Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(2);
const wopt = def => ({ months: WK.slice(0, LW + 1), cat: WCAT, ranges: WR, fmt: fmtv, src: 'Federal Reserve Board H.4.1', W: 460, H: 330, def });
const dopt = (def, src) => ({ months: DY.slice(0, LD + 1), cat: DCAT, ranges: DR, fmt: fmtv, src: src || 'Federal Reserve Bank of New York', W: 460, H: 330, def });

// the policy corridor: five rates on one chart, so it keeps its own range buttons instead of the four-line picker
(function corridor() {
  const el = document.getElementById('lc1'); el.innerHTML = '<div class="plot"></div><div class="tb"></div>';
  const plot = el.querySelector('.plot'), tb = el.querySelector('.tb'), months = DY.slice(0, LD + 1);
  const series = [{ name: 'Standing Repo Operations (SRP) Rate', v: cd(SRFR), c: '--axis', dash: 1 }, { name: 'IORB', v: cd(IORB), c: '--c4', dash: 1 },
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
seriesChart('lc2', dopt({ title: 'Repo Pressure: Overnight Rates Less IORB', sub: 'Basis points', r: '1Y', ref: 0, hl: HL, ids: [{ k: 's_iorb' }, { k: 'e_iorb' }, { k: 's99' }] }));
seriesChart('lc3', dopt({ title: 'Fed Facilities: ON RRP and SRP Take-Up', sub: '$ bn, Daily', r: '2Y', ids: [{ k: 'rrp' }, { k: 'srf', ax: 'R' }] }));
seriesChart('la1', { ...wopt({ title: 'Reserves as a Share of Bank Assets', sub: '%, Wednesday Level; EFFR − IORB, bp (R)', r: 'Max', ids: [{ k: 'resr' }, { k: 'eiorbw', ax: 'R' }] }),
  src: 'FRB H.4.1, H.8; FRBNY' });

// reserve demand curve: each week's reserve ratio against that week's average EFFR − IORB
(function demandCurve() {
  // x axis: reserves scaled by commercial bank assets (H.8) or by nominal GDP, as in the Fed staff paper's Figure 6
  const el = document.getElementById('la2'), XS = { bank: ['Bank assets', RESR, 'Reserves, % of commercial bank total assets', 'of bank assets'], gdp: ['GDP', RESG, 'Reserves, % of nominal GDP', 'of GDP'] };
  el.innerHTML = '<div class="plot"></div><div class="tb"></div>';
  const plot = el.querySelector('.plot'), tb = el.querySelector('.tb');
  let xs = store.get('la2') || 'bank'; if (!XS[xs]) xs = 'bank';
  const draw = () => {
    const [, XA, xlab, xunit] = XS[xs], pts = [];
    for (let t = 0; t <= LW; t++) if (XA[t] != null && E_IORBW[t] != null) pts.push({ t, x: XA[t], y: E_IORBW[t] });
    if (!pts.length) return;
    const yrs = [...new Set(pts.map(p => WK[p.t].slice(0, 4)))], y0n = +yrs[0], y1n = +yrs[yrs.length - 1];
    const W = fitW(el, 460), H = el.clientWidth < 560 ? 330 : 330, pl = 40, pr = 40, pt = 50, pb = 46, x0 = pl, x1 = W - pr, ya = pt, yb = H - pb;
    const gx = nice(Math.min(...pts.map(p => p.x)), Math.max(...pts.map(p => p.x)), 6), gy = nice(Math.min(...pts.map(p => p.y)), Math.max(...pts.map(p => p.y)), 5);
    const X = v => x0 + (v - gx.lo) / (gx.hi - gx.lo) * (x1 - x0), Y = v => yb - (v - gy.lo) / (gy.hi - gy.lo) * (yb - ya);
    let g = '';
    for (let v = gy.lo; v <= gy.hi + 1e-9; v += gy.step) g += `<line x1="${x0}" x2="${x1}" y1="${Y(v)}" y2="${Y(v)}" stroke="${css('--grid')}"/><text x="${x0 - 5}" y="${Y(v) + 3.5}" font-size="10" text-anchor="end">${fmtT(v, gy.step)}</text><text x="${x1 + 5}" y="${Y(v) + 3.5}" font-size="10">${fmtT(v, gy.step)}</text>`;
    for (let v = gx.lo; v <= gx.hi + 1e-9; v += gx.step) g += `<line x1="${X(v)}" x2="${X(v)}" y1="${yb}" y2="${yb + 4}" stroke="${css('--axis')}"/><text x="${X(v)}" y="${yb + 15}" font-size="10" text-anchor="middle">${fmtT(v, gx.step)}</text>`;
    if (gy.lo < 0 && gy.hi > 0) g += `<line x1="${x0}" x2="${x1}" y1="${Y(0)}" y2="${Y(0)}" stroke="${css('--axis')}" stroke-width=".8"/>`;
    g += `<text x="${(x0 + x1) / 2}" y="${yb + 29}" font-size="10" text-anchor="middle">${xlab}</text>`;
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
    plot.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Reserve demand curve: EFFR minus IORB against reserves as a share of bank assets">${g}</svg><div class="tip"></div>`;
    const svg = plot.querySelector('svg'), tip = plot.querySelector('.tip'), hit = plot.querySelector('.hit');
    const move = ev => {
      const r = svg.getBoundingClientRect(), p = ev.touches ? ev.touches[0] : ev, sx = (p.clientX - r.left) / r.width * W, sy = (p.clientY - r.top) / r.height * H;
      let best = null, bd = Infinity; for (const q of pts) { const dd = (X(q.x) - sx) ** 2 + (Y(q.y) - sy) ** 2; if (dd < bd) { bd = dd; best = q; } }
      if (!best || bd > 400) { tip.style.display = 'none'; return; }
      tip.innerHTML = `<b>Week ending ${fmtDate(WK[best.t])}</b><br>Reserves: ${best.x.toFixed(2)}% ${xunit}<br>EFFR − IORB: ${best.y.toFixed(1)} bp`;
      tip.style.display = 'block'; const px = X(best.x) / W * r.width, tw = tip.offsetWidth;
      tip.style.left = (px + 14 + tw > r.width ? px - tw - 8 : px + 14) + 'px'; tip.style.top = (Y(best.y) / H * r.height - 10) + 'px';
    };
    hit.addEventListener('mousemove', move); hit.addEventListener('mouseleave', () => tip.style.display = 'none');
    hit.addEventListener('touchstart', move, { passive: true }); hit.addEventListener('touchmove', move, { passive: true });
    tb.innerHTML = `<span class="seg" role="group" aria-label="Scale reserves by">${Object.entries(XS).map(([k, v]) => `<button type="button" data-x="${k}" aria-pressed="${k === xs}">${v[0]}</button>`).join('')}</span>`;
  };
  tb.addEventListener('click', ev => { const b = ev.target.closest('button[data-x]'); if (!b) return; xs = b.dataset.x; store.set('la2', xs); draw(); });
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
seriesChart('la4', dopt({ title: 'Repo Rates vs. the SRP Ceiling', sub: 'SOFR Percentiles Less SRP Rate, bp', r: '1Y', ref: 0, hl: HL, ids: [{ k: 's75srp' }, { k: 's99srp' }, { k: 's25srp' }] }));
seriesChart('la6', dopt({ title: 'Share of SOFR Volume at or Above IORB', sub: '%, 20-Day Avg.; Bounds from SOFR Percentiles', r: 'Max', ids: [{ k: 'shl' }, { k: 'shh' }] }));
seriesChart('la5', dopt({ title: 'Rate Volatility Around IORB', sub: '15-Day Rolling Std. Dev., bp', r: '2Y', ids: [{ k: 'esd' }, { k: 'tsd' }] }));
seriesChart('lb1', wopt({ title: 'Federal Reserve Total Assets', sub: '$ bn, Wednesday Level', r: 'Max', ids: [{ k: 'walcl' }, { k: 'ust' }, { k: 'mbs' }, { k: 'bills' }] }));
seriesChart('lb2', wopt({ title: 'Balance Sheet Runoff Pace', sub: '13-Week Change ÷ 3, $ bn per Month', r: '5Y', ref: 0, ids: [{ k: 'ust13' }, { k: 'mbs13' }, { k: 'bills13' }] }));
seriesChart('lb3', wopt({ title: 'Reserves, TGA and ON RRP', sub: '$ bn, Wednesday Level', r: '5Y', ids: [{ k: 'res' }, { k: 'tgaw' }, { k: 'onrrpw' }] }));
seriesChart('lb4', wopt({ title: 'Net Liquidity vs. Reserve Balances', sub: '$ bn, Wednesday Level', r: '5Y', ids: [{ k: 'netl' }, { k: 'res' }] }));
seriesChart('lt1', dopt({ title: 'Treasury General Account', sub: '$ bn, Daily Closing Balance', r: '2Y', ids: [{ k: 'tga' }] }, 'U.S. Treasury, Daily Treasury Statement'));
seriesChart('lt2', wopt({ title: 'Backstop Borrowing: Discount Window and Repo', sub: '$ bn, Wednesday Level', r: '5Y', ids: [{ k: 'pcr' }, { k: 'repo' }] }));
// Fed liabilities and capital stacked (Anderson et al. 2026, Figure 2): reserves against the non-reserve liabilities that also absorb assets
(function liabilities() {
  const el = document.getElementById('lb5'); el.innerHTML = '<div class="plot"></div><div class="tb"></div>';
  const plot = el.querySelector('.plot'), tb = el.querySelector('.tb'), RR = { '2Y': 104, '5Y': 260, Max: 0 };
  const parts = [['Reserve balances', RES, '--k0', 'Reserves'], ['Currency in circulation', CURR, '--k1', 'Currency'], ['Treasury General Account', TGAW, '--k2', 'TGA'],
    ['Foreign official reverse repo', FRRP, '--k3', 'Foreign RRP'], ['ON RRP (ex foreign official)', ONRRPW, '--k4', 'ON RRP'], ['Other liabilities and capital', OTHL, '--kx', 'Other']];
  let st = Object.assign({ r: 'Max', u: 'bn' }, store.get('lb5') || {}); if (!(st.r in RR)) st.r = 'Max';
  const draw = () => {
    const N = LW + 1, start = RR[st.r] ? Math.max(0, N - RR[st.r]) : 0, nw = el.clientWidth < 560, W = fitW(plot, nw ? 460 : 940), H = 360;
    const sc = st.u === 'gdp' ? t => GDPW[t] ? 100 / GDPW[t] : null : () => 1, ok = t => parts.every(p => p[1][t] != null) && sc(t) != null;
    const pl = 40, pr = 40, pt = 50, pb = 46, x0 = pl, x1 = W - pr, ya = pt, yb = H - pb, n = N - 1 - start, xw = (x1 - x0) / (n + 1), X = i => x0 + (i - start + 0.5) * xw;
    let hi = 0; for (let t = start; t < N; t++) if (ok(t)) hi = Math.max(hi, parts.reduce((q, p) => q + p[1][t] * sc(t), 0));
    const gy = nice(0, hi * 1.22, 5), Y = v => yb - (v - gy.lo) / (gy.hi - gy.lo) * (yb - ya);
    let g = '';
    for (let v = gy.lo; v <= gy.hi + 1e-9; v += gy.step) g += `<line x1="${x0}" x2="${x1}" y1="${Y(v)}" y2="${Y(v)}" stroke="${css('--grid')}"/><text x="${x0 - 5}" y="${Y(v) + 3.5}" font-size="10" text-anchor="end">${fmtT(v, gy.step).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</text><text x="${x1 + 5}" y="${Y(v) + 3.5}" font-size="10">${fmtT(v, gy.step).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</text>`;
    const base = Array(N).fill(0);
    for (const [, a, c] of parts) {
      let up = '', dn = '';
      for (let t = start; t < N; t++) { if (!ok(t)) continue; const b0 = base[t], b1 = b0 + Math.max(0, a[t]) * sc(t); up += (up ? 'L' : 'M') + X(t).toFixed(1) + ' ' + Y(b1).toFixed(1); dn = 'L' + X(t).toFixed(1) + ' ' + Y(b0).toFixed(1) + dn; base[t] = b1; }
      if (up) g += `<path d="${up}${dn}Z" fill="${css(c)}" fill-opacity=".85" stroke="none"/>`;
    }
    const yrs = [...new Set(WK.slice(start, N).map(d => d.slice(0, 4)))], every = yrs.length > 9 && xw * 52 < 30 ? 2 : 1;
    yrs.forEach((yr, k) => { if ((yrs.length - 1 - k) % every) return; const idx = []; for (let t = start; t < N; t++) if (WK[t].startsWith(yr)) idx.push(t);
      if (idx.length > 12) g += `<text x="${(X(idx[0]) + X(idx[idx.length - 1])) / 2}" y="${yb + 15}" font-size="10.5" text-anchor="middle">${yr.slice(2)}</text>`;
      if (idx[0] > start) g += `<line x1="${X(idx[0]) - xw / 2}" x2="${X(idx[0]) - xw / 2}" y1="${yb}" y2="${yb + 5}" stroke="${css('--axis')}"/>`; });
    g += `<rect x="${x0}" y="${ya}" width="${x1 - x0}" height="${yb - ya}" fill="none" stroke="${css('--frame')}" stroke-width=".8"/>`;
    g += `<text x="${W / 2}" y="16" font-size="12.5" text-anchor="middle" style="fill:${css('--ink')}">${nw ? 'Fed Liabilities and Capital' : 'Federal Reserve Liabilities and Capital'}</text>`;
    g += `<text x="${W / 2}" y="31" font-size="11" text-anchor="middle" style="fill:${css('--ink')}">${st.u === 'gdp' ? '% of Nominal GDP' : '$ bn'}, Wednesday Level</text>`;
    parts.forEach(([nm, , c, sh], k) => { const nc = nw ? 3 : 2, col = k % nc, row = Math.floor(k / nc), lx = x0 + 6 + col * (nw ? 82 : 190), ly = ya + 12 + row * 13;
      g += `<rect x="${lx}" y="${ly - 7}" width="12" height="8" fill="${css(c)}" fill-opacity=".85"/><text x="${lx + 17}" y="${ly}" font-size="10">${nw ? sh : nm}</text>`; });
    g += `<text x="${x0 - 30}" y="${H - 4}" font-size="10">Source:  Federal Reserve Board H.4.1${st.u === 'gdp' ? '; BEA (GDP; latest quarter carried forward)' : ''}</text>`;
    g += `<line class="xh" y1="${ya}" y2="${yb}" stroke="${css('--axis')}" stroke-width=".6" visibility="hidden"/><rect class="hit" x="${x0}" y="${ya}" width="${x1 - x0}" height="${yb - ya}" fill="transparent"/>`;
    plot.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Federal Reserve liabilities and capital, stacked">${g}</svg><div class="tip"></div>`;
    const svg = plot.querySelector('svg'), tip = plot.querySelector('.tip'), xl = plot.querySelector('.xh'), hit = plot.querySelector('.hit');
    const fv = v => st.u === 'gdp' ? v.toFixed(1) + '%' : fb(v);
    const move = ev => {
      const r = svg.getBoundingClientRect(), p = ev.touches ? ev.touches[0] : ev, i = Math.max(start, Math.min(N - 1, Math.floor(start + ((p.clientX - r.left) / r.width * W - x0) / xw)));
      xl.setAttribute('x1', X(i)); xl.setAttribute('x2', X(i)); xl.setAttribute('visibility', 'visible');
      tip.innerHTML = `<b>${fmtDate(WK[i])}</b><br>` + (ok(i) ? [...parts].reverse().map(([nm, a, c]) => `<span style="color:${css(c)}">■</span> ${nm}: ${fv(a[i] * sc(i))}`).join('<br>') + `<br>Total: ${fv(WALCL[i] * sc(i))}` : 'n.a.');
      tip.style.display = 'block'; const px = X(i) / W * r.width, tw = tip.offsetWidth;
      tip.style.left = (px + 14 + tw > r.width ? px - tw - 4 : px + 14) + 'px'; tip.style.top = (ya / H * r.height + 8) + 'px';
    };
    hit.addEventListener('mousemove', move); hit.addEventListener('mouseleave', () => { tip.style.display = 'none'; xl.setAttribute('visibility', 'hidden'); });
    hit.addEventListener('touchstart', move, { passive: true }); hit.addEventListener('touchmove', move, { passive: true });
    tb.innerHTML = `<span class="seg" role="group" aria-label="Range">${Object.keys(RR).map(k => `<button type="button" data-r="${k}" aria-pressed="${k === st.r}">${k}</button>`).join('')}</span>` +
      `<span class="seg" role="group" aria-label="Units">${[['bn', '$ bn'], ['gdp', '% of GDP']].map(([k, v]) => `<button type="button" data-u="${k}" aria-pressed="${k === st.u}">${v}</button>`).join('')}</span>`;
  };
  tb.addEventListener('click', ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.r) st.r = b.dataset.r; else if (b.dataset.u) st.u = b.dataset.u; else return; store.set('lb5', st); draw(); });
  refit(el, draw); draw(); SC.lb5 = { draw };
})();

matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { for (const k in SC) SC[k].draw(); });
