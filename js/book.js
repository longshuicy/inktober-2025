(function () {
  const book = document.getElementById("book");
  const stage = document.querySelector(".book__stage");
  const spreadCurrent = document.querySelector(".spread--current");
  const spreadIncoming = document.querySelector(".spread--incoming");
  const pageIndicator = document.querySelector(".book__page-indicator");
  const btnPrev = document.querySelector(".book__nav-btn--prev");
  const btnNext = document.querySelector(".book__nav-btn--next");
  const tapPrev = document.querySelector(".book__tap--prev");
  const tapNext = document.querySelector(".book__tap--next");

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let pages = [];
  let currentIndex = 0;
  let isFlipping = false;
  let typingTimers = [];

  const WORD_DELAY_MS = 120;
  const TYPING_START_DELAY_AFTER_FLIP_MS = 100;
  const TYPING_START_DELAY_INITIAL_MS = 0;

  function clearTyping() {
    typingTimers.forEach(clearTimeout);
    typingTimers = [];
  }

  function createTypedElement(className, text) {
    const el = document.createElement("p");
    el.className = `${className} panel--typing`;
    el.setAttribute("data-typing", text);
    el.setAttribute("aria-label", text);
    return el;
  }

  function populateTypedWords(el) {
    const text = el.getAttribute("data-typing") || "";
    el.textContent = "";
    const words = text.split(/\s+/).filter(Boolean);
    words.forEach((word, index) => {
      const span = document.createElement("span");
      span.className = "type-word";
      span.textContent = word;
      span.setAttribute("aria-hidden", "true");
      el.appendChild(span);
      if (index < words.length - 1) {
        el.appendChild(document.createTextNode(" "));
      }
    });
    return words.length;
  }

  function markTextPending(root) {
    root.querySelectorAll(".panel--left, .panel--right").forEach((panel) => {
      if (panel.querySelector(".panel--typing") || panel.querySelector(".panel__label")) {
        panel.classList.add("panel--text-pending");
      }
    });
  }

  function clearTextPending(root) {
    root.querySelectorAll(".panel--text-pending").forEach((panel) => {
      panel.classList.remove("panel--text-pending");
    });
  }

  function startTypingAnimation(root) {
    clearTextPending(root);

    if (reducedMotion) {
      root.querySelectorAll(".panel--typing").forEach((el) => {
        const text = el.getAttribute("data-typing") || "";
        el.textContent = text;
        el.classList.remove("panel--typing");
        el.classList.add("panel--typing-done");
      });
      return;
    }

    const panels = root.querySelectorAll(".panel--typing");
    let delay = 0;

    panels.forEach((panel) => {
      const wordCount = populateTypedWords(panel);
      for (let i = 0; i < wordCount; i += 1) {
        const wordEl = panel.querySelectorAll(".type-word")[i];
        const timer = setTimeout(() => {
          wordEl.classList.add("is-visible");
          if (i === wordCount - 1) {
            panel.classList.remove("panel--typing");
            panel.classList.add("panel--typing-done");
          }
        }, delay);
        typingTimers.push(timer);
        delay += WORD_DELAY_MS;
      }
    });
  }

  function runTyping(root, startDelay = 0) {
    clearTyping();
    markTextPending(root);

    const timer = setTimeout(() => {
      startTypingAnimation(root);
    }, startDelay);
    typingTimers.push(timer);
  }

  function collectImageSrcs(page) {
    const srcs = [];
    for (const side of ["left", "right"]) {
      const panel = page[side];
      if (panel && panel.type === "image" && panel.src) {
        srcs.push(panel.src);
      }
    }
    return srcs;
  }

  function preloadPage(index) {
    if (index < 0 || index >= pages.length) return;
    for (const src of collectImageSrcs(pages[index])) {
      const img = new Image();
      img.src = src;
    }
  }

  function renderPanel(panel, side, page, options = {}) {
    const { staticText = false } = options;
    const el = document.createElement("div");
    el.className = `panel panel--${side}`;

    if (!panel) return el;

    if (panel.type === "image") {
      const img = document.createElement("img");
      img.className = "panel__image";
      img.src = panel.src;
      img.alt = panel.alt || "";
      img.loading = "eager";
      el.appendChild(img);
    } else if (panel.type === "text") {
      if (page.day) {
        const label = document.createElement("p");
        label.className = "panel__label";
        label.textContent = `Day ${page.day} — ${page.prompt}`;
        el.appendChild(label);
      }
      const textClass = side === "left" ? "panel__title" : "panel__text";
      const text = staticText
        ? Object.assign(document.createElement("p"), {
            className: textClass,
            textContent: panel.content,
          })
        : createTypedElement(textClass, panel.content);
      el.appendChild(text);
    } else if (panel.type === "placeholder") {
      const box = document.createElement("div");
      box.className = "panel__placeholder";
      const title = document.createElement("p");
      title.className = "panel__placeholder-title";
      title.textContent = panel.prompt || page.prompt;
      const note = document.createElement("p");
      note.className = "panel__placeholder-note";
      note.textContent = "Artwork coming soon";
      box.appendChild(title);
      box.appendChild(note);
      el.appendChild(box);
    }

    return el;
  }

  function buildSpread(page) {
    const spread = document.createElement("article");
    spread.className = "spread";
    spread.appendChild(renderPanel(page.left, "left", page));
    spread.appendChild(renderPanel(page.right, "right", page));
    return spread;
  }

  function mountSpread(spreadEl, page, options = {}) {
    const { animate = false, hideText = false, typingDelay = 0 } = options;
    spreadEl.replaceChildren();
    const built = buildSpread(page);
    while (built.firstChild) {
      spreadEl.appendChild(built.firstChild);
    }
    if (hideText) {
      markTextPending(spreadEl);
    } else if (animate) {
      runTyping(spreadEl, typingDelay);
    }
  }

  function applyTheme(page) {
    book.dataset.theme = page.theme || "white";
    if (page.meta?.title) {
      document.title = page.meta.title;
    }
  }

  function pageLabel(index) {
    if (index === 0) return "Cover";
    return `${index} / ${pages.length - 1}`;
  }

  function updateControls() {
    pageIndicator.textContent = pageLabel(currentIndex);
    btnPrev.disabled = currentIndex <= 0 || isFlipping;
    btnNext.disabled = currentIndex >= pages.length - 1 || isFlipping;
  }

  function removeFlipLeaf() {
    const leaf = stage.querySelector(".book__flip-leaf");
    if (leaf) leaf.remove();
  }

  function createFlipLeaf(page, side) {
    const leaf = document.createElement("div");
    leaf.className = `book__flip-leaf book__flip-leaf--${side}`;
    leaf.appendChild(renderPanel(page[side], side, page, { staticText: true }));
    return leaf;
  }

  function finishFlip(nextIndex) {
    currentIndex = nextIndex;
    const page = pages[currentIndex];

    removeFlipLeaf();

    spreadCurrent.className = "spread spread--current is-visible";
    spreadIncoming.className = "spread spread--incoming";
    spreadIncoming.setAttribute("aria-hidden", "true");
    spreadCurrent.setAttribute("aria-hidden", "false");

    mountSpread(spreadCurrent, page, {
      animate: true,
      typingDelay: TYPING_START_DELAY_AFTER_FLIP_MS,
    });
    spreadIncoming.replaceChildren();
    applyTheme(page);

    book.classList.remove("is-flipping");
    isFlipping = false;
    updateControls();

    preloadPage(currentIndex + 1);
    preloadPage(currentIndex - 1);
  }

  function goTo(nextIndex, direction) {
    if (isFlipping || nextIndex < 0 || nextIndex >= pages.length) return;
    if (nextIndex === currentIndex) return;

    clearTyping();

    const nextPage = pages[nextIndex];
    const forward = direction === "forward";

    if (reducedMotion) {
      currentIndex = nextIndex;
      mountSpread(spreadCurrent, nextPage, {
        animate: true,
        typingDelay: TYPING_START_DELAY_AFTER_FLIP_MS,
      });
      applyTheme(nextPage);
      updateControls();
      preloadPage(currentIndex + 1);
      preloadPage(currentIndex - 1);
      return;
    }

    isFlipping = true;
    book.classList.add("is-flipping");
    updateControls();

    mountSpread(spreadIncoming, nextPage, { hideText: true });
    spreadIncoming.className = "spread spread--incoming spread--underneath is-visible";
    spreadIncoming.setAttribute("aria-hidden", "false");

    const panelSide = forward ? "right" : "left";
    const leavingPage = pages[currentIndex];
    if (!leavingPage || !leavingPage[panelSide]) {
      finishFlip(nextIndex);
      return;
    }

    spreadCurrent.classList.add("spread--hidden-during-flip");

    const leaf = createFlipLeaf(leavingPage, panelSide);
    const animClass = forward ? "book__flip-leaf--forward-out" : "book__flip-leaf--backward-out";
    leaf.classList.add(animClass);
    stage.appendChild(leaf);

    let settled = false;

    function completeFlip() {
      if (settled) return;
      settled = true;
      leaf.removeEventListener("animationend", completeFlip);
      clearTimeout(flipTimer);
      leaf.remove();
      spreadCurrent.classList.remove("spread--hidden-during-flip");
      finishFlip(nextIndex);
    }

    const flipTimer = setTimeout(completeFlip, 750);
    leaf.addEventListener("animationend", completeFlip);
  }

  function next() {
    goTo(currentIndex + 1, "forward");
  }

  function prev() {
    goTo(currentIndex - 1, "backward");
  }

  btnNext.addEventListener("click", next);
  btnPrev.addEventListener("click", prev);
  tapNext.addEventListener("click", next);
  tapPrev.addEventListener("click", prev);

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
  });

  fetch("data/pages.json")
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load pages: ${res.status}`);
      return res.json();
    })
    .then((data) => {
      pages = data.pages || [];
      if (data.meta?.title) {
        document.title = data.meta.title;
      }
      if (pages.length === 0) return;

      mountSpread(spreadCurrent, pages[0], {
        animate: true,
        typingDelay: TYPING_START_DELAY_INITIAL_MS,
      });
      spreadCurrent.classList.add("is-visible");
      applyTheme(pages[0]);
      updateControls();

      preloadPage(1);
    })
    .catch((err) => {
      console.error(err);
      spreadCurrent.innerHTML =
        '<div class="panel panel--right"><p class="panel__text">Could not load book data.</p></div>';
    });
})();
