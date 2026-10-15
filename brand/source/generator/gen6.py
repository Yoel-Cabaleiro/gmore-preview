import re
from string import Template
exec(open('gen.py').read().split("k=sys.argv[1]")[0])
INK,CHORD,PLUM,TEAL,OCHRE='#2B2A33','#E8714F','#6D4C7D','#2A7F7A','#C8912E'
t=dict(base)
t.update(file='Identity6.dc.html',title='G-MoRE web, identity 6: Ensemble',
 fonts="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&amp;family=Nunito+Sans:wght@400;700&amp;display=swap",
 head_font="'Playfair Display', Georgia, serif", body_font="'Nunito Sans', 'Helvetica Neue', sans-serif",
 bg='#F4F6F3', header_bg='#FFFFFF', header_border=f'4px solid {CHORD}', surface='#FFFFFF', tint='#FFFFFF', line='#E2E4E0',
 primary=INK, accent=CHORD, ink=INK, body='#55545E', band=INK, band_text='#FFFFFF', band_muted=CHORD,
 avatar='#FFFFFF', p1=PLUM, p2=TEAL, p3=OCHRE, radius='12px', btn_radius='999px',
 logo='/_blob/87969f7f2398744691a8ec6151216188', logo_h='48px', symbol='/_blob/66eb3ac45ff9c1c909b14e454df87e7c',
 h1=f'<em style="font-style: italic; font-weight: 400">Different voices.</em> One conversation.',
 h1_weight='700', h2_weight='700', h3_weight='400', h_track='-0.01em', btn_weight='700')
h=Template(open('/home/claude/template.dc.html').read()).safe_substitute(t)
def sub(old,new,count=0):
    global h
    n=h.count(old); assert n>=max(count,1),(old,n)
    h=h.replace(old,new,count if count else -1)
# second hero button: Chord fill, as in the sheet
sub(f"border: 1.5px solid {INK}; color: {INK};",f"background: {CHORD}; color: {INK};")
# category labels as outlined pills (Seminar / Workshop / Reading group style)
for cat,col in (('Research',PLUM),('Dialogue',TEAL),('Practice',OCHRE)):
    sub(f'<p style="margin: 0; font-size: 14px; font-weight: 700; color: {INK}">{cat}</p>',
        f'<p style="margin: 0; align-self: flex-start; padding: 5px 16px; border: 2px solid {col}; border-radius: 999px; font-size: 14px; font-weight: 700; color: {INK}">{cat}</p>')
# avatars: the voices of the staff
for bg,fg in ((PLUM,'#FFFFFF'),(TEAL,'#FFFFFF'),(OCHRE,INK),(CHORD,INK)):
    sub(f"border-radius: 50%; background: #FFFFFF; color: {INK};",f"border-radius: 50%; background: {bg}; color: {fg};",1)
assert not set(re.findall(r'\$[a-z_0-9]+',h))-{'$preview'}
open(R+t['file'],'w').write(h); print('ok',len(h))
