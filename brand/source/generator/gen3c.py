import re
from string import Template
exec(open('gen.py').read().split("k=sys.argv[1]")[0])
FOREST,OCEAN,TEAL,OCHRE,SAGE,INK='#1E8A5A','#2440A8','#1A9AA0','#E0A93B','#DCE8DF','#012732'
STRIPE=f"linear-gradient(90deg, {FOREST} 0 50%, {TEAL} 50% 88%, {OCHRE} 88% 100%)"
t=dict(base); t.update(S['3'])
t.update(file='Identity3c.dc.html',title='G-MoRE web, identity 3c: Many perspectives, greens and teal',
 primary=INK, header_border=f"4px solid {FOREST}; border-image: {STRIPE} 1",
 band=TEAL, band_text=INK, band_muted=INK, p1=FOREST, p2=TEAL, p3=OCHRE)
h=Template(open('/home/claude/template.dc.html').read()).safe_substitute(t)
def sub(old,new,count=0):
    global h
    n=h.count(old); assert n>=max(count,1),(old,n)
    h=h.replace(old,new,count if count else -1)
# headings (on light ground) in forest green: all are large text
h=re.sub(r'(<h[123] [^>]*?)color: '+INK, lambda m:m.group(1)+'color: '+FOREST, h)
# filled buttons: teal with ink text
sub(f"background: {INK}; color: #FFFFFF",f"background: {TEAL}; color: {INK}")
# call-band button: dark on the teal band
sub(f"background: {OCHRE}; color: {INK}; text-decoration: none; font-weight: 700\">Send a proposal",f"background: {INK}; color: #FFFFFF; text-decoration: none; font-weight: 700\">Send a proposal")
# hero rule as the green-teal-ochre segment
sub(f"width: 56px; height: 2px; background: {OCHRE}; margin-top: 32px",f"width: 96px; height: 4px; background: {STRIPE}; margin-top: 32px")
for col in (FOREST,TEAL,OCHRE):
    sub(f"border: 1px solid {SAGE}; border-radius: 6px; padding: 32px;",f"border: 1px solid {SAGE}; border-top: 6px solid {col}; border-radius: 6px; padding: 32px;",1)
for bg,fg in ((FOREST,'#FFFFFF'),(TEAL,INK),(FOREST,'#FFFFFF'),(TEAL,INK)):
    sub(f"border-radius: 50%; background: {SAGE}; color: {INK};",f"border-radius: 50%; background: {bg}; color: {fg};",1)
sub(f'<footer id="footer" style="border-top: 1px solid {SAGE};',f'<footer id="footer" style="border-top: 4px solid {FOREST}; border-image: {STRIPE} 1;')
assert not set(re.findall(r'\$[a-z_0-9]+',h))-{'$preview'}
print('h-tags in forest:',len(re.findall(r'<h[123] [^>]*color: '+FOREST,h)))
open(R+t['file'],'w').write(h); print('ok',len(h))
