/**
 * Banast Analytics Tracking System
 * Enhanced tracking for Plausible Analytics
 */

(function() {
  'use strict';

  // Configuration
  const config = {
    scrollThresholds: [25, 50, 75, 100],
    scrollDebounceMs: 100,
    sectionViewThreshold: 0.5, // 50% visible
    engagementTimeMs: 3000, // 3 seconds to count as engaged
  };

  // State
  const state = {
    maxScrollDepth: 0,
    scrolledThresholds: new Set(),
    viewedSections: new Set(),
    startTime: Date.now(),
    isEngaged: false,
    gcSectionTime: 0,
    gcSectionEntered: null,
    flowAnimationViewed: false,
  };

  // Utility: Debounce function
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Utility: Track custom event with Plausible
  function trackEvent(eventName, props = {}) {
    if (window.plausible) {
      window.plausible(eventName, { props });
      console.log(`📊 Tracked: ${eventName}`, props);
    }
  }

  // 1. SCROLL DEPTH TRACKING
  function calculateScrollDepth() {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollableHeight = documentHeight - windowHeight;

    if (scrollableHeight <= 0) return 100;

    const scrollPercent = Math.min(100, Math.round((scrollTop / scrollableHeight) * 100));
    return scrollPercent;
  }

  function trackScrollDepth() {
    const currentDepth = calculateScrollDepth();

    // Update max scroll depth
    if (currentDepth > state.maxScrollDepth) {
      state.maxScrollDepth = currentDepth;
    }

    // Check thresholds
    config.scrollThresholds.forEach(threshold => {
      if (currentDepth >= threshold && !state.scrolledThresholds.has(threshold)) {
        state.scrolledThresholds.add(threshold);
        trackEvent('Scroll Depth', { depth: `${threshold}%` });

        // Special event for page completion
        if (threshold === 100) {
          const timeOnPage = Math.round((Date.now() - state.startTime) / 1000);
          trackEvent('Page Completed', { time_seconds: timeOnPage });
        }
      }
    });
  }

  // 2. SECTION VISIBILITY TRACKING
  function setupSectionTracking() {
    const sections = [
      { id: 'hero', name: 'Hero Section', element: document.querySelector('.hero') },
      { id: 'golden-circle', name: 'Golden Circle', element: document.querySelector('.gc-section') },
      { id: 'flow', name: 'Flow Diagram', element: document.querySelector('.flow-section') },
      { id: 'personas', name: 'Personas', element: document.querySelector('.persona-section') },
      { id: 'cta', name: 'CTA Section', element: document.querySelector('.cta-section') },
    ];

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const section = sections.find(s => s.element === entry.target);
        if (!section) return;

        if (entry.isIntersecting && !state.viewedSections.has(section.id)) {
          state.viewedSections.add(section.id);
          const timeOnPage = Math.round((Date.now() - state.startTime) / 1000);
          trackEvent('Section Viewed', {
            section: section.name,
            time_to_view: timeOnPage
          });

          // Special handling for Golden Circle
          if (section.id === 'golden-circle') {
            state.gcSectionEntered = Date.now();
          }

          // Special handling for Flow Diagram
          if (section.id === 'flow' && !state.flowAnimationViewed) {
            state.flowAnimationViewed = true;
            trackEvent('Flow Animation', { action: 'viewed' });
          }
        }

        // Track Golden Circle exit to measure engagement time
        if (section.id === 'golden-circle' && !entry.isIntersecting && state.gcSectionEntered) {
          const engagementTime = Math.round((Date.now() - state.gcSectionEntered) / 1000);
          if (engagementTime > 2) {
            trackEvent('Golden Circle Engagement', {
              time_seconds: engagementTime
            });
          }
          state.gcSectionEntered = null;
        }
      });
    }, {
      threshold: config.sectionViewThreshold
    });

    sections.forEach(section => {
      if (section.element) {
        observer.observe(section.element);
      }
    });
  }

  // 3. CTA CLICK TRACKING
  function setupCTATracking() {
    // Nav CTA
    const navCTA = document.querySelector('.nav-cta');
    if (navCTA) {
      navCTA.addEventListener('click', () => {
        trackEvent('CTA Click', { location: 'navigation', text: 'Free Audit' });
      });
    }

    // Hero CTA
    const heroCTA = document.querySelector('.hero-cta-secondary');
    if (heroCTA) {
      heroCTA.addEventListener('click', () => {
        trackEvent('CTA Click', { location: 'hero', text: 'Free Audit' });
      });
    }

    // Alternative CTA
    const alternativeCTA = document.querySelector('.cta-alternative');
    if (alternativeCTA) {
      alternativeCTA.addEventListener('click', () => {
        trackEvent('CTA Click', { location: 'alternative', text: 'Free Audit' });
      });
    }

    // Email form tracking
    const emailForm = document.getElementById('emailForm');
    const emailInput = emailForm?.querySelector('input[type="email"]');

    if (emailInput) {
      // Track when user starts typing
      emailInput.addEventListener('focus', () => {
        trackEvent('Email Form', { action: 'started' });
      }, { once: true });

      // Track form submission
      if (emailForm) {
        const originalSubmitHandler = emailForm.onsubmit;
        emailForm.addEventListener('submit', (e) => {
          trackEvent('Email Form', { action: 'submitted' });
          // Track as goal conversion
          trackEvent('Goal: Email Signup');
        });
      }
    }
  }

  // 4. ENGAGEMENT TRACKING
  function trackEngagement() {
    // Track initial page engagement after 3 seconds
    setTimeout(() => {
      if (!state.isEngaged) {
        state.isEngaged = true;
        trackEvent('Page Engaged');
      }
    }, config.engagementTimeMs);

    // Track time to first scroll
    let firstScrollTracked = false;
    window.addEventListener('scroll', () => {
      if (!firstScrollTracked && window.pageYOffset > 100) {
        firstScrollTracked = true;
        const timeToScroll = Math.round((Date.now() - state.startTime) / 1000);
        trackEvent('First Scroll', { time_seconds: timeToScroll });
      }
    }, { once: true });
  }

  // 5. GOLDEN CIRCLE INTERACTION TRACKING
  function trackGoldenCircleProgress() {
    // Track which phase user reached
    const gcSection = document.querySelector('.gc-section');
    if (!gcSection) return;

    let maxPhase = 0;
    window.addEventListener('scroll', debounce(() => {
      // Check if we're in the Golden Circle section
      const rect = gcSection.getBoundingClientRect();
      if (rect.top > window.innerHeight || rect.bottom < 0) return;

      // Get current phase from active dots
      const activeDots = document.querySelectorAll('.gc-dot.active');
      const currentPhase = activeDots.length;

      if (currentPhase > maxPhase) {
        maxPhase = currentPhase;
        const phaseNames = ['Core', 'Actions', 'Transition', 'Modules'];
        if (phaseNames[currentPhase - 1]) {
          trackEvent('Golden Circle Phase', {
            phase: phaseNames[currentPhase - 1],
            number: currentPhase
          });
        }
      }
    }, 200));
  }

  // 6. PERFORMANCE TRACKING
  function trackPerformance() {
    // Use Performance API if available
    if (window.performance && window.performance.timing) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const timing = window.performance.timing;
          const pageLoadTime = timing.loadEventEnd - timing.navigationStart;
          const domReadyTime = timing.domContentLoadedEventEnd - timing.navigationStart;
          const timeToInteractive = timing.domInteractive - timing.navigationStart;

          if (pageLoadTime > 0) {
            trackEvent('Performance', {
              page_load_ms: pageLoadTime,
              dom_ready_ms: domReadyTime,
              interactive_ms: timeToInteractive
            });
          }
        }, 0);
      });
    }
  }

  // 7. EXIT INTENT & SESSION END
  function trackSessionEnd() {
    // Track when user is about to leave
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        const sessionDuration = Math.round((Date.now() - state.startTime) / 1000);
        trackEvent('Session Paused', {
          duration_seconds: sessionDuration,
          max_scroll_depth: state.maxScrollDepth,
          sections_viewed: state.viewedSections.size
        });
      }
    });

    // Track bounce rate (leaving without interaction)
    window.addEventListener('beforeunload', () => {
      if (!state.isEngaged && state.maxScrollDepth < 25) {
        trackEvent('Bounce', {
          time_on_page: Math.round((Date.now() - state.startTime) / 1000)
        });
      }
    });
  }

  // 8. INITIALIZE
  function init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    console.log('🚀 Banast Analytics initialized');

    // Set up all tracking
    setupSectionTracking();
    setupCTATracking();
    trackEngagement();
    trackGoldenCircleProgress();
    trackPerformance();
    trackSessionEnd();

    // Set up scroll tracking with debounce
    const debouncedScrollTracking = debounce(trackScrollDepth, config.scrollDebounceMs);
    window.addEventListener('scroll', debouncedScrollTracking);

    // Initial scroll depth check
    trackScrollDepth();

    // Track page view with custom properties
    trackEvent('pageview', {
      path: window.location.pathname,
      referrer: document.referrer || 'direct'
    });
  }

  // Start initialization
  init();

})();