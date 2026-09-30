import {rm,cp,mkdir,readFile,writeFile} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});
await mkdir('dist',{recursive:true});
await cp('index.html','dist/index.html');
await cp('ocr-app/web','dist/ocr',{recursive:true,filter:p=>!p.includes('/.vite')});
await cp('mint','dist/mint',{recursive:true});
const html=await readFile('dist/ocr/index.html','utf8');
await writeFile('dist/ocr/index.html',html.replace('<head>','<head>\n  <base href="/ocr/">'));
console.log('Mint built at / and /mint/. Hangul Lens built at /ocr/.');
