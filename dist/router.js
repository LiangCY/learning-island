const VIEWS=new Set(['home','practice','result','pets','cards','games','history','mistakes']);
const STATE_KEY='learningIslandRouteIndex';

export function parseRoute(hash=''){
 const [path,query='']=hash.replace(/^#\/?/,'').split('?');
 const view=path||'home';
 return VIEWS.has(view)?{view,params:Object.fromEntries(new URLSearchParams(query))}:{view:'home',params:{}};
}

export function routeHash({view,params={}}){
 if(!VIEWS.has(view))return '#/home';
 const query=new URLSearchParams();
 for(const key of Object.keys(params).sort())if(params[key]!==undefined&&params[key]!==null&&params[key]!=='')query.set(key,String(params[key]));
 const search=query.toString();
 return '#/'+view+(search?'?'+search:'');
}

// Hash URLs work with the existing static server and need no server-side rewrites.
export function createHashRouter({window:win=window,render,beforeNavigate=()=>true}){
 let current=null,index=Number.isInteger(win.history.state?.[STATE_KEY])?win.history.state[STATE_KEY]:0,rendering=false,restoring=false;
 const url=hash=>win.location.pathname+win.location.search+hash;
 function write(route,replace=false,nextIndex=index){
  const hash=routeHash(route);
  if(!replace&&current&&routeHash(current)===hash)return;
  index=replace?nextIndex:index+1;
  win.history[replace?'replaceState':'pushState']({...win.history.state,[STATE_KEY]:index},'',url(hash));
  current=parseRoute(hash);
 }
 function apply(route,replace=false,nextIndex=index){
  rendering=true;
  let actual;
  try{actual=render(route)||route;}finally{rendering=false;}
  write(actual,replace,nextIndex);
 }
 function navigate(route,options={}){
  if(restoring||!beforeNavigate(route,current))return false;
  apply(route,options.replace===true);return true;
 }
 function sync(route,options={}){
  if(!rendering&&!restoring)write(route,options.replace===true);
 }
 function locationChanged(){
  if(!current)return;
  if(restoring){if(win.location.hash===routeHash(current))restoring=false;return;}
  if(win.location.hash===routeHash(current))return;
  const route=parseRoute(win.location.hash),targetIndex=win.history.state?.[STATE_KEY];
  if(!beforeNavigate(route,current)){
   if(Number.isInteger(targetIndex)&&targetIndex!==index){restoring=true;win.history.go(index-targetIndex);}
   else write(current,true);
   return;
  }
  apply(route,true,Number.isInteger(targetIndex)?targetIndex:index+1);
 }
 win.addEventListener('popstate',locationChanged);
 win.addEventListener('hashchange',locationChanged);
 return {navigate,sync,start:()=>apply(parseRoute(win.location.hash),true)};
}
