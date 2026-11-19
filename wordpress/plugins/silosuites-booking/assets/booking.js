(function(){'use strict';
const global=window.SiloSuitesBooking||{};
if(window.elementorFrontend&&window.elementorFrontend.isEditMode())return;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=(y,m,d)=>new Date(Date.UTC(y,m,d)).toISOString().slice(0,10),parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Denver',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
const part=t=>parts.find(p=>p.type===t).value,today=`${part('year')}-${part('month')}-${part('day')}`;
const add=(s,n)=>{const d=new Date(s+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)},horizon=add(today,365);
const label=s=>s?new Intl.DateTimeFormat('en-US',{timeZone:'UTC',month:'short',day:'numeric'}).format(new Date(s+'T12:00:00Z')):'Choose a date';
const valid=s=>/^\d{4}-\d{2}-\d{2}$/.test(s.in)&&/^\d{4}-\d{2}-\d{2}$/.test(s.out)&&s.in>=today&&s.out>s.in&&s.out<=horizon&&(Date.parse(s.out)-Date.parse(s.in))/86400000<=30;
const money=(v,c)=>new Intl.NumberFormat('en-US',{style:'currency',currency:c}).format(v);
function safeURL(s){try{const u=new URL(s,location.href);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password?u.href:'#';}catch{return '#';}}
async function api(config,path,params={},signal){const u=new URL(config.api+path,location.href);Object.entries(params).forEach(([k,v])=>u.searchParams.set(k,v));const response=await fetch(u,{credentials:'same-origin',cache:'no-store',signal,headers:{Accept:'application/json'}});let body;try{body=await response.json()}catch{throw Error('The booking service did not respond. Please retry.')}if(!response.ok||body.status==='error')throw Error(body.message||'Unable to check this stay. Please retry.');return body;}
const queryState=()=>{const q=new URLSearchParams(location.search);return {in:q.get('check_in')||'',out:q.get('check_out')||'',guests:Number(q.get('guests')||2)}};
const request=s=>({check_in:s.in,check_out:s.out,guests:s.guests});
function quoteHTML(q){return `<div class="ssb-quote">${q.components.filter(c=>c.included&&!c.deleted).map(c=>`<div><span>${esc(c.title)}</span><span>${esc(money(c.total,q.currency))}</span></div>`).join('')}<div class="ssb-total"><strong>Total</strong><strong>${esc(money(q.total,q.currency))}</strong></div></div><p class="ssb-note">Availability and price checked with Hostaway. No dates are held.</p>`;}
function carryDates(url,state){const target=new URL(safeURL(url),location.href);if(valid(state))Object.entries(request(state)).forEach(([k,v])=>target.searchParams.set(k,v));return target.href;}
function startingRate(p){const r=p.starting_rate;if(!r||r.currency!=='USD'||!Number.isInteger(r.amount_minor)||r.amount_minor<=0||r.amount_minor>100000000)return '';return '<p class="ssb-starting-rate">Rates from '+esc(new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:r.amount_minor%100?2:0,maximumFractionDigits:2}).format(r.amount_minor/100))+'</p>'; }
function card(p){return `<article class="ssb-card">${p.image?`<a href="${esc(safeURL(p.url))}"><img src="${esc(safeURL(p.image))}" alt="${esc(p.name)}" loading="lazy"></a>`:''}<h3>${esc(p.name)}</h3><p>${p.capacity?`Up to ${esc(p.capacity)} guests · ${esc(p.bedrooms)} bedrooms · ${esc(p.beds)} beds`:esc(p.reason)}</p><p>${esc(p.description)}</p>${startingRate(p)}<div data-ssb-card-quote="${esc(p.slug)}"></div><button type="button" data-ssb-book="${esc(p.slug)}" ${p.connected?'':'disabled'}>Check availability ↗</button><a class="ssb-view" href="${esc(safeURL(p.url))}">View suite →</a></article>`;}
let liveDialog=null;
function openBooking(config,property,initial=queryState(),onSearch=null,trigger=document.activeElement){
 if(liveDialog?.open)return;
 const d=document.createElement('dialog');d.className='ssb-dialog';d.setAttribute('aria-labelledby','ssb-dialog-title');
 const p=property;let state={...initial,guests:Math.max(1,Math.min(p?.capacity||5,Number.isInteger(initial.guests)?initial.guests:2))},month=(state.in>=today?state.in:today).slice(0,7),picking=state.in&&!state.out?'out':'in',days={},loading=false,quote=null,calendarSeq=0,quoteSeq=0;
 let calendarController,quoteController;
 if(!valid(state)){state.in='';state.out=''}
 d.innerHTML=`<header><div><p class="ssb-kicker">${p?'Live availability':'Find your stay'}</p><h2 id="ssb-dialog-title">${esc(p?.name||'Choose your dates')}</h2></div><button type="button" data-close aria-label="Close availability">×</button></header><div class="ssb-dialog-layout"><div class="ssb-calendar"><div class="ssb-month-nav"><button data-month="-1" aria-label="Previous month">←</button><p data-instruction></p><button data-month="1" aria-label="Next month">→</button></div><p role="status" data-calendar-status></p><div class="ssb-months"></div><button class="ssb-text" data-retry hidden>Retry availability</button><p class="ssb-note">${p?'Unavailable nights are crossed out.':'Search all suites together after choosing your dates.'}</p></div><aside><div class="ssb-dates"><button data-pick="in"><small>Arrival</small><span data-in></span></button><button data-pick="out"><small>Departure</small><span data-out></span></button></div><label>Guests<select data-guests aria-label="Number of guests">${Array.from({length:p?.capacity||5},(_,i)=>`<option value="${i+1}">${i+1} ${i?'guests':'guest'}</option>`).join('')}</select></label><p role="status" data-quote-status></p><div data-quote></div><button data-continue disabled>${p?'Continue to checkout ↗':'Find available suites ↗'}</button><p class="ssb-note">No payment or reservation is made at this step.</p></aside></div>`;
 document.body.append(d);liveDialog=d;const $=s=>d.querySelector(s);$('[data-guests]').value=state.guests;
 const nightOpen=s=>!p||days[s]?.available;
 const rangeOpen=(start,end)=>{for(let day=start;day<end;day=add(day,1))if(!nightOpen(day))return false;return true;};
 function draw(){
  const [year,m]=month.split('-').map(Number);let html='';
  for(let offset=0;offset<2;offset++){
   const first=new Date(Date.UTC(year,m-1+offset,1)),y=first.getUTCFullYear(),n=first.getUTCMonth(),name=new Intl.DateTimeFormat('en-US',{month:'long',year:'numeric',timeZone:'UTC'}).format(first);
   let buttons='<span></span>'.repeat(first.getUTCDay());
   for(let i=1;i<=new Date(Date.UTC(y,n+1,0)).getUTCDate();i++){
    const day=date(y,n,i),row=days[day];const blocked=p&&!row?.available;
    const departure=picking==='out'&&state.in&&day>state.in&&rangeOpen(state.in,day)&&(!p||row&&!row.closed_departure);
    const disabled=loading||day<today||day>horizon||(p&&(blocked||row?.closed_arrival)&&!departure);
    buttons+=`<button type="button" data-day="${day}" class="${day===state.in||day===state.out?'ssb-selected':state.in&&state.out&&day>state.in&&day<state.out?'ssb-range':''}${blocked?' ssb-blocked':''}" aria-label="${esc(day)}${blocked?', unavailable night':''}" aria-pressed="${day===state.in||day===state.out}" ${disabled?'disabled':''}>${i}</button>`;
   }
   html+=`<section><h3>${esc(name)}</h3><div class="ssb-weekdays">${['S','M','T','W','T','F','S'].map(x=>`<span>${x}</span>`).join('')}</div><div class="ssb-days">${buttons}</div></section>`;
  }
  $('.ssb-months').innerHTML=html;$('[data-in]').textContent=label(state.in);$('[data-out]').textContent=label(state.out);$('[data-instruction]').textContent=picking==='in'?'Choose arrival':'Choose departure';
  $('[data-month="-1"]').disabled=month<=today.slice(0,7);$('[data-month="1"]').disabled=month>=horizon.slice(0,7);
  $('[data-continue]').disabled=p?!quote:!valid(state);
 }
 async function loadCalendar(){if(!p){draw();return;}const seq=++calendarSeq;calendarController?.abort();calendarController=new AbortController();loading=true;quote=null;$('[data-continue]').disabled=true;$('[data-calendar-status]').textContent='Checking Hostaway availability…';$('[data-retry]').hidden=true;draw();
  const [y,m]=month.split('-').map(Number);let end=date(y,m+1,0);if(end>horizon)end=horizon;
  try{const result=await api(config,'calendar',{property:p.slug,start:month+'-01',end},calendarController.signal);if(seq!==calendarSeq)return;days=Object.fromEntries(result.days.map(x=>[x.date,x]));$('[data-calendar-status]').textContent='';loading=false;draw();await loadQuote();}
  catch(e){if(e.name==='AbortError')return;days={};loading=false;$('[data-calendar-status]').textContent=e.message;$('[data-retry]').hidden=false;draw();}
 }
 async function loadQuote(){quote=null;const seq=++quoteSeq;quoteController?.abort();$('[data-quote]').innerHTML='';$('[data-continue]').disabled=true;if(!p){draw();return;}
  if(!valid(state)){$('[data-quote-status]').textContent='Choose arrival and departure to see your stay total.';return;}
  quoteController=new AbortController();$('[data-quote-status]').textContent='Checking your dates and full stay total…';
  try{const result=await api(config,'quote',{property:p.slug,...request(state)},quoteController.signal);if(seq!==quoteSeq||!d.open)return;quote=result;$('[data-quote]').innerHTML=quoteHTML(result);$('[data-quote-status]').textContent='';draw();}catch(e){if(e.name!=='AbortError'&&seq===quoteSeq)$('[data-quote-status]').textContent=e.message;}
 }
 d.addEventListener('click',e=>{
  if(e.target.closest('[data-close]'))d.close();
  const nav=e.target.closest('[data-month]');if(nav&&!nav.disabled){const [y,m]=month.split('-').map(Number);month=date(y,m-1+Number(nav.dataset.month),1).slice(0,7);loadCalendar();}
  const pick=e.target.closest('[data-pick]');if(pick){picking=pick.dataset.pick==='out'&&state.in?'out':'in';draw();}
  const day=e.target.closest('[data-day]');if(day&&!day.disabled){const val=day.dataset.day;if(picking==='in'||!state.in||val<=state.in){if(p&&!nightOpen(val))return;state.in=val;state.out='';picking='out'}else state.out=val;draw();loadQuote();d.querySelector(`[data-day="${val}"]`)?.focus();}
  if(e.target.closest('[data-retry]'))loadCalendar();
  if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}
 });
 $('[data-guests]').addEventListener('change',e=>{state.guests=Number(e.target.value);loadQuote()});
 $('[data-continue]').addEventListener('click',()=>{if(p){if(!quote)return;const url=new URL(config.checkout,location.href);Object.entries({property:p.slug,...request(state)}).forEach(([k,v])=>url.searchParams.set(k,v));location.href=url.href}else if(valid(state)){onSearch?.({...state});d.close()}});
 d.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const controls=[...d.querySelectorAll('button:not(:disabled),select,a[href]')].filter(x=>x.getClientRects().length),first=controls[0],last=controls.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}});
 d.addEventListener('close',()=>{calendarController?.abort();quoteController?.abort();++calendarSeq;++quoteSeq;d.remove();liveDialog=null;document.body.classList.remove('ssb-modal-open');trigger?.focus({preventScroll:true})});
 document.body.classList.add('ssb-modal-open');d.showModal();loadCalendar();
}
function init(root){if(root.dataset.ssbBound)return;root.dataset.ssbBound='1';let config;try{config=JSON.parse(root.dataset.ssbConfig)}catch{return;}let state=queryState();
 if(config.type==='related'){
  const others=config.properties.filter(p=>p.slug!==config.property).slice(0,2).map(p=>({...p,url:carryDates(p.url,state)}));
  root.classList.add('ssb-related');root.innerHTML=`<header class="ssb-related-heading"><h2>Explore other properties</h2><a href="${esc(carryDates(config.suites||'/our-silo-suites/',state))}">View all properties →</a></header><div class="ssb-grid">${others.map(card).join('')}</div>`;return;
 }
 if(config.type==='properties'){root.innerHTML=`<div class="ssb-grid">${config.properties.map(card).join('')}</div>`;return;}
 if(config.type==='booking'){const p=config.properties.find(p=>p.slug===config.property);root.innerHTML=p?`<div class="ssb-panel"><h3>Find your dates</h3><p>${esc(p.name)}</p><button data-ssb-book="${esc(p.slug)}" ${p.connected?'':'disabled'}>Check availability ↗</button><p class="ssb-note">${p.connected?'Choose dates and guests to see your full stay total.':esc(p.reason)}</p></div>`:'<p>Choose a connected property.</p>';return;}
 if(config.type==='checkout'){
  const slug=new URLSearchParams(location.search).get('property');root.innerHTML='<div class="ssb-checkout"><h2>Review your stay</h2><div role="status" data-review-status>Checking availability and price…</div><div data-review></div><p>Online payment and reservations are not enabled yet. No dates have been held.</p><button disabled>Payment unavailable</button><button class="ssb-text" data-recheck>Recheck dates and total</button></div>';
  async function review(){root.querySelector('[data-review-status]').textContent='Checking availability and price…';root.querySelector('[data-review]').innerHTML='';try{const q=await api(config,'quote',{property:slug,...request(state)});root.querySelector('[data-review-status]').textContent=`${q.property_name} · ${label(q.check_in)} – ${label(q.check_out)} · ${q.guests} guests`;root.querySelector('[data-review]').innerHTML=quoteHTML(q)}catch(e){root.querySelector('[data-review-status]').textContent=e.message;}}
  root.querySelector('[data-recheck]').onclick=review;review();return;
 }
 root.innerHTML=`<form class="ssb-search"><button type="button" data-search-date="in">Arrival<br><span data-search-in></span></button><button type="button" data-search-date="out">Departure<br><span data-search-out></span></button><label>Guests<select name="guests">${Array.from({length:5},(_,i)=>`<option value="${i+1}">${i+1}</option>`).join('')}</select></label><button type="submit">Find a stay ↗</button></form><p role="status" data-results-status></p><div class="ssb-grid" data-results></div>`;
 const form=root.querySelector('form');function labels(){root._ssbState={...state};root.querySelector('[data-search-in]').textContent=label(state.in);root.querySelector('[data-search-out]').textContent=label(state.out);form.elements.guests.value=state.guests}labels();let searchSeq=0;
 async function search(){if(!valid(state)){openBooking(config,null,state,selected=>{state=selected;labels();search()});return;}const seq=++searchSeq;const status=root.querySelector('[data-results-status]'),results=root.querySelector('[data-results]');status.textContent='Finding available suites…';results.innerHTML='';try{const found=await api(config,'availability',request(state));if(seq!==searchSeq)return;const props=config.properties.filter(p=>found.properties[p.slug]?.available);results.innerHTML=props.map(card).join('');status.textContent=props.length?`${props.length} available stays`:'No stays match these dates and guests. Try another search.';
  for(const p of props){try{const q=await api(config,'quote',{property:p.slug,...request(state)});if(seq!==searchSeq)return;const target=root.querySelector(`[data-ssb-card-quote="${p.slug}"]`);target.innerHTML=`<strong>${esc(money(q.total,q.currency))} total</strong><p class="ssb-note">${q.nights} nights · fees and taxes included</p>`}catch(e){if(seq===searchSeq)root.querySelector(`[data-ssb-card-quote="${p.slug}"]`).textContent='Total could not be confirmed. Check availability to retry.';}}
 }catch(e){if(seq===searchSeq)status.textContent=e.message;}}
 form.addEventListener('submit',e=>{e.preventDefault();state.guests=Number(form.elements.guests.value);search()});form.querySelectorAll('[data-search-date]').forEach(b=>b.onclick=()=>openBooking(config,null,state,selected=>{state=selected;labels()}));
 root._ssbSearch=selected=>{state=selected;labels();search()};if(valid(state))search();
}
function activeSearch(){const f=document.querySelector('form[data-ss-design-search]');if(!f)return queryState();const values=new FormData(f);return {in:String(values.get('check_in')||''),out:String(values.get('check_out')||''),guests:Number(values.get('guests')||2)}}
function start(){
 document.querySelectorAll('.ss-quick-all-silos,[data-quick-book="all-silos"]').forEach(el=>{const card=el.closest('.ss-card,.suite-card');if(card)card.remove();else el.remove()});
 document.querySelectorAll('.ss-design a[href*="/entire-silo-suites/"]').forEach(a=>{const row=a.closest('.e-con');if(row&&!row.classList.contains('ss-card'))row.remove()});
 document.querySelectorAll('.ssb-group-contact,.group-inquiry').forEach(el=>el.remove());
 document.querySelectorAll('.sp-property a').forEach(a=>{if(/^Open (?:the area )?map/i.test(a.textContent.trim()))(a.closest('.elementor-widget-button')||a).remove()});
 const path=location.pathname,match=path.match(/silo-suite-([1-4])\/?$/),slug=match?'silo-'+match[1]:/the-dairy-suite\/?$/.test(path)?'dairy':null;
 if(slug&&global.properties){
  document.querySelectorAll('.sp-property').forEach(page=>{if(page.querySelector('[data-ssb-reviews]'))return;const root=document.createElement('section');root.className='ssb-app';root.id='sp-reviews';root.dataset.ssbReviews='';root.dataset.property=slug;root.dataset.api=global.api+'reviews';const location=page.querySelector('#sp-location');if(location)location.before(root);else page.append(root);window.SiloSuitesReviews?.mount(root)});document.querySelectorAll('.sp-preview-form').forEach(form=>{const root=document.createElement('div');root.className='ssb-app';root.dataset.ssbConfig=JSON.stringify({...global,type:'booking',property:slug});form.replaceWith(root)});document.querySelectorAll('.sp-booking .elementor-widget-text-editor').forEach(el=>{if(el.textContent.includes('Design preview'))el.textContent='Live calendar and pricing. Online payment is not enabled yet.'});}
 if(slug&&global.properties&&!document.querySelector('[data-ssb-related]')){const page=document.querySelector('.sp-property');if(page){const related=document.createElement('section');related.className='ssb-app';related.dataset.ssbRelated='';related.dataset.ssbConfig=JSON.stringify({...global,type:'related',property:slug});page.after(related)}}
 document.querySelectorAll('[data-ssb-config]').forEach(init);
 document.querySelectorAll('[data-ssb-reviews]').forEach(root=>window.SiloSuitesReviews?.mount(root));
 // Elementor design uploads retain native content; enhance only their booking actions.
 document.addEventListener('click',e=>{const button=e.target.closest('[data-ssb-book],[data-quick-book], [class*="ss-quick-"] a');if(!button)return;let slug=button.dataset.ssbBook||button.dataset.quickBook;const match=button.closest('[class*="ss-quick-"]')?.className.match(/ss-quick-(silo-[1-4]|dairy|all-silos)/);slug=slug||match?.[1];const scope=button.closest('[data-ssb-config]'),config=scope?JSON.parse(scope.dataset.ssbConfig):global;const p=config.properties?.find(p=>p.slug===slug);if(!p)return;e.preventDefault();e.stopImmediatePropagation();openBooking(config,p,scope?scope._ssbState||queryState():activeSearch(),null,button)},true);
 document.addEventListener('submit',e=>{const form=e.target.closest('form[data-ss-design-search]');if(!form)return;const data=new FormData(form),state={in:String(data.get('check_in')||''),out:String(data.get('check_out')||''),guests:Number(data.get('guests')||2)};if(!valid(state))return;e.preventDefault();e.stopImmediatePropagation();let target=form.parentElement.querySelector('[data-ssb-config]');if(!target){target=document.createElement('div');target.className='ssb-app';target.dataset.ssbConfig=JSON.stringify({...global,type:'search'});form.after(target);init(target)}target._ssbSearch(state);},true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
