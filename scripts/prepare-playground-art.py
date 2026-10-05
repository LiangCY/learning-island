"""Read connected alpha bounds for CSS sprites; original PNG pixels are untouched.

Objects may cross the nominal atlas grid (long fins, leaves). Group separate
components by their center cell, so these details are not cut at grid borders.
"""
from pathlib import Path
from collections import deque
from PIL import Image
import json
root=Path(__file__).resolve().parent.parent
result={}
for theme,cols,rows in [('garden',6,4),('aquarium',6,4),('expansion',6,4),('seafloor',2,1)]:
 im=Image.open(root/f'dist/assets/playgrounds/{theme}-atlas.png');W,H=im.size
 raw=im.getchannel('A').tobytes();seen=bytearray(W*H);groups=[[] for _ in range(cols*rows)]
 for p,value in enumerate(raw):
  if seen[p] or value<60:continue
  seen[p]=1;queue=deque([p]);pixels=[]
  while queue:
   at=queue.popleft();pixels.append(at);x=at%W;y=at//W
   for nxt in (at-W if y else -1,at+W if y<H-1 else -1,at-1 if x else -1,at+1 if x<W-1 else -1):
    if nxt<0 or seen[nxt] or raw[nxt]<60:continue
    seen[nxt]=1;queue.append(nxt)
  if len(pixels)<1000:continue
  xs=[p%W for p in pixels];ys=[p//W for p in pixels]
  l,t,r,b=min(xs),min(ys),max(xs)+1,max(ys)+1
  cell=int((t+b)/2/(H/rows))*cols+int((l+r)/2/(W/cols))
  groups[cell].append((l,t,r,b))
 frames=[]
 for i,parts in enumerate(groups):
  assert parts,(theme,i)
  l=max(0,min(p[0] for p in parts)-2);t=max(0,min(p[1] for p in parts)-2)
  r=min(W,max(p[2] for p in parts)+2);b=min(H,max(p[3] for p in parts)+2)
  frames.append([l,t,r-l,b-t,W,H])
 result[theme]=frames
(root/'dist/playground-art-data.js').write_text('// Original image pixels are preserved; connected alpha bounds are measured.\nexport const PLAYGROUND_ART='+json.dumps(result,separators=(',',':'))+';\n')
print({theme:len(frames) for theme,frames in result.items()})
