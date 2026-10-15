import sys, json
from string import Template
R='/mnt/user-data/outputs/artifacts/4e00ea40-55f5-4521-8d3e-5279411d6169/project/'
serif="'Crimson Pro', Georgia, serif"; lato="'Lato', 'Helvetica Neue', sans-serif"; jost="'Jost', 'Futura', sans-serif"
F1="https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,500;1,400;1,500&amp;family=Lato:wght@400;700&amp;display=swap"
F4="https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600&amp;display=swap"
base=dict(fonts=F1,header_bg='#FFFFFF',surface='#FFFFFF',head_font=serif,body_font=lato,h1_style='normal',h1_weight='400',h1_size='64px',h2_style='normal',h2_weight='400',h3_weight='500',h_track='-0.005em',btn_weight='700')
S={
'1':dict(file='Main.dc.html',title='G-MoRE web, identity 1: Open Circle',bg='#FAFBF8',header_border='1px solid #DCE8DF',primary='#1F684A',accent='#D9A441',ink='#102624',body='#535A60',tint='#DCE8DF',line='#DCE8DF',band='#1F684A',band_text='#FAFBF8',band_muted='#DCE8DF',avatar='#8FB79A',p1='#1F684A',p2='#8FB79A',p3='#D9A441',radius='6px',btn_radius='4px',logo='/_blob/a01689e3e602d4d172f84ec03dc29845',logo_h='60px',symbol='/_blob/3de4e346488d1ee671deb9b6cba297fa',h1='An Open Circle for a More Ethical World'),
'2':dict(file='Identity2.dc.html',title='G-MoRE web, identity 2: Interwoven',bg='#F7F8F5',header_border='3px solid #D9A441',primary='#1F684A',accent='#D9A441',ink='#052C27',body='#4C5457',tint='#C7DABD',line='#C7DABD',band='#1F684A',band_text='#F7F8F5',band_muted='#C7DABD',avatar='#C7DABD',p1='#1F684A',p2='#2A8F8A',p3='#D9A441',radius='8px',btn_radius='6px',logo='/_blob/484f3661bc0df5e4f5b91117e0355114',logo_h='64px',symbol='/_blob/30b773cc1e03752f8100c0c7acc4360a',h1='Different perspectives. A more human future.'),
'3':dict(file='Identity3.dc.html',title='G-MoRE web, identity 3: Many perspectives',bg='#F8FAF7',header_border='1px solid #DCE8DF',primary='#2440A8',accent='#E0A93B',ink='#012732',body='#5A6266',tint='#DCE8DF',line='#DCE8DF',band='#2440A8',band_text='#FFFFFF',band_muted='#DCE8DF',avatar='#DCE8DF',p1='#1E8A5A',p2='#2440A8',p3='#1A9AA0',radius='6px',btn_radius='4px',logo='/_blob/8c59381125d34089dc8113fe496ae6f0',logo_h='60px',symbol='/_blob/50fe1d1a6733c2f41e769c5f6b0611e1',h1='Many perspectives. A stronger, more ethical world.',h1_style='italic',h2_style='italic'),
'4':dict(file='Identity4.dc.html',title='G-MoRE web, identity 4: Open circle geometric',fonts=F4,head_font=jost,body_font=jost,bg='#FAFBF8',header_border='3px solid #D9A441',primary='#1F6B4A',accent='#D9A441',ink='#133A2E',body='#133A2E',tint='#DCE8DF',line='#DCE8DF',band='#133A2E',band_text='#FAFBF8',band_muted='#DCE8DF',avatar='#DCE8DF',p1='#1F6B4A',p2='#D9A441',p3='#133A2E',radius='12px',btn_radius='8px',logo='/_blob/e5599577af34e0279823b958822f8a68',logo_h='52px',symbol='/_blob/71ddce7db5d300b1376feec9d71acb46',h1='There is always a seat in the circle.',h1_weight='500',h1_size='60px',h2_weight='500',h_track='-0.01em',btn_weight='500'),
}
k=sys.argv[1]; t=dict(base); t.update(S[k])
out=Template(open('/home/claude/template.dc.html').read()).safe_substitute(t)
import re; left=set(re.findall(r'\$[a-z_0-9]+',out))-{'$preview'}
assert not left, left
open(R+t['file'],'w').write(out); print('wrote',t['file'],len(out))
