/**
 * Banast Free Audit Page Analytics
 * Specialized tracking for the free audit funnel
 */

(function() {
  'use strict';

  // State
  const state = {
    startTime: Date.now(),
    analysisStarted: null,
    analysisCompleted: false,
    agentTimings: {},
    formStarted: false,
    scrollDepth: 0,
  };

  // Utility: Track custom event with Plausible
  function trackEvent(eventName, props = {}) {
    if (window.plausible) {
      window.plausible(eventName, { props: { page: 'free-audit', ...props } });
      console.log(`📊 Tracked: ${eventName}`, props);
    }
  }

  // 1. FORM SUBMISSION TRACKING
  function setupFormTracking() {
    const form = document.getElementById('auditForm');
    const urlInput = document.getElementById('urlInput');
    const submitBtn = document.getElementById('submitAudit');

    if (urlInput) {
      // Track when user starts typing
      urlInput.addEventListener('input', () => {
        if (!state.formStarted) {
          state.formStarted = true;
          const timeToStart = Math.round((Date.now() - state.startTime) / 1000);
          trackEvent('Audit Form Started', { time_to_start: timeToStart });
        }
      }, { once: true });

      // Track focus
      urlInput.addEventListener('focus', () => {
        trackEvent('Audit Form Focused');
      }, { once: true });
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const url = urlInput.value;

        trackEvent('Audit Form Submitted', {
          has_url: !!url,
          url_length: url.length
        });

        // Track as goal conversion
        trackEvent('Goal: Free Audit Started');

        // Start analysis tracking
        startAnalysisTracking();
      });
    }
  }

  // 2. ANALYSIS PROGRESS TRACKING
  function startAnalysisTracking() {
    state.analysisStarted = Date.now();

    // Track analysis initiation
    trackEvent('Analysis Started', {
      time_to_submit: Math.round((state.analysisStarted - state.startTime) / 1000)
    });

    // Monitor each agent progress
    trackAgentProgress();
  }

  function trackAgentProgress() {
    const agents = [
      { id: 'problemAgent', name: 'Problem Agent' },
      { id: 'offerAgent', name: 'Offer Agent' },
      { id: 'growthAgent', name: 'Growth Agent' },
      { id: 'finalVerdict', name: 'Final Verdict' }
    ];

    agents.forEach((agent, index) => {
      // Use MutationObserver to detect when agent results appear
      const agentElement = document.getElementById(agent.id);
      if (!agentElement) return;

      const observer = new MutationObserver((mutations) => {
        const hasContent = agentElement.querySelector('.agent-analysis')?.textContent?.length > 0;

        if (hasContent && !state.agentTimings[agent.id]) {
          const completionTime = Date.now();
          state.agentTimings[agent.id] = completionTime;

          const timeFromStart = Math.round((completionTime - state.analysisStarted) / 1000);
          trackEvent('Agent Completed', {
            agent: agent.name,
            position: index + 1,
            time_seconds: timeFromStart
          });

          // Check if all agents completed
          if (Object.keys(state.agentTimings).length === agents.length) {
            completeAnalysis();
          }

          observer.disconnect();
        }
      });

      observer.observe(agentElement, {
        childList: true,
        subtree: true,
        characterData: true
      });
    });
  }

  function completeAnalysis() {
    if (state.analysisCompleted) return;
    state.analysisCompleted = true;

    const totalTime = Math.round((Date.now() - state.analysisStarted) / 1000);
    const sessionTime = Math.round((Date.now() - state.startTime) / 1000);

    trackEvent('Analysis Completed', {
      total_time: totalTime,
      session_time: sessionTime
    });

    // Track as major goal
    trackEvent('Goal: Audit Completed');

    // Track CTA visibility after completion
    setTimeout(() => {
      trackCTAEngagement();
    }, 1000);
  }

  // 3. CTA ENGAGEMENT TRACKING
  function trackCTAEngagement() {
    const bookingLink = document.querySelector('a[href*="calendly"], a[href*="calendar"]');
    const resultsSection = document.getElementById('results');

    if (bookingLink) {
      // Track when CTA becomes visible
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            trackEvent('Booking CTA Viewed', {
              after_analysis: state.analysisCompleted
            });
            observer.disconnect();
          }
        });
      }, { threshold: 0.5 });

      observer.observe(bookingLink);

      // Track CTA clicks
      bookingLink.addEventListener('click', () => {
        const timeOnPage = Math.round((Date.now() - state.startTime) / 1000);
        trackEvent('Booking CTA Clicked', {
          time_on_page: timeOnPage,
          analysis_completed: state.analysisCompleted
        });

        // Ultimate goal
        trackEvent('Goal: Booking Link Clicked');
      });
    }
  }

  // 4. SCROLL TRACKING
  function setupScrollTracking() {
    let maxScroll = 0;

    function checkScroll() {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollPercent = Math.min(100, Math.round((scrollTop / (documentHeight - windowHeight)) * 100));

      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;
        state.scrollDepth = maxScroll;

        // Track milestones
        [25, 50, 75, 100].forEach(threshold => {
          if (maxScroll >= threshold && maxScroll - 5 < threshold) {
            trackEvent('Audit Page Scroll', { depth: `${threshold}%` });
          }
        });
      }
    }

    window.addEventListener('scroll', debounce(checkScroll, 100));
  }

  // 5. ERROR & ABANDONMENT TRACKING
  function setupAbandonmentTracking() {
    // Track if user leaves before completing
    window.addEventListener('beforeunload', () => {
      const timeOnPage = Math.round((Date.now() - state.startTime) / 1000);

      if (state.analysisStarted && !state.analysisCompleted) {
        trackEvent('Analysis Abandoned', {
          time_in_analysis: Math.round((Date.now() - state.analysisStarted) / 1000),
          agents_completed: Object.keys(state.agentTimings).length
        });
      } else if (!state.formStarted) {
        trackEvent('Audit Page Bounce', {
          time_on_page: timeOnPage,
          scroll_depth: state.scrollDepth
        });
      }
    });

    // Track visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && state.analysisStarted && !state.analysisCompleted) {
        trackEvent('Analysis Tab Hidden', {
          agents_completed: Object.keys(state.agentTimings).length
        });
      }
    });
  }

  // 6. FAKE LOADING TRACKING
  function trackLoadingInteractions() {
    // Track if users interact with progress bars
    document.addEventListener('click', (e) => {
      if (e.target.closest('.progress-bar') || e.target.closest('.agent-card')) {
        if (state.analysisStarted && !state.analysisCompleted) {
          trackEvent('Loading Interaction', {
            element: e.target.closest('.agent-card') ? 'agent-card' : 'progress-bar'
          });
        }
      }
    });
  }

  // 7. PERFORMANCE TRACKING
  function trackPerformance() {
    if (window.performance && window.performance.timing) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const timing = window.performance.timing;
          const pageLoadTime = timing.loadEventEnd - timing.navigationStart;

          trackEvent('Audit Page Performance', {
            load_time_ms: pageLoadTime,
            interactive_ms: timing.domInteractive - timing.navigationStart
          });
        }, 0);
      });
    }
  }

  // Utility: Debounce
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

  // 8. INITIALIZATION
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    console.log('🚀 Free Audit Analytics initialized');

    // Track page view
    trackEvent('pageview', {
      path: '/free-audit',
      referrer: document.referrer || 'direct'
    });

    // Set up all tracking
    setupFormTracking();
    setupScrollTracking();
    setupAbandonmentTracking();
    trackLoadingInteractions();
    trackPerformance();

    // Track entry source
    const urlParams = new URLSearchParams(window.location.search);
    const source = urlParams.get('source') || urlParams.get('utm_source') || 'direct';
    if (source !== 'direct') {
      trackEvent('Audit Entry Source', { source });
    }
  }

  // Start
  init();

})();