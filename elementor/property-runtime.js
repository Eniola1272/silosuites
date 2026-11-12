(function () {
  function start() {
    // Preserve native editable DOM in Elementor. No popup code runs in its editor.
    if (document.body.classList.contains('elementor-editor-active') || window.elementorFrontend?.isEditMode()) return;
    document.querySelectorAll('.sp-property').forEach(root => {
      if (root.dataset.ready) return;
      root.dataset.ready = 'true';root.classList.add('sp-runtime');
      const dialogs = new Map();
      function makeDialog(id, content, label) {
        const dialog = document.createElement('dialog');dialog.className = 'ss-design sp-dialog';
        // Keep Elementor's document CSS scope when native content moves to the top layer.
        const owner = root.closest('.elementor');
        if (owner) owner.classList.forEach(name => dialog.classList.add(name));
        dialog.id = id + '-dialog';dialog.setAttribute('aria-label', label);
        const toolbar = document.createElement('div');toolbar.className='sp-dialog-toolbar';
        const close = document.createElement('button');close.type='button';close.className='sp-dialog-close';close.textContent='×';close.setAttribute('aria-label','Close popup');
        toolbar.append(close);dialog.append(toolbar,content);document.body.append(dialog);
        let trigger;
        dialogs.set('#'+id, button => {trigger=button;dialog.showModal();document.body.classList.add('sp-dialog-open');close.focus();});
        close.onclick=()=>dialog.close();
        dialog.addEventListener('close',()=>{document.body.classList.remove('sp-dialog-open');trigger?.focus({preventScroll:true});});
        dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();});
        dialog.addEventListener('keydown',event=>{
          if(event.key!=='Tab')return;
          const controls=[...dialog.querySelectorAll('a[href],button,input,select,textarea,[tabindex="0"]')].filter(el=>!el.disabled&&el.getClientRects().length);
          const first=controls[0],last=controls.at(-1);
          if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
          else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
        });
      }
      root.querySelectorAll('.sp-popup-source').forEach(content=>{
        const title=content.querySelector('.elementor-heading-title');
        makeDialog(content.id,content,title?.textContent||'Stay details');
      });
      const gallery = document.createElement('div');gallery.className='sp-gallery-content';
      root.querySelectorAll('.sp-gallery .elementor-widget-image img').forEach(original=>{
        const img=original.cloneNode(true);img.removeAttribute('loading');gallery.append(img);
      });
      makeDialog('sp-gallery',gallery,'Property photographs');document.querySelector('#sp-gallery-dialog')?.classList.add('sp-gallery-dialog');
      root.addEventListener('click',event=>{
        const button=event.target.closest('a[href^="#"]');if(!button)return;
        const open=dialogs.get(button.getAttribute('href'));if(open){event.preventDefault();open(button);}
      });
      const nav=root.querySelector('.sp-subnav'),overview=root.querySelector('#sp-overview');
      const links=[...nav.querySelectorAll('a')];const targets=links.map(a=>root.querySelector(a.hash));
      const header=document.querySelector('header.elementor-location-header, .elementor-location-header, header:not(.sp *)');
      let pending=false;
      function update(){
        pending=false;const top=Math.max(0,header?.getBoundingClientRect().bottom||0,document.querySelector('#wpadminbar')?.getBoundingClientRect().bottom||0);
        const height=innerWidth<=800?58:62;
        root.style.setProperty('--sp-header',top+'px');root.style.setProperty('--sp-nav',height+'px');
        root.classList.toggle('sp-nav-on',overview.getBoundingClientRect().top<=top+height+24);
        let active=targets[0];targets.forEach(el=>{if(el.getBoundingClientRect().top<=top+height+32)active=el;});
        links.forEach(link=>{if(link.hash==='#'+active.id)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
      }
      function schedule(){if(!pending){pending=true;requestAnimationFrame(update);}}
      links.forEach(link=>link.addEventListener('click',event=>{
        event.preventDefault();const target=root.querySelector(link.hash);const top=parseFloat(root.style.getPropertyValue('--sp-header'))||0;
        scrollTo({top:scrollY+target.getBoundingClientRect().top-top-(innerWidth<=800?58:62)-20,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
        target.tabIndex=-1;target.focus({preventScroll:true});history.replaceState(null,'',link.hash);
      }));
      addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);update();
      root.querySelectorAll('.sp-preview-form').forEach(form=>form.addEventListener('submit',event=>{
        event.preventDefault();const data=new FormData(form);const result=form.querySelector('.sp-form-status');
        if(data.get('check_out')<=data.get('check_in')){result.textContent='Check-out must be after check-in.';return;}
        result.textContent='Your dates are selected. Live availability and checkout are not connected in this design template. No booking has been created.';
      }));
      const host=root.querySelector('.sp-map');
      function map(){
        observer?.disconnect();if(!window.L||!host)return;
        const lat=Number(host.dataset.lat),lng=Number(host.dataset.lng);if(!Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(lat)>90||Math.abs(lng)>180)return;
        host.replaceChildren();const L=window.L;const map=L.map(host,{center:[lat,lng],zoom:13,scrollWheelZoom:false});
        const tile=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);
        const status=host.parentElement.querySelector('.sp-map-status');let loaded=false;
        tile.on('tileload',()=>{loaded=true;status.textContent='';});tile.on('tileerror',()=>{if(!loaded)status.textContent='Map tiles could not load. Open the area map below.';});
        const logo=document.querySelector('.sp-signature img');const core=document.createElement('span');core.className='sp-map-logo';if(logo){const img=logo.cloneNode();img.alt='';img.removeAttribute('srcset');core.append(img);}
        L.marker([lat,lng],{icon:L.divIcon({className:'sp-map-icon',html:core.outerHTML,iconSize:[80,80],iconAnchor:[40,40]}),title:'La Verkin area reference; not the exact property location'}).addTo(map);
        new ResizeObserver(()=>map.invalidateSize({pan:false})).observe(host);host.dataset.ready='true';
      }
      const observer='IntersectionObserver'in window?new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting))map();},{rootMargin:'300px'}):null;
      if(host){if(observer)observer.observe(host);else map();}
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
