#!/usr/bin/env python3
"""Build native Elementor homepage templates and their optional local-media installer payload."""
import copy
import hashlib
import json
from pathlib import Path
import shutil
import zipfile

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'elementor'
RELEASE = json.loads((OUT / 'release.json').read_text())
VERSION = RELEASE['version']
SOURCE = json.loads((ROOT / RELEASE['source_export']).read_text())
ASSETS = json.loads((OUT / 'source-assets.json').read_text())
BY_NAME = {a['filename']: a for a in ASSETS}
ALT_TEXT={
    'The-Silo-Suites-27.jpg':'A Silo Suite bedroom with exposed brick and farmhouse details',
    '53758-143823-xQdSrcjw4CXq-eDQU6oS9VH-vsNOQ9e9NXq0sN4bVo-6472368c9338f.jpg':'A quiet bedroom with soft white bedding and botanical wallpaper',
    'The-Silo-Suites-12-3.jpg':'A bright Silo Suite with a vaulted ceiling',
    'The-Silo-Suites-50-1-scaled.jpg':'Silo interior with original brick, a timber loft, and a curved staircase',
    'The-Silo-Suites-28-1.jpg':'A thoughtfully furnished Silo Suite bedroom and sitting area',
    'The-Silo-Suites-41.jpg':'Soft white bedding beside original brick and farmhouse artwork',
    '53758-143824-um3cH03nukuwkRaLUvJlEky5-um7PE22b-hi3oubfqI-6sss43783bd3a183.jpg':'The entrance to Silo Suite 1 on the historic farm',
    'The-Silo-Suites-51.jpg':'A farm building at Silo Suites beneath the Southern Utah sky',
    'The-Silo-Suites-28.jpg':'A Silo Suite bedroom with soft furnishings and exposed brick',
    '5c56e762-8c5c-4fe6-abbb-eec232e9355e-1.jpeg':'Outdoor seating beside a Silo Suite entrance',
    'studio-apartmentsdwww.jpg':'The Dairy Suite with natural timber beams and warm white interiors',
    'our_story.jpeg':'The family behind Silo Suites, photographed outdoors at the farm',
    'DSC04406-2w.jpg':'Mineral pools at Zion Canyon Hot Springs beneath the surrounding cliffs',
    'pioneerpark-stgeorge-family-hiking-19-e1603479587211.jpg':'Visitors exploring a red sandstone landscape in Southern Utah',
    'Zion-national-park11.jpg':'Red cliffs and a green valley in Zion National Park',
    'silo-logo.png':"Silo Suites — Historic Church's Dairy, La Verkin, Utah",
}
INK, OLIVE, CREAM, TAN, MUTED = '#181A16', '#7E8E76', '#F8F5EB', '#D6C3AE', '#595D54'
SEEN = set()


def uid(label):
    result = hashlib.sha256(label.encode()).hexdigest()[:8]
    if result in SEEN:
        raise ValueError('Duplicate element label: ' + label)
    SEEN.add(result)
    return result


def size(value, unit='px'):
    return {'unit': unit, 'size': value, 'sizes': []}


def edges(top=0, right=0, bottom=0, left=0):
    return {'unit': 'px', 'top': str(top), 'right': str(right), 'bottom': str(bottom), 'left': str(left), 'isLinked': False}


def gap(value):
    return {'unit': 'px', 'column': str(value), 'row': str(value), 'isLinked': True, 'size': value}


def widget(label, kind, settings):
    return {'id': uid(label), 'elType': 'widget', 'widgetType': kind, 'isInner': False, 'settings': {'_title': label, '_margin': edges(), **settings}, 'elements': []}


def container(label, children, classes='', **settings):
    return {'id': uid(label), 'elType': 'container', 'isInner': False, 'settings': {'_title': label, 'content_width': 'full', 'width': size(100, '%'), 'flex_direction': 'column', 'flex_gap': gap(0), 'padding': edges(), 'css_classes': 'ss-design ' + classes, **settings}, 'elements': children}


def heading(label, title, font=48, mobile=37, color=INK, tag='h2', classes='', **settings):
    return widget(label, 'heading', {'title': title, 'header_size': tag, 'typography_typography': 'custom', 'typography_font_family': 'Georgia', 'typography_font_size': size(font), 'typography_font_size_mobile': size(mobile), 'typography_font_weight': '400', 'typography_line_height': size(1.12, 'em'), 'typography_letter_spacing': size(-1), 'title_color': color, '_css_classes': classes, **settings})


def eyebrow(label, title, color=MUTED, **settings):
    return heading(label, title, font=10, mobile=10, color=color, tag='p', classes='ss-eyebrow', **{'typography_font_family':'Arial','typography_font_weight':'600','typography_text_transform':'uppercase','typography_line_height':size(1.7,'em'),'typography_letter_spacing':size(1.5),'_margin':edges(0,0,18,0),**settings})


def text(label, content, color=MUTED, **settings):
    return widget(label, 'text-editor', {'editor': content, 'text_color': color, 'typography_typography': 'custom', 'typography_font_family': 'Arial', 'typography_font_weight':'400', 'typography_font_size': size(16), 'typography_font_size_mobile': size(16), 'typography_line_height': size(1.8, 'em'), **settings})


def button(label, title, url, kind='link', **settings):
    filled = kind in ('olive', 'dark')
    color = '#FFFFFF' if kind == 'dark' else INK
    arrow='↗' in title
    if arrow:title=title.replace('&nbsp;','').replace('↗','').strip()
    classes=('ss-button' if filled else 'ss-link' if kind=='link' else '')+(' ss-has-arrow' if arrow else '')
    return widget(label, 'button', {'text': title, 'link': {'url': url, 'is_external': '', 'nofollow': '', 'custom_attributes': ''}, 'typography_typography': 'custom', 'typography_font_family': 'Arial', 'typography_font_size': size(12), 'typography_font_weight': '400', 'button_text_color': color, 'background_color': OLIVE if kind == 'olive' else INK if kind == 'dark' else '#FFFFFF00', 'hover_color': color, 'button_background_hover_color': '#9BA78F' if kind == 'olive' else '#3E4538' if kind == 'dark' else '#FFFFFF00', 'border_radius': edges(), 'text_padding': edges(16,26,16,26) if filled else edges(10,0,10,0), '_css_classes': classes, '_element_width': 'auto', '_margin': edges(18,0,0,0), **settings})


def media_ref(filename, alt=''):
    a = BY_NAME[filename]
    return {'url': a['url'], 'id': a['id'], 'alt': alt, 'source': 'library', 'size': ''}


def image(label, filename, alt, classes='', **settings):
    return widget(label, 'image', {'image': media_ref(filename, alt), 'image_size': 'full', 'align':'left', '_css_classes': classes, **settings})


def row(label, children, classes='', **settings):
    return container(label, children, classes, **{'flex_direction':'row','flex_direction_mobile':'column','flex_gap':gap(30),**settings})


def section(label, children, background=None, **settings):
    return container(label, children, 'ss-section', **{'background_background':'classic','background_color':background or '#FFFFFF','padding':edges(100,0,100,0),'padding_mobile':edges(65,0,65,0),**settings})


def wrap(label, children, **settings):
    return container(label, children, 'ss-wrap', **settings)


def card(label, name, filename, caption, facts, href):
    return container(label, [image(label+' image', filename, name, 'ss-card-image', link_to='custom', link={'url':href}), eyebrow(label+' caption', caption,_margin=edges(22,0,8,0)), heading(label+' title', name, font=30, mobile=30, tag='h3', link={'url':href}), text(label+' facts', '<p>'+facts+'</p>', typography_font_size=size(13),typography_font_size_mobile=size(13), _margin=edges(12,0,0,0)), button(label+' link', 'Explore this stay &nbsp; ↗', href, _margin=edges(6,0,0,0), align='justify')], 'ss-card', width=size(33.333,'%'), width_mobile=size(100,'%'))


hero_name = 'The-Silo-Suites-50-1-scaled.jpg'
style = widget('00 — Design styles — keep this widget', 'html', {'html':'<style>\n'+(OUT/'design.css').read_text()+'\n</style>', '_css_classes':'ss-style-widget'})
styles = container('00 — Scoped design system', [style], 'ss-zero')
hero = container('01 — Editorial hero', [wrap('01 — Hero content', [eyebrow('01 — Location', 'A boutique stay in La Verkin, Utah', '#FFFFFF'), heading('01 — Main headline', 'A little history.<br><em>A lot of comfort.</em>',font=80,mobile=43,color='#FFFFFF',tag='h1'), text('01 — Welcome copy','<p>Thoughtfully reimagined farm stays.<br>A quieter way to experience Southern Utah.</p>',color='#FFFFFF',_margin=edges(24,0,0,0)),button('01 — Hero link','Find your place &nbsp; ↗','/our-silo-suites/',button_text_color='#FFFFFF',hover_color='#FFFFFF',_margin=edges(24,0,0,0))])], 'ss-hero ss-section', min_height=size(670), min_height_mobile=size(550), flex_justify_content='center', padding=edges(60,0,100,0), padding_mobile=edges(90,0,100,0),background_background='classic',background_image=media_ref(hero_name),background_position='center center',background_position_mobile='center center',background_size='cover',background_overlay_background='gradient',background_overlay_color='#000000A0',background_overlay_color_b='#00000020',background_overlay_gradient_angle=size(90,'deg'),background_overlay_opacity=size(1))
search = wrap('02 — Date-first search', [widget('02 — Booking search — preview only','html',{'html':(OUT/'search.html').read_text()})], margin=edges(-52,0,0,0), margin_mobile=edges(-35,0,0,0),z_index=3)
intro = section('03 — Introduction',[row('03 — Intro layout',[container('03 — Intro label',[eyebrow('03 — Intro eyebrow','Rooted in the past.<br>Ready for your next chapter.')],width=size(38,'%'),width_mobile=size(100,'%')),container('03 — Intro copy',[heading('03 — Intro heading','A farm story, made<br>for a <em>slower stay.</em>',font=58,mobile=39),text('03 — Intro paragraph','<p>Settle into a thoughtfully designed suite on the historic Church Dairy Farm. Here, original character meets everyday comfort, with the landscapes of Southern Utah waiting just beyond your door.</p>',_margin=edges(26,0,0,0)),button('03 — Story link','Get to know Silo Suites &nbsp; ↗','#our-story')],width=size(62,'%'),width_mobile=size(100,'%'))],'ss-wrap',flex_gap=gap(60),flex_gap_mobile=gap(26))])
suite_header = row('04 — Suites title row',[container('04 — Suites heading group',[eyebrow('04 — The stays label','The stays'),heading('04 — Suites heading','A space to call <em>your own.</em>',font=47,mobile=37)],width=size(75,'%'),width_mobile=size(100,'%')),button('04 — All suites link','Explore all suites &nbsp; ↗','/our-silo-suites/',_margin=edges(),_element_width='auto')],flex_align_items='flex-end',flex_align_items_mobile='flex-start')
suite_cards = row('04 — Featured suites grid',[card('04 — Silo 1 card','Silo Suite 1','53758-143824-um3cH03nukuwkRaLUvJlEky5-um7PE22b-hi3oubfqI-6sss43783bd3a183.jpg','The original character','Up to 4 guests &nbsp; / &nbsp; 1 bath','/silo-suite-1/'),card('04 — Silo 3 card','Silo Suite 3','The-Silo-Suites-28.jpg','Thoughtfully considered','Up to 5 guests &nbsp; / &nbsp; 1 bath','/silo-suite-3/'),card('04 — Dairy card','The Dairy Suite','studio-apartmentsdwww.jpg','A new chapter on the farm','Up to 4 guests &nbsp; / &nbsp; 1 bath','/the-dairy-suite/')],flex_gap=gap(28),_margin=edges(),margin=edges(36,0,0,0))
group_note = row('04 — Group stay invitation',[eyebrow('04 — Group label','Better together'),text('04 — Group paragraph','<p>Coming with your favourite people? Make all four silos yours.</p>',typography_font_size=size(14)),button('04 — Group link','Explore group stays &nbsp; ↗','/entire-silo-suites/',_margin=edges())],margin=edges(45,0,0,0),padding=edges(26,0,0,0),border_border='solid',border_width=edges(1,0,0,0),border_color='#C9CBBF',flex_justify_content='space-between',flex_align_items='center',flex_align_items_mobile='flex-start')
suites_section=section('04 — Featured stays',[wrap('04 — Suites inner',[suite_header,suite_cards,group_note])],background=CREAM,_element_id='suites')
story=section('05 — Farm story',[row('05 — Story layout',[container('05 — Story photograph group',[image('05 — Family photo','our_story.jpeg','The family behind Silo Suites, photographed outdoors at the farm','ss-story-image'),eyebrow('05 — Family photo caption','A family farm. A new chapter.',INK)],width=size(42,'%'),width_mobile=size(100,'%')),container('05 — Story copy',[eyebrow('05 — Story eyebrow','The historic Church Dairy Farm',INK),heading('05 — Story heading','Some places have<br>a story. <em>This one<br>welcomes you in.</em>',font=53,mobile=37),text('05 — Story paragraphs','<p>Once a working dairy farm, this land has been part of the Church family\'s story for generations. Today, its next chapter is a collection of distinctive stays, shaped by the same sense of place.</p><p>Honest materials. Thoughtful details. A warm welcome to our corner of Utah.</p>',color='#000000',_margin=edges(24,0,0,0)),button('05 — Story CTA','Come stay a while &nbsp; ↗','/our-silo-suites/')],width=size(58,'%'),width_mobile=size(100,'%'))],'ss-wrap',flex_gap=gap(100),flex_gap_mobile=gap(36),flex_align_items='center')],background=OLIVE,_element_id='our-story',padding=edges(88,0,88,0))
soak_card=container('06 — Stay and Soak card',[eyebrow('06 — Soak label','Stay & Soak'),heading('06 — Soak headline','A little adventure.<br><em>A long, warm soak.</em>',font=44,mobile=33),text('06 — Soak copy','<p>Stay at Silo Suites. Soak at Zion Canyon Hot Springs. Make time for both sides of a Southern Utah getaway.</p>',_margin=edges(22,0,0,0)),button('06 — Soak link','Discover Stay & Soak &nbsp; ↗','/hot-springs/')],'ss-soak-card',width=size(50,'%'),width_mobile=size(94,'%'),_flex_align_self='flex-end',background_background='classic',background_color=CREAM,padding=edges(50,50,50,50),padding_mobile=edges(32,27,32,27),margin=edges(-185,0,0,0),margin_mobile=edges(-45,0,0,0))
soak=section('06 — Stay and Soak',[wrap('06 — Soak composition',[image('06 — Original Hot Springs image','DSC04406-2w.jpg','Mineral pools at Zion Canyon Hot Springs, beneath Southern Utah cliffs','ss-soak-image',_element_width='initial',_element_custom_width=size(88,'%'),_element_custom_width_mobile=size(100,'%')),soak_card,eyebrow('06 — Hot Springs caption','Zion Canyon Hot Springs / A regional experience')])],padding=edges(100,0,65,0),padding_mobile=edges(65,0,60,0))
guide_items=[]
for i,(caption,title,anchor) in enumerate([('For the adventure','Zion National Park','zion'),('For a change of pace','Sand Hollow','sand-hollow'),('For the little moments','A taste of local life','food')],1):
    guide_items.append(container(f'07 — Guide row {i}',[eyebrow(f'07 — Guide label {i}',f'0{i} / {caption}'),heading(f'07 — Guide destination {i}',title+' &nbsp; ↗',font=29,mobile=27,tag='h3',link={'url':'/local-guide/#'+anchor})],padding=edges(24,0,24,0),border_border='solid',border_width=edges(1,0,0,0),border_color='#D8D8CC'))
guide=section('07 — Local guide',[row('07 — Guide layout',[container('07 — Guide introduction',[eyebrow('07 — Guide eyebrow','A few local favourites'),heading('07 — Guide title',"Out here, there's<br>room to <em>wander.</em>",font=50,mobile=40),text('07 — Guide copy','<p>Big landscapes, small-town stops, and a good cup of coffee. A few places we think you\'ll love, close to your home for the weekend.</p>',_margin=edges(24,0,0,0)),button('07 — Guide CTA','Open the local guide &nbsp; ↗','/local-guide/')],width=size(47,'%'),width_mobile=size(100,'%')),container('07 — Guide destinations',guide_items,width=size(53,'%'),width_mobile=size(100,'%'))],'ss-wrap',flex_gap=gap(90),flex_gap_mobile=gap(35))],padding=edges(45,0,100,0))
closing=section('08 — Closing invitation',[wrap('08 — Closing content',[eyebrow('08 — Closing label','Heritage. Comfort. Near Zion.'),heading('08 — Closing title','Make room for<br><em>a little history.</em>',font=72,mobile=50,align='center'),button('08 — Closing CTA','Find your stay &nbsp; ↗','#ss-find-stay','dark',align='center',_margin=edges(30,0,0,0))],flex_align_items='center')],background=CREAM,padding=edges(75,0,82,0))
search['settings']['_element_id']='ss-find-stay'
body=[styles,hero,search,intro,suites_section,story,soak,guide,closing]

# The supplied no-pig artwork is bundled. The installer replaces this portable marker with its Media Library URL.
logo_name='silo-logo.png'
logo_asset={'filename':logo_name,'url':'/wp-content/uploads/silosuites-design/silo-logo.png','id':9990001,'source_file':'prototype/assets/logo.png'}
BY_NAME[logo_name]=logo_asset
def logo(label):
    return image(label,logo_name,"Silo Suites — Historic Church's Dairy, La Verkin, Utah",'ss-logo',link_to='custom',link={'url':'/'},_element_width='auto')
nav=[]
for i,(title,url) in enumerate([('Our suites','/our-silo-suites/'),('Our story','#our-story'),('Stay & Soak','/hot-springs/'),('Local guide','/local-guide/')]):
    nav.append(button('Header nav '+str(i),title,url,'plain',_margin=edges()))
mobile_menu='<details class="ss-mobile-menu"><summary>Menu</summary><nav aria-label="Mobile navigation"><a href="/our-silo-suites/">Our suites ↗</a><a href="#our-story">Our story ↗</a><a href="/hot-springs/">Stay & Soak ↗</a><a href="/local-guide/">Local guide ↗</a></nav></details><script>(function(){function init(){document.querySelectorAll(".ss-mobile-menu").forEach(function(menu){if(menu.dataset.ssMenuBound)return;menu.dataset.ssMenuBound="yes";menu.addEventListener("click",function(e){if(e.target.closest("a"))menu.open=false});document.addEventListener("keydown",function(e){if(e.key==="Escape"&&menu.open){menu.open=false;menu.querySelector("summary").focus()}});document.addEventListener("click",function(e){if(menu.open&&!menu.contains(e.target))menu.open=false})})}if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init()})();</script>'
header=container('Header — Local page navigation',[row('Header — Inner',[logo('Header — Original supplied logo'),row('Header — Desktop links',nav,width=size(55,'%'),flex_justify_content='center',flex_gap=gap(32),hide_mobile='hidden-mobile'),row('Header — Actions',[widget('Header — Mobile menu','html',{'html':mobile_menu,'hide_desktop':'hidden-desktop','hide_tablet':'hidden-tablet','_element_width':'auto'}),button('Header — Booking CTA','Book your stay &nbsp; ↗','#ss-find-stay','olive',_margin=edges())],width=size(25,'%'),width_mobile=size(70,'%'),flex_direction_mobile='row',flex_gap=gap(18),flex_justify_content='flex-end',flex_align_items='center')],'ss-wrap',flex_direction_mobile='row',flex_align_items='center',flex_justify_content='space-between',min_height=size(108),min_height_mobile=size(84),flex_gap=gap(20))],background_background='classic',background_color='#FFFFFF',html_tag='header')
footer=section('Footer — Page footer',[wrap('Footer — Inner',[row('Footer — Columns',[container('Footer — Brand',[logo('Footer — Original logo'),heading('Footer — Brand line','A little history.<br><em>A lot of comfort.</em>',font=21,mobile=21,tag='p')],width=size(34,'%'),width_mobile=size(100,'%')),container('Footer — Navigation',[eyebrow('Footer — Explore label','Make yourself at home'),*[button('Footer link '+str(i),title,url,'plain',_margin=edges()) for i,(title,url) in enumerate([('Our suites','/our-silo-suites/'),('Our story','#our-story'),('Stay & Soak','/hot-springs/'),('Local guide','/local-guide/')])]],width=size(25,'%'),width_mobile=size(100,'%')),container('Footer — Location',[eyebrow('Footer — Location label','Find us'),text('Footer — Address','<p>Historic Church Dairy Farm<br>La Verkin, Utah<br>Near Zion National Park</p>',typography_font_size=size(13))],width=size(25,'%'),width_mobile=size(100,'%')),container('Footer — Contact',[eyebrow('Footer — Contact label','A warm welcome awaits'),button('Footer — Phone','435 586 8658','tel:+14355868658','plain',_margin=edges()),button('Footer — Stay link','Find your stay ↗','/our-silo-suites/','plain',_margin=edges())],width=size(25,'%'),width_mobile=size(100,'%'))],flex_gap=gap(40)),row('Footer — Bottom',[text('Footer — Copyright','<p>© Silo Suites. All rights reserved.</p>',typography_font_size=size(10)),text('Footer — Signature','<p>Heritage / Comfort / Near Zion</p>',typography_font_size=size(10)),button('Footer — Homlay credit','Website by Homlay ↗','https://homlay.com/','plain',_margin=edges())],flex_justify_content='space-between',margin=edges(35,0,0,0),padding=edges(20,0,0,0),border_border='solid',border_width=edges(1,0,0,0),border_color='#D8D8CC')])],padding=edges(60,0,25,0),html_tag='footer')


def template(title, content, canvas=False):
    return {'content':content,'page_settings':{'hide_title':'yes','template':'elementor_canvas' if canvas else 'elementor_header_footer'},'version':'0.4','title':title,'type':'page'}


def site_part(name, root):
    """Portable saved section, insertable into a Pro Theme Builder header/footer."""
    part=copy.deepcopy(root)
    style=copy.deepcopy(styles)
    def prepare(value, rekey=False):
        if isinstance(value,dict):
            if rekey and 'elType' in value:
                value['id']=hashlib.sha256((name+value['id']).encode()).hexdigest()[:8]
            if value.get('url') in ('#our-story','#ss-find-stay'):
                value['url']='/'+value['url']
            if isinstance(value.get('html'),str):
                value['html']=value['html'].replace('href="#our-story"','href="/#our-story"').replace('href="#ss-find-stay"','href="/#ss-find-stay"')
            for child in value.values():prepare(child,rekey)
        elif isinstance(value,list):
            for child in value:prepare(child,rekey)
    prepare(part)
    # Theme Builder supplies the header/footer landmark around an inserted section.
    part['settings']['html_tag']='div'
    part['settings']['css_classes']+=' ss-site-'+name
    prepare(style,True)
    style['settings']['_title']=name.title()+' — Scoped styles — keep this section'
    return {'content':[style,part],'page_settings':[],'version':'0.4','title':f'Silo Suites — {name.title()} v{VERSION}','type':'section'}


def main():
    # Keep canonical JSONs independent of any test site's generated attachment IDs and URLs.
    for name,data in [('home-content',template(f'Silo Suites — Home content v{VERSION}',body)),('home-complete',template(f'Silo Suites — Complete homepage v{VERSION}',[styles,header,*body[1:],footer],True)),('header',site_part('header',header)),('footer',site_part('footer',footer))]:
        (OUT/f'silosuites-{name}-{VERSION}.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
    media_manifest=[]
    for a in [*ASSETS,logo_asset]:
        source=ROOT/a['source_file'] if a.get('source_file') else OUT/'assets'/a['filename']
        if not source.is_file():raise FileNotFoundError(source)
        media_manifest.append({'filename':a['filename'],'template_url':a['url'],'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'source_id':a['id'],'alt':ALT_TEXT[a['filename']]})
    (OUT/'media-manifest.json').write_text(json.dumps(media_manifest,indent=2)+'\n')
    plugin=ROOT/'wordpress/plugins'/RELEASE['plugin_slug']
    payload=plugin/'payload';(payload/'assets').mkdir(parents=True,exist_ok=True)
    for a in media_manifest:
        source=ROOT/'prototype/assets/logo.png' if a['filename']==logo_name else OUT/'assets'/a['filename']
        shutil.copyfile(source,payload/'assets'/a['filename'])
    for name in ['home-content','home-complete','header','footer']:
        shutil.copyfile(OUT/f'silosuites-{name}-{VERSION}.json',payload/f'{name}.json')
    shutil.copyfile(OUT/'media-manifest.json',payload/'media-manifest.json')
    print('Built two homepage templates, standalone header/footer sections, and a payload with',len(media_manifest),'original assets.')


if __name__=='__main__': main()
