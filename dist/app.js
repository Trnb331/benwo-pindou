'use strict';
const $=id=>document.getElementById(id), all=s=>[...document.querySelectorAll(s)];
const colorMap=Object.fromEntries(MARD.map(p=>[p.code,p.hex]));
let pattern=null, source=null, sourceURL=null, selected='E02', history=[], currentId=null, loadId=0, drag=false, lastCell=-1, toastTimer;
let excluded=new Set(), highlight=null, doneCodes=new Set(), cropRect=null;
function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,4000)}
function route(){const hash=location.hash.slice(1)||'generate';const page=hash.startsWith('guide-')?'guide':(['generate','gallery','works','tools','guide'].includes(hash)?hash:'generate');all('[data-page]').forEach(e=>e.hidden=e.dataset.page!==page);all('header nav a').forEach(a=>a.classList.toggle('active',a.hash==='#'+page));if(page==='works')renderWorks();if(hash==='faq'||hash.startsWith('guide-'))requestAnimationFrame(() => $(hash)?.scrollIntoView());else window.scrollTo(0,0)}
window.addEventListener('hashchange',route);
$('palette').addEventListener('change',()=>{if(excluded.size){excluded.clear();toast('已切换色板，排除列表已清空')}});
function fillPalettes(){const sel=$('palette');const keep=sel.value;sel.replaceChildren();for(const p of PALETTES){const o=document.createElement('option');o.value=p.id;o.textContent=p.label;sel.append(o)}if(PALETTES.some(p=>p.id===keep))sel.value=keep}
// 画笔只能用当前图纸色板里的色号。切到 COCO / Perler 等色板后若仍按 MARD 填充，
// 刷上去的色号在 pattern.colors 里查不到，画布会直接报错。
function fillBrush(){const sel=$('paintColor');const keep=sel.value;sel.replaceChildren();
  const list=pattern?Object.keys(pattern.colors).sort():chosenPalette().map(p=>p.code);
  const hex=pattern?pattern.colors:Object.fromEntries(chosenPalette().map(p=>[p.code,p.hex]));
  for(const code of list){const o=document.createElement('option');o.value=code;o.textContent=code+' · '+hex[code];sel.append(o)}
  if(list.includes(keep))sel.value=keep;else if(list.length)sel.value=list[0]}
function chosenPalette(){const mode=$('palette').value;const entry=PALETTES.find(p=>p.id===mode);const list=entry?entry.get():MARD.filter(p=>p.core);return excluded.size?list.filter(p=>!excluded.has(p.code)):list}
function resetSource(){source=null;if(sourceURL){URL.revokeObjectURL(sourceURL);sourceURL=null}$('originalButton').disabled=true;$('before').hidden=true;$('beforeEmpty').hidden=false}
function setPattern(next,title){pattern=next;history=[];currentId=null;selected=next.cells.find(Boolean)||Object.keys(next.colors)[0]||'E02';$('title').value=title||'我的拼豆图纸';$('width').value=Math.min(300,next.w);$('widthValue').textContent=$('width').value+' 格';fillBrush();render()}
async function load(file){
  if(!file)return;const ticket=++loadId;
  if(file.size>20*1024*1024){toast('请选择小于 20 MB 的文件');return}
  if(file.name.toLowerCase().endsWith('.csv')){try{const data=BeadCore.parseCSV(await file.text());if(ticket!==loadId)return;resetSource();setPattern(data,file.name.replace(/\.csv$/i,''));toast('底稿已导入，可继续编辑')}catch(e){toast(e.message)}return}
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)){toast('请选择 JPG、PNG、WebP 图片或本我 CSV');return}
  const url=URL.createObjectURL(file),img=new Image();
  img.onload=()=>{if(ticket!==loadId){URL.revokeObjectURL(url);return}if(img.width*img.height>40000000){URL.revokeObjectURL(url);toast('图片过大，请缩小到 4000 万像素以内');return}resetSource();source=img;sourceURL=url;$('before').src=url;$('before').hidden=false;$('beforeEmpty').hidden=true;$('originalButton').disabled=false;$('cropBtn').disabled=false;$('title').value=file.name.replace(/\.[^.]+$/,'');convert()};
  img.onerror=()=>{URL.revokeObjectURL(url);if(ticket===loadId)toast('无法读取这张图片，请换一张重试')};img.src=url;
}
// 三种取样方式，对应界面上的「处理模式」：
//   real    取平均——照片最自然，但线条会糊
//   pixel   逐格取中心点——图片本身就是像素图时用，不做任何混合
//   cartoon 取每格出现最多的颜色——线稿和卡通的边缘最利落，也不会糊出灰边
function sampleSource(w,h,mode){
  const tmp=document.createElement('canvas'),c=tmp.getContext('2d',{willReadFrequently:true});
  if(mode==='real'){
    tmp.width=w;tmp.height=h;c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
    c.drawImage(source,0,0,w,h);return c.getImageData(0,0,w,h).data;
  }
  if(mode==='pixel'){
    tmp.width=w;tmp.height=h;c.imageSmoothingEnabled=false;
    c.drawImage(source,0,0,w,h);return c.getImageData(0,0,w,h).data;
  }
  // cartoon：先放到够大的中间尺寸，再逐格投票
  const scale=Math.max(1,Math.min(10,Math.floor(4000/Math.max(w,h))));
  const bw=w*scale,bh=h*scale;
  tmp.width=bw;tmp.height=bh;c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
  c.drawImage(source,0,0,bw,bh);
  const src=c.getImageData(0,0,bw,bh).data,out=new Uint8ClampedArray(w*h*4);
  for(let gy=0;gy<h;gy++)for(let gx=0;gx<w;gx++){
    const tally=new Map();let best=null,bestN=0,solid=0;
    for(let y=gy*scale;y<(gy+1)*scale;y++)for(let x=gx*scale;x<(gx+1)*scale;x++){
      const i=(y*bw+x)*4;
      if(src[i+3]<128)continue;
      solid++;
      // 量化到 16 级再投票，否则抗锯齿会让每个像素都自成一票
      const key=((src[i]>>4)<<8)|((src[i+1]>>4)<<4)|(src[i+2]>>4);
      const rec=tally.get(key);
      if(rec){rec.n++;rec.r+=src[i];rec.g+=src[i+1];rec.b+=src[i+2]}
      else tally.set(key,{n:1,r:src[i],g:src[i+1],b:src[i+2]});
      const cur=tally.get(key);if(cur.n>bestN){bestN=cur.n;best=cur}
    }
    const o=(gy*w+gx)*4;
    if(!best||solid<scale*scale/2){out[o+3]=0;continue}
    out[o]=Math.round(best.r/best.n);out[o+1]=Math.round(best.g/best.n);out[o+2]=Math.round(best.b/best.n);out[o+3]=255;
  }
  return out;
}
function convert(silent){
  if(!source){toast('请先上传图片；空白图纸和 CSV 可直接编辑');return}
  if(!silent&&history.length&&!confirm('重新转换会覆盖手工编辑，继续吗？'))return;
  const w=+$('width').value,h=Math.max(1,Math.round(w*source.height/source.width));
  if(h>320||w*h>51200){toast('图片比例过长，请先裁剪或减少横向格数');return}
  const data=sampleSource(w,h,$('pixelMode').value);
  const palette=chosenPalette(),cells=BeadCore.quantize(data,palette,+$('limit').value,+$('merge').value);
  setPattern({w,h,cells,colors:Object.fromEntries(palette.map(p=>[p.code,p.hex]))},$('title').value);toast(silent?'已重新生成':'图纸已生成');
}
// 排除一个颜色：把它从色板里拿掉再重新转换，和竞品的「排除」一致。
// 不能只是把格子清空——那会在图纸上留下洞。
function excludeColor(code){
  if(!source){toast('排除需要重新转换，请先上传图片');return}
  if(history.length&&!confirm('排除颜色会重新转换，手工编辑会被覆盖，继续吗？'))return;
  excluded.add(code);highlight=null;
  const left=chosenPalette().length;
  if(!left){excluded.delete(code);toast('不能把色板排空');return}
  history=[];convert(true);
}
function restoreColor(code){
  excluded.delete(code);highlight=null;
  if(source){history=[];convert(true)}else render();
}
function renderExcluded(){
  const box=$('excludedBox'),list=$('excludedList');
  box.hidden=!excluded.size;list.replaceChildren();
  if(!excluded.size)return;
  // 「管理色板」一次能排掉两百多个色号，全列出来会把侧栏撑爆，只显示前几个
  const CAP=10, all=[...excluded];
  if(all.length>CAP){
    const tip=document.createElement('button');tip.className='color-row';
    tip.textContent='共排除 '+all.length+' 个色号 · 点此全部恢复';
    tip.onclick=()=>{excluded.clear();highlight=null;if(source){history=[];convert(true)}else render()};
    list.append(tip);
  }
  for(const code of all.slice(0,CAP)){
    const b=document.createElement('button');b.className='color-row';
    const hex=(chosenPaletteAll().find(p=>p.code===code)||{}).hex||'#ccc';
    const dot=document.createElement('i');dot.style.background=hex;
    const x=document.createElement('span');x.className='cnt';x.textContent='恢复';
    b.append(dot,document.createTextNode(code),x);
    b.onclick=()=>restoreColor(code);
    list.append(b);
  }
}
// 不扣排除项的完整色板，renderExcluded 要用它查被排除色号的颜色
function chosenPaletteAll(){const e=PALETTES.find(p=>p.id===$('palette').value);return e?e.get():MARD.filter(p=>p.core)}
const DRAFT='benwo-draft-v1';
let draftTimer;
// 自动保存当前图纸。只存当前浏览器，和「我的作品」一样不会上传。
function autosave(){
  clearTimeout(draftTimer);
  draftTimer=setTimeout(()=>{
    if(!pattern)return;
    try{
      localStorage.setItem(DRAFT,JSON.stringify({pattern,title:$('title').value,palette:$('palette').value,at:Date.now()}));
      const t=new Date();
      $('autosave').textContent='已自动保存 '+String(t.getHours()).padStart(2,'0')+':'+String(t.getMinutes()).padStart(2,'0');
    }catch{ $('autosave').textContent='草稿过大，未自动保存'; }
  },800);
}
function restoreDraft(){
  let raw;try{raw=localStorage.getItem(DRAFT)}catch{return}
  if(!raw)return;
  try{
    const d=JSON.parse(raw);
    if(!d?.pattern?.cells||!d.pattern.colors)return;
    if(d.palette&&PALETTES.some(p=>p.id===d.palette))$('palette').value=d.palette;
    setPattern(d.pattern,d.title);
    $('autosave').textContent='已恢复上次的草稿';
  }catch{}
}
// ---------- 跟做进度 ----------
// 按颜色记录做完了哪些，方便照着图纸一种颜色一种颜色地拼。
function toggleDone(code){doneCodes.has(code)?doneCodes.delete(code):doneCodes.add(code);render()}
function renderProgress(counts){
  const box=$('progressBox');
  const total=Object.values(counts).reduce((a,b)=>a+b,0);
  const done=Object.entries(counts).filter(([c])=>doneCodes.has(c)).reduce((a,[,n])=>a+n,0);
  box.hidden=!total;
  if(!total)return;
  const pct=Math.round(done/total*100);
  $('progressBar').style.width=pct+'%';
  $('progressText').textContent='已完成 '+done.toLocaleString()+' / '+total.toLocaleString()+' 颗 · '+pct+'%';
}

// ---------- 裁剪 ----------
function openCrop(){
  if(!source){toast('请先上传图片');return}
  const cv=$('cropCanvas');
  const max=900,sc=Math.min(1,max/Math.max(source.width,source.height));
  cv.width=Math.round(source.width*sc);cv.height=Math.round(source.height*sc);
  cropRect=null;drawCrop();
  $('cropDialog').showModal();
}
function drawCrop(){
  const cv=$('cropCanvas'),c=cv.getContext('2d');
  c.clearRect(0,0,cv.width,cv.height);
  c.drawImage(source,0,0,cv.width,cv.height);
  if(!cropRect)return;
  const {x,y,w,h}=cropRect;
  c.fillStyle='#492b3b88';
  c.fillRect(0,0,cv.width,y);c.fillRect(0,y+h,cv.width,cv.height-y-h);
  c.fillRect(0,y,x,h);c.fillRect(x+w,y,cv.width-x-w,h);
  c.strokeStyle='#bc2d65';c.lineWidth=2;c.strokeRect(x,y,w,h);
}
function cropPos(e){
  const cv=$('cropCanvas'),r=cv.getBoundingClientRect();
  return {x:(e.clientX-r.left)/r.width*cv.width, y:(e.clientY-r.top)/r.height*cv.height};
}
function applyCrop(){
  const cv=$('cropCanvas');
  if(!cropRect||cropRect.w<8||cropRect.h<8){toast('请先在图上拖一个框');return}
  const sc=source.width/cv.width;
  const sx=Math.round(cropRect.x*sc),sy=Math.round(cropRect.y*sc);
  const sw=Math.round(cropRect.w*sc),sh=Math.round(cropRect.h*sc);
  const out=document.createElement('canvas');out.width=sw;out.height=sh;
  out.getContext('2d').drawImage(source,sx,sy,sw,sh,0,0,sw,sh);
  const img=new Image();
  img.onload=()=>{source=img;$('cropDialog').close();history=[];convert(true)};
  img.src=out.toDataURL();
}
// ---------- 管理色板 ----------
// 沿用 excluded 这一个集合：颜色面板上的「排除」和这里的勾选是同一件事，
// 不要再搞第二套状态，否则两边会对不上。
let palDraft=null;
function openPaletteDialog(){
  palDraft=new Set(excluded);
  renderPalList();
  $('paletteDialog').showModal();
}
function renderPalList(){
  const all=chosenPaletteAll();
  const q=($('palFilter').value||'').trim().toLowerCase();
  const on=all.length-palDraft.size;
  $('paletteDialogInfo').textContent=$('palette').selectedOptions[0].textContent+' · 共 '+all.length+' 色，当前启用 '+on+' 色';
  const box=$('palList');box.replaceChildren();
  for(const c of all){
    if(q&&!(c.code+' '+c.hex).toLowerCase().includes(q))continue;
    const lab=document.createElement('label');
    lab.className='pal-item'+(palDraft.has(c.code)?' off':'');
    const cb=document.createElement('input');cb.type='checkbox';cb.checked=!palDraft.has(c.code);
    cb.onchange=()=>{cb.checked?palDraft.delete(c.code):palDraft.add(c.code);renderPalList()};
    const dot=document.createElement('i');dot.style.background=c.hex;
    lab.append(cb,dot,document.createTextNode(c.code));
    box.append(lab);
  }
}
function applyPalette(){
  const all=chosenPaletteAll();
  if(palDraft.size>=all.length){toast('至少要留一个色号');return}
  excluded=new Set(palDraft);highlight=null;
  $('paletteDialog').close();
  if(source){history=[];convert(true)}else if(pattern)render();
}
function pushHistory(){history.push(pattern.cells.slice());if(history.length>30)history.shift();$('undo').disabled=false}
function drawBeads(target,p,cell,padding){
  const c=target.getContext('2d');
  p.cells.forEach((code,i)=>{
    if(!code||!p.colors[code])return;
    const x=padding+(i%p.w)*cell,y=padding+Math.floor(i/p.w)*cell;
    const cx=x+cell/2,cy=y+cell/2,r=cell*.46;
    const [rr,gg,bb]=BeadCore.rgb(p.colors[code]);
    const lighten=v=>Math.min(255,Math.round(v+(255-v)*.38));
    const darken=v=>Math.round(v*.72);
    const g=c.createRadialGradient(cx-r*.3,cy-r*.3,r*.15,cx,cy,r);
    g.addColorStop(0,`rgb(${lighten(rr)},${lighten(gg)},${lighten(bb)})`);
    g.addColorStop(.62,p.colors[code]);
    g.addColorStop(1,`rgb(${darken(rr)},${darken(gg)},${darken(bb)})`);
    c.fillStyle=g;c.beginPath();c.arc(cx,cy,r,0,7);c.fill();
    // 中间的孔
    c.globalCompositeOperation='destination-out';
    c.beginPath();c.arc(cx,cy,r*.3,0,7);c.fill();
    c.globalCompositeOperation='source-over';
  });
}
function draw(target,p,cell,labels,grid,padding=0,keep){
  const c=target.getContext('2d');if(!keep)c.clearRect(0,0,target.width,target.height);
  p.cells.forEach((code,i)=>{if(!code||!p.colors[code])return;const x=padding+(i%p.w)*cell,y=padding+Math.floor(i/p.w)*cell;c.fillStyle=p.colors[code];c.fillRect(x,y,cell,cell);if(highlight&&code!==highlight){c.globalAlpha=.18;c.fillRect(x,y,cell,cell);c.globalAlpha=1;c.fillStyle='#fff';c.globalAlpha=.62;c.fillRect(x,y,cell,cell);c.globalAlpha=1;c.fillStyle=p.colors[code]}if(labels&&cell>=16){const [r,g,b]=BeadCore.rgb(p.colors[code]);c.fillStyle=(r*.299+g*.587+b*.114)>145?'#302431':'#fff';c.textAlign='center';c.textBaseline='middle';c.font=Math.max(7,Math.floor(cell*.3))+'px sans-serif';c.fillText(code,x+cell/2,y+cell/2)}});
  if(grid){for(let x=0;x<=p.w;x++){c.beginPath();c.strokeStyle=x%10===0?'#704458aa':'#70445833';c.lineWidth=x%10===0?1.3:.6;c.moveTo(padding+x*cell,padding);c.lineTo(padding+x*cell,padding+p.h*cell);c.stroke()}for(let y=0;y<=p.h;y++){c.beginPath();c.strokeStyle=y%10===0?'#704458aa':'#70445833';c.lineWidth=y%10===0?1.3:.6;c.moveTo(padding,padding+y*cell);c.lineTo(padding+p.w*cell,padding+y*cell);c.stroke()}}
}
function thumb(p){const c=document.createElement('canvas');c.width=p.w*5;c.height=p.h*5;draw(c,p,5,false,false);return c.toDataURL()}
// 画布上的行列标尺。每 5 格标一个数，格子太小就退成每 10 格，免得糊成一片。
function drawRulers(target,p,cell,pad){
  const c=target.getContext('2d');const step=cell>=14?5:10;
  c.fillStyle='#805b6d';c.font=Math.max(9,Math.min(12,cell-4))+'px sans-serif';
  c.textAlign='center';c.textBaseline='middle';
  for(let x=step;x<=p.w;x+=step)c.fillText(x,pad+(x-.5)*cell,pad/2);
  c.textAlign='right';
  for(let y=step;y<=p.h;y+=step)c.fillText(y,pad-6,pad+(y-.5)*cell);
}
function render(){
  if(!pattern)return;const cell=+$('zoom').value;
  const pad=$('coords').checked?Math.max(22,cell+6):0;
  $('canvas').width=pattern.w*cell+pad;$('canvas').height=pattern.h*cell+pad;$('canvas').hidden=false;$('empty').hidden=true;
  const cx=$('canvas').getContext('2d');cx.fillStyle='#fff';cx.fillRect(0,0,$('canvas').width,$('canvas').height);
  if($('viewMode').value==='bead'){
    cx.fillStyle='#f6eef2';cx.fillRect(pad,pad,pattern.w*cell,pattern.h*cell);
    drawBeads($('canvas'),pattern,cell,pad);
  }else draw($('canvas'),pattern,cell,$('codes').checked,$('grid').checked,pad,true);
  if(pad)drawRulers($('canvas'),pattern,cell,pad);
  const counts=BeadCore.counts(pattern.cells),rows=Object.keys(counts).sort((a,b)=>counts[b]-counts[a]);$('total').textContent=Object.values(counts).reduce((a,b)=>a+b,0).toLocaleString();$('used').textContent=rows.length;$('dimensions').textContent=pattern.w+' × '+pattern.h+' 格';$('undo').disabled=!history.length;
  const q=($('colorFilter').value||'').trim().toLowerCase();
  $('colorList').replaceChildren();
  for(const code of rows){
    if(q&&!(code+' '+pattern.colors[code]).toLowerCase().includes(q))continue;
    const b=document.createElement('button');
    b.className='color-row'+(code===selected?' selected':'')+(highlight&&highlight!==code?' dimmed':'');
    const dot=document.createElement('i');dot.style.background=pattern.colors[code];
    const n=document.createElement('span');n.className='cnt';n.textContent=counts[code]+' 颗';
    const x=document.createElement('button');x.className='excl';x.textContent='排除';x.title='把这个颜色从图纸里去掉';
    x.onclick=e=>{e.stopPropagation();excludeColor(code)};
    const dn=document.createElement('button');dn.className='done';dn.textContent=doneCodes.has(code)?'撤销完成':'完成';
    dn.onclick=e=>{e.stopPropagation();toggleDone(code)};
    if(doneCodes.has(code))b.classList.add('finished');
    b.append(dot,document.createTextNode(code),n,dn,x);
    b.onclick=()=>{selected=code;$('paintColor').value=code;highlight=highlight===code?null:code;render()};
    $('colorList').append(b);
  }
  renderExcluded();renderProgress(counts);
  ['save','csv','png'].forEach(id=>$(id).disabled=false);$('status').textContent='画笔 '+selected+' · 透明格不计入豆数';$('after').src=thumb(pattern);$('after').hidden=false;$('afterEmpty').hidden=true;$('paintColor').value=selected;autosave();
}
function paint(e){
  if(!pattern)return;const cv=$('canvas'),rect=cv.getBoundingClientRect();
  // 画布可能带坐标标尺的留白，换算格子时要先把留白扣掉，否则点哪儿改哪儿会整体偏移
  const sx=cv.width/rect.width, sy=cv.height/rect.height, cell=+$('zoom').value;
  const pad=$('coords').checked?Math.max(22,cell+6):0;
  const x=Math.floor(((e.clientX-rect.left)*sx-pad)/cell), y=Math.floor(((e.clientY-rect.top)*sy-pad)/cell);
  if(x<0||y<0||x>=pattern.w||y>=pattern.h)return;const i=y*pattern.w+x;if(i===lastCell)return;lastCell=i;
  const next=$('mode').value==='erase'?null:selected;const old=pattern.cells[i];if(old===next)return;pattern.colors[selected]=pattern.colors[selected]||(chosenPaletteAll().find(p=>p.code===selected)||{}).hex||colorMap[selected];if($('mode').value==='replace'){pattern.cells=pattern.cells.map(c=>c===old?next:c);drag=false}else pattern.cells[i]=next;render();
}
$('canvas').addEventListener('pointerdown',e=>{if(!pattern)return;e.preventDefault();pushHistory();lastCell=-1;drag=true;$('canvas').setPointerCapture(e.pointerId);paint(e)});
$('canvas').addEventListener('pointermove',e=>{if(drag)paint(e)});
['pointerup','pointercancel','lostpointercapture'].forEach(type=>$('canvas').addEventListener(type,()=>{drag=false;lastCell=-1}));
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)}
function name(){return ($('title').value.trim()||'本我拼豆图纸').replace(/[\\/:*?"<>|]/g,'-')}
function exportPNG(){
  if(!pattern)return;const cell=32,pad=42,counts=BeadCore.counts(pattern.cells),codes=Object.keys(counts).sort(),c=document.createElement('canvas');c.width=Math.max(640,pattern.w*cell+pad*2);c.height=pattern.h*cell+pad*2+100+Math.ceil(codes.length/4)*32;c.getContext('2d').fillStyle='#fff';
  const g=c.getContext('2d');g.fillRect(0,0,c.width,c.height);const grid=document.createElement('canvas');grid.width=pattern.w*cell+pad*2;grid.height=pattern.h*cell+pad*2;draw(grid,pattern,cell,true,true,pad);g.drawImage(grid,0,60);g.fillStyle='#492b3b';g.font='bold 24px sans-serif';g.fillText('本我 BENWO · '+name(),pad,35);g.font='12px sans-serif';g.textAlign='center';
  for(let x=0;x<pattern.w;x++)g.fillText(x+1,pad+(x+.5)*cell,60+pad-10);g.textAlign='right';for(let y=0;y<pattern.h;y++)g.fillText(y+1,pad-9,60+pad+(y+.6)*cell);
  g.textAlign='left';codes.forEach((code,i)=>{const x=pad+(i%4)*(c.width-pad*2)/4,y=pattern.h*cell+pad*2+85+Math.floor(i/4)*32;g.fillStyle=pattern.colors[code];g.fillRect(x,y-14,20,20);g.strokeStyle='#ddd';g.strokeRect(x,y-14,20,20);g.fillStyle='#492b3b';g.font='14px sans-serif';g.fillText(code+' · '+counts[code]+' 颗',x+28,y)});
  c.toBlob(blob=>{if(blob)download(blob,name()+'.png');else toast('导出失败，请减少格数重试')},'image/png');
}
const STORAGE='benwo-works-v1';
function readWorks(){try{const a=JSON.parse(localStorage.getItem(STORAGE)||'[]');return Array.isArray(a)?a:[]}catch{return []}}
function saveWork(){if(!pattern)return;try{const works=readWorks(),id=currentId||crypto.randomUUID(),entry={id,title:name(),updated:Date.now(),pattern:JSON.parse(JSON.stringify(pattern))};const next=[entry,...works.filter(w=>w.id!==id)];localStorage.setItem(STORAGE,JSON.stringify(next));currentId=id;toast('已保存到你当前设备的浏览器，未上传服务器')}catch{toast('你的浏览器存储空间不足或不可用，请导出 CSV 备份')}}
function card(p,title,description,open){const article=document.createElement('article');article.className='panel';const img=new Image();img.src=thumb(p);img.alt=title;img.className='pattern-preview';const h=document.createElement('h3');h.textContent=title;const text=document.createElement('p');text.textContent=description;const b=document.createElement('button');b.className='primary';b.textContent='打开图纸 →';b.onclick=open;article.append(img,h,text,b);return article}
function openPattern(p,title,id){loadId++;resetSource();setPattern(JSON.parse(JSON.stringify(p)),title);currentId=id||null;location.hash='generate';if(location.hash==='#generate')window.scrollTo(0,0)}
function renderWorks(){$('works').replaceChildren();const works=readWorks();if(!works.length){const box=document.createElement('div');box.className='panel';box.textContent='还没有保存的作品。在工作台完成创作后，点击“保存作品”。';$('works').append(box)}for(const w of works){if(!w.pattern?.cells||!w.pattern.colors)continue;const c=card(w.pattern,w.title,w.pattern.w+' × '+w.pattern.h+' 格 · '+new Date(w.updated).toLocaleDateString(),()=>openPattern(w.pattern,w.title,w.id));const del=document.createElement('button');del.textContent='删除';del.onclick=()=>{if(confirm('删除“'+w.title+'”？建议先导出 CSV 备份。')){try{localStorage.setItem(STORAGE,JSON.stringify(readWorks().filter(x=>x.id!==w.id)));if(currentId===w.id)currentId=null;renderWorks()}catch{toast('删除失败，请检查浏览器存储权限')}}};c.append(del);$('works').append(c)}}
function samples(){return ['双色棋盘','粉色渐阶','对角条纹'].map((title,k)=>{const w=24,h=24,colors={E02:colorMap.E02,E04:colorMap.E04,E08:colorMap.E08,H01:colorMap.H01};const keys=Object.keys(colors),cells=Array.from({length:w*h},(_,i)=>{const x=i%w,y=Math.floor(i/w);return keys[k===0?(Math.floor(x/4)+Math.floor(y/4))%2:k===1?Math.floor(x/6):(Math.floor((x+y)/4)%4)]});return {title,p:{w,h,cells,colors}}})}
for(const {title,p} of samples())$('gallery').append(card(p,title,'24 × 24 格 · 本我几何练习底稿',()=>openPattern(p,title)));
function chart(){const q=$('searchColor').value.trim().toLowerCase();$('chart').replaceChildren();for(const c of MARD.filter(c=>(c.code+' '+c.family+' '+c.hex).toLowerCase().includes(q))){const div=document.createElement('div');div.className='chip';const i=document.createElement('i');i.style.background=c.hex;const b=document.createElement('b');b.textContent=c.code;const s=document.createElement('small');s.textContent=c.hex+' · '+c.family;div.append(i,b,s);$('chart').append(div)}if(!$('chart').children.length)$('chart').textContent='没有匹配色号，请换个关键词。'}
function calc(){const w=+$('calcW').value,h=+$('calcH').value,p=+$('pitch').value,n=+$('need').value,e=+$('extra').value;$('calcResult').textContent=w>=1&&h>=1&&w<=1000&&h<=1000?(w*p/10).toFixed(1)+' × '+(h*p/10).toFixed(1)+' cm':'请输入 1–1000 格';$('needResult').textContent=n>=0&&n<=1000000?'建议准备 '+Math.ceil(n*(1+e)).toLocaleString()+' 颗':'请输入有效豆数'}
['upload','choose'].forEach(id=>$(id).onclick=()=>$('file').click());$('file').onchange=e=>{load(e.target.files[0]);e.target.value=''};
['dragenter','dragover'].forEach(type=>$('stage').addEventListener(type,e=>{e.preventDefault();$('stage').classList.add('drag')}));
['dragleave','drop'].forEach(type=>$('stage').addEventListener(type,e=>{e.preventDefault();$('stage').classList.remove('drag')}));
$('stage').addEventListener('drop',e=>load(e.dataTransfer.files[0]));
['width','limit','merge'].forEach(id=>$(id).oninput=()=>$(id+'Value').textContent=$(id).value+(id==='width'?' 格':id==='limit'?' 色':''));
all('[data-size]').forEach(b=>b.onclick=()=>{$('width').value=b.dataset.size;$('width').oninput()});
['grid','codes','zoom'].forEach(id=>$(id).oninput=render);
$('convert').onclick=convert;$('undo').onclick=()=>{if(history.length){pattern.cells=history.pop();render()}};
$('blank').onclick=()=>{if(pattern&&!confirm('新建空白图纸？未保存的编辑将被替换。'))return;loadId++;resetSource();const w=+$('width').value;setPattern({w,h:w,cells:Array(w*w).fill(null),colors:{...colorMap}},'空白练习图纸')};
$('png').onclick=exportPNG;$('csv').onclick=()=>{if(pattern)download(new Blob(['\uFEFF'+BeadCore.csv(pattern)],{type:'text/csv;charset=utf-8'}),name()+'.csv')};$('save').onclick=saveWork;
fillBrush();
$('paintColor').value=selected;$('paintColor').onchange=()=>{selected=$('paintColor').value;render()};
$('originalButton').onclick=()=>{if(source){$('originalImage').src=source.src;$('originalDialog').showModal()}};
$('closeOriginal').onclick=()=>$('originalDialog').close();$('searchColor').oninput=chart;$('colorFilter').oninput=()=>{if(pattern)render()};$('pixelMode').onchange=()=>{if(source)convert()};$('coords').onchange=()=>{if(pattern)render()};$('viewMode').onchange=()=>{if(pattern)render()};
$('cropBtn').onclick=openCrop;
$('managePalette').onclick=openPaletteDialog;$('palCancel').onclick=()=>$('paletteDialog').close();
$('palApply').onclick=applyPalette;$('palFilter').oninput=renderPalList;
$('palAll').onclick=()=>{palDraft.clear();renderPalList()};
$('palNone').onclick=()=>{palDraft=new Set(chosenPaletteAll().map(c=>c.code));renderPalList()};
$('palUsed').onclick=()=>{if(!pattern){toast('还没有图纸');return}
  const used=new Set(Object.keys(BeadCore.counts(pattern.cells)));
  palDraft=new Set(chosenPaletteAll().map(c=>c.code).filter(c=>!used.has(c)));renderPalList()};$('cropCancel').onclick=()=>$('cropDialog').close();
$('cropReset').onclick=()=>{cropRect=null;drawCrop()};$('cropApply').onclick=applyCrop;
(()=>{let dragging=false,start=null;const cv=$('cropCanvas');
  cv.addEventListener('pointerdown',e=>{e.preventDefault();dragging=true;start=cropPos(e);cropRect={x:start.x,y:start.y,w:0,h:0};cv.setPointerCapture(e.pointerId);drawCrop()});
  cv.addEventListener('pointermove',e=>{if(!dragging)return;const p=cropPos(e);
    cropRect={x:Math.min(start.x,p.x),y:Math.min(start.y,p.y),w:Math.abs(p.x-start.x),h:Math.abs(p.y-start.y)};drawCrop()});
  ['pointerup','pointercancel'].forEach(t=>cv.addEventListener(t,()=>{dragging=false}));})();
['calcW','calcH','pitch','need','extra'].forEach(id=>$(id).oninput=calc);fillPalettes();chart();calc();route();restoreDraft();
