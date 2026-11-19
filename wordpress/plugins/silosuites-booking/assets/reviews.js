(function(){
'use strict';
if(document.body?.classList.contains('elementor-editor-active')||window.elementorFrontend?.isEditMode())return;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let nextId=0;
function month(value){return /^\d{4}-(0[1-9]|1[0-2])$/.test(value)?new Intl.DateTimeFormat('en-US',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(value+'-01T12:00:00Z')):'';}
const score=r=>`${Number(r.rating).toFixed(1)} / ${r.scale}`;
function card(r,full=false,index=0){return `<article class="ssr-card"><header><div><strong>${esc(r.source)} guest</strong>${r.month?`<time datetime="${esc(r.month)}">${esc(month(r.month))}</time>`:''}</div><span class="ssr-rating">${esc(score(r))}</span></header><p class="${full?'':'ssr-excerpt'}">${esc(r.text)}</p>${!full?`<button type="button" class="ssr-read" data-review="${index}" aria-haspopup="dialog">Read review <span aria-hidden="true">→</span></button>`:''}</article>`;}
function openDialog(reviews,trigger){
 if(document.querySelector('dialog[open]'))return;
 const dialog=document.createElement('dialog'),id='ssr-title-'+(++nextId);dialog.className='ssr-dialog';dialog.setAttribute('aria-labelledby',id);
 dialog.innerHTML=`<header class="ssr-toolbar"><h2 id="${id}">Guest reviews</h2><button type="button" data-review-close aria-label="Close reviews">×</button></header><div class="ssr-dialog-body">${reviews.map((r,i)=>card(r,true,i)).join('')}</div>`;
 document.body.append(dialog);document.body.classList.add('ssr-modal-open');dialog.showModal();dialog.querySelector('[data-review-close]').focus();
 dialog.querySelector('[data-review-close]').onclick=()=>dialog.close();
 dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const b=dialog.getBoundingClientRect();if(event.clientX<b.left||event.clientX>b.right||event.clientY<b.top||event.clientY>b.bottom)dialog.close();});
 dialog.addEventListener('close',()=>{dialog.remove();document.body.classList.remove('ssr-modal-open');trigger?.focus({preventScroll:true});});
}
const requests=new Map();
async function loadReviews(root){
 const property=root.dataset.property,url=new URL(root.dataset.api,location.href);
 if(url.origin!==location.origin)throw Error('Review endpoint must be on this site.');url.searchParams.set('property',property);
 const key=url.href;
 if(!requests.has(key)){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
  const pending=(async()=>{
   try{
    const response=await fetch(url,{credentials:'same-origin',headers:{Accept:'application/json'},signal:controller.signal});if(!response.ok)throw Error('Reviews unavailable');const data=await response.json();
    if(data.property!==property||!Array.isArray(data.reviews)||data.count!==data.reviews.length||data.count>1000||data.scale!==10)throw Error('Invalid review response');
    if(data.count>0&&(!Number.isFinite(data.average)||data.average<0||data.average>10))throw Error('Invalid average');
    if(data.reviews.some(r=>typeof r.text!=='string'||!r.text.trim()||typeof r.source!=='string'||!Number.isFinite(r.rating)||r.rating<0||r.rating>10||r.scale!==10||typeof r.month!=='string'))throw Error('Invalid review');
    return data;
   }finally{clearTimeout(timer);}
  })().catch(error=>{requests.delete(key);throw error;});
  requests.set(key,pending);
 }
 return requests.get(key);
}
function updateRatings(property,data){
 document.querySelectorAll('[data-property-rating]').forEach(target=>{
  if(target.dataset.property!==property)return;
  if(!data){target.hidden=true;target.replaceChildren();return;}
  if(data.count===0){target.textContent='No reviews yet';target.setAttribute('aria-label','No guest reviews yet. Read the reviews section.');}
  else{
   target.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m12 3 2.78 5.63L21 9.54l-4.5 4.39 1.06 6.2L12 17.2l-5.56 2.93 1.06-6.2L3 9.54l6.22-.91Z"/></svg><span>${esc(Number(data.average).toFixed(2))} / 10</span><span class="ssr-rating-count">${data.count} ${data.count===1?'review':'reviews'}</span>`;
   target.setAttribute('aria-label',`Rated ${data.average} out of 10 from ${data.count} guest reviews. Read reviews.`);
  }
  target.hidden=false;
 });
}
async function mountRating(root){
 if(root.dataset.ratingBound)return;root.dataset.ratingBound='1';
 try{updateRatings(root.dataset.property,await loadReviews(root));}catch{updateRatings(root.dataset.property,null);}
}
async function mount(root){
 if(root.dataset.reviewsBound)return;root.dataset.reviewsBound='1';
 const property=root.dataset.property;
 root.classList.add('ssr-reviews');root.innerHTML='<h2>Guest reviews</h2><p role="status">Loading reviews…</p>';
 try{
  const data=await loadReviews(root),reviews=data.reviews;
  updateRatings(property,data);
  root.innerHTML=`<div class="ssr-heading"><h2>Guest reviews</h2>${reviews.length?`<p><strong>${esc(Number(data.average).toFixed(2))} / 10</strong><span>${reviews.length} ${reviews.length===1?'review':'reviews'}</span></p>`:''}</div>`;
  if(!reviews.length){root.insertAdjacentHTML('beforeend','<p class="ssr-empty">No guest reviews yet.</p>');return;}
  root.insertAdjacentHTML('beforeend',`<div class="ssr-grid">${reviews.slice(0,4).map((r,i)=>card(r,false,i)).join('')}</div>${reviews.length>4?'<button type="button" class="ssr-all" data-all-reviews aria-haspopup="dialog">Show all reviews</button>':''}`);
  root.addEventListener('click',event=>{const button=event.target.closest('[data-review],[data-all-reviews]');if(!button)return;openDialog(button.hasAttribute('data-all-reviews')?reviews:[reviews[Number(button.dataset.review)]],button);});
 }catch{
  root.innerHTML='<h2>Guest reviews</h2><p role="status">Guest reviews are temporarily unavailable.</p><button type="button" class="ssr-all" data-reviews-retry>Try again</button>';
  root.querySelector('[data-reviews-retry]').onclick=()=>{delete root.dataset.reviewsBound;mount(root);};
 }
}
window.SiloSuitesReviews={mount,mountRating};
function start(){document.querySelectorAll('[data-ssb-reviews]').forEach(mount);document.querySelectorAll('[data-property-rating][data-api]').forEach(mountRating);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
