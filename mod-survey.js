mount('tpl-survey');
/* ---------- business surveys: ISM and S&P Global PMI ---------- */
const ISM = window.ALL_DATA.ism, SPG = window.ALL_DATA.spgi;
const K = { src: DK === 'ism' ? 'Institute for Supply Management' : 'S&P Global' };
// put every series on one monthly axis covering both surveys
const AX = [...new Set([...ISM.hist.months, ...SPG.hist.months])].sort(), NA = AX.length;
const onAx = (months, s) => { const a = new Array(NA).fill(null); if (s) s.v.forEach((x, j) => { const t = AX.indexOf(months[s.o + j]); if (t >= 0) a[t] = x; }); return a; };
const IS = k => onAx(ISM.hist.months, ISM.hist.series[k]), SP = k => onAx(SPG.hist.months, SPG.hist.series[k]);
const lastIdx = a => { for (let t = a.length - 1; t >= 0; t--) if (a[t] != null) return t; return -1; };
const ZH = { 'Manufacturing PMI': '製造業 PMI', 'Services PMI': '服務業 PMI', 'New Orders': '新訂單', Production: '生產', 'Business Activity': '商業活動', Employment: '就業',
  'Supplier Deliveries': '供應商交貨', Inventories: '存貨', "Customers' Inventories": '客戶存貨', Prices: '物價', 'Backlog of Orders': '未完成訂單',
  'New Export Orders': '新出口訂單', Imports: '進口', 'Inventory Sentiment': '存貨觀感' };
const COMP = {
  m: ['Manufacturing PMI', 'New Orders', 'Production', 'Employment', 'Supplier Deliveries', 'Inventories', "Customers' Inventories", 'Prices', 'Backlog of Orders', 'New Export Orders', 'Imports'],
  s: ['Services PMI', 'Business Activity', 'New Orders', 'Employment', 'Supplier Deliveries', 'Inventories', 'Prices', 'Backlog of Orders', 'New Export Orders', 'Imports', 'Inventory Sentiment']
};
const SECT = { m: 'Manufacturing', s: 'Services' };
// 'up is bad' components: higher prices, and customers' inventories (too high = weaker future orders)
const INV = new Set(['Prices', "Customers' Inventories"]);
const iv = (sec, c) => IS(`${sec}:${c}`);
const sgn = v => v == null ? '' : (v > 0 ? '+' : '') + v.toFixed(1);
const avgN = (a, t, n) => { const xs = a.slice(Math.max(0, t - n + 1), t + 1).filter(v => v != null); return xs.length === n ? xs.reduce((p, c) => p + c, 0) / n : null; };
const state50 = (v, c) => v == null ? '' : c === 'Prices' ? (v > 50 ? '上漲' : '下跌') : c === 'Supplier Deliveries' ? (v > 50 ? '變慢' : '變快') : c.includes('Inventor') && c !== 'Inventory Sentiment' ? (v > 50 ? '增加' : '減少') : (v > 50 ? '擴張' : '收縮');
const tone = (v, c) => v == null ? '' : ((v > 50) !== INV.has(c)) ? 'var(--c3)' : 'var(--c2)';
const RANGES = { '1Y': 12, '2Y': 24, '3Y': 36, '5Y': 60, Max: 0 };
// diffusion indexes are shaded by distance from 50, as in the components heatmap (12 points = full colour);
// changes are shaded against the index's own month-to-month history
const lvTd = (v, c, html, cls) => heatTd(html, v == null ? null : (v - 50) / 12 * 2.5, INV.has(c) ? 'bad' : 'good', cls);
const chTd = (a, t, c, cls) => { const d = a.map((x, j) => j && x != null && a[j - 1] != null ? x - a[j - 1] : null);
  return heatTd(sgn(d[t]), heatZ(d[t], heatStat(d, AX, t)), INV.has(c) ? 'bad' : 'good', cls); };
const SLG = heatLegend('good', '數值欄位：顏色深淺＝離 50 多遠（差 12 點為滿色），綠＝對景氣有利的方向，赭紅＝不利（物價、客戶存貨反向）。變動欄位：與該指數平常的月變動相比。');

if (DK === 'ism') {
  const mH = iv('m', 'Manufacturing PMI'), sH = iv('s', 'Services PMI'), mC = IS('m:cons'), sC = IS('s:cons');
  const L_ = Math.max(lastIdx(mH), lastIdx(sH)), lm = AX[L_];
  document.getElementById('dt').textContent = ISM.meta.pub ? `Mfg ${fmtDate(ISM.meta.pub.m)} · Services ${fmtDate(ISM.meta.pub.s)}` : `Data through ${plab(lm)}`;
  document.getElementById('demo').textContent = `Demo：Economy in Brief 的版面與出版圖風格，加上互動。ISM 指數以 50 為擴張與收縮分界，各分項不能相加，所以用熱度圖取代堆疊圖。資料至 ${mzh(lm)}。`;
  document.getElementById('hd').textContent = `美國 ${+lm.slice(5)} 月 ISM 製造業 PMI ${f1(mH[L_])}，服務業 ${f1(sH[L_])}`;
  const surp = (a, c) => a[L_] != null && c[L_] != null ? `${a[L_] >= c[L_] ? '高於' : '低於'}市場預期的 ${f1(c[L_])}` : '';
  const comps = sec => COMP[sec].slice(1).map(c => [c, iv(sec, c)]).filter(([, a]) => a[L_] != null);
  const big = sec => comps(sec).map(([c, a]) => [c, a[L_] - a[L_ - 1]]).filter(x => !isNaN(x[1])).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 2);
  document.getElementById('sp1').innerHTML = `<p>${mzh(lm)} ISM 製造業 PMI 為 ${f1(mH[L_])}（前月 ${f1(mH[L_ - 1])}），${surp(mH, mC)}，連續${(() => { let k = 0; for (let t = L_; t >= 0 && mH[t] != null && (mH[t] > 50) === (mH[L_] > 50); t--) k++; return ` ${k} 個月${mH[L_] > 50 ? '擴張' : '收縮'}`; })()}。分項中變動最大的是${big('m').map(([c, d]) => `${ZH[c]}（${sgn(d)}）`).join('、')}；物價指數 ${f1(iv('m', 'Prices')[L_])}。</p>
<p>服務業 PMI 為 ${f1(sH[L_])}（前月 ${f1(sH[L_ - 1])}），${surp(sH, sC)}。分項中變動最大的是${big('s').map(([c, d]) => `${ZH[c]}（${sgn(d)}）`).join('、')}；就業指數 ${f1(iv('s', 'Employment')[L_])}，物價指數 ${f1(iv('s', 'Prices')[L_])}。新訂單減存貨（製造業）為 ${sgn(iv('m', 'New Orders')[L_] - iv('m', 'Inventories')[L_])}，常被視為未來生產的領先訊號。</p>`;

  // overview tables
  const ovRows = sec => {
    const cons = sec === 'm' ? mC : sC;
    let h = `<thead><tr class="grp"><th>ISM ${SECT[sec]}</th><th class="vl" colspan="3">Index</th><th class="vl" colspan="2">Average</th><th class="vl">vs. 50</th><th class="vl">Consensus</th><th class="vl">24 mo.</th></tr>
<tr><th></th><th class="vl">${mlab(lm)} '${lm.slice(2, 4)}</th><th>${mlab(AX[L_ - 1])}</th><th>Chg</th><th class="vl">3M</th><th>12M</th><th class="vl"></th><th class="vl"></th><th class="vl"></th></tr></thead><tbody>`;
    COMP[sec].forEach((c, j) => {
      const a = iv(sec, c), v = a[L_];
      h += `<tr><td style="padding-left:${j ? 23 : 9}px"><button type="button" class="nm" data-s="${sec}:${esc(c)}">${esc(c)}</button> <span class="note">${ZH[c] || ''}</span></td>${lvTd(v, c, `<b>${f1(v)}</b>`, 'vl')}${lvTd(a[L_ - 1], c, f1(a[L_ - 1]))}${chTd(a, L_, c)}` +
        `${lvTd(avgN(a, L_, 3), c, f1(avgN(a, L_, 3)), 'vl')}${lvTd(avgN(a, L_, 12), c, f1(avgN(a, L_, 12)))}<td class="vl" style="text-align:left;color:${tone(v, c)}">${state50(v, c)}</td>` +
        `<td class="vl">${j ? '' : `${f1(cons[L_])} <span class="note">(${sgn(v - cons[L_])})</span>`}</td><td class="vl" style="padding:2px 9px">${sparkline(a.slice(0, L_ + 1), 24, 50)}</td></tr>`;
    });
    return h + '</tbody>';
  };
  document.getElementById('sov').innerHTML = ovRows('m');
  document.getElementById('sov2').innerHTML = ovRows('s');
  document.getElementById('sov2w').hidden = false;
  document.getElementById('sLg').innerHTML = SLG;

  // heatmap of components
  let hsec = store.get('hsec') || 'm';
  const heat = () => {
    const n = 24, s0 = L_ - n + 1, cols = []; for (let t = s0; t <= L_; t++) cols.push(t);
    let h = `<thead><tr><th>${SECT[hsec]}</th>${cols.map(t => `<th class="hc">${AX[t].endsWith('-01') || t === s0 ? `${mlab(AX[t])}<br>'${AX[t].slice(2, 4)}` : mlab(AX[t])}</th>`).join('')}</tr></thead><tbody>`;
    for (const c of COMP[hsec]) {
      const a = iv(hsec, c);
      h += `<tr><td><button type="button" class="nm" data-s="${hsec}:${esc(c)}">${esc(c)}</button></td>` + cols.map(t => {
        const v = a[t]; if (v == null) return '<td class="hx"></td>';
        const d = Math.min(1, Math.abs(v - 50) / 12), good = (v > 50) !== INV.has(c);
        return `<td class="hx" style="background:color-mix(in srgb, var(${good ? '--c3' : '--c2'}) ${Math.round(d * 70)}%, var(--paper))" title="${esc(c)} · ${plab(AX[t])}: ${v.toFixed(1)}">${v.toFixed(0)}</td>`;
      }).join('') + '</tr>';
    }
    document.getElementById('sheat').innerHTML = h + '</tbody>';
    const hw = document.getElementById('sheat').parentNode; hw.scrollLeft = hw.scrollWidth;
    document.getElementById('shtb').innerHTML = `<span class="seg" role="group" aria-label="Survey">${['m', 's'].map(k => `<button type="button" data-h="${k}" aria-pressed="${k === hsec}">${SECT[k]}</button>`).join('')}</span><span class="note">綠＝對景氣有利的方向，紅＝不利（物價、客戶存貨反向）；顏色越深離 50 越遠。點分項名稱在下圖畫出。</span>`;
  };
  document.getElementById('shtb').addEventListener('click', ev => { const b = ev.target.closest('button[data-h]'); if (b) { hsec = b.dataset.h; store.set('hsec', hsec); heat(); } });
  heat();

  const CAT = [];
  for (const sec of ['m', 's']) for (const c of COMP[sec]) CAT.push({ k: `${sec}:${c}`, n: `ISM ${SECT[sec]}: ${c}`, v: iv(sec, c), grp: `ISM ${SECT[sec]}` });
  CAT.push({ k: 'm:cons', n: 'ISM Manufacturing PMI, consensus', v: mC, grp: 'Consensus' }, { k: 's:cons', n: 'ISM Services PMI, consensus', v: sC, grp: 'Consensus' });
  const spread = iv('m', 'New Orders').map((x, t) => x != null && iv('m', 'Inventories')[t] != null ? x - iv('m', 'Inventories')[t] : null);
  CAT.push({ k: 'no-inv', n: 'ISM Mfg: New Orders less Inventories', v: spread, grp: 'Derived' });
  for (const s of ['mfg', 'svc', 'cmp']) CAT.push({ k: `sp:${s}`, n: `S&P Global ${{ mfg: 'Manufacturing', svc: 'Services', cmp: 'Composite' }[s]} PMI`, v: SP(`${s}:final`), grp: 'S&P Global' });
  const CT = CAT.map(c => ({ ...c, v: c.v.slice(0, L_ + 1) })), AXL = AX.slice(0, L_ + 1);
  const opt = (def, W = 460, H = 330) => ({ months: AXL, cat: CT, ranges: RANGES, fmt: v => v.toFixed(1), src: K.src, W, H, def });
  seriesChart('sch5', opt({ title: 'ISM Manufacturing: New Orders', sub: 'Diffusion Index, SA, 50+ = Expansion', r: '5Y', ref: 50, ids: [{ k: 'm:New Orders' }] }, 900, 360));
  document.getElementById('survey').addEventListener('click', ev => { const b = ev.target.closest('button[data-s]'); if (!b) return; SC.sch5.set([{ k: b.dataset.s, ax: 'L' }]); document.getElementById('sch5').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); });
  seriesChart('sch1', opt({ title: 'ISM Purchasing Managers Indexes', sub: 'Diffusion Index, SA, 50+ = Expansion', r: 'Max', ref: 50, ids: [{ k: 'm:Manufacturing PMI' }, { k: 's:Services PMI' }] }));
  seriesChart('sch2', opt({ title: 'ISM Mfg: New Orders less Inventories', sub: 'Index Points', r: 'Max', ref: 0, ids: [{ k: 'no-inv' }] }));
  seriesChart('sch3', opt({ title: 'ISM Prices Paid', sub: 'Diffusion Index, NSA, 50+ = Rising', r: 'Max', ref: 50, ids: [{ k: 'm:Prices' }, { k: 's:Prices' }] }));
  seriesChart('sch4', opt({ title: 'ISM Employment', sub: 'Diffusion Index, SA, 50+ = Expansion', r: 'Max', ref: 50, ids: [{ k: 'm:Employment' }, { k: 's:Employment' }] }));
  document.getElementById('snote').textContent = 'ISM 資料取自 PR Newswire 上的月報；製造業分項自 2020 年 12 月起、服務業分項自 2023 年 10 月起（2023 年 12 月至 2024 年 9 月缺）。市場預期取自 investing.com。指數以 50 為分界，分項彼此不能相加。';
} else {
  // S&P Global flash and final PMIs
  const SEC = [['cmp', 'Composite', '綜合'], ['mfg', 'Manufacturing', '製造業'], ['svc', 'Services', '服務業']];
  const fl = s => SP(`${s}:flash`), fi = s => SP(`${s}:final`), flc = s => SP(`${s}:flashFc`);
  const Lf = Math.max(...SEC.map(([s]) => lastIdx(fl(s)))), Lz = Math.max(...SEC.map(([s]) => lastIdx(fi(s)))), lm = AX[Lf];
  document.getElementById('dt').textContent = `Flash ${plab(AX[Lf])} · Final ${plab(AX[Lz])}`;
  document.getElementById('demo').textContent = `Demo：Economy in Brief 的版面與出版圖風格，加上互動。S&P Global PMI 每月先公布初值（flash），約一週後公布終值；以 50 為擴張與收縮分界。`;
  document.getElementById('hd').textContent = `美國 ${+lm.slice(5)} 月 S&P Global 綜合 PMI 初值 ${f1(fl('cmp')[Lf])}，製造業 ${f1(fl('mfg')[Lf])}，服務業 ${f1(fl('svc')[Lf])}`;
  let h = `<thead><tr class="grp"><th>S&P Global US PMI</th><th class="vl" colspan="3">Flash</th><th class="vl" colspan="2">Final</th><th class="vl">vs. 50</th><th class="vl">ISM</th><th class="vl">24 mo.</th></tr>
<tr><th></th><th class="vl">${mlab(AX[Lf])} '${AX[Lf].slice(2, 4)}</th><th>Consensus</th><th>Surprise</th><th class="vl">${mlab(AX[Lz])}</th><th>${mlab(AX[Lz - 1])}</th><th class="vl"></th><th class="vl">${mlab(AX[Lz])}</th><th class="vl"></th></tr></thead><tbody>`;
  const ism = { mfg: IS('m:Manufacturing PMI'), svc: IS('s:Services PMI'), cmp: null };
  for (const [s, n, zh] of SEC) {
    const v = fl(s)[Lf], c = flc(s)[Lf];
    const sp = v != null && c != null ? v - c : null;
    h += `<tr><td><button type="button" class="nm" data-s="sp:${s}">${n}</button> <span class="note">${zh}</span></td>${lvTd(v, n, `<b>${f1(v)}</b>`, 'vl')}${lvTd(c, n, f1(c))}${heatTd(sp == null ? '' : sgn(sp), sp == null ? null : sp / 2 * 2.5, 'good')}${lvTd(fi(s)[Lz], n, f1(fi(s)[Lz]), 'vl')}${lvTd(fi(s)[Lz - 1], n, f1(fi(s)[Lz - 1]))}` +
      `<td class="vl" style="text-align:left;color:${tone(v, n)}">${state50(v, n)}</td>${ism[s] ? lvTd(ism[s][Lz], n, f1(ism[s][Lz]), 'vl') : '<td class="vl"></td>'}<td class="vl" style="padding:2px 9px">${sparkline(fi(s).slice(0, Lz + 1), 24, 50)}</td></tr>`;
  }
  document.getElementById('sov').innerHTML = h + '</tbody>';
  document.getElementById('sLg').innerHTML = SLG.replace('變動欄位：與該指數平常的月變動相比。', '預期差（Surprise）：綠＝優於預期，差 2 點為滿色。');
  document.getElementById('sheatSec').hidden = true;
  const gap = s => fl(s)[Lf] - fi(s)[Lz];
  document.getElementById('sp1').innerHTML = `<p>${mzh(lm)} S&P Global 美國綜合 PMI 初值為 ${f1(fl('cmp')[Lf])}，前月終值 ${f1(fi('cmp')[Lz])}（${sgn(gap('cmp'))}）。製造業初值 ${f1(fl('mfg')[Lf])}，${fl('mfg')[Lf] >= flc('mfg')[Lf] ? '高於' : '低於'}預期的 ${f1(flc('mfg')[Lf])}；服務業初值 ${f1(fl('svc')[Lf])}，${fl('svc')[Lf] >= flc('svc')[Lf] ? '高於' : '低於'}預期的 ${f1(flc('svc')[Lf])}。</p>
<p>與 ISM 比較：${mzh(AX[Lz])} ISM 製造業 ${f1(ism.mfg[Lz])}、S&P 製造業 ${f1(fi('mfg')[Lz])}；ISM 服務業 ${f1(ism.svc[Lz])}、S&P 服務業 ${f1(fi('svc')[Lz])}。兩者樣本與問法不同，方向一致時訊號較可靠。</p>`;
  const CAT = [];
  for (const [s, n] of SEC) CAT.push({ k: `sp:${s}`, n: `S&P ${n} PMI, final`, v: fi(s), grp: 'S&P Global, final' }, { k: `spf:${s}`, n: `S&P ${n} PMI, flash`, v: fl(s), grp: 'S&P Global, flash' }, { k: `spc:${s}`, n: `S&P ${n} PMI, flash consensus`, v: flc(s), grp: 'Consensus' });
  CAT.push({ k: 'm:Manufacturing PMI', n: 'ISM Manufacturing PMI', v: ism.mfg, grp: 'ISM' }, { k: 's:Services PMI', n: 'ISM Services PMI', v: ism.svc, grp: 'ISM' });
  const CT = CAT.map(c => ({ ...c, v: c.v.slice(0, Lf + 1) })), AXL = AX.slice(0, Lf + 1);
  const opt = (def, W = 460, H = 330) => ({ months: AXL, cat: CT, ranges: RANGES, fmt: v => v.toFixed(1), src: K.src, W, H, def });
  seriesChart('sch5', opt({ title: 'S&P Global US Composite PMI', sub: 'Diffusion Index, SA, 50+ = Expansion', r: '3Y', ref: 50, ids: [{ k: 'sp:cmp' }, { k: 'spf:cmp' }] }, 900, 360));
  document.getElementById('survey').addEventListener('click', ev => { const b = ev.target.closest('button[data-s]'); if (!b) return; SC.sch5.set([{ k: b.dataset.s, ax: 'L' }, { k: b.dataset.s.replace('sp:', 'spf:'), ax: 'L' }]); document.getElementById('sch5').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); });
  seriesChart('sch1', opt({ title: 'Manufacturing: S&P Global vs. ISM', sub: 'Diffusion Index, SA, 50+ = Expansion', r: 'Max', ref: 50, ids: [{ k: 'sp:mfg' }, { k: 'm:Manufacturing PMI' }] }));
  seriesChart('sch2', opt({ title: 'Services: S&P Global vs. ISM', sub: 'Diffusion Index, SA, 50+ = Expansion', r: 'Max', ref: 50, ids: [{ k: 'sp:svc' }, { k: 's:Services PMI' }] }));
  seriesChart('sch3', opt({ title: 'S&P Global Manufacturing PMI', sub: 'Flash vs. Consensus', r: '3Y', ref: 50, ids: [{ k: 'spf:mfg' }, { k: 'spc:mfg' }] }));
  seriesChart('sch4', opt({ title: 'S&P Global Services PMI', sub: 'Flash vs. Consensus', r: '3Y', ref: 50, ids: [{ k: 'spf:svc' }, { k: 'spc:svc' }] }));
  document.getElementById('snote').textContent = 'S&P Global PMI 取自 investing.com 公開頁面；製造業與綜合指數自 2025 年 2 月起、服務業自 2022 年 9 月起。初值約在月底前一週公布，終值在次月第一個工作日（製造業）與第三個工作日（服務業、綜合）。';
}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { for (const k in SC) SC[k].draw(); });
