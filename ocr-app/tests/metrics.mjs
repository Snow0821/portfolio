// Character error rate is an edit-distance metric, not an OCR confidence score.
export function characterErrorRate(reference,hypothesis,{ignoreWhitespace=false}={}){
  const normalize=text=>String(text).normalize('NFC').trim().replace(/\s+/g,ignoreWhitespace?'':' ');
  let a=Array.from(normalize(reference)),b=Array.from(normalize(hypothesis));
  const referenceLength=a.length;
  if(!referenceLength)return {edits:b.length,referenceCharacters:0,rate:null};
  let start=0;
  while(start<Math.min(a.length,b.length)&&a[start]===b[start])start++;
  a=a.slice(start);b=b.slice(start);
  while(a.length&&b.length&&a.at(-1)===b.at(-1)){a.pop();b.pop();}
  if(a.length<b.length)[a,b]=[b,a];
  let previous=Uint32Array.from({length:b.length+1},(_,i)=>i),next=new Uint32Array(b.length+1);
  for(let i=1;i<=a.length;i++){
    next[0]=i;
    for(let j=1;j<=b.length;j++)next[j]=Math.min(next[j-1]+1,previous[j]+1,previous[j-1]+(a[i-1]===b[j-1]?0:1));
    [previous,next]=[next,previous];
  }
  const edits=previous[b.length];
  return {edits,referenceCharacters:referenceLength,rate:edits/referenceLength};
}
