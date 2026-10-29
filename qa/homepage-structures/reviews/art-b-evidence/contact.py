from PIL import Image,ImageDraw
from pathlib import Path
import sys,json
root=Path('qa/homepage-structures/reviews/art-b-evidence')
for id in sys.argv[1:]:
 p=root/f'{id}-walk.json'
 if not p.exists():continue
 names=[x['name'] for x in json.loads(p.read_text()) if x['width']==390 and x['result']=='completed']
 files=[root/f'{id}-390-{name}.jpg' for name in names]
 if not files:continue
 canvas=Image.new('RGB',(390*3,874*((len(files)+2)//3)), 'white');d=ImageDraw.Draw(canvas)
 for i,p in enumerate(files):
  im=Image.open(p);im.thumbnail((390,844));x=(i%3)*390;y=(i//3)*874;d.text((x+8,y+6),p.name,fill='black');canvas.paste(im,(x,y+30))
 canvas.save(root/f'{id}-phone-states-contact.jpg',quality=77)
