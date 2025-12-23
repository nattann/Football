// main/script.js
// Carousel controller moved out of index.html
(function(){
  const carousel = document.querySelector('.carousel');
  if (!carousel) return;
  const slides = Array.from(carousel.querySelectorAll('img'));
  const btnPrev = carousel.querySelector('.carousel-btn.prev');
  const btnNext = carousel.querySelector('.carousel-btn.next');
  const dotsContainer = carousel.querySelector('.dots');
  let idx = slides.findIndex(s => s.classList.contains('active'));
  if (idx < 0) idx = 0;
  slides.forEach((s,i)=>{ if(i!==idx) s.classList.remove('active'); else s.classList.add('active'); });

  // build dots
  slides.forEach((_,i)=>{
    const dot = document.createElement('button');
    dot.className = 'dot' + (i===idx? ' active':'');
    dot.setAttribute('aria-label', `Go to slide ${i+1}`);
    dot.setAttribute('role','tab');
    dot.tabIndex = 0;
    dot.addEventListener('click', ()=> goTo(i));
    dotsContainer.appendChild(dot);
  });

  const dots = Array.from(dotsContainer.children);

  function update(){
    slides.forEach((s,i)=> s.classList.toggle('active', i===idx));
    dots.forEach((d,i)=> d.classList.toggle('active', i===idx));
  }

  function goTo(i){ idx = (i + slides.length) % slides.length; update(); }
  function next(){ goTo(idx+1); }
  function prev(){ goTo(idx-1); }

  let intervalId = null;
  const start = () => { if (intervalId) return; intervalId = setInterval(next, 3500); };
  const stop = () => { if (!intervalId) return; clearInterval(intervalId); intervalId = null; };

  // wire buttons
  btnPrev?.addEventListener('click', ()=>{ prev(); stop(); setTimeout(start, 3000); });
  btnNext?.addEventListener('click', ()=>{ next(); stop(); setTimeout(start, 3000); });

  // pause/resume
  carousel.addEventListener('mouseenter', stop);
  carousel.addEventListener('mouseleave', start);
  carousel.addEventListener('touchstart', stop, {passive:true});
  carousel.addEventListener('touchend', start, {passive:true});
  carousel.addEventListener('focusin', stop);
  carousel.addEventListener('focusout', start);

  // keyboard navigation when carousel focused
  carousel.tabIndex = 0;
  carousel.addEventListener('keydown', (e)=>{
    if (e.key === 'ArrowLeft') { prev(); stop(); setTimeout(start, 3000); }
    if (e.key === 'ArrowRight') { next(); stop(); setTimeout(start, 3000); }
  });

  // start autoplay
  start();
})();
