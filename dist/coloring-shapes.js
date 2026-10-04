// Original, closed SVG shapes. Every colored shape is a separately selectable region.
const p=(name,d)=>({name,tag:'path',attrs:{d}});
const e=(name,cx,cy,rx,ry=rx)=>({name,tag:'ellipse',attrs:{cx,cy,rx,ry}});
const r=(name,x,y,width,height,rx=12)=>({name,tag:'rect',attrs:{x,y,width,height,rx}});
const star=(name,x,y,s=24)=>p(name,Array.from({length:10},(_,i)=>{const a=-Math.PI/2+i*Math.PI/5,k=i%2?s*.46:s;return `${i?'L':'M'}${(x+Math.cos(a)*k).toFixed(1)} ${(y+Math.sin(a)*k).toFixed(1)}`;}).join(' ')+'Z');
const heart=(name,x,y,s=1)=>p(name,`M${x} ${y+24*s} C${x-65*s} ${y-16*s} ${x-28*s} ${y-52*s} ${x} ${y-25*s} C${x+28*s} ${y-52*s} ${x+65*s} ${y-16*s} ${x} ${y+24*s}Z`);
const cloud=(name,x,y,s=1)=>p(name,`M${x-44*s} ${y+15*s} C${x-76*s} ${y+10*s} ${x-60*s} ${y-32*s} ${x-28*s} ${y-24*s} C${x-15*s} ${y-60*s} ${x+36*s} ${y-48*s} ${x+39*s} ${y-15*s} C${x+78*s} ${y-18*s} ${x+73*s} ${y+22*s} ${x+42*s} ${y+22*s} L${x-44*s} ${y+15*s}Z`);
const leaf=(name,x,y,s=1)=>p(name,`M${x} ${y} Q${x-45*s} ${y-52*s} ${x+15*s} ${y-68*s} Q${x+52*s} ${y-20*s} ${x} ${y}Z`);
const flower=(name,x,y,s=1)=>[...Array.from({length:5},(_,i)=>{const a=i*Math.PI*2/5;return e(`${name}花瓣${i+1}`,x+Math.sin(a)*23*s,y-Math.cos(a)*23*s,18*s);}),e(`${name}花心`,x,y,15*s)];
const face=(x,y,s=1)=>`<ellipse cx="${x-23*s}" cy="${y}" rx="${4*s}" ry="${6*s}"/><ellipse cx="${x+23*s}" cy="${y}" rx="${4*s}" ry="${6*s}"/><path d="M${x-10*s} ${y+18*s} Q${x} ${y+30*s} ${x+10*s} ${y+18*s}" fill="none"/>`;
const line=d=>`<path d="${d}" fill="none"/>`;
const board=(id,name,category,price,description,shapes,ink='')=>({id,name,category,price,description,regions:[r('背景',8,8,464,464,28),...shapes].map((s,i)=>({...s,id:`area-${i}`})),ink});
export {p,e,r,star,heart,cloud,leaf,flower,face,line,board};
