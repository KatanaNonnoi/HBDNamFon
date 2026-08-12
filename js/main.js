/* ════════════════════════════════════════════════════════════
   main.js — ตัวขับเคลื่อนทั้งเว็บ
   (ปกติไม่ต้องแก้ไฟล์นี้ — แก้ที่ js/config.js พอ)
   ════════════════════════════════════════════════════════════ */

'use strict';

const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const rand = (min, max) => min + Math.random() * (max - min);
const pick = arr => arr[(Math.random() * arr.length) | 0];

const PASTEL = ['#FF8FC0', '#EF5C99', '#7FC9FF', '#4FA6EE', '#FFC85C',
                '#EDA31A', '#C7B4FF', '#A9E9D2', '#FFFFFF'];


/* ══════════════ 1. ดาวระยิบบนพื้นหลัง ══════════════ */

function buildStars(count = 70) {
  const host = $('#stars');
  const glyphs = ['✦', '✧', '✩', '·', '✵'];
  const tints  = ['', 'pinkish', 'bluish'];
  const frag = document.createDocumentFragment();

  for (let i = 0; i < count; i++) {
    const s = document.createElement('span');
    s.className = 'star ' + pick(tints);
    s.textContent = pick(glyphs);
    s.style.left = rand(0, 100).toFixed(2) + '%';
    s.style.top  = rand(0, 100).toFixed(2) + '%';
    s.style.fontSize = rand(9, 24).toFixed(0) + 'px';
    s.style.setProperty('--dur',   rand(3, 7).toFixed(1) + 's');
    s.style.setProperty('--delay', rand(0, 6).toFixed(1) + 's');
    frag.appendChild(s);
  }
  host.appendChild(frag);
}


/* ══════════════ 2. Confetti / พลุ ══════════════ */

const Confetti = {
  canvas: null, ctx: null, parts: [], running: false, dpr: 1,

  init() {
    this.canvas = $('#confetti-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  },

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width  = innerWidth  * this.dpr;
    this.canvas.height = innerHeight * this.dpr;
    this.canvas.style.width  = innerWidth + 'px';
    this.canvas.style.height = innerHeight + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  },

  burst(x, y, count = 70, power = 9) {
    if (REDUCED) count = Math.min(count, 20);
    for (let i = 0; i < count; i++) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(power * 0.3, power);
      this.parts.push(this.make(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed));
    }
    this.start();
  },

  rain(count = 90) {
    if (REDUCED) count = Math.min(count, 30);
    for (let i = 0; i < count; i++) {
      const p = this.make(rand(0, innerWidth), rand(-innerHeight * 0.4, -10),
                          rand(-0.7, 0.7), rand(1.6, 4.2));
      p.decay = rand(0.003, 0.007);
      this.parts.push(p);
    }
    this.start();
  },

  /** พลุ: ระเบิดหลายลูกกระจายทั่วจอบนเป็นชุด ๆ */
  fireworks(duration = 2600) {
    const shoot = () => {
      this.burst(rand(innerWidth * 0.12, innerWidth * 0.88),
                 rand(innerHeight * 0.12, innerHeight * 0.55),
                 rand(50, 90), rand(9, 15));
      Music.chime(rand(520, 1050));
    };
    shoot();
    const timer = setInterval(shoot, 420);
    setTimeout(() => clearInterval(timer), duration);
  },

  make(x, y, vx, vy) {
    return {
      x, y, vx, vy,
      size: rand(5, 12),
      color: pick(PASTEL),
      shape: Math.random() < 0.34 ? 'star' : (Math.random() < 0.5 ? 'rect' : 'circle'),
      rot: rand(0, Math.PI * 2), vr: rand(-0.22, 0.22),
      life: 1, decay: rand(0.006, 0.013),
      sway: rand(0.4, 1.6), seed: rand(0, 100),
    };
  },

  start() {
    if (this.running) return;
    this.running = true;
    requestAnimationFrame(this.tick.bind(this));
  },

  tick(t) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, innerWidth, innerHeight);

    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.vy += 0.14;
      p.vx += Math.sin((t / 600) + p.seed) * 0.03 * p.sway;
      p.vx *= 0.995;
      p.x += p.vx; p.y += p.vy;
      p.rot += p.vr;
      p.life -= p.decay;

      if (p.life <= 0 || p.y > innerHeight + 60) { this.parts.splice(i, 1); continue; }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
      ctx.fillStyle = p.color;

      if (p.shape === 'rect')        ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66);
      else if (p.shape === 'circle') { ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill(); }
      else                           this.drawStar(ctx, p.size * 0.72);

      ctx.restore();
    }

    if (this.parts.length) requestAnimationFrame(this.tick.bind(this));
    else { this.running = false; ctx.clearRect(0, 0, innerWidth, innerHeight); }
  },

  drawStar(ctx, r) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const rad = i % 2 ? r * 0.45 : r;
      const a = (Math.PI / 5) * i - Math.PI / 2;
      ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * rad, Math.sin(a) * rad);
    }
    ctx.closePath(); ctx.fill();
  },

  burstFrom(el, count, power) {
    const r = el.getBoundingClientRect();
    this.burst(r.left + r.width / 2, r.top + r.height / 2, count, power);
  },
};


/* ══════════════ 3. เพลง ══════════════ */

const Music = {
  el: null, btn: null, started: false, playing: false, fallback: null,

  init() {
    this.el  = $('#bgm');
    this.btn = $('#music-btn');
    this.el.volume = CONFIG.music.volume ?? 0.45;
    this.btn.addEventListener('click', () => this.toggle());
  },

  /** เรียกหลังผู้ใช้แตะครั้งแรกเท่านั้น (นโยบาย autoplay ของเบราว์เซอร์) */
  start() {
    if (this.started) return;
    this.started = true;
    this.btn.hidden = false;

    this.el.addEventListener('error', () => this.useFallback(), { once: true });
    this.el.src = CONFIG.music.src;

    const p = this.el.play();
    if (p && p.catch) p.then(() => { this.playing = true; }).catch(() => this.useFallback());
    else this.playing = true;
  },

  /** ไม่มีไฟล์เพลง → สังเคราะห์เมโลดี้กล่องดนตรีให้แทน */
  useFallback() {
    if (this.fallback) return;
    try { this.el.pause(); } catch (e) { /* ไม่เป็นไร */ }
    this.fallback = new MusicBox();
    this.fallback.start();
    this.playing = true;
  },

  toggle() {
    this.playing = !this.playing;
    this.btn.classList.toggle('is-muted', !this.playing);
    if (this.fallback) this.playing ? this.fallback.start() : this.fallback.stop();
    else                this.playing ? this.el.play().catch(() => {}) : this.el.pause();
  },

  /** เสียงสั้น ๆ ตอนเทียนดับ / พลุแตก */
  chime(freq = 880) {
    try {
      const ctx = MusicBox.sharedCtx(), now = ctx.currentTime;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.16, now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
      o.connect(g); g.connect(ctx.destination);
      o.start(now); o.stop(now + 0.95);
    } catch (e) { /* เบราว์เซอร์ไม่รองรับก็ข้ามไป */ }
  },
};

/** กล่องดนตรีสังเคราะห์ — ใช้เมื่อไม่มีไฟล์ mp3 */
class MusicBox {
  static ctx = null;
  static sharedCtx() {
    if (!MusicBox.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      MusicBox.ctx = new AC();
    }
    if (MusicBox.ctx.state === 'suspended') MusicBox.ctx.resume();
    return MusicBox.ctx;
  }

  constructor() {
    // เพนทาโทนิก C — ฟังสบาย ไม่มีโน้ตกัดกัน
    this.notes = [523.25, 587.33, 659.25, 783.99, 880.00,
                  1046.50, 880.00, 783.99, 659.25, 587.33];
    this.i = 0; this.timer = null;
  }

  start() {
    if (this.timer) return;
    const step = () => {
      this.play(this.notes[this.i % this.notes.length]);
      if (Math.random() < 0.35) this.play(this.notes[(this.i + 4) % this.notes.length] / 2, 0.06);
      this.i++;
    };
    step();
    this.timer = setInterval(step, 460);
  }

  stop() { clearInterval(this.timer); this.timer = null; }

  play(freq, vol = 0.11) {
    try {
      const ctx = MusicBox.sharedCtx(), now = ctx.currentTime;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'triangle'; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(vol, now + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
      o.connect(g); g.connect(ctx.destination);
      o.start(now); o.stop(now + 1.45);
    } catch (e) { /* เงียบไว้ */ }
  }
}


/* ══════════════ 4. ตัวจัดการฉาก ══════════════ */

const Scenes = {
  list: [], index: 0, hooks: {},

  init() {
    this.list = $$('.scene');
    $$('[data-next]').forEach(btn =>
      btn.addEventListener('click', () => this.go(this.index + 1)));
  },

  go(i) {
    if (i < 0 || i >= this.list.length || i === this.index) return;
    const leaving = this.list[this.index];
    leaving.classList.remove('is-active');
    if (this.hooks['leave:' + leaving.id]) this.hooks['leave:' + leaving.id]();

    this.index = i;
    const el = this.list[i];
    el.classList.add('is-active');
    el.scrollTop = 0;
    if (this.hooks[el.id]) this.hooks[el.id]();
  },

  on(sceneId, fn) { this.hooks[sceneId] = fn; },
};


/* ══════════════ 5. ฉาก 1 — กล่องของขวัญ ══════════════ */

function setupGift() {
  const gift = $('#gift');
  $('#gift-eyebrow').textContent = CONFIG.gift.eyebrow;
  $('#gift-hint').textContent    = CONFIG.gift.hint;

  gift.addEventListener('click', () => {
    if (gift.classList.contains('is-open')) return;
    gift.classList.add('is-open');
    $('#gift-hint').hidden = true;

    Music.start();
    Confetti.burstFrom(gift, 90, 13);
    setTimeout(() => Confetti.rain(60), 250);
    setTimeout(() => Scenes.go(1), 950);
  });
}


/* ══════════════ 6. ฉาก 2 — คำอวยพร ══════════════ */

const Wish = {
  done: false,

  init() {
    // ของตกแต่ง: หยิบรูปแรก ๆ มาแปะมุมแบบโพลารอยด์
    const photos = CONFIG.photos || [];
    $$('.decor-photo img').forEach((img, i) => {
      const p = photos[i % Math.max(photos.length, 1)];
      if (p) img.src = p.src; else img.closest('.decor-photo').style.display = 'none';
      img.addEventListener('error', () => img.removeAttribute('src'));
    });
  },

  run() {
    if (this.done) return;
    this.done = true;

    $('#name-text').textContent = CONFIG.name;
    const target  = $('#wish-text');
    const caret   = $('#wish-caret');
    const full    = CONFIG.wish.join('\n');
    const nextBtn = $('#scene-wish [data-next]');

    if (REDUCED) {
      target.textContent = full;
      caret.classList.add('is-done');
      nextBtn.hidden = false;
      return;
    }

    let i = 0;
    const type = () => {
      target.textContent = full.slice(0, ++i);
      if (i < full.length) {
        const ch = full[i - 1];
        setTimeout(type, ch === '\n' ? 320 : (ch === ' ' ? 20 : rand(34, 62)));
      } else {
        caret.classList.add('is-done');
        nextBtn.hidden = false;
        Confetti.burst(innerWidth / 2, innerHeight * 0.35, 40, 8);
      }
    };
    setTimeout(type, 500);
  },
};


/* ══════════════ 7. ฉาก 3 — รูปกระจายทั้งหน้า ══════════════ */

const Collage = {
  index: 0, built: false,

  init() {
    const host = $('#collage');
    host.innerHTML = '';

    CONFIG.photos.forEach((photo, i) => {
      const fig = document.createElement('figure');
      fig.className = 'snap';
      fig.tabIndex = 0;
      fig.style.setProperty('--rot',  rand(-7, 7).toFixed(1) + 'deg');
      fig.style.setProperty('--dy',   rand(-16, 16).toFixed(0) + 'px');
      fig.style.setProperty('--tape', rand(-9, 9).toFixed(0) + 'deg');

      const img = document.createElement('img');
      img.src = photo.src;
      img.alt = photo.caption || `รูปที่ ${i + 1}`;
      img.loading = i < 4 ? 'eager' : 'lazy';
      img.addEventListener('error', () => img.removeAttribute('src'));

      const cap = document.createElement('figcaption');
      cap.textContent = photo.caption || '';

      fig.append(img, cap);
      fig.addEventListener('click', () => Lightbox.open(i));
      fig.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); Lightbox.open(i); }
      });
      host.appendChild(fig);
    });
  },

  /** ให้รูปทยอยโผล่ทีละใบตอนเข้าฉาก */
  reveal() {
    if (this.built) return;
    this.built = true;
    $$('#collage .snap').forEach((el, i) => {
      setTimeout(() => el.classList.add('in'), 90 * i);
    });
    setTimeout(() => Confetti.rain(35), 500);
  },
};


/* ══════════════ 8. ดูรูปขยาย (Lightbox) ══════════════ */

const Lightbox = {
  index: 0,

  init() {
    $('#lb-close').addEventListener('click', () => this.close());
    $('#lb-prev').addEventListener('click', e => { e.stopPropagation(); this.step(-1); });
    $('#lb-next').addEventListener('click', e => { e.stopPropagation(); this.step(1); });
    $('#lightbox').addEventListener('click', e => {
      if (e.target === $('#lightbox')) this.close();
    });
    document.addEventListener('keydown', e => {
      if ($('#lightbox').hidden) return;
      if (e.key === 'Escape')     this.close();
      if (e.key === 'ArrowRight') this.step(1);
      if (e.key === 'ArrowLeft')  this.step(-1);
    });
  },

  open(i) {
    this.index = i;
    this.render();
    $('#lightbox').hidden = false;
  },

  close() { $('#lightbox').hidden = true; },

  step(d) {
    const n = CONFIG.photos.length;
    this.index = (this.index + d + n) % n;
    this.render();
  },

  render() {
    const p = CONFIG.photos[this.index];
    const img = $('#lb-img');
    img.src = p.src;
    img.alt = p.caption || '';
    $('#lb-cap').textContent = p.caption || '';
    $('.lb-frame').style.animation = 'none';
    void $('.lb-frame').offsetWidth;             // รีสตาร์ต animation
    $('.lb-frame').style.animation = '';
  },
};


/* ══════════════ 9. ฉาก 4 — เค้ก + เป่าเทียน (ฉากจบ) ══════════════ */

const Cake = {
  total: 0, out: 0, blowing: false, finished: false,

  init() {
    $('#cake-title').textContent  = CONFIG.cake.title;
    $('#cake-hint').textContent   = CONFIG.cake.hint;
    $('#ending-note').textContent = CONFIG.ending?.note || '';
    this.build();

    const area = $('#cake-area');
    area.addEventListener('pointerdown', e => {
      this.blowing = true;
      try { area.setPointerCapture(e.pointerId); } catch (err) { /* ข้าม */ }
      this.tryBlow(e.clientX, e.clientY);
    });
    area.addEventListener('pointermove', e => {
      if (this.blowing) this.tryBlow(e.clientX, e.clientY);
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev =>
      area.addEventListener(ev, () => { this.blowing = false; }));

    $('#replay-btn').addEventListener('click', () => replay());
  },

  build() {
    const host = $('#candles');
    host.innerHTML = '';
    this.total = Math.max(1, CONFIG.cake.candles | 0);
    this.out = 0; this.finished = false;

    for (let i = 0; i < this.total; i++) {
      const c = document.createElement('div');
      c.className = 'candle';
      c.innerHTML = '<span class="flame"></span><span class="wick"></span><span class="candle-stick"></span>';
      host.appendChild(c);
    }
  },

  /** เข้าฉาก → หรี่ไฟทั้งหน้า เหลือสว่างแค่บริเวณเทียน */
  enter() {
    if (this.finished) return;
    setTimeout(() => $('#scene-cake').classList.add('is-dark'), 450);
  },

  leave() { $('#scene-cake').classList.remove('is-dark'); },

  tryBlow(x, y) {
    if (this.finished) return;
    $$('.candle:not(.is-out)', $('#candles')).forEach(candle => {
      const f = $('.flame', candle).getBoundingClientRect();
      const cx = f.left + f.width / 2, cy = f.top + f.height / 2;
      if (Math.hypot(x - cx, y - cy) < 38) this.blowOut(candle);
    });
  },

  blowOut(candle) {
    candle.classList.add('is-out');
    this.out++;

    const smoke = document.createElement('span');
    smoke.className = 'smoke';
    candle.appendChild(smoke);
    setTimeout(() => smoke.remove(), 1500);

    Music.chime(660 + this.out * 90);
    if (this.out >= this.total) setTimeout(() => this.allOut(), 500);
  },

  /** เป่าครบ → สว่างจ้าทั้งจอ + พลุ + รูปลอยผ่านด้านหลัง */
  allOut() {
    if (this.finished) return;
    this.finished = true;

    $('#scene-cake').classList.remove('is-dark');
    document.body.classList.add('is-bright');
    $('#cake-hint').hidden = true;

    // เปลี่ยนหัวข้อจาก "เป่าเทียน..." เป็นคำอวยพรใหญ่ ๆ
    $('#cake-head .eyebrow').textContent = 'Happy Birthday';
    $('#cake-title').textContent = CONFIG.name;
    $('#cake-title').classList.add('grand');

    $('#wish-granted').textContent = CONFIG.cake.granted;
    $('#wish-reveal').hidden = false;

    Confetti.burstFrom($('#cake-area'), 110, 14);
    setTimeout(() => Confetti.fireworks(3200), 400);
    setTimeout(() => Confetti.rain(80), 900);
    setTimeout(() => DriftPhotos.start(), 1200);
  },

  reset() {
    this.build();
    $('#scene-cake').classList.remove('is-dark');
    document.body.classList.remove('is-bright');
    $('#cake-hint').hidden = false;
    $('#cake-head .eyebrow').textContent = 'อธิษฐานได้เลย';
    $('#cake-title').textContent = CONFIG.cake.title;
    $('#cake-title').classList.remove('grand');
    $('#wish-reveal').hidden = true;
    DriftPhotos.stop();
  },
};


/* ══════════════ 10. รูปลอยผ่านด้านหลัง ══════════════ */

const DriftPhotos = {
  timer: null, i: 0,

  start() {
    if (this.timer || !CONFIG.photos.length) return;
    this.spawn();
    this.timer = setInterval(() => this.spawn(), 1600);
  },

  stop() {
    clearInterval(this.timer); this.timer = null;
    $('#drift-layer').innerHTML = '';
  },

  spawn() {
    const photo = CONFIG.photos[this.i++ % CONFIG.photos.length];
    const el = document.createElement('figure');
    el.className = 'drift-photo';

    const size = rand(74, 132);
    const dur  = rand(13, 21);
    const fromRight = Math.random() < 0.5;

    el.style.width = size.toFixed(0) + 'px';
    el.style.top   = rand(4, 76).toFixed(0) + 'vh';
    el.style[fromRight ? 'right' : 'left'] = '-180px';
    el.style.setProperty('--rot', rand(-10, 10).toFixed(1) + 'deg');
    el.style.setProperty('--dx',  (fromRight ? -1 : 1) * rand(105, 130) + 'vw');
    el.style.setProperty('--dy',  rand(-16, 10).toFixed(0) + 'vh');
    el.style.setProperty('--dur', dur.toFixed(1) + 's');

    const img = document.createElement('img');
    img.src = photo.src; img.alt = '';
    img.addEventListener('error', () => img.removeAttribute('src'));

    el.appendChild(img);
    $('#drift-layer').appendChild(el);
    setTimeout(() => el.remove(), dur * 1000 + 500);
  },
};


/* ══════════════ 11. เล่นใหม่ ══════════════ */

function replay() {
  Cake.reset();
  Collage.built = false;
  $$('#collage .snap').forEach(el => el.classList.remove('in'));

  $('#gift').classList.remove('is-open');
  $('#gift-hint').hidden = false;
  Wish.done = false;
  $('#wish-text').textContent = '';
  $('#wish-caret').classList.remove('is-done');
  $('#scene-wish [data-next]').hidden = true;

  Scenes.go(0);
}


/* ══════════════ เริ่มทำงาน ══════════════ */

document.addEventListener('DOMContentLoaded', () => {
  document.title = `Happy Birthday ${CONFIG.name} 🎂`;

  buildStars();
  Confetti.init();
  Music.init();
  Scenes.init();

  setupGift();
  Wish.init();
  Collage.init();
  Lightbox.init();
  Cake.init();

  Scenes.on('scene-wish',   () => Wish.run());
  Scenes.on('scene-photos', () => Collage.reveal());
  Scenes.on('scene-cake',   () => Cake.enter());
  Scenes.on('leave:scene-cake', () => Cake.leave());
});
