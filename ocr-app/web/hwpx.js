export const escapeXML = value => String(value??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
const xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

export async function createHWPX(pages, options, template, JSZip) {
  if(!pages.some(p=>p.blocks.length)) throw new Error('먼저 사진을 변환해 주세요.');
  const zip = new JSZip(),ns=Object.entries(template.namespaces).map(([k,v])=>`xmlns:${k}="${v}"`).join(' ');
  const columns=Number(options.columns)===1?1:2,font=Math.min(16,Math.max(8,Number(options.fontSize)||10));
  const columnWidth=Math.floor((59528-8504-(columns-1)*2268)/columns),pictureWidth=columnWidth-800;
  let paraId=1,objectId=1000000000,noteIndex=0,pictureIndex=0,questionIndex=0;
  const images=[],plain=[];
  const run=(text,char=0)=>`<hp:run charPrIDRef="${char}"><hp:t>${escapeXML(text)}</hp:t></hp:run>`;
  const paragraph=(content,style=0,attrs='')=>`<hp:p id="${paraId++}" paraPrIDRef="${style}" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0" ${attrs}>${content}</hp:p>`;
  const textParagraph=(text,style=0,char=0)=>paragraph(run(text,char),style);
  const subList=content=>`<hp:subList id="" textDirection="HORIZONTAL" lineWrap="BREAK" vertAlign="TOP" linkListIDRef="0" linkListNextIDRef="0" textWidth="0" textHeight="0" hasTextRef="0" hasNumRef="0">${content}</hp:subList>`;
  const note=()=>{
    const n=++noteIndex;
    const content=paragraph(`<hp:run charPrIDRef="0"><hp:ctrl><hp:autoNum num="${n}" numType="ENDNOTE"><hp:autoNumFormat type="DIGIT" userChar="" prefixChar="" suffixChar=")" supscript="0"/></hp:autoNum></hp:ctrl><hp:t> </hp:t></hp:run>`,n===1?3:0);
    return `<hp:ctrl><hp:endNote number="${n}" suffixChar="41" instId="${objectId++}">${subList(content)}</hp:endNote></hp:ctrl>`;
  };
  const table=text=>{
    const lines=String(text).split('\n');
    const h=Math.max(2200,lines.reduce((s,t)=>s+Math.ceil((t.length*font*75)/(columnWidth-1400))*font*160,0)+600);
    const width=columnWidth-600;
    const content=lines.map(t=>textParagraph(t)).join('');
    const block=`<hp:tbl id="${objectId++}" zOrder="1" numberingType="TABLE" textWrap="TOP_AND_BOTTOM" textFlow="BOTH_SIDES" lock="0" dropcapstyle="None" pageBreak="CELL" repeatHeader="0" rowCnt="1" colCnt="1" cellSpacing="0" borderFillIDRef="2" noAdjust="0"><hp:sz width="${width}" widthRelTo="ABSOLUTE" height="${h}" heightRelTo="ABSOLUTE" protect="0"/><hp:pos treatAsChar="1" affectLSpacing="0" flowWithText="1" allowOverlap="0" holdAnchorAndSO="0" vertRelTo="PARA" horzRelTo="COLUMN" vertAlign="TOP" horzAlign="LEFT" vertOffset="0" horzOffset="0"/><hp:outMargin left="0" right="0" top="300" bottom="300"/><hp:inMargin left="400" right="400" top="200" bottom="200"/><hp:tr><hp:tc name="" header="0" hasMargin="1" protect="0" editable="0" dirty="0" borderFillIDRef="2">${subList(content)}<hp:cellAddr colAddr="0" rowAddr="0"/><hp:cellSpan colSpan="1" rowSpan="1"/><hp:cellSz width="${width}" height="${h}"/><hp:cellMargin left="400" right="400" top="200" bottom="200"/></hp:tc></hp:tr></hp:tbl>`;
    return paragraph(`<hp:run charPrIDRef="0">${block}<hp:t/></hp:run>`);
  };
  const picture=b=>{
    const match=/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(b.src||'');
    if(!match)throw new Error('그림 데이터가 올바르지 않습니다. 원본에서 영역을 다시 지정해 주세요.');
    const key=`image${++pictureIndex}`,ext=match[1]==='jpeg'?'jpg':match[1];
    // Avoid enlarging small crops, and keep tall figures within one printable page.
    const w0=Math.max(1,Number(b.width)||400),h0=Math.max(1,Number(b.height)||300);
    const scale=Math.min(pictureWidth/w0,62000/h0,75),w=Math.round(w0*scale),h=Math.round(h0*scale),oid=objectId++;
    images.push({key,ext,mime:`image/${match[1]}`});zip.file(`BinData/${key}.${ext}`,match[2],{base64:true});
    const block=`<hp:pic id="${oid}" zOrder="1" numberingType="PICTURE" textWrap="TOP_AND_BOTTOM" textFlow="BOTH_SIDES" lock="0" dropcapstyle="None" href="" groupLevel="0" instid="${oid}" reverse="0"><hp:offset x="0" y="0"/><hp:orgSz width="${w}" height="${h}"/><hp:curSz width="${w}" height="${h}"/><hp:flip horizontal="0" vertical="0"/><hp:rotationInfo angle="0" centerX="${Math.round(w/2)}" centerY="${Math.round(h/2)}" rotateimage="1"/><hp:renderingInfo><hc:transMatrix e1="1" e2="0" e3="0" e4="0" e5="1" e6="0"/><hc:scaMatrix e1="1" e2="0" e3="0" e4="0" e5="1" e6="0"/><hc:rotMatrix e1="1" e2="0" e3="0" e4="0" e5="1" e6="0"/></hp:renderingInfo><hp:imgRect><hc:pt0 x="0" y="0"/><hc:pt1 x="${w}" y="0"/><hc:pt2 x="${w}" y="${h}"/><hc:pt3 x="0" y="${h}"/></hp:imgRect><hp:imgClip left="0" right="${w}" top="0" bottom="${h}"/><hp:inMargin left="0" right="0" top="0" bottom="0"/><hp:imgDim dimwidth="${w}" dimheight="${h}"/><hc:img binaryItemIDRef="${key}" bright="0" contrast="0" effect="REAL_PIC" alpha="0"/><hp:effects/><hp:sz width="${w}" widthRelTo="ABSOLUTE" height="${h}" heightRelTo="ABSOLUTE" protect="0"/><hp:pos treatAsChar="1" affectLSpacing="0" flowWithText="1" allowOverlap="0" holdAnchorAndSO="0" vertRelTo="PARA" horzRelTo="COLUMN" vertAlign="TOP" horzAlign="LEFT" vertOffset="0" horzOffset="0"/><hp:outMargin left="0" right="0" top="300" bottom="300"/><hp:shapeComment>${escapeXML(b.text||'원본 그림')}</hp:shapeComment></hp:pic>`;
    return paragraph(`<hp:run charPrIDRef="0">${block}<hp:t/></hp:run>`,2)+(b.text?textParagraph(b.text,2,2):'');
  };
  let first=template.sectionStart.replace(/colCount="2"/,`colCount="${columns}"`);
  if(columns===1)first=first.replace(/<hp:colLine[^>]*\/>/,'');
  let body=first;
  for(const page of pages){
    for(let i=0;i<page.blocks.length;i++){
      const b=page.blocks[i];
      if(b.type==='image'){body+=picture(b);continue;}
      const text=String(b.text||'');if(!text.trim())continue;
      plain.push(text);
      if(b.type==='question'){
        questionIndex++;
        if(paraId>2)body+=textParagraph('');
        if(options.source)body+=textParagraph(`${options.source} #${questionIndex}`,1,2);
        const clean=options.endnotes?text.replace(/^\s*\d{1,3}[.)]\s*/,''):text;
        const lines=clean.split('\n');
        body+=paragraph(`<hp:run charPrIDRef="1">${options.endnotes?note():''}<hp:t>${options.endnotes?' ':''}${escapeXML(lines[0])}</hp:t></hp:run>`,1);
        body+=lines.slice(1).map(t=>textParagraph(t)).join('');
      }else if(b.type==='box'){
        let content=text;
        while(page.blocks[i+1]?.type==='box'){content+='\n'+page.blocks[++i].text;plain.push(page.blocks[i].text);}
        body+=table(content);
      }else body+=text.split('\n').map(t=>textParagraph(t)).join('');
    }
  }
  body+=textParagraph('');
  let header=template.header.replace(/(<hh:charPr\b[^>]*\bid="[01]"[^>]*\bheight=")\d+"/g,`$1${font*100}"`);
  const section=xml+`<hs:sec ${ns}>${body}</hs:sec>`;
  const now=new Date().toISOString();
  const manifest=xml+`<opf:package ${ns} version="" unique-identifier="" id=""><opf:metadata><opf:title>${escapeXML(options.title||'나의 문제지')}</opf:title><opf:language>ko</opf:language><opf:meta name="creator" content="text">한글 렌즈</opf:meta><opf:meta name="CreatedDate" content="text">${now}</opf:meta><opf:meta name="ModifiedDate" content="text">${now}</opf:meta></opf:metadata><opf:manifest><opf:item id="header" href="Contents/header.xml" media-type="application/xml"/><opf:item id="section0" href="Contents/section0.xml" media-type="application/xml"/><opf:item id="settings" href="settings.xml" media-type="application/xml"/>${images.map(i=>`<opf:item id="${i.key}" href="BinData/${i.key}.${i.ext}" media-type="${i.mime}" isEmbeded="1"/>`).join('')}</opf:manifest><opf:spine><opf:itemref idref="header" linear="yes"/><opf:itemref idref="section0" linear="yes"/></opf:spine></opf:package>`;
  // Put the uncompressed mimetype first as required by the HWPX package format.
  const result=new JSZip();
  result.file('mimetype','application/hwp+zip',{compression:'STORE'});
  result.file('version.xml',xml+'<hv:HCFVersion xmlns:hv="http://www.hancom.co.kr/hwpml/2011/version" tagetApplication="WORDPROCESSOR" major="5" minor="1" micro="0" buildNumber="1" os="1" xmlVersion="1.4" application="Hancom Office Hangul" appVersion="10, 0, 0, 11808"/>');
  result.file('Contents/header.xml',xml+header);
  result.file('Contents/section0.xml',section);
  result.file('Contents/content.hpf',manifest);
  result.file('settings.xml',xml+'<ha:HWPApplicationSetting xmlns:ha="http://www.hancom.co.kr/hwpml/2011/app"><ha:CaretPosition listIDRef="0" paraIDRef="0" pos="0"/></ha:HWPApplicationSetting>');
  result.file('META-INF/container.xml',xml+'<ocf:container xmlns:ocf="urn:oasis:names:tc:opendocument:xmlns:container"><ocf:rootfiles><ocf:rootfile full-path="Contents/content.hpf" media-type="application/hwpml-package+xml"/><ocf:rootfile full-path="Preview/PrvText.txt" media-type="text/plain"/></ocf:rootfiles></ocf:container>');
  result.file('META-INF/manifest.xml',xml+'<odf:manifest xmlns:odf="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0"/>');
  result.file('Preview/PrvText.txt',plain.join('\r\n'));
  for(const file of Object.values(zip.files))if(!file.dir)result.file(file.name,await file.async('uint8array'));
  if(typeof DOMParser!=='undefined'){
    for(const value of [xml+header,section,manifest])if(new DOMParser().parseFromString(value,'application/xml').querySelector('parsererror'))throw new Error('문서 구조 검사에 실패했습니다. 내용을 확인해 주세요.');
  }
  return result.generateAsync({type:'uint8array',compression:'DEFLATE',compressionOptions:{level:6},mimeType:'application/vnd.hancom.hwpx'});
}
