import test from 'node:test';
import assert from 'node:assert/strict';
import {parseRoute,routeHash,createHashRouter} from '../dist/router.js';

function browser(hash=''){
 const listeners=new Map(),entries=[{url:new URL('http://localhost/island?source=test'+hash),state:null}];let cursor=0;
 const win={addEventListener:(name,fn)=>listeners.set(name,fn)};
 Object.defineProperty(win,'location',{get:()=>entries[cursor].url});
 win.history={
  get state(){return entries[cursor].state;},get length(){return entries.length;},
  pushState(state,_,url){entries.splice(cursor+1);entries.push({url:new URL(url,win.location),state});cursor++;},
  replaceState(state,_,url){entries[cursor]={url:new URL(url,win.location),state};},
  go(delta){cursor+=delta;listeners.get('popstate')?.();listeners.get('hashchange')?.();}
 };
 win.editHash=hash=>{win.history.pushState(null,'',hash);listeners.get('hashchange')?.();};
 return win;
}

test('全部页面和中文参数可编码往返，兼容旧首页锚点，无效路径回首页',()=>{
 for(const view of ['home','practice','result','pets','cards','games','history','mistakes']){
  const route={view,params:{id:'作品 / 1?&',tab:'studio'}};
  assert.deepEqual(parseRoute(routeHash(route)),route);
 }
 for(const hash of ['', '#', '#/', '#home', '#/unknown', '#/constructor', '#/games/unknown'])assert.deepEqual(parseRoute(hash),{view:'home',params:{}});
});

test('直接打开和刷新恢复路由，切换页面支持前进后退且不会重复写历史',()=>{
 const win=browser('#/pets?section=shop&room=bedroom'),seen=[];
 const router=createHashRouter({window:win,render:route=>{seen.push(route);return route;}});router.start();
 assert.equal(seen.at(-1).params.section,'shop');assert.equal(win.history.length,1);
 router.navigate({view:'games',params:{tab:'gallery'}});router.navigate({view:'cards'});
 assert.equal(win.history.length,3);win.history.go(-1);assert.equal(seen.at(-1).view,'games');
 assert.equal(win.history.length,3);win.history.go(1);assert.equal(seen.at(-1).view,'cards');
 const refreshed=[];createHashRouter({window:win,render:route=>refreshed.push(route)&&route}).start();
 assert.equal(refreshed[0].view,'cards');assert.equal(win.history.length,3);
 assert.equal(win.location.pathname,'/island');assert.equal(win.location.search,'?source=test');
});

test('子页面更新 URL，渲染时的通知不会写入多余历史，重复操作保持幂等',()=>{
 const win=browser();let router;
 router=createHashRouter({window:win,render:route=>{router.sync(route);return route;}});router.start();
 router.navigate({view:'pets',params:{section:'home',room:'lounge'}});
 router.sync({view:'pets',params:{section:'shop',room:'lounge'}});
 assert.equal(win.history.length,3);assert.equal(parseRoute(win.location.hash).params.section,'shop');
 router.sync({view:'pets',params:{room:'lounge',section:'shop'}});assert.equal(win.history.length,3);
 win.history.go(-1);assert.equal(parseRoute(win.location.hash).params.section,'home');
});

test('缺少本地练习或成绩时替换为有效页面，手动修改锚点也同步渲染',()=>{
 const win=browser('#/practice'),seen=[];
 const router=createHashRouter({window:win,render:route=>{seen.push(route);return route.view==='practice'?{view:'home'}:route.view==='result'?{view:'history'}:route;}});router.start();
 assert.equal(win.location.hash,'#/home');assert.equal(win.history.length,1);
 router.navigate({view:'result',params:{id:'missing'}});assert.equal(win.location.hash,'#/history');
 win.editHash('#/mistakes');assert.equal(seen.at(-1).view,'mistakes');
 win.editHash('#/bad-route');assert.equal(win.location.hash,'#/home');
});

test('画室保存保护同时拦截导航和浏览器后退，恢复地址后仍能再次后退',()=>{
 const win=browser(),seen=[];let blocked=false;
 const router=createHashRouter({window:win,render:route=>{seen.push(route.view);return route;},beforeNavigate:()=>!blocked});router.start();
 router.navigate({view:'games',params:{tab:'studio',board:'cat'}});blocked=true;
 assert.equal(router.navigate({view:'home'}),false);assert.equal(seen.at(-1),'games');
 win.history.go(-1);assert.equal(parseRoute(win.location.hash).view,'games');assert.equal(seen.at(-1),'games');
 blocked=false;win.history.go(-1);assert.equal(win.location.hash,'#/home');assert.equal(seen.at(-1),'home');
});
