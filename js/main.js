/**
 * SustainAI — Main JavaScript
 * Apple-style scroll animations with parallax
 */
(function () {
  // Page load reveal
  document.body.classList.remove('loading');
  document.body.classList.add('loaded');

  // DOM references
  var nav = document.getElementById('nav');
  var stt = document.getElementById('scrollTop');
  var menuBtn = document.getElementById('menuBtn');
  var navMenu = document.getElementById('navMenu');

  // Active nav link tracking
  var navLinks = nav.querySelectorAll('.nk');
  var sections = [];
  navLinks.forEach(function (l) {
    var h = l.getAttribute('href');
    if (h && h.charAt(0) === '#') {
      var s = document.getElementById(h.substring(1));
      if (s) sections.push({ el: s, link: l });
    }
  });

  // ─── Apple-style scroll reveal system ───
  // Observe all scroll-reveal elements including variant classes
  var revealSelectors = '.sr, .sr-scale, .sr-left, .sr-right';
  var revealObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('vis');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.05, rootMargin: '0px 0px -80px 0px' }
  );
  document.querySelectorAll(revealSelectors).forEach(function (el) {
    revealObserver.observe(el);
  });

  // ─── Parallax on scroll ───
  var parallaxEls = document.querySelectorAll('.parallax');
  var heroSection = document.querySelector('.hero');

  // ─── Debounced scroll handler with parallax ───
  var ticking = false;
  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(function () {
        var sy = window.scrollY;
        var wh = window.innerHeight;

        // Nav background
        nav.classList.toggle('scrolled', sy > 30);
        if (stt) stt.classList.toggle('vis', sy > 600);

        // Active nav link
        sections.forEach(function (s) {
          var r = s.el.getBoundingClientRect();
          s.link.classList.toggle('active', r.top <= 120 && r.bottom > 120);
        });

        // Hero parallax — content fades and scales as you scroll past
        if (heroSection) {
          var heroH = heroSection.offsetHeight;
          var heroProgress = Math.min(sy / heroH, 1);
          var heroContent = heroSection.querySelector('.hc');
          if (heroContent) {
            heroContent.style.transform =
              'translateY(' + (heroProgress * 80) + 'px) scale(' + (1 - heroProgress * 0.08) + ')';
            heroContent.style.opacity = 1 - heroProgress * 1.2;
          }
        }

        // Parallax elements float at different speeds
        parallaxEls.forEach(function (el) {
          var speed = parseFloat(el.getAttribute('data-speed') || '0.15');
          var rect = el.getBoundingClientRect();
          var center = rect.top + rect.height / 2 - wh / 2;
          el.style.transform = 'translateY(' + (center * speed * -1) + 'px)';
        });

        ticking = false;
      });
      ticking = true;
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  // ─── Scroll to top ───
  if (stt)
    stt.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

  // ─── Hamburger menu ───
  if (menuBtn && navMenu) {
    menuBtn.addEventListener('click', function () {
      var open = navMenu.classList.toggle('open');
      menuBtn.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    navMenu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        navMenu.classList.remove('open');
        menuBtn.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.setAttribute('aria-label', 'Open menu');
        document.body.style.overflow = '';
      });
    });
  }

  // ─── Dynamic copyright ───
  var c = document.getElementById('copyright');
  if (c) c.textContent = '\u00A9 ' + new Date().getFullYear() + ' SustainAI. All rights reserved.';

  // ─── Contact form modal ───
  var modal = document.getElementById('contactModal');
  var ctaBtn = document.getElementById('ctaBtn');
  var modalClose = document.getElementById('modalClose');
  var contactForm = document.getElementById('contactForm');
  var cfStatus = document.getElementById('cf-status');
  var cfSubmit = document.getElementById('cf-submit');

  function openModal() {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (ctaBtn) ctaBtn.addEventListener('click', openModal);

  document.querySelectorAll('.nc').forEach(function (b) {
    if (b.getAttribute('href') === '#cta')
      b.addEventListener('click', function (e) {
        e.preventDefault();
        openModal();
      });
  });

  if (modalClose) modalClose.addEventListener('click', closeModal);

  if (modal)
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });

  // Close modal on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal && modal.classList.contains('open')) {
      closeModal();
    }
  });

  // ─── Form submission → POST /api/contact ───
  if (contactForm)
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      cfSubmit.disabled = true;
      cfSubmit.innerHTML = '<span class="cf-spinner"></span>Sending...';
      cfStatus.className = 'cf-status';
      cfStatus.textContent = '';

      var data = {
        access_key: '7e476710-fc59-46ee-a995-93f49b2444c0',
        subject: 'New contact from SustainAI website',
        from_name: 'SustainAI Website',
        name: document.getElementById('cf-name').value,
        email: document.getElementById('cf-email').value,
        organization: document.getElementById('cf-org').value,
        message: document.getElementById('cf-msg').value,
      };

      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data),
      })
        .then(function (r) {
          return r.json();
        })
        .then(function (res) {
          if (res.success) {
            cfStatus.className = 'cf-status success';
            cfStatus.textContent = 'Thank you! We will be in touch soon.';
            contactForm.reset();
          } else {
            cfStatus.className = 'cf-status error';
            cfStatus.textContent = res.message || 'Something went wrong. Please try again.';
          }
        })
        .catch(function () {
          cfStatus.className = 'cf-status error';
          cfStatus.textContent = 'Network error. Please try again or email team@sustain-ai.net';
        })
        .finally(function () {
          cfSubmit.disabled = false;
          cfSubmit.innerHTML = 'Send Message';
        });
    });
})();
