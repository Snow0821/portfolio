import assert from 'node:assert/strict';
import {classify,blocksFromResult,findGutter,summarizePage} from '../web/ocr.js';

import {characterErrorRate} from './metrics.mjs';

let checks=0;
function check(name,run){run();checks++;console.log('PASS: '+name);}
const line=(text,y,x=10,confidence=90)=>({text,confidence,bbox:{x0:x,y0:y,x1:x+180,y1:y+10}});
const read=lines=>blocksFromResult({blocks:[{paragraphs:[{lines}]}]},0);

check('decimal values are not question numbers',()=>{
  assert.equal(classify('1.5 m/s의 속력'),'text');
  assert.equal(classify('12. 속력은?'),'question');
  assert.equal(classify('서술형 2. 답하시오.'),'question');
});
check('question continuation and choice stay separate',()=>{
  const b=read([line('1. 설명으로 옳은 것은?',10),line('다음 내용을 참고하시오.',25),line('① 단위 시간 동안 이동한 거리',40)]);
  assert.equal(b.length,2);assert.equal(b[0].type,'question');assert.equal(b[1].type,'choice');
});
check('ambiguous choice symbols are retained without guessing',()=>{
  const b=read([line('1. 설명으로 옳은 것은?',10),line('@ 단위 시간 동안 이동한 거리',25)]);
  assert.equal(b.length,2);assert.equal(b[1].type,'choice');assert.ok(b[1].text.startsWith('@ '));
});
check('wrapped choices remain one editable paragraph',()=>{
  const b=read([line('① 단위 시간 동안',10),line('이동한 거리이다.',25,20)]);
  assert.equal(b.length,1);assert.equal(b[0].type,'choice');assert.equal(b[0].text,'① 단위 시간 동안 이동한 거리이다.');
});
check('text on opposite sides of a figure is not merged',()=>{
  const b=read([line('1. 다음 그래프를 보고 답하시오.',10),line('이동한 거리는?',200)]);
  assert.equal(b.length,2);assert.equal(b[0].text,'1. 다음 그래프를 보고 답하시오.');
});
check('shared passages start a separate block',()=>{
  const b=read([line('14. 앞 문제',10),line('[15~16] 공통 자료',25)]);
  assert.equal(b.length,2);
});
check('box labels and their lines preserve line breaks',()=>{
  const b=read([line('<보기>',10),line('ㄱ. 속력의 단위',25),line('ㄴ. 거리와 시간',40)]);
  assert.equal(b.length,1);assert.equal(b[0].text,'<보기>\nㄱ. 속력의 단위\nㄴ. 거리와 시간');
});
check('plain OCR text spacing overrides split word JSON',()=>{
  const b=blocksFromResult({text:'속력에 대한 설명',blocks:[{paragraphs:[{lines:[line('속 력 에 대한 설 명',10)]}]}]},0);
  assert.equal(b[0].text,'속력에 대한 설명');
});
check('repeated lines retain their own spacing order',()=>{
  const b=blocksFromResult({text:'가 나\n가나',blocks:[{paragraphs:[{lines:[line('가나',10),line('가 나',200)]}]}]},0);
  assert.equal(b[0].text,'가 나');assert.equal(b[1].text,'가나');
});

function fixture({gutter=.53,rule=false,blank=false,single=false,header=false}={}){
  const width=400,height=600,data=new Uint8ClampedArray(width*height*4).fill(255);
  const rect=(x0,y0,x1,y1)=>{for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const i=(y*width+x)*4;data[i]=data[i+1]=data[i+2]=20;}};
  const center=Math.round(width*gutter),left=center-10,right=center+10;
  if(!blank){
    for(let y=110;y<540;y+=24){
      rect(20,y,single?380:left,y+7);
      if(!single)rect(right,y,380,y+7);
    }
    if(rule)rect(center,90,center+1,558);
    if(header)rect(25,20,375,75);
  }
  return {data,width,height,left,right};
}
check('offset gutter avoids cutting left-column characters',()=>{
  const p=fixture(),g=findGutter(p);
  assert.ok(g.detected);assert.ok(g.ratio*p.width>=p.left);assert.ok(g.ratio*p.width<=p.right);
  assert.ok(.5*p.width<p.left);
});
check('thin printed column divider is ignored',()=>{
  const p=fixture({rule:true}),g=findGutter(p);
  assert.ok(g.detected);assert.ok(g.ratio*p.width>=p.left&&g.ratio*p.width<=p.right);
});
check('wide header does not move the column boundary',()=>{
  const p=fixture({gutter:.55,header:true}),g=findGutter(p);
  assert.ok(g.detected);assert.ok(g.ratio*p.width>=p.left&&g.ratio*p.width<=p.right);
});
check('left-offset gutter is also supported',()=>{
  const p=fixture({gutter:.46}),g=findGutter(p);
  assert.ok(g.detected);assert.ok(g.ratio*p.width>=p.left&&g.ratio*p.width<=p.right);
});
check('blank and continuous pages do not invent a detected gutter',()=>{
  assert.deepEqual(findGutter(fixture({blank:true})),{ratio:.5,detected:false});
  assert.deepEqual(findGutter(fixture({single:true})),{ratio:.5,detected:false});
});
check('diagnostics count visible choice markers and real questions',()=>{
  const report=summarizePage({width:4080,height:3072,processed:true,blocks:[
    {type:'question',text:'1. 질문',confidence:90},
    {type:'choice',text:'① 10 ② 20 ③ 30',confidence:50},
    {type:'image',text:''}
  ]});
  assert.deepEqual(report.questionNumbers,[1]);assert.equal(report.choiceMarkers,3);
  assert.equal(report.figures,1);assert.equal(report.uncertainBlocks,1);
  assert.equal(report.width,4080);
});
check('CER catches lost text and spacing errors independently',()=>{
  assert.equal(characterErrorRate('속력에 대한 설명','속 력 에 대한 설 명').edits,3);
  assert.equal(characterErrorRate('속력에 대한 설명','속 력 에 대한 설 명',{ignoreWhitespace:true}).rate,0);
  assert.equal(characterErrorRate('가나다','가다').edits,1);
  assert.equal(characterErrorRate('가나다','가나라').edits,1);
  assert.equal(characterErrorRate('가나다','가나다').rate,0);
  assert.equal(characterErrorRate('','가').rate,null);
});
console.log(checks+' logic regressions passed. These fixtures do not measure real-image OCR accuracy.');
