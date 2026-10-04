"""Analyze alpha geometry for CSS windows only; PNG source pixels are unchanged."""
from pathlib import Path
from collections import deque
import importlib.util,json
from PIL import Image
root=Path(__file__).resolve().parent.parent
spec=importlib.util.spec_from_file_location('audit',root/'scripts/audit-card-atlases.py');audit=importlib.util.module_from_spec(spec);spec.loader.exec_module(audit)
output={}
def frames_for(target,expected,rows=2):
 im=Image.open(target);W,H=im.size;raw=im.getchannel('A').tobytes();seen=bytearray(W*H);parts=[]
 for p,v in enumerate(raw):
  if seen[p] or v<150:continue
  seen[p]=1;q=deque([p]);pixels=set()
  while q:
   at=q.popleft();pixels.add(at);x=at%W;y=at//W
   for n in (at-W if y else -1,at+W if y<H-1 else -1,at-1 if x else -1,at+1 if x<W-1 else -1):
    if n<0 or seen[n] or raw[n]<150:continue
    seen[n]=1;q.append(n)
  if len(pixels)>5000:
   xs=[p%W for p in pixels];ys=[p//W for p in pixels];parts.append((pixels,[min(xs),min(ys),max(xs)+1,max(ys)+1]))
 assert len(parts)==expected,(target,len(parts))
 parts.sort(key=lambda p:(int((p[1][1]+p[1][3])*rows/(2*H)),p[1][0]+p[1][2]))
 frames=[]
 for pixels,(l,t,r,b) in parts:
  x=max(0,l-6);y=max(0,t-6);w=min(W,r+6)-x;h=min(H,b+6)-y
  clip='polygon('+','.join(f'{(px-x)/w*100:.3f}% {(py-y)/h*100:.3f}%' for px,py in audit.outline(pixels,W))+')'
  frames.append({'window':[x,y,w,h,W,H],'clip':clip})
 return frames
species=frames_for(root/'dist/assets/companions/species-poses-v4.png',9,3)
for id in ['fox','rabbit','panda','cat']:
 target=root/f'dist/assets/companions/{id}-v3.png'
 frames=frames_for(target,4)
 # The guardian rests in a grounded standing pose from the original atlas.
 guardian=frames_for(root/f'dist/assets/companions/{id}-v2.png',6)[5]
 guardian['src']=f'/assets/companions/{id}-v2.png'
 if id!='fox':
  row=['rabbit','panda','cat'].index(id)
  frames[:3]=species[row*3:row*3+3]
  for frame in frames[:3]:frame['src']='/assets/companions/species-poses-v4.png'
 frames[3]=guardian
 output[id]={'src':f'/assets/companions/{id}-v3.png','frames':frames}
 print(id,[f['window'][:4] for f in frames])
(root/'dist/companion-art-data.js').write_text('// Read-only alpha analysis; source PNGs are unchanged.\nexport const COMPANION_ART='+json.dumps(output,separators=(',',':'))+';\n')
