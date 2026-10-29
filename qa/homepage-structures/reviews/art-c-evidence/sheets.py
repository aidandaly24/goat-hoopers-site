from pathlib import Path
from PIL import Image,ImageDraw
import json,sys
p=Path('qa/homepage-structures/reviews/art-c-evidence')
j=json.load(open(p/'exercise.json'))
for id in sorted(set(x['id'] for x in j)):
 names=[x['name']for x in j if x['id']==id and x['width']==1440 and x['ok']]
 if not names:continue
 c=Image.new('RGB',(1860,328*((len(names)+2)//3)),'#bbb');d=ImageDraw.Draw(c)
 for k,name in enumerate(names):
  x=k%3*620;y=k//3*328;d.text((x+4,y+2),f'{id} {name}',fill='black')
  for w,dx,sz in [(1440,0,(480,300)),(390,482,(138,300))]:
   f=p/f'{id}-{w}-{name}.png'
   if f.exists():c.paste(Image.open(f).resize(sz),(x+dx,y+20))
 c.save(p/f'{id}-states-sheet.jpg')
