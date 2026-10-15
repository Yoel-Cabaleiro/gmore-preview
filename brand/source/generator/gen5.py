import re
from string import Template
exec(open('gen.py').read().split("k=sys.argv[1]")[0])
FOREST,OCHRE,TERRA,SKY,SAGE,BLUSH='#22332A','#C8912E','#B8603E','#7FA7C9','#A9BBA2','#E8C9B5'
PAGE,CARD,LINE='#FBF8F1','#F3EEE3','#E2DACB'
t=dict(base)
t.update(file='Identity5.dc.html',title='G-MoRE web, identity 5: Quilt',
 fonts="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;800&amp;family=Nunito+Sans:wght@400;700&amp;display=swap",
 head_font="'Outfit', 'Helvetica Neue', sans-serif", body_font="'Nunito Sans', 'Helvetica Neue', sans-serif",
 bg=PAGE, header_bg=PAGE, header_border=f'1px solid {LINE}', surface=CARD, tint=CARD, line=LINE,
 primary=FOREST, accent=OCHRE, ink=FOREST, body='#4C594F', band=FOREST, band_text=PAGE, band_muted=OCHRE,
 avatar=CARD, p1=TERRA, p2=OCHRE, p3=SKY, radius='10px', btn_radius='8px',
 logo='/_blob/564db80417c9d5877e51abf6ca9c0149', logo_h='52px', symbol='/_blob/dbf380f88ebc7473ce9026e0d552ed9e',
 h1='Every member adds a piece.', h1_weight='800', h2_weight='800', h3_weight='700', h_track='-0.02em', btn_weight='700')
h=Template(open('/home/claude/template.dc.html').read()).safe_substitute(t)
def sub(old,new,count=0):
    global h
    n=h.count(old); assert n>=max(count,1),(old,n)
    h=h.replace(old,new,count if count else -1)
sub(f"background: {FOREST}; color: #FFFFFF",f"background: {FOREST}; color: {PAGE}")
sub(f"border: 1.5px solid {FOREST}; color: {FOREST};",f"background: {OCHRE}; color: {FOREST};")
sub(f"border: 1px solid {LINE}; border-radius: 10px;","border: 0; border-radius: 10px;")
tiles=iter(['/_blob/c47f88986b925fb056762e7ca60f64b8','/_blob/e5fdcc4e742d9523a5407b12fece6a66','/_blob/fa4b3e00ca4271ed93da8ec245357646','/_blob/96d251f606e1b547581a0b2e47e4b18d'])
h,n=re.subn(r'<div aria-hidden="true" style="width: 88px; height: 88px; border-radius: 50%;[^"]*">NS</div>',
 lambda m:f'<img src="{next(tiles)}" alt="" style="width: 88px; height: 88px; object-fit: cover; border-radius: 4px; display: block; margin-bottom: 14px">',h)
assert n==4
assert not set(re.findall(r'\$[a-z_0-9]+',h))-{'$preview'}
open(R+t['file'],'w').write(h); print('ok',len(h))
