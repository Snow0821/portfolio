import {readFile} from 'node:fs/promises';
import {characterErrorRate} from '../tests/metrics.mjs';
const [referencePath,...resultPaths]=process.argv.slice(2);
if(!referencePath||!resultPaths.length)throw new Error('Usage: node ocr-app/scripts/compare.mjs reference.json before.diagnostics.json after.diagnostics.json');
const read=async path=>JSON.parse(await readFile(path,'utf8'));
const reference=await read(referencePath);
if(!Array.isArray(reference.pages)||reference.pages.some(p=>!p.name||typeof p.text!=='string'))throw new Error('Reference requires pages: [{name, text, questionNumbers?, choiceMarkers?, figures?}].');
if(new Set(reference.pages.map(p=>p.name)).size!==reference.pages.length)throw new Error('Reference page names must be unique.');
const results=[];
for(const path of resultPaths){
  const result=await read(path);
  if(result.format!=='hangul-lens-diagnostics'||!Array.isArray(result.pages))throw new Error('Expected a Hangul Lens diagnostics JSON: '+path);
  if(new Set(result.pages.map(p=>p.name)).size!==result.pages.length)throw new Error('Diagnostics contain duplicate page names; give input files unique names.');
  const pages=reference.pages.map(expected=>{
    const actual=result.pages.find(p=>p.name===expected.name);
    if(!actual)return {name:expected.name,missing:true};
    const text=actual.blocks.filter(b=>b.type!=='image').map(b=>b.text).join('\n');
    return {
      name:expected.name,processed:actual.processed,
      includingSpaces:characterErrorRate(expected.text,text),
      ignoringSpaces:characterErrorRate(expected.text,text,{ignoreWhitespace:true}),
      questions:{expected:expected.questionNumbers,actual:actual.questionNumbers},
      choices:{expected:expected.choiceMarkers,actual:actual.choiceMarkers},
      figures:{expected:expected.figures,actual:actual.figures},
      split:actual.split
    };
  });
  const totals=key=>{const compared=pages.filter(p=>p[key]);const edits=compared.reduce((s,p)=>s+p[key].edits,0),characters=compared.reduce((s,p)=>s+p[key].referenceCharacters,0);return {edits,referenceCharacters:characters,rate:characters?edits/characters:null};};
  results.push({pipeline:result.pipeline,file:path,missingPages:pages.filter(p=>p.missing).length,unexpectedPages:result.pages.filter(p=>!reference.pages.some(r=>r.name===p.name)).map(p=>p.name),includingSpaces:totals('includingSpaces'),ignoringSpaces:totals('ignoringSpaces'),pages});
}
const output={reference:referencePath,createdAt:new Date().toISOString(),note:'CER compares transcription only. Check figures and Hangul page layout separately.',results};
console.log(JSON.stringify(output,null,2));
