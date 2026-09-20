'use strict';
const BeadCore = (() => {
  const rgb = hex => [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
  const distance = (a,b)=> 2*(a[0]-b[0])**2+4*(a[1]-b[1])**2+3*(a[2]-b[2])**2;
  function nearest(color,palette){let best=palette[0],score=Infinity;for(const p of palette){const d=distance(color,p.rgb||rgb(p.hex));if(d<score){best=p;score=d}}return best.code}
  function quantize(data,palette,limit){
    const prepared=palette.map(p=>({...p,rgb:rgb(p.hex)})), counts={}, cache=new Map();
    for(let i=0;i<data.length;i+=4){if(data[i+3]<128)continue;const key=(data[i]<<16)|(data[i+1]<<8)|data[i+2];let code=cache.get(key);if(!code){code=nearest([data[i],data[i+1],data[i+2]],prepared);cache.set(key,code)}counts[code]=(counts[code]||0)+1}
    const allowed=new Set(Object.keys(counts).sort((a,b)=>counts[b]-counts[a]).slice(0,limit));const reduced=prepared.filter(p=>allowed.has(p.code));cache.clear();
    const cells=[];for(let i=0;i<data.length;i+=4){if(data[i+3]<128){cells.push(null);continue}const key=(data[i]<<16)|(data[i+1]<<8)|data[i+2];if(!cache.has(key))cache.set(key,nearest([data[i],data[i+1],data[i+2]],reduced));cells.push(cache.get(key))}return cells;
  }
  function counts(cells){return cells.reduce((a,c)=>{if(c)a[c]=(a[c]||0)+1;return a},{})}
  function csv(pattern){return ['BENWO,1,'+pattern.w+','+pattern.h,'x,y,code,hex',...pattern.cells.map((code,i)=>[i%pattern.w+1,Math.floor(i/pattern.w)+1,code||'',code?pattern.colors[code]:''].join(','))].join('\n')}
  function parseCSV(text){
    const lines=text.replace(/^\uFEFF/,'').trim().split(/\r?\n/),head=lines.shift().split(',');
    const w=Number(head[2]),h=Number(head[3]);if(head[0]!=='BENWO'||head[1]!=='1'||!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||w>320||h>320||w*h>51200)throw Error('请选择本我导出的 BENWO CSV 底稿');
    if(lines.shift()!=='x,y,code,hex'||lines.length!==w*h)throw Error('CSV 行数或表头不完整');
    const cells=new Array(w*h).fill(null),colors={},seen=new Set();
    for(const line of lines){const [xs,ys,code,hex,...extra]=line.split(',');const x=Number(xs)-1,y=Number(ys)-1,k=y*w+x;if(extra.length||!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x>=w||y>=h||seen.has(k))throw Error('CSV 坐标无效或重复');seen.add(k);
      if(code){if(!/^[A-Z]{1,3}\d{1,3}$/.test(code)||!/^#[0-9a-f]{6}$/i.test(hex))throw Error('CSV 色号或颜色无效');if(colors[code]&&colors[code]!==hex.toUpperCase())throw Error('同一色号出现不同颜色');cells[k]=code;colors[code]=hex.toUpperCase()}else if(hex)throw Error('空格不应带颜色');
    }return {w,h,cells,colors};
  }
  return {rgb,distance,nearest,quantize,counts,csv,parseCSV};
})();
