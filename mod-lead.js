/* Leading and companion indicators (data-lead.js), drawn below each page's own analysis */
(function () {
  const LD = window.LEAD_DATA, host = document.getElementById('lead');
  if (!LD || !host) return;
  const LM = LD.months, LQ = LD.quarters, m = LD.m, q = LD.q;

  // ---------- series helpers ----------
  const yoy = (a, k) => a.map((v, t) => t >= k && v != null && a[t - k] ? (v / a[t - k] - 1) * 100 : null);
  const mom = a => a.map((v, t) => t && v != null && a[t - 1] ? (v / a[t - 1] - 1) * 100 : null);
  const ma = (a, k) => a.map((v, t) => { if (t < k - 1) return null; let s = 0; for (let j = t - k + 1; j <= t; j++) { if (a[j] == null) return null; s += a[j]; } return s / k; });
  const minus = (a, b) => a.map((v, t) => v == null || b[t] == null ? null : v - b[t]);
  const lastI = a => { for (let t = a.length - 1; t >= 0; t--) if (a[t] != null) return t; return -1; };
  const at = (a, t) => t >= 0 && t < a.length ? a[t] : null;
  // monthly series averaged into the quarterly axis (only full quarters)
  const toQ = a => LQ.map(s => { const y = s.slice(0, 4), n = +s.slice(-1), v = [1, 2, 3].map(j => a[LM.indexOf(`${y}-${String((n - 1) * 3 + j).padStart(2, '0')}`)]); return v.every(x => x != null) ? (v[0] + v[1] + v[2]) / 3 : null; });
  // an axis extended k periods past its end, so a leading series can be drawn k periods later
  function extend(axis, k) {
    const out = axis.slice();
    for (let j = 0; j < k; j++) {
      const s = out[out.length - 1];
      if (/Q\d$/.test(s)) { const y = +s.slice(0, 4), n = +s.slice(-1); out.push(n === 4 ? `${y + 1}-Q1` : `${y}-Q${n + 1}`); }
      else { const y = +s.slice(0, 4), n = +s.slice(5); out.push(n === 12 ? `${y + 1}-01` : `${y}-${String(n + 1).padStart(2, '0')}`); }
    }
    return out;
  }
  const later = (a, k) => [...Array(k).fill(null), ...a];
  const pad = (a, k) => [...a, ...Array(k).fill(null)];
  const pLab = s => /Q\d$/.test(s) ? `${s.slice(0, 4)} 年第 ${s.slice(-1)} 季` : mzh(s);

  // ---------- page pieces ----------
  let html = '', draws = [];
  const section = (title, how, ids, lede) => {
    html += `<h2 class="sec">${title}</h2><p class="how">${how}</p>` + (lede ? `<p class="lede">${lede}</p>` : '') +
      (ids.length ? `<div class="charts">${ids.map(i => `<div class="hv" id="${i}"></div>`).join('')}</div>` : '');
  };
  // o: { id, axis, k (periods the extended axis runs past the data), from, title, sub, src, series, ref }
  const chart = o => draws.push(() => {
    const el = document.getElementById(o.id), axis = o.k ? extend(o.axis, o.k) : o.axis;
    const series = o.series.map(s => ({ ...s, v: s.v.length < axis.length ? pad(s.v, axis.length - s.v.length) : s.v, axis: s.axis || 'L' }));
    hv(el, { W: 460, H: 330, months: axis, start: Math.max(0, axis.indexOf(o.from)), title: o.title, sub: o.sub, src: o.src, series, ref: o.ref, unit: o.unit });
  });

  // Cleveland Fed nowcast table: the months not yet published, plus the latest published one for comparison
  function nowcast(kind) {
    const nc = LD.nowcast; if (!nc || !nc.length) return;
    const [hk, ck] = kind === 'cpi' ? ['cpi', 'core_cpi'] : ['pce', 'core_pce'], up = kind.toUpperCase();
    const rows = nc.filter((r, j) => r.act[hk] == null || j === nc.findLastIndex(x => x.act[hk] != null)).slice(-3);
    const f2 = v => v == null ? 'n.a.' : v.toFixed(2);
    section('Nowcast', `克里夫蘭聯準銀行每天根據油價、汽油價格與前期通膨，估算尚未公布月份的 ${up} 與核心 ${up}。已公布的月份列出實際值，可對照模型的誤差。`, []);
    html += `<div class="tblw"><table><thead><tr><th>月份</th><th>${up} 月增</th><th>核心 月增</th><th>${up} 年增</th><th>核心 年增</th><th>狀態</th></tr></thead><tbody>` +
      rows.map(r => `<tr><td>${mzh(r.m)}</td><td>${f2(r.mm[hk])}</td><td>${f2(r.mm[ck])}</td><td>${f2(r.yy[hk])}</td><td>${f2(r.yy[ck])}</td><td>${r.act[hk] == null ? `預測（${r.asof}）` : `已公布：實際月增 ${f2(r.act[hk])}／核心 ${f2(r.act[ck])}`}</td></tr>`).join('') +
      `</tbody></table></div><p class="note">資料來源：克里夫蘭聯準銀行 Inflation Nowcasting；單位為百分比。</p>`;
  }

  // ---------- pages ----------
  const MF = '2016-01', QF = '2016-Q1';
  if (DK === 'cpi') {
    nowcast('cpi');
    const rent = yoy(m.CPI_RENT, 12), oer = yoy(m.CPI_OER, 12), zr = yoy(m.ZORI, 12), zl = lastI(zr), rl = lastI(rent);
    const cg = yoy(m.CPI_CG, 12), ix = yoy(m.IMPXF, 12), il = lastI(ix);
    // least squares of CPI rent growth on ZORI growth 12 months earlier: the rent pace today's ZORI implies a year ahead
    const fit = y => { const p = []; for (let t = 12; t < y.length; t++) if (y[t] != null && zr[t - 12] != null) p.push([zr[t - 12], y[t]]);
      const n = p.length, mx = p.reduce((s, x) => s + x[0], 0) / n, my = p.reduce((s, x) => s + x[1], 0) / n;
      const b = p.reduce((s, x) => s + (x[0] - mx) * (x[1] - my), 0) / p.reduce((s, x) => s + (x[0] - mx) ** 2, 0); return v => my + b * (v - mx); };
    const ahead = extend(LM, 12)[zl + 12];
    section('Leading indicators',
      'CPI 房租與自有住房等值租金（OER）對所有租約抽樣，舊租約要到續約才反映新價格，所以落後市場租金。Zillow 觀測租金指數（ZORI）量的是市場上新掛牌的租金；Zillow Research 指出 ZORI 領先 CPI 房租最多 12 個月，用 2016 年以來的資料驗證，ZORI 年增在落後 12 個月時與 CPI 房租年增的相關性最高（0.90），與 OER 為 12–14 個月（約 0.83）。圖中虛線把 ZORI 往後移 12 個月畫。進口物價（不含燃料）則大約領先核心商品 CPI 2–3 個月。',
      ['ld1', 'ld2'],
      `ZORI ${mzh(LM[zl])}年增 <b>${f1(zr[zl])}%</b>，對應 12 個月後（${mzh(ahead)}）；CPI 房租 ${mzh(LM[rl])}年增 ${f1(rent[rl])}%，OER ${f1(oer[rl])}%。以 CPI 房租年增對 12 個月前 ZORI 年增的簡單迴歸推算，${mzh(ahead)} CPI 房租年增約 <b>${f1(fit(rent)(zr[zl]))}%</b>、OER 約 <b>${f1(fit(oer)(zr[zl]))}%</b>（只用 ZORI 一個變數，僅供參考）。進口物價（不含燃料）${mzh(LM[il])}年增 ${f1(ix[il])}%，核心商品 CPI 年增 ${f1(cg[lastI(cg)])}%。`);
    chart({ id: 'ld1', axis: LM, k: 12, from: '2016-01', title: 'Rent: Zillow Asking Rents Lead CPI Rent', sub: '% change, year over year', src: 'Zillow Research (ZORI, SA); BLS (CPI)',
      series: [{ name: 'Zillow observed rent index, 12M later', v: later(zr, 12), c: '--c2', dash: 1 }, { name: 'CPI: Rent of primary residence', v: rent, c: '--c1' }, { name: "CPI: Owners' equivalent rent", v: oer, c: '--c3' }] });
    chart({ id: 'ld2', axis: LM, k: 3, from: MF, title: 'Import Prices Lead Core Goods', sub: '% change, year over year', src: 'BLS (import prices; CPI)',
      series: [{ name: 'Import prices ex fuels, 3M later (NSA)', v: later(ix, 3), c: '--c2', dash: 1 }, { name: 'CPI: Core goods', v: cg, c: '--c1' }] });
    html += `<p class="note">ZORI 資料來源：Zillow Research（zillow.com/research/data），全美、所有房型含多戶住宅、季調後的平滑序列；ZORI 為民間資料，其餘為官方資料。</p>`;
  }
  if (DK === 'pce') {
    nowcast('pce');
    const MM = k => mom(m[k]), YY = k => yoy(m[k], 12), L_ = lastI(m.PI), rows = [['Personal income', 'PI', '個人所得'], ['Disposable personal income', 'DPI', '可支配所得'], ['Real disposable income', 'RDPI', '實質可支配所得'],
      ['Real PCE', 'RPCE', '實質消費'], ['Wages and salaries', 'WAGE', '薪資所得'], ['Transfer receipts', 'TRAN', '移轉收入'], ['Income on assets', 'ASSET', '資產所得']];
    const ry = YY('RDPI'), cy = YY('RPCE');
    section('Income and saving',
      '個人所得、可支配所得與儲蓄率出自 BEA 跟 PCE 同一份報告（Personal Income and Outlays），同一天公布。消費成長若長期高於所得成長，代表家庭在動用儲蓄或借錢。儲蓄率每年的年度修正常改動很多，看方向，不看水準。圖從 2022–2023 年畫起，避開疫情紓困金造成的劇烈波動。',
      [], `${mzh(LM[L_])}實質可支配所得年增 <b>${f1(ry[L_])}%</b>，實質消費年增 <b>${f1(cy[L_])}%</b>；儲蓄率 <b>${f1(m.SAV[L_])}%</b>（一年前 ${f1(m.SAV[L_ - 12])}%）。`);
    const cols = [5, 4, 3, 2, 1, 0].map(j => L_ - j);
    const td = (a, t, st, tone) => heatTd(f1(a[t]), heatZ(a[t], st), tone);
    html += `<div class="tblw"><table><thead><tr><th>% 月增（儲蓄率為水準）</th>${cols.map(t => `<th>${mlab(LM[t])} ${LM[t].slice(2, 4)}</th>`).join('')}<th class="vl">年增</th></tr></thead><tbody>` +
      rows.map(([n, k, zh]) => { const a = MM(k), y = YY(k), sa = heatStat(a, LM, L_), sy = heatStat(y, LM, L_);
        return `<tr><td title="${n}">${zh}</td>${cols.map(t => td(a, t, sa, 'good')).join('')}${heatTd(f1(y[L_]), heatZ(y[L_], sy), 'good', 'vl')}</tr>`; }).join('') +
      (() => { const s = m.SAV, st = heatStat(s, LM, L_); return `<tr><td>儲蓄率（% 可支配所得）</td>${cols.map(t => td(s, t, st, 'good')).join('')}<td class="vl"></td></tr>`; })() +
      `</tbody></table></div><p class="hlg">${heatLegend('good')}</p><div class="charts"><div class="hv" id="ld1"></div><div class="hv" id="ld2"></div><div class="hv" id="ld3"></div><div class="hv" id="ld4"></div></div>`;
    chart({ id: 'ld1', axis: LM, from: '2023-01', title: 'Real Disposable Income vs. Real Spending', sub: '% change, year over year', src: 'BEA', series: [{ name: 'Real disposable personal income', v: ry, c: '--c1' }, { name: 'Real PCE', v: cy, c: '--c2' }] });
    chart({ id: 'ld2', axis: LM, from: '2022-01', title: 'Personal Saving Rate', sub: '% of disposable personal income', src: 'BEA', series: [{ name: 'Saving rate', v: m.SAV, c: '--c1' }] });
    chart({ id: 'ld3', axis: LM, from: '2023-01', title: 'Sources of Personal Income', sub: '% change, year over year', src: 'BEA',
      series: [{ name: 'Compensation of employees', v: YY('COMP'), c: '--c1' }, { name: 'Transfer receipts', v: YY('TRAN'), c: '--c2' }, { name: 'Income on assets', v: YY('ASSET'), c: '--c3' }, { name: "Proprietors' income", v: YY('PROP'), c: '--c4' }] });
    chart({ id: 'ld4', axis: LM, from: '2023-01', title: 'Payroll Income: BLS Early Read vs. BEA', sub: '% change, year over year', src: 'BLS (CES); BEA',
      series: [{ name: 'Aggregate weekly payrolls (BLS)', v: yoy(m.AWP, 12), c: '--c2' }, { name: 'Wages and salaries (BEA)', v: YY('WAGE'), c: '--c1' }] });
    html += `<p class="note">房租的領先指標（Zillow ZORI）見 CPI 頁：PCE 的房租數字直接取自 CPI。資料來源：BEA 個人所得與支出；總週薪資指數來自 BLS 就業報告，比 BEA 早約三週公布。</p>`;
  }
  if (DK === 'ppi') {
    const pg = yoy(m.PPI_G, 12), ip = m.ISM_P, il = lastI(ip), gl = lastI(pg);
    section('Leading indicators',
      'ISM 製造業物價分項是採購經理回覆「付出的價格上升」的比例，2018 年以來大約領先 PPI 最終需求商品年增 6–7 個月（相關係數約 0.87），圖中虛線往後移 6 個月畫。進口物價反映海外供給與美元，跟 PPI 商品大致同步。',
      ['ld1', 'ld2'], `ISM 物價分項 ${mzh(LM[il])}為 <b>${f1(ip[il])}</b>，對應 6 個月後；PPI 最終需求商品 ${mzh(LM[gl])}年增 ${f1(pg[gl])}%。`);
    chart({ id: 'ld1', axis: LM, k: 6, from: '2018-07', title: 'ISM Prices Paid Leads PPI Goods', sub: 'ISM index (L); PPI % change, year over year (R)', src: 'ISM; BLS',
      series: [{ name: 'ISM manufacturing prices, 6M later', v: later(ip, 6), c: '--c2', dash: 1 }, { name: 'PPI: Final demand goods', v: pg, c: '--c1', axis: 'R' }] });
    chart({ id: 'ld2', axis: LM, from: MF, title: 'Import Prices vs. PPI Goods', sub: '% change, year over year', src: 'BLS',
      series: [{ name: 'Import prices, all (NSA)', v: yoy(m.IMP, 12), c: '--c2' }, { name: 'Import prices ex fuels (NSA)', v: yoy(m.IMPXF, 12), c: '--c3' }, { name: 'PPI: Final demand goods', v: pg, c: '--c1' }] });
  }
  if (DK === 'nfp') {
    const ahe = yoy(m.AHE, 12), real = minus(ahe, yoy(m.CPI, 12)), wgt = m.WGT, L_ = lastI(ahe), wl = lastI(wgt);
    const eci = yoy(q.ECI, 4), ulc = yoy(q.ULC, 4), prd = yoy(q.PROD, 4), el = lastI(eci), ul = lastI(ulc), ql = lastI(m.QUR);
    section('Wages',
      '平均時薪最快（每月），但有組成效果：低薪工作大量減少時，平均數會「看起來」上升。雇用成本指數（ECI）固定職業組成，是聯準會最重視的工資指標；亞特蘭大聯準銀行工資追蹤看同一批人的工資變化。單位勞動成本＝工資扣掉生產力，才是真正的通膨壓力。實質時薪＝時薪年增減 CPI 年增。',
      ['ld1', 'ld2'], `${mzh(LM[L_])}平均時薪年增 <b>${f1(ahe[L_])}%</b>，扣除 CPI 後實質 ${f1(real[L_])}%；亞特蘭大 Fed 工資追蹤 ${mzh(LM[wl])} ${f1(wgt[wl])}%。ECI 民間工資 ${pLab(LQ[el])}年增 <b>${f1(eci[el])}%</b>；單位勞動成本 ${pLab(LQ[ul])}年增 ${f1(ulc[ul])}%，生產力 ${f1(prd[ul])}%。`);
    chart({ id: 'ld1', axis: LM, from: MF, title: 'Wage Growth: Three Measures', sub: '% change, year over year', src: 'BLS; Atlanta Fed Wage Growth Tracker', ref: 0,
      series: [{ name: 'Average hourly earnings', v: ahe, c: '--c1' }, { name: 'Atlanta Fed wage tracker (3MMA)', v: wgt, c: '--c3' }, { name: 'Real AHE (less CPI)', v: real, c: '--c2', dash: 1 }] });
    chart({ id: 'ld2', axis: LQ, from: QF, title: 'ECI, Unit Labor Costs and Productivity', sub: '% change, 4 quarters', src: 'BLS (ECI; productivity and costs)',
      series: [{ name: 'ECI: private wages and salaries', v: eci, c: '--c1' }, { name: 'Unit labor costs, nonfarm business', v: ulc, c: '--c2' }, { name: 'Productivity, nonfarm business', v: prd, c: '--c3' }] });
    const tp = yoy(m.TEMP, 12), np = yoy(m.NFP, 12), tl = lastI(tp);
    section('Leading indicators',
      'JOLTS 離職率（自願離職）代表勞工對找到新工作的信心，2014 年以來大約領先工資成長 10 個月（相關係數 0.85），圖中虛線往後移 10 個月畫。臨時工就業與每週工時跟非農大致同步，但企業通常先砍臨時工、縮工時，再裁正職，轉折點常較早出現。',
      ['ld3', 'ld4'], `${mzh(LM[ql])}離職率 <b>${f1(m.QUR[ql])}%</b>，職缺率 ${f1(m.JOR[ql])}%；臨時工就業 ${mzh(LM[tl])}年增 ${f1(tp[tl])}%（非農 ${f1(np[tl])}%），民間每週工時 ${f1(m.HRS[tl])} 小時（一年前 ${f1(m.HRS[tl - 12])}）。`);
    chart({ id: 'ld3', axis: LM, k: 10, from: MF, title: 'Quits Rate Leads Wage Growth', sub: 'Quits, % of employment (L); wages, % y/y (R)', src: 'BLS (JOLTS); Atlanta Fed',
      series: [{ name: 'JOLTS quits rate, 10M later', v: later(m.QUR, 10), c: '--c2', dash: 1 }, { name: 'Atlanta Fed wage tracker', v: wgt, c: '--c1', axis: 'R' }] });
    chart({ id: 'ld4', axis: LM, from: '2022-07', title: 'Temporary Help and Hours', sub: 'Employment % y/y (L); weekly hours (R)', src: 'BLS (CES)',
      series: [{ name: 'Temporary help services', v: tp, c: '--c2' }, { name: 'Total nonfarm', v: np, c: '--c1' }, { name: 'Average weekly hours, private', v: m.HRS, c: '--c3', axis: 'R' }] });
  }
  if (DK === 'retail') {
    const aw = yoy(m.AWP, 12), pc = yoy(m.PCE, 12), L_ = lastI(aw);
    section('Leading indicators',
      '總週薪資指數＝民間就業人數 × 每週工時 × 時薪，代表家庭的工資收入總額，跟名目消費同步（相關係數 0.89）。它在就業報告當天就公布，比 BEA 的所得與消費資料早約三週，可以先看消費動能。',
      ['ld1'], `${mzh(LM[L_])}總週薪資年增 <b>${f1(aw[L_])}%</b>，名目 PCE 年增 ${f1(pc[lastI(pc)])}%。`);
    chart({ id: 'ld1', axis: LM, from: MF, title: 'Payroll Income vs. Consumer Spending', sub: '% change, year over year', src: 'BLS (CES); BEA',
      series: [{ name: 'Aggregate weekly payrolls, private', v: aw, c: '--c2' }, { name: 'Nominal PCE', v: pc, c: '--c1' }] });
  }
  if (DK === 'gdp') {
    const co = ma(yoy(m.CAPEX, 12), 3), cs = ma(yoy(m.CAPSHIP, 12), 3), cl = lastI(co), pl = lastI(m.PERMIT);
    section('Leading indicators',
      '核心資本財訂單（不含國防與飛機）是企業設備投資的領先指標：訂單先下、出貨隨後，出貨直接進入 GDP 的設備投資。建築許可領先新屋開工，開工再領先住宅投資約 1–2 季。',
      ['ld1', 'ld2'], `核心資本財訂單 ${mzh(LM[cl])}年增 <b>${f1(co[cl])}%</b>（3 個月平均），出貨 ${f1(cs[cl])}%。建築許可 ${mzh(LM[pl])}為年率 <b>${Math.round(m.PERMIT[pl]).toLocaleString('en-US')}</b> 千戶，開工 ${Math.round(m.START[pl]).toLocaleString('en-US')} 千戶。`);
    chart({ id: 'ld1', axis: LM, from: MF, title: 'Core Capital Goods: Orders and Shipments', sub: '% change, year over year, 3-month average', src: 'Census Bureau (M3)', ref: 0,
      series: [{ name: 'Orders, nondefense ex aircraft', v: co, c: '--c2' }, { name: 'Shipments, nondefense ex aircraft', v: cs, c: '--c1' }] });
    chart({ id: 'ld2', axis: LM, from: MF, title: 'Building Permits and Housing Starts', sub: 'Thousands of units, SAAR', src: 'Census Bureau (new residential construction)', unit: '',
      series: [{ name: 'Permits, total', v: m.PERMIT, c: '--c2' }, { name: 'Starts, total', v: m.START, c: '--c1' }, { name: 'Permits, single-family', v: m.PERMIT1, c: '--c3', dash: 1 }] });
  }
  if (DK === 'ism') {
    const ni = minus(m.ISM_NO, m.ISM_INV), pm = m.ISM_PMI, nl = lastI(ni);
    section('Leading indicators',
      '新訂單減存貨：訂單多於存貨時，廠商得增加生產，所以這個差距通常領先 PMI 本身。2018 年以來大約領先 4–6 個月（相關係數約 0.8），圖中虛線往後移 6 個月畫。',
      ['ld1'], `${mzh(LM[nl])}新訂單 ${f1(m.ISM_NO[nl])}、存貨 ${f1(m.ISM_INV[nl])}，差距 <b>${sg(ni[nl])}</b>；PMI ${f1(pm[nl])}。`);
    chart({ id: 'ld1', axis: LM, k: 6, from: '2018-07', title: 'ISM New Orders less Inventories Leads the PMI', sub: 'Difference, points (L); PMI index (R)', src: 'ISM',
      series: [{ name: 'New orders less inventories, 6M later', v: later(ni, 6), c: '--c2', dash: 1 }, { name: 'Manufacturing PMI', v: pm, c: '--c1', axis: 'R' }] });
  }
  if (DK === 'overview') {
    const sp = minus(m.T10Y, m.T3M), L_ = lastI(sp);
    section('Yield curve',
      '10 年期減 3 個月期公債殖利率。曲線倒掛（低於 0）在過去幾次美國衰退前都出現過，通常領先 12–18 個月，但 2022–2024 年的長時間倒掛並未伴隨衰退，所以只當成風險訊號。月資料為每日殖利率的月平均，當月為月初至今。',
      ['ld1', 'ld2'], `${mzh(LM[L_])}（月初至今）10 年期 ${f1(m.T10Y[L_])}%、3 個月期 ${f1(m.T3M[L_])}%，利差 <b>${sg(sp[L_])}</b> 個百分點。`);
    chart({ id: 'ld1', axis: LM, from: MF, title: 'Yield Curve: 10-Year less 3-Month', sub: 'Percentage points, monthly average', src: 'U.S. Treasury', ref: 0, series: [{ name: '10Y less 3M', v: sp, c: '--c1' }] });
    chart({ id: 'ld2', axis: LM, from: MF, title: 'Treasury Yields', sub: '%, monthly average', src: 'U.S. Treasury', series: [{ name: '10-year', v: m.T10Y, c: '--c1' }, { name: '3-month', v: m.T3M, c: '--c2' }] });
  }
  if (!html) return;
  host.innerHTML = html;
  draws.forEach(f => f());
})();
