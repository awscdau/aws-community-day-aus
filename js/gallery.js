(function(){
  const root = document.getElementById('acda-gallery');
  const masonry = root.querySelector('.pm-masonry');
  const note = document.getElementById('pm-note');
  const IMG_PATH = (root.getAttribute('data-img-path')||'/img').replace(/\/+$/,'');
  const MANIFEST = root.getAttribute('data-manifest')||'images.json';
  const state = { images:[], idx:-1 };

  async function loadImages(){
    try{
      const r = await fetch(`${IMG_PATH}/${MANIFEST}`, {cache:'no-store'});
      if(r.ok){ const a = await r.json(); if(Array.isArray(a)&&a.length) return a.map(s=>`${IMG_PATH}/${s}`); }
    }catch(e){}
    try{
      const r = await fetch(`${IMG_PATH}/`, {mode:'cors'});
      if(r.ok){
        const html = await r.text();
        const doc = new DOMParser().parseFromString(html,'text/html');
        const exts=/\.(avif|webp|jpe?g|png|gif|bmp|tiff)$/i;
        const files=[...doc.querySelectorAll('a')].map(a=>a.getAttribute('href')).filter(h=>h&&exts.test(h)).map(h=>`${IMG_PATH}/${h.replace(/^\.?\//,'')}`);
        if(files.length) return files;
      }
    }catch(e){}
    return [];
  }

  function render(images){
    masonry.innerHTML='';
    images.forEach((src,i)=>{
      const item=document.createElement('div'); item.className='pm-item'; item.role='listitem';
      const btn=document.createElement('button'); btn.type='button'; btn.ariaLabel='Open image';
      const img=new Image(); img.loading='lazy'; img.src=src; img.alt=src.split('/').pop().replace(/[-_]/g,' ');
      btn.onclick=()=>openModal(i); btn.appendChild(img); item.appendChild(btn); masonry.appendChild(item);
    });
  }

  const modal=document.getElementById('pm-modal'), full=document.getElementById('pm-full'),
        prevB=document.getElementById('pm-prev'), nextB=document.getElementById('pm-next'), closeB=document.getElementById('pm-close');

  function openModal(i){ state.idx=i; full.src=state.images[i]; full.alt=state.images[i].split('/').pop(); modal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; closeB.focus(); }
  function closeModal(){ modal.setAttribute('aria-hidden','true'); document.body.style.overflow=''; state.idx=-1; full.src=''; full.alt=''; }
  function prev(){ if(!state.images.length) return; state.idx=(state.idx-1+state.images.length)%state.images.length; full.src=state.images[state.idx]; full.alt=state.images[state.idx].split('/').pop(); }
  function next(){ if(!state.images.length) return; state.idx=(state.idx+1)%state.images.length; full.src=state.images[state.idx]; full.alt=state.images[state.idx].split('/').pop(); }

  prevB.addEventListener('click',prev); nextB.addEventListener('click',next); closeB.addEventListener('click',closeModal);
  modal.addEventListener('click',e=>{ if(e.target===modal) closeModal(); });
  window.addEventListener('keydown',e=>{ if(modal.getAttribute('aria-hidden')==='true') return; if(e.key==='Escape') closeModal(); if(e.key==='ArrowLeft') prev(); if(e.key==='ArrowRight') next(); });

  (async()=>{
    const imgs=await loadImages();
    if(!imgs.length){
      note.classList.remove('pm-hidden');
      note.innerHTML = `<strong>No image list found.</strong><br>On S3/CloudFront, create <code>${IMG_PATH}/${MANIFEST}</code> with e.g. <code>["p1.jpg","p2.webp"]</code>.`;
    } else { state.images=imgs; render(imgs); }
  })();
})();