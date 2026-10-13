/**
 * WP Voice Reader - Frontend Script
 * Adds native Text-to-Speech buttons to visible text elements
 * containing more than 4 words.
 */

(function () {
  "use strict";

  // Check browser support
  if (
    !("speechSynthesis" in window) ||
    !("SpeechSynthesisUtterance" in window)
  ) {
    console.info(
      "[WP Voice Reader] Web Speech API is not supported in this browser.",
    );
    return;
  }

  const config = window.wpVoiceReaderConfig || {
    lang: document.documentElement.lang || "en-US",
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,

    labelPlay: "Listen",
    labelStop: "Stop",

    tooltipPlay: "Listen",
    tooltipStop: "Stop listening",

    // Minimum number of words
    minWordCount: 5,

    excludedContainers: [
      "#wpadminbar",
      "nav",
      "header",
      "footer",

      ".menu",
      ".nav-menu",
      ".site-navigation",

      ".comment-form",
      ".wp-block-navigation",
      ".elementor-nav-menu",

      ".elementor-location-header",
      ".elementor-location-footer",

      ".no-voice-reader",

      "form",
      "noscript",

      "button",
      "a",
      "input",
      "select",
      "textarea",
      "option",

      "[role='button']",
      "[aria-hidden='true']",
    ],
  };

  const synth = window.speechSynthesis;

  let currentActiveBtn = null;
  let currentUtterance = null;
  let speechKeepAliveTimer = null;

  /**
   * Microphone SVG
   */
  const micSvg = `
<svg
  class="wp-vr-icon wp-vr-mic-default"
  viewBox="0 0 24 24"
  fill="currentColor"
  aria-hidden="true"
>
  <path d="M3 9v6h4l5 5V4L7 9H3z"/>
  <path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
  <path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
</svg>

    <div class="wp-vr-waves" aria-hidden="true">
      <span class="wp-vr-wave-bar"></span>
      <span class="wp-vr-wave-bar"></span>
      <span class="wp-vr-wave-bar"></span>
      <span class="wp-vr-wave-bar"></span>
    </div>
  `;

  /**
   * Get clean visible text from element.
   */
  function getElementText(element) {
    if (!element) {
      return "";
    }

    return (element.innerText || element.textContent || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Count words.
   */
  function getWordCount(text) {
    if (!text) {
      return 0;
    }

    return text.trim().split(/\s+/).filter(Boolean).length;
  }

  /**
   * Check if element should be excluded.
   */
  function isExcluded(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
      return true;
    }

    // Ignore our own buttons
    if (
      element.classList &&
      element.classList.contains("wp-voice-reader-btn")
    ) {
      return true;
    }

    // Don't process script/style/etc.
    const forbiddenTags = [
      "SCRIPT",
      "STYLE",
      "NOSCRIPT",
      "SVG",
      "PATH",
      "VIDEO",
      "AUDIO",
      "CANVAS",
      "IFRAME",
    ];

    if (forbiddenTags.includes(element.tagName)) {
      return true;
    }

    // Excluded parent/container
    if (config.excludedContainers && config.excludedContainers.length) {
      const selector = config.excludedContainers.join(",");

      if (element.closest(selector)) {
        return true;
      }
    }

    // Ignore hidden elements
    const style = window.getComputedStyle(element);

    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      style.opacity === "0"
    ) {
      return true;
    }

    // Ignore elements with aria-hidden
    if (element.getAttribute("aria-hidden") === "true") {
      return true;
    }

    // Ignore elements already marked
    if (element.hasAttribute("data-wp-voice-ready")) {
      return true;
    }

    return false;
  }

  /**
   * Check if element has meaningful direct text.
   *
   * This prevents adding buttons to large parent containers
   * that contain many child text elements.
   */
  function hasDirectText(element) {
    let directText = "";

    element.childNodes.forEach(function (node) {
      if (node.nodeType === Node.TEXT_NODE) {
        directText += " " + node.textContent;
      }
    });

    return directText.replace(/\s+/g, " ").trim();
  }

  /**
   * Stop current speech.
   */
  function stopCurrentSpeech() {
    if (speechKeepAliveTimer) {
      clearInterval(speechKeepAliveTimer);
      speechKeepAliveTimer = null;
    }

    if (synth.speaking || synth.pending) {
      synth.cancel();
    }

    if (currentActiveBtn) {
      currentActiveBtn.classList.remove("wp-vr-reading");

      currentActiveBtn.setAttribute("aria-pressed", "false");

      currentActiveBtn.setAttribute(
        "aria-label",
        config.tooltipPlay || "Listen",
      );

      currentActiveBtn.title = config.tooltipPlay || "Listen";

      currentActiveBtn = null;
    }

    currentUtterance = null;
  }

  /**
   * Speak selected element.
   */
  /**
   * Get best available voice for language
   */
  /**
   * Get FEMALE voice for Hindi / English
   */
  function getFemaleVoice(language) {
    const voices = synth.getVoices();

    const lang = language.toLowerCase();
    const baseLang = lang.split("-")[0];

    const femaleKeywords = [
      "female",
      "zira",
      "samantha",
      "susan",
      "karen",
      "heera",
      "veena",
      "google uk english female",
      "google us english",
    ];

    const matchingVoices = voices.filter(function (voice) {
      return voice.lang && voice.lang.toLowerCase().startsWith(baseLang);
    });

    /*
     * Find female voice only
     */
    const femaleVoice = matchingVoices.find(function (voice) {
      const name = voice.name.toLowerCase();

      return femaleKeywords.some(function (keyword) {
        return name.includes(keyword);
      });
    });

    /*
     * IMPORTANT:
     * Never return a random/male/default voice.
     */
    return femaleVoice || null;
  }
  /**
   * Detect whether text contains Hindi / Devanagari
   */
  function containsHindi(text) {
    return /[\u0900-\u097F]/.test(text);
  }

  /**
   * Split mixed Hindi + English text into language chunks
   */
  function splitBilingualText(text) {
    if (!text) {
      return [];
    }

    const words = text.split(/(\s+)/);
    const chunks = [];

    let currentText = "";
    let currentLanguage = null;

    words.forEach(function (part) {
      if (!part) {
        return;
      }

      const isSpace = /^\s+$/.test(part);

      if (isSpace) {
        currentText += part;
        return;
      }

      const language = containsHindi(part) ? "hi-IN" : "en-IN";

      if (currentLanguage === null) {
        currentLanguage = language;
        currentText = part;
        return;
      }

      if (language === currentLanguage) {
        currentText += part;
      } else {
        if (currentText.trim()) {
          chunks.push({
            text: currentText.trim(),
            lang: currentLanguage,
          });
        }

        currentLanguage = language;
        currentText = part;
      }
    });

    if (currentText.trim()) {
      chunks.push({
        text: currentText.trim(),
        lang: currentLanguage,
      });
    }

    return chunks;
  }

  /**
   * Speak selected element
   * Supports Hindi + English mixed text
   */
  function speakElement(element, btn) {
    stopCurrentSpeech();

    const textToRead = getElementText(element);

    if (!textToRead) {
      return;
    }

    const chunks = splitBilingualText(textToRead);

    if (!chunks.length) {
      return;
    }

    // Active button
    btn.classList.add("wp-vr-reading");

    btn.setAttribute("aria-pressed", "true");

    btn.setAttribute("aria-label", config.tooltipStop || "Stop listening");

    btn.title = config.tooltipStop || "Stop listening";

    currentActiveBtn = btn;

    let chunkIndex = 0;

    /**
     * Speak next language chunk
     */
    function speakNextChunk() {
      if (chunkIndex >= chunks.length) {
        stopCurrentSpeech();
        return;
      }

      const chunk = chunks[chunkIndex];

      const utterance = new SpeechSynthesisUtterance(chunk.text);

      utterance.lang = chunk.lang;

      /*
       * Natural speaking speed
       */
      utterance.rate = config.rate || 0.95;

      /*
       * Keep natural pitch.
       * Do not force pitch to make voice "female".
       */
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      /*
       * Select correct language voice
       */
      const selectedVoice = getFemaleVoice(chunk.lang);

      if (!selectedVoice) {
        console.warn(
          "[WP Voice Reader] Female voice not available for:",
          chunk.lang,
        );

        stopCurrentSpeech();
        return;
      }

      currentUtterance = utterance;

      utterance.onend = function () {
        chunkIndex++;

        /*
         * Small gap between Hindi and English
         * makes the language switch clearer.
         */
        setTimeout(function () {
          if (currentActiveBtn === btn && !synth.speaking) {
            speakNextChunk();
          }
        }, 80);
      };

      utterance.onerror = function (event) {
        if (event.error !== "canceled" && event.error !== "interrupted") {
          console.warn(
            "[WP Voice Reader] Speech synthesis error:",
            event.error,
          );
        }

        stopCurrentSpeech();
      };

      synth.speak(utterance);
    }

    speakNextChunk();
  }

  /**
   * Create voice button.
   */
  function createVoiceButton(element) {
    const btn = document.createElement("button");

    btn.type = "button";
    btn.className = "wp-voice-reader-btn";

    btn.style.display = "inline-flex";
    btn.style.verticalAlign = "middle";

    btn.setAttribute("aria-label", config.tooltipPlay || "Listen");

    btn.setAttribute("aria-pressed", "false");

    btn.title = config.tooltipPlay || "Listen";

    btn.innerHTML = micSvg;

    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      if (btn.classList.contains("wp-vr-reading")) {
        stopCurrentSpeech();
      } else {
        speakElement(element, btn);
      }
    });

    return btn;
  }

  /**
   * Text elements we want to scan.
   */
  const textSelectors = [
    "p",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",

    "li",

    "blockquote",

    "figcaption",

    "td",
    "th",

    "label",

    "span",

    "div",

    "article",

    "section",
  ].join(",");

  /**
   * Scan page for text.
   */
  function scanAndAttach(root) {
    const context = root || document;

    const elements = context.querySelectorAll(textSelectors);

    elements.forEach(function (element) {
      if (isExcluded(element)) {
        return;
      }

      /**
       * Only process elements that
       * have their own direct text.
       *
       * This avoids duplicate buttons
       * on parent containers.
       */
      const directText = hasDirectText(element);

      if (!directText) {
        return;
      }

      /**
       * Count words.
       */
      const wordCount = getWordCount(directText);

      /**
       * More than 4 words.
       */
      if (wordCount < 20) {
        return;
      }

      /**
       * Don't add another button
       * if one already exists.
       */
      if (
        element.nextElementSibling &&
        element.nextElementSibling.classList &&
        element.nextElementSibling.classList.contains("wp-voice-reader-btn")
      ) {
        element.setAttribute("data-wp-voice-ready", "true");

        return;
      }

      /**
       * Mark processed.
       */
      element.setAttribute("data-wp-voice-ready", "true");

      /**
       * Create button.
       */
      const btn = createVoiceButton(element);

      /**
       * Place after text element.
       */
      element.appendChild(btn);
    });
  }

  /**
   * Debounced scan.
   */
  let scanTimeout = null;

  function scheduleScan(root) {
    if (scanTimeout) {
      clearTimeout(scanTimeout);
    }

    scanTimeout = setTimeout(function () {
      scanAndAttach(root || document.body);
    }, 150);
  }

  /**
   * Observe dynamically loaded content.
   */
  function initObserver() {
    if (!window.MutationObserver) {
      return;
    }

    const observer = new MutationObserver(function (mutations) {
      let shouldScan = false;

      for (let i = 0; i < mutations.length; i++) {
        const mutation = mutations[i];

        if (mutation.type === "childList" && mutation.addedNodes.length) {
          shouldScan = true;

          break;
        }
      }

      if (shouldScan) {
        scheduleScan();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Stop speech when leaving page.
   */
  window.addEventListener("beforeunload", stopCurrentSpeech);

  window.addEventListener("pagehide", stopCurrentSpeech);

  /**
   * Initialize.
   */
  function init() {
    scanAndAttach(document.body);

    initObserver();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
