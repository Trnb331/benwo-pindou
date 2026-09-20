'use strict';
const $=id=>document.getElementById(id), all=s=>[...document.querySelectorAll(s)];
const colorMap=Object.fromEntries(MARD.map(p=>[p.code,p.hex]));
let pattern=null, source=null, sourceURL=null, selected='E02', history=[], currentId=null, loadId=0, drag=false, lastCell=-1, toastTimer;
function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,4000)}
function route(){const hash=location.hash.slice(1)||'generate';const page=hash.startsWith('guide-')?'guide':(['generate','gallery','works','tools','guide'].includes(hash)?hash:'generate');all('[data-page]').forEach(e=>e.hidden=e.dataset.page!==page);all('header nav a').forEach(a=>a.classList.toggle('active',a.hash==='#'+page));if(page==='works')renderWorks();if(hash==='faq'||hash.startsWith('guide-'))requestAnimationFrame(() => $(hash)?.scrollIntoView());else window.scrollTo(0,0)}
window.addEventListener('hashchange',route);
function chosenPalette(){const mode=$('palette').value;return MARD.filter(p=>mode==='all'||mode==='core'&&p.core||mode==='pink'&&['E','H'].includes(p.code[0]))}
function resetSource(){source=null;if(sourceURL){URL.revokeObjectURL(sourceURL);sourceURL=null}$('originalButton').disabled=true;$('before').hidden=true;$('beforeEmpty').hidden=false}
function setPattern(next,title){pattern=next;history=[];currentId=null;selected=next.cells.find(Boolean)||'E02';$('title').value=title||'我的拼豆图纸';$('width').value=Math.min(160,next.w);$('widthValue').textContent=$('width').value+' 格';render()}
async function load(file){
  if(!file)return;const ticket=++loadId;
  if(file.size>20*1024*1024){toast('请选择小于 20 MB 的文件');return}
  if(file.name.toLowerCase().endsWith('.csv')){try{const data=BeadCore.parseCSV(await file.text());if(ticket!==loadId)return;resetSource();setPattern(data,file.name.replace(/\.csv$/i,''));toast('底稿已导入，可继续编辑')}catch(e){toast(e.message)}return}
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)){toast('请选择 JPG、PNG、WebP 图片或本我 CSV');return}
  const url=URL.createObjectURL(file),img=new Image();
  img.onload=()=>{if(ticket!==loadId){URL.revokeObjectURL(url);return}if(img.width*img.height>40000000){URL.revokeObjectURL(url);toast('图片过大，请缩小到 4000 万像素以内');return}resetSource();source=img;sourceURL=url;$('before').src=url;$('before').hidden=false;$('beforeEmpty').hidden=true;$('originalButton').disabled=false;$('title').value=file.name.replace(/\.[^.]+$/,'');convert()};
  img.onerror=()=>{URL.revokeObjectURL(url);if(ticket===loadId)toast('无法读取这张图片，请换一张重试')};img.src=url;
}
function convert(){
  if(!source){toast('请先上传图片；空白图纸和 CSV 可直接编辑');return}
  if(history.length&&!confirm('重新转换会覆盖手工编辑，继续吗？'))return;
  const w=+$('width').value,h=Math.max(1,Math.round(w*source.height/source.width));
  if(h>320||w*h>51200){toast('图片比例过长，请先裁剪或减少横向格数');return}
  const tmp=document.createElement('canvas');tmp.width=w;tmp.height=h;const c=tmp.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(source,0,0,w,h);
  const palette=chosenPalette(),cells=BeadCore.quantize(c.getImageData(0,0,w,h).data,palette,+$('limit').value);
  setPattern({w,h,cells,colors:Object.fromEntries(palette.map(p=>[p.code,p.hex]))},$('title').value);toast('图纸已生成');
}
function pushHistory(){history.push(pattern.cells.slice());if(history.length>30)history.shift();$('undo').disabled=false}
function draw(target,p,cell,labels,grid,padding=0){
  const c=target.getContext('2d');c.clearRect(0,0,target.width,target.height);
  p.cells.forEach((code,i)=>{if(!code)return;const x=padding+(i%p.w)*cell,y=padding+Math.floor(i/p.w)*cell;c.fillStyle=p.colors[code];c.fillRect(x,y,cell,cell);if(labels&&cell>=16){const [r,g,b]=BeadCore.rgb(p.colors[code]);c.fillStyle=(r*.299+g*.587+b*.114)>145?'#302431':'#fff';c.textAlign='center';c.textBaseline='middle';c.font=Math.max(7,Math.floor(cell*.3))+'px sans-serif';c.fillText(code,x+cell/2,y+cell/2)}});
  if(grid){for(let x=0;x<=p.w;x++){c.beginPath();c.strokeStyle=x%10===0?'#704458aa':'#70445833';c.lineWidth=x%10===0?1.3:.6;c.moveTo(padding+x*cell,padding);c.lineTo(padding+x*cell,padding+p.h*cell);c.stroke()}for(let y=0;y<=p.h;y++){c.beginPath();c.strokeStyle=y%10===0?'#704458aa':'#70445833';c.lineWidth=y%10===0?1.3:.6;c.moveTo(padding,padding+y*cell);c.lineTo(padding+p.w*cell,padding+y*cell);c.stroke()}}
}
function thumb(p){const c=document.createElement('canvas');c.width=p.w*5;c.height=p.h*5;draw(c,p,5,false,false);return c.toDataURL()}
function render(){
  if(!pattern)return;const cell=+$('zoom').value;$('canvas').width=pattern.w*cell;$('canvas').height=pattern.h*cell;$('canvas').hidden=false;$('empty').hidden=true;draw($('canvas'),pattern,cell,$('codes').checked,$('grid').checked);
  const counts=BeadCore.counts(pattern.cells),rows=Object.keys(counts).sort((a,b)=>counts[b]-counts[a]);$('total').textContent=Object.values(counts).reduce((a,b)=>a+b,0).toLocaleString();$('used').textContent=rows.length;$('dimensions').textContent=pattern.w+' × '+pattern.h+' 格';$('undo').disabled=!history.length;
  $('colorList').replaceChildren();for(const code of rows){const b=document.createElement('button');b.className='color-row'+(code===selected?' selected':'');const dot=document.createElement('i');dot.style.background=pattern.colors[code];const text=document.createTextNode(code),n=document.createElement('span');n.textContent=counts[code]+' 颗';b.append(dot,text,n);b.onclick=()=>{selected=code;$('paintColor').value=code;render()};$('colorList').append(b)}
  ['save','csv','png'].forEach(id=>$(id).disabled=false);$('status').textContent='画笔 '+selected+' · 透明格不计入豆数';$('after').src=thumb(pattern);$('after').hidden=false;$('afterEmpty').hidden=true;$('paintColor').value=selected;
}
function paint(e){
  if(!pattern)return;const rect=$('canvas').getBoundingClientRect(),x=Math.floor((e.clientX-rect.left)/rect.width*pattern.w),y=Math.floor((e.clientY-rect.top)/rect.height*pattern.h);
  if(x<0||y<0||x>=pattern.w||y>=pattern.h)return;const i=y*pattern.w+x;if(i===lastCell)return;lastCell=i;
  const next=$('mode').value==='erase'?null:selected;const old=pattern.cells[i];if(old===next)return;pattern.colors[selected]=pattern.colors[selected]||colorMap[selected];if($('mode').value==='replace'){pattern.cells=pattern.cells.map(c=>c===old?next:c);drag=false}else pattern.cells[i]=next;render();
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
['width','limit'].forEach(id=>$(id).oninput=()=>$(id+'Value').textContent=$(id).value+(id==='width'?' 格':' 色'));
all('[data-size]').forEach(b=>b.onclick=()=>{$('width').value=b.dataset.size;$('width').oninput()});
['grid','codes','zoom'].forEach(id=>$(id).oninput=render);
$('convert').onclick=convert;$('undo').onclick=()=>{if(history.length){pattern.cells=history.pop();render()}};
$('blank').onclick=()=>{if(pattern&&!confirm('新建空白图纸？未保存的编辑将被替换。'))return;loadId++;resetSource();const w=+$('width').value;setPattern({w,h:w,cells:Array(w*w).fill(null),colors:{...colorMap}},'空白练习图纸')};
$('png').onclick=exportPNG;$('csv').onclick=()=>{if(pattern)download(new Blob(['\uFEFF'+BeadCore.csv(pattern)],{type:'text/csv;charset=utf-8'}),name()+'.csv')};$('save').onclick=saveWork;
for(const c of MARD){const o=document.createElement('option');o.value=c.code;o.textContent=c.code+' · '+c.family;$('paintColor').append(o)}
$('paintColor').value=selected;$('paintColor').onchange=()=>{selected=$('paintColor').value;render()};
$('originalButton').onclick=()=>{if(source){$('originalImage').src=source.src;$('originalDialog').showModal()}};
$('closeOriginal').onclick=()=>$('originalDialog').close();$('searchColor').oninput=chart;
['calcW','calcH','pitch','need','extra'].forEach(id=>$(id).oninput=calc);chart();calc();route();
