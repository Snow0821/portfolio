import {rm,cp,mkdir,readFile,writeFile} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});
await mkdir('dist',{recursive:true});
// Keep the existing portfolio and game files at their original URLs.
for(const entry of ['index.html','newpage.html','backup']) await cp(entry,`dist/${entry}`,{recursive:true});
await cp('ocr-app/web','dist/ocr',{recursive:true,filter:p=>!p.includes('/.vite')});
const html=await readFile('dist/ocr/index.html','utf8');
await writeFile('dist/ocr/index.html',html.replace('<head>','<head>\n  <base href="/ocr/">'));
console.log('Portfolio preserved. Hangul Lens built at /ocr/.');
