import re
from string import Template
exec(open('gen.py').read().split("k=sys.argv[1]")[0])
FOREST,OCEAN,TEAL,OCHRE,SAGE,INK='#1E8A5A','#2440A8','#1A9AA0','#E0A93B','#DCE8DF','#012732'
STRIPE=f"linear-gradient(90deg, {FOREST} 0 25%, {TEAL} 25% 50%, {OCEAN} 50% 75%, {OCHRE} 75% 100%)"
t=dict(base); t.update(S['3'])
t.update(file='Identity3b.dc.html',title='G-MoRE web, identity 3b: Many perspectives, colour shared out',
 primary=INK, header_border=f"4px solid {FOREST}; border-image: {STRIPE} 1",
 band=INK, band_text='#FFFFFF', band_muted=OCHRE, p1=FOREST, p2=TEAL, p3=OCHRE)
h=Template(open('/home/claude/template.dc.html').read()).safe_substitute(t)
def sub(old,new,count=0):
    global h
    n=h.count(old); assert n>=max(count,1),(old,n)
    h=h.replace(old,new,count if count else -1)
# filled buttons: ochre with ink text
sub(f"background: {INK}; color: #FFFFFF",f"background: {OCHRE}; color: {INK}")
# hero rule as four-colour segment
sub(f"width: 56px; height: 2px; background: {OCHRE}; margin-top: 32px",f"width: 96px; height: 4px; background: {STRIPE}; margin-top: 32px")
# project cards: coloured top edge per category, label stays ink
for col in (FOREST,TEAL,OCHRE):
    sub(f"border: 1px solid {SAGE}; border-radius: 6px; padding: 32px;",f"border: 1px solid {SAGE}; border-top: 6px solid {col}; border-radius: 6px; padding: 32px;",1)
# avatars: rotate the circle colours
for bg,fg in ((FOREST,'#FFFFFF'),(TEAL,INK),(OCEAN,'#FFFFFF'),(OCHRE,INK)):
    sub(f"border-radius: 50%; background: {SAGE}; color: {INK};",f"border-radius: 50%; background: {bg}; color: {fg};",1)
# footer edge mirrors the header stripe
sub(f'<footer id="footer" style="border-top: 1px solid {SAGE};',f'<footer id="footer" style="border-top: 4px solid {FOREST}; border-image: {STRIPE} 1;')
assert not set(re.findall(r'\$[a-z_0-9]+',h))-{'$preview'}
open(R+t['file'],'w').write(h); print('ok',len(h))
