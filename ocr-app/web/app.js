import {BrowserOCR, id, canvasFromImage, loadImage} from './ocr.js';
import {createHWPX} from './hwpx.js';

const $=s=>document.querySelector(s);
const state={pages:[],active:null,busy:false,exporting:false,ocr:null,cropping:false,selection:null,anchor:null,dirty:false};
let templatePromise;
const page=()=>state.pages.find(p=>p.id===state.active);
function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;}
function notice(message,error=false){const n=$('#notice');n.textContent=message;n.classList.toggle('error',error);n.hidden=!message;}
function options(){return {title:$('#document-name').value.trim()||'나의 문제지',columns:Number($('#output-columns').value),fontSize:Number($('#font-size').value),source:$('#source-label').value.trim(),endnotes:$('#endnotes').checked};}
function markDirty(){state.dirty=true;updateActions();}
function download(data,type,name){const url=URL.createObjectURL(new Blob([data],{type}));const a=el('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
function fileName(ext){return (options().title.replace(/[\\/:*?"<>|\x00-\x1f]/g,'_').slice(0,90)||'나의 문제지')+ext;}
function conversionStatus(){
  const completed=state.pages.filter(p=>p.processed).length;
  const hasContent=state.pages.some(p=>p.blocks.length);
  return {total:state.pages.length,completed,busy:state.busy,ready:!!state.pages.length&&completed===state.pages.length&&hasContent};
}
function updateActions(){
  const status=conversionStatus(),pending=status.total-status.completed,locked=state.busy||state.exporting;
  $('#run-ocr').disabled=locked||!pending;
  $('#run-ocr').textContent=pending&&pending!==status.total?`남은 ${pending}장 읽기`:'전체 사진 읽기';
  $('#save-hwpx').disabled=locked||!status.ready;
  $('#rotate').disabled=locked||!page();$('#crop-toggle').disabled=locked||!page();
  $('#files').disabled=locked;$('#demo').disabled=locked;
  $('#layout').disabled=locked;$('#red-filter').disabled=locked;
  $('#cancel-ocr').hidden=!state.busy;
  $('#page-count').textContent=`${status.total}장`;
  $('#conversion-summary').textContent=status.ready?`${status.completed}장 인식 완료 · HWPX 다운로드 준비 완료`:status.total?`${status.completed} / ${status.total}장 인식 완료`:'사진을 읽고 HWPX로 내려받으세요.';
  $('#conversion-summary').classList.toggle('ready',status.ready);
  document.querySelectorAll('.workflow>span').forEach((e,i)=>e.classList.toggle('active',i===(status.ready?2:status.total?1:0)));
}
function renderPages(){
  const list=$('#page-list');list.replaceChildren();
  for(const [index,p] of state.pages.entries()){
    const row=el('li','page-item'+(p.id===state.active?' selected':''));
    const select=el('button','page-select');select.type='button';select.setAttribute('aria-label',`${index+1}번째 사진 ${p.name}`);
    const img=el('img');img.src=p.src;img.alt='';const info=el('span','page-info');info.append(el('strong',null,p.name),el('small',null,`${index+1}장 · ${p.processed?'인식 완료':p.error?'인식 실패':'대기 중'}`));select.append(img,info);select.onclick=()=>selectPage(p.id);row.append(select);
    const actions=el('span','page-buttons');
    const up=el('button','icon-button','↑');up.title='사진 순서 앞으로';up.setAttribute('aria-label',`${p.name} 순서 앞으로`);up.disabled=index===0||state.busy||state.exporting;up.onclick=()=>{[state.pages[index-1],state.pages[index]]=[p,state.pages[index-1]];markDirty();renderAll();};
    const remove=el('button','icon-button','×');remove.title='사진 삭제';remove.setAttribute('aria-label',`${p.name} 삭제`);remove.disabled=state.busy||state.exporting;remove.onclick=()=>{
      if(p.blocks.length&&!confirm('이 사진과 인식 결과를 삭제할까요?'))return;
      state.pages=state.pages.filter(x=>x.id!==p.id);if(state.active===p.id)state.active=state.pages[Math.max(0,index-1)]?.id||null;markDirty();renderAll();
    };actions.append(up,remove);row.append(actions);list.append(row);
  }
}
function selectPage(value){state.active=value;cancelCrop();renderAll();}
function renderSource(){
  const p=page();$('#empty-source').hidden=!!p;$('#image-stage').hidden=!p;
  if(p){$('#source-image').src=p.src;$('#source-page-label').textContent=`${state.pages.indexOf(p)+1} / ${state.pages.length}`;}
  else{$('#source-image').removeAttribute('src');$('#source-page-label').textContent='사진을 선택해 주세요';}
  renderRegions();
}
function invalidatePage(p){p.blocks=[];p.processed=false;p.error=false;$('#progress-panel').hidden=true;}
function renderRegions(){
  const overlay=$('#crop-overlay'),list=$('#region-list'),p=page();overlay.replaceChildren();list.replaceChildren();
  list.hidden=!p?.regions.length;
  for(const [i,r] of (p?.regions||[]).entries()){
    const rect=el('div','figure-rect');Object.assign(rect.style,{left:`${r.x*100}%`,top:`${r.y*100}%`,width:`${r.w*100}%`,height:`${r.h*100}%`});rect.append(el('span',null,`그림 ${i+1}`));overlay.append(rect);
    const remove=el('button','region-chip',`그림 ${i+1} ×`);remove.setAttribute('aria-label',`그림 ${i+1} 영역 해제`);remove.disabled=state.busy||state.exporting;
    remove.onclick=()=>{const wasProcessed=p.processed;p.regions=p.regions.filter(x=>x.id!==r.id);invalidatePage(p);cancelCrop();markDirty();renderAll();notice(wasProcessed?'그림 영역을 해제했습니다. 이 사진을 다시 읽어 주세요.':'그림 영역을 해제했습니다.');};list.append(remove);
  }
}
function renderAll(){renderPages();renderSource();updateActions();}

async function addFiles(files){
  if(state.busy||state.exporting)return;cancelCrop();notice('');$('#progress-panel').hidden=true;
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
  if(state.busy||state.exporting||state.pages.length>=20)return;
  cancelCrop();$('#progress-panel').hidden=true;
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
  const img=await loadImage(p.src),c=document.createElement('canvas');c.width=img.height;c.height=img.width;const x=c.getContext('2d');x.translate(c.width,0);x.rotate(Math.PI/2);x.drawImage(img,0,0);p.src=c.toDataURL('image/jpeg',.94);p.width=c.width;p.height=c.height;p.regions=[];invalidatePage(p);markDirty();cancelCrop();renderAll();
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
  const wasProcessed=p.processed;invalidatePage(p);
  cancelCrop();markDirty();renderAll();notice(wasProcessed?'그림 영역을 추가했습니다. 이 사진을 다시 읽어 주세요.':'그림 영역을 저장했습니다. 변환할 때 원본 그림으로 포함됩니다.');
};

async function readPhotos(){
  const pending=state.pages.filter(p=>!p.processed);if(!pending.length||state.busy||state.exporting)return;
  state.busy=true;cancelCrop();notice('');$('#progress-panel').hidden=false;
  let pageIndex=0,column=0;const columns=Number($('#layout').value),removeRed=$('#red-filter').checked;
  const report=m=>{const total=pending.length*columns,done=pageIndex*columns+column,progress=m.recognizing?(done+m.progress)/total:done/total;$('#progress').value=progress;$('#progress-percent').textContent=Math.round(progress*100)+'%';$('#progress-title').textContent=m.status;$('#progress-detail').textContent=`${pageIndex+1} / ${pending.length}장 · ${column+1} / ${columns}단${m.recognizing?'':' · 처음에는 모델을 불러오는 데 시간이 걸립니다.'}`;};
  state.ocr=new BrowserOCR(report);renderAll();
  try{
    await state.ocr.init();
    for(pageIndex=0;pageIndex<pending.length;pageIndex++){
      const p=pending[pageIndex];state.active=p.id;column=0;renderAll();
      const blocks=await state.ocr.recognizePage(p,columns,removeRed,c=>{column=c;});
      p.blocks=blocks;p.processed=true;p.columns=columns;p.error=false;markDirty();renderAll();
    }
    $('#progress').value=1;$('#progress-percent').textContent='100%';$('#progress-title').textContent='인식 완료';$('#progress-detail').textContent='HWPX를 내려받아 한글에서 글자와 배치를 수정하세요.';
    notice(state.pages.some(p=>p.blocks.length)?'인식이 끝났습니다. HWPX를 내려받아 한글에서 마무리하세요.':'인식된 글자가 없습니다. 사진 방향과 화질을 확인해 다시 추가해 주세요.',!state.pages.some(p=>p.blocks.length));
  }catch(error){notice(state.ocr?.cancelled?'인식을 중단했습니다. 완료된 사진의 결과는 유지됩니다.':`인식 중 문제가 생겼습니다: ${error.message}`,!state.ocr?.cancelled);$('#progress-title').textContent=state.ocr?.cancelled?'인식 중단':'다시 시도할 수 있어요';if(pending[pageIndex])pending[pageIndex].error=true;}
  finally{await state.ocr?.close();state.ocr=null;state.busy=false;renderAll();}
}
$('#run-ocr').onclick=readPhotos;
$('#cancel-ocr').onclick=()=>{if(state.ocr){$('#progress-title').textContent='인식을 중단하는 중';state.ocr.cancel();}};
$('#save-hwpx').onclick=async()=>{
  if(state.busy||state.exporting)return;
  if(state.pages.some(p=>!p.processed)){notice('아직 읽지 않은 사진이 있습니다. 남은 사진을 읽거나 목록에서 삭제한 뒤 저장해 주세요.',true);return;}
  if(!conversionStatus().ready)return;
  state.exporting=true;cancelCrop();renderAll();const btn=$('#save-hwpx');btn.textContent='문서 만드는 중';
  try{templatePromise||=fetch(new URL('./template.json',import.meta.url)).then(r=>{if(!r.ok)throw new Error('문서 서식을 불러올 수 없습니다.');return r.json();});const data=await createHWPX(state.pages,options(),await templatePromise,window.JSZip);download(data,'application/vnd.hancom.hwpx',fileName('.hwpx'));state.dirty=false;notice('HWPX를 저장했습니다. 글자·보기 표는 편집할 수 있고, 그림은 이미지로 들어갑니다. 최종 쪽 배치는 한글에서 확인해 주세요.');}catch(e){templatePromise=null;notice(e.message,true);}finally{state.exporting=false;btn.textContent='HWPX 다운로드';renderAll();}
};
for(const selector of ['#document-name','#output-columns','#font-size','#source-label','#endnotes'])$(selector).addEventListener('change',()=>{if(state.pages.length)markDirty();});
window.addEventListener('beforeunload',e=>{if(state.dirty||state.busy||state.exporting){e.preventDefault();e.returnValue='';}});

// Conversion actions share the same state and implementation as the visible UI.
const context=document.modelContext,lifecycle=new AbortController();
if(context?.registerTool){
  const tools=[
    {name:'read_conversion_status',title:'변환 진행 상태 읽기',description:'사진 수, 인식 완료 수, 다운로드 준비 여부를 읽습니다.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute:conversionStatus},
    {name:'recognize_photos',title:'사진을 한글 문서로 변환',description:'추가한 사진 중 아직 읽지 않은 사진을 브라우저 OCR로 인식합니다.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:true},execute:async()=>{await readPhotos();return conversionStatus();}}
  ];
  for(const tool of tools){try{Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}}
  window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
renderAll();
