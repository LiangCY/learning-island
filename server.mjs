import http from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(fileURLToPath(new URL('./dist/',import.meta.url))),reports=process.env.REPORTS_DIR?path.resolve(process.env.REPORTS_DIR):path.resolve(root,'../screenshots'),port=Number(process.env.PORT||4173);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.json':'application/json'};
const json=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
const validId=id=>typeof id==='string'&&/^[a-f0-9-]{36}$/.test(id);
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/api/health'){json(res,200,{app:'math-island',version:'1.0.0'});return;}
  if(url.pathname==='/api/reports'&&req.method==='POST'){
   if(!req.headers['content-type']?.startsWith('application/json')){json(res,415,{error:'格式不正确'});return;}
   if(Number(req.headers['content-length'])>8*1024*1024){json(res,413,{error:'图片过大'});return;}
   let body='',size=0;for await(const chunk of req){size+=chunk.length;if(size>8*1024*1024){json(res,413,{error:'图片过大'});return;}body+=chunk;}
   let data;try{data=JSON.parse(body);}catch{json(res,400,{error:'格式不正确'});return;}
   if(!validId(data?.id)||typeof data?.image!=='string'||!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(data.image)){json(res,400,{error:'图片数据不正确'});return;}
   const bytes=Buffer.from(data.image.split(',')[1],'base64');if(!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))){json(res,400,{error:'需要 PNG 图片'});return;}
   await mkdir(reports,{recursive:true});await writeFile(path.join(reports,`${data.id}.png`),bytes);json(res,200,{url:`/reports/${data.id}.png`});return;
  }
  if(url.pathname.startsWith('/reports/')){
   const id=url.pathname.slice(9,-4);if(!url.pathname.endsWith('.png')||!validId(id)){json(res,400,{error:'图片地址不正确'});return;}
   const image=await readFile(path.join(reports,`${id}.png`));const headers={'Content-Type':'image/png','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
   if(url.searchParams.get('download')==='1'){const filename=(url.searchParams.get('name')||'学习探险岛-成绩截图.png').replace(/[\x00-\x1f\x7f/\\]/g,'').slice(0,100);headers['Content-Disposition']=`attachment; filename="math-island-report.png"; filename*=UTF-8''${encodeURIComponent(filename)}`;}
   res.writeHead(200,headers);res.end(image);return;
  }
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);res.end();return;}
  const file=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end('Forbidden');return;}
  const body=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:body);
 }catch{json(res,404,{error:'没有找到这个页面或图片'});}
});
server.listen(port,'127.0.0.1',()=>console.log(`学习探险岛已启动：http://127.0.0.1:${server.address().port}`));server.on('error',error=>{console.error(error.message);process.exitCode=1;});
