import {BrowserOCR, id, canvasFromImage, loadImage, orderBlocks} from './ocr.js';
import {createHWPX} from './hwpx.js';

const $=s=>document.querySelector(s);
const state={pages:[],active:null,busy:false,ocr:null,cropping:false,selection:null,anchor:null,dirty:false};
const types={text:'문단',question:'문제',box:'보기 표',choice:'선지',image:'그림'};
let templatePromise;
const page=()=>state.pages.find(p=>p.id===state.active);
function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;}
function notice(message,error=false){const n=$('#notice');n.textContent=message;n.classList.toggle('error',error);n.hidden=!message;}
function options(){return {title:$('#document-name').value.trim()||'나의 문제지',columns:Number($('#output-columns').value),fontSize:Number($('#font-size').value),source:$('#source-label').value.trim(),endnotes:$('#endnotes').checked};}
function markDirty(){state.dirty=true;updateActions();}
function download(data,type,name){const url=URL.createObjectURL(new Blob([data],{type}));const a=el('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
function fileName(ext){return (options().title.replace(/[\\/:*?"<>|\x00-\x1f]/g,'_').slice(0,90)||'나의 문제지')+ext;}
function updateActions(){
  const has=state.pages.some(p=>p.blocks.length),pending=state.pages.filter(p=>!p.processed).length;
  $('#run-ocr').disabled=state.busy||!pending;
  $('#run-ocr').textContent=pending&&pending!==state.pages.length?`남은 ${pending}장 읽기`:'전체 사진 읽기';
  $('#save-hwpx').disabled=state.busy||!has;
  $('#save-project').disabled=state.busy||!state.pages.length;
  $('#copy-text').disabled=state.busy||!has;
  $('#add-block').disabled=state.busy||!page();
  $('#rotate').disabled=state.busy||!page();$('#crop-toggle').disabled=state.busy||!page();
  $('#files').disabled=state.busy;$('#load-project').disabled=state.busy;$('#demo').disabled=state.busy;
  $('#layout').disabled=state.busy;$('#red-filter').disabled=state.busy;
  $('#cancel-ocr').hidden=!state.busy;
  $('#page-count').textContent=`${state.pages.length}장`;
  const blocks=page()?.blocks||[];
  $('#block-count').textContent=`${blocks.length}개 블록`;
  const low=blocks.filter(b=>b.type!=='image'&&!b.reviewed&&b.confidence<85).length;
  $('#review-count').textContent=low?`확인할 블록 ${low}개`:blocks.length?'원본과 대조하며 수정하세요':'인식 후 수정할 수 있어요';
  $('#review-count').classList.toggle('needs-review',low>0);
  document.querySelectorAll('.workflow>span').forEach((e,i)=>e.classList.toggle('active',i===(has?2:state.pages.length?1:0)));
}
function renderPages(){
  const list=$('#page-list');list.replaceChildren();
  for(const [index,p] of state.pages.entries()){
    const row=el('li','page-item'+(p.id===state.active?' selected':''));
    const select=el('button','page-select');select.type='button';select.setAttribute('aria-label',`${index+1}번째 사진 ${p.name}`);
    const img=el('img');img.src=p.src;img.alt='';const info=el('span','page-info');info.append(el('strong',null,p.name),el('small',null,`${index+1}장 · ${p.processed?'인식 완료':p.error?'인식 실패':'대기 중'}`));select.append(img,info);select.onclick=()=>selectPage(p.id);row.append(select);
    const actions=el('span','page-buttons');
    const up=el('button','icon-button','↑');up.title='사진 순서 앞으로';up.setAttribute('aria-label',`${p.name} 순서 앞으로`);up.disabled=index===0||state.busy;up.onclick=()=>{[state.pages[index-1],state.pages[index]]=[p,state.pages[index-1]];markDirty();renderPages();};
    const remove=el('button','icon-button','×');remove.title='사진 삭제';remove.setAttribute('aria-label',`${p.name} 삭제`);remove.disabled=state.busy;remove.onclick=()=>{
      if(p.blocks.length&&!confirm('이 사진과 인식 결과를 삭제할까요?'))return;
      state.pages=state.pages.filter(x=>x.id!==p.id);if(state.active===p.id)state.active=state.pages[Math.max(0,index-1)]?.id||null;markDirty();renderAll();
    };actions.append(up,remove);row.append(actions);list.append(row);
  }
}
function selectPage(value){state.active=value;cancelCrop();renderAll();}
function renderSource(){
  const p=page();$('#empty-source').hidden=!!p;$('#image-stage').hidden=!p;
  if(p){$('#source-image').src=p.src;$('#source-page-label').textContent=`${state.pages.indexOf(p)+1} / ${state.pages.length}`;renderRegions();}
  else{$('#source-image').removeAttribute('src');$('#source-page-label').textContent='사진을 선택해 주세요';}
}
function renderRegions(){
  const overlay=$('#crop-overlay');overlay.replaceChildren();
  for(const [i,r] of (page()?.regions||[]).entries()){
    const rect=el('div','figure-rect');Object.assign(rect.style,{left:`${r.x*100}%`,top:`${r.y*100}%`,width:`${r.w*100}%`,height:`${r.h*100}%`});rect.append(el('span',null,`그림 ${i+1}`));overlay.append(rect);
  }
}
function renderEditor(){
  const root=$('#editor');root.replaceChildren();const p=page();
  if(!p?.blocks.length){
    const empty=el('div','empty-result');empty.append(el('span','text-symbol','Aa'),el('h3',null,p?'사진을 읽으면 글자가 나타납니다':'편집할 글자가 여기에 나타납니다'),el('p',null,p?'그림 영역을 먼저 지정하면 해당 부분은 글자로 읽지 않습니다.':'사진을 추가하고 전체 사진 읽기를 눌러 주세요.'));root.append(empty);return;
  }
  for(const [index,b] of p.blocks.entries()){
    const card=el('article','block-card'+(!b.reviewed&&b.confidence<85?' low-confidence':''));card.dataset.type=b.type;
    const head=el('div','block-header');
    const select=el('select');select.setAttribute('aria-label',`${index+1}번째 블록 종류`);select.disabled=state.busy||b.type==='image';
    for(const [value,label]of Object.entries(types)){if(value==='image'&&b.type!=='image')continue;const o=el('option',null,label);o.value=value;o.selected=value===b.type;select.append(o);}
    select.onchange=()=>{b.type=select.value;markDirty();renderEditor();};head.append(select);
    if(!b.reviewed&&b.confidence<85){head.append(el('span','confidence','원본 확인'));}else head.append(el('span','spacer'));
    if(b.type!=='image'){
      const checked=el('button','icon-button',b.reviewed?'확인됨':'확인');checked.title='원본 확인 완료';checked.disabled=state.busy;checked.onclick=()=>{b.reviewed=!b.reviewed;markDirty();renderEditor();updateActions();};head.append(checked);
    }
    for(const [direction,label,delta]of [['↑','앞으로',-1],['↓','뒤로',1]]){
      const btn=el('button','icon-button',direction);btn.setAttribute('aria-label',`${index+1}번째 블록 ${label}`);btn.disabled=state.busy||!p.blocks[index+delta];btn.onclick=()=>{[p.blocks[index],p.blocks[index+delta]]=[p.blocks[index+delta],b];markDirty();renderEditor();};head.append(btn);
    }
    const remove=el('button','icon-button','×');remove.setAttribute('aria-label',`${index+1}번째 블록 삭제`);remove.disabled=state.busy;remove.onclick=()=>{p.blocks.splice(index,1);if(b.regionId)p.regions=p.regions.filter(r=>r.id!==b.regionId);markDirty();renderEditor();renderRegions();updateActions();};head.append(remove);card.append(head);
    if(b.type==='image'){
      const figure=el('div','block-figure');const img=el('img');img.src=b.src;img.alt=b.text||'잘라낸 그림';const caption=el('input');caption.value=b.text;caption.placeholder='그림 설명 · 선택';caption.setAttribute('aria-label','그림 설명');caption.disabled=state.busy;caption.oninput=()=>{b.text=caption.value;markDirty();};figure.append(img,caption);card.append(figure);
    }else{
      const textarea=el('textarea');textarea.value=b.text;textarea.setAttribute('aria-label',`${index+1}번째 ${types[b.type]} 내용`);textarea.spellcheck=false;textarea.disabled=state.busy;
      textarea.oninput=()=>{b.text=textarea.value;b.reviewed=true;card.classList.remove('low-confidence');autosize(textarea);markDirty();};card.append(textarea);
    }
    root.append(card);
  }
  requestAnimationFrame(()=>root.querySelectorAll('textarea').forEach(autosize));
}
function autosize(area){area.style.height='auto';area.style.height=Math.max(85,area.scrollHeight+2)+'px';}
function renderAll(){renderPages();renderSource();renderEditor();updateActions();}

async function addFiles(files){
  if(state.busy)return;notice('');
  for(const file of [...files]){
    if(state.pages.length>=20){notice('한 번에 사진 20장까지 작업할 수 있습니다.',true);break;}
    if(!/^image\/(jpeg|png|webp)$/.test(file.type)){notice('JPG, PNG, WEBP 사진을 선택해 주세요. HEIC는 JPG로 변환해 주세요.',true);continue;}
    if(file.size>25*1024*1024){notice(`${file.name}: 25MB 이하의 사진을 선택해 주세요.`,true);continue;}
    const url=URL.createObjectURL(file);
    try{const canvas=await canvasFromImage(url,3000);const p={id:id(),name:file.name,src:canvas.toDataURL('image/jpeg',.93),width:canvas.width,height:canvas.height,blocks:[],regions:[],processed:false};state.pages.push(p);state.active=p.id;markDirty();}catch{notice(`${file.name}: 사진을 열 수 없습니다.`,true);}finally{URL.revokeObjectURL(url);}
  }
  renderAll();$('#files').value='';
}
$('#files').onchange=e=>addFiles(e.target.files);
const drop=$('#file-drop');drop.ondragover=e=>{e.preventDefault();drop.classList.add('dragover');};drop.ondragleave=()=>drop.classList.remove('dragover');drop.ondrop=e=>{e.preventDefault();drop.classList.remove('dragover');addFiles(e.dataTransfer.files);};

$('#demo').onclick=async()=>{
  if(state.pages.length>=20)return;
  await document.fonts.ready;
  const canvas=document.createElement('canvas');canvas.width=1300;canvas.height=1720;const c=canvas.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,1300,1720);
  c.fillStyle='#1c2440';c.font='bold 42px sans-serif';c.fillText('과학 연습 문제',80,100);c.font='25px sans-serif';c.fillText('한글 렌즈 · 인식 확인용 예제',80,150);
  c.strokeStyle='#b7bece';c.beginPath();c.moveTo(650,200);c.lineTo(650,1630);c.stroke();
  const lines=[['1. 속력에 대한 설명으로 옳은 것은?',80,260],['① 단위 시간 동안 이동한 거리이다.',80,315],['② 시간이 길수록 항상 빠르다.',80,365],['③ 물체의 질량과 같다.',80,415],['2. 다음 보기에서 옳은 것을 고르시오.',80,550],['<보기>',100,620],['ㄱ. 속력의 단위는 m/s이다.',100,680],['ㄴ. 같은 거리에서 시간이 짧으면 빠르다.',100,735],['① ㄱ     ② ㄴ     ③ ㄱ, ㄴ',80,850],['3. 다음 그래프를 보고 답하시오.',700,260],['0초부터 4초까지 이동한 거리는?',700,780],['① 4 m     ② 8 m     ③ 16 m',700,840],['4. 생물의 유전에 대한 설명이다.',700,1040],['부모의 형질은 자손에게 전달된다.',700,1100],['유전자는 유전 정보를 가진다.',700,1160]];
  c.font='27px sans-serif';for(const[t,x,y]of lines)c.fillText(t,x,y);c.strokeStyle='#555';c.strokeRect(80,580,525,195);
  c.lineWidth=3;c.beginPath();c.moveTo(770,640);c.lineTo(770,360);c.moveTo(770,640);c.lineTo(1170,640);c.stroke();c.strokeStyle='#2442d2';c.beginPath();c.moveTo(770,500);c.lineTo(1110,500);c.stroke();c.fillText('속력 (m/s)',785,355);c.fillText('시간 (s)',1040,705);c.fillText('2',725,512);c.fillText('0',747,682);c.fillText('4',1100,682);
  const p={id:id(),name:'과학 연습 예제.jpg',src:canvas.toDataURL('image/jpeg',.96),width:1300,height:1720,blocks:[],regions:[],processed:false};state.pages.push(p);state.active=p.id;markDirty();renderAll();notice('예제 사진을 추가했습니다. 그래프를 그림 영역으로 지정한 다음 전체 사진 읽기를 눌러 보세요.');
};

$('#rotate').onclick=async()=>{
  const p=page();if(!p)return;
  if((p.blocks.length||p.regions.length)&&!confirm('회전하면 이 사진의 인식 결과와 그림 영역이 초기화됩니다. 회전할까요?'))return;
  const img=await loadImage(p.src),c=document.createElement('canvas');c.width=img.height;c.height=img.width;const x=c.getContext('2d');x.translate(c.width,0);x.rotate(Math.PI/2);x.drawImage(img,0,0);p.src=c.toDataURL('image/jpeg',.94);p.width=c.width;p.height=c.height;p.blocks=[];p.regions=[];p.processed=false;markDirty();cancelCrop();renderAll();
};
$('#zoom').onchange=()=>{$('#image-stage').style.width=(Number($('#zoom').value)*100)+'%';};
function cancelCrop(){state.cropping=false;state.selection=null;state.anchor=null;$('#image-stage').classList.remove('cropping');$('#selection-box').hidden=true;$('#crop-actions').hidden=true;$('#add-crop').disabled=true;$('#crop-toggle').textContent='그림 영역 지정';}
$('#crop-toggle').onclick=()=>{if(state.cropping){cancelCrop();return;}state.cropping=true;$('#image-stage').classList.add('cropping');$('#crop-actions').hidden=false;$('#crop-toggle').textContent='영역 지정 중';};
$('#cancel-crop').onclick=cancelCrop;
function point(e){const r=$('#source-image').getBoundingClientRect();return{x:Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))};}
function setSelection(a,b){state.selection={x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),w:Math.abs(a.x-b.x),h:Math.abs(a.y-b.y)};const s=state.selection;Object.assign($('#selection-box').style,{left:s.x*100+'%',top:s.y*100+'%',width:s.w*100+'%',height:s.h*100+'%'});$('#selection-box').hidden=false;$('#add-crop').disabled=s.w<.005||s.h<.005;}
let dragStart=null;
$('#image-stage').onpointerdown=e=>{if(!state.cropping)return;e.preventDefault();dragStart=point(e);$('#image-stage').setPointerCapture(e.pointerId);};
$('#image-stage').onpointermove=e=>{if(!state.cropping||!dragStart)return;const p=point(e);if(Math.abs(p.x-dragStart.x)+Math.abs(p.y-dragStart.y)>.008)setSelection(dragStart,p);};
$('#image-stage').onpointerup=e=>{
  if(!state.cropping||!dragStart)return;const p=point(e),distance=Math.abs(p.x-dragStart.x)+Math.abs(p.y-dragStart.y);
  if(distance>.008){setSelection(dragStart,p);state.anchor=null;}
  else if(state.anchor){setSelection(state.anchor,p);state.anchor=null;}
  else{state.anchor=p;setSelection(p,{x:p.x+.001,y:p.y+.001});}
  dragStart=null;
};
$('#add-crop').onclick=async()=>{
  const p=page(),s=state.selection;if(!p||!s||s.w<.005||s.h<.005)return;
  const image=await loadImage(p.src),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(s.w*image.width));canvas.height=Math.max(1,Math.round(s.h*image.height));canvas.getContext('2d').drawImage(image,s.x*image.width,s.y*image.height,canvas.width,canvas.height,0,0,canvas.width,canvas.height);
  const region={...s,id:id(),src:canvas.toDataURL('image/png'),width:canvas.width,height:canvas.height};p.regions.push(region);
  if(p.processed){
    p.blocks=p.blocks.filter(b=>{if(b.type==='image'||!b.bbox)return true;const x=(b.bbox.x0+b.bbox.x1)/2,y=(b.bbox.y0+b.bbox.y1)/2;return !(x>s.x&&x<s.x+s.w&&y>s.y&&y<s.y+s.h);});
    const block={id:id(),type:'image',src:region.src,width:region.width,height:region.height,regionId:region.id,text:'',column:Math.min((p.columns||2)-1,Math.floor(s.x*(p.columns||2))),bbox:{x0:s.x,y0:s.y,x1:s.x+s.w,y1:s.y+s.h},reviewed:true};
    // Insert into the current edited order without re-sorting the user's changes.
    const index=p.blocks.findIndex(b=>b.column>block.column||(b.column===block.column&&(b.bbox?.y0||0)>s.y));if(index<0)p.blocks.push(block);else p.blocks.splice(index,0,block);
  }
  cancelCrop();markDirty();renderAll();notice('그림을 추가했습니다. 인식 결과에서 삽입 위치를 위·아래로 조절할 수 있습니다.');
};

$('#run-ocr').onclick=async()=>{
  const pending=state.pages.filter(p=>!p.processed);if(!pending.length||state.busy)return;
  state.busy=true;cancelCrop();notice('');$('#progress-panel').hidden=false;
  let pageIndex=0,column=0;const columns=Number($('#layout').value),removeRed=$('#red-filter').checked;
  const report=m=>{const total=pending.length*columns,done=pageIndex*columns+column,progress=m.recognizing?(done+m.progress)/total:done/total;$('#progress').value=progress;$('#progress-percent').textContent=Math.round(progress*100)+'%';$('#progress-title').textContent=m.status;$('#progress-detail').textContent=`${pageIndex+1} / ${pending.length}장 · ${column+1} / ${columns}단${m.recognizing?'':' · 처음에는 모델을 불러오는 데 시간이 걸립니다.'}`;};
  state.ocr=new BrowserOCR(report);renderAll();
  try{
    await state.ocr.init();
    for(pageIndex=0;pageIndex<pending.length;pageIndex++){
      const p=pending[pageIndex];state.active=p.id;column=0;renderAll();
      const blocks=await state.ocr.recognizePage(p,columns,removeRed,c=>{column=c;});
      p.blocks=[...blocks,...p.blocks.filter(b=>b.manual)];p.processed=true;p.columns=columns;p.error=false;markDirty();renderAll();
    }
    $('#progress').value=1;$('#progress-percent').textContent='100%';$('#progress-title').textContent='인식 완료';$('#progress-detail').textContent='글자와 그림 위치를 확인한 뒤 HWPX를 내려받으세요.';
    notice('인식이 끝났습니다. 작은 기호·분수·필기와 겹친 글자는 원본과 대조해 주세요.');
    setMobilePane('result');
  }catch(error){notice(state.ocr?.cancelled?'인식을 중단했습니다. 완료된 사진의 결과는 유지됩니다.':`인식 중 문제가 생겼습니다: ${error.message}`,!state.ocr?.cancelled);$('#progress-title').textContent=state.ocr?.cancelled?'인식 중단':'다시 시도할 수 있어요';if(pending[pageIndex])pending[pageIndex].error=true;}
  finally{await state.ocr?.close();state.ocr=null;state.busy=false;renderAll();}
};
$('#cancel-ocr').onclick=()=>{if(state.ocr){$('#progress-title').textContent='인식을 중단하는 중';state.ocr.cancel();}};
$('#add-block').onclick=()=>{const p=page();if(!p)return;p.blocks.push({id:id(),type:'text',text:'',manual:true,confidence:100,reviewed:true,column:0,bbox:{x0:0,y0:1,x1:1,y1:1}});markDirty();renderAll();$('#editor').lastElementChild?.querySelector('textarea')?.focus();};

$('#save-hwpx').onclick=async()=>{
  if(state.busy)return;
  if(state.pages.some(p=>!p.processed&&!p.blocks.length)){notice('아직 읽지 않은 사진이 있습니다. 남은 사진을 읽거나 목록에서 삭제한 뒤 저장해 주세요.',true);return;}
  const btn=$('#save-hwpx');btn.disabled=true;btn.textContent='문서 만드는 중';
  try{templatePromise||=fetch(new URL('./template.json',import.meta.url)).then(r=>{if(!r.ok)throw new Error('문서 서식을 불러올 수 없습니다.');return r.json();});const data=await createHWPX(state.pages,options(),await templatePromise,window.JSZip);download(data,'application/vnd.hancom.hwpx',fileName('.hwpx'));notice('HWPX를 저장했습니다. 글자·보기 표는 편집할 수 있고, 그림은 이미지로 들어갑니다. 최종 쪽 배치는 한글에서 확인해 주세요.');}catch(e){templatePromise=null;notice(e.message,true);}finally{btn.textContent='HWPX 다운로드';updateActions();}
};
$('#save-project').onclick=()=>{download(JSON.stringify({format:'hangul-lens',version:1,options:options(),pages:state.pages},null,2),'application/json',fileName('.json'));state.dirty=false;notice('사진과 수정 내용이 함께 저장됐습니다. 작업 불러오기로 이어서 편집할 수 있습니다.');};
function validImage(src){return typeof src==='string'&&/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(src);}
function boundedBox(b){if(!b||!['x0','y0','x1','y1'].every(k=>Number.isFinite(b[k])&&b[k]>=0&&b[k]<=1))return{x0:0,y0:0,x1:1,y1:1};return b;}
function validateProject(data){
  if(data.format!=='hangul-lens'||data.version!==1||!Array.isArray(data.pages)||data.pages.length>20)throw new Error('한글 렌즈에서 저장한 작업 파일을 선택해 주세요.');
  return data.pages.map(p=>{
    if(!validImage(p.src)||!Array.isArray(p.blocks)||p.blocks.length>2000||!Array.isArray(p.regions)||p.regions.length>100)throw new Error('사진 또는 편집 데이터가 올바르지 않습니다.');
    const regions=p.regions.map(r=>{
      if(!validImage(r.src)||!['x','y','w','h'].every(k=>Number.isFinite(r[k])&&r[k]>=0&&r[k]<=1)||r.x+r.w>1.001||r.y+r.h>1.001)throw new Error('그림 영역 데이터가 올바르지 않습니다.');
      return {...r,width:Math.max(1,Number(r.width)||1),height:Math.max(1,Number(r.height)||1)};
    });
    const blocks=p.blocks.map(b=>{
      if(!Object.hasOwn(types,b.type)||typeof b.text!=='string'||b.text.length>100000||(b.type==='image'&&!validImage(b.src)))throw new Error('편집 내용이 올바르지 않습니다.');
      return {...b,id:id(),bbox:boundedBox(b.bbox),column:b.column===1?1:0,confidence:Number.isFinite(b.confidence)?b.confidence:0,reviewed:!!b.reviewed};
    });
    return {...p,id:id(),name:String(p.name||'사진').slice(0,150),blocks,regions,processed:!!p.processed,columns:p.columns===1?1:2};
  });
}
$('#load-project').onchange=async e=>{
  const file=e.target.files[0];if(!file)return;
  try{if(file.size>100*1024*1024)throw new Error('100MB 이하의 작업 파일을 선택해 주세요.');const data=JSON.parse(await file.text());const pages=validateProject(data);if(state.dirty&&!confirm('현재 작업을 불러온 파일로 바꿀까요? 저장하지 않은 수정 내용은 사라집니다.'))return;state.pages=pages;state.active=pages[0]?.id||null;const o=data.options||{};$('#document-name').value=String(o.title||'나의 문제지').slice(0,100);$('#source-label').value=String(o.source||'').slice(0,100);$('#output-columns').value=o.columns===1?'1':'2';$('#font-size').value=['9','10','11','12'].includes(String(o.fontSize))?String(o.fontSize):'10';$('#endnotes').checked=!!o.endnotes;state.dirty=false;cancelCrop();renderAll();notice('저장한 작업을 불러왔습니다.');}catch(err){notice(err.message,true);}finally{e.target.value='';}
};
$('#copy-text').onclick=async()=>{const text=state.pages.flatMap(p=>p.blocks.map(b=>b.text)).filter(Boolean).join('\n\n');try{await navigator.clipboard.writeText(text);notice('글자를 복사했습니다.');}catch{download(text,'text/plain;charset=utf-8',fileName('.txt'));notice('클립보드 대신 텍스트 파일로 저장했습니다.');}};
function setMobilePane(name){$('.panes').dataset.mobilePane=name;document.querySelectorAll('[data-pane]').forEach(b=>b.classList.toggle('selected',b.dataset.pane===name));}
document.querySelectorAll('[data-pane]').forEach(b=>b.onclick=()=>setMobilePane(b.dataset.pane));
for(const selector of ['#document-name','#output-columns','#font-size','#source-label','#endnotes'])$(selector).addEventListener('change',()=>{if(state.pages.length)markDirty();});
window.addEventListener('beforeunload',e=>{if(state.dirty||state.busy){e.preventDefault();e.returnValue='';}});

// Optional WebMCP access uses the same editor state. No model or network dependency.
const context=document.modelContext,lifecycle=new AbortController();
if(context?.registerTool){
  const tools=[
    {
      name:'read_ocr_document',title:'인식한 문서 읽기',description:'현재 사진과 편집 블록을 읽습니다.',
      inputSchema:{type:'object',properties:{},additionalProperties:false},
      annotations:{readOnlyHint:true,untrustedContentHint:true},
      execute:()=>({pages:state.pages.map(p=>({
        id:p.id,name:p.name,processed:p.processed,
        blocks:p.blocks.map(b=>({id:b.id,type:b.type,text:b.text,reviewed:b.reviewed}))
      }))})
    },
    {name:'update_ocr_block',title:'인식 결과 수정',description:'현재 문서의 텍스트 블록을 수정하고 확인 완료로 표시합니다.',inputSchema:{type:'object',properties:{id:{type:'string'},text:{type:'string'}},required:['id','text'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:true},execute:input=>{if(state.busy)throw new Error('인식이 끝난 후 수정해 주세요.');if(!input||typeof input.id!=='string'||typeof input.text!=='string'||input.text.length>100000)throw new Error('id와 text를 확인해 주세요.');const b=state.pages.flatMap(p=>p.blocks).find(b=>b.id===input.id&&b.type!=='image');if(!b)throw new Error('텍스트 블록을 찾을 수 없습니다.');b.text=input.text;b.reviewed=true;markDirty();renderEditor();return{id:b.id,text:b.text,reviewed:true};}}
  ];
  for(const tool of tools){try{Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}}
  window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
renderAll();
