import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
const project=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
test('本地截图 API：自动保存 PNG，下载响应和非法请求校验',async()=>{
 const temp=await mkdtemp(path.join(tmpdir(),'learning-island-report-test-'));
 const child=spawn(process.execPath,['server.mjs'],{cwd:project,env:{...process.env,PORT:'0',REPORTS_DIR:temp},stdio:['ignore','pipe','pipe']});
 try{
  const base=await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error('服务器启动超时')),5000);child.on('error',reject);child.stdout.on('data',data=>{const match=String(data).match(/http:\/\/127\.0\.0\.1:\d+/);if(match){clearTimeout(timeout);resolve(match[0]);}});});
  assert.equal((await (await fetch(base+'/api/health')).json()).app,'math-island');
  const page=await fetch(base);assert.equal(page.status,200);assert.ok((await page.text()).includes('学习探险岛'));
  const id='12345678-1234-1234-1234-123456789abc';
  const image='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==';
  const post=body=>fetch(base+'/api/reports',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  assert.equal((await post({id:'../../escape',image})).status,400);assert.equal((await post({id,image:'data:image/png;base64,YmFk'})).status,400);
  const save=await post({id,image});assert.equal(save.status,200);const route=(await save.json()).url;assert.equal(route,`/reports/${id}.png`);
  const bytes=await readFile(path.join(temp,id+'.png'));assert.equal(bytes.readUInt32BE(0),0x89504e47);
  const download=await fetch(base+route+'?download=1&name='+encodeURIComponent('口算成绩.png'));assert.equal(download.status,200);assert.equal(download.headers.get('content-type'),'image/png');assert.ok(download.headers.get('content-disposition').startsWith('attachment;'));assert.deepEqual(Buffer.from(await download.arrayBuffer()),bytes);
  assert.equal((await fetch(base+'/reports/invalid.png')).status,400);assert.equal((await fetch(base+'/api/reports',{method:'POST',body:'bad'})).status,415);assert.equal((await fetch(base+'/missing')).status,404);
 }finally{child.kill();await rm(temp,{recursive:true,force:true});}
});
