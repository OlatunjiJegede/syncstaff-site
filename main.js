// SyncStaff v2 — interactions
(function () {
  var mq = window.matchMedia('(max-width: 720px)');

  // mega menu (desktop hover + click, mobile accordion)
  document.querySelectorAll('.menu > li.has-mega').forEach(function (li) {
    var btn = li.querySelector('.menu-btn');
    function closeAll(except) {
      document.querySelectorAll('.menu > li.open').forEach(function (o) {
        if (o !== except) o.classList.remove('open');
      });
    }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var willOpen = !li.classList.contains('open');
      closeAll(li);
      li.classList.toggle('open', willOpen);
      btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    });
    li.addEventListener('mouseenter', function () { if (!mq.matches) { closeAll(li); li.classList.add('open'); } });
    li.addEventListener('mouseleave', function () { if (!mq.matches) li.classList.remove('open'); });
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
  document.querySelectorAll('form.email-cta').forEach(function (f) {
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      window.location.href = 'https://hrmanagementsystem1.vercel.app/login';
    });
  });
})();
