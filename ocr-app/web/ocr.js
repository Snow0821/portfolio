// getRandomValues also works in local HTTP previews; deployed pages use HTTPS.
export const id = () => crypto.randomUUID?.() || Array.from(crypto.getRandomValues(new Uint8Array(16)), n=>n.toString(16).padStart(2,'0')).join('');

export function classify(text) {
  if (/^\s*(?:\d{1,3}[.)]|[【\[]?\s*(?:서술형|논술형)\s*\d)/.test(text)) return 'question';
  if (/^\s*[①②③④⑤⑥⑦⑧⑨⑩]/.test(text)) return 'choice';
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
      let current = null;
      for (const line of paragraph.lines || []) {
        const raw = String(line.text || '').trim();
        const text = textByCharacters.get(raw.replace(/\s/g,''))?.shift() || raw;
        if (!text) continue;
        const box = line.bbox || paragraph.bbox;
        const bbox = {x0:box.x0 + offsetX, y0:box.y0, x1:box.x1 + offsetX, y1:box.y1};
        const type = classify(text);
        const score = Number.isFinite(line.confidence) ? line.confidence : data.confidence ?? 0;
        const continues = current && ((type === 'text' && !['choice'].includes(current.type)) || (type === 'box' && current.type === 'box'));
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

export async function canvasFromImage(src, maxSide = 3000) {
  const img = await loadImage(src);
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
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
    await Promise.race([this.worker.setParameters({tessedit_pageseg_mode:'4',preserve_interword_spaces:'0',user_defined_dpi:'300'}),this.stopped]);
  }
  async recognizePage(page, columns, removeRed, onColumn) {
    const canvas=await canvasFromImage(page.src);
    preprocess(canvas,removeRed);
    const ctx=canvas.getContext('2d');
    // Selected illustrations stay as images; mask them only in the OCR input.
    for(const r of page.regions){ctx.fillStyle='#fff';ctx.fillRect(r.x*canvas.width,r.y*canvas.height,r.w*canvas.width,r.h*canvas.height);}
    let all=[];
    for(let c=0;c<columns;c++){
      if(this.cancelled)throw new Error('인식을 중단했습니다.');
      onColumn(c);
      const x=Math.round(c*canvas.width/columns),end=Math.round((c+1)*canvas.width/columns);
      const part=document.createElement('canvas');part.width=end-x;part.height=canvas.height;
      part.getContext('2d').drawImage(canvas,x,0,end-x,canvas.height,0,0,part.width,part.height);
      const result=await Promise.race([this.worker.recognize(part,{}, {text:true,blocks:true}),this.stopped]);
      const blocks=blocksFromResult(result.data,c,x);
      for(const b of blocks){for(const k of ['x0','x1'])b.bbox[k]/=canvas.width;for(const k of ['y0','y1'])b.bbox[k]/=canvas.height;}
      all.push(...blocks);
    }
    for(const r of page.regions){all.push({id:id(),type:'image',text:'',src:r.src,width:r.width,height:r.height,regionId:r.id,column:Math.min(columns-1,Math.floor(r.x*columns)),bbox:{x0:r.x,y0:r.y,x1:r.x+r.w,y1:r.y+r.h},reviewed:true});}
    return orderBlocks(all);
  }
  async close(){if(this.worker){const w=this.worker;this.worker=null;await w.terminate();}}
  async cancel(){this.cancelled=true;this.stop(new Error('인식을 중단했습니다.'));await this.close();}
}
