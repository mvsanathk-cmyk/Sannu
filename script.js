/**
 * Portfolio Interactivity & Navigation Controller
 * - Left Vertical Pixel Art Navigation (ScrollSpy, keyboard focus, mobile drawer)
 * - Night Mode Toggle with CSS Media Query detection and persistence
 */

document.addEventListener('DOMContentLoaded', () => {
  /* ------------------------------------------------------------------------
     1. THEME CONTROLLER (NATIVE MEDIA QUERY + PERSISTENCE)
     ------------------------------------------------------------------------ */
  const desktopThemeToggle = document.getElementById('theme-toggle');
  const mobileThemeToggle = document.getElementById('mobile-theme-toggle');
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const getActiveTheme = () => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return mediaQuery.matches ? 'dark' : 'light';
  };

  const syncThemeButtons = (isDark) => {
    const label = isDark ? 'Switch to light mode' : 'Switch to night mode';
    const pressed = isDark ? 'true' : 'false';

    if (desktopThemeToggle) {
      desktopThemeToggle.setAttribute('aria-pressed', pressed);
      desktopThemeToggle.setAttribute('aria-label', label);
    }
    if (mobileThemeToggle) {
      mobileThemeToggle.setAttribute('aria-pressed', pressed);
      mobileThemeToggle.setAttribute('aria-label', label);
      const icon = mobileThemeToggle.querySelector('.btn-theme-icon');
      if (icon) {
        icon.textContent = isDark ? '☀' : '☾';
      }
    }
  };

  const applyTheme = (theme, persist = false) => {
    if (persist) {
      localStorage.setItem('theme', theme);
      document.documentElement.setAttribute('data-theme', theme);
    } else {
      const saved = localStorage.getItem('theme');
      if (saved) {
        document.documentElement.setAttribute('data-theme', saved);
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
    }

    const isDark = (document.documentElement.getAttribute('data-theme') === 'dark') ||
                   (!document.documentElement.hasAttribute('data-theme') && mediaQuery.matches);
    syncThemeButtons(isDark);
  };

  // Toggle Action Handler
  const toggleTheme = () => {
    const current = document.documentElement.getAttribute('data-theme') || (mediaQuery.matches ? 'dark' : 'light');
    const target = current === 'dark' ? 'light' : 'dark';
    applyTheme(target, true);
  };

  if (desktopThemeToggle) desktopThemeToggle.addEventListener('click', toggleTheme);
  if (mobileThemeToggle) mobileThemeToggle.addEventListener('click', toggleTheme);

  // Initialize theme
  const initialSaved = localStorage.getItem('theme');
  if (initialSaved) {
    applyTheme(initialSaved, true);
  } else {
    applyTheme(getActiveTheme(), false);
  }

  // Follow browser theme if no manual lock
  mediaQuery.addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      applyTheme(e.matches ? 'dark' : 'light', false);
    }
  });

  /* ------------------------------------------------------------------------
     2. MOBILE SIDEBAR DRAWER CONTROLLER
     ------------------------------------------------------------------------ */
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
  const sidebarBackdrop = document.getElementById('sidebar-backdrop');
  const body = document.body;

  const openSidebar = () => {
    body.classList.add('sidebar-open');
    if (mobileMenuBtn) mobileMenuBtn.setAttribute('aria-expanded', 'true');
    if (sidebarCloseBtn) sidebarCloseBtn.focus();
  };

  const closeSidebar = () => {
    body.classList.remove('sidebar-open');
    if (mobileMenuBtn) {
      mobileMenuBtn.setAttribute('aria-expanded', 'false');
      mobileMenuBtn.focus();
    }
  };

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
      const isOpen = body.classList.contains('sidebar-open');
      isOpen ? closeSidebar() : openSidebar();
    });
  }

  if (sidebarCloseBtn) sidebarCloseBtn.addEventListener('click', closeSidebar);
  if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', closeSidebar);

  // Close on Escape key press
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && body.classList.contains('sidebar-open')) {
      closeSidebar();
    }
  });

  /* ------------------------------------------------------------------------
     3. VERTICAL NAVIGATION & SCROLLSPY
     ------------------------------------------------------------------------ */
  const navLinks = Array.from(document.querySelectorAll('.pixel-nav-link'));
  const sectionIds = ['hero', 'about', 'skills', 'timeline', 'projects', 'highlight', 'testimonials', 'chat', 'contact'];
  const sections = sectionIds
    .map(id => document.getElementById(id))
    .filter(Boolean);

  // Function to set active link
  const setActiveLink = (targetId) => {
    // Map highlight section to projects nav item so navigation stays active
    const activeTarget = targetId === 'highlight' ? 'projects' : targetId;
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      const isMatch = href === `#${activeTarget}`;
      if (isMatch) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
      }
    });
  };

  // Close drawer on link click and set active
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      const targetId = link.getAttribute('href').replace('#', '');
      setActiveLink(targetId);
      if (body.classList.contains('sidebar-open')) {
        closeSidebar();
      }
    });
  });

  // IntersectionObserver for responsive ScrollSpy
  if ('IntersectionObserver' in window && sections.length > 0) {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0
    };

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveLink(entry.target.id);
        }
      });
    }, observerOptions);

    sections.forEach(sec => sectionObserver.observe(sec));
  }

  /* ------------------------------------------------------------------------
     4. PROJECT DETAIL MODALS & THUMBNAIL CONNECTIVITY
     Explanation:
     Each project thumbnail (.project-thumbnail-wrapper) and details button (.btn-dossier)
     features a `data-modal-target` attribute pointing to its respective <dialog> modal (e.g., 'modal-project-1').
     When clicked or activated with Enter/Space keyboard keys, this handler opens the corresponding
     detailed view modal. It also configures backdrop dismissal, close buttons, and focus return.
     ------------------------------------------------------------------------ */
  const openModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    if (typeof modal.showModal === 'function') {
      modal.showModal();
    } else {
      modal.setAttribute('open', '');
    }
    // Prevent document body scrolling while dialog is active
    document.body.style.overflow = 'hidden';

    // Focus close button for accessibility
    const closeBtn = modal.querySelector('.pixel-modal-close');
    if (closeBtn) closeBtn.focus();
  };

  const closeModal = (modal) => {
    if (!modal) return;
    if (typeof modal.close === 'function') {
      modal.close();
    } else {
      modal.removeAttribute('open');
    }
    document.body.style.overflow = '';
  };

  // Connect all thumbnails and dossier buttons to their target project modals
  const modalTriggers = document.querySelectorAll('[data-modal-target]');
  modalTriggers.forEach(trigger => {
    // Click event handler
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = trigger.getAttribute('data-modal-target');
      if (targetId) openModal(targetId);
    });

    // Keyboard accessibility: Enter or Space activates clickable thumbnail
    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const targetId = trigger.getAttribute('data-modal-target');
        if (targetId) openModal(targetId);
      }
    });
  });

  // Connect close buttons inside each modal
  const allModals = document.querySelectorAll('.pixel-project-modal');
  allModals.forEach(modal => {
    const closeBtn = modal.querySelector('.pixel-modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => closeModal(modal));
    }

    // Dismiss when clicking the backdrop
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal);
      }
    });

    // Reset overflow if closed via Escape key (native dialog behavior)
    modal.addEventListener('close', () => {
      document.body.style.overflow = '';
    });
  });

  /* ------------------------------------------------------------------------
     5. TESTIMONIALS CATEGORY FILTERING
     Allows visitors to toggle between All, Client & Founder, and Peer testimonials.
     ------------------------------------------------------------------------ */
  const filterBtns = document.querySelectorAll('.testimonial-filter-btn');
  const testimonialCards = document.querySelectorAll('.testimonial-card');

  if (filterBtns.length > 0 && testimonialCards.length > 0) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const selectedFilter = btn.getAttribute('data-filter');

        // Update active filter button state
        filterBtns.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');

        // Filter testimonial cards
        testimonialCards.forEach(card => {
          const category = card.getAttribute('data-category');
          if (selectedFilter === 'all' || category === selectedFilter) {
            card.classList.remove('hidden');
          } else {
            card.classList.add('hidden');
          }
        });
      });
    });
  }

  /* ------------------------------------------------------------------------
     6. AI REPLICA CHAT CONTROLLER & SIMULATED RESPONSE ENGINE
     ------------------------------------------------------------------------
     This controller manages the interactive portfolio chat interface:
     - Handles message submission and keyboard Enter events.
     - Displays visitor messages and animates typing indicators.
     - Simulates responsive AI replies embodying Sanath's engineering persona.
     - Enables prompt suggestion chips and chat reset actions.
     ------------------------------------------------------------------------ */
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const chatSendBtn = document.getElementById('chat-send-btn');
  const chatMessagesArea = document.getElementById('chat-messages-area');
  const chatTypingIndicator = document.getElementById('chat-typing-indicator');
  const chatResetBtn = document.getElementById('chat-reset-btn');
  const promptChips = document.querySelectorAll('.prompt-chip');

  if (chatForm && chatInput && chatMessagesArea) {
    
    // Helper to get current formatted time
    const getCurrentTime = () => {
      const now = new Date();
      return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Helper to scroll message log to newest message
    const scrollChatToBottom = () => {
      chatMessagesArea.scrollTop = chatMessagesArea.scrollHeight;
    };

    // Helper to sanitize text for safe HTML rendering
    const escapeHtml = (str) => {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    };

    // Append User Message Bubble
    const appendUserMessage = (text) => {
      const timeStr = getCurrentTime();
      const row = document.createElement('div');
      row.className = 'chat-bubble-row user-row';
      row.innerHTML = `
        <div class="user-avatar-badge" aria-hidden="true">YOU</div>
        <div class="chat-bubble user-bubble">
          <div class="bubble-meta">
            <span class="bubble-sender">YOU</span>
            <span class="bubble-time">${timeStr}</span>
          </div>
          <div class="bubble-text">
            <p>${escapeHtml(text)}</p>
          </div>
        </div>
      `;
      chatMessagesArea.appendChild(row);
      scrollChatToBottom();
    };

    // Append AI Message Bubble
    const appendAiMessage = (htmlContent) => {
      const timeStr = getCurrentTime();
      const row = document.createElement('div');
      row.className = 'chat-bubble-row ai-row';
      row.innerHTML = `
        <div class="chat-bubble-avatar" aria-hidden="true">
          <img src="sanath-pixel-avatar.jpg" alt="AI Avatar">
        </div>
        <div class="chat-bubble ai-bubble">
          <div class="bubble-meta">
            <span class="bubble-sender">AI SANATH</span>
            <span class="bubble-time">${timeStr}</span>
          </div>
          <div class="bubble-text">
            ${htmlContent}
          </div>
        </div>
      `;
      chatMessagesArea.appendChild(row);
      scrollChatToBottom();
    };

    /* ======================================================================
       SIMULATED AI RESPONSE GENERATOR (RULE-BASED KNOWLEDGE ENGINE)
       This rule-based engine simulates an intelligent conversational agent
       trained on Sanath's engineering background, skills, and projects.
       ====================================================================== */
    const generateSimulatedResponse = (query) => {
      const q = query.toLowerCase().trim();

      // Greetings
      if (/^(hi|hello|hey|greetings|hola|sup|good (morning|afternoon|evening))\b/i.test(q)) {
        return `
          <p>Hello there! Great to meet you. I'm Sanath's digital AI clone.</p>
          <p>I can answer questions about my engineering stack, flagship projects (like <em>ChronoSync</em> or <em>PixelForge</em>), architecture decisions, or hiring availability. What would you like to explore?</p>
        `;
      }

      // Skills & Technologies
      if (/skill|tech|stack|language|framework|typescript|python|go|golang|react|frontend|backend|docker|postgres|sql/i.test(q)) {
        return `
          <p>My core engineering stack spans both deep backend systems and high-fidelity frontends:</p>
          <p>&bull; <strong>Languages:</strong> TypeScript, Go, JavaScript (ES6+), Python, and SQL.<br>
             &bull; <strong>Frontend:</strong> React, Next.js, HTML5 Canvas, and Vanilla CSS.<br>
             &bull; <strong>Backend &amp; Infra:</strong> Node.js, Express, Redis Pub/Sub, PostgreSQL, Docker, and AWS.</p>
          <p>I specialize in building type-safe, fault-tolerant architectures that handle real-time concurrency with ease.</p>
        `;
      }

      // Specific Project: ChronoSync
      if (/chronosync/i.test(q)) {
        return `
          <p><strong>ChronoSync</strong> is my flagship distributed telemetry engine:</p>
          <p>&bull; Capable of ingesting <strong>25,000+ events/sec</strong> with sub-second WebSocket dashboard broadcasts.<br>
             &bull; Built with <strong>Go</strong>, <strong>Redis Streams</strong>, and <strong>Next.js</strong>.<br>
             &bull; Reduced event delivery latency by 42% through batch buffering and lock-free memory rings.</p>
        `;
      }

      // Specific Project: PixelForge
      if (/pixelforge|canvas|sprite/i.test(q)) {
        return `
          <p><strong>PixelForge</strong> is an in-browser 8-bit sprite studio and animation workbench:</p>
          <p>&bull; Built with <strong>React</strong>, <strong>TypeScript</strong>, <strong>HTML5 Canvas</strong>, and WebAssembly.<br>
             &bull; Features multi-layer sprite drawing, indexed palettes, and automated spritesheet export for indie game devs.</p>
        `;
      }

      // Specific Project: Nexus Gateway
      if (/nexus|gateway|api|microservice/i.test(q)) {
        return `
          <p><strong>Nexus Gateway</strong> is a high-availability cloud-native API orchestrator:</p>
          <p>&bull; Features sliding-window rate limiting, circuit breaker fault isolation, and automated OpenAPI validation.<br>
             &bull; Built with <strong>Node.js</strong>, <strong>PostgreSQL</strong>, and <strong>Redis</strong>, deployed on AWS ECS.</p>
        `;
      }

      // Specific Project: CyberPrompt
      if (/cyberprompt|ai cli|vector/i.test(q)) {
        return `
          <p><strong>CyberPrompt</strong> is a terminal-based local developer assistant:</p>
          <p>&bull; Performs vector embedding searches across codebases using <strong>SQLite Vector</strong>.<br>
             &bull; Delivers instant AST-aware chunking and refactoring suggestions in under 35ms—100% locally with zero cloud leakage.</p>
        `;
      }

      // General Projects
      if (/project|portfolio|built|builds|app|work/i.test(q)) {
        return `
          <p>I have 4 featured engineering projects showcased above:</p>
          <p>1. <strong>ChronoSync:</strong> Distributed Telemetry Engine (Go, Redis)<br>
             2. <strong>PixelForge:</strong> 8-Bit Sprite Studio (React, HTML5 Canvas)<br>
             3. <strong>Nexus Gateway:</strong> Microservices API Orchestrator (Node.js, PostgreSQL)<br>
             4. <strong>CyberPrompt:</strong> Local AI CLI Assistant (Python, SQLite Vector)</p>
          <p>You can click on any thumbnail in the <em>Projects</em> section to inspect architecture diagrams and live demos!</p>
        `;
      }

      // Availability / Hiring / Jobs
      if (/hire|available|job|work|contract|role|freelance|salary|opportunity|full-time|part-time/i.test(q)) {
        return `
          <p>Yes, I am currently <strong>available for new opportunities</strong>!</p>
          <p>I'm interested in:</p>
          <p>&bull; Full-time Software Engineering roles (Full-Stack, Backend, or Systems).<br>
             &bull; High-impact consulting &amp; distributed system contracts.<br>
             &bull; Fast-paced engineering teams building mission-critical products.</p>
          <p>Feel free to reach out directly via the <em>Contact</em> section or email me at <code>contact@sanath.dev</code>!</p>
        `;
      }

      // Experience / Bio / Background
      if (/experience|about|bio|background|who are you|education|degree|school|years/i.test(q)) {
        return `
          <p>I'm <strong>Sanath Kumar</strong>, a Software Engineer with 3+ years of experience engineering high-performance web systems and scalable backends.</p>
          <p>&bull; <strong>Education:</strong> B.S. in Computer Science (Summa Cum Laude, GPA 3.92).<br>
             &bull; <strong>Shipped:</strong> 15+ production systems with 99.9% uptime and zero regressions.<br>
             &bull; <strong>Interests:</strong> Distributed databases, WebAssembly, pixel-art graphics, and developer tooling.</p>
        `;
      }

      // Contact & Social
      if (/contact|email|reach|linkedin|github|twitter|phone/i.test(q)) {
        return `
          <p>You can connect with me through several channels:</p>
          <p>&bull; <strong>Email:</strong> <a href="mailto:contact@sanath.dev" style="color: var(--pixel-accent); text-decoration: underline;">contact@sanath.dev</a><br>
             &bull; <strong>GitHub:</strong> <a href="https://github.com" target="_blank" rel="noopener noreferrer" style="color: var(--pixel-accent); text-decoration: underline;">github.com/sanath</a><br>
             &bull; <strong>LinkedIn:</strong> <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" style="color: var(--pixel-accent); text-decoration: underline;">linkedin.com/in/sanath</a></p>
          <p>Or use the quick contact button in the section below!</p>
        `;
      }

      // Default Intelligent Fallback
      return `
        <p>Thanks for your message! While my simulated knowledge base is expanding, I specialize in answering questions about:</p>
        <p>&bull; <strong>Core Skills:</strong> TypeScript, Go, Python, React, Redis, Docker.<br>
           &bull; <strong>Flagship Projects:</strong> ChronoSync, PixelForge, Nexus Gateway.<br>
           &bull; <strong>Career:</strong> Work history, education, and availability for hire.</p>
        <p>Try asking: <em>"What is your tech stack?"</em> or <em>"Tell me about ChronoSync"</em>!</p>
      `;
    };

    /* ======================================================================
       FUTURE OPENAI / LLM API INTEGRATION POINT (OPENAI / CLAUDE / GEMINI)
       ----------------------------------------------------------------------
       To connect this chat interface to an external LLM API (e.g. OpenAI),
       replace the simulated response call with the following asynchronous pattern:

       ```javascript
       async function fetchOpenAiResponse(userMessage, conversationHistory = []) {
         // IMPORTANT: For production security, route requests through your own
         // backend serverless proxy (e.g. Next.js /api/chat or Express endpoint)
         // so your OPENAI_API_KEY is NEVER exposed to client browsers.
         
         const API_ENDPOINT = '/api/chat'; // Backend proxy route
         // const API_ENDPOINT = 'https://api.openai.com/v1/chat/completions'; // Direct (test only)

         try {
           const response = await fetch(API_ENDPOINT, {
             method: 'POST',
             headers: {
               'Content-Type': 'application/json',
               // 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` // (On server side)
             },
             body: JSON.stringify({
               model: 'gpt-4o-mini',
               messages: [
                 {
                   role: 'system',
                   content: `You are Sanath Kumar's official portfolio AI clone. You are a senior software engineer
                             who builds distributed systems with Go and interactive web apps with TypeScript/React.
                             Be helpful, concise, professional, and slightly enthusiastic about engineering.`
                 },
                 ...conversationHistory,
                 { role: 'user', content: userMessage }
               ],
               temperature: 0.7,
               max_tokens: 350
             })
           });

           if (!response.ok) {
             throw new Error(`OpenAI API returned status ${response.status}`);
           }

           const data = await response.json();
           return data.choices[0].message.content;

         } catch (error) {
           console.error('LLM API Error:', error);
           // Graceful fallback to local simulated response engine if network/API fails
           return generateSimulatedResponse(userMessage);
         }
       }
       ```
       ====================================================================== */

    // Process Message Submission
    const handleSendMessage = (messageText) => {
      const trimmed = messageText.trim();
      if (!trimmed) return;

      // 1. Post User message to log
      appendUserMessage(trimmed);

      // 2. Clear input & disable controls during wait
      chatInput.value = '';
      chatInput.disabled = true;
      if (chatSendBtn) chatSendBtn.disabled = true;

      // 3. Display typing animation
      if (chatTypingIndicator) {
        chatTypingIndicator.classList.remove('hidden');
        scrollChatToBottom();
      }

      // 4. Simulate natural network latency (600ms - 900ms)
      const simulatedLatency = Math.floor(Math.random() * 300) + 600;

      setTimeout(() => {
        // Hide typing indicator
        if (chatTypingIndicator) {
          chatTypingIndicator.classList.add('hidden');
        }

        // Generate response (Here you can await fetchOpenAiResponse() when API key is provided)
        const responseHtml = generateSimulatedResponse(trimmed);

        // Append AI response
        appendAiMessage(responseHtml);

        // Re-enable input and restore focus
        chatInput.disabled = false;
        if (chatSendBtn) chatSendBtn.disabled = false;
        chatInput.focus();
      }, simulatedLatency);
    };

    // Form submit listener
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSendMessage(chatInput.value);
    });

    // Quick prompt chip click listeners
    promptChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const question = chip.getAttribute('data-question');
        if (question) {
          handleSendMessage(question);
        }
      });
    });

    // Reset Chat conversation listener
    if (chatResetBtn) {
      chatResetBtn.addEventListener('click', () => {
        chatMessagesArea.innerHTML = `
          <div class="chat-bubble-row ai-row">
            <div class="chat-bubble-avatar" aria-hidden="true">
              <img src="sanath-pixel-avatar.jpg" alt="AI Avatar">
            </div>
            <div class="chat-bubble ai-bubble">
              <div class="bubble-meta">
                <span class="bubble-sender">AI SANATH</span>
                <span class="bubble-time">${getCurrentTime()}</span>
              </div>
              <div class="bubble-text">
                <p>Chat conversation reset! I'm ready for new questions about my software engineering work, technical competencies, or project milestones.</p>
                <p class="bubble-hint">Ask a question or select a starter prompt above!</p>
              </div>
            </div>
          </div>
        `;
        scrollChatToBottom();
        chatInput.focus();
      });
    }

  }

  /* ------------------------------------------------------------------------
     7. CONTACT FORM CONTROLLER & RESEND API INTEGRATION BLUEPRINT
     ------------------------------------------------------------------------
     Handles:
     - Real-time and on-submit form validation (name, email, message).
     - Submit button loading and high-contrast feedback states.
     - Confirmation message banner display upon successful dispatch.
     - Resetting the form for subsequent messages.
     ------------------------------------------------------------------------ */
  const contactForm = document.getElementById('contact-form');
  const nameInput = document.getElementById('contact-name');
  const emailInput = document.getElementById('contact-email');
  const messageInput = document.getElementById('contact-message');
  const submitBtn = document.getElementById('contact-submit-btn');
  const confirmationBox = document.getElementById('contact-confirmation');
  const confirmMessage = document.getElementById('confirm-message');
  const confirmResetBtn = document.getElementById('confirm-reset-btn');

  const nameError = document.getElementById('name-error');
  const emailError = document.getElementById('email-error');
  const messageError = document.getElementById('message-error');

  if (contactForm && nameInput && emailInput && messageInput && submitBtn) {

    // Sanitize string helper
    const escapeHtml = (str) => {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    };

    // Helper to set field error state
    const setFieldError = (input, errorEl, message) => {
      const wrapper = input.closest('.form-input-wrapper');
      if (wrapper) wrapper.classList.add('has-error');
      if (errorEl) errorEl.textContent = message;
    };

    // Helper to clear field error state
    const clearFieldError = (input, errorEl) => {
      const wrapper = input.closest('.form-input-wrapper');
      if (wrapper) wrapper.classList.remove('has-error');
      if (errorEl) errorEl.textContent = '';
    };

    // Clear all validation errors
    const clearAllErrors = () => {
      clearFieldError(nameInput, nameError);
      clearFieldError(emailInput, emailError);
      clearFieldError(messageInput, messageError);
    };

    // Real-time input listeners to clear errors on change
    nameInput.addEventListener('input', () => clearFieldError(nameInput, nameError));
    emailInput.addEventListener('input', () => clearFieldError(emailInput, emailError));
    messageInput.addEventListener('input', () => clearFieldError(messageInput, messageError));

    // Form validation validator
    const validateForm = () => {
      let isValid = true;
      clearAllErrors();

      // Validate Name
      const nameVal = nameInput.value.trim();
      if (!nameVal) {
        setFieldError(nameInput, nameError, 'Please enter your name.');
        isValid = false;
      } else if (nameVal.length < 2) {
        setFieldError(nameInput, nameError, 'Name must be at least 2 characters.');
        isValid = false;
      }

      // Validate Email
      const emailVal = emailInput.value.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailVal) {
        setFieldError(emailInput, emailError, 'Please enter your email address.');
        isValid = false;
      } else if (!emailRegex.test(emailVal)) {
        setFieldError(emailInput, emailError, 'Please enter a valid email address (e.g. name@domain.com).');
        isValid = false;
      }

      // Validate Message
      const messageVal = messageInput.value.trim();
      if (!messageVal) {
        setFieldError(messageInput, messageError, 'Please enter your message.');
        isValid = false;
      } else if (messageVal.length < 10) {
        setFieldError(messageInput, messageError, 'Message must be at least 10 characters.');
        isValid = false;
      }

      return isValid;
    };

    /* ======================================================================
       RESEND API / EMAIL SERVICE INTEGRATION BLUEPRINT
       ----------------------------------------------------------------------
       To connect this form to an automated email service like Resend (https://resend.com),
       route the form submission through a secure backend proxy or serverless function
       (e.g., Next.js /api/send or Express backend) so that your API key is never exposed.

       Example Implementation:

       ```javascript
       async function sendEmailViaResend(formData) {
         // Endpoint on your backend serverless function
         const API_ENDPOINT = '/api/send-email';

         const response = await fetch(API_ENDPOINT, {
           method: 'POST',
           headers: {
             'Content-Type': 'application/json'
           },
           body: JSON.stringify({
             name: formData.name,
             email: formData.email,
             message: formData.message,
             // Optional configuration passed to server:
             subject: `🚀 Portfolio Message from ${formData.name}`,
             recipient: 'contact@sanath.dev'
           })
         });

         if (!response.ok) {
           const errData = await response.json();
           throw new Error(errData.message || 'Failed to dispatch email via Resend');
         }

         return await response.json();
       }
       ```

       On your backend server (e.g. Node.js with Resend SDK):
       ```javascript
       import { Resend } from 'resend';
       const resend = new Resend(process.env.RESEND_API_KEY);

       await resend.emails.send({
         from: 'Portfolio <onboarding@resend.dev>', // or verified domain
         to: 'contact@sanath.dev',
         reply_to: email,
         subject: `Portfolio Contact: ${name}`,
         html: `<p><strong>From:</strong> ${name} (${email})</p><p>${message}</p>`
       });
       ```
       ====================================================================== */

    // Form Submit Event Handler
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      if (!validateForm()) {
        // Focus first invalid input
        if (nameInput.closest('.form-input-wrapper').classList.contains('has-error')) {
          nameInput.focus();
        } else if (emailInput.closest('.form-input-wrapper').classList.contains('has-error')) {
          emailInput.focus();
        } else if (messageInput.closest('.form-input-wrapper').classList.contains('has-error')) {
          messageInput.focus();
        }
        return;
      }

      const senderName = nameInput.value.trim();
      const senderEmail = emailInput.value.trim();
      const senderMessage = messageInput.value.trim();

      // UI Loading state
      submitBtn.disabled = true;
      submitBtn.classList.add('is-loading');
      const submitTextEl = submitBtn.querySelector('.btn-submit-text');
      const originalBtnText = submitTextEl ? submitTextEl.textContent : 'DISPATCH MESSAGE';
      if (submitTextEl) submitTextEl.textContent = 'TRANSMITTING MESSAGE...';

      // Simulate network request delay (Here you would await sendEmailViaResend({ ... }))
      setTimeout(() => {
        // Reset submit button state
        submitBtn.disabled = false;
        submitBtn.classList.remove('is-loading');
        if (submitTextEl) submitTextEl.textContent = originalBtnText;

        // Hide form and display confirmation message
        contactForm.classList.add('hidden');
        if (confirmationBox) {
          if (confirmMessage) {
            confirmMessage.innerHTML = `
              Thank you, <strong>${escapeHtml(senderName)}</strong>! Your transmission has been successfully received. 
              I have dispatched a copy to my inbox and will get back to you at <strong>${escapeHtml(senderEmail)}</strong> within 24 hours.
            `;
          }
          confirmationBox.classList.remove('hidden');
          confirmationBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        // Reset form inputs for next message
        contactForm.reset();
      }, 750);
    });

    // Reset Confirmation and Send Another Message Handler
    if (confirmResetBtn) {
      confirmResetBtn.addEventListener('click', () => {
        if (confirmationBox) confirmationBox.classList.add('hidden');
        contactForm.classList.remove('hidden');
        clearAllErrors();
        nameInput.focus();
      });
    }

  }

  /* ==========================================================================
     FOOTER PIXEL ART SOCIAL DECK & LIVE TRANSMISSION TERMINAL CONTROLLER
     Provides dynamic retro arcade status readouts on hover & keyboard focus
     ========================================================================== */
  const socialTiles = document.querySelectorAll('.social-pixel-tile');
  const socialLiveTerminal = document.getElementById('social-live-terminal');
  const socialStatusText = document.getElementById('social-status-text');

  if (socialLiveTerminal && socialStatusText && socialTiles.length > 0) {
    const defaultStatusMessage = 'TRANSMISSION CHANNELS ACTIVE // HOVER OR FOCUS FOR TARGET SPECS';

    socialTiles.forEach((tile) => {
      const channelInfo = tile.getAttribute('data-channel');

      const activateChannel = () => {
        if (channelInfo) {
          socialStatusText.innerHTML = channelInfo;
          socialLiveTerminal.classList.add('active-channel');
        }
      };

      const resetChannel = () => {
        socialStatusText.textContent = defaultStatusMessage;
        socialLiveTerminal.classList.remove('active-channel');
      };

      // Mouse events
      tile.addEventListener('mouseenter', activateChannel);
      tile.addEventListener('mouseleave', resetChannel);

      // Keyboard accessibility focus events
      tile.addEventListener('focus', activateChannel);
      tile.addEventListener('blur', resetChannel);
    });
  }

});

