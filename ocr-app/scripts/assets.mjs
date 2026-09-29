import { createRequire } from 'node:module';
import { mkdir, copyFile, readdir } from 'node:fs/promises';
import path from 'node:path';
const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, '..');
const locate = name => path.dirname(require.resolve(`${name}/package.json`));
const vendor = path.join(root, 'web/vendor');
const models = path.join(root, 'web/models');
await mkdir(vendor, { recursive: true });
await mkdir(models, { recursive: true });
for (const file of ['tesseract.min.js', 'worker.min.js']) {
  await copyFile(path.join(locate('tesseract.js'), 'dist', file), path.join(vendor, file));
}
await copyFile(path.join(locate('jszip'), 'dist/jszip.min.js'), path.join(vendor, 'jszip.min.js'));
const core = locate('tesseract.js-core');
for (const file of await readdir(core)) {
  if (/^tesseract-core.*\.(js|wasm)$/.test(file)) await copyFile(path.join(core, file), path.join(vendor, file));
}
for (const lang of ['kor', 'eng']) {
  await copyFile(path.join(locate(`@tesseract.js-data/${lang}`), '4.0.0_best_int', `${lang}.traineddata.gz`), path.join(models, `${lang}.traineddata.gz`));
}
console.log('OCR engine and Korean / English models are ready.');

const licenses=path.join(vendor,'licenses');
await mkdir(licenses,{recursive:true});
for(const pkg of ['tesseract.js','tesseract.js-core','jszip','@tesseract.js-data/eng','@tesseract.js-data/kor']){
  for(const file of await readdir(locate(pkg))){
    if(/^licen[sc]e/i.test(file))await copyFile(path.join(locate(pkg),file),path.join(licenses,pkg.replace(/[@/]/g,'_')+'-'+file));
  }
}
