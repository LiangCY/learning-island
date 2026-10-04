"""Read atlas alpha and generate CSS sampling windows/contours, without changing PNGs."""
from pathlib import Path
from collections import deque, defaultdict
import json, math
from PIL import Image
ROOT=Path(__file__).resolve().parent.parent

def simplify(points, epsilon=.75):
 if len(points)<3:return points
 ax,ay=points[0];bx,by=points[-1];dx,dy=bx-ax,by-ay
 denom=dx*dx+dy*dy
 far=0;split=0
 for i,(x,y) in enumerate(points[1:-1],1):
  t=max(0,min(1,((x-ax)*dx+(y-ay)*dy)/denom)) if denom else 0
  dist=math.hypot(x-(ax+t*dx),y-(ay+t*dy))
  if dist>far:far=dist;split=i
 if far<=epsilon:return [points[0],points[-1]]
 return simplify(points[:split+1],epsilon)[:-1]+simplify(points[split:],epsilon)

def outline(pixels,W):
 edges=defaultdict(list)
 for p in pixels:
  x=p%W;y=p//W
  if p-W not in pixels:edges[(x,y)].append((x+1,y))
  if p+1 not in pixels:edges[(x+1,y)].append((x+1,y+1))
  if p+W not in pixels:edges[(x+1,y+1)].append((x,y+1))
  if p-1 not in pixels:edges[(x,y+1)].append((x,y))
 loops=[]
 while edges:
  start=next(iter(edges));here=start;points=[start]
  while True:
   there=edges[here].pop()
   if not edges[here]:del edges[here]
   here=there
   if here==start:break
   points.append(here)
  loops.append(points)
 points=max(loops,key=lambda ps:abs(sum(ps[i][0]*ps[(i+1)%len(ps)][1]-ps[(i+1)%len(ps)][0]*ps[i][1] for i in range(len(ps)))))
 # Split the closed boundary at the opposite point so RDP doesn't collapse it.
 half=len(points)//2
 return simplify(points[:half+1])[:-1]+simplify(points[half:]+[points[0]])[:-1]

def read_atlas(key):
 im=Image.open(ROOT/f'dist/assets/cards/{key}-atlas.png')
 alpha=im.getchannel('A');W,H=im.size;raw=alpha.tobytes();seen=bytearray(W*H);parts=[]
 for p,v in enumerate(raw):
  if seen[p] or v<100:continue
  seen[p]=1;q=deque([p]);pixels=set()
  while q:
   at=q.popleft();pixels.add(at);x=at%W;y=at//W
   for nxt in (at-W if y else -1,at+W if y<H-1 else -1,at-1 if x else -1,at+1 if x<W-1 else -1):
    if nxt<0 or seen[nxt] or raw[nxt]<100:continue
    seen[nxt]=1;q.append(nxt)
  if len(pixels)>1000:
   xs=[p%W for p in pixels];ys=[p//W for p in pixels]
   parts.append({'pixels':pixels,'bounds':[min(xs),min(ys),max(xs)+1,max(ys)+1]})
 assert len(parts)==16,(key,len(parts))
 parts.sort(key=lambda p:(int((p['bounds'][1]+p['bounds'][3])/2/(H/4)),(p['bounds'][0]+p['bounds'][2])/2))
 cells=[];clips={};stats=[]
 for index,part in enumerate(parts):
  l,t,r,b=part['bounds'];x=max(0,l-8);y=max(0,t-8);right=min(W,r+8);bottom=min(H,b+8);w=right-x;h=bottom-y
  cells.append([x,y,w,h]);points=outline(part['pixels'],W)
  clips[index]='polygon('+','.join(f'{(px-x)/w*100:.3f}% {(py-y)/h*100:.3f}%' for px,py in points)+')'
  neighbors=sum(sum(x<=p%W<right and y<=p//W<bottom for p in other['pixels']) for other in parts if other is not part)
  stats.append({'card':index+1,'bounds':part['bounds'],'bodyPixels':len(part['pixels']),'neighborPixelsInWindow':neighbors,'contourPoints':len(points)})
 return {'cells':cells,'clips':clips},stats

def main():
 output={};report={}
 for key in ['bluey','peppa','digimon','pony','bangbang']:
  output[key],report[key]=read_atlas(key)
 (ROOT/'dist/atlas-art-windows.js').write_text('// Character-specific CSS sampling windows and alpha contours. Source PNGs are unchanged.\nexport const atlasArt='+json.dumps(output,separators=(',',':'))+';\n')
 (ROOT/'work').mkdir(exist_ok=True)
 (ROOT/'work/atlas-art-audit.json').write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps({k:{'cards':len(v),'windowsTouchingNeighbors':sum(s['neighborPixelsInWindow']>0 for s in v)} for k,v in report.items()}))
if __name__=='__main__':main()
