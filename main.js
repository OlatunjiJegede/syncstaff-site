// SyncStaff v2: interactions
(function () {
  var mq = window.matchMedia('(max-width: 720px)');

  // mega menu (desktop hover with grace delay + click, mobile accordion)
  document.querySelectorAll('.menu > li.has-mega').forEach(function (li) {
    var btn = li.querySelector('.menu-btn');
    var closeTimer = null;
    function closeAll(except) {
      document.querySelectorAll('.menu > li.open').forEach(function (o) {
        if (o !== except) o.classList.remove('open');
      });
    }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var isOpen = li.classList.contains('open');
      if (!mq.matches && isOpen) return; // desktop: clicking an open menu keeps it open
      closeAll(li);
      li.classList.toggle('open', !isOpen);
      btn.setAttribute('aria-expanded', !isOpen ? 'true' : 'false');
    });
    li.addEventListener('mouseenter', function () {
      if (mq.matches) return;
      clearTimeout(closeTimer);
      closeAll(li);
      li.classList.add('open');
    });
    li.addEventListener('mouseleave', function () {
      if (mq.matches) return;
      clearTimeout(closeTimer);
      closeTimer = setTimeout(function () { li.classList.remove('open'); }, 260);
    });
  });
  document.addEventListener('click', function () {
    document.querySelectorAll('.menu > li.open').forEach(function (o) { o.classList.remove('open'); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') document.querySelectorAll('.menu > li.open').forEach(function (o) { o.classList.remove('open'); });
  });

  // mobile nav
  var toggle = document.querySelector('.nav-toggle');
  var menu = document.querySelector('.menu');
  if (toggle && menu) {
    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = menu.classList.toggle('show');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    menu.addEventListener('click', function (e) { e.stopPropagation(); });
  }

  // scroll reveal
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.1 });
    reveals.forEach(function (el) { io.observe(el); });
  } else { reveals.forEach(function (el) { el.classList.add('in'); }); }

  // count-up
  var nums = document.querySelectorAll('[data-count]');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (nums.length && 'IntersectionObserver' in window && !reduced) {
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io2.unobserve(en.target);
        var el = en.target, t = parseFloat(el.dataset.count), sfx = el.dataset.suffix || '', start = null;
        function step(ts) {
          if (!start) start = ts;
          var p = Math.min((ts - start) / 1300, 1); p = 1 - Math.pow(1 - p, 3);
          var v = t * p;
          el.textContent = (t % 1 === 0 ? Math.round(v) : v.toFixed(1)) + sfx;
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.5 });
    nums.forEach(function (el) { io2.observe(el); });
  } else {
    nums.forEach(function (el) { el.textContent = el.dataset.count + (el.dataset.suffix || ''); });
  }

  // FAQ
  document.querySelectorAll('.faq-q').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.faq-item'), ans = item.querySelector('.faq-a');
      var open = item.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      ans.style.maxHeight = open ? ans.scrollHeight + 'px' : '0';
    });
  });

  // demo forms
  function wireForm(id, msgId, text) {
    var f = document.getElementById(id);
    if (!f) return;
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var m = document.getElementById(msgId);
      if (m) { m.classList.add('ok'); m.textContent = text; m.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      f.reset();
    });
  }
  wireForm('contact-form', 'form-msg', 'Thanks! Your message has been recorded. We reply within one business day.');

  // hero slider (Deel-style chips)
  var slides = document.getElementById('hero-slides');
  if (slides) {
    var chips = Array.prototype.slice.call(document.querySelectorAll('.chip[data-slide]'));
    var idx = 0, n = slides.children.length, timer = null;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function go(i) {
      idx = (i + n) % n;
      slides.style.transform = 'translateX(-' + (idx * 100) + '%)';
      chips.forEach(function (c, j) { c.classList.toggle('active', j === idx); });
    }
    function auto() {
      if (reduce) return;
      timer = setInterval(function () { go(idx + 1); }, 4500);
    }
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        clearInterval(timer);
        go(parseInt(c.dataset.slide, 10));
        auto();
      });
    });
    var sliderEl = slides.closest('.slider');
    sliderEl.addEventListener('mouseenter', function () { clearInterval(timer); });
    sliderEl.addEventListener('mouseleave', function () { clearInterval(timer); auto(); });
    auto();
  }
  document.querySelectorAll('form.email-cta').forEach(function (f) {
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      window.location.href = 'contact.html';
    });
  });
})();
