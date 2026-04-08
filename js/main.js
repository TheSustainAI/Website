/* ============================================================
   SustainAI — Main JavaScript
   Hero canvas, scroll reveals, mini-demo, counters, modals
   ============================================================ */

(function () {
  'use strict';

  // --- Reduced motion check ---
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================================================
     1. HERO CANVAS — Constellation Particle Animation
     ============================================================ */
  const canvas = document.getElementById('heroCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    let w, h;
    const PARTICLE_COUNT = 80;
    const CONNECTION_DIST = 120;
    const CENTER_BIAS = 0.3; // How much particles cluster toward center

    function resize() {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    }

    function createParticle() {
      // Bias toward center using gaussian-like distribution
      const useCenterBias = Math.random() < CENTER_BIAS;
      let x, y;
      if (useCenterBias) {
        x = w / 2 + (Math.random() - 0.5) * w * 0.4;
        y = h / 2 + (Math.random() - 0.5) * h * 0.4;
      } else {
        x = Math.random() * w;
        y = Math.random() * h;
      }
      return {
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: 2 + Math.random() * 3,
        opacity: 0.1 + Math.random() * 0.3,
      };
    }

    function initParticles() {
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(createParticle());
      }
    }

    function drawParticles() {
      ctx.clearRect(0, 0, w, h);

      // Draw connections first
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DIST) {
            const alpha = (1 - dist / CONNECTION_DIST) * 0.08;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(77, 184, 102, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // Draw particles
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(77, 184, 102, ${p.opacity})`;
        ctx.fill();
      }
    }

    function updateParticles() {
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        // Soft boundary wrapping
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        // Gentle drift variation
        p.vx += (Math.random() - 0.5) * 0.01;
        p.vy += (Math.random() - 0.5) * 0.01;
        p.vx *= 0.999;
        p.vy *= 0.999;
      }
    }

    let animFrame;
    function animate() {
      updateParticles();
      drawParticles();
      animFrame = requestAnimationFrame(animate);
    }

    resize();
    initParticles();

    if (!prefersReducedMotion) {
      animate();
    } else {
      drawParticles(); // Static frame
    }

    window.addEventListener('resize', () => {
      resize();
    });
  }

  /* ============================================================
     2. SCROLL REVEALS — Intersection Observer
     ============================================================ */
  const revealElements = document.querySelectorAll('.reveal');

  if (revealElements.length > 0) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    revealElements.forEach((el) => revealObserver.observe(el));
  }

  /* ============================================================
     3. NAVIGATION — Scroll state, hamburger, smooth scroll
     ============================================================ */
  const nav = document.getElementById('nav');
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');

  // Nav scroll state
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    if (scrollY > 20) {
      nav.classList.add('nav--scrolled');
    } else {
      nav.classList.remove('nav--scrolled');
    }
    lastScroll = scrollY;
  }, { passive: true });

  // Hamburger toggle
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const isActive = hamburger.classList.toggle('active');
      mobileMenu.classList.toggle('active');
      hamburger.setAttribute('aria-expanded', isActive);
      document.body.style.overflow = isActive ? 'hidden' : '';
    });

    // Close mobile menu on link click
    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        mobileMenu.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        const top = target.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* ============================================================
     4. COUNTER ANIMATIONS
     ============================================================ */
  const counters = document.querySelectorAll('[data-count]');

  function animateCounter(el) {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const prefix = el.dataset.prefix || '';
    const decimals = parseInt(el.dataset.decimals) || 0;
    const duration = 1500;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = target * eased;

      if (decimals > 0) {
        el.textContent = prefix + current.toFixed(decimals) + suffix;
      } else {
        el.textContent = prefix + Math.floor(current).toLocaleString() + suffix;
      }

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        if (decimals > 0) {
          el.textContent = prefix + target.toFixed(decimals) + suffix;
        } else {
          el.textContent = prefix + target.toLocaleString() + suffix;
        }
      }
    }

    requestAnimationFrame(update);
  }

  if (counters.length > 0) {
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach((el) => counterObserver.observe(el));
  }

  /* ============================================================
     5. MINI-DEMO — Auto-play Loop
     ============================================================ */
  const demoScreen = document.getElementById('demoScreen');

  if (demoScreen) {
    const kpiConductivity = document.getElementById('kpiConductivity');
    const kpiPh = document.getElementById('kpiPh');
    const kpiFlow = document.getElementById('kpiFlow');
    const bars = document.querySelectorAll('.demo__bar');
    const logAlert = document.getElementById('logAlert');
    const logResponse = document.getElementById('logResponse');
    const logSuccess = document.getElementById('logSuccess');
    const demoTime = document.getElementById('demoTime');

    const NORMAL_BARS = [55, 48, 60, 52, 58, 50, 54, 56];
    const SPIKE_BARS = [55, 48, 60, 52, 58, 50, 54, 92];
    const AI_RESPONSE = 'Root cause: fertilizer runoff. Close east valve. Dispatch field check. File report.';

    let demoInterval = null;
    let isVisible = false;

    function resetDemo() {
      kpiConductivity.textContent = '840 µS/cm';
      kpiConductivity.className = 'demo__kpi-value';
      kpiPh.textContent = '7.2';
      kpiPh.className = 'demo__kpi-value';
      kpiFlow.textContent = '120 GPM';
      bars.forEach((bar, i) => {
        bar.style.height = NORMAL_BARS[i] + '%';
        bar.classList.remove('demo__bar--danger');
      });
      logAlert.classList.remove('visible');
      logResponse.classList.remove('visible');
      logResponse.textContent = '';
      logSuccess.classList.remove('visible');
      if (demoTime) demoTime.textContent = '05:34:12';
    }

    function typeText(el, text, speed, callback) {
      let i = 0;
      el.textContent = '';
      el.classList.add('visible');
      function type() {
        if (i < text.length) {
          el.textContent += text[i];
          i++;
          setTimeout(type, speed);
        } else if (callback) {
          callback();
        }
      }
      type();
    }

    function runDemoSequence() {
      resetDemo();

      // Gentle sensor fluctuation during normal state
      const flicker = setInterval(() => {
        const c = 830 + Math.floor(Math.random() * 20);
        kpiConductivity.textContent = c + ' µS/cm';
        const ph = (7.1 + Math.random() * 0.2).toFixed(1);
        kpiPh.textContent = ph;
        const flow = 118 + Math.floor(Math.random() * 5);
        kpiFlow.textContent = flow + ' GPM';
      }, 600);

      // (3s) Conductivity spikes
      setTimeout(() => {
        clearInterval(flicker);
        kpiConductivity.textContent = '1180 µS/cm';
        kpiConductivity.className = 'demo__kpi-value demo__kpi-value--danger';
        bars[7].style.height = SPIKE_BARS[7] + '%';
        bars[7].classList.add('demo__bar--danger');
        if (demoTime) demoTime.textContent = '05:34:15';
      }, 3000);

      // (4s) pH drops
      setTimeout(() => {
        kpiPh.textContent = '6.4';
        kpiPh.className = 'demo__kpi-value demo__kpi-value--warning';
        if (demoTime) demoTime.textContent = '05:34:16';
      }, 4000);

      // (5s) Alert appears
      setTimeout(() => {
        logAlert.classList.add('visible');
        if (demoTime) demoTime.textContent = '05:34:17';
      }, 5000);

      // (6.5s) AI response types out
      setTimeout(() => {
        if (demoTime) demoTime.textContent = '05:34:18';
        typeText(logResponse, AI_RESPONSE, 25, null);
      }, 6500);

      // (9s) Action badge
      setTimeout(() => {
        logSuccess.classList.add('visible');
        if (demoTime) demoTime.textContent = '05:34:22';
      }, 9000);

      // (15s) Reset + pause before next loop
      setTimeout(() => {
        resetDemo();
      }, 15000);
    }

    // Observe demo to start/stop
    const demoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            isVisible = true;
            runDemoSequence();
            demoInterval = setInterval(runDemoSequence, 18000);
          } else if (!entry.isIntersecting && isVisible) {
            isVisible = false;
            clearInterval(demoInterval);
            resetDemo();
          }
        });
      },
      { threshold: 0.3 }
    );

    demoObserver.observe(demoScreen);
  }

  /* ============================================================
     6. MODALS + FORM GATE
     ============================================================ */
  const contactModal = document.getElementById('contactModal');
  const contactFormEl = document.getElementById('contactFormEl');
  const contactFormDiv = document.getElementById('contactForm');
  const contactSuccessDiv = document.getElementById('contactSuccess');
  const modalTitle = document.getElementById('contactTitle');
  const modalSubtitle = contactModal ? contactModal.querySelector('.modal__subtitle') : null;

  // --- Gate state ---
  const GATE_KEY = 'sustainai_form_completed';
  let pendingRedirect = null; // URL to redirect after form submission

  function hasCompletedForm() {
    try { return localStorage.getItem(GATE_KEY) === '1'; } catch { return false; }
  }

  function markFormCompleted() {
    try { localStorage.setItem(GATE_KEY, '1'); } catch {}
  }

  // --- Gated pages (any link containing these is gated) ---
  const GATED_PATHS = ['demo.html', 'story.html', 'story2.html'];

  function isGatedLink(href) {
    if (!href) return false;
    return GATED_PATHS.some(path => href.includes(path));
  }

  // --- Open modal helper ---
  function openContactModal(options = {}) {
    if (!contactModal) return;

    // Reset form state (show form, hide success)
    if (contactFormDiv) contactFormDiv.classList.remove('hidden');
    if (contactSuccessDiv) contactSuccessDiv.classList.add('hidden');

    // Reset submit button
    const submitBtn = document.getElementById('contactSubmit');
    if (submitBtn) {
      submitBtn.textContent = 'Send Message';
      submitBtn.disabled = false;
    }

    // Update title/subtitle based on context
    if (options.gated) {
      if (modalTitle) modalTitle.textContent = 'Quick intro before you continue.';
      if (modalSubtitle) modalSubtitle.textContent = 'Tell us a bit about yourself and we\'ll take you right there.';
    } else {
      if (modalTitle) modalTitle.textContent = 'Let\'s talk.';
      if (modalSubtitle) modalSubtitle.textContent = 'Tell us what you\'re working on. We\'ll get back within 24 hours.';
    }

    contactModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Focus first input
    setTimeout(() => {
      const firstInput = contactModal.querySelector('input:not([type="hidden"]):not([type="checkbox"])');
      if (firstInput) firstInput.focus();
    }, 300);
  }

  // --- Open modal triggers (direct "Talk to Us" buttons) ---
  document.querySelectorAll('[data-modal="contact"]').forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      pendingRedirect = null;
      openContactModal({ gated: false });
    });
  });

  // --- Gate: intercept ALL links on the page that point to gated pages ---
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!isGatedLink(href)) return;

    // Already completed the form — let them through
    if (hasCompletedForm()) return;

    // Block navigation, show form
    e.preventDefault();
    pendingRedirect = href;
    openContactModal({ gated: true });
  });

  // Close modal
  document.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', () => {
      closeAllModals();
    });
  });

  // Close on overlay click
  document.querySelectorAll('.modal-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeAllModals();
      }
    });
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllModals();
    }
  });

  function closeAllModals() {
    document.querySelectorAll('.modal-overlay.active').forEach((m) => {
      m.classList.remove('active');
    });
    document.body.style.overflow = '';
    pendingRedirect = null;
  }

  /* ============================================================
     7. FORM SUBMISSION — Web3Forms + Gate Redirect
     ============================================================ */
  if (contactFormEl) {
    contactFormEl.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('contactSubmit');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Sending...';
      submitBtn.disabled = true;

      try {
        const formData = new FormData(contactFormEl);

        // If this submission came from a gated link, tag it
        if (pendingRedirect) {
          formData.append('intended_page', pendingRedirect);
        }

        const response = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          body: formData,
        });
        const result = await response.json();

        if (result.success) {
          // Mark form as completed so user isn't gated again
          markFormCompleted();

          if (pendingRedirect) {
            // Show brief success then redirect
            contactFormDiv.classList.add('hidden');
            contactSuccessDiv.classList.remove('hidden');

            // Update success message for gated flow
            const successTitle = contactSuccessDiv.querySelector('.form__success-title');
            const successText = contactSuccessDiv.querySelector('.form__success-text');
            if (successTitle) successTitle.textContent = 'Thanks! Redirecting...';
            if (successText) successText.textContent = 'Taking you there now.';

            const redirectUrl = pendingRedirect;
            pendingRedirect = null;

            setTimeout(() => {
              window.location.href = redirectUrl;
            }, 1200);
          } else {
            // Normal form submission — show success state
            contactFormDiv.classList.add('hidden');
            contactSuccessDiv.classList.remove('hidden');

            // Reset success message to default
            const successTitle = contactSuccessDiv.querySelector('.form__success-title');
            const successText = contactSuccessDiv.querySelector('.form__success-text');
            if (successTitle) successTitle.textContent = 'Message sent.';
            if (successText) successText.textContent = 'We\'ll get back to you within 24 hours.';
          }
        } else {
          submitBtn.textContent = 'Error — Try Again';
          submitBtn.disabled = false;
          setTimeout(() => {
            submitBtn.textContent = originalText;
          }, 3000);
        }
      } catch (err) {
        submitBtn.textContent = 'Error — Try Again';
        submitBtn.disabled = false;
        setTimeout(() => {
          submitBtn.textContent = originalText;
        }, 3000);
      }
    });
  }

})();
