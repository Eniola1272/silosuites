"""Apply the reviewed HTML editorial layout using native Elementor elements."""
def apply(b):
 def find(nodes,title):
  for n in nodes:
   if n['settings'].get('_title')==title:return n
   r=find(n.get('elements',[]),title)
   if r:return r
 def set_title(title,value):find(b.body,title)['settings']['title']=value
 def set_text(title,value):find(b.body,title)['settings']['editor']=value
 b.hero['settings']['background_image']=b.media_ref('The-Silo-Suites-51.jpg')
 b.hero['settings']['padding']=b.edges(60,0,60,0)
 set_text('01 — Welcome copy','<p>Distinctive silo suites on a historic farm in La Verkin, Utah. Your comfortable base for exploring Southern Utah.</p>')
 hero_content=b.hero['elements'][0]['elements']
 hero_content[-1]['settings']['link']['url']='#suites'
 hero_content.insert(-1,b.button('Updated — Hero availability','Check availability ↗','#ss-find-stay','dark'))
 b.search['settings']['margin']=b.edges(26,0,0,0);b.search['settings']['margin_mobile']=b.edges(20,0,0,0)
 intro_row=b.intro['elements'][0]
 intro_row['elements'][0]['elements']=[b.image('Updated — Porch detail','5c56e762-8c5c-4fe6-abbb-eec232e9355e-1.jpeg','White chairs beside the curved wall of a silo','ss-intro-detail'),b.text('Updated — Porch caption','<p>Your own little corner of the farm.</p>',typography_font_size=b.size(13))]
 set_title('03 — Intro heading','Somewhere different.<br><em>Somewhere to settle in.</em>')
 set_text('03 — Intro paragraph','<p>Original silos. Thoughtful interiors. A family farm with a new chapter. Come home to a place with character after a day exploring Southern Utah.</p>')
 find(b.body,'03 — Story link')['settings']['text']='Meet the family behind your stay'
 find(b.body,'04 — All suites link')['settings']['text']='Compare all stays'
 set_title('04 — The stays label','Four silos. One dairy suite. Or all four together.')
 specs=[('silo-1','Silo Suite 1','53758-143824-um3cH03nukuwkRaLUvJlEky5-um7PE22b-hi3oubfqI-6sss43783bd3a183.jpg','4 guests · 1 bath','1 bedroom · 2 beds','Curved silo walls, brick and warm timber.','/silo-suite-1/'),('silo-2','Silo Suite 2','The-Silo-Suites-12-3.jpg','5 guests · 1 bath','King, queen & twin beds','A main-floor king and room in the loft.','/silo-suite-2/'),('silo-3','Silo Suite 3','The-Silo-Suites-28.jpg','5 guests · 1 bath','2 bedrooms · 3 beds','Quiet corners in a converted silo.','/silo-suite-3/'),('silo-4','Silo Suite 4','The-Silo-Suites-50-1-scaled.jpg','4 guests · 1 bath','1 bedroom · 2 beds','Original brick, a timber loft and soft bedding.','/silo-suite-4/'),('dairy','The Dairy Suite','studio-apartmentsdwww.jpg','4 guests · 1 bath','1 bedroom · 2 beds','An open interior with natural timber beams.','/the-dairy-suite/'),('all-silos','All Four Silos','The-Silo-Suites-51.jpg','Up to 18 guests · group preview','4 silos · 6 bedrooms','Your own spaces on the same historic farm.','/entire-silo-suites/')]
 cards=[]
 for slug,name,photo,facts,beds,feature,url in specs:
  label='Updated — Card '+slug
  cards.append(b.container(label,[b.image(label+' photo',photo,name,'ss-card-image',link_to='custom',link={'url':url}),b.heading(label+' title',name,font=34,mobile=32,tag='h3',_margin=b.edges(20,0,0,0)),b.text(label+' facts','<p>'+facts+'<br>'+beds+'</p>',color=b.INK,_margin=b.edges(15,0,0,0)),b.text(label+' feature','<p>'+feature+'</p>',_margin=b.edges(12,0,0,0)),b.button(label+' availability','Check availability ↗','#ss-find-stay','dark',_css_classes='ss-button ss-has-arrow ss-quick-'+slug,align='justify'),b.button(label+' view','View suite →',url,_css_classes='ss-link ss-view-suite',align='justify')],'ss-card',width=b.size(31.7,'%'),width_tablet=b.size(47,'%'),width_mobile=b.size(100,'%')))
 b.suite_cards['elements']=cards;b.suite_cards['settings']['flex_wrap']='wrap'
 b.story['settings']['background_color']=b.TAN;b.story['settings']['padding']=b.edges(64,0,64,0)
 set_title('05 — Story heading','A family farm.<br><em>A personal welcome.</em>')
 set_text('05 — Story paragraphs',"<p>The historic Church Dairy Farm is part of our family's story. Today, we're sharing its next chapter through distinctive suites with original character and everyday comfort.</p>")
 reviews=[]
 for name,date,quote in [('Alissa','September 2026','Jaime’s Silo 4 was perfect and adorable! Decorated so well, very clean, and comfortable. Would definitely recommend!'),('Tessa','October 2026 · Review excerpt','Jamie communicated well, offered special discounts for area activities, and prepared a beautiful, comfortable living space for our relaxing girls weekend.')]:
  reviews.append(b.container('Updated — Review '+name,[b.text('Updated — Stars '+name,'<p>★★★★★</p>'),b.heading('Updated — Quote '+name,'“'+quote+'”',font=24,mobile=24,tag='p'),b.text('Updated — Source '+name,'<p><strong>'+name+'</strong><br>Airbnb · '+date+'</p>',typography_font_size=b.size(14),_margin=b.edges(20,0,0,0))],width=b.size(33,'%'),width_mobile=b.size(100,'%')))
 review=b.section('Updated — Guest reviews',[b.row('Updated — Reviews row',[b.container('Updated — Rating',[b.eyebrow('Updated — Review eyebrow','From our guests'),b.heading('Updated — Review title','Good stays.<br><em>In their words.</em>',font=37),b.heading('Updated — Rating number','4.99',font=48),b.text('Updated — Rating scope','<p>out of 5 · 169 reviews<br>Airbnb · Silo Suite 4</p>',typography_font_size=b.size(14))],width=b.size(33,'%'),width_mobile=b.size(100,'%')),*reviews],'ss-wrap',flex_gap=b.gap(40))],padding=b.edges(72,0,72,0))
 destinations=[]
 for i,(name,photo,copy,url) in enumerate([('Zion National Park','Zion-national-park11.jpg','Leave a day for the canyon. Find visitor information and ideas for your time in the park.','/local-guide/#zion'),('A little more Southern Utah','pioneerpark-stgeorge-family-hiking-19-e1603479587211.jpg','Red rock views, local stops and room to wander. Start planning the rest of your getaway.','/local-guide/')]):
  label='Updated — Destination '+str(i)
  destinations.append(b.container(label,[b.image(label+' image',photo,name,'ss-guide-image',link_to='custom',link={'url':url}),b.heading(label+' heading',name,font=32,tag='h3',link={'url':url},_margin=b.edges(22,0,0,0)),b.text(label+' description','<p>'+copy+'</p>',_margin=b.edges(16,0,0,0))],width=b.size(50,'%'),width_mobile=b.size(100,'%')))
 guide=b.section('Updated — Image-led guide',[b.wrap('Updated — Guide inner',[b.eyebrow('Updated — Guide eyebrow','Make a day of it'),b.heading('Updated — Guide title','Big days out.<br><em>A lovely place to come back to.</em>',font=50),b.row('Updated — Destination cards',destinations,margin=b.edges(35,0,0,0)),b.button('Updated — Guide link','Explore the local guide ↗','/local-guide/')])])
 faqitems=[('Where is Silo Suites?',"You'll find us on the historic Church Dairy Farm in La Verkin, Utah, near Zion National Park. Visit your suite page for location information."),('Which suite is right for our group?','Our individual suites accommodate up to 4 or 5 guests. Compare bedrooms, beds and amenities on the suite pages. For a larger gathering, explore the All Four Silos option and confirm its booking arrangements with us.'),('Where can I find check-in times and house rules?','Each suite page includes its own arrival information, amenities, house rules and cancellation terms. Review the details for your chosen suite before booking.'),('Can we include a visit to the hot springs?','Visit our Stay & Soak page for details, and confirm the current guest offer before purchasing.')]
 faq=b.section('Updated — FAQs',[b.wrap('Updated — FAQ inner',[b.heading('Updated — FAQ title','Before you<br><em>make yourself at home.</em>',font=40),*[b.container('Updated — FAQ '+str(i),[b.heading('Updated — Question '+str(i),q,font=23,tag='h3'),b.text('Updated — Answer '+str(i),'<p>'+a+'</p>')],'ss-faq-source',padding=b.edges(24,0,24,0)) for i,(q,a) in enumerate(faqitems)]])])
 set_title('08 — Closing title','Your Southern Utah<br><em>stay starts here.</em>')
 find(b.body,'08 — Closing CTA')['settings']['text']='Check availability'
 for n in b.header['elements'][0]['elements'][-1]['elements']:
  if n.get('widgetType')=='button':n['settings'].update(text='Check availability',background_color=b.INK,button_text_color='#FFFFFF')
 b.body=[b.styles,b.hero,b.search,b.intro,b.suites_section,review,b.story,b.soak,guide,faq,b.closing]

 # Keep the six editorial cards native. This runtime supplies a labelled demo
 # calendar only; production availability/checkout remains booking-plugin owned.
 fixture=(b.ROOT/'prototype/booking.mjs').read_text().replace('export ', '')
 popup=(b.ROOT/'prototype/quick-booking.mjs').read_text()
 popup='\n'.join(popup.splitlines()[1:]).replace('export function','function')
 popup=popup.replace('location.href=url.pathname+url.search;', "dialog.querySelector('[data-qb-status]').textContent='Sample stay reviewed. Live checkout is not connected; no booking has been made.';")
 popup=popup.replace('Continue to checkout <span', 'Review sample stay <span')
 popup=popup.replace('event.currentTarget.href=url.pathname+url.search;', "event.currentTarget.href=event.currentTarget.dataset.suiteUrl;")
 start="""(function(){function start(){if(window.elementorFrontend&&window.elementorFrontend.isEditMode())return;
 if(document.querySelector('.quick-booking-dialog'))return;
 document.querySelectorAll('[class*="ss-quick-"]').forEach(function(el){var match=el.className.match(/ss-quick-(silo-[1-4]|dairy|all-silos)/);var a=el.querySelector('a');if(match&&a){a.dataset.quickBook=match[1];a.addEventListener('click',function(e){e.preventDefault()})}});
 """
 end="""
 initQuickBooking({suites:suites,blocks:sampleBlocks(),getSearch:function(){return {checkIn:'',checkOut:'',guests:2}},onContinue:function(){}});
 document.querySelectorAll('[data-qb-view]').forEach(function(a){a.addEventListener('click',function(){var title=document.querySelector('#quick-booking-title').textContent;var item=suites.find(function(s){return s.name===title});a.href=item?({'silo-1':'/silo-suite-1/','silo-2':'/silo-suite-2/','silo-3':'/silo-suite-3/','silo-4':'/silo-suite-4/','dairy':'/the-dairy-suite/','all-silos':'/entire-silo-suites/'})[item.id]:'/our-silo-suites/'})});
 document.querySelectorAll('.ss-faq-source').forEach(function(el){var question=el.querySelector('.elementor-widget-heading');if(!question)return;var details=document.createElement('details'),summary=document.createElement('summary');summary.append(question);details.append(summary);while(el.firstChild)details.append(el.firstChild);el.append(details)});
 }if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start()})();"""
 css=(b.ROOT/'prototype/styles.css').read_text().split('dialog {',1)[1].split('.dialog-text',1)[0]
 # Scope shared dialog/calendar rules to this component, without a second reset.
 import re
 rules='dialog {'+css
 rules=re.sub(r'(^|})([^{}]+){',lambda m:m[1]+', '.join(('.quick-booking-dialog' if part.strip()=='dialog' else part.strip().replace('dialog::backdrop','.quick-booking-dialog::backdrop') if 'dialog::backdrop' in part else '.quick-booking-dialog '+part.strip()) for part in m[2].split(','))+'{',rules)
 runtime=b.widget('Updated — Homepage booking and FAQ preview runtime','html',{'html':'<style>.quick-booking-dialog{--cream:#f8f5eb;--white:#fff;--ink:#181a16;--tan:#d6c3ae;--rule:#d8d8cc;--muted:#595d54;--serif:Georgia,serif;background:#fff;color:#181a16;font:16px/1.6 Arial,sans-serif}.quick-booking-dialog h2{font-family:Georgia,serif}.quick-booking-dialog .eyebrow{font-size:11px;text-transform:uppercase;letter-spacing:.1em}.quick-booking-dialog button{font:inherit;color:inherit;background:none;border:0;cursor:pointer}.quick-booking-dialog .button-dark{display:flex;align-items:center;justify-content:space-between;background:#181a16;color:white;padding:16px;min-height:54px}'+rules+(b.ROOT/'prototype/quick-booking.css').read_text()+'</style><script>'+start+fixture+popup+end+'</script>'})
 b.body.append(b.container('Updated — Homepage interactions',[runtime],'ss-zero'))
