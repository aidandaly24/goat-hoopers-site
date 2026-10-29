from PIL import Image,ImageDraw
from pathlib import Path
r=Path('qa/homepage-structures/reviews/art-b-evidence')
choose={'01':'opening','02':'league','03':'edition','04':'edition','05':'wall-value','06':'all','07':'archive','08':'league','09':'two-editions','10':'dated','11':'edition','12':'editorial','13':'stories','14':'league','15':'archive','16':'edition-0','17':'editorial','18':'sources','19':'edition','20':'read'}
for batch in [list(choose)[:10],list(choose)[10:]]:
 files=[]
 for id in batch:
  n=choose[id];panes=list(r.glob(f'{id}-390-{n}-b*-end.jpg'))
  files.append(panes[-1] if panes else r/f'{id}-390-{n}-end.jpg')
 canvas=Image.new('RGB',(390*5,874*2),'white');d=ImageDraw.Draw(canvas)
 for i,p in enumerate(files):
  if not p.exists():continue
  im=Image.open(p);im.thumbnail((390,844));x=i%5*390;y=i//5*874;d.text((x+5,y+5),p.name,fill='black');canvas.paste(im,(x,y+30))
 canvas.save(r/f'end-{batch[0]}-{batch[-1]}-contact.jpg',quality=78)
