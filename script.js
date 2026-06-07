(() => {
  'use strict';

  /* Utilities */
  const select = (selector, parent = document) => parent.querySelector(selector);
  const selectAll = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));

  /* DOM Elements */
  const header = document.getElementById('site-header');
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobile-nav');
  const navLinks = selectAll('.nav__link');
  const mobileLinks = selectAll('.mobile-nav__link');
  const animatedEls = selectAll('[data-animate]');
  const form = document.getElementById('contact-form');
  const submitBtn = document.getElementById('submit-btn');
  const formFeedback = document.getElementById('form-feedback');
  const statsSection = document.getElementById('hero-stats');
  const statNumbers = selectAll('.stat__number');

  /* NAV: sticky header on scroll */
  function handleScroll() {
    const scrolled = window.pageYOffset > 80;
    header.classList.toggle('scrolled', scrolled);
  }
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  /* Mobile Menu Toggle */
  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.classList.toggle('open');
    mobileNav.classList.toggle('open', isOpen);
    const expanded = isOpen ? 'true' : 'false';
    hamburger.setAttribute('aria-expanded', expanded);
    mobileNav.setAttribute('aria-hidden', (!isOpen).toString());
  });

  /* Close mobile menu on link click */
  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      mobileNav.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      mobileNav.setAttribute('aria-hidden', 'true');
    });
  });

  /* Smooth scroll accounting for sticky nav */
  function smoothScrollTo(hash) {
    const target = document.querySelector(hash);
    if (!target) return;
    const headerHeight = header.offsetHeight || 80;
    const targetTop = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 12;
    window.scrollTo({ top: targetTop, behavior: 'smooth' });
  }

  // Attach smooth scroll to all internal links
  const internalLinks = selectAll('a[href^="#"]');
  internalLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        smoothScrollTo(href);
      }
    });
  });

  /* IntersectionObserver for sections -> active nav links and reveal animations */
  const sections = selectAll('main > section, .section');
  const observerOptions = { root: null, rootMargin: '0px', threshold: 0.45 };

  // Highlight nav link based on section in view
  const navMap = {};
  navLinks.forEach(a => {
    const href = a.getAttribute('href');
    if (href && href.startsWith('#')) navMap[href] = a;
  });

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const id = entry.target.id ? `#${entry.target.id}` : null;
      if (entry.isIntersecting) {
        if (id && navMap[id]) {
          navLinks.forEach(n => n.classList.remove('active'));
          navMap[id].classList.add('active');
        }
      }
    });
  }, observerOptions);

  sections.forEach(sec => sectionObserver.observe(sec));

  // Reveal animations for elements with [data-animate]
  const revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { root: null, threshold: 0.12 });

  animatedEls.forEach(el => revealObserver.observe(el));

  /* Stats counter animation */
  let statsAnimated = false;
  function animateStats() {
    if (statsAnimated) return;
    const rect = statsSection.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom >= 0) {
      statsAnimated = true;
      statNumbers.forEach(el => {
        const targetRaw = el.getAttribute('data-target') || '0';
        // normalize numbers like "50+", "98%", "3x", "24/7"
        const numeric = parseFloat(targetRaw);
        if (!isFinite(numeric)) {
          // If non-numeric target provided, skip standard count; just fade-in text.
          el.classList.add('visible');
          return;
        }
        const target = numeric;
        const start = 0;
        const duration = 1200;
        const startTime = performance.now();
        function step(now) {
          const progress = Math.min((now - startTime) / duration, 1);
          const current = Math.round(progress * (target - start) + start);
          // format special suffixes if present
          if (targetRaw.includes('+')) el.textContent = `${current}+`;
          else if (targetRaw.includes('%')) el.textContent = `${current}%`;
          else if (targetRaw.toLowerCase().includes('x')) el.textContent = `${current}x`;
          else el.textContent = `${current}`;
          if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }
  }
  window.addEventListener('scroll', animateStats, { passive: true });
  // also run on load
  animateStats();

  /* Form handling: client-side validation + fetch submit to formsubmit.co */
  function showInlineError(fieldId, message) {
    const errEl = document.getElementById(`error-${fieldId}`);
    if (errEl) errEl.textContent = message;
  }
  function clearInlineErrors() {
    ['name','email','company','service','message'].forEach(id => showInlineError(id, ''));
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearInlineErrors();
    formFeedback.textContent = '';
    const fd = new FormData(form);
    const name = fd.get('name')?.trim();
    const email = fd.get('email')?.trim();
    const service = fd.get('service')?.trim();
    const message = fd.get('message')?.trim();

    let valid = true;
    if (!name) { showInlineError('name', 'Please enter your full name'); valid = false; }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) { showInlineError('email', 'Please enter a valid email'); valid = false; }
    if (!service) { showInlineError('service', 'Please select a service'); valid = false; }
    if (!message || message.length < 10) { showInlineError('message', 'Please describe your project (10+ characters)'); valid = false; }

    if (!valid) {
      formFeedback.textContent = 'Please fix the highlighted fields.';
      return;
    }

    // UI: loading state
    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Sending...';

    // Replace _next with actual current location to help FormSubmit, but keep hidden value as instructed
    fd.set('_next', window.location.href);

    try {
      const response = await fetch(form.action, {
        method: form.method,
        body: fd,
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        formFeedback.style.color = getComputedStyle(document.documentElement).getPropertyValue('--color-success') || '#10B981';
        formFeedback.textContent = "✓ Message sent! We'll be in touch within 24 hours.";
        form.reset();
      } else {
        // handle FormSubmit JSON error response gracefully
        formFeedback.style.color = 'var(--color-accent-light)';
        formFeedback.textContent = "Something went wrong. Please try again or email nexorawebofficial@gmail.com";
      }
    } catch (err) {
      formFeedback.style.color = 'var(--color-accent-light)';
      formFeedback.textContent = "Network error. Please try again or email nexorawebofficial@gmail.com";
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });

  /* Typing cursor: subtle blink implemented via CSS; optional typed text could be added here */
  // No global pollution: keep local.

  /* FAQ accordion functionality: accessible open/close with single-open behavior */
  (function setupFaqAccordion(){
    const faqItems = selectAll('.faq__item');
    if (!faqItems.length) return;

    faqItems.forEach(item => {
      const btn = select('.faq__question', item);
      const answer = select('.faq__answer', item);
      if (!btn || !answer) return;

      // ensure initial hidden state
      answer.setAttribute('hidden', '');

      btn.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        // close all
        faqItems.forEach(other => {
          other.classList.remove('open');
          const a = select('.faq__answer', other);
          const b = select('.faq__question', other);
          if (a) a.setAttribute('hidden', '');
          if (b) b.setAttribute('aria-expanded', 'false');
        });

        // toggle current
        if (!isOpen) {
          item.classList.add('open');
          answer.removeAttribute('hidden');
          btn.setAttribute('aria-expanded', 'true');
        } else {
          item.classList.remove('open');
          answer.setAttribute('hidden', '');
          btn.setAttribute('aria-expanded', 'false');
        }
      });

      // keyboard support
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); }
      });
    });
  })();

  // Sandbox removed: no sandbox menu initialization required.

  /* Active link update on manual scroll (finer granularity) */
  // Determine current section with largest intersection ratio
  const sectionObserverForActive = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const id = entry.target.id ? `#${entry.target.id}` : null;
      if (entry.isIntersecting && id && navMap[id]) {
        navLinks.forEach(n => n.classList.remove('active'));
        navMap[id].classList.add('active');
      }
    });
  }, { threshold: [0.5, 0.75] });
  sections.forEach(s => sectionObserverForActive.observe(s));

  /* Accessibility: close mobile menu with ESC */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hamburger.classList.remove('open');
      mobileNav.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      mobileNav.setAttribute('aria-hidden', 'true');
    }
  });

  /* Initial reveal on load for above-the-fold elements */
  document.addEventListener('DOMContentLoaded', () => {
    // reveal hero and header immediately
    const hero = document.getElementById('hero');
    if (hero) hero.classList.add('visible');

    // Chatbot functionality
    const chatbotToggle = document.getElementById('chatbot-toggle');
    const chatbotClose = document.getElementById('chatbot-close');
    const chatbotWindow = document.getElementById('chatbot-window');
    const chatbotForm = document.getElementById('chatbot-form');
    const chatbotInput = document.getElementById('chatbot-input');
    const chatbotMessages = document.getElementById('chatbot-messages');

    const chatbotResponses = {
      services: {
        keywords: ['service', 'services', 'offer', 'offering', 'what do you', 'can you'],
        response: '🚀 We specialize in Web Development, Web Design, SEO Optimization, Social Media Marketing, E-commerce Solutions, AI Automation, AI Chatbots, and Machine Learning. Which service interests you most?'
      },
      pricing: {
        keywords: ['price', 'pricing', 'cost', 'budget', 'how much', 'expensive'],
        response: '💰 Pricing varies by project scope. We offer flexible budgets from $500+ for small websites to $50,000+ for complex enterprise solutions. Every project starts with a free 30-minute discovery call where we discuss your budget and goals. Would you like to book one?'
      },
      contact: {
        keywords: ['contact', 'call', 'appointment', 'meeting', 'email', 'reach'],
        response: '📞 You can reach us at nexorawebofficial@gmail.com or scroll down to book a free discovery call directly. We respond within 24 hours!'
      },
      timeline: {
        keywords: ['how long', 'timeline', 'duration', 'days', 'weeks', 'months', 'when'],
        response: '⏱ Most websites take 4–8 weeks from kickoff to launch. Complex projects with AI integration may take longer. We\'ll provide a detailed timeline during your discovery call!'
      },
      ai: {
        keywords: ['ai', 'chatbot', 'automation', 'machine learning', 'ml'],
        response: '🤖 We build intelligent chatbots for lead qualification, custom AI automations to save time, and ML models for predictive analytics. Every AI solution is tailored to your business goals.'
      },
      portfolio: {
        keywords: ['portfolio', 'work', 'projects', 'examples', 'case study'],
        response: '⭐ Check out our portfolio section to see real projects we\'ve delivered: Best Printing LLC, Brunson Construction, and Patrick the Magician. Each showcases different expertise!'
      },
      default: {
        response: '👋 Thanks for reaching out! I can help with questions about our services, pricing, timelines, or anything else. Or, scroll down to book a free discovery call. What would you like to know?'
      }
    };

    if (chatbotToggle) {
      chatbotToggle.addEventListener('click', () => {
        const isOpen = !chatbotWindow.hidden;
        if (isOpen) {
          chatbotWindow.hidden = true;
          chatbotToggle.setAttribute('aria-expanded', 'false');
          chatbotToggle.setAttribute('aria-label', 'Open AI Chatbot');
        } else {
          chatbotWindow.hidden = false;
          chatbotToggle.setAttribute('aria-expanded', 'true');
          chatbotToggle.setAttribute('aria-label', 'Close AI Chatbot');
          chatbotInput.focus();
        }
      });
    }

    if (chatbotClose) {
      chatbotClose.addEventListener('click', () => {
        chatbotWindow.hidden = true;
        chatbotToggle.setAttribute('aria-expanded', 'false');
        chatbotToggle.setAttribute('aria-label', 'Open AI Chatbot');
        chatbotToggle.focus();
      });
    }

    function addChatbotMessage(text, isUser = false) {
      const messageDiv = document.createElement('div');
      messageDiv.className = `chatbot__message ${isUser ? 'chatbot__message--user' : 'chatbot__message--bot'}`;
      
      if (!isUser) {
        const avatar = document.createElement('div');
        avatar.className = 'chatbot__avatar';
        avatar.textContent = '🤖';
        messageDiv.appendChild(avatar);
      }

      const contentDiv = document.createElement('div');
      contentDiv.className = 'chatbot__content';
      const p = document.createElement('p');
      p.textContent = text;
      contentDiv.appendChild(p);
      messageDiv.appendChild(contentDiv);

      chatbotMessages.appendChild(messageDiv);
      chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }

    function getBotResponse(userMessage) {
      const lowerMessage = userMessage.toLowerCase();
      
      for (const [key, data] of Object.entries(chatbotResponses)) {
        if (key === 'default') continue;
        if (data.keywords && data.keywords.some(keyword => lowerMessage.includes(keyword))) {
          return data.response;
        }
      }
      
      return chatbotResponses.default.response;
    }

    if (chatbotForm) {
      chatbotForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const message = chatbotInput.value.trim();
        
        if (!message) return;

        addChatbotMessage(message, true);
        chatbotInput.value = '';

        setTimeout(() => {
          const response = getBotResponse(message);
          addChatbotMessage(response, false);
        }, 400);
      });
    }

    // Cookie consent behavior
    const cookieBanner = select('#cookie-consent');
    const acceptBtn = select('#cookie-accept');
    const declineBtn = select('#cookie-decline');
    try {
      const accepted = localStorage.getItem('nexora_cookie_accepted');
      if (!accepted && cookieBanner) cookieBanner.removeAttribute('hidden');
      if (accepted && cookieBanner) cookieBanner.setAttribute('hidden', '');
    } catch (e) { /* ignore storage errors */ }

    if (acceptBtn && cookieBanner) {
      acceptBtn.addEventListener('click', () => {
        try { localStorage.setItem('nexora_cookie_accepted', 'true'); } catch(e){}
        cookieBanner.setAttribute('hidden', '');
      });
    }
    if (declineBtn && cookieBanner) {
      declineBtn.addEventListener('click', () => {
        try { localStorage.setItem('nexora_cookie_accepted', 'false'); } catch(e){}
        cookieBanner.setAttribute('hidden', '');
      });
    }
  });

  // End of IIFE
})();