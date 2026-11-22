/* ═══════════════════════════════════════════════════════════════════
   العرض التفاعلي — التحيز والخصوصية والشفافية في الذكاء الاصطناعي
   البنية: أدوات مساعدة → الكروم (تقدم/سكك) → الظهور بالتمرير →
           عدّادات وأعمدة → مكونات تفاعلية لكل محور → خلفية Hero
   ═══════════════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  /* ─── أدوات مساعدة ─────────────────────────────────────────── */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const easeOut = t => 1 - Math.pow(1 - t, 3);

  /** تفعيل رد فعل مرة واحدة عند دخول عنصر منطقة الرؤية */
  function onVisible(el, cb, threshold = 0.25) {
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { cb(el); io.unobserve(e.target); }
      });
    }, { threshold });
    io.observe(el);
  }

  /* ═══ 1) الكروم: شريط التقدم + السكك الجانبية ═══════════════ */
  const progressBar = $('#progressBar');
  const railLinks = $$('.rail a');
  const railMap = new Map(); // section id → rail link
  railLinks.forEach(a => railMap.set(a.dataset.target, a));

  function paintProgress() {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    const p = max > 0 ? (window.scrollY / max) * 100 : 0;
    if (progressBar) progressBar.style.width = p + '%';
  }
  window.addEventListener('scroll', paintProgress, { passive: true });
  paintProgress();

  if (railLinks.length) {
    const sections = $$('main section[data-chapter]');
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const id = e.target.id;
        railLinks.forEach(a => a.classList.toggle('is-active', a.dataset.target === id));
        // لون شريط التقدم يتلوّن بلون المحور الحالي
        const accent = getComputedStyle(e.target).getPropertyValue('--accent').trim();
        if (accent && progressBar) progressBar.style.backgroundColor = accent;
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(s => io.observe(s));
  }

  /* ═══ 2) الظهور بالتمرير ═════════════════════════════════════ */
  {
    const els = $$('.reveal');
    if (reduceMotion) { els.forEach(el => el.classList.add('in')); }
    else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
      els.forEach(el => io.observe(el));
    }
  }

  /* ═══ 3) العدّادات المتحركة [data-count] ═════════════════════ */
  {
    const counters = $$('[data-count]');
    const run = (el) => {
      const target = parseFloat(el.dataset.count);
      const dec = parseInt(el.dataset.dec || '0', 10);
      if (reduceMotion) { el.textContent = target.toFixed(dec); return; }
      const dur = 1300, t0 = performance.now();
      const tick = (t) => {
        const k = Math.min(1, (t - t0) / dur);
        el.textContent = (target * easeOut(k)).toFixed(dec);
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    counters.forEach(el => onVisible(el, run, 0.6));
  }

  /* ═══ 4) الأعمدة المتحركة [data-w] ═══════════════════════════ */
  {
    $$('[data-w]').forEach(el => {
      onVisible(el, () => {
        requestAnimationFrame(() => { el.style.width = el.dataset.w + '%'; });
      }, 0.5);
    });
  }

  /* ═══ 5) الأكورديون: من أين يأتي التحيز؟ ═════════════════════ */
  {
    const acc = $('[data-acc]');
    if (acc) {
      const items = $$('.acc-item', acc);
      items.forEach(item => {
        const head = $('.acc-head', item);
        head.addEventListener('click', () => {
          const isOpen = item.classList.contains('open');
          items.forEach(i => { i.classList.remove('open'); $('.acc-head', i).setAttribute('aria-expanded', 'false'); });
          if (!isOpen) { item.classList.add('open'); head.setAttribute('aria-expanded', 'true'); }
        });
      });
      // فتح البند الأول تلقائيًا لجذب الانتباه
      items[0].classList.add('open');
      $('.acc-head', items[0]).setAttribute('aria-expanded', 'true');
    }
  }

  /* ═══ 6) تجربة تشبيه الكلمات ═════════════════════════════════ */
  {
    const quiz = $('[data-quiz]');
    if (quiz) {
      const opts = $$('.quiz-opt', quiz);
      const feedback = $('#quizFeedback', quiz);
      const note = $('.quiz-note', quiz);
      const correct = opts.find(o => o.dataset.ok === '1');
      opts.forEach(o => {
        o.addEventListener('click', () => {
          opts.forEach(x => x.classList.remove('is-wrong'));
          o.classList.add(o.dataset.ok === '1' ? 'is-right' : 'is-wrong');
          correct.classList.add('is-right');
          feedback.textContent = o.dataset.ok === '1'
            ? 'صحيح — هذا بالفعل ما أجاب به النموذج: «ربة منزل».'
            : 'ليس هذا… النموذج أجاب: «ربة منزل».';
          note.hidden = false;
        });
      });
    }
  }

  /* ═══ 7) عدستان العدالة (COMPAS) ═════════════════════════════ */
  {
    const box = $('[data-fair]');
    if (box) {
      const defs = {
        1: {
          cls: 'v-ok', icon: '#i-check', label: 'عادل بهذا المعيار',
          who: 'ننظر فقط إلى من وُسموا «شديدي الخطورة» — من السود ومن البيض معًا.',
          what: 'من منهم ارتكب جريمة فعلًا بعد ذلك؟',
          found: 'النسبة متقاربة بين المجموعتين في هذه المجموعة — وهذا هو القياس الذي اعتمدته الشركة لتقول إن برنامجها عادل.'
        },
        2: {
          cls: 'v-bad', icon: '#i-x', label: 'منحاز بهذا المعيار',
          who: 'ننظر فقط إلى الأبرياء — من لم يرتكبوا أي جريمة بعد ذلك.',
          what: 'كم منهم وُسم خطأً «شديدي الخطورة»؟',
          found: '<b class="num">44.9%</b> من الأبرياء السود، مقابل <b class="num">23.5%</b> فقط من الأبرياء البيض — أي أن النظام يخطئ مع الأبرياء السود نحو الضعف، وهذه هي النسبة التي نشرها الصحفيون.'
        }
      };
      const verdict = $('#fairVerdict', box);
      const vLabel = $('span', verdict);
      const vIcon = $('use', verdict);
      const who = $('#fairWho', box);
      const what = $('#fairWhat', box);
      const found = $('#fairFound', box);
      $$('.fair-btn', box).forEach(btn => {
        btn.addEventListener('click', () => {
          $$('.fair-btn', box).forEach(b => b.classList.remove('is-on'));
          btn.classList.add('is-on');
          const d = defs[btn.dataset.def];
          verdict.classList.remove('v-ok', 'v-bad');
          verdict.classList.add(d.cls);
          vIcon.setAttribute('href', d.icon);
          vLabel.textContent = d.label;
          who.textContent = d.who;
          what.textContent = d.what;
          found.innerHTML = d.found;
        });
      });
    }
  }

  /* ═══ 8) شبكة الـ 87% (إعادة تحديد الهوية) ═══════════════════ */
  {
    const grid = $('#dotsGrid');
    if (grid) {
      const TOTAL = 100, MATCH = 87;
      for (let i = 0; i < TOTAL; i++) grid.appendChild(document.createElement('span'));
      const dots = $$('span', grid);
      onVisible(grid, () => {
        if (reduceMotion) { dots.slice(0, MATCH).forEach(d => d.classList.add('on')); return; }
        dots.forEach((d, i) => {
          if (i < MATCH) setTimeout(() => d.classList.add('on'), i * 16);
        });
      }, 0.35);
    }
  }

  /* ═══ 9) طرفية تسريب النموذج (كاتبة آلية) ════════════════════ */
  {
    const out = $('#leakOut');
    if (out) {
      const tokens = [
        { t: '«المستخدم ' },
        { t: 'أحمد م.', pii: true },
        { t: '، محافظة الجيزة — العمر ' },
        { t: '23 سنة', pii: true },
        { t: ' — هاتف ' },
        { t: '0101 XXX XXXX', pii: true },
        { t: ' — بريد ' },
        { t: 'ahmed.m@xxxx.com', pii: true },
        { t: ' — يفضّل أفلام الجريمة والدراما»\n' },
        { t: '«… ونصوص أخرى مماثلة: ' },
        { t: 'فاطمة ك.', pii: true },
        { t: '، هاتف ' },
        { t: '011X XXX XXXX', pii: true },
        { t: '، بريد ' },
        { t: 'f.k@xxxx.net', pii: true },
        { t: '»' }
      ];
      let timer = null;
      const renderInstant = () => {
        out.textContent = '';
        tokens.forEach(tk => {
          const s = document.createElement(tk.pii ? 'span' : 'span');
          if (tk.pii) s.className = 'pii';
          s.textContent = tk.t;
          out.appendChild(s);
        });
        out.classList.remove('typing');
      };
      const type = () => {
        clearTimeout(timer);
        out.textContent = '';
        out.classList.add('typing');
        // كتابة الجزء كاملًا كوحدة واحدة (لا حرف بحرف) — يضمن سلامة ترتيب
        // النص العربي المختلط بالإنجليزية على جميع الأجهزة
        const STEP = window.innerWidth < 640 ? 90 : 130;
        let ti = 0;
        const step = () => {
          if (ti >= tokens.length) { out.classList.remove('typing'); return; }
          const tk = tokens[ti];
          const s = document.createElement('span');
          if (tk.pii) s.className = 'pii';
          s.textContent = tk.t;
          out.appendChild(s);
          ti++;
          timer = setTimeout(step, STEP);
        };
        step();
      };
      onVisible(out, () => { reduceMotion ? renderInstant() : type(); }, 0.2);
      const replay = $('#leakReplay');
      if (replay) replay.addEventListener('click', () => { reduceMotion ? renderInstant() : type(); });
    }
  }

  /* ═══ 10) تجربة الخصوصية التفاضلية ═══════════════════════════ */
  {
    const dp = $('[data-dp]');
    if (dp) {
      const DATA = { big: [41, 44, 38, 45, 40, 43, 39, 42], small: [38, 44, 41] };
      const groupBtns = $$('.seg-btn', dp);
      const slider = $('#dpNoise', dp);
      const noiseVal = $('#dpNoiseVal', dp);
      const barsBox = $('#dpBars', dp);
      const read = $('#dpAvg', dp);
      const note = $('#dpNote', dp);
      const NOISE_LABELS = ['بلا تشويش', 'تشويش خفيف', 'تشويش متوسط', 'تشويش قوي'];
      let group = 'big';

      const renderBars = (values) => {
        barsBox.textContent = '';
        values.forEach(v => {
          const b = document.createElement('div');
          b.className = 'dp-bar';
          b.style.height = Math.max(6, Math.min(100, (v / 50) * 100)) + '%';
          barsBox.appendChild(b);
        });
      };

      const update = () => {
        const noise = parseInt(slider.value, 10);
        const base = DATA[group];
        const jittered = base.map(v => {
          const off = noise === 0 ? 0 : (Math.random() - 0.5) * 2 * noise * 8;
          return Math.max(2, v + off);
        });
        // ارتفاعات الأعمدة (أعد استخدام الأعمدة القائمة لتفادي وميض)
        const bars = $$('.dp-bar', barsBox);
        while (bars.length < jittered.length) {
          const b = document.createElement('div');
          b.className = 'dp-bar';
          barsBox.appendChild(b);
          bars.push(b);
        }
        while (barsBox.children.length > jittered.length) barsBox.lastChild.remove();
        jittered.forEach((v, i) => {
          bars[i].style.height = Math.max(6, Math.min(100, (v / 50) * 100)) + '%';
        });
        const avg = jittered.reduce((a, b) => a + b, 0) / jittered.length;
        read.textContent = 'النتيجة العامة: ' + avg.toFixed(1) + '%';
        noiseVal.textContent = NOISE_LABELS[noise];
        if (noise === 0) {
          note.textContent = 'بدون تشويش يمكن قراءة بيانات كل فرد على حدة — هذا ما تحمينا منه الخصوصية التفاضلية.';
        } else if (group === 'big') {
          note.textContent = 'التشويش يوزَّع عشوائيًا على الأفراد، لكنه يتبدد في المجموعات الكبيرة — النتيجة العامة شبه ثابتة.';
        } else {
          note.textContent = 'مع الفئات الصغيرة يظهر أثر التشويش في النتيجة بوضوح — هكذا قد تدفع الأقلية ثمن الحماية (دراسة المحور الرابع).';
        }
      };

      groupBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          groupBtns.forEach(b => b.classList.remove('is-on'));
          btn.classList.add('is-on');
          group = btn.dataset.group;
          renderBars(DATA[group]);
          update();
        });
      });
      slider.addEventListener('input', update);
      renderBars(DATA.big);
      update();
    }
  }

  /* ═══ 11) الصندوق الأسود: قرار القرض ═════════════════════════ */
  {
    const bb = $('[data-bb]');
    if (bb) {
      const state = { inc: 1, rec: 2, exp: 1 };
      let submitted = false;

      // مجموعات المدخلات
      $$('.seg[data-bbgroup]', bb).forEach(seg => {
        const key = seg.dataset.bbgroup;
        $$('.seg-btn', seg).forEach(btn => {
          btn.addEventListener('click', () => {
            $$('.seg-btn', seg).forEach(b => b.classList.remove('is-on'));
            btn.classList.add('is-on');
            state[key] = parseInt(btn.dataset.val, 10);
            submitted = false;                 // تغيير المدخلات يلغي القرار السابق
            const v = $('#bbVerdict', bb);
            const l = $('#bbLime', bb);
            if (v) v.hidden = true;
            if (l) l.hidden = true;
          });
        });
      });

      const verdict = $('#bbVerdict', bb);
      const verdictText = $('#bbVerdictText', bb);
      const verdictWhy = $('#bbVerdictWhy', bb);
      const lime = $('#bbLime', bb);
      const rows = $('#limeRows', bb);

      const submitBtn = $('#bbSubmit', bb);
      if (submitBtn) submitBtn.addEventListener('click', () => {
        const score = state.inc * 2 + state.rec + state.exp;
        submitted = true;
        lime.hidden = true;
        verdict.hidden = false;
        verdictText.classList.remove('v-accept', 'v-review', 'v-reject');
        if (score >= 5) { verdictText.classList.add('v-accept'); verdictText.textContent = 'قبول'; }
        else if (score >= 3) { verdictText.classList.add('v-review'); verdictText.textContent = 'مراجعة بشرية'; }
        else { verdictText.classList.add('v-reject'); verdictText.textContent = 'رفض'; }
        verdictWhy.textContent = 'لا يشرح النظام السبب — هذه هي مشكلة «الصندوق الأسود».';
      });

      const explainBtn = $('#bbExplain', bb);
      if (explainBtn) explainBtn.addEventListener('click', () => {
        if (!submitted) {
          verdict.hidden = false;
          verdictText.classList.remove('v-accept', 'v-review', 'v-reject');
          verdictText.textContent = '—';
          verdictWhy.textContent = 'قدّم الطلب أولًا، ثم اطلب تفسير القرار.';
          return;
        }
        // أوزان تقريبية: كلما كانت قيمة العامل أشد نحو الرفض زاد إسهامه الافتراضي
        // (تقريب مقصود لا يطابق النموذج بالضرورة — هذا مضمون التحذير أدناه)
        const jit = i => ((i * 7) % 9) - 4;
        const factors = [
          { label: 'الدخل', w: 50 - state.inc * 15 },
          { label: 'السجل الائتماني', w: 50 - state.rec * 15 },
          { label: 'مدة الخبرة', w: 50 - state.exp * 15 }
        ].map((f, i) => ({ ...f, w: Math.min(72, Math.max(8, f.w + jit(i))) }));
        rows.textContent = '';
        factors.forEach(f => {
          const row = document.createElement('div');
          row.className = 'lime-row';
          row.innerHTML =
            '<span class="lr-label"></span>' +
            '<span class="lr-track"><span class="lr-fill"></span></span>' +
            '<b class="num"></b>';
          $('.lr-label', row).textContent = f.label;
          $('b', row).textContent = f.w + '%';
          $('.lr-fill', row).style.width = f.w + '%';
          rows.appendChild(row);
        });
        lime.hidden = false;
      });
    }
  }

  /* ═══ 12) بطاقة النموذج القابلة للقلب ════════════════════════ */
  {
    const flip = $('#flipCard');
    if (flip) {
      const toggle = () => {
        const on = flip.classList.toggle('flipped');
        flip.setAttribute('aria-pressed', String(on));
      };
      flip.addEventListener('click', toggle);
      flip.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      });
    }
  }

  /* ═══ 13) مثلث التوتر ════════════════════════════════════════ */
  {
    const panel = $('#tensionPanel');
    if (panel) {
      const text = $('#tensionText', panel);
      const stories = {
        1: { edge: 'edge1', text: 'العدالة تحتاج بيانات، والخصوصية تمنعها: لا نستطيع التأكد أن النظام عادل مع النساء أو الأقليات إلا إذا عرفنا من تنتمي إليه كل حالة — وهذه بالضبط بيانات حساسة يريد القانون حمايتها.' },
        2: { edge: 'edge1', text: 'حماية الخصوصية قد تضر الأقليات: بعض وسائل حماية الخصوصية تؤدي إلى نتائج أقل دقة مع الفئات الصغيرة، فتدفع الأقلية الثمن الأعلى لحماية الجميع.' },
        3: { edge: 'edge2', text: 'الشفافية قد تكشف الخصوصية: تفسير القرارات يعطي المهاجم معلومات إضافية عن النموذج وعن بيانات تدريبه.' }
      };
      $$('.t-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          $$('.t-btn').forEach(b => b.classList.remove('is-on'));
          btn.classList.add('is-on');
          const s = stories[btn.dataset.t];
          $$('.triangle-svg .edge').forEach(e => e.classList.remove('active'));
          const edge = document.getElementById(s.edge);
          if (edge) edge.classList.add('active');
          panel.style.opacity = '0';
          setTimeout(() => { text.textContent = s.text; panel.style.opacity = '1'; }, 160);
        });
      });
    }
  }

  /* ═══ 14) وصف الكلمات في البطل (Hero) ════════════════════════ */
  {
    const caption = $('#heroCaption');
    if (caption) {
      const DEFAULT = caption.textContent;
      $$('.hero-word').forEach(w => {
        const show = () => { caption.textContent = w.dataset.cap; };
        const reset = () => { caption.textContent = DEFAULT; };
        w.addEventListener('mouseenter', show);
        w.addEventListener('focus', show);
        w.addEventListener('mouseleave', reset);
        w.addEventListener('blur', reset);
      });
    }
  }

  /* ═══ 15) خلفية البطل: شبكة عقد متحركة ═══════════════════════ */
  {
    const canvas = $('#heroCanvas');
    if (canvas && !reduceMotion) {
      const ctx = canvas.getContext('2d');
      let W = 0, H = 0, dots = [], raf = null, running = false;
      const DPR = Math.min(2, window.devicePixelRatio || 1);

      const resize = () => {
        const r = canvas.parentElement.getBoundingClientRect();
        W = r.width; H = r.height;
        canvas.width = W * DPR; canvas.height = H * DPR;
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        const n = Math.min(90, Math.floor((W * H) / 22000));
        dots = Array.from({ length: n }, () => ({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35
        }));
      };

      const frame = () => {
        ctx.clearRect(0, 0, W, H);
        const LINK = 120;
        for (const d of dots) {
          d.x += d.vx; d.y += d.vy;
          if (d.x < -10) d.x = W + 10; if (d.x > W + 10) d.x = -10;
          if (d.y < -10) d.y = H + 10; if (d.y > H + 10) d.y = -10;
        }
        for (let i = 0; i < dots.length; i++) {
          for (let j = i + 1; j < dots.length; j++) {
            const a = dots[i], b = dots[j];
            const dx = a.x - b.x, dy = a.y - b.y;
            const dist = Math.hypot(dx, dy);
            if (dist < LINK) {
              ctx.strokeStyle = 'rgba(232,186,102,' + (0.13 * (1 - dist / LINK)).toFixed(3) + ')';
              ctx.lineWidth = 1;
              ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            }
          }
        }
        for (const d of dots) {
          ctx.fillStyle = 'rgba(232,186,102,0.65)';
          ctx.beginPath(); ctx.arc(d.x, d.y, 1.5, 0, Math.PI * 2); ctx.fill();
        }
        raf = requestAnimationFrame(frame);
      };

      const start = () => { if (!running) { running = true; raf = requestAnimationFrame(frame); } };
      const stop = () => { running = false; cancelAnimationFrame(raf); };

      resize();
      window.addEventListener('resize', resize);
      // تشغيل فقط عندما يكون البطل مرئيًا (توفير للمعالج)
      new IntersectionObserver((entries) => {
        entries.forEach(e => e.isIntersecting ? start() : stop());
      }).observe($('#hero'));
    }
  }

})();
