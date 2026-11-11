import { initPropertyMap } from './property-map.mjs';
import { propertyPage, propertyPhotos } from './property.mjs';
import { MAX_GUESTS, STORAGE_KEY, dateValue, isoDate, addDays, todayInUtah, validateSearch, nightCount, suites, sampleBlocks, isAvailable, sampleQuote, money, formatDate, searchParams } from './booking.mjs';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const page = document.body.dataset.page;
const today = todayInUtah();
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
let stored = {};
try { stored = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { /* Storage may be disabled. */ }
const query = new URLSearchParams(location.search);
const hasQuery = ['check_in', 'check_out', 'guests'].some(key => query.has(key));
let state = hasQuery ? { checkIn: query.get('check_in') || '', checkOut: query.get('check_out') || '', guests: Number(query.get('guests') || 2) } : { checkIn: stored.checkIn || '', checkOut: stored.checkOut || '', guests: Number(stored.guests || 2) };
if (!hasQuery && (validateSearch(state, today) || !Number.isInteger(state.guests))) state = { checkIn: '', checkOut: '', guests: 2 };
const blocks = sampleBlocks(today);
let filter = 'all';

function withState(url) {
  const target = new URL(url, location.href);
  ['check_in', 'check_out', 'guests'].forEach(key => target.searchParams.delete(key));
  searchParams(state).forEach((value, key) => target.searchParams.set(key, value));
  return target.pathname + target.search + target.hash;
}
function persist() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* Date carry still works through URLs. */ } }
function navigationItem(href, text, active) { return `<a href="${href}"${active ? ' aria-current="page"' : ''}>${text}</a>`; }

$('[data-site-header]').innerHTML = `<header class="site-header wrap"><a href="index.html" class="brand" aria-label="Silo Suites home"><img src="assets/logo.png" width="1254" height="1254" alt="Silo Suites — Historic Church's Dairy, La Verkin, Utah"></a><nav class="desktop-nav" aria-label="Main navigation">${navigationItem('stays.html', 'Our suites', ['stays', 'suite'].includes(page))}${navigationItem('index.html#our-story', 'Our story', false)}${navigationItem('hot-springs.html', 'Stay & Soak', page === 'soak')}${navigationItem('local-guide.html', 'Local guide', page === 'guide')}</nav><div class="header-actions"><button type="button" class="menu-toggle" aria-expanded="false" aria-controls="mobile-menu">Menu</button><a href="stays.html" data-carry-dates class="button button-olive">Book your stay <span aria-hidden="true">↗</span></a></div></header><nav id="mobile-menu" class="mobile-nav" aria-label="Mobile navigation" hidden><a href="stays.html" data-carry-dates>Our suites <span aria-hidden="true">↗</span></a><a href="index.html#our-story">Our story <span aria-hidden="true">↗</span></a><a href="hot-springs.html">Stay & Soak <span aria-hidden="true">↗</span></a><a href="local-guide.html">Local guide <span aria-hidden="true">↗</span></a><p class="eyebrow">Historic farm character.<br>La Verkin, Utah.</p></nav>`;
$('[data-site-footer]').innerHTML = `<footer class="site-footer wrap" id="contact"><div class="footer-top"><a class="footer-brand" href="index.html"><img src="assets/logo.png" width="1254" height="1254" loading="lazy" alt="Silo Suites"><p>A little history.<br>A lot of comfort.</p></a><div class="footer-column"><p class="eyebrow">Make yourself at home</p><a href="stays.html" data-carry-dates>Our suites</a><a href="index.html#our-story">Our story</a><a href="hot-springs.html">Stay & Soak</a><a href="local-guide.html">Local guide</a></div><div class="footer-column"><p class="eyebrow">Find us</p><p>Historic Church Dairy Farm</p><p>La Verkin, Utah</p><p>Near Zion National Park</p></div><div class="footer-column"><p class="eyebrow">A warm welcome awaits</p><a href="tel:+14355868658">435 586 8658</a><a href="stays.html" data-carry-dates>Find your stay ↗</a></div></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} Silo Suites. All rights reserved.</span><span>Heritage / Comfort / Near Zion</span><a href="https://homlay.com/" target="_blank" rel="noopener noreferrer">Website by Homlay ↗</a></div></footer>`;

document.body.insertAdjacentHTML('beforeend', `
  <button type="button" class="preview-control" data-preview-open><span class="preview-dot" aria-hidden="true"></span>Design preview</button>
  <dialog id="preview-dialog" aria-labelledby="preview-title"><div class="dialog-header"><h2 id="preview-title">A first look at Silo Suites.</h2><button type="button" class="close-button" data-close aria-label="Close preview notes">×</button></div><div class="dialog-text"><p>This is a local design preview. Dates, availability, room facts, and prices use sample data. No reservations or payments are sent.</p><p>The original supplied logo is used unchanged. Photos are extracted from the supplied brand board; individual suite assignments and final property facts still need validation.</p><p>Try the date picker, guest count, suite filters, room galleries, and mobile navigation. Live checkout will follow the Hostaway capability checks.</p><button type="button" class="button button-dark" data-close>Back to exploring <span aria-hidden="true">↗</span></button></div></dialog>
  <dialog id="date-dialog" aria-labelledby="date-title"><div class="dialog-header"><div><p class="eyebrow">Make a little time for yourself</p><h2 id="date-title">When will you stay?</h2></div><button type="button" class="close-button" data-close aria-label="Close date picker">×</button></div><div class="date-summary"><button type="button" data-select-date="in"><span class="eyebrow">Check in</span><span data-draft-label="in"></span></button><button type="button" data-select-date="out"><span class="eyebrow">Check out</span><span data-draft-label="out"></span></button></div><div class="calendar-nav"><button type="button" data-month="-1" aria-label="Previous month">←</button><p id="calendar-instruction" role="status">Choose your check-in date</p><button type="button" data-month="1" aria-label="Next month">→</button></div><div class="calendar-months"></div><div class="calendar-footer"><p id="date-feedback" role="status"></p><button type="button" class="button button-dark" id="apply-dates">Use these dates <span aria-hidden="true">↗</span></button></div></dialog>
  <dialog id="review-dialog" aria-labelledby="review-title"><div class="dialog-header"><h2 id="review-title">Your stay, at a glance.</h2><button type="button" class="close-button" data-close aria-label="Close stay review">×</button></div><div class="dialog-text" id="review-content"></div></dialog>
  <dialog id="lightbox-dialog" class="lightbox-dialog" aria-labelledby="lightbox-title"><div class="dialog-header"><h2 id="lightbox-title">A closer look</h2><button type="button" class="close-button" data-close aria-label="Close gallery">×</button></div><img id="lightbox-image" alt=""><div class="lightbox-nav"><button type="button" data-gallery-step="-1" aria-label="Previous photograph">← Previous</button><span id="gallery-counter" role="status"></span><button type="button" data-gallery-step="1" aria-label="Next photograph">Next →</button></div></dialog>`);

const dialogTriggers = new WeakMap();
function openDialog(dialog, trigger) { dialogTriggers.set(dialog, trigger || document.activeElement); dialog.showModal(); document.body.classList.add('dialog-open'); }
function closeDialog(dialog) { dialog.close(); }
function bindDialog(dialog) {
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const controls = $$('button, a[href], input, select, textarea, [tabindex="0"]', dialog).filter(el => !el.disabled && el.getClientRects().length);
    const first = controls[0], last = controls.at(-1);
    if (!first) { event.preventDefault(); return; }
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  $$('[data-close]', dialog).forEach(button => button.addEventListener('click', () => closeDialog(dialog)));
  dialog.addEventListener('close', () => { if (!$('dialog[open]')) { document.body.classList.remove('dialog-open'); dialogTriggers.get(dialog)?.focus({preventScroll: true}); } });
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) closeDialog(dialog); } });
}
$$('dialog').forEach(bindDialog);
$('[data-preview-open]').addEventListener('click', event => openDialog($('#preview-dialog'), event.currentTarget));

const menuToggle = $('.menu-toggle'), mobileMenu = $('#mobile-menu');
function setMenu(open) { menuToggle.setAttribute('aria-expanded', String(open)); menuToggle.textContent = open ? 'Close' : 'Menu'; mobileMenu.hidden = !open; document.body.classList.toggle('menu-open', open); }
menuToggle.addEventListener('click', () => setMenu(mobileMenu.hidden));
$$('a', mobileMenu).forEach(a => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !mobileMenu.hidden) { setMenu(false); menuToggle.focus(); }
  if (event.key === 'Tab' && !mobileMenu.hidden) {
    const focusable = [menuToggle, $('.header-actions a'), ...$$('a', mobileMenu)];
    const first = focusable[0], last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});
matchMedia('(min-width: 761px)').addEventListener('change', event => { if (event.matches) setMenu(false); });

function card(suite, withPrice = false) {
  const quote = withPrice ? sampleQuote(suite, state) : null;
  const href = escape(withState(`suite.html?id=${suite.id}`));
  return `<article class="suite-card"><a class="suite-image" href="${href}" aria-label="Explore ${suite.name}"><img src="assets/${suite.image}" width="800" height="523" loading="lazy" alt="${escape(suite.name)} — property reference photograph"><span class="image-label">${suite.category === 'group' ? 'For your favourite people' : suite.category === 'dairy' ? 'The Dairy Suite' : 'A converted silo'}</span></a><p class="eyebrow">${suite.label}</p><h3><a href="${href}">${suite.name}</a></h3><p class="suite-facts"><span>Up to ${suite.capacity} guests</span><span>${suite.baths} ${suite.baths === 1 ? 'bath' : 'baths'}</span></p><a class="card-bottom" href="${href}"><span>${quote ? `<span class="sample-price">${money(quote.total)} total</span><span class="price-caption">${quote.nights} nights · sample fees & tax included</span>` : 'Explore this stay'}</span><span class="card-arrow" aria-hidden="true">↗</span></a></article>`;
}
if ($('[data-featured]')) $('[data-featured]').innerHTML = [suites[0], suites[2], suites[4]].map(s => card(s)).join('');

let chosenSuite = null;
if (page === 'suite') {
  chosenSuite = suites.find(suite => suite.id === query.get('id'));
  if (!chosenSuite) {
    $('[data-suite-detail]').innerHTML = `<section class="page-intro"><p class="eyebrow">Let's find your place</p><h1>This suite isn't in our collection.</h1><p>Explore the available stays to choose your favourite.</p><a href="stays.html" class="text-link">See all suites ↗</a></section>`;
  } else {
    const s = chosenSuite;
    document.title = `${s.name} — Silo Suites`;
    $('[data-suite-detail]').innerHTML = propertyPage(s, escape(withState('stays.html')));
  }
}

if (chosenSuite) {
  $$('[data-property-dialog]').forEach(bindDialog);
  $$('[data-property-open]').forEach(button => button.addEventListener('click', () => openDialog(document.getElementById(button.dataset.propertyOpen), button)));
  initPropertyNavigation();
  initPropertyMap();
}
function initPropertyNavigation() {
  document.documentElement.classList.add('property-page');
  const nav = $('.property-subnav');
  const header = $('[data-site-header]');
  const start = $('#about-stay');
  const links = $$('a', nav);
  const targets = links.map(link => $(link.getAttribute('href')));
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let scheduled = false;
  function update() {
    scheduled = false;
    const top = Math.max(0, header.getBoundingClientRect().bottom);
    document.documentElement.style.setProperty('--property-header-height', `${top}px`);
    const height = nav.hidden ? (matchMedia('(max-width: 800px)').matches ? 58 : 62) : nav.offsetHeight;
    const show = start.getBoundingClientRect().top <= top + height + 24;
    nav.hidden = !show;
    document.documentElement.style.setProperty('--property-nav-height', `${height}px`);
    document.body.classList.toggle('property-nav-visible', show);
    let active = targets[0];
    targets.forEach(target => { if (target.getBoundingClientRect().top <= top + height + 32) active = target; });
    links.forEach(link => {
      const current = link.hash === `#${active.id}`;
      if (current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
      if (current && show) {
        const container = link.parentElement;
        if (link.offsetLeft < container.scrollLeft || link.offsetLeft + link.offsetWidth > container.scrollLeft + container.clientWidth) container.scrollTo({left: link.offsetLeft - container.clientWidth / 2 + link.offsetWidth / 2, behavior: 'instant'});
      }
    });
  }
  function schedule() { if (!scheduled) { scheduled = true; requestAnimationFrame(update); } }
  $$('.property-subnav a').forEach(link => link.addEventListener('click', event => {
    event.preventDefault();
    const target = $(link.hash);
    const top = header.getBoundingClientRect().bottom;
    const navHeight = nav.hidden ? 60 : nav.offsetHeight;
    window.scrollTo({top: Math.max(0, scrollY + target.getBoundingClientRect().top - top - navHeight - 20), behavior: reduceMotion.matches ? 'instant' : 'smooth'});
    // Keyboard users arrive at the section, rather than tabbing through stale navigation.
    target.tabIndex = -1;
    target.focus({preventScroll: true});
    history.replaceState(null, '', link.hash);
  }));
  addEventListener('scroll', schedule, {passive: true});
  addEventListener('resize', schedule);
  new ResizeObserver(schedule).observe(header);
  update();
}

function updateLinks() { $$('[data-carry-dates]').forEach(a => { a.href = withState(a.getAttribute('href')); }); }
function syncForms() {
  $$('[data-date-label="in"]').forEach(el => { el.textContent = formatDate(state.checkIn); });
  $$('[data-date-label="out"]').forEach(el => { el.textContent = formatDate(state.checkOut); });
  $$('[data-guests]').forEach(select => {
    if (!select.options.length) select.innerHTML = Array.from({ length: MAX_GUESTS }, (_, n) => `<option value="${n + 1}">${n + 1} ${n ? 'guests' : 'guest'}</option>`).join('');
    select.value = String(state.guests);
  });
  updateLinks();
}
function replaceUrl() {
  const target = new URL(location.href);
  ['check_in', 'check_out', 'guests'].forEach(key => target.searchParams.delete(key));
  searchParams(state).forEach((value, key) => target.searchParams.set(key, value));
  history.replaceState(null, '', target.pathname + target.search + target.hash);
}
function renderResults() {
  if (page !== 'stays') return;
  const withDates = Boolean(state.checkIn || state.checkOut);
  const error = withDates || !Number.isInteger(state.guests) || state.guests < 1 || state.guests > MAX_GUESTS ? validateSearch(state, today) : '';
  $('[data-search-error]').textContent = error;
  const found = error ? [] : suites.filter(suite => (filter === 'all' || suite.category === filter) && (withDates ? isAvailable(suite, state, blocks, today) : suite.capacity >= state.guests));
  $('#search-results').innerHTML = found.map(suite => card(suite, withDates)).join('');
  $('#empty-results').hidden = found.length > 0;
  $('#result-count').textContent = `${found.length} ${found.length === 1 ? 'stay' : 'stays'}${withDates && !error ? ` · ${formatDate(state.checkIn)} – ${formatDate(state.checkOut)}` : ''}`;
}
function quoteMarkup(q) { return `<div class="quote-breakdown"><div><span>${q.nights} nights · sample rate</span><span>${money(q.accommodation)}</span></div><div><span>Sample cleaning fee</span><span>${money(q.cleaning)}</span></div><div><span>Sample taxes</span><span>${money(q.tax)}</span></div><div class="total"><span>Sample total</span><span>${money(q.total)}</span></div></div>`; }
function renderPropertyQuote() {
  if (!chosenSuite) return;
  const target = $('#property-quote');
  const mobile = $('#mobile-price');
  target.innerHTML = '';
  mobile.innerHTML = 'Your own little escape<span>Choose dates to see a sample total</span>';
  if (!state.checkIn && !state.checkOut) return;
  const error = validateSearch(state, today);
  if (error) { target.innerHTML = `<p class="quote-unavailable">${escape(error)}</p>`; return; }
  if (!isAvailable(chosenSuite, state, blocks, today)) {
    target.innerHTML = `<p class="quote-unavailable">This stay isn't available for these dates and guests. Try a different search or compare all stays.</p>`;
    mobile.innerHTML = 'Try another date<span>Not available for this sample search</span>';
    return;
  }
  const q = sampleQuote(chosenSuite, state);
  target.innerHTML = quoteMarkup(q);
  mobile.innerHTML = `${money(q.total)} total<span>${q.nights} nights · sample pricing</span>`;
}
function commit() { persist(); syncForms(); renderResults(); renderPropertyQuote(); }
function showError(form, message) {
  const error = $('[data-search-error]', form.parentElement) || $('[data-search-error]');
  if (error) error.textContent = message;
}
$$('[data-search]').forEach(form => {
  form.addEventListener('submit', event => {
    event.preventDefault();
    state.guests = Number($('[data-guests]', form).value);
    const error = validateSearch(state, today);
    if (error) { showError(form, error); if (dateValue(state.checkIn) === null || dateValue(state.checkOut) === null) openDates('in', $('[data-date-open]', form)); return; }
    commit();
    if (form.hasAttribute('data-property-search')) {
      if (!isAvailable(chosenSuite, state, blocks, today)) { showError(form, 'This stay is not available. Choose different dates or compare all stays.'); return; }
      showError(form, ''); replaceUrl();
      $('#review-content').innerHTML = `<p class="eyebrow">${chosenSuite.name}</p><p>${formatDate(state.checkIn, { year: 'numeric' })} – ${formatDate(state.checkOut, { year: 'numeric' })}<br>${state.guests} ${state.guests === 1 ? 'guest' : 'guests'}</p>${quoteMarkup(sampleQuote(chosenSuite, state))}<p style="margin-top:24px">This is a sample stay review. No booking has been created and no payment will be taken. Live checkout will follow the Hostaway integration checks.</p><button type="button" class="button button-dark" id="close-review">Keep exploring <span aria-hidden="true">↗</span></button>`;
      $('#close-review').addEventListener('click', () => closeDialog($('#review-dialog')));
      openDialog($('#review-dialog'), $('button[type="submit"]', form));
    } else if (page === 'stays') { replaceUrl(); renderResults(); $('#result-count').scrollIntoView({ block: 'center' }); }
    else { location.href = withState('stays.html'); }
  });
  $('[data-guests]', form).addEventListener('change', event => { state.guests = Number(event.target.value); commit(); if (page === 'stays' || page === 'suite') replaceUrl(); });
});
$$('[data-filter]').forEach(button => button.addEventListener('click', () => { filter = button.dataset.filter; $$('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b === button))); renderResults(); }));
$('#clear-search')?.addEventListener('click', () => { state = { checkIn: '', checkOut: '', guests: 2 }; filter = 'all'; $$('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === 'all'))); commit(); replaceUrl(); });

let draft = { ...state }, picking = 'in', shownMonth = new Date(dateValue(today));
shownMonth.setUTCDate(1);
const dateDialog = $('#date-dialog');
function monthStamp(date, delta = 0) { return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + delta, 1)); }
function monthMarkup(date) {
  const year = date.getUTCFullYear(), month = date.getUTCMonth();
  const count = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const offset = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const name = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
  let days = '<span aria-hidden="true"></span>'.repeat(offset);
  for (let day = 1; day <= count; day++) {
    const value = isoDate(Date.UTC(year, month, day));
    const disabled = value < today || value > addDays(today, 365);
    const selected = value === draft.checkIn || value === draft.checkOut;
    const range = draft.checkIn && draft.checkOut && value > draft.checkIn && value < draft.checkOut;
    const label = formatDate(value, { month: 'long', year: 'numeric', weekday: 'long' });
    days += `<button type="button" class="calendar-day${selected ? ' selected' : ''}${range ? ' in-range' : ''}${value === today ? ' today' : ''}" data-day="${value}" aria-label="${label}${value === draft.checkIn ? ', check-in' : value === draft.checkOut ? ', check-out' : ''}" aria-pressed="${selected}"${disabled ? ' disabled' : ''}>${day}</button>`;
  }
  return `<section class="calendar-month" aria-label="${name}"><h3>${name}</h3><div class="weekdays" aria-hidden="true">${['S','M','T','W','T','F','S'].map(d => `<span>${d}</span>`).join('')}</div><div class="day-grid">${days}</div></section>`;
}
function renderCalendar() {
  $('.calendar-months').innerHTML = monthMarkup(shownMonth) + monthMarkup(monthStamp(shownMonth, 1));
  $$('[data-draft-label="in"]').forEach(el => { el.textContent = formatDate(draft.checkIn); });
  $$('[data-draft-label="out"]').forEach(el => { el.textContent = formatDate(draft.checkOut); });
  $$('[data-select-date]').forEach(b => b.classList.toggle('active', b.dataset.selectDate === picking));
  $('#calendar-instruction').textContent = `Choose your ${picking === 'in' ? 'check-in' : 'check-out'} date`;
  $('[data-month="-1"]').disabled = shownMonth <= monthStamp(new Date(dateValue(today)));
  $('[data-month="1"]').disabled = shownMonth >= monthStamp(new Date(dateValue(addDays(today, 365))));
  const error = validateSearch({ ...draft, guests: Number.isInteger(state.guests) && state.guests >= 1 && state.guests <= MAX_GUESTS ? state.guests : 2 }, today);
  $('#apply-dates').disabled = Boolean(error);
  $('#date-feedback').textContent = !draft.checkIn ? 'Choose your arrival date to begin.' : !draft.checkOut ? 'Now choose your departure date.' : error || `${nightCount(draft.checkIn, draft.checkOut)} nights. A little time for yourself.`;
}
function openDates(which = 'in', trigger) {
  draft = { ...state };
  if (dateValue(draft.checkIn) === null || draft.checkIn < today) draft.checkIn = '';
  if (dateValue(draft.checkOut) === null || draft.checkOut <= draft.checkIn) draft.checkOut = '';
  picking = which === 'out' && draft.checkIn ? 'out' : 'in';
  const initial = picking === 'out' && draft.checkOut ? draft.checkOut : draft.checkIn || today;
  shownMonth = monthStamp(new Date(dateValue(initial)));
  renderCalendar(); openDialog(dateDialog, trigger);
}
$$('[data-date-open]').forEach(button => button.addEventListener('click', () => openDates(button.dataset.dateOpen, button)));
$$('[data-start-search]').forEach(a => a.addEventListener('click', event => { event.preventDefault(); openDates('in', a); }));
$$('[data-select-date]').forEach(button => button.addEventListener('click', () => { picking = button.dataset.selectDate === 'out' && draft.checkIn ? 'out' : 'in'; renderCalendar(); }));
$$('[data-month]').forEach(button => button.addEventListener('click', () => { shownMonth = monthStamp(shownMonth, Number(button.dataset.month)); renderCalendar(); }));
$('.calendar-months').addEventListener('click', event => {
  const button = event.target.closest('[data-day]');
  if (!button || button.disabled) return;
  const value = button.dataset.day;
  if (picking === 'in' || !draft.checkIn || value <= draft.checkIn) { draft.checkIn = value; draft.checkOut = ''; picking = 'out'; }
  else { draft.checkOut = value; }
  renderCalendar();
  $(`[data-day="${value}"]`, dateDialog)?.focus();
});
// Arrow keys supplement normal tab navigation without removing accessible day buttons.
$('.calendar-months').addEventListener('keydown', event => {
  const button = event.target.closest('[data-day]');
  const delta = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 7, ArrowUp: -7 }[event.key];
  if (!button || !delta) return;
  const next = addDays(button.dataset.day, delta);
  if (next < today || next > addDays(today, 365)) return;
  event.preventDefault();
  if (!$(`[data-day="${next}"]`, dateDialog) || (matchMedia('(max-width:760px)').matches && next.slice(0, 7) !== isoDate(shownMonth).slice(0, 7))) { shownMonth = monthStamp(new Date(dateValue(next))); renderCalendar(); }
  $(`[data-day="${next}"]`, dateDialog)?.focus();
});
$('#apply-dates').addEventListener('click', () => {
  if (validateSearch({ ...draft, guests: 2 }, today)) return;
  state.checkIn = draft.checkIn; state.checkOut = draft.checkOut;
  commit(); if (page === 'stays' || page === 'suite') replaceUrl();
  $$('[data-search-error]').forEach(el => { el.textContent = ''; });
  closeDialog(dateDialog);
});

const heroSlides = [
  { src: 'elementor/The-Silo-Suites-50-1-scaled.jpg', alt: 'A welcoming Silo Suite with original brick, a timber loft, and soft white bedding', label: 'Inside the silos' },
  { src: 'elementor/studio-apartmentsdwww.jpg', alt: 'A bright Dairy Suite with natural timber beams and warm white interiors', label: 'The Dairy Suite' },
];
let heroIndex = 0;
$('#hero-next')?.addEventListener('click', () => {
  heroIndex = (heroIndex + 1) % heroSlides.length;
  const slide = heroSlides[heroIndex];
  $('#hero-image').src = `assets/${slide.src}`; $('#hero-image').alt = slide.alt;
  $('#hero-count').textContent = `0${heroIndex + 1} / 02`; $('#hero-label').textContent = slide.label;
  $('#hero-next').setAttribute('aria-label', `Show ${heroIndex === 0 ? 'the Dairy Suite' : 'the Silo Suite'} photograph`);
});

if (chosenSuite) {
  const gallery = propertyPhotos(chosenSuite);
  let index = 0;
  function galleryImage() {
    $('#lightbox-image').src = `assets/${gallery[index]}`;
    $('#lightbox-image').alt = `${chosenSuite.name}, property reference photograph ${index + 1}`;
    $('#gallery-counter').textContent = `${index + 1} / ${gallery.length}`;
    $('#lightbox-title').textContent = chosenSuite.name;
  }
  $$('[data-gallery]').forEach(button => button.addEventListener('click', () => { index = Number(button.dataset.gallery); galleryImage(); openDialog($('#lightbox-dialog'), button); }));
  $$('[data-gallery-step]').forEach(button => button.addEventListener('click', () => { index = (index + Number(button.dataset.galleryStep) + gallery.length) % gallery.length; galleryImage(); }));
  $('#lightbox-dialog').addEventListener('keydown', event => { if (['ArrowLeft', 'ArrowRight'].includes(event.key)) { event.preventDefault(); index = (index + (event.key === 'ArrowRight' ? 1 : -1) + gallery.length) % gallery.length; galleryImage(); } });
}

commit();
