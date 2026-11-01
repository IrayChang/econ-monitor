mount('tpl-ust');
/* ---------- Treasuries: the daily curve, inflation compensation and term premium, auctions and the quarterly refunding ---------- */
const Q = window.UST_DATA, DY = Q.days;
const d = k => Q.d[k] || DY.map(() => null);
const lastI = a => { for (let t = a.length - 1; t >= 0; t--) if (a[t] != null) return t; return -1; };
const lastOn = (a, t) => { for (let j = t; j >= 0; j--) if (a[j] != null) return j; return -1; };
const at = (a, t) => t >= 0 ? a[t] : null;
const minus = (a, b) => a.map((v, t) => v == null || b[t] == null ? null : v - b[t]);
const bps = a => a.map(v => v == null ? null : Math.round(v * 1000) / 10);
const f2 = v => v == null ? 'n.a.' : v.toFixed(2);
const sbp = v => v == null ? 'n.a.' : (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(Math.round(v));
const fb = v => v == null ? 'n.a.' : Math.round(v).toLocaleString('en-US');
const wlab = s => `${MON[+s.slice(5, 7) - 1]} ${+s.slice(8)}`;
const T = [['T1M', '1M'], ['T3M', '3M'], ['T6M', '6M'], ['T1Y', '1Y'], ['T2Y', '2Y'], ['T3Y', '3Y'], ['T5Y', '5Y'], ['T7Y', '7Y'], ['T10Y', '10Y'], ['T20Y', '20Y'], ['T30Y', '30Y']];
const Y = Object.fromEntries(T.map(([k]) => [k, d(k)]));
const R5 = d('R5Y'), R10 = d('R10Y'), R30 = d('R30Y'), EFFR = d('EFFR'), ACMY = d('ACMY10'), ACMRN = d('ACMRN10'), TP2 = d('TP2'), TP5 = d('TP5'), TP10 = d('TP10');
// spreads in bp; breakevens and the 5y5y forward breakeven in %
const S2_10 = bps(minus(Y.T10Y, Y.T2Y)), S3M_10 = bps(minus(Y.T10Y, Y.T3M)), S5_30 = bps(minus(Y.T30Y, Y.T5Y)), S2_EF = bps(minus(Y.T2Y, EFFR));
const FLY = Y.T10Y.map((v, t) => v == null || Y.T2Y[t] == null || Y.T30Y[t] == null ? null : Math.round((2 * v - Y.T2Y[t] - Y.T30Y[t]) * 1000) / 10);
const BEI10 = minus(Y.T10Y, R10), BEI5 = minus(Y.T5Y, R5), BEI30 = minus(Y.T30Y, R30), F5Y5 = BEI10.map((v, t) => v == null || BEI5[t] == null ? null : 2 * v - BEI5[t]);
const TPB = a => a.map(v => v == null ? null : Math.round(v * 1000) / 10);
const LD = lastI(Y.T10Y), tA = lastI(TP10);
const AU = Q.auctions || [], SCH = Q.schedule || [], QRA = Q.qra || [];

document.getElementById('dt').textContent = `Daily to ${fmtDate(DY[LD])}`;
document.getElementById('hd').textContent = `10 年期公債 ${f2(Y.T10Y[LD])}%，10 年減 2 年 ${sbp(S2_10[LD])} bp`;

/* ---------- curve snapshots: latest, about a month and a year earlier (last trading day on or before) ---------- */
const onOrBefore = s => { let j = -1; for (let t = 0; t <= LD; t++) if (DY[t] <= s && Y.T10Y[t] != null) j = t; return j; };
const shift = (s, m) => { let y = +s.slice(0, 4), mo = +s.slice(5, 7) - m; while (mo < 1) { mo += 12; y--; } return `${y}-${String(mo).padStart(2, '0')}${s.slice(7)}`; };
const SNAP = [['Latest', LD, '--c1', ''], ['1 month ago', onOrBefore(shift(DY[LD], 1)), '--c2', '5 3'], ['1 year ago', onOrBefore(shift(DY[LD], 12)), '--axis', '1.5 3']].filter(x => x[1] >= 0);

/* ---------- narrative ---------- */
(function lede() {
  const back = k => lastOn(Y.T10Y, LD - k), m1 = SNAP[1] ? SNAP[1][1] : -1;
  const ch = (a, t) => t < 0 || a[LD] == null || a[t] == null ? null : (a[LD] - a[t]) * 100;
  const shape = S2_10[LD] < 0 ? '倒掛' : S2_10[LD] < 25 ? '接近平坦' : '正斜率';
  let p = `<p>殖利率曲線${shape}：10 年期 ${f2(Y.T10Y[LD])}%，10 年減 2 年 ${sbp(S2_10[LD])} bp。一個月來 2 年期 ${sbp(ch(Y.T2Y, m1))} bp、10 年期 ${sbp(ch(Y.T10Y, m1))} bp。2 年期減 EFFR ${sbp(S2_EF[lastOn(S2_EF, LD)])} bp${S2_EF[lastOn(S2_EF, LD)] < -10 ? '，市場預期未來兩年降息' : S2_EF[lastOn(S2_EF, LD)] > 10 ? '，市場預期未來兩年升息' : '，市場預期政策利率大致持平'}。</p>`;
  const tB = lastOn(BEI10, LD);
  p += `<p>通膨與期限溢酬：10 年損益兩平通膨 ${f2(BEI10[tB])}%，實質殖利率 ${f2(R10[lastOn(R10, LD)])}%。ACM 10 年期限溢酬 ${sbp(TP10[tA] * 100)} bp，一年前 ${sbp(at(TP10, lastOn(TP10, tA - 252)) * 100)} bp。</p>`;
  const done = AU.filter(a => a.btc != null && a.k !== 'FRN'), la = done[0];
  const rel = QRA[QRA.length - 1];
  if (la || rel) {
    p += '<p>';
    if (la) {
      const prev = done.filter(a => a.t === la.t && a.k === la.k && a.d < la.d).slice(0, 6), avg = f => prev.length ? prev.reduce((s, a) => s + (a[f] || 0), 0) / prev.length : null;
      p += `最近標售：${fmtDate(la.d)} ${la.t}${la.k === 'TIPS' ? ' TIPS' : ''}${la.re ? '（增額）' : ''}，投標倍數 ${la.btc.toFixed(2)}（前 6 次平均 ${avg('btc')?.toFixed(2) ?? 'n.a.'}），交易商得標 ${la.pd?.toFixed(1)}%（平均 ${avg('pd')?.toFixed(1) ?? 'n.a.'}%）。`;
    }
    if (rel) {
      const e = rel.est.map(x => `${x.q.replace('-', ' ')} ${x.v < 0 ? '償還' : '借'} ${fb(Math.abs(x.v) * 10)} 億美元`).join('、');
      p += `財政部 ${fmtDate(rel.date)} 的借款估計：${e}。`;
    }
    p += '</p>';
  }
  document.getElementById('up1').innerHTML = p;
})();

/* ---------- overview table ---------- */
(function table() {
  const rows = [['殖利率，%'], ['3 個月國庫券', Y.T3M, '%'], ['2 年期', Y.T2Y, '%'], ['5 年期', Y.T5Y, '%'], ['10 年期', Y.T10Y, '%'], ['30 年期', Y.T30Y, '%'],
    ['利差，bp'], ['10 年 − 2 年', S2_10, 'bp'], ['10 年 − 3 個月', S3M_10, 'bp'], ['30 年 − 5 年', S5_30, 'bp'], ['蝶式（2s10s30s）', FLY, 'bp'], ['2 年期 − EFFR', S2_EF, 'bp'],
    ['通膨與期限溢酬'], ['10 年期實質殖利率（TIPS），%', R10, '%'], ['10 年損益兩平，%', BEI10, '%'], ['5 年損益兩平，%', BEI5, '%'], ['5 年後 5 年遠期損益兩平，%', F5Y5, '%'],
    ['ACM 10 年期限溢酬，bp', TPB(TP10), 'bp'], ['ACM 10 年預期短率平均，%', ACMRN, '%']];
  const back = { '1 wk': 5, '1 mo': 21, '1 yr': 251 };
  let h = `<thead><tr class="grp"><th>Daily</th><th class="vl" colspan="2">Latest</th><th class="vl" colspan="3">Change (bp)</th><th class="vl">3 mo.</th></tr>
<tr><th></th><th class="vl">Date</th><th>Value</th>${Object.keys(back).map((k, j) => `<th${j ? '' : ' class="vl"'}>${k}</th>`).join('')}<th class="vl"></th></tr></thead><tbody>`;
  for (const [n, a, u] of rows) {
    if (!a) { h += `<tr class="gh"><td colspan="7">${n}</td></tr>`; continue; }
    const t = lastOn(a, LD); if (t < 0) continue;
    const mult = u === '%' ? 100 : 1;
    h += `<tr><td>${n}</td><td class="vl note">${wlab(DY[t])}</td><td><b>${u === '%' ? f2(a[t]) : sbp(a[t])}</b></td>` +
      Object.values(back).map((k, j) => { const o = at(a, lastOn(a, t - k)); return `<td${j ? '' : ' class="vl"'}>${o == null ? 'n.a.' : sbp((a[t] - o) * mult)}</td>`; }).join('') +
      `<td class="vl" style="padding:2px 9px">${sparkline(a.slice(0, t + 1), 63, u === 'bp' ? 0 : null)}</td></tr>`;
  }
  document.getElementById('ut').innerHTML = h + '</tbody>';
})();

/* ---------- yield curve by maturity: latest, a month and a year earlier ---------- */
(function curve() {
  const el = document.getElementById('uc0'), tbl = document.getElementById('uct');
  const now = SNAP[0], mo = SNAP[1], yr = SNAP[2];
  const ch = (a, b) => a == null || b == null ? '<td>n.a.</td>' : `<td class="${a > b ? 'up' : a < b ? 'dn' : ''}">${sbp((a - b) * 100)}</td>`;
  tbl.innerHTML = `<table><thead><tr><th>Maturity</th><th>${wlab(DY[now[1]])}</th>${mo ? '<th>1 mo. chg</th>' : ''}${yr ? '<th>1 yr chg</th>' : ''}</tr></thead><tbody>` +
    T.map(([k, l]) => `<tr><td>${l}</td><td>${f2(Y[k][now[1]])}</td>${mo ? ch(Y[k][now[1]], Y[k][mo[1]]) : ''}${yr ? ch(Y[k][now[1]], Y[k][yr[1]]) : ''}</tr>`).join('') +
    `</tbody></table><p class="note">%; changes in bp. Daily par yield curve, U.S. Treasury.</p>`;
  const draw = () => {
    const W = fitW(el, 460), H = 330, P = { l: 40, r: 16, t: 50, b: 46 };
    const vals = SNAP.flatMap(([, t]) => T.map(([k]) => Y[k][t]).filter(v => v != null));
    const sc = nice(Math.min(...vals), Math.max(...vals), 5), X = i => P.l + i * (W - P.l - P.r) / (T.length - 1), Yv = v => P.t + (sc.hi - v) / (sc.hi - sc.lo) * (H - P.t - P.b);
    let g = `<text x="${W / 2}" y="16" text-anchor="middle" font-size="12.5" style="fill:var(--ink)">Treasury Yield Curve</text><text x="${W / 2}" y="31" text-anchor="middle" font-size="11" style="fill:var(--ink)">%, Daily Close by Maturity</text>`;
    for (let v = sc.lo; v <= sc.hi + 1e-9; v += sc.step) g += `<line x1="${P.l}" x2="${W - P.r}" y1="${Yv(v)}" y2="${Yv(v)}" stroke="var(--grid)"/><text x="${P.l - 6}" y="${Yv(v) + 3}" text-anchor="end" font-size="10">${fmtT(v, sc.step)}</text>`;
    T.forEach(([, l], i) => { g += `<text x="${X(i)}" y="${H - P.b + 14}" text-anchor="middle" font-size="10">${l}</text>`; });
    SNAP.forEach(([lab, t, col, dash]) => {
      g += `<path d="${T.map(([k], i) => Y[k][t] == null ? '' : `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Yv(Y[k][t]).toFixed(1)}`).join('')}" fill="none" stroke="var(${col})" stroke-width="1.8" stroke-dasharray="${dash}"/>`;
      T.forEach(([k, l], i) => { if (Y[k][t] != null) g += `<circle cx="${X(i)}" cy="${Yv(Y[k][t])}" r="2.6" fill="var(${col})"><title>${lab} ${DY[t]} ${l}: ${f2(Y[k][t])}%</title></circle>`; });
    });
    const sp = Math.min(140, (W - P.l) / 3);
    g += SNAP.map(([lab, t, col, dash], j) => `<line x1="${P.l + j * sp}" x2="${P.l + j * sp + 18}" y1="${H - 12}" y2="${H - 12}" stroke="var(${col})" stroke-width="2" stroke-dasharray="${dash}"/><text x="${P.l + j * sp + 24}" y="${H - 8}" font-size="10.5">${lab === 'Latest' ? wlab(DY[t]) : lab}</text>`).join('');
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Treasury yield curve: latest, one month and one year earlier">${g}</svg>`;
  };
  refit(el, draw); draw(); SC.uc0 = { draw };
})();

/* ---------- time-series charts ---------- */
const DR = { '3M': 63, '6M': 126, '1Y': 252, '2Y': 504, '5Y': 1260, Max: 0 };
const cd = a => a.slice(0, LD + 1);
const CAT = [
  { k: 't3m', n: '3-Month Bill', v: cd(Y.T3M), grp: 'Yields, %' }, { k: 't2', n: '2-Year', v: cd(Y.T2Y), grp: 'Yields, %' }, { k: 't5', n: '5-Year', v: cd(Y.T5Y), grp: 'Yields, %' },
  { k: 't10', n: '10-Year', v: cd(Y.T10Y), grp: 'Yields, %' }, { k: 't30', n: '30-Year', v: cd(Y.T30Y), grp: 'Yields, %' },
  { k: 's210', n: '10Y − 2Y', v: cd(S2_10), grp: 'Curve, bp' }, { k: 's3m10', n: '10Y − 3M', v: cd(S3M_10), grp: 'Curve, bp' }, { k: 's530', n: '30Y − 5Y', v: cd(S5_30), grp: 'Curve, bp' },
  { k: 'fly', n: '2s10s30s Butterfly', v: cd(FLY), grp: 'Curve, bp' }, { k: 's2ef', n: '2Y − EFFR', v: cd(S2_EF), grp: 'Curve, bp' },
  { k: 'r10', n: '10-Year Real (TIPS)', v: cd(R10), grp: 'Real yields and breakevens, %' }, { k: 'r5', n: '5-Year Real (TIPS)', v: cd(R5), grp: 'Real yields and breakevens, %' },
  { k: 'bei10', n: '10-Year Breakeven', v: cd(BEI10), grp: 'Real yields and breakevens, %' }, { k: 'bei5', n: '5-Year Breakeven', v: cd(BEI5), grp: 'Real yields and breakevens, %' },
  { k: 'bei30', n: '30-Year Breakeven', v: cd(BEI30), grp: 'Real yields and breakevens, %' }, { k: 'f5y5', n: '5y5y Forward Breakeven', v: cd(F5Y5), grp: 'Real yields and breakevens, %' },
  { k: 'acmy', n: 'ACM 10-Year Fitted Yield', v: cd(ACMY), grp: 'ACM model, %' }, { k: 'acmrn', n: 'ACM 10-Year Risk-Neutral Yield', v: cd(ACMRN), grp: 'ACM model, %' },
  { k: 'tp10', n: 'ACM 10-Year Term Premium', v: cd(TP10), grp: 'ACM model, %' }, { k: 'tp5', n: 'ACM 5-Year Term Premium', v: cd(TP5), grp: 'ACM model, %' },
  { k: 'tp2', n: 'ACM 2-Year Term Premium', v: cd(TP2), grp: 'ACM model, %' }];
const fmtv = v => Math.abs(v) >= 10 ? v.toFixed(0) : v.toFixed(2);
const opt = (def, src) => ({ months: DY.slice(0, LD + 1), cat: CAT, ranges: DR, fmt: fmtv, src: src || 'U.S. Treasury', W: 460, H: 330, def });
seriesChart('uc1', opt({ title: 'Treasury Yields', sub: '%, Daily Close', r: '2Y', ids: [{ k: 't2' }, { k: 't5' }, { k: 't10' }, { k: 't30' }] }));
seriesChart('uc2', opt({ title: 'Yield Curve Spreads', sub: 'Basis points', r: '5Y', ref: 0, ids: [{ k: 's210' }, { k: 's3m10' }, { k: 's530' }] }));
seriesChart('uc3', opt({ title: '2s10s30s Butterfly', sub: 'Basis points: 2 × 10Y − 2Y − 30Y', r: '2Y', ref: 0, ids: [{ k: 'fly' }] }));
seriesChart('uc4', opt({ title: '2-Year Yield less Fed Funds', sub: 'Basis points: 2Y − EFFR', r: '5Y', ref: 0, ids: [{ k: 's2ef' }] }, 'U.S. Treasury; Federal Reserve Bank of New York'));
seriesChart('uc5', opt({ title: '10-Year Real Yield and Breakeven Inflation', sub: '%, Daily Close', r: '2Y', ids: [{ k: 't10' }, { k: 'r10' }, { k: 'bei10' }] }, 'U.S. Treasury (nominal and TIPS par yield curves)'));
seriesChart('uc6', opt({ title: 'Breakeven Inflation', sub: '%; 5y5y = 2 × 10Y BEI − 5Y BEI', r: '2Y', ids: [{ k: 'bei5' }, { k: 'bei10' }, { k: 'f5y5' }] }, 'U.S. Treasury'));
seriesChart('uc7', opt({ title: '10-Year Yield Decomposition (ACM)', sub: '%: Fitted Yield = Risk-Neutral Yield + Term Premium', r: '5Y', ids: [{ k: 'acmy' }, { k: 'acmrn' }, { k: 'tp10' }] }, 'Federal Reserve Bank of New York (ACM)'));
seriesChart('uc8', opt({ title: 'Term Premia by Maturity (ACM)', sub: '%', r: '5Y', ref: 0, ids: [{ k: 'tp2' }, { k: 'tp5' }, { k: 'tp10' }] }, 'Federal Reserve Bank of New York (ACM)'));

/* ---------- auctions: recent results against the previous six of the same security, the schedule ahead ---------- */
const secName = a => `${a.t}${a.k === 'TIPS' ? ' TIPS' : a.k === 'FRN' ? ' FRN' : ''}${a.re ? ' (reopening)' : ''}`;
(function auctions() {
  // auctions already held in the tentative schedule but not yet in Fiscal Data are listed as pending
  const held = SCH.filter(x => x.d <= DY[LD] && x.d > (AU[0] || { d: '' }).d && !AU.some(a => a.d === x.d && a.t === x.t && a.k === x.k)).map(x => ({ ...x, amt: null, btc: null })).reverse();
  const rows = [...held, ...AU].slice(0, 18);
  const prev6 = a => AU.filter(b => b.t === a.t && b.k === a.k && b.d < a.d && b.btc != null).slice(0, 6);
  const avg = (xs, f) => { const v = xs.map(x => x[f]).filter(x => x != null); return v.length ? v.reduce((p, q) => p + q, 0) / v.length : null; };
  const dlt = (v, m, dec, good) => v == null || m == null ? '' : ` <span class="note" style="color:var(${(v - m) * good > 0 ? '--bl' : (v - m) * good < 0 ? '--rd' : '--muted'})">${v - m > 0 ? '+' : v - m < 0 ? '−' : ''}${Math.abs(v - m).toFixed(dec)}</span>`;
  let h = `<thead><tr class="grp"><th>Coupon auctions</th><th class="vl">Size</th><th>High yield</th><th class="vl" colspan="2">Bid-to-cover</th><th class="vl" colspan="3">Accepted, % of competitive</th></tr>
<tr><th></th><th class="vl">$ bn</th><th>%</th><th class="vl">Ratio</th><th>vs. prior 6</th><th class="vl">Indirect</th><th>Direct</th><th>Dealers (vs. prior 6)</th></tr></thead><tbody>`;
  for (const a of rows) {
    const p = prev6(a), pend = a.btc == null;
    h += `<tr><td>${wlab(a.d)} ${a.d.slice(0, 4)} <b>${secName(a)}</b></td><td class="vl">${a.amt ?? 'n.a.'}</td>` +
      (pend ? `<td colspan="6" class="note">Results not yet in Treasury Fiscal Data</td>` :
      `<td>${a.y == null ? 'n.a.' : a.k === 'FRN' ? `${(a.y * 100).toFixed(1)} bp margin` : a.y.toFixed(3)}</td><td class="vl"><b>${a.btc.toFixed(2)}</b></td><td>${dlt(a.btc, avg(p, 'btc'), 2, 1) || 'n.a.'}</td>` +
      `<td class="vl">${a.ind?.toFixed(1) ?? 'n.a.'}</td><td>${a.dir?.toFixed(1) ?? 'n.a.'}</td><td>${a.pd?.toFixed(1) ?? 'n.a.'}${dlt(a.pd, avg(p, 'pd'), 1, -1)}</td>`) + '</tr>';
  }
  document.getElementById('ua').innerHTML = h + '</tbody>';
  // schedule ahead: auctions not yet held in the latest refunding's tentative calendar
  const today = DY[LD], up = SCH.filter(s => s.d > today).slice(0, 14);
  document.getElementById('us').innerHTML = up.length ? `<table><thead><tr><th>Upcoming coupon auctions</th><th>Auction</th><th>Settles</th></tr></thead><tbody>` +
    up.map(s => `<tr><td>${secName(s)}</td><td>${wlab(s.d)}</td><td>${wlab(s.s)}</td></tr>`).join('') + `</tbody></table><p class="note">Tentative schedule from the latest quarterly refunding; sizes are announced about a week before each auction.</p>`
    : '<p class="note">No upcoming coupon auctions in the latest tentative schedule.</p>';
})();
// auction history for one security: bid-to-cover (L) and the dealer share (R), one point per auction
(function auctionHistory() {
  const el = document.getElementById('ua1'); el.innerHTML = '<div class="plot"></div><div class="tb"></div>';
  const plot = el.querySelector('.plot'), tb = el.querySelector('.tb'), SEC = ['2-Year', '5-Year', '10-Year', '30-Year'];
  let s = store.get('ua1') || '10-Year'; if (!SEC.includes(s)) s = '10-Year';
  const draw = () => {
    const xs = AU.filter(a => a.t === s && a.k === 'Nominal' && a.btc != null).reverse();
    if (xs.length < 2) { plot.innerHTML = '<p class="note">Not enough auctions.</p>'; return; }
    hv(plot, { W: 460, H: 330, months: xs.map(a => a.d), start: 0, title: `${s} Note/Bond Auctions`, sub: 'Bid-to-Cover (L); Primary Dealers, % of Competitive (R)',
      src: 'U.S. Treasury, Fiscal Data', series: [{ name: 'Bid-to-cover', v: xs.map(a => a.btc), c: '--c1', axis: 'L' }, { name: 'Primary dealer share', v: xs.map(a => a.pd), c: '--c2', axis: 'R' }],
      fmt: v => v.toFixed(2) });
    tb.innerHTML = `<span class="seg" role="group" aria-label="Security">${SEC.map(k => `<button type="button" data-s="${k}" aria-pressed="${k === s}">${k.replace('-Year', 'Y')}</button>`).join('')}</span>`;
  };
  tb.addEventListener('click', ev => { const b = ev.target.closest('button[data-s]'); if (!b) return; s = b.dataset.s; store.set('ua1', s); draw(); });
  draw(); SC.ua1 = { draw };
})();

/* ---------- quarterly refunding: privately-held net marketable borrowing, estimates against outcomes ---------- */
(function qra() {
  const box = document.getElementById('uq');
  if (!QRA.length) { box.innerHTML = '<p class="note">Borrowing estimates are unavailable.</p>'; return; }
  const rel = QRA[QRA.length - 1], byQ = {};
  for (const r of QRA) {
    for (const e of r.est) { const x = byQ[e.q] = byQ[e.q] || {}; if (!x.first) x.first = { ...e, date: r.date }; x.last = { ...e, date: r.date }; }
    if (r.act) { const x = byQ[r.act.q] = byQ[r.act.q] || {}; x.act = r.act; }
  }
  const qs = Object.keys(byQ).sort(), bn = v => v == null ? 'n.a.' : `${v < 0 ? '−' : ''}$${fb(Math.abs(v))} bn`;
  const yi = v => `${v < 0 ? '償還 ' : ''}${fb(Math.abs(v) * 10)} 億美元`;
  box.innerHTML = `<p>最新借款估計（${fmtDate(rel.date)} 公布）：` + rel.est.map(e => `<b>${e.q.replace('-', ' ')}</b> 預計向民間淨借 ${yi(e.v)}，假設季末現金 ${yi(e.cash)}`).join('；') +
    (rel.act ? `。${rel.act.q.replace('-', ' ')} 實際淨借 ${yi(rel.act.v)}，季末現金 ${yi(rel.act.cash)}。` : '。') + ` <a href="https://home.treasury.gov${rel.path}" target="_blank" rel="noopener">新聞稿</a></p>`;
  const show = qs.slice(-14);
  hv(document.getElementById('uq1'), { W: 460, H: 330, months: show, start: 0, bar: true, title: 'Privately-Held Net Marketable Borrowing', sub: '$ bn per Quarter: Actual and Latest Estimate',
    src: 'U.S. Treasury, Marketable Borrowing Estimates', fmt: v => `$${fb(v)} bn`,
    series: [{ name: 'Actual', v: show.map(q => byQ[q].act ? byQ[q].act.v : null), c: '--c1', axis: 'L' }, { name: 'Latest estimate', v: show.map(q => byQ[q].act ? null : byQ[q].last ? byQ[q].last.v : null), c: '--c2', axis: 'L' }] });
  document.getElementById('uqt').innerHTML = `<table><thead><tr><th>Quarter</th><th>First est.</th><th>Latest est.</th><th>Actual</th><th>End cash</th></tr></thead><tbody>` +
    qs.slice(-10).reverse().map(q => { const x = byQ[q]; return `<tr><td>${q.replace('-', ' ')}</td><td>${bn(x.first?.v)}</td><td>${bn(x.last?.v)}</td><td><b>${bn(x.act?.v)}</b></td><td>${bn(x.act ? x.act.cash : x.last?.cash)}${x.act ? '' : ' <span class="note">assumed</span>'}</td></tr>`; }).join('') +
    `</tbody></table><p class="note">First and latest estimates are from successive releases; actuals are reported in the release after the quarter ends.</p>`;
})();
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { for (const k in SC) SC[k].draw(); });
