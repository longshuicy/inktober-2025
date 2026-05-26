(function () {
  const book = document.getElementById("book");
  const stage = document.querySelector(".book__stage");
  const spreadCurrent = document.querySelector(".spread--current");
  const spreadIncoming = document.querySelector(".spread--incoming");
  const pageIndicator = document.querySelector(".book__page-indicator");
  const jumpMenu = document.getElementById("book-jump-menu");
  const jumpList = document.querySelector(".book__jump-list");
  const jumpWrap = document.querySelector(".book__jump");
  const btnPrev = document.querySelector(".book__nav-btn--prev");
  const btnNext = document.querySelector(".book__nav-btn--next");
  const tapPrev = document.querySelector(".book__tap--prev");
  const tapNext = document.querySelector(".book__tap--next");

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function flipDurationMs() {
    const raw = getComputedStyle(book).getPropertyValue("--flip-duration").trim();
    if (!raw) return 700;
    if (raw.endsWith("ms")) return Number.parseFloat(raw) || 700;
    if (raw.endsWith("s")) return (Number.parseFloat(raw) || 0.7) * 1000;
    return Number.parseFloat(raw) || 700;
  }

  function clearFlipClasses() {
    book.classList.remove("book--flip-forward", "book--flip-backward");
    spreadCurrent.classList.remove("spread--flip-forward", "spread--flip-backward");
  }

  let pages = [];
  let currentIndex = 0;
  let isFlipping = false;
  let typingTimers = [];
  let baseTitle = "InkTober 2025";

  function getRouteFromUrl() {
    const hash = window.location.hash.replace(/^#/, "");
    return decodeURIComponent(hash || "");
  }

  function findIndexByRoute(route) {
    if (!route) return -1;
    return pages.findIndex((p) => p.id === route);
  }

  function setRoute(index, options = {}) {
    const { replace = false } = options;
    const page = pages[index];
    if (!page) return;
    const url = `#${encodeURIComponent(page.id)}`;
    if (window.location.hash === url && !replace) return;
    const state = { index };
    if (replace) {
      history.replaceState(state, "", url);
    } else {
      history.pushState(state, "", url);
    }
  }

  function pageDocTitle(page) {
    if (page?.day && page?.prompt) return `${baseTitle} — Day ${page.day}: ${page.prompt}`;
    return baseTitle;
  }

  const WORD_DELAY_MS = 120;
  const TYPING_START_DELAY_AFTER_FLIP_MS = 100;
  const TYPING_START_DELAY_INITIAL_MS = 0;

  const typingContentKey = Symbol("typingContent");

  function clearTyping() {
    typingTimers.forEach(clearTimeout);
    typingTimers = [];
  }

  function containsHtml(str) {
    return /<[a-z][\s\S]*>/i.test(str);
  }

  function plainTextFromHtml(html) {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || "";
  }

  function getTypingContent(el) {
    return el[typingContentKey] ?? "";
  }

  function setRichContent(el, html) {
    el.innerHTML = html;
  }

  function populateTypedWords(el) {
    const text = getTypingContent(el);
    el.innerHTML = "";
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
        setRichContent(el, getTypingContent(el));
        el.classList.remove("panel--typing");
        el.classList.add("panel--typing-done");
      });
      return;
    }

    const panels = root.querySelectorAll(".panel--typing");
    let delay = 0;

    panels.forEach((panel) => {
      const content = getTypingContent(panel);

      if (containsHtml(content)) {
        const timer = setTimeout(() => {
          setRichContent(panel, content);
          panel.classList.remove("panel--typing");
          panel.classList.add("panel--typing-done");
        }, delay);
        typingTimers.push(timer);
        delay += WORD_DELAY_MS;
        return;
      }

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
      const text = document.createElement("p");
      text.className = textClass;
      if (staticText) {
        setRichContent(text, panel.content);
      } else {
        text.classList.add("panel--typing");
        text[typingContentKey] = panel.content;
        text.setAttribute("aria-label", plainTextFromHtml(panel.content));
      }
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
    document.title = pageDocTitle(page);
  }

  function pageLabel(index) {
    if (index === 0) return "Cover";
    return `${index} / ${pages.length - 1}`;
  }

  function updateJumpMenuActive() {
    jumpMenu.querySelectorAll(".book__jump-item").forEach((btn) => {
      const index = Number(btn.dataset.index);
      btn.classList.toggle("is-active", index === currentIndex);
    });
  }

  function setJumpMenuOpen(open) {
    pageIndicator.setAttribute("aria-expanded", open ? "true" : "false");
    jumpWrap.classList.toggle("book__jump--open", open);
  }

  function buildJumpMenu() {
    jumpList.replaceChildren();
    pages.forEach((page, index) => {
      if (index === 0) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "book__jump-item";
      btn.role = "menuitem";
      btn.dataset.index = String(index);
      btn.textContent = page.day ? `Day ${page.day} — ${page.prompt}` : page.id;
      jumpList.appendChild(btn);
    });
    updateJumpMenuActive();
  }

  function jumpTo(index, options = {}) {
    const { force = false, skipHistory = false } = options;
    if (!force && isFlipping) return;
    if (index < 0 || index >= pages.length) return;
    if (index === currentIndex) return;

    clearTyping();
    removeFlipLeaf();
    spreadIncoming.replaceChildren();
    spreadIncoming.className = "spread spread--incoming";
    clearFlipClasses();
    book.classList.remove("is-flipping");
    isFlipping = false;

    currentIndex = index;
    const page = pages[currentIndex];

    mountSpread(spreadCurrent, page, {
      animate: true,
      typingDelay: index === 0 ? TYPING_START_DELAY_INITIAL_MS : TYPING_START_DELAY_AFTER_FLIP_MS,
    });
    spreadCurrent.className = "spread spread--current is-visible";
    applyTheme(page);
    updateControls();
    preloadPage(currentIndex + 1);
    preloadPage(currentIndex - 1);
    setJumpMenuOpen(false);

    if (!skipHistory) setRoute(currentIndex);
  }

  function updateControls() {
    pageIndicator.textContent = pageLabel(currentIndex);
    btnPrev.disabled = currentIndex <= 0 || isFlipping;
    btnNext.disabled = currentIndex >= pages.length - 1 || isFlipping;
    updateJumpMenuActive();
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
    clearFlipClasses();
    applyTheme(page);

    book.classList.remove("is-flipping");
    isFlipping = false;
    updateControls();

    preloadPage(currentIndex + 1);
    preloadPage(currentIndex - 1);
  }

  function goTo(nextIndex, direction, options = {}) {
    const { skipHistory = false } = options;
    if (isFlipping || nextIndex < 0 || nextIndex >= pages.length) return;
    if (nextIndex === currentIndex) return;

    if (!skipHistory) setRoute(nextIndex);

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

    spreadIncoming.replaceChildren();
    spreadIncoming.className = "spread spread--incoming";
    spreadIncoming.setAttribute("aria-hidden", "true");

    const panelSide = forward ? "right" : "left";
    const leavingPage = pages[currentIndex];
    if (!leavingPage || !leavingPage[panelSide]) {
      finishFlip(nextIndex);
      return;
    }

    spreadCurrent.classList.add(forward ? "spread--flip-forward" : "spread--flip-backward");

    const leaf = createFlipLeaf(leavingPage, panelSide);
    stage.appendChild(leaf);

    let settled = false;

    function completeFlip(event) {
      if (event && event.propertyName !== "transform") return;
      if (settled) return;
      settled = true;
      leaf.removeEventListener("transitionend", completeFlip);
      clearTimeout(flipTimer);
      clearFlipClasses();
      leaf.remove();
      finishFlip(nextIndex);
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        book.classList.add(forward ? "book--flip-forward" : "book--flip-backward");
      });
    });

    const flipTimer = setTimeout(completeFlip, flipDurationMs() + 50);
    leaf.addEventListener("transitionend", completeFlip);
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

  jumpList.addEventListener("click", (e) => {
    const btn = e.target.closest(".book__jump-item");
    if (!btn || btn.dataset.index === undefined) return;
    jumpTo(Number(btn.dataset.index));
  });

  jumpWrap.addEventListener("mouseenter", () => setJumpMenuOpen(true));
  jumpWrap.addEventListener("mouseleave", () => setJumpMenuOpen(false));
  jumpWrap.addEventListener("focusin", () => setJumpMenuOpen(true));
  jumpWrap.addEventListener("focusout", (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setJumpMenuOpen(false);
  });

  pageIndicator.addEventListener("click", (e) => {
    if (!window.matchMedia("(hover: none)").matches) return;
    e.preventDefault();
    setJumpMenuOpen(pageIndicator.getAttribute("aria-expanded") !== "true");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
  });

  function navigateToIndexFromHistory(target) {
    if (target < 0 || target === currentIndex) return;
    if (target === currentIndex + 1) {
      goTo(target, "forward", { skipHistory: true });
    } else if (target === currentIndex - 1) {
      goTo(target, "backward", { skipHistory: true });
    } else {
      jumpTo(target, { skipHistory: true, force: true });
    }
  }

  window.addEventListener("popstate", () => {
    const target = findIndexByRoute(getRouteFromUrl());
    if (target < 0) return;
    navigateToIndexFromHistory(target);
  });

  window.addEventListener("hashchange", () => {
    const target = findIndexByRoute(getRouteFromUrl());
    if (target < 0 || target === currentIndex) return;
    navigateToIndexFromHistory(target);
  });

  fetch("data/pages.json")
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load pages: ${res.status}`);
      return res.json();
    })
    .then((data) => {
      pages = data.pages || [];
      if (data.meta?.title) {
        baseTitle = data.meta.title;
      }
      if (pages.length === 0) return;

      buildJumpMenu();

      const route = getRouteFromUrl();
      const routedIndex = findIndexByRoute(route);
      const initialIndex = routedIndex >= 0 ? routedIndex : 0;
      currentIndex = initialIndex;

      mountSpread(spreadCurrent, pages[initialIndex], {
        animate: true,
        typingDelay: TYPING_START_DELAY_INITIAL_MS,
      });
      spreadCurrent.classList.add("is-visible");
      applyTheme(pages[initialIndex]);
      updateControls();
      setRoute(initialIndex, { replace: true });

      preloadPage(initialIndex + 1);
      preloadPage(initialIndex - 1);
    })
    .catch((err) => {
      console.error(err);
      spreadCurrent.innerHTML =
        '<div class="panel panel--right"><p class="panel__text">Could not load book data.</p></div>';
    });
})();
