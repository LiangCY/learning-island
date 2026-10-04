"""Read source alpha to isolate CSS sprite windows; never edits PNG pixels."""
from pathlib import Path
from collections import deque
import importlib.util,json
from PIL import Image
root=Path(__file__).resolve().parent.parent
spec=importlib.util.spec_from_file_location('audit',root/'scripts/audit-card-atlases.py');audit=importlib.util.module_from_spec(spec);spec.loader.exec_module(audit)
import sys
source=sys.argv[1] if len(sys.argv)>1 else 'cozy-collection'
rows=int(sys.argv[2]) if len(sys.argv)>2 else 4
columns=int(sys.argv[3]) if len(sys.argv)>3 else 4
im=Image.open(root/f'dist/assets/furniture/{source}.png');W,H=im.size;raw=im.getchannel('A').tobytes();seen=bytearray(W*H);parts=[]
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
assert len(parts)==rows*columns,[(len(p),b) for p,b in parts]
parts.sort(key=lambda p:(int((p[1][1]+p[1][3])*rows/(2*H)),p[1][0]+p[1][2]))
frames=[]
for pixels,(l,t,r,b) in parts:
 x=max(0,l-3);y=max(0,t-3);w=min(W,r+3)-x;h=min(H,b+3)-y
 clip='polygon('+','.join(f'{(px-x)/w*100:.3f}% {(py-y)/h*100:.3f}%' for px,py in audit.outline(pixels,W))+')'
 frames.append({'window':[x,y,w,h,W,H],'clip':clip})
(root/f'dist/{source}-data.js').write_text('// Alpha geometry only; generated source pixels remain unchanged.\nexport default '+json.dumps(frames,separators=(',',':'))+';\n')
print('Furniture windows:',[f['window'][:4] for f in frames])
