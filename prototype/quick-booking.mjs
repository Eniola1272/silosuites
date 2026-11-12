import {addDays, dateValue, isoDate, todayInUtah, formatDate, nightCount, validateSearch, isAvailable, sampleQuote, money} from './booking.mjs';

// UI adapter for the local fixture provider. Production uses the same flow with
// server-owned calendars/quotes and a verified checkout session, never these prices.
export function initQuickBooking({suites, blocks, getSearch, onContinue}) {
  const today = todayInUtah();
  const dialog = document.createElement('dialog');
  dialog.className = 'quick-booking-dialog';
  dialog.setAttribute('aria-labelledby', 'quick-booking-title');
  dialog.innerHTML = `<div class="quick-booking-header"><div><p class="eyebrow">Find your dates</p><h2 id="quick-booking-title"></h2></div><button type="button" class="close-button" data-qb-close aria-label="Close availability">×</button></div><div class="quick-booking-layout"><div class="quick-calendar-panel"><p class="quick-demo-note">Design preview · sample availability, not a live calendar.</p><div class="quick-calendar-nav"><button type="button" data-qb-month="-1" aria-label="Previous month">←</button><p data-qb-instruction aria-live="polite"></p><button type="button" data-qb-month="1" aria-label="Next month">→</button></div><div class="quick-months"></div><p class="quick-calendar-key"><span>Available</span><span class="key-blocked">Unavailable night</span><span class="key-selected">Your dates</span></p></div><div class="quick-booking-summary"><p data-qb-facts></p><div class="quick-date-fields"><button type="button" data-qb-pick="in"><span>Arrival</span><strong data-qb-date="in"></strong></button><button type="button" data-qb-pick="out"><span>Departure</span><strong data-qb-date="out"></strong></button></div><label class="quick-guests">Guests<select data-qb-guests aria-label="Guests for this property"></select></label><p class="quick-booking-status" data-qb-status role="status"></p><div data-qb-quote></div><button type="button" class="button button-dark quick-continue" data-qb-continue disabled>Continue to checkout <span aria-hidden="true">↗</span></button><p class="quick-no-charge">Preview only. No reservation or payment is made.</p><a class="text-link" data-qb-view>View suite details <span aria-hidden="true">↗</span></a></div></div>`;
  document.body.append(dialog);
  const $ = selector => dialog.querySelector(selector);
  let suite, search, picking = 'in', shownMonth, trigger;
  const month = (date, delta = 0) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth()+delta, 1));
  const monthKey = date => isoDate(date).slice(0, 7);
  const valid = () => !validateSearch(search, today) && isAvailable(suite, search, blocks, today);
  function blockedNight(date) {
    const ids = suite.category === 'group' ? [suite.id, ...suites.filter(s => s.category === 'silo').map(s => s.id)] : suite.category === 'silo' ? [suite.id, 'all-silos'] : [suite.id];
    return ids.some(id => (blocks[id] || []).some(([start, end]) => date >= start && date < end));
  }
  function openNightsUntil(date) {
    if (!search.checkIn || date <= search.checkIn) return false;
    for (let d = search.checkIn; d < date; d = addDays(d, 1)) if (blockedNight(d)) return false;
    return true;
  }
  function monthHTML(date) {
    const year=date.getUTCFullYear(), m=date.getUTCMonth(), first=new Date(Date.UTC(year,m,1)).getUTCDay();
    let days='<span aria-hidden="true"></span>'.repeat(first);
    for(let day=1;day<=new Date(Date.UTC(year,m+1,0)).getUTCDate();day++) {
      const value=isoDate(Date.UTC(year,m,day)), blocked=blockedNight(value);
      // An unavailable night may still be a valid departure boundary. No range
      // can cross that night, and it can never be selected as an arrival.
      const departure=picking==='out' && openNightsUntil(value);
      const disabled=value<today || value>addDays(today,365) || (blocked&&!departure);
      const selected=value===search.checkIn||value===search.checkOut;
      const range=search.checkIn&&search.checkOut&&value>search.checkIn&&value<search.checkOut;
      days+=`<button type="button" data-qb-day="${value}" class="calendar-day${selected?' selected':''}${range?' in-range':''}${blocked?' qb-blocked':''}" aria-label="${formatDate(value,{month:'long',year:'numeric',weekday:'long'})}${blocked?departure?', departure available; night unavailable':', unavailable night':''}" aria-pressed="${Boolean(selected)}"${disabled?' disabled':''}>${day}</button>`;
    }
    const name=new Intl.DateTimeFormat('en-US',{month:'long',year:'numeric',timeZone:'UTC'}).format(date);
    return `<section class="calendar-month" aria-label="${name}"><h3>${name}</h3><div class="weekdays" aria-hidden="true">${['S','M','T','W','T','F','S'].map(d=>`<span>${d}</span>`).join('')}</div><div class="day-grid">${days}</div></section>`;
  }
  function render() {
    $('.quick-months').innerHTML=monthHTML(shownMonth)+monthHTML(month(shownMonth,1));
    $('[data-qb-date="in"]').textContent=formatDate(search.checkIn);
    $('[data-qb-date="out"]').textContent=formatDate(search.checkOut);
    dialog.querySelectorAll('[data-qb-pick]').forEach(b=>b.classList.toggle('active',b.dataset.qbPick===picking));
    $('[data-qb-instruction]').textContent=picking==='in'?'Choose your arrival':'Choose your departure';
    $('[data-qb-month="-1"]').disabled=monthKey(shownMonth)<=today.slice(0,7);
    $('[data-qb-month="1"]').disabled=monthKey(shownMonth)>=addDays(today,365).slice(0,7);
    const error=validateSearch(search,today);
    const available=valid();
    $('[data-qb-status]').textContent=!search.checkIn?'Choose an available arrival date.':!search.checkOut?`Choose your departure. Minimum ${suite.minStay} nights.`:error||(!available?`These dates are unavailable or shorter than the ${suite.minStay}-night minimum. Please try another range.`:`${nightCount(search.checkIn,search.checkOut)} nights for ${search.guests} ${search.guests===1?'guest':'guests'}. Available in this demo.`);
    $('[data-qb-continue]').disabled=!available;
    $('[data-qb-quote]').innerHTML=available?quoteHTML(sampleQuote(suite,search)):'';
  }
  function quoteHTML(q) {return `<div class="quote-breakdown"><div><span>${q.nights} nights · sample rate</span><span>${money(q.accommodation)}</span></div><div><span>Sample cleaning fee</span><span>${money(q.cleaning)}</span></div><div><span>Sample taxes</span><span>${money(q.tax)}</span></div><div class="total"><span>Sample total</span><span>${money(q.total)}</span></div></div>`;}
  function open(property, opener) {
    suite=property; trigger=opener;
    const previous=getSearch();
    search={checkIn:previous.checkIn||'',checkOut:previous.checkOut||'',guests:Math.min(suite.capacity,Math.max(1,Number.isInteger(previous.guests)?previous.guests:2))};
    if(dateValue(search.checkIn)===null||search.checkIn<today){search.checkIn='';search.checkOut='';}
    if(dateValue(search.checkOut)===null||search.checkOut<=search.checkIn)search.checkOut='';
    picking=search.checkIn&&!search.checkOut?'out':'in';
    shownMonth=month(new Date(dateValue(search.checkIn||today)));
    $('#quick-booking-title').textContent=suite.name;
    $('[data-qb-facts]').textContent=`Up to ${suite.capacity} guests · ${suite.bedrooms} ${suite.bedrooms===1?'bedroom':'bedrooms'} · ${suite.baths} ${suite.baths===1?'bath':'baths'}`;
    if(suite.category==='group')$('[data-qb-facts]').textContent+=' · Group booking setup pending';
    $('[data-qb-guests]').innerHTML=Array.from({length:suite.capacity},(_,i)=>`<option value="${i+1}">${i+1} ${i?'guests':'guest'}</option>`).join('');
    $('[data-qb-guests]').value=String(search.guests);
    $('[data-qb-view]').href=`suite.html?id=${encodeURIComponent(suite.id)}`;
    render();dialog.showModal();document.body.classList.add('dialog-open');
  }
  document.addEventListener('click',event=>{const button=event.target.closest('[data-quick-book]');if(!button)return;const selected=suites.find(s=>s.id===button.dataset.quickBook);if(selected)open(selected,button);});
  $('[data-qb-close]').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{if(!document.querySelector('dialog[open]'))document.body.classList.remove('dialog-open');trigger?.focus({preventScroll:true});});
  dialog.addEventListener('click',event=>{
    if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}
    const day=event.target.closest('[data-qb-day]');
    if(day&&!day.disabled){const value=day.dataset.qbDay;
      if(picking==='in'||!search.checkIn||value<=search.checkIn){if(blockedNight(value))return;search.checkIn=value;search.checkOut='';picking='out';}
      else{search.checkOut=value;}
      render();dialog.querySelector(`[data-qb-day="${value}"]`)?.focus();
    }
    const nav=event.target.closest('[data-qb-month]');if(nav&&!nav.disabled){shownMonth=month(shownMonth,Number(nav.dataset.qbMonth));render();}
    const pick=event.target.closest('[data-qb-pick]');if(pick){picking=pick.dataset.qbPick==='out'&&search.checkIn?'out':'in';render();}
  });
  $('[data-qb-guests]').addEventListener('change',event=>{search.guests=Number(event.target.value);render();});
  $('[data-qb-continue]').addEventListener('click',()=>{if(!valid())return;onContinue({...search});const url=new URL('checkout.html',location.href);url.search=new URLSearchParams({property:suite.id,check_in:search.checkIn,check_out:search.checkOut,guests:String(search.guests)}).toString();location.href=url.pathname+url.search;});
  $('[data-qb-view]').addEventListener('click',event=>{const url=new URL(event.currentTarget.href);if(search.checkIn)url.searchParams.set('check_in',search.checkIn);if(search.checkOut)url.searchParams.set('check_out',search.checkOut);url.searchParams.set('guests',search.guests);event.currentTarget.href=url.pathname+url.search;});
  dialog.addEventListener('keydown',event=>{
    if(event.key!=='Tab')return;
    const controls=[...dialog.querySelectorAll('button:not(:disabled),a[href],select')].filter(el=>el.getClientRects().length),first=controls[0],last=controls.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  });
}
