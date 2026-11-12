#!/usr/bin/env python3
"""Native property page + editable native popup content; run after build_elementor.py."""
import copy,hashlib,json,shutil
from pathlib import Path
import build_elementor as b
R=b.ROOT; O=b.OUT; V=b.VERSION
photo_names=['The-Silo-Suites-12-3.jpg','The-Silo-Suites-13.jpg','The-Silo-Suites-36.jpg','The-Silo-Suites-17.jpg','The-Silo-Suites-51.jpg']
manifest=json.loads((O/'media-manifest.json').read_text()); existing={x['filename']:x for x in manifest}
for i,name in enumerate(photo_names):
 source=R/'prototype/assets/property-2'/name
 # Preserve the exact ZIP originals, including assets with a matching homepage filename.
 if name in existing:
  if existing[name]['sha256'] != hashlib.sha256(source.read_bytes()).hexdigest():
   name='property-2-'+name
 if name not in existing:
  a={'filename':name,'template_url':'/wp-content/uploads/silosuites-design/'+name,'source_id':9990100+i,'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'alt':'Silo Suite 2 — '+['main floor bedroom','sitting area and bedroom','upstairs sleeping space','bright interior','farm exterior'][i]}
  manifest.append(a);existing[name]=a
  shutil.copyfile(source,O/'assets'/name)
 a=existing[name];b.BY_NAME[name]={'filename':name,'url':a['template_url'],'id':a['source_id']}
 photo_names[i]=name

def c(label,children,classes='',**kw):return b.container('Property — '+label,children,'sp '+classes,**kw)
def h(label,title,**kw):return b.heading('Property — '+label,title,**kw)
def t(label,content,**kw):return b.text('Property — '+label,content,**kw)
def btn(label,title,url,**kw):return b.button('Property — '+label,title,url,**kw)
def img(label,index,classes=''):
 return b.image('Property — '+label,photo_names[index],existing[photo_names[index]]['alt'],classes,link_to='custom',link={'url':'#sp-gallery'})
def sect(label,title,children,id):return c(label,[h(label+' title',title,font=30,mobile=28),*children],'sp-section',_element_id=id)
def popup(name,title,children):return c('Popup — '+name+' — edit all content here',[h('Popup '+name+' heading',title,font=34,mobile=28),*children],'sp-popup-source',_element_id='sp-popup-'+name.lower())
def lists(label,items):return t(label,'<ul>'+''.join('<li>'+x+'</li>' for x in items)+'</ul>')
about=popup('About','About this stay',[t('Full description','<p>A peaceful stay in a converted silo on the historic Church Family Dairy Farm. Farmhouse charm, thoughtful details, and Southern Utah adventures just beyond your door.</p><p>An open layout and vaulted ceilings give the suite a spacious feel. Settle into a king, queen, or twin bed, and enjoy a kitchenette with a mini-fridge, microwave, cooktop, coffee maker, toaster, and dining supplies for five.</p><p>A tile shower, quiet mini-split heating and cooling, and free Wifi make it easy to feel at home. Outside, enjoy the fire pit and charcoal BBQ grill. This is one of four silo suites at the farm.</p>')])
groups=[('Comfort & connection',['Wifi','Air conditioning']),('Kitchen & dining',['Microwave','Mini-fridge','Cooktop','Coffee maker','Toaster','Dining supplies for 5']),('Bathroom',['Hair dryer','Tile shower']),('Outdoors & parking',['Free parking on premises','EV charger','Fire pit','Charcoal BBQ grill'])]
amenities=popup('Amenities','What this stay offers',[c('Amenities — '+title,[h('Amenity group '+title,title,font=23,mobile=23,tag='h3'),lists('Amenity list '+title,items)],'sp-amenity-group') for title,items in groups])
rules=popup('Rules','House rules',[lists('All house rules',['Check-in from 3:00 pm','Check-out by 10:00 am','Children welcome','No smoking','No parties or events'])])
cancellation=popup('Cancellation','Cancellation policy',[t('Cancellation terms','<p>The current listing states a 100% refund up to 14 days before arrival and a 50% refund up to 7 days before arrival.</p><p>Source: supplied property template. Confirm final terms in Hostaway before live checkout.</p>')])
nav=c('Sticky section navigation',[btn('Overview link','Overview','#sp-overview'),btn('Sleeping link','Sleeping','#sp-sleep'),btn('Amenities link','Amenities','#sp-amenities'),btn('Location link','Location','#sp-location'),btn('Good to know link','Good to know','#sp-know')],'sp-subnav',html_tag='nav',flex_direction='row',flex_direction_mobile='row',flex_gap=b.gap(28))
gallery=c('Five-photo gallery',[img('Main gallery photograph',0,'sp-gallery-main'),*[img('Gallery photograph '+str(i+1),i) for i in range(1,5)],btn('Open all photos','View all photos ↗','#sp-gallery')],'sp-gallery')
heading=c('Property heading',[b.eyebrow('Property — Location label','Room to slow down / La Verkin, Utah'),h('Property name','Silo Suite 2',font=58,mobile=40,tag='h1'),t('Property town','<p>La Verkin, Utah · Near Zion National Park</p>'),t('Capacity and rooms','<p>5 guests &nbsp; · &nbsp; 2 bedrooms &nbsp; · &nbsp; 3 beds &nbsp; · &nbsp; 1 bath</p>')],'sp-heading')
signature=c('Farm signature',[b.logo('Property — Original farm logo'),c('Farm signature copy',[h('Farm signature title','A stay with a story.',font=20,mobile=20,tag='h3'),t('Farm signature caption','<p>Historic farm character. Thoughtfully reimagined.</p>')])],'sp-signature',flex_direction='row',flex_direction_mobile='row',flex_align_items='center',flex_gap=b.gap(18))
overview=sect('Overview','A little history.<br><em>A lot of comfort.</em>',[t('Short description','<p>A peaceful stay in a converted silo on the historic Church Family Dairy Farm. Farmhouse charm, thoughtful details, and Southern Utah adventures just beyond your door.</p>'),btn('Open about popup','More about this stay ↗','#sp-popup-about')],'sp-overview')
highlights=c('Three stay highlights',[c('Highlight '+str(i),[b.eyebrow('Property — Highlight number '+str(i),'0'+str(i)),h('Highlight '+title,title,font=20,mobile=20,tag='h3'),t('Highlight copy '+str(i),'<p>'+copy+'</p>')]) for i,(title,copy) in enumerate([('Rooted in the farm','A new chapter for a historic dairy.'),('Room to unwind','Vaulted ceilings. Farmhouse details.'),('Southern Utah awaits','A place to return to after exploring.')],1)],'sp-highlights')
sleep=sect('Sleeping','Room for a slower morning.',[b.eyebrow('Property — Sleeping facts','2 bedrooms / 3 beds'),c('Sleeping photographs',[c('Main floor photograph',[img('Main floor sleeping photograph',1),h('Main floor photo title','Make yourself at home',font=20,mobile=20,tag='h3'),t('Main floor photo caption','<p>Light-filled spaces, farmhouse character.</p>')]),c('Upstairs photograph',[img('Upstairs sleeping photograph',2),h('Upstairs photo title','A quiet place to rest',font=20,mobile=20,tag='h3'),t('Upstairs photo caption','<p>A little retreat after a day outdoors.</p>')])],'sp-sleep-grid'),t('Bed arrangements','<p>Sleeping arrangements: 1 king bed · 1 queen bed · 1 twin bed.</p>')],'sp-sleep')
preview=sect('Amenities','The little things, considered.',[lists('Amenity preview',['Wifi','Air conditioning','Free parking on premises','EV charger','Fire pit','Charcoal BBQ grill','Hair dryer','Microwave']),btn('Open amenities popup','See all amenities ↗','#sp-popup-amenities')],'sp-amenities');preview['elements'][1]['settings']['_css_classes']='sp-amenities-preview'
location=sect('Location','Away from the everyday.<br><em>Close to the adventure.</em>',[t('Area description','<p>The farm is in La Verkin, near grocery stores, restaurants, and a laundromat. The listing places Zion National Park’s entrance around a 30-minute drive away.</p>'),b.widget('Property — Leaflet map — functional settings','html',{'html':'<div class="sp-map" data-lat="37.2011" data-lng="-113.2697" role="region" aria-label="Interactive map of the La Verkin area"><p>La Verkin area map — preview location.</p></div><p class="sp-map-status" role="status"></p>'}),t('Map precision note','<p>La Verkin area shown. This is a town reference, not the exact property location.</p>'),btn('External map link','Open the area map ↗','https://www.openstreetmap.org/?mlat=37.2011&mlon=-113.2697#map=13/37.2011/-113.2697'),btn('Local guide link','Our Southern Utah guide ↗','/local-guide/')],'sp-location')
help=c('Host contact',[b.eyebrow('Property — Contact label','A little help planning your stay'),h('Contact heading','Make yourself at home.',font=30,mobile=28),t('Contact copy','<p>Have a question about the suites or the farm? We’re happy to help.</p>'),btn('Phone link','Call Silo Suites ↗','tel:+14355868658')],'sp-help')
know=sect('Good to know','Before you arrive.',[t('Arrival introduction','<p>A few useful details for a considered stay.</p>'),c('Arrival popup buttons',[btn('Open rules popup','House rules ↗','#sp-popup-rules'),btn('Open cancellation popup','Cancellation policy ↗','#sp-popup-cancellation')],'sp-rule-buttons',flex_direction='row',flex_direction_mobile='row')],'sp-know')
editorial=c('Editorial column',[heading,signature,overview,highlights,sleep,preview,location,help,know],'sp-editorial')
booking=c('Booking card',[b.eyebrow('Property — Booking label','Your own little escape'),h('Booking heading','Stay a little longer.',font=29,mobile=29),t('Booking introduction','<p>Choose your dates. Find your slower pace.</p>'),b.widget('Property — Booking form — preview only','html',{'html':(O/'property-booking.html').read_text()}),t('Booking preview note','<p>Design preview · live availability and checkout are not connected. No reservation or payment is made.</p>'),btn('Compare stays','Compare all stays ↗','/our-silo-suites/')],'sp-booking',_element_id='sp-booking',html_tag='aside')
style=b.widget('Property — 00 Styles — keep this widget','html',{'html':'<style>\n'+(O/'design.css').read_text()+'\n'+(O/'property.css').read_text()+'\n'+(R/'prototype/assets/vendor/leaflet/leaflet.css').read_text()+'\n</style>'})
leaflet=(R/'prototype/assets/vendor/leaflet/leaflet.js').read_text().replace('//# sourceMappingURL=leaflet.js.map','')
license=(R/'prototype/assets/vendor/leaflet/LICENSE').read_text()
runtime=b.widget('Property — 99 Interactions — keep this widget','html',{'html':'<script>/* Leaflet 1.9.4\n'+license+'\n*/\n'+leaflet+'</script>\n<script>\n'+(O/'property-runtime.js').read_text()+'\n</script>'})
root=c('Silo Suite 2 page',[style,nav,c('Page inner',[btn('Back to stays','← All stays','/our-silo-suites/'),gallery,c('Property layout',[editorial,booking],'sp-layout'),about,amenities,rules,cancellation],'sp-wrap'),runtime],'sp-property')
for kind,content in [('property',[root]),('property-complete',[copy.deepcopy(b.styles),copy.deepcopy(b.header),root,copy.deepcopy(b.footer)])]:
 data=b.template('Silo Suites — '+('Silo Suite 2' if kind=='property' else 'Complete Silo Suite 2')+' v'+V,content,kind.endswith('complete'))
 (O/f'silosuites-{kind}-{V}.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
for name,node in [('about',about),('amenities',amenities),('rules',rules),('cancellation',cancellation)]:
 data={'content':[copy.deepcopy(style),copy.deepcopy(node)],'page_settings':[],'version':'0.4','title':'Silo Suites — Popup content '+name.title()+' v'+V,'type':'section'}
 (O/f'silosuites-popup-{name}-{V}.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
manifest_path=O/'media-manifest.json';manifest_path.write_text(json.dumps(manifest,indent=2)+'\n')
payload=R/'wordpress/plugins/silosuites-design-importer/payload'
for asset in manifest:shutil.copyfile(O/'assets'/asset['filename'] if asset['filename']!='silo-logo.png' else R/'prototype/assets/logo.png',payload/'assets'/asset['filename'])
shutil.copyfile(manifest_path,payload/'media-manifest.json')
for name in ['property','property-complete','popup-about','popup-amenities','popup-rules','popup-cancellation']:
 shutil.copyfile(O/f'silosuites-{name}-{V}.json',payload/(name+'.json'))
print('Built native property pages and four reusable popup-content sections with',len(manifest),'media assets.')
