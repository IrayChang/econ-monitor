mount('tpl-mm');
/* ---------- Money markets: overnight rates in the policy corridor, spreads, and term funding costs ---------- */
const Q = window.MM_DATA, DY = Q.days;
const d = k => Q.d[k] || DY.map(() => null);
const lastI = a => { for (let t = a.length - 1; t >= 0; t--) if (a[t] != null) return t; return -1; };
const lastOn = (a, t) => { for (let j = t; j >= 0; j--) if (a[j] != null) return j; return -1; };
const at = (a, t) => t >= 0 ? a[t] : null;
const bp = (a, b) => a.map((v, t) => v == null || b[t] == null ? null : Math.round((v - b[t]) * 100));
const f2 = v => v == null ? 'n.a.' : v.toFixed(2);
const sbp = v => v == null ? 'n.a.' : (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(Math.round(v));
const fb = v => v == null ? 'n.a.' : Math.round(v).toLocaleString('en-US');
const wlab = s => `${MON[+s.slice(5, 7) - 1]} ${+s.slice(8)}`;
// overnight rates and administered rates, %
const SOFR = d('SOFR'), EFFR = d('EFFR'), TGCR = d('TGCR'), BGCR = d('BGCR'), IORB = d('IORB'), RRPR = d('RRPR'), SRPR = d('SRFR'), FFTL = d('FFTL'), FFTU = d('FFTU');
const SOFR99 = d('SOFR99'), SOFR1 = d('SOFR1'), SOFRV = d('SOFRV'), EFFRV = d('EFFRV'), TGCRV = d('TGCRV'), BGCRV = d('BGCRV');
// term rates, %: SOFR Averages (backward-looking), Treasury bills (par yields), commercial paper
const SA30 = d('SOFRA30'), SA90 = d('SOFRA90'), SA180 = d('SOFRA180'), B1M = d('T1M'), B3M = d('T3M'), B6M = d('T6M');
const CPN1 = d('CPN1M'), CPF1 = d('CPF1M'), CPN3 = d('CPN3M'), CPF3 = d('CPF3M'), CPA2 = d('CPA2');
// spreads, bp
const S_IORB = bp(SOFR, IORB), E_IORB = bp(EFFR, IORB), T_IORB = bp(TGCR, IORB), B_IORB = bp(BGCR, IORB), S_EFFR = bp(SOFR, EFFR), T_B = bp(TGCR, BGCR);
const B3_S = bp(B3M, SA90), B1_S = bp(B1M, SOFR), CPF3_B = bp(CPF3, B3M), CPA2_N = bp(CPA2, CPN1);
const LD = Math.max(lastI(SOFR), lastI(EFFR)), tS = lastOn(SOFR, LD);

document.getElementById('dt').textContent = `Daily to ${fmtDate(DY[LD])}`;
document.getElementById('hd').textContent = `SOFR ${f2(SOFR[tS])}%，${S_IORB[tS] > 0 ? '高於' : S_IORB[tS] < 0 ? '低於' : '等於'} IORB ${Math.abs(S_IORB[tS])} bp`;

// narrative: overnight, then term funding
(function lede() {
  const avg = (a, t, n = 20) => { const x = a.slice(Math.max(0, t - n + 1), t + 1).filter(v => v != null); return x.length ? x.reduce((p, q) => p + q, 0) / x.length : null; };
  const se = avg(S_EFFR, tS);
  const lo = FFTL[lastOn(FFTL, LD)], hi = FFTU[lastOn(FFTU, LD)];
  const hl = v => v == null ? 'n.a.' : `${v < 0 ? '低' : '高'} ${Math.abs(Math.round(v))} bp`;
  const b3 = B3_S[lastOn(B3_S, LD)], view = b3 > 10 ? '市場預期短率上升' : b3 < -10 ? '市場預期短率下降' : '市場預期短率大致持平';
  const pos = SOFR[tS] > IORB[tS] ? '高於準備金利率' : SOFR[tS] < IORB[tS] ? '低於準備金利率' : '貼著準備金利率';
  document.getElementById('mp1').innerHTML = `<p>隔夜：SOFR ${f2(SOFR[tS])}% ${pos}，仍在目標區間 ${f2(lo)}–${f2(hi)}% 內。SOFR 減 EFFR 近 20 日平均 ${sbp(se)} bp${se > 2 ? '，附買回比銀行間拆款緊' : se < -2 ? '，附買回資金比銀行間充裕' : '，兩個市場大致同步'}。</p>
<p>期限：${view}，3 個月國庫券比過去 90 天 SOFR 平均${hl(b3)}（國庫券另受供需影響）。信用溢價：AA 金融本票比國庫券${hl(CPF3_B[lastOn(CPF3_B, LD)])}，A2/P2 比 AA 非金融本票${hl(CPA2_N[lastOn(CPA2_N, LD)])}。</p>`;
})();

/* ---------- overview table ---------- */
(function table() {
  const rows = [['隔夜利率，%'], ['SOFR', SOFR, '%'], ['TGCR', TGCR, '%'], ['BGCR', BGCR, '%'], ['EFFR', EFFR, '%'],
    ['IORB', IORB, '%'], ['ON RRP 利率（下限）', RRPR, '%'], ['SRP 利率（上限）', SRPR, '%'],
    ['利差，bp'], ['SOFR − IORB', S_IORB, 'bp'], ['SOFR − EFFR', S_EFFR, 'bp'], ['TGCR − BGCR', T_B, 'bp'],
    ['期限利率，%'], ['SOFR 30 天平均', SA30, '%'], ['SOFR 90 天平均', SA90, '%'], ['SOFR 180 天平均', SA180, '%'],
    ['1 個月國庫券', B1M, '%'], ['3 個月國庫券', B3M, '%'], ['6 個月國庫券', B6M, '%'],
    ['AA 非金融本票 1 個月', CPN1, '%'], ['AA 金融本票 3 個月', CPF3, '%'], ['A2/P2 非金融本票 30 天', CPA2, '%'],
    ['期限利差，bp'], ['3 個月國庫券 − SOFR 90 天平均', B3_S, 'bp'], ['AA 金融本票 − 國庫券，3 個月', CPF3_B, 'bp'], ['A2/P2 − AA 非金融本票，1 個月', CPA2_N, 'bp'],
    ['交易量，$ bn'], ['SOFR', SOFRV, '$'], ['EFFR', EFFRV, '$']];
  const back = { '1 wk': 5, '1 mo': 21, '1 yr': 252 };
  let h = `<thead><tr class="grp"><th>Daily</th><th class="vl" colspan="2">Latest</th><th class="vl" colspan="3">Earlier</th><th class="vl">3 mo.</th></tr>
<tr><th></th><th class="vl">Date</th><th>Value</th>${Object.keys(back).map((k, j) => `<th${j ? '' : ' class="vl"'}>${k} ago</th>`).join('')}<th class="vl"></th></tr></thead><tbody>`;
  for (const [n, a, u] of rows) {
    if (!a) { h += `<tr class="gh"><td colspan="7">${n}</td></tr>`; continue; }
    const t = lastOn(a, LD); if (t < 0) continue;
    const fm = u === '%' ? f2 : u === 'bp' ? sbp : fb;
    h += `<tr><td>${n}</td><td class="vl note">${wlab(DY[t])}</td><td><b>${fm(a[t])}</b></td>` +
      Object.values(back).map((k, j) => `<td${j ? '' : ' class="vl"'}>${fm(at(a, lastOn(a, t - k)))}</td>`).join('') + `<td class="vl" style="padding:2px 9px">${sparkline(a.slice(0, t + 1), 63, u === 'bp' ? 0 : null)}</td></tr>`;
  }
  document.getElementById('mt').innerHTML = h + '</tbody>';
})();

/* ---------- charts ---------- */
const DR = { '3M': 63, '6M': 126, '1Y': 252, '2Y': 504, '5Y': 1260, Max: 0 };
const cd = a => a.slice(0, LD + 1);
const DCAT = [
  { k: 'sofr', n: 'SOFR', v: cd(SOFR), grp: 'Overnight rates, %' }, { k: 'tgcr', n: 'TGCR', v: cd(TGCR), grp: 'Overnight rates, %' }, { k: 'bgcr', n: 'BGCR', v: cd(BGCR), grp: 'Overnight rates, %' },
  { k: 'effr', n: 'Effective Fed Funds Rate', v: cd(EFFR), grp: 'Overnight rates, %' }, { k: 'iorb', n: 'IORB', v: cd(IORB), grp: 'Overnight rates, %', dash: 1 },
  { k: 's_iorb', n: 'SOFR − IORB', v: cd(S_IORB), grp: 'Spreads, bp' }, { k: 'e_iorb', n: 'EFFR − IORB', v: cd(E_IORB), grp: 'Spreads, bp' },
  { k: 't_iorb', n: 'TGCR − IORB', v: cd(T_IORB), grp: 'Spreads, bp' }, { k: 'b_iorb', n: 'BGCR − IORB', v: cd(B_IORB), grp: 'Spreads, bp' },
  { k: 's_effr', n: 'SOFR − EFFR', v: cd(S_EFFR), grp: 'Spreads, bp' }, { k: 't_b', n: 'TGCR − BGCR', v: cd(T_B), grp: 'Spreads, bp' },
  { k: 'sa30', n: 'SOFR 30-Day Average', v: cd(SA30), grp: 'Term rates, %' }, { k: 'sa90', n: 'SOFR 90-Day Average', v: cd(SA90), grp: 'Term rates, %' },
  { k: 'sa180', n: 'SOFR 180-Day Average', v: cd(SA180), grp: 'Term rates, %' }, { k: 'b1', n: '1-Month Bill', v: cd(B1M), grp: 'Term rates, %' },
  { k: 'b3', n: '3-Month Bill', v: cd(B3M), grp: 'Term rates, %' }, { k: 'b6', n: '6-Month Bill', v: cd(B6M), grp: 'Term rates, %' },
  { k: 'cpn1', n: 'CP, AA Nonfinancial 1M', v: cd(CPN1), grp: 'Commercial paper, %' }, { k: 'cpf1', n: 'CP, AA Financial 1M', v: cd(CPF1), grp: 'Commercial paper, %' },
  { k: 'cpn3', n: 'CP, AA Nonfinancial 3M', v: cd(CPN3), grp: 'Commercial paper, %' }, { k: 'cpf3', n: 'CP, AA Financial 3M', v: cd(CPF3), grp: 'Commercial paper, %' },
  { k: 'cpa2', n: 'CP, A2/P2 Nonfinancial 30-Day', v: cd(CPA2), grp: 'Commercial paper, %' },
  { k: 'b3_s', n: '3M Bill − SOFR 90-Day Avg.', v: cd(B3_S), grp: 'Term spreads, bp' }, { k: 'b1_s', n: '1M Bill − SOFR', v: cd(B1_S), grp: 'Term spreads, bp' },
  { k: 'cpf3_b', n: '3M AA Financial CP − 3M Bill', v: cd(CPF3_B), grp: 'Term spreads, bp' }, { k: 'cpa2_n', n: 'A2/P2 − AA Nonfinancial CP, 1M', v: cd(CPA2_N), grp: 'Term spreads, bp' },
  { k: 'sofrv', n: 'SOFR Volume', v: cd(SOFRV), grp: 'Volumes, $ bn' }, { k: 'tgcrv', n: 'TGCR Volume', v: cd(TGCRV), grp: 'Volumes, $ bn' },
  { k: 'bgcrv', n: 'BGCR Volume', v: cd(BGCRV), grp: 'Volumes, $ bn' }, { k: 'effrv', n: 'EFFR Volume', v: cd(EFFRV), grp: 'Volumes, $ bn' }
];
const fmtv = v => Math.abs(v) >= 100 ? fb(v) : Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(2);
const dopt = (def, src) => ({ months: DY.slice(0, LD + 1), cat: DCAT, ranges: DR, fmt: fmtv, src: src || 'Federal Reserve Bank of New York', W: 460, H: 330, def });

// the policy corridor: target range, administered rates and the overnight market rates on one chart
(function corridor() {
  const el = document.getElementById('mc1'); el.innerHTML = '<div class="plot"></div><div class="tb"></div>';
  const plot = el.querySelector('.plot'), tb = el.querySelector('.tb'), months = DY.slice(0, LD + 1);
  const series = [{ name: 'SRP Rate (Ceiling)', v: cd(SRPR), c: '--axis', dash: 1 }, { name: 'IORB', v: cd(IORB), c: '--c4', dash: 1 },
    { name: 'SOFR', v: cd(SOFR), c: '--c1' }, { name: 'TGCR', v: cd(TGCR), c: '--c3' }, { name: 'EFFR', v: cd(EFFR), c: '--c2' },
    { name: 'ON RRP Rate (Floor)', v: cd(RRPR), c: '--frame', dash: 1 }].map(s => ({ ...s, axis: 'L' }));
  let r = store.get('mc1') || '1Y'; if (!(r in DR)) r = '1Y';
  const draw = () => {
    const N = months.length, start = DR[r] ? Math.max(0, N - DR[r]) : 0, nw = el.clientWidth < 560;
    hv(plot, { W: nw ? 460 : 940, H: 360, months, start, title: nw ? 'Policy Rate Corridor' : 'Policy Rate Corridor and Overnight Money-Market Rates', sub: nw ? '%, Overnight Rates' : '%',
      src: 'Federal Reserve Board; Federal Reserve Bank of New York', series, fmt: v => v.toFixed(2) });
    tb.innerHTML = `<span class="seg" role="group" aria-label="Range">${Object.keys(DR).map(k => `<button type="button" data-r="${k}" aria-pressed="${k === r}">${k}</button>`).join('')}</span>`;
  };
  tb.addEventListener('click', ev => { const b = ev.target.closest('button[data-r]'); if (!b) return; r = b.dataset.r; store.set('mc1', r); draw(); });
  draw(); SC.mc1 = { draw };
})();
seriesChart('mc2', dopt({ title: 'Secured and Unsecured Rates Less IORB', sub: 'Basis points', r: '1Y', ref: 0, ids: [{ k: 's_iorb' }, { k: 't_iorb' }, { k: 'e_iorb' }] }));
seriesChart('mc3', dopt({ title: 'Repo vs. Fed Funds: SOFR − EFFR', sub: 'Basis points', r: '2Y', ref: 0, ids: [{ k: 's_effr' }, { k: 't_b' }] }));
seriesChart('mc4', dopt({ title: 'Term Rates: Bills vs. SOFR Averages', sub: '%', r: '2Y', ids: [{ k: 'b3' }, { k: 'sa90' }, { k: 'b6' }, { k: 'sa180' }] }, 'U.S. Treasury; Federal Reserve Bank of New York'));
seriesChart('mc5', dopt({ title: 'Commercial Paper Rates', sub: '%', r: '2Y', ids: [{ k: 'cpn1' }, { k: 'cpf3' }, { k: 'cpa2' }, { k: 'b3' }] }, 'Federal Reserve Board (via FRED); U.S. Treasury'));
seriesChart('mc6', dopt({ title: 'Term Funding Spreads', sub: 'Basis points', r: '2Y', ref: 0, ids: [{ k: 'cpf3_b' }, { k: 'cpa2_n' }, { k: 'b3_s' }] }, 'FRB; U.S. Treasury; FRBNY'));
seriesChart('mc7', dopt({ title: 'Overnight Market Volumes', sub: '$ bn, Daily', r: '2Y', ids: [{ k: 'sofrv' }, { k: 'tgcrv' }, { k: 'effrv' }] }));
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { for (const k in SC) SC[k].draw(); });
