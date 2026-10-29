(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = () => innerWidth <= 760;
  const hasGsap = typeof gsap !== 'undefined';
  if (hasGsap) { gsap.registerPlugin(ScrollTrigger); ScrollTrigger.config({ ignoreMobileResize: true }); }

  // no celular o texto de Ambientes sai do carrossel e fica acima dele
  if (mobile()) $('.amb__pin').prepend($('.amb__intro'));

  // vídeos: carregam quando chegam perto da tela e pausam fora dela
  const loadVideo = v => { if (!v.src && v.dataset.src) { v.src = v.dataset.src; } };
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      const v = e.target;
      if (e.isIntersecting) { loadVideo(v); v.play().catch(() => {}); }
      else v.pause();
    });
  }, { rootMargin: '200px' });

  // no celular o hero mostra uma coluna só, revezando os três cortes
  const heroMain = $('.hero__col--2 video');
  if (mobile()) {
    const clips = ['video/col2.mp4?v=2', 'video/col1.mp4?v=2', 'video/col3.mp4?v=2'];
    let i = 0;
    heroMain.loop = false;
    heroMain.dataset.src = clips[0];
    heroMain.addEventListener('ended', () => {
      i = (i + 1) % clips.length;
      heroMain.src = clips[i];
      heroMain.play().catch(() => {});
    });
    $$('.hero__col--1 video, .hero__col--3 video').forEach(v => v.removeAttribute('data-src'));
  }
  $$('video[data-src]').forEach(v => io.observe(v));

  // portal 18+
  const gate = $('#gate');
  let ok = false;
  try { ok = sessionStorage.getItem('hb18') === '1'; } catch (e) {}

  let lenis;
  const start = () => {
    document.body.classList.remove('is-locked');
    if (!reduce && typeof Lenis !== 'undefined') {
      lenis = new Lenis({ lerp: 0.09 });
      if (hasGsap) {
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add(t => lenis.raf(t * 1000));
        gsap.ticker.lagSmoothing(0);
      } else {
        const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
        requestAnimationFrame(raf);
      }
    }
    intro();
  };

  if (ok) { gate.remove(); start(); }
  else {
    $('#gate-yes').addEventListener('click', () => {
      try { sessionStorage.setItem('hb18', '1'); } catch (e) {}
      gate.classList.add('is-out');
      if (hasGsap) {
        gsap.to('.gate__box', { y: -30, opacity: 0, duration: .6, ease: 'power3.in' });
        gsap.fromTo(gate, { clipPath: 'circle(100% at 50% 50%)' }, { clipPath: 'circle(0% at 50% 50%)', duration: 1.1, delay: .35, ease: 'expo.inOut', onComplete: () => gate.remove() });
      } else gate.remove();
      start();
    });
    if (hasGsap) gsap.from('.gate__box > *', { y: 24, opacity: 0, stagger: .08, duration: 1, ease: 'power3.out' });
  }

  function intro() {
    if (!hasGsap || reduce) return;
    const tl = gsap.timeline({ delay: ok ? .1 : .7 });
    tl.from('.hero__col', { clipPath: 'inset(100% 0 0 0)', stagger: .12, duration: 1.4, ease: 'expo.out' })
      .from('.hero__title .line > span', { yPercent: 110, stagger: .1, duration: 1.2, ease: 'expo.out' }, '-=1')
      .from(['.hero__eyebrow', '.hero__sub', '.hero__actions', '.nav'], { y: 20, opacity: 0, stagger: .08, duration: .9, ease: 'power3.out' }, '-=.8');
  }

  // spotlight do mouse no hero + brilho que segue o cursor
  const hero = $('#hero'), spot = $('#spot'), glow = $('#glow');
  if (matchMedia('(hover:hover)').matches) {
    let gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy;
    addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; });
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      spot.style.setProperty('--x', e.clientX - r.left + 'px');
      spot.style.setProperty('--y', e.clientY - r.top + 'px');
    });
    const loop = () => {
      gx += (tx - gx) * .12; gy += (ty - gy) * .12;
      glow.style.transform = `translate(${gx}px,${gy}px)`;
      requestAnimationFrame(loop);
    };
    loop();
  }

  // nav
  const nav = $('#nav'), float = $('.float');
  let lastY = 0;
  const onScroll = () => {
    const y = scrollY;
    nav.classList.toggle('is-solid', y > 60);
    nav.classList.toggle('is-hidden', y > lastY && y > innerHeight * .8 && !menu.classList.contains('is-open'));
    float.classList.toggle('is-on', y > innerHeight * .9);
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true });

  // o botão flutuante some quando o formulário ou o rodapé estão na tela
  const away = new Set();
  const floatIo = new IntersectionObserver(es => {
    es.forEach(e => e.isIntersecting ? away.add(e.target) : away.delete(e.target));
    float.classList.toggle('is-away', away.size > 0);
  });
  ['.lista__box', '.foot'].forEach(s => floatIo.observe($(s)));

  const burger = $('#burger'), menu = $('#menu');
  burger.addEventListener('click', () => {
    const open = menu.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', open);
  });

  // âncoras com scroll suave
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    const t = id.length > 1 && $(id);
    if (!t) return;
    e.preventDefault();
    menu.classList.remove('is-open'); burger.setAttribute('aria-expanded', false);
    if (a.dataset.evento) { const s = $('#evento'); [...s.options].forEach(o => { if (o.text === a.dataset.evento) s.value = o.value; }); }
    lenis ? lenis.scrollTo(t, { offset: -10, duration: 1.6 }) : t.scrollIntoView({ behavior: 'smooth' });
  }));

  // manifesto palavra por palavra
  const mt = $('[data-words]');
  const wrap = node => {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(w => {
          if (!w.trim()) { frag.append(w); return; }
          const s = document.createElement('span'); s.className = 'w'; s.textContent = w; frag.append(s);
        });
        n.replaceWith(frag);
      } else wrap(n);
    });
  };
  wrap(mt);

  // abas de preço
  const tabs = $$('.tab'), pill = $('.tabs__pill');
  const setPill = b => { pill.style.width = b.offsetWidth + 'px'; pill.style.transform = `translateX(${b.offsetLeft - 5}px)`; };
  tabs.forEach(b => b.addEventListener('click', () => {
    tabs.forEach(t => { t.classList.toggle('is-on', t === b); t.setAttribute('aria-selected', t === b); });
    $$('.prices').forEach(p => p.hidden = p.dataset.panel !== b.dataset.tab);
    setPill(b);
    if (hasGsap && !reduce) gsap.from(`[data-panel=${b.dataset.tab}] .price`, { y: 24, opacity: 0, stagger: .07, duration: .7, ease: 'power3.out' });
  }));
  setPill(tabs[0]);
  addEventListener('resize', () => setPill($('.tab.is-on')));

  // lista → WhatsApp
  $('#form').addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target, nome = f.nome.value.trim();
    if (nome.length < 2) { $('#formErr').textContent = 'Coloca o nome que vai na lista.'; f.nome.focus(); return; }
    $('#formErr').textContent = '';
    const msg = `Oi! Quero colocar meu nome na lista da Hot Bar.\n\nNome: ${nome}\nVou como: ${f.como.value}\nEvento: ${f.evento.value}`;
    window.open('https://wa.me/5511950399869?text=' + encodeURIComponent(msg), '_blank', 'noopener');
  });

  if (!hasGsap || reduce) { $$('.w').forEach(w => w.style.opacity = 1); return; }

  // animações de scroll
  const words = $$('.w', mt);
  ScrollTrigger.create({
    trigger: mt, start: 'top 80%', end: 'bottom 45%', scrub: true,
    onUpdate: s => { const n = Math.round(s.progress * words.length); words.forEach((w, i) => w.style.opacity = i < n ? 1 : .14); }
  });
  gsap.to('.manifesto__img', { yPercent: -20, rotate: -3, ease: 'none', scrollTrigger: { trigger: '.manifesto', scrub: true } });
  const cnt = $('[data-count]');
  ScrollTrigger.create({ trigger: cnt, start: 'top 85%', once: true, onEnter: () => gsap.to(cnt, { textContent: 11, duration: 1.8, snap: { textContent: 1 }, ease: 'power2.out' }) });

  gsap.to('.hero__stage', { yPercent: 18, scale: 1.08, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__content', { yPercent: -30, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  $$('.h2').forEach(h => gsap.from(h, { y: 60, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 85%' } }));

  $$('.scene').forEach((s, i) => {
    gsap.from(s, { clipPath: 'inset(100% 0 0 0)', duration: 1.4, ease: 'expo.out', delay: (i % 4) * .08, scrollTrigger: { trigger: '.noite__grid', start: 'top 80%' } });
    gsap.to($('.scene__media', s), { yPercent: -8, ease: 'none', scrollTrigger: { trigger: s, scrub: true } });
  });

  $$('.poster').forEach((p, i) => gsap.from(p, { y: 80, rotate: i % 2 ? 3 : -3, opacity: 0, duration: 1.2, delay: i * .08, ease: 'expo.out', scrollTrigger: { trigger: '.prog__list', start: 'top 85%' } }));
  gsap.to('.precos__bg img', { yPercent: -15, ease: 'none', scrollTrigger: { trigger: '.precos', scrub: true } });
  $$('.price').forEach((p, i) => gsap.from(p, { y: 50, opacity: 0, duration: 1, delay: i * .08, ease: 'power3.out', scrollTrigger: { trigger: '.prices', start: 'top 85%' } }));
  gsap.from('.lista__media', { clipPath: 'inset(0 100% 0 0)', duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: '.lista', start: 'top 70%' } });
  $$('.acc details').forEach((d, i) => gsap.from(d, { x: 40, opacity: 0, duration: 1, delay: i * .06, ease: 'power3.out', scrollTrigger: { trigger: '.acc', start: 'top 80%' } }));
  gsap.from('.hts__img', { y: 80, rotate: -2, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.hts', start: 'top 75%' } });
  $$('.unit').forEach((u, i) => gsap.from(u, { y: 60, opacity: 0, duration: 1.2, delay: i * .1, ease: 'expo.out', scrollTrigger: { trigger: '.units__grid', start: 'top 85%' } }));
  gsap.from('.final__big', { scale: .85, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.final', start: 'top 80%', end: 'center center', scrub: true } });

  // ambientes: rolagem horizontal presa na tela (desktop)
  const mm = gsap.matchMedia();
  mm.add('(min-width: 761px)', () => {
    const track = $('#ambTrack');
    const dist = () => track.scrollWidth - (innerWidth - track.getBoundingClientRect().left) + 40;
    const tween = gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: '.amb', pin: '.amb__pin', start: 'top top', end: () => '+=' + dist(), scrub: .8, invalidateOnRefresh: true }
    });
    $$('.amb__card img').forEach(img => gsap.fromTo(img, { xPercent: -6 }, { xPercent: 6, ease: 'none', scrollTrigger: { trigger: img.parentNode, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } }));
  });

  addEventListener('load', () => ScrollTrigger.refresh());
})();
