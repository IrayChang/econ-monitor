mount('tpl-ov');
(function () {
const DS = window.ALL_DATA, DSK = 'overview', M = [];
document.getElementById('demo').textContent = '總覽：19 個指標的趨勢與行事曆。點表格列或小圖可進入各資料的 brief 頁。';
document.getElementById('ovdt').textContent = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).replace(',', '');
const SEM = {bad:'230,103,103', good:'25,158,112', cool:'57,135,229'};
function semHeat(v,cap,kind,amax){ if(v==null) return 'transparent'; const x=Math.max(-1,Math.min(1,v/cap)), a=(Math.abs(x)*(amax||0.5)).toFixed(3);
  const c = kind==='price' ? (x>=0?SEM.bad:SEM.cool) : kind==='inverse' ? (x>=0?SEM.bad:SEM.good) : (x>=0?SEM.good:SEM.bad);
  return `rgba(${c},${a})`; }
/* Oct 2025 shutdown: BLS skipped the month, and 3M/6M/YoY measures that look back over it stay blank into early 2026 */
const isShut = (m0,m1) => m0<='2026-03' && m1>='2025-10';
/* runs of the x axis where no plotted series has data: interior gaps always; edge gaps only when the shutdown explains them
   (other edge gaps are just the start of history). mOf maps an x value to 'YYYY-MM' (defaults to the app's month axis M). */
function gapRuns(T,has,mOf){ mOf=mOf||(t=>M[t]); const out=[]; let i=0;
  while(i<T.length){ if(has(T[i])){ i++; continue; } let j=i; while(j+1<T.length&&!has(T[j+1])) j++;
    const edge=i===0||j===T.length-1, all=edge&&i===0&&j===T.length-1; if(!all&&(!edge||isShut(mOf(T[i]),mOf(T[j])))) out.push([i,j]); i=j+1; }
  return out; }
function gapSvg(runs,T,X,top,bot,mOf,pts){ if(!runs.length||T.length<2) return ''; const half=(X(1)-X(0))/2;   // pts: line chart (x at the first/last point is the plot edge)
  return runs.map(([i,j])=>{ const x0=pts?Math.max(X(0),X(i)-half):X(i)-half, x1=pts?Math.min(X(T.length-1),X(j)+half):X(j)+half, w=x1-x0, shut=isShut(mOf(T[i]),mOf(T[j]));
    const lab = shut ? (w>=52?'停擺缺值':'停擺') : (w>=40?'無資料':'');
    return `<g class="gap" pointer-events="none"><rect x="${x0.toFixed(1)}" y="${top}" width="${w.toFixed(1)}" height="${(bot-top).toFixed(1)}" class="gapr"/>${lab?`<text x="${(x0+w/2).toFixed(1)}" y="${top+11}" text-anchor="middle" class="axis gapt">${lab}</text>`:''}</g>`; }).join(''); }
/* robust axis domain: values beyond the IQR fences are clipped to the edge so one outlier can't flatten the rest */
function clipDom(vals,k){ const v=vals.filter(x=>x!=null).slice().sort((a,b)=>a-b); if(v.length<5) return [Math.min(0,...v),Math.max(0,...v)];
  const q=p=>{ const i=(v.length-1)*p, f=Math.floor(i); return v[f]+(v[Math.min(f+1,v.length-1)]-v[f])*(i-f); }, q1=q(.25), q3=q(.75), iqr=Math.max(q3-q1,1e-6), lo=q1-(k||2)*iqr, hi=q3+(k||2)*iqr;
  const inn=v.filter(x=>x>=lo&&x<=hi); return [Math.min(0,...inn),Math.max(0,...inn)]; }
/* ---------- UI kit for the ISM / S&P PMI / GDP apps (namespaced: each app destructures what it needs) ---------- */
const UI = (()=>{
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  // periods are 'YYYY-MM' (monthly) or 'YYYY-Qn' (quarterly)
  const isQ = s => s.charAt(5)==='Q';
  const lab = s => isQ(s) ? `${s.slice(5)} ${s.slice(2,4)}` : `${MON[+s.slice(5,7)-1]} ${s.slice(2,4)}`;
  const zh = s => isQ(s) ? `${s.slice(0,4)} 年第 ${s.slice(6)} 季` : `${s.slice(0,4)} 年 ${+s.slice(5,7)} 月`;
  const zhS = s => isQ(s) ? `Q${s.slice(6)}` : `${+s.slice(5,7)} 月`;
  const monthOf = s => isQ(s) ? `${s.slice(0,4)}-${String(+s.slice(6)*3).padStart(2,'0')}` : s;
  const dzh = s => s ? `${+s.slice(5,7)}/${+s.slice(8,10)}` : '—';
  const fx = (v,d=1) => { if(v==null||isNaN(v)) return '—'; const r=+(+v).toFixed(d); return (r===0?0:r).toFixed(d); };
  const sg = (v,d=1) => v==null||isNaN(v) ? '—' : (v>0?'+':v<0?'−':'') + fx(Math.abs(v),d);
  const pc = (v,d=1) => v==null||isNaN(v) ? '—' : sg(v,d)+'%';
  const un = (a,n) => { const o=Array(n).fill(null); if(!a) return o; if(Array.isArray(a)) return a.slice(); a.v.forEach((v,i)=>o[a.o+i]=v); return o; };
  const last = a => { for(let t=a.length-1;t>=0;t--) if(a[t]!=null) return t; return -1; };
  const col = v => v==null ? 'var(--dim)' : v>0 ? 'var(--good)' : v<0 ? 'var(--bad)' : 'var(--muted)';
  // diffusion indexes: distance from 50, colored by what a high reading means for that index
  const dcol = (v,kind) => v==null ? 'var(--dim)' : Math.abs(v-50)<1e-9 ? 'var(--muted)' : (kind==='price'||kind==='inverse') ? (v>50?'var(--bad)':kind==='price'?'var(--cool)':'var(--good)') : (v>50?'var(--good)':'var(--bad)');

  /* tooltip */
  const tip = () => $('#tip');
  function tipBox(title, sub, rows, foot){ return `<div class="tt">${title}</div>${sub?`<div class="ts">${sub}</div>`:''}<dl class="tg">${rows.filter(Boolean).map(([k,v,c])=>`<dt>${k}</dt><dd${c?` style="color:${c}"`:''}>${v}</dd>`).join('')}</dl>${foot?`<div class="tf">${foot}</div>`:''}`; }
  function showTip(e,html){ const t=tip(); t.innerHTML=html; t.hidden=false; const r=t.getBoundingClientRect(); let x=e.clientX+14, y=e.clientY+14; if(x+r.width>innerWidth-8) x=e.clientX-r.width-14; if(y+r.height>innerHeight-8) y=Math.max(8,e.clientY-r.height-14); t.style.left=x+'px'; t.style.top=y+'px'; }
  const hideTip = () => { tip().hidden=true; };

  /* scales and axes */
  function niceStep(span,n){ const raw=span/n; const mag=Math.pow(10,Math.floor(Math.log10(raw))); return [1,2,2.5,5,10].map(m=>m*mag).find(s=>s>=raw); }
  function scale(vals,n,zero){ let lo=Math.min(...vals), hi=Math.max(...vals); if(zero){ lo=Math.min(0,lo); hi=Math.max(0,hi); } if(hi-lo<1e-9){ hi+=0.5; lo-=0.5; } const st=niceStep(hi-lo,n||5); return {lo:Math.floor(lo/st-1e-9)*st, hi:Math.ceil(hi/st+1e-9)*st, st}; }
  const dec = st => Number.isInteger(st) ? 0 : (st*10)%1===0 ? 1 : 2;
  function yAxis(W,P,H,sc,unit,zeroAt){ const Y=v=>P.t+(sc.hi-v)/(sc.hi-sc.lo)*(H-P.t-P.b); let s='';
    for(let v=sc.lo; v<=sc.hi+1e-9; v+=sc.st){ const tv=+v.toFixed(6); s+=`<line x1="${P.l}" x2="${W-P.r}" y1="${Y(tv)}" y2="${Y(tv)}" class="${Math.abs(tv-(zeroAt||0))<1e-9?'zero':'gridl'}"/><text x="${P.l-6}" y="${Y(tv)+3}" text-anchor="end" class="axis">${tv.toFixed(dec(sc.st))}${unit||''}</text>`; } return {Y,s}; }
  function xLab(T,X,y,P0){ let s=''; const n=T.length, every=Math.ceil(n/6), step=n>1?(X(n-1)-X(0))/(n-1):0;
    T.forEach((p,i)=>{ if((i%every===0 && (n-1-i)*step>=64) || i===n-1) s+=`<text x="${X(i)}" y="${y}" text-anchor="${i===n-1&&n>1?'end':'middle'}" class="axis">${lab(p)}</text>`; }); return s; }
  const hovEl = (P,W,H) => `<line class="hov hovL" x1="0" x2="0" y1="${P.t}" y2="${H-P.b}" visibility="hidden"/><rect class="hovR" x="${P.l}" y="${P.t}" width="${W-P.l-P.r}" height="${H-P.t-P.b}" fill="transparent"/>`;
  function hover(svg,T,X,cb){ const r=svg.querySelector('.hovR'), ln=svg.querySelector('.hovL'), vb=svg.viewBox.baseVal;
    r.onmousemove=e=>{ const b=svg.getBoundingClientRect(), x=(e.clientX-b.left)/b.width*vb.width; let bi=0,bd=1e9; T.forEach((_,i)=>{ const d=Math.abs(X(i)-x); if(d<bd){bd=d;bi=i;} });
      ln.setAttribute('x1',X(bi)); ln.setAttribute('x2',X(bi)); ln.setAttribute('visibility','visible'); showTip(e,cb(bi)); };
    r.onmouseleave=()=>{ ln.setAttribute('visibility','hidden'); hideTip(); }; }

  /* line chart. o: {P (period labels), T (indexes), lines:[{n,a,c,w,dash}], W,H, unit, d (decimals), refs:[{v,c,lab}], zero, title, tipT(t), legend el} */
  function lineChart(el,o){
    const W=o.W||680, H=o.H||270, P={l:46,r:14,t:14,b:30}, T=o.T, per=o.P;
    const vals=o.lines.flatMap(l=>T.map(t=>l.a[t]).filter(v=>v!=null)).concat((o.refs||[]).map(r=>r.v));
    if(!o.lines.some(l=>T.some(t=>l.a[t]!=null))){ el.innerHTML='<div class="empty">這個區間沒有資料。</div>'; if(o.legend) o.legend.innerHTML=''; return; }
    const sc=scale(vals,6,o.zero), {Y,s:g}=yAxis(W,P,H,sc,o.unit,o.zeroAt), X=i=>T.length===1?(P.l+W-P.r)/2:P.l+i/(T.length-1)*(W-P.l-P.r);
    let s=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.title||'')}">`+g+xLab(T.map(t=>per[t]),X,H-P.b+16)
      +gapSvg(gapRuns(T,t=>o.lines.some(l=>l.a[t]!=null),t=>monthOf(per[t])),T,X,P.t,H-P.b,t=>monthOf(per[t]),1);
    (o.refs||[]).forEach(r=>{ s+=`<line x1="${P.l}" x2="${W-P.r}" y1="${Y(r.v)}" y2="${Y(r.v)}" stroke="${r.c||'var(--cmd)'}" stroke-dasharray="5 4" stroke-width="1.1"/>${r.lab?`<text x="${P.l+6}" y="${Y(r.v)-5}" class="axis" style="fill:${r.c||'var(--cmd)'}">${esc(r.lab)}</text>`:''}`; });
    o.lines.forEach(l=>{ let d='',pen=false; T.forEach((t,i)=>{ const v=l.a[t]; if(v==null){pen=false;return;} d+=(pen?'L':'M')+X(i).toFixed(1)+','+Y(v).toFixed(1); pen=true; });
      s+=`<path d="${d}" fill="none" stroke="${l.c}" stroke-width="${l.w||2}" ${l.dash?'stroke-dasharray="5 4"':''} stroke-linejoin="round"/>`;
      const li=[...T].reverse().find(t=>l.a[t]!=null); if(li!=null&&!l.dash) s+=`<circle cx="${X(T.indexOf(li))}" cy="${Y(l.a[li])}" r="3.2" fill="${l.c}" stroke="var(--panel)" stroke-width="1.2"/>`; });
    if(o.extra) s+=o.extra(X,Y,P,W,H);
    s+=hovEl(P,W,H)+'</svg>'; el.innerHTML=s;
    hover(el.querySelector('svg'),T,X,i=>{ const t=T[i]; return o.tipT ? o.tipT(t) : tipBox(zh(per[t]),o.title,o.lines.map(l=>[l.n,l.a[t]==null?'—':fx(l.a[t],o.d??1)+(o.unit||''),l.c])); });
    if(o.legend) o.legend.innerHTML=o.lines.map(l=>{ const lt=[...T].reverse().find(t=>l.a[t]!=null); return `<span><i style="display:inline-block;width:16px;border-top:2.5px ${l.dash?'dashed':'solid'} ${l.c}"></i>${esc(l.n)} <b style="font-family:var(--f-data);font-weight:500">${lt==null?'—':fx(l.a[lt],o.d??1)+(o.unit||'')}</b></span>`; }).join('')+(o.legExtra||'');
  }

  /* bar chart: stacked (signed) or grouped. o: {P,T,series:[{n,a,c}],stack,total:{n,a,c},W,H,unit,d,title,tipT,ghost:{i,v,c,lab}} */
  function barChart(el,o){
    const W=o.W||760, H=o.H||300, P={l:46,r:14,t:16,b:30}, T=o.T, per=o.P, S=o.series;
    const vals=[0]; T.forEach(t=>{ if(o.stack){ let p=0,n=0; S.forEach(x=>{ const v=x.a[t]; if(v>0)p+=v; else if(v<0)n+=v; }); vals.push(p,n); } else S.forEach(x=>{ if(x.a[t]!=null) vals.push(x.a[t]); }); if(o.total&&o.total.a[t]!=null) vals.push(o.total.a[t]); });
    if(o.ghost) vals.push(o.ghost.v);
    const sc=scale(vals,6,true), {Y,s:g}=yAxis(W,P,H,sc,o.unit), n=T.length+(o.ghost?1:0), slot=(W-P.l-P.r)/n, X=i=>P.l+slot*(i+0.5);
    const bw=o.stack?Math.max(2,Math.min(34,slot*0.66)):Math.max(1.5,Math.min(14,slot*0.8/S.length));
    let s=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.title||'')}">`+g+xLab(T.map(t=>per[t]).concat(o.ghost?[o.ghost.p]:[]),X,H-P.b+16)
      +gapSvg(gapRuns(T,t=>S.some(x=>x.a[t]!=null)||(o.total&&o.total.a[t]!=null),t=>monthOf(per[t])),T,X,P.t,H-P.b,t=>monthOf(per[t]));
    const rect=(x,y0,y1,c,extra)=>`<rect x="${x.toFixed(1)}" y="${Math.min(Y(y0),Y(y1)).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(0.5,Math.abs(Y(y1)-Y(y0))).toFixed(1)}" fill="${c}" ${extra||''}/>`;
    T.forEach((t,i)=>{ if(o.stack){ let p=0,q=0; S.forEach(x=>{ const v=x.a[t]; if(v==null||v===0) return; if(v>0){ s+=rect(X(i)-bw/2,p,p+v,x.c,'stroke="var(--panel)" stroke-width=".6"'); p+=v; } else { s+=rect(X(i)-bw/2,q,q+v,x.c,'stroke="var(--panel)" stroke-width=".6"'); q+=v; } }); }
      else S.forEach((x,k)=>{ const v=x.a[t]; if(v==null) return; s+=rect(X(i)-bw*S.length/2+k*bw,0,v,x.c,'fill-opacity=".9"'); }); });
    if(o.total){ let d='',pen=false; T.forEach((t,i)=>{ const v=o.total.a[t]; if(v==null){pen=false;return;} d+=(pen?'L':'M')+X(i).toFixed(1)+','+Y(v).toFixed(1); pen=true; s+=`<circle cx="${X(i)}" cy="${Y(v)}" r="3" fill="${o.total.c}" stroke="var(--panel)" stroke-width="1"/>`; });
      s+=`<path d="${d}" fill="none" stroke="${o.total.c}" stroke-width="1.6" pointer-events="none"/>`; }
    if(o.ghost){ const gi=T.length, v=o.ghost.v; s+=`<rect x="${(X(gi)-bw/2).toFixed(1)}" y="${Math.min(Y(0),Y(v)).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(0.5,Math.abs(Y(v)-Y(0))).toFixed(1)}" fill="none" stroke="${o.ghost.c||'var(--fg)'}" stroke-dasharray="3 3"/><text x="${X(gi)}" y="${Y(Math.max(0,v))-6}" text-anchor="middle" class="axis" style="fill:var(--fg)">${esc(o.ghost.lab)}</text>`; }
    s+=hovEl(P,W,H)+'</svg>'; el.innerHTML=s;
    const T2=o.ghost?T.concat([null]):T;
    hover(el.querySelector('svg'),T2,X,i=>{ const t=T2[i]; if(t==null) return o.ghost.tip; return o.tipT ? o.tipT(t) : tipBox(zh(per[t]),o.title,S.map(x=>[x.n,x.a[t]==null?'—':sg(x.a[t],o.d??1)+(o.unit||''),x.c]).concat(o.total?[[o.total.n,o.total.a[t]==null?'—':sg(o.total.a[t],o.d??1)+(o.unit||''),o.total.c]]:[])); });
  }

  /* headline tile; k makes it a button that jumps to a chart */
  const key = (lab,zhn,big,color,rows,foot,k) => `<${k?'button type="button" data-k="'+k+'"':'div style="cursor:default"'} class="key"><span class="kn">${lab}<span>${zhn}</span></span><span class="kv" style="color:${color||'var(--fg)'}">${big}</span><span class="kr">${rows.filter(Boolean).map(r=>`<span>${r}</span>`).join('')}</span><span class="kl">${foot||'&nbsp;'}</span></${k?'button':'div'}>`;
  /* range buttons in the shared toolbar; state[k] holds the label, stored per dataset */
  function rangeBar(R,state,k,store,onChange){ $('#rng').innerHTML=R.map(([r])=>`<button type="button" data-r="${r}" aria-pressed="${state[k]===r}">${r}</button>`).join('');
    $('#rng').querySelectorAll('button').forEach(b=>b.onclick=()=>{ state[k]=b.dataset.r; try{ localStorage.setItem(store,state[k]); }catch(e){} onChange(); }); }
  function initRange(R,state,k,store){ try{ const r=localStorage.getItem(store); if(R.some(x=>x[0]===r)) state[k]=r; }catch(e){} }
  const segBind = (sel,state,k,fn) => { const w=$(sel); const sync=()=>w.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===state[k])); w.querySelectorAll('button').forEach(b=>b.onclick=()=>{ state[k]=b.dataset.v; sync(); fn(); }); sync(); };
  // streak: consecutive periods ending at t on the same side of the threshold
  const streak = (a,t,th) => { if(a[t]==null) return 0; const up=a[t]>th; let n=0; for(let i=t;i>=0&&a[i]!=null&&(a[i]>th)===up&&a[i]!==th;i--) n++; return up?n:-n; };
  // "highest since": first earlier period at or above (or below) the value
  const since = (a,t,per,hi) => { const v=a[t]; if(v==null) return ''; for(let i=t-1;i>=0;i--) if(a[i]!=null&&(hi?a[i]>=v:a[i]<=v)) return t-i>=3?`${hi?'最高':'最低'}自 ${zh(per[i])}`:''; return `${hi?'最高':'最低'}（資料起點以來）`; };
  return {$,esc,MON,isQ,lab,zh,zhS,monthOf,dzh,fx,sg,pc,un,last,col,dcol,tipBox,showTip,hideTip,niceStep,scale,yAxis,xLab,hovEl,hover,lineChart,barChart,key,rangeBar,initRange,segBind,streak,since};
})();

/* ---------- Overview app: trend-first dashboard across all datasets ---------- */
const {$,esc,zh,lab,dzh,fx,sg,un,last,tipBox,lineChart,rangeBar,initRange} = UI;
const META = DS[DSK].meta;
const TODAY = (()=>{ const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })();

/* ---------- common axes: months for monthly data, quarters for GDP ---------- */
const nextM = m => { let [y,mm]=m.split('-').map(Number); mm++; if(mm>12){ mm=1; y++; } return `${y}-${String(mm).padStart(2,'0')}`; };
const MO = (()=>{ const ends=Object.values(DS).filter(d=>d.hist&&d.hist.months&&d.hist.months.length).map(d=>d.hist.months.at(-1)).sort(); const o=[]; for(let m='2015-01'; m<=ends.at(-1); m=nextM(m)) o.push(m); return o; })();
const NM = MO.length, POS = new Map(MO.map((m,i)=>[m,i]));
const onMO = (months,arr) => { const o=Array(NM).fill(null); months.forEach((m,i)=>{ if(POS.has(m)&&arr[i]!=null) o[POS.get(m)]=arr[i]; }); return o; };
const ser = (ds,name,f) => { const d=DS[ds]; if(!d) return Array(NM).fill(null); const h=d.hist, s=h.series[name]; if(!s) return Array(NM).fill(null);
  const raw = f ? s[f] : (s.v && !Array.isArray(s.v) ? s.v : s); return onMO(h.months, un(raw,h.months.length)); };

/* ---------- transforms ---------- */
const yoyA = a => a.map((v,t)=>t>=12&&v!=null&&a[t-12]?(v/a[t-12]-1)*100:null);
const annA = (a,k) => a.map((v,t)=>t>=k&&v!=null&&a[t-k]?(Math.pow(v/a[t-k],12/k)-1)*100:null);
const ma = (a,k) => a.map((_,t)=>{ if(t<k-1) return null; let s=0; for(let i=t-k+1;i<=t;i++){ if(a[i]==null) return null; s+=a[i]; } return s/k; });
const diff = a => a.map((v,t)=>t>0&&v!=null&&a[t-1]!=null?v-a[t-1]:null);
const sub = (a,...bs) => a.map((v,t)=>v==null||bs.some(b=>b[t]==null)?null:bs.reduce((x,b)=>x-b[t],v));
// weekly claims → monthly average (weeks are labelled by their Saturday)
const claimsM = (()=>{ const p=DS.pulse; if(!p) return Array(NM).fill(null); const w=p.hist.weeks, a=un(p.hist.series.ICSA.v,w.length), acc={};
  w.forEach((d,i)=>{ if(a[i]==null) return; const m=d.slice(0,7); (acc[m]=acc[m]||[]).push(a[i]/1000); });
  return MO.map(m=>acc[m]&&acc[m].length>=3?acc[m].reduce((x,y)=>x+y,0)/acc[m].length:null); })();
// GDP is quarterly: own axis
const GQ = DS.gdp ? DS.gdp.hist.quarters : [], GS = k => DS.gdp ? un(DS.gdp.hist.series[k],GQ.length) : [];
const yoyQ = a => a.map((v,t)=>t>=4&&v!=null&&a[t-4]?(v/a[t-4]-1)*100:null);
const maQ = (a,k) => a.map((_,t)=>{ if(t<k-1) return null; let s=0; for(let i=t-k+1;i<=t;i++){ if(a[i]==null) return null; s+=a[i]; } return s/k; });

/* ---------- indicator table: the single rule set for direction, color and thresholds ----------
   fast = single-period reading (thin line); trend = smoothed line the page judges; good: +1 higher is better, -1 higher is worse;
   thr = minimum 6-month (GDP: 2-quarter) change in the trend line to call it rising/falling */
const CTRL = DS.retail ? (()=>{ const r=DS.retail.hist, g=k=>onMO(r.months,un(r.series[k].v,r.months.length)); return sub(g('RSXFS'),g('RSMVPD'),g('RSGASS'),g('RSBMGESD')); })() : Array(NM).fill(null);
const ismS = k => ser('ism',k), spg = k => ser('spgi',k);
const best = k => spg(k+':final').map((v,t)=>v??spg(k+':flash')[t]);
const NFPL = ser('nfp','CES0000000001'), NFPD = diff(NFPL);
const CPIC = ser('cpi','All items less food and energy','sa'), CPICn = ser('cpi','All items less food and energy','nsa');
const SHL = ser('cpi','Shelter','sa'), SHLn = ser('cpi','Shelter','nsa');
const PCEC = ser('pce','PCE excluding food and energy','sa');
const PPIC = ser('ppi','Final demand less foods, energy, and trade services','sa'), PPICn = ser('ppi','Final demand less foods, energy, and trade services','nsa');
const AHE = ser('nfp','CES0500000003'), UR = ser('nfp','UNRATE'), EPOP = ser('nfp','LNS12300060');
const ismCons = k => { const a=ismS(k+':cons'), v=ismS(k===`m`?'m:Manufacturing PMI':'s:Services PMI'); const t=last(v); return a[t]!=null?v[t]-a[t]:null; };
const spCons = () => { const a=spg('cmp:flash'), f=spg('cmp:flashFc'), t=last(a); return a[t]!=null&&f[t]!=null?a[t]-f[t]:null; };
const gdpCons = () => { const v=(DS.gdp&&DS.gdp.hist.vint[GQ[last(GS('gdp'))]])||[]; const x=v.slice().sort((a,b)=>a.d<b.d?-1:1).at(-1); return x&&x.f!=null?x.v-x.f:null; };

const GROUPS = [
  ['act','經濟活動','Activity'],['ms','製造／服務業','Manufacturing & services'],['ds','需求與供給','Demand & supply'],['inf','通膨','Inflation'],['emp','就業','Employment']];
const IND = [
  {g:'act',id:'gdp',n:'實質 GDP',src:'gdp',q:1,fast:GS('gdp'),trend:yoyQ(GS('rgdp')),fl:'季增年率',tl:'年增',u:'%',d:1,good:1,thr:0.5,ref:2,refl:'潛在約 2%',cons:gdpCons},
  {g:'act',id:'core',n:'核心 GDP（民間最終銷售）',src:'gdp',q:1,fast:GS('fspdp'),trend:maQ(GS('fspdp'),4),fl:'季增年率',tl:'4 季平均',u:'%',d:1,good:1,thr:0.5},
  {g:'act',id:'ctrl',n:'零售控制組（名目）',src:'retail',fast:annA(CTRL,3),trend:yoyA(CTRL),fl:'3M 年化',tl:'年增',u:'%',d:1,good:1,thr:1},
  {g:'ms',id:'ism_m',n:'ISM 製造業',src:'ism',fast:ismS('m:Manufacturing PMI'),trend:ma(ismS('m:Manufacturing PMI'),6),fl:'當月',tl:'6M 平均',u:'',d:1,good:1,thr:1,ref:50,refl:'50',cons:()=>ismCons('m')},
  {g:'ms',id:'ism_s',n:'ISM 服務業',src:'ism',fast:ismS('s:Services PMI'),trend:ma(ismS('s:Services PMI'),6),fl:'當月',tl:'6M 平均',u:'',d:1,good:1,thr:1,ref:50,refl:'50',cons:()=>ismCons('s')},
  {g:'ms',id:'sp_c',n:'S&P 綜合 PMI',src:'spgi',fast:best('cmp'),trend:ma(best('cmp'),6),fl:'當月（含初值）',tl:'6M 平均',u:'',d:1,good:1,thr:1,ref:50,refl:'50',cons:spCons},
  {g:'ds',id:'no_m',n:'需求：製造業新訂單',src:'ism',fast:ismS('m:New Orders'),trend:ma(ismS('m:New Orders'),6),fl:'當月',tl:'6M 平均',u:'',d:1,good:1,thr:1,ref:50,refl:'50'},
  {g:'ds',id:'no_s',n:'需求：服務業新訂單',src:'ism',fast:ismS('s:New Orders'),trend:ma(ismS('s:New Orders'),6),fl:'當月',tl:'6M 平均',u:'',d:1,good:1,thr:1,ref:50,refl:'50'},
  {g:'ds',id:'sd_m',n:'供給：供應商交貨（高＝變慢）',src:'ism',fast:ismS('m:Supplier Deliveries'),trend:ma(ismS('m:Supplier Deliveries'),6),fl:'當月',tl:'6M 平均',u:'',d:1,good:-1,thr:1,ref:50,refl:'50'},
  {g:'ds',id:'pr_m',n:'供給：製造業物價',src:'ism',fast:ismS('m:Prices'),trend:ma(ismS('m:Prices'),6),fl:'當月',tl:'6M 平均',u:'',d:1,good:-1,thr:1,ref:60,refl:'60 壓力偏高'},
  {g:'inf',id:'pce',n:'核心 PCE',src:'pce',fast:annA(PCEC,3),trend:yoyA(PCEC),fl:'3M 年化',tl:'年增',u:'%',d:1,good:-1,thr:0.2,ref:2,refl:'目標 2%',target:2},
  {g:'inf',id:'cpi',n:'核心 CPI',src:'cpi',fast:annA(CPIC,3),trend:yoyA(CPICn),fl:'3M 年化',tl:'年增',u:'%',d:1,good:-1,thr:0.2,ref:2,refl:'2%'},
  {g:'inf',id:'shl',n:'CPI 住房',src:'cpi',fast:annA(SHL,3),trend:yoyA(SHLn),fl:'3M 年化',tl:'年增',u:'%',d:1,good:-1,thr:0.2},
  {g:'inf',id:'ppi',n:'核心 PPI（不含食品能源貿易）',src:'ppi',fast:annA(PPIC,3),trend:yoyA(PPICn),fl:'3M 年化',tl:'年增',u:'%',d:1,good:-1,thr:0.2},
  {g:'emp',id:'ur',n:'失業率',src:'nfp',fast:UR,trend:ma(UR,3),fl:'當月',tl:'3M 平均',u:'%',d:1,good:-1,thr:0.2},
  {g:'emp',id:'nfp',n:'非農就業變動',src:'nfp',fast:NFPD,trend:ma(NFPD,6),fl:'當月',tl:'6M 平均',u:'k',d:0,good:1,thr:25,ref:0},
  {g:'emp',id:'icl',n:'初領失業金（月均）',src:'pulse',fast:claimsM,trend:ma(claimsM,6),fl:'月均',tl:'6M 平均',u:'k',d:0,good:-1,thr:10},
  {g:'emp',id:'ahe',n:'平均時薪年增',src:'nfp',fast:annA(AHE,3),trend:yoyA(AHE),fl:'3M 年化',tl:'年增',u:'%',d:1,good:0,thr:0.2},
  {g:'emp',id:'epop',n:'壯年就業人口比',src:'nfp',fast:EPOP,trend:ma(EPOP,3),fl:'當月',tl:'3M 平均',u:'%',d:1,good:1,thr:0.2},
];
const PER = ind => ind.q ? GQ : MO;

/* ---------- trend reading ---------- */
function read(ind){
  const tt=last(ind.trend), tf=last(ind.fast), lag=ind.q?2:6, P=PER(ind);
  let t0=tt-lag; while(t0>0&&ind.trend[t0]==null) t0--;
  const d=tt>=0&&t0>=0&&ind.trend[t0]!=null?ind.trend[tt]-ind.trend[t0]:null;
  const dir=d==null?null:Math.abs(d)<ind.thr?0:Math.sign(d);
  const gap=tf>=0&&tt>=0&&tf===tt?ind.fast[tf]-ind.trend[tt]:null;   // single period vs trend line, same period only
  const turn=gap==null?null:Math.abs(gap)<ind.thr?0:Math.sign(gap);
  return {tt,tf,d,dir,gap,turn,per:P[tf],perT:P[tt]};
}
// colour of a move: up on an indicator where higher is worse is red; wages (good 0) are neutral
const mc = (ind,sgn) => !sgn||!ind.good ? 'var(--muted)' : sgn*ind.good>0 ? 'var(--good)' : 'var(--bad)';
const val = (ind,v) => v==null ? '—' : (ind.u==='k'&&ind.id==='nfp' ? sg(v,0) : fx(v,ind.d))+(ind.u||'');
const dirLab = r => r.dir==null ? '—' : r.dir>0 ? '▲ 上升' : r.dir<0 ? '▼ 下降' : '■ 持平';
const turnLab = r => r.turn==null ? '—' : r.turn>0 ? '高於趨勢' : r.turn<0 ? '低於趨勢' : '貼近趨勢';

/* ---------- release calendar (dates from each dataset; CPI/PCE/PPI from BLS/BEA schedules) ---------- */
function calendar(){
  const g=(k,f)=>DS[k]&&DS[k].meta?f(DS[k].meta):null, items=[];
  const add=(d,n,src,ref,extra)=>{ if(d) items.push({d,n,src,ref,extra}); };
  add(g('gdp',m=>m.next.date),`GDP ${lab(DS.gdp.meta.next.q)} 初估`,'gdp',DS.gdp&&DS.gdp.meta.next.q,`預期 ${fx(DS.gdp.meta.next.cons)}% · GDPNow ${fx(DS.gdp.meta.nowcast.v)}%`);
  (META.cal||[]).forEach(c=>add(c.d,c.n,c.src,c.ref,c.note));
  add(g('ism',m=>m.next.m),'ISM 製造業','ism',null); add(g('ism',m=>m.next.s),'ISM 服務業','ism',null);
  add(g('spgi',m=>m.next.mfg),'S&P 製造業 PMI 終值','spgi',null); add(g('spgi',m=>m.next.svc),'S&P 服務業／綜合 PMI 終值','spgi',null);
  add(g('pulse',m=>m.adp_next&&m.adp_next[0]),'ADP 民間就業','pulse',null);
  add(g('nfp',m=>m.next),'非農就業報告','nfp',null); add(g('retail',m=>m.next),'零售銷售','retail',null);
  // weekly claims: every Thursday
  const d=new Date(TODAY+'T12:00:00'); d.setDate(d.getDate()+((4-d.getDay()+7)%7));
  for(let i=0;i<3;i++){ const s=d.toISOString().slice(0,10); add(s,'初領失業金','pulse',null); d.setDate(d.getDate()+7); }
  return items.sort((a,b)=>a.d<b.d?-1:a.d>b.d?1:0);
}
function renderCal(){
  const it=calendar(), lim=new Date(TODAY+'T12:00:00'); lim.setDate(lim.getDate()+28); const end=lim.toISOString().slice(0,10);
  const rows=it.filter(x=>x.d<=end&&(x.d>=TODAY||(x.ref&&!have(x.src,x.ref))));
  let h=`<table><thead><tr><th>日期</th><th>公布</th><th>備註</th></tr></thead><tbody>`;
  rows.forEach(x=>{ const past=x.d<TODAY; h+=`<tr data-src="${x.src}" style="cursor:pointer"><td class="nm">${dzh(x.d)}${x.d===TODAY?' <span class="tag" style="background:var(--cmd);color:var(--amber-ink);padding:0 4px">今天</span>':''}</td><td class="nm">${esc(x.n)}</td><td class="nm" style="color:${past?'var(--cmd)':'var(--muted)'}">${past?'已公布，頁面待更新':esc(x.extra||'')}</td></tr>`; });
  $('#ocTbl').innerHTML=h+'</tbody></table>';
  $('#ocHint').textContent=`未來 4 週 · 今天 ${TODAY}`;
  $('#ocTbl').querySelectorAll('tr[data-src]').forEach(r=>r.onclick=()=>{ location.hash=r.dataset.src; });
}
// has the page already got this reference period? (quarters for GDP, months otherwise)
function have(src,ref){ const d=DS[src]; if(!d) return false; const per=d.hist.quarters||d.hist.months; return per.includes(ref) && (src!=='gdp' || un(d.hist.series.gdp,per.length)[per.indexOf(ref)]!=null); }

/* ---------- dashboard table ---------- */
function spark(ind){ const P=PER(ind), tt=last(ind.trend); if(tt<0) return ''; const n=ind.q?12:24, s=Math.max(0,tt-n+1), a=ind.trend.slice(s,tt+1), f=ind.fast.slice(s,tt+1);
  const vals=a.concat(f).filter(v=>v!=null); if(vals.length<2) return ''; let lo=Math.min(...vals), hi=Math.max(...vals); if(ind.ref!=null&&ind.ref>=lo-((hi-lo)*.3)&&ind.ref<=hi+((hi-lo)*.3)){ lo=Math.min(lo,ind.ref); hi=Math.max(hi,ind.ref); }
  const W=120,H=28,X=i=>2+i/(a.length-1)*(W-4),Y=v=>H-3-(v-lo)/((hi-lo)||1)*(H-6);
  const path=arr=>{ let d='',pen=false; arr.forEach((v,i)=>{ if(v==null){pen=false;return;} d+=(pen?'L':'M')+X(i).toFixed(1)+','+Y(v).toFixed(1); pen=true; }); return d; };
  const r=read(ind);
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true">${ind.ref!=null&&ind.ref>=lo&&ind.ref<=hi?`<line x1="0" x2="${W}" y1="${Y(ind.ref)}" y2="${Y(ind.ref)}" stroke="var(--dim)" stroke-dasharray="2 2"/>`:''}<path d="${path(f)}" fill="none" stroke="var(--muted)" stroke-width="1" opacity=".55"/><path d="${path(a)}" fill="none" stroke="${mc(ind,r.dir)||'var(--fg)'}" stroke-width="2"/></svg>`; }
function renderTbl(){
  let h=`<thead><tr><th>指標</th><th>最新</th><th>期間</th><th>趨勢線</th><th>趨勢</th><th>變化</th><th>近期 vs 趨勢</th><th>與預期</th><th>基準</th><th>近 2 年</th><th>下次公布</th></tr></thead><tbody>`;
  const cal=calendar();
  GROUPS.forEach(([g,z,en])=>{ h+=`<tr class="hdr"><td class="nm" colspan="11"><span class="lab">${en} · ${z}</span></td></tr>`;
    IND.filter(i=>i.g===g).forEach(ind=>{ const r=read(ind), P=PER(ind), c=ind.cons?ind.cons():null, nx=cal.find(x=>x.src===ind.src&&x.d>=TODAY);
      const tv=r.tt>=0?ind.trend[r.tt]:null;
      h+=`<tr data-src="${ind.src}" data-id="${ind.id}"><td class="nm">${esc(ind.n)}</td><td>${val(ind,ind.fast[r.tf])} <span class="zh" style="font-size:10px;color:var(--dim)">${ind.fl}</span></td><td>${r.per?lab(r.per):'—'}</td>
        <td>${val(ind,tv)} <span style="font-size:10px;color:var(--dim)">${ind.tl}</span></td><td style="color:${mc(ind,r.dir)}">${dirLab(r)}</td><td style="color:${mc(ind,r.dir)}">${r.d==null?'—':sg(r.d,ind.d)}</td>
        <td style="color:${mc(ind,r.turn)}">${turnLab(r)}</td><td style="color:${c==null?'var(--dim)':c>0?'var(--good)':c<0?'var(--bad)':'var(--muted)'}">${c==null?'—':sg(c,1)}</td>
        <td>${ind.target!=null&&tv!=null?`${sg(tv-ind.target,1)} vs ${ind.target}%`:ind.ref!=null?`${ind.ref}${ind.u==='%'?'%':''}`:'—'}</td><td>${spark(ind)}</td><td>${nx?dzh(nx.d):'—'}</td></tr>`; }); });
  $('#oTbl').innerHTML=h+'</tbody>';
  $('#oTbl').querySelectorAll('tr[data-src]').forEach(r=>{ r.style.cursor='pointer'; r.onclick=()=>{ location.hash=r.dataset.src; }; });
}

/* ---------- small multiples ---------- */
const RANGES = [['1Y',12],['2Y',24],['3Y',36],['5Y',60],['MAX',null]];
const state = {range:'3Y'};   // Overview shows a fixed 3-year window
function idx(ind){ const k=RANGES.find(x=>x[0]===state.range)[1], tt=Math.max(last(ind.trend),last(ind.fast)), n=k==null?null:ind.q?Math.ceil(k/3):k;
  let s=n==null?0:Math.max(0,tt-n+1); if(n==null){ while(s<tt&&ind.trend[s]==null&&ind.fast[s]==null) s++; }
  const T=[]; for(let t=s;t<=tt;t++) T.push(t); return T; }
function renderGrid(){
  let h='';
  GROUPS.forEach(([g,z,en])=>{ h+=`<div class="ovg"><div class="ovgh">${en} <span>${z}</span></div><div class="ovgrid">`;
    IND.filter(i=>i.g===g).forEach(ind=>{ const r=read(ind); h+=`<div class="ovc" data-src="${ind.src}"><div class="ovch"><span class="ovn">${esc(ind.n)}</span><span class="ovd" style="color:${mc(ind,r.dir)}">${dirLab(r)}</span></div>
      <div class="ovcv"><b>${val(ind,ind.trend[r.tt])}</b><span>${ind.tl} · ${r.perT?lab(r.perT):''}</span><span>${ind.fl} ${val(ind,ind.fast[r.tf])}</span></div><div class="chartbox" id="ovc_${ind.id}"></div></div>`; });
    h+='</div></div>'; });
  $('#oGrid').innerHTML=h;
  IND.forEach(ind=>{ const el=$('#ovc_'+ind.id), r=read(ind);
    lineChart(el,{P:PER(ind),T:idx(ind),W:340,H:170,title:ind.n,d:ind.d,unit:ind.u==='%'?'%':'',zero:ind.ref===0,
      lines:[{n:ind.fl,a:ind.fast,c:'var(--muted)',w:1},{n:ind.tl,a:ind.trend,c:mc(ind,r.dir)==='var(--muted)'?'var(--fg)':mc(ind,r.dir),w:2.6}],
      refs:ind.ref!=null?[{v:ind.ref,c:'var(--cmd)',lab:ind.refl||''}]:[]}); });
  $('#oGrid').querySelectorAll('.ovch').forEach(x=>x.onclick=()=>{ location.hash=x.parentElement.dataset.src; });
}

/* ---------- summary: one line per area, biggest trend moves first ---------- */
function renderSum(){
  const o=[];
  GROUPS.forEach(([g,z])=>{ const L=IND.filter(i=>i.g===g).map(ind=>({ind,r:read(ind)})).filter(x=>x.r.tt>=0);
    const up=L.filter(x=>x.r.dir>0).length, dn=L.filter(x=>x.r.dir<0).length, fl=L.filter(x=>x.r.dir===0).length;
    const parts=L.sort((a,b)=>Math.abs((b.r.d||0)/b.ind.thr)-Math.abs((a.r.d||0)/a.ind.thr)).map(({ind,r})=>`${ind.n.replace(/（.*）/,'')} ${val(ind,ind.trend[r.tt])}<span style="color:${mc(ind,r.dir)}">（${r.dir>0?'↑':r.dir<0?'↓':'→'} ${r.d==null?'':sg(r.d,ind.d)}）</span>`);
    const turns=L.filter(x=>x.r.turn&&x.r.turn!==x.r.dir&&x.r.dir!=null).map(({ind,r})=>`${ind.n.replace(/（.*）/,'')}最新一期${r.turn>0?'高於':'低於'}趨勢`);
    o.push(`<b>${z}：</b>${up} 項上升、${dn} 項下降、${fl} 項持平。${parts.join('；')}。${turns.length?`<span style="color:var(--cmd)">留意轉折：${turns.join('、')}。</span>`:''}`); });
  const inf=read(IND.find(i=>i.id==='pce')), ur=read(IND.find(i=>i.id==='ur'));
  o.push(`<b>雙重使命一覽：</b>核心 PCE 趨勢 ${fx(IND.find(i=>i.id==='pce').trend[inf.tt])}%（距 2% 目標 ${sg(IND.find(i=>i.id==='pce').trend[inf.tt]-2,1)} 個百分點，${inf.dir>0?'仍在遠離':inf.dir<0?'正在接近':'沒有明顯變化'}）；失業率趨勢 ${fx(IND.find(i=>i.id==='ur').trend[ur.tt])}%（${ur.dir>0?'上升':ur.dir<0?'下降':'持平'}）。本頁只描述方向，不是預測或投資建議。`);
  $('#oSumList').innerHTML=o.map(s=>`<li>${s}</li>`).join('');
}

function renderToolbar(){
  const lt=k=>{ const d=DS[k]; if(!d) return '—'; const p=d.hist.quarters?GQ[last(GS('gdp'))]:d.hist.months.at(-1); return lab(p); };
  $('#status').innerHTML=`資料截至：CPI <b>${lt('cpi')}</b> · PCE <b>${lt('pce')}</b> · NFP <b>${lt('nfp')}</b> · ISM <b>${lt('ism')}</b> · S&P <b>${lt('spgi')}</b> · 零售 <b>${lt('retail')}</b> · GDP <b>${lt('gdp')}</b>`;
}
$('#appOv').hidden=false;
renderToolbar(); renderSum(); renderCal(); renderTbl(); renderGrid();

})();
