// getRandomValues also works in local HTTP previews; deployed pages use HTTPS.
export const id = () => crypto.randomUUID?.() || Array.from(crypto.getRandomValues(new Uint8Array(16)), n=>n.toString(16).padStart(2,'0')).join('');

export function classify(text) {
  if (/^\s*(?:\d{1,3}[.)](?!\d)|[【\[]?\s*(?:서술형|논술형)\s*\d)/.test(text)) return 'question';
  if (/^\s*(?:[①②③④⑤⑥⑦⑧⑨⑩]|@(?=\s))/.test(text)) return 'choice';
  if (/^\s*(?:[<〈《]?\s*보\s*기\s*[>〉》]?\s*$|[ㄱㄴㄷㄹㅁㅂ]\s*[.．])/.test(text)) return 'box';
  return 'text';
}

function union(a, b) {
  return { x0: Math.min(a.x0,b.x0), y0:Math.min(a.y0,b.y0), x1:Math.max(a.x1,b.x1), y1:Math.max(a.y1,b.y1) };
}

// OCR lines remain traceable to source coordinates. Never infer or correct answers.
export function blocksFromResult(data, column, offsetX = 0) {
  const results = [];
  // The engine's plain text preserves Korean spacing better than its JSON word
  // joins in some WASM builds. Reuse it only when every non-space character agrees.
  const textByCharacters=new Map();
  for(const raw of String(data.text||'').split('\n')){
    const text=raw.trim();if(!text)continue;
    const key=text.replace(/\s/g,'');
    if(!textByCharacters.has(key))textByCharacters.set(key,[]);
    textByCharacters.get(key).push(text);
  }
  for (const block of data.blocks || []) {
    for (const paragraph of block.paragraphs || []) {
      let current = null, previousBox = null;
      for (const line of paragraph.lines || []) {
        const raw = String(line.text || '').trim();
        const text = textByCharacters.get(raw.replace(/\s/g,''))?.shift() || raw;
        if (!text) continue;
        const box = line.bbox || paragraph.bbox;
        const bbox = {x0:box.x0 + offsetX, y0:box.y0, x1:box.x1 + offsetX, y1:box.y1};
        const type = classify(text);
        const score = Number.isFinite(line.confidence) ? line.confidence : data.confidence ?? 0;
        const height = Math.max(1, bbox.y1 - bbox.y0);
        const near = previousBox && bbox.y0 >= previousBox.y0
          && bbox.y0 - previousBox.y1 <= 1.4 * Math.max(height, previousBox.y1 - previousBox.y0);
        const passage = /^\s*[\[【]\s*\d+\s*[~～\-–]/.test(text);
        // A blank region can be an illustration. Never bridge it with one paragraph.
        // Keep ambiguous '@' as read; only keep it out of the question sentence.
        const continues = current && near && !passage
          && (type === 'text' || (type === 'box' && current.type === 'box'));
        previousBox = bbox;
        if (continues) {
          current.text += (current.type === 'box' ? '\n' : ' ') + text;
          current.bbox = union(current.bbox, bbox);
          current.confidence = Math.min(current.confidence, score);
        } else {
          current = {id:id(),type,text,bbox,column,confidence:score,reviewed:false};
          results.push(current);
        }
      }
    }
  }
  if (!results.length && data.text?.trim()) results.push({id:id(),type:'text',text:data.text.trim(),column,confidence:data.confidence||0,reviewed:false,bbox:{x0:offsetX,y0:0,x1:offsetX+1,y1:1}});
  return results;
}

export function orderBlocks(blocks) {
  return [...blocks].sort((a,b) => (a.column-b.column) || ((a.bbox?.y0||0)-(b.bbox?.y0||0)) || ((a.bbox?.x0||0)-(b.bbox?.x0||0)));
}

export async function loadImage(src) {
  const image = new Image();
  image.src = src;
  await image.decode();
  return image;
}

export async function canvasFromImage(src, maxSide = 4400) {
  const img = await loadImage(src);
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(img,0,0,canvas.width,canvas.height);
  return canvas;
}

export function preprocess(canvas, removeRed) {
  const ctx = canvas.getContext('2d',{willReadFrequently:true});
  const image = ctx.getImageData(0,0,canvas.width,canvas.height);
  const d = image.data, hist = new Uint32Array(256);
  for (let i=0;i<d.length;i+=4) {
    let grey = Math.round(d[i]*.299+d[i+1]*.587+d[i+2]*.114);
    if (removeRed && d[i]-d[i+1]>25 && d[i]-d[i+2]>20) grey=255;
    d[i]=d[i+1]=d[i+2]=grey;hist[grey]++;
  }
  let acc=0,white=255;
  for(let i=0;i<256;i++){acc+=hist[i];if(acc>=canvas.width*canvas.height*.88){white=i;break;}}
  const factor=255/Math.max(white,110);
  for(let i=0;i<d.length;i+=4){const grey=Math.min(255,Math.max(0,(d[i]*factor-128)*1.18+128));d[i]=d[i+1]=d[i+2]=grey;}
  ctx.putImageData(image,0,0);
}


// Find a central whitespace band instead of bisecting printed text.
// Input is a small grayscale/RGBA preview; no OCR or browser APIs are needed.
export function findGutter({data,width,height}) {
  const fallback={ratio:.5,detected:false};
  if(width<40||height<40)return fallback;
  const ink=new Float64Array(width),top=Math.floor(height*.15),bottom=Math.ceil(height*.93);
  for(let y=top;y<bottom;y++)for(let x=0;x<width;x++){
    const i=(y*width+x)*4;
    if((data[i]*.299+data[i+1]*.587+data[i+2]*.114)<170)ink[x]++;
  }
  for(let x=0;x<width;x++)ink[x]/=Math.max(1,bottom-top);
  // A thin printed column divider is not a line of text.
  for(let x=0;x<width;){
    if(ink[x]<.72){x++;continue;}
    let end=x+1;while(end<width&&ink[end]>=.72)end++;
    if(end-x<=Math.max(2,width*.008))ink.fill(0,x,end);
    x=end;
  }
  const sum=new Float64Array(width+1);
  for(let x=0;x<width;x++)sum[x+1]=sum[x]+ink[x];
  const mean=(a,b)=>{a=Math.max(0,Math.floor(a));b=Math.min(width,Math.ceil(b));return (sum[b]-sum[a])/Math.max(1,b-a);};
  let best=null;
  for(let x=Math.ceil(width*.4);x<=Math.floor(width*.6);x++){
    const gap=mean(x-width*.012,x+width*.012);
    const left=mean(x-width*.14,x-width*.04),right=mean(x+width*.04,x+width*.14);
    const support=Math.min(left,right);
    if(support<.012||gap>support*.38)continue;
    const score=gap/Math.max(.02,support)+Math.abs(x/width-.5)*.16;
    if(!best||score<best.score)best={x,score};
  }
  return best?{ratio:best.x/width,detected:true}:fallback;
}

export function summarizePage(page) {
  const blocks=page.blocks||[],texts=blocks.filter(b=>b.type!=='image');
  const questionNumbers=texts.filter(b=>b.type==='question')
    .map(b=>/^\s*(\d{1,3})[.)](?!\d)/.exec(b.text)?.[1]).filter(Boolean).map(Number);
  return {
    width:page.width,height:page.height,processed:!!page.processed,
    split:page.analysis?.split||null,
    characters:texts.reduce((n,b)=>n+String(b.text).replace(/\s/g,'').length,0),
    questionNumbers,
    choiceMarkers:texts.reduce((n,b)=>n+(b.text.match(/[①②③④⑤⑥⑦⑧⑨⑩]/g)||[]).length,0),
    figures:blocks.filter(b=>b.type==='image').length,
    uncertainBlocks:texts.filter(b=>b.confidence<65).length
  };
}

const statuses = {
  'loading tesseract core':'인식 엔진 불러오는 중',
  'initializing tesseract':'인식 엔진 준비 중',
  'loading language traineddata':'한국어·영어 모델 불러오는 중',
  'initializing api':'한국어 인식 준비 중',
  'recognizing text':'글자 읽는 중'
};

export class BrowserOCR {
  constructor(onProgress) {
    this.onProgress=onProgress;this.worker=null;this.cancelled=false;
    this.stopped=new Promise((_,reject)=>{this.stop=reject;});
    this.stopped.catch(()=>{});
  }
  async init() {
    if(!window.Tesseract) throw new Error('OCR 엔진을 불러오지 못했습니다. 연결 상태를 확인하고 새로고침해 주세요.');
    const initializing=window.Tesseract.createWorker('kor+eng',1,{
      workerPath:new URL('./vendor/worker.min.js',import.meta.url).href,
      corePath:new URL('./vendor/',import.meta.url).href,
      langPath:new URL('./models/',import.meta.url).href,
      workerBlobURL:false,
      logger:m=>{if(!this.cancelled)this.onProgress({status:statuses[m.status]||'준비 중',progress:m.progress||0,recognizing:m.status==='recognizing text'});},
      errorHandler:error=>this.stop(new Error(String(error?.message||error)))
    }).then(async worker=>{
      if(this.cancelled){await worker.terminate();throw new Error('인식을 중단했습니다.');}
      this.worker=worker;
    });
    await Promise.race([initializing,this.stopped]);
    await Promise.race([this.worker.setParameters({tessedit_pageseg_mode:'4',preserve_interword_spaces:'1',user_defined_dpi:'300'}),this.stopped]);
  }
  async recognizePage(page, columns, removeRed, onColumn) {
    const canvas=await canvasFromImage(page.src);
    preprocess(canvas,removeRed);
    const ctx=canvas.getContext('2d');
    const probe=document.createElement('canvas'),scale=Math.min(1,720/canvas.width);
    probe.width=Math.round(canvas.width*scale);probe.height=Math.round(canvas.height*scale);
    probe.getContext('2d').drawImage(canvas,0,0,probe.width,probe.height);
    const split=columns===2?findGutter(probe.getContext('2d').getImageData(0,0,probe.width,probe.height)):{ratio:1,detected:false};
    page.analysis={split,width:canvas.width,height:canvas.height};
    const boundary=Math.round(canvas.width*split.ratio),edges=columns===2?[0,boundary,canvas.width]:[0,canvas.width];
    // Selected illustrations stay in original colour. Mask only the OCR input.
    for(const r of page.regions){ctx.fillStyle='#fff';ctx.fillRect(r.x*canvas.width,r.y*canvas.height,r.w*canvas.width,r.h*canvas.height);}
    let all=[];
    for(let c=0;c<columns;c++){
      if(this.cancelled)throw new Error('인식을 중단했습니다.');
      onColumn(c);
      const x=edges[c],end=edges[c+1],padding=24;
      const part=document.createElement('canvas');part.width=end-x+2*padding;part.height=canvas.height+2*padding;
      const partCtx=part.getContext('2d');partCtx.fillStyle='#fff';partCtx.fillRect(0,0,part.width,part.height);
      partCtx.drawImage(canvas,x,0,end-x,canvas.height,padding,padding,end-x,canvas.height);
      const result=await Promise.race([this.worker.recognize(part,{}, {text:true,blocks:true}),this.stopped]);
      const blocks=blocksFromResult(result.data,c,x-padding);
      for(const b of blocks){
        for(const k of ['x0','x1'])b.bbox[k]=Math.max(0,Math.min(1,b.bbox[k]/canvas.width));
        for(const k of ['y0','y1'])b.bbox[k]=Math.max(0,Math.min(1,(b.bbox[k]-padding)/canvas.height));
      }
      all.push(...blocks);
      part.width=part.height=1;
    }
    for(const r of page.regions){all.push({id:id(),type:'image',text:'',src:r.src,width:r.width,height:r.height,regionId:r.id,column:columns===1?0:(r.x+r.w/2<split.ratio?0:1),bbox:{x0:r.x,y0:r.y,x1:r.x+r.w,y1:r.y+r.h},reviewed:true});}
    canvas.width=canvas.height=probe.width=probe.height=1;
    return orderBlocks(all);
  }
  async close(){if(this.worker){const w=this.worker;this.worker=null;await w.terminate();}}
  async cancel(){this.cancelled=true;this.stop(new Error('인식을 중단했습니다.'));await this.close();}
}
