(function () {
  "use strict";

  const DATA = window.PORTFOLIO_DATA;
  if (!DATA) return;

  const page = document.body.dataset.page || "home";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const TRANSITION_MEDIA = [
    "assets/home/Kırmızı-intro.mp4",
    "assets/home/mavi .mp4",
    "assets/home/pembe.mp4",
    "assets/home/sari.mp4",
  ];
  // Pre-rendered by tools/build-web-media.py: TRANSITION_MEDIA in order, each compressed into one 500 ms slot.
  const TRANSITION_SEQUENCE = "assets/web/transition/serap-yildirim-sequence.mp4";
  const TRANSITION_MARKS = {
    serap: "assets/Gecis ekrani png leri/Serap.png",
    yildirim: "assets/Gecis ekrani png leri/YILDIRIM.png",
  };
  // Must match VIDEOS in tools/build-web-media.py.
  const WEB_VIDEO_SOURCES = new Set([
    "Intro/Intro_yazılı.mp4",
    "Intro/Intro.mp4",
    ...TRANSITION_MEDIA,
    "assets/lab/0201(5).mp4",
    "assets/lab/view of artist.mp4",
    "assets/lab/Pop-up portfolio.mp4",
  ]);
  const WEB_IMAGE_PATTERN = /^assets\/(projects|lab|avatar)\/.+\.(jpe?g|png)$/i;
  // Written by tools/build-web-media.py; only project.html loads it.
  const MEDIA_SIZES = window.PORTFOLIO_MEDIA || {};
  const webFallbacks = new Map();

  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];
  const pad2 = (value) => String(value).padStart(2, "0");
  const clamp01 = (value) => Math.min(1, Math.max(0, value));

  function markCurtainOpen() {
    if (document.body.classList.contains("is-curtain-open")) return;
    document.body.classList.add("is-curtain-open");
    document.dispatchEvent(new Event("portfolio:curtain-open"));
  }

  // Entrance animations wait for the transition panels to part, so they are seen rather than played behind them.
  function whenCurtainOpens(callback) {
    if (document.body.classList.contains("is-curtain-open")) {
      callback();
      return;
    }
    document.addEventListener("portfolio:curtain-open", callback, { once: true });
  }

  function mediaRatio(path) {
    const size = MEDIA_SIZES[path];
    return size && size[0] > 0 && size[1] > 0 ? size[0] / size[1] : 1.5;
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function coverStyle(project) {
    return project.coverPosition ? ` style="object-position: ${escapeHTML(project.coverPosition)}"` : "";
  }

  function projectURL(project) {
    return `project.html?slug=${encodeURIComponent(project.slug)}`;
  }

  function mediaURL(path) {
    return encodeURI(String(path || ""));
  }

  // url() inside a custom property resolves against the stylesheet that uses it, so pass it absolute.
  function cssURL(path) {
    return `url("${new URL(mediaURL(path), document.baseURI).href}")`;
  }

  function webCopyPath(path, size = "") {
    const relative = String(path).replace(/^assets\//, "");
    return `assets/web/${size ? `${size}/` : ""}${relative}`;
  }

  function registerFallback(webPath, originalPath) {
    const webURL = mediaURL(webPath);
    webFallbacks.set(webURL, mediaURL(originalPath));
    return webURL;
  }

  // Encoded URL of the resized WebP copy; "sm" for thumbnails, "lg" for everything else.
  function webImage(path, size = "lg") {
    if (!path || !WEB_IMAGE_PATTERN.test(path)) return mediaURL(path);
    return registerFallback(webCopyPath(path, size).replace(/\.[^./]+$/, ".webp"), path);
  }

  function webVideo(path) {
    if (!WEB_VIDEO_SOURCES.has(path)) return mediaURL(path);
    return registerFallback(webCopyPath(path), path);
  }

  function initMediaFallbacks() {
    document.addEventListener(
      "error",
      (event) => {
        const element = event.target;
        if (!(element instanceof HTMLImageElement || element instanceof HTMLVideoElement)) return;
        const fallback = webFallbacks.get(element.getAttribute("src"));
        if (!fallback) return;
        element.src = fallback;
        if (element instanceof HTMLVideoElement && element.autoplay) element.play().catch(() => {});
      },
      true
    );
  }

  function currentMenuPage() {
    return page === "project" ? "work" : page;
  }

  function renderShell() {
    const active = currentMenuPage();
    const header = qs("#site-header");
    const menu = qs("#site-menu");
    const cursor = qs("#site-cursor");
    const footer = qs("#site-footer");
    const transition = qs("#page-transition");

    if (header) {
      header.innerHTML = `
        <header class="site-header">
          <a class="site-header__name" href="index.html" aria-label="Serap Yıldırım home">
            <span>SERAP YILDIRIM</span>
          </a>
          <p class="site-header__role"><span>MULTIDISCIPLINARY DESIGNER</span></p>
          <button class="sound-toggle" id="sound-toggle" type="button" aria-pressed="false" aria-label="Play music" data-cursor="Sound">
            <span class="sound-toggle__bar"></span><span class="sound-toggle__bar"></span><span class="sound-toggle__bar"></span><span class="sound-toggle__bar"></span>
          </button>
          <button class="menu-toggle" id="menu-toggle" type="button" aria-expanded="false" aria-controls="fullscreen-menu">
            Menu
          </button>
        </header>
      `;
    }

    if (menu) {
      const links = [
        ["home", "Home", "index.html", DATA.site.menuMedia.home],
        ["work", "Work", "work.html", DATA.site.menuMedia.work],
        ["lab", "Lab", "lab.html", DATA.site.menuMedia.lab],
        ["about", "About", "about.html", DATA.site.menuMedia.about],
      ];

      menu.innerHTML = `
        <aside class="site-menu" id="fullscreen-menu" aria-hidden="true">
          <div class="site-menu__backdrop" aria-hidden="true">
            <video class="site-menu__backdrop-video" muted loop playsinline preload="none">
              <source src="${escapeHTML(webVideo(DATA.site.menuVideo))}" type="video/mp4">
              <source src="${escapeHTML(mediaURL(DATA.site.menuVideo))}" type="video/mp4">
            </video>
          </div>
          <nav class="site-menu__nav" aria-label="Main navigation">
            ${links
              .map(
                ([id, label, href, media]) => `
                  <a
                    class="site-menu__link${active === id ? " is-active" : ""}"
                    href="${href}"
                    data-menu-page="${id}"
                  >
                    <span class="site-menu__link-label site-menu__media-label">
                      <video class="site-menu__word-video" muted loop playsinline preload="metadata" aria-hidden="true" tabindex="-1">
                        <source src="${escapeHTML(webVideo(media))}" type="video/mp4">
                        <source src="${escapeHTML(mediaURL(media))}" type="video/mp4">
                      </video>
                      <span class="site-menu__word">${escapeHTML(label)}</span>
                    </span>
                  </a>
                `
              )
              .join("")}
          </nav>
        </aside>
      `;
    }

    if (cursor) {
      cursor.innerHTML = `
        <div class="site-cursor" aria-hidden="true">
          <div class="site-cursor__circle">
            <span class="site-cursor__text"></span>
          </div>
        </div>
      `;
    }

    if (transition) {
      const wordVideos = `<video class="page-transition__word-video" src="${escapeHTML(mediaURL(TRANSITION_SEQUENCE))}" muted playsinline preload="auto" aria-hidden="true" tabindex="-1"></video>`;
      transition.innerHTML = `
        <div class="page-transition__panel page-transition__panel--left">
          <span class="page-transition__word page-transition__word--serap" aria-label="Serap">
            <img class="page-transition__word-mark" src="${escapeHTML(mediaURL(TRANSITION_MARKS.serap))}" alt="" draggable="false">
            ${wordVideos}
          </span>
        </div>
        <div class="page-transition__panel page-transition__panel--right">
          <span class="page-transition__word page-transition__word--yildirim" aria-label="YILDIRIM">
            <img class="page-transition__word-mark" src="${escapeHTML(mediaURL(TRANSITION_MARKS.yildirim))}" alt="" draggable="false">
            ${wordVideos}
          </span>
        </div>
        <span class="page-transition__seam" aria-hidden="true"></span>
      `;
    }

    if (footer) {
      footer.innerHTML = `
        <footer class="site-footer">
          <div class="site-footer__grid">
            <nav class="site-footer__nav" aria-label="Footer navigation">
              <a href="index.html">Home</a>
              <a href="work.html">Work</a>
              <a href="lab.html">Lab</a>
              <a href="about.html">About</a>
            </nav>
            <div class="footer-column">
              <h3>Serap Yıldırım</h3>
              <a href="mailto:${escapeHTML(DATA.site.email)}">${escapeHTML(DATA.site.email)}</a>
            </div>
            <div class="footer-column">
              <h3>Address</h3>
              <p>${escapeHTML(DATA.site.location)}</p>
            </div>
            <div class="footer-column">
              <h3>Social</h3>
              <a href="${escapeHTML(DATA.site.social.instagram)}" target="_blank" rel="noopener noreferrer">Instagram</a>
              <a href="${escapeHTML(DATA.site.social.behance)}" target="_blank" rel="noopener noreferrer">Behance</a>
              <a href="${escapeHTML(DATA.site.social.linkedin)}" target="_blank" rel="noopener noreferrer">LinkedIn</a>
            </div>
          </div>
          <div class="site-footer__bottom">
            <span>© 2026 Serap Yıldırım</span>
            <span>Made by Serap Yıldırım</span>
          </div>
        </footer>
      `;
    }
  }

  function initMenu() {
    const toggle = qs("#menu-toggle");
    const menu = qs("#fullscreen-menu");
    if (!toggle || !menu) return;

    const backdropVideo = qs(".site-menu__backdrop-video", menu);
    const links = qsa(".site-menu__link", menu);
    const wordVideos = qsa(".site-menu__word-video", menu);
    const canHoverVideo = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    const applyWordMask = (link) => {
      const wrapper = qs(".site-menu__media-label", link);
      const video = qs(".site-menu__word-video", link);
      const word = qs(".site-menu__word", link);
      if (!wrapper || !video || !word) return false;

      const width = Math.max(1, Math.round(word.offsetWidth));
      const height = Math.max(1, Math.round(word.offsetHeight));
      const styles = window.getComputedStyle(word);
      const canvas = document.createElement("canvas");
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      const ctx = canvas.getContext("2d");
      if (!ctx) return false;

      ctx.scale(ratio, ratio);
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#fff";
      ctx.font = `${styles.fontStyle} ${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if ("letterSpacing" in ctx) ctx.letterSpacing = styles.letterSpacing;
      ctx.fillText(word.textContent.trim().toUpperCase(), width / 2, height / 2);

      video.style.width = `${width}px`;
      video.style.height = `${height}px`;
      const mask = `url(${canvas.toDataURL("image/png")})`;
      video.style.webkitMaskImage = mask;
      video.style.maskImage = mask;
      video.style.webkitMaskSize = "100% 100%";
      video.style.maskSize = "100% 100%";
      video.style.webkitMaskRepeat = "no-repeat";
      video.style.maskRepeat = "no-repeat";
      video.style.webkitMaskPosition = "center";
      video.style.maskPosition = "center";
      return true;
    };

    const resetWordVideo = (link) => {
      const wrapper = qs(".site-menu__media-label", link);
      const video = qs(".site-menu__word-video", link);
      wrapper?.classList.remove("is-video-active");
      link.classList.remove("is-video-active");
      if (!video) return;
      video.pause();
      try {
        video.currentTime = 0;
      } catch {
        // Metadata may not be available yet; the next play still starts at frame zero.
      }
    };

    const activateWordVideo = (link) => {
      links.forEach((item) => {
        if (item !== link) resetWordVideo(item);
      });

      const wrapper = qs(".site-menu__media-label", link);
      const video = qs(".site-menu__word-video", link);
      if (!wrapper || !video || !applyWordMask(link)) return;

      const showMaskedVideo = () => {
        if (video.paused || !applyWordMask(link)) return;
        wrapper.classList.add("is-video-active");
        link.classList.add("is-video-active");
      };

      const startVideo = () => {
        if (video.readyState >= 2) {
          video
            .play()
            .then(showMaskedVideo)
            .catch(() => {
              wrapper.classList.remove("is-video-active");
              link.classList.remove("is-video-active");
            });
          return;
        }

        video.addEventListener("loadeddata", showMaskedVideo, { once: true });
        video
          .play()
          .then(showMaskedVideo)
          .catch(() => {
            wrapper.classList.remove("is-video-active");
            link.classList.remove("is-video-active");
          });
      };

      if (document.fonts?.ready) {
        document.fonts.ready.then(startVideo);
      } else {
        startVideo();
      }
    };

    if (canHoverVideo) {
      links.forEach((link) => {
        link.addEventListener("mouseenter", () => activateWordVideo(link));
        link.addEventListener("mouseleave", () => resetWordVideo(link));
        link.addEventListener("focus", () => activateWordVideo(link));
        link.addEventListener("blur", () => resetWordVideo(link));
      });
    }

    // Without hover, the words take turns showing their film, top to bottom, for as long as the menu is open.
    const SEQUENCE_START = 900;
    const SEQUENCE_STEP = 1900;
    let sequenceTimer = 0;
    const stopSequence = () => {
      window.clearTimeout(sequenceTimer);
      sequenceTimer = 0;
    };
    const primeWordVideo = (link) => {
      const video = qs(".site-menu__word-video", link);
      if (!video || video.readyState >= 2) return;
      if (video.preload !== "auto") {
        video.preload = "auto";
        video.load();
      }
    };
    const runSequence = (index) => {
      const link = links[index % links.length];
      primeWordVideo(links[(index + 1) % links.length]);
      activateWordVideo(link);
      sequenceTimer = window.setTimeout(() => runSequence(index + 1), SEQUENCE_STEP);
    };
    const startSequence = () => {
      if (canHoverVideo || reducedMotion || !links.length) return;
      stopSequence();
      primeWordVideo(links[0]);
      sequenceTimer = window.setTimeout(() => runSequence(0), SEQUENCE_START);
    };

    wordVideos.forEach((video) => {
      video.addEventListener("error", () => {
        video.closest(".site-menu__media-label")?.classList.remove("is-video-active");
      });
    });

    const setOpen = (open, restoreFocus = true) => {
      document.body.classList.toggle("menu-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.textContent = open ? "Close" : "Menu";
      menu.setAttribute("aria-hidden", String(!open));

      if (open) {
        backdropVideo?.play().catch(() => {});
        startSequence();
        setTimeout(() => toggle.focus(), 250);
      } else {
        stopSequence();
        backdropVideo?.pause();
        links.forEach(resetWordVideo);
        if (restoreFocus) toggle.focus();
      }
      updateScreenEdge();
    };

    toggle.addEventListener("click", () => {
      setOpen(!document.body.classList.contains("menu-open"));
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && document.body.classList.contains("menu-open")) {
        setOpen(false);
      }
    });

    document.addEventListener("portfolio:close-menu", () => {
      setOpen(false, false);
    });
  }

  function initPageTransitions() {
    const overlay = qs("#page-transition");
    if (!overlay) {
      markCurtainOpen();
      return;
    }

    const TOTAL_DURATION = reducedMotion ? 220 : 3000;
    const VIDEO_HOLD_DURATION = reducedMotion ? 0 : 2000;
    const OPEN_DURATION = reducedMotion ? 220 : 1000;
    const CLOSE_DURATION = reducedMotion ? 80 : 650;
    // Phones can spend most of the hold loading the next page; the curtain then waits a little for the film.
    const VIDEO_GRACE = 1400;
    const VIDEO_MIN_SHOW = 900;
    const TIMELINE_KEY = "serap-portfolio-transition-start";
    const transitionVideos = qsa(".page-transition__word-video", overlay);
    const words = qsa(".page-transition__word", overlay);
    const transitionTimers = new Set();
    let videoGeneration = 0;
    let videoShownAt = 0;
    let videoRefused = false;
    let navigating = false;

    const schedule = (callback, delay) => {
      const timer = window.setTimeout(() => {
        transitionTimers.delete(timer);
        callback();
      }, Math.max(0, delay));
      transitionTimers.add(timer);
      return timer;
    };

    const clearTransitionTimers = () => {
      transitionTimers.forEach((timer) => window.clearTimeout(timer));
      transitionTimers.clear();
    };

    const lockPage = (locked) => {
      document.body.classList.toggle("is-transitioning", locked);
      overlay.setAttribute("aria-hidden", String(!locked));
      updateScreenEdge();
    };

    const readTimelineStart = () => {
      try {
        const stored = Number(sessionStorage.getItem(TIMELINE_KEY));
        if (Number.isFinite(stored) && Date.now() - stored < TOTAL_DURATION + 1000) {
          return stored;
        }
      } catch {
        // A fresh local timeline is safe when storage is unavailable.
      }
      return 0;
    };

    const writeTimelineStart = (value) => {
      try {
        sessionStorage.setItem(TIMELINE_KEY, String(value));
      } catch {
        // The in-memory value still drives the current document.
      }
    };

    const clearTimelineStart = () => {
      try {
        sessionStorage.removeItem(TIMELINE_KEY);
      } catch {
        // Nothing else needs clearing when storage is unavailable.
      }
    };

    const applyVideoMasks = () => {
      words.forEach((word) => {
        const mark = qs(".page-transition__word-mark", word);
        const videos = qsa(".page-transition__word-video", word);
        if (!mark || !videos.length) return;
        const mask = `url("${mark.currentSrc || mark.src}")`;
        videos.forEach((video) => {
          video.style.webkitMaskImage = mask;
          video.style.maskImage = mask;
          video.style.webkitMaskSize = "100% 100%";
          video.style.maskSize = "100% 100%";
          video.style.webkitMaskRepeat = "no-repeat";
          video.style.maskRepeat = "no-repeat";
          video.style.webkitMaskPosition = "center";
          video.style.maskPosition = "center";
        });
      });
    };

    const stopTransitionVideos = () => {
      videoGeneration += 1;
      videoShownAt = 0;
      videoRefused = false;
      words.forEach((word) => word.classList.remove("has-active-video"));
      transitionVideos.forEach((video) => {
        video.classList.remove("is-active");
        video.pause();
        try {
          video.currentTime = 0;
        } catch {
          // A source may not have metadata yet.
        }
      });
    };

    // The sequence clip lasts exactly VIDEO_HOLD_DURATION, so the clip clock equals the timeline clock;
    // a film that starts late keeps at least VIDEO_MIN_SHOW of the clip ahead of it.
    const startTransitionVideos = (timelineStart) => {
      stopTransitionVideos();
      if (reducedMotion || VIDEO_HOLD_DURATION <= 0) return;
      const generation = videoGeneration;
      if (Date.now() - timelineStart >= VIDEO_HOLD_DURATION + VIDEO_GRACE) return;

      // Mobile Safari fetches nothing until play() is called, so playback starts at once and seeks once it can.
      transitionVideos.forEach((video) => {
        const word = video.closest(".page-transition__word");
        const syncToTimeline = () => {
          if (generation !== videoGeneration || video.readyState < 1) return;
          const clipEnd = video.duration || VIDEO_HOLD_DURATION / 1000;
          const target = Math.max(0, Math.min((Date.now() - timelineStart) / 1000, clipEnd - VIDEO_MIN_SHOW / 1000));
          if (Math.abs(video.currentTime - target) < 0.12) return;
          try {
            video.currentTime = target;
          } catch {
            // Seeking waits for metadata; loadedmetadata calls this again.
          }
        };
        video.playbackRate = 1;
        syncToTimeline();
        video.addEventListener("loadedmetadata", syncToTimeline, { once: true });
        video
          .play()
          .then(() => {
            if (generation !== videoGeneration) return;
            syncToTimeline();
            videoShownAt = videoShownAt || Date.now();
            video.classList.add("is-active");
            word?.classList.add("has-active-video");
          })
          .catch((error) => {
            if (generation === videoGeneration && error?.name === "NotAllowedError") videoRefused = true;
            video.classList.remove("is-active");
            word?.classList.remove("has-active-video");
          });
      });
    };

    const revealPage = (forceNewTimeline = false) => {
      clearTransitionTimers();
      stopTransitionVideos();
      navigating = false;
      const storedStart = forceNewTimeline ? 0 : readTimelineStart();
      const timelineStart = storedStart || Date.now();
      if (!storedStart) writeTimelineStart(timelineStart);

      overlay.classList.remove("is-closing");
      overlay.classList.add("is-visible", "is-covered", "is-opening", "is-preparing");
      overlay.style.setProperty("--transition-open-duration", `${OPEN_DURATION}ms`);
      lockPage(true);
      startTransitionVideos(timelineStart);

      void overlay.offsetWidth;
      overlay.classList.remove("is-preparing");

      const startOpening = () => {
        stopTransitionVideos();
        const remaining = Math.max(OPEN_DURATION, TOTAL_DURATION - (Date.now() - timelineStart));
        overlay.style.setProperty("--transition-open-duration", `${remaining}ms`);
        overlay.classList.remove("is-covered");
        updateScreenEdge();
        markCurtainOpen();
        schedule(() => {
          overlay.classList.remove("is-visible", "is-opening");
          overlay.style.removeProperty("--transition-open-duration");
          lockPage(false);
          clearTimelineStart();
        }, remaining);
      };

      const latest = timelineStart + VIDEO_HOLD_DURATION + VIDEO_GRACE;
      const openWhenSeen = () => {
        const now = Date.now();
        const due = videoShownAt ? videoShownAt + VIDEO_MIN_SHOW : latest;
        if (reducedMotion || videoRefused || now >= Math.min(due, latest)) startOpening();
        else schedule(openWhenSeen, Math.min(due, latest) - now);
      };
      schedule(openWhenSeen, Math.max(0, VIDEO_HOLD_DURATION - (Date.now() - timelineStart)));
    };

    const closeForNavigation = (destination) => {
      if (navigating) return;
      navigating = true;
      clearTransitionTimers();
      stopTransitionVideos();
      document.dispatchEvent(new Event("portfolio:close-menu"));
      document.dispatchEvent(new Event("portfolio:navigate"));
      const timelineStart = Date.now();
      writeTimelineStart(timelineStart);

      overlay.classList.remove("is-opening", "is-covered", "is-preparing");
      overlay.classList.add("is-visible", "is-closing");
      overlay.style.setProperty("--transition-close-duration", `${CLOSE_DURATION}ms`);
      lockPage(true);
      startTransitionVideos(timelineStart);

      void overlay.offsetWidth;
      overlay.classList.add("is-covered");
      updateScreenEdge();
      schedule(() => {
        const releaseBlockedNavigation = () => {
          if (!navigating || document.hidden) return;
          clearTransitionTimers();
          stopTransitionVideos();
          overlay.classList.remove("is-visible", "is-closing", "is-covered");
          overlay.style.removeProperty("--transition-close-duration");
          lockPage(false);
          clearTimelineStart();
          navigating = false;
        };

        try {
          window.location.assign(destination.href);
          schedule(releaseBlockedNavigation, TOTAL_DURATION - CLOSE_DURATION + 500);
        } catch {
          releaseBlockedNavigation();
        }
      }, CLOSE_DURATION);
    };

    document.addEventListener("click", (event) => {
      const link = event.target.closest("a[href]");
      if (!link || event.defaultPrevented) return;
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if ((link.target && link.target !== "_self") || link.hasAttribute("download")) return;

      const rawHref = link.getAttribute("href");
      if (!rawHref || rawHref.startsWith("#") || rawHref.startsWith("mailto:") || rawHref.startsWith("tel:")) return;

      let destination;
      try {
        destination = new URL(link.href, window.location.href);
      } catch {
        return;
      }

      const sameDocument =
        destination.pathname === window.location.pathname &&
        destination.search === window.location.search;
      const isLocalNavigation =
        destination.protocol === window.location.protocol &&
        (window.location.protocol === "file:" || destination.origin === window.location.origin);
      if (!isLocalNavigation || (sameDocument && destination.hash)) return;
      if (destination.href === window.location.href) return;

      event.preventDefault();
      closeForNavigation(destination);
    });

    window.addEventListener("pageshow", (event) => {
      if (!event.persisted) return;
      document.dispatchEvent(new Event("portfolio:close-menu"));
      revealPage(true);
    });

    window.addEventListener("pagehide", () => {
      clearTransitionTimers();
      stopTransitionVideos();
    });
    window.addEventListener("resize", applyVideoMasks, { passive: true });
    words.forEach((word) => {
      const mark = qs(".page-transition__word-mark", word);
      if (!mark) return;
      if (mark.complete) applyVideoMasks();
      else mark.addEventListener("load", applyVideoMasks, { once: true });
    });
    applyVideoMasks();
    revealPage();
  }

  function initCursor() {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const cursor = qs(".site-cursor");
    const label = qs(".site-cursor__text", cursor);
    if (!cursor || !label) return;

    const target = { x: -100, y: -100 };
    const current = { x: -100, y: -100 };
    let animationFrame = null;
    let animateUntil = 0;

    const requestCursorFrame = (duration = 120) => {
      animateUntil = Math.max(animateUntil, performance.now() + duration);
      if (!animationFrame) animationFrame = requestAnimationFrame(animate);
    };

    window.addEventListener(
      "pointermove",
      (event) => {
        target.x = event.clientX;
        target.y = event.clientY;
        cursor.classList.toggle(
          "is-over-advance",
          Boolean(event.target.closest?.(".project-card__advance"))
        );
        cursor.classList.add("is-visible");
        requestCursorFrame();
      },
      { passive: true }
    );

    document.addEventListener("pointerdown", () => {
      cursor.classList.add("is-down");
      requestCursorFrame(350);
    });
    document.addEventListener("pointerup", () => {
      cursor.classList.remove("is-down");
      requestCursorFrame(350);
    });
    document.addEventListener("mouseleave", () => {
      cursor.classList.remove("is-visible");
      requestCursorFrame(250);
    });

    qsa("a, button, [data-cursor]").forEach((element) => {
      element.addEventListener("mouseenter", () => {
        const text =
          element.dataset.cursor ||
          (element.matches(".project-card, .work-project__lead, .related-card")
            ? "View Project"
            : "");
        const isProjectLabel = text.trim().toLowerCase() === "view project";
        if (isProjectLabel) {
          label.innerHTML = "VIEW<br>PROJECT";
        } else {
          label.textContent = text;
        }
        cursor.classList.toggle("is-project", isProjectLabel);
        cursor.classList.add("is-hovering");
        requestCursorFrame(500);
      });
      element.addEventListener("mouseleave", () => {
        label.textContent = "";
        cursor.classList.remove("is-hovering", "is-project");
        requestCursorFrame(500);
      });
    });

    function animate(time) {
      current.x += (target.x - current.x) * 0.18;
      current.y += (target.y - current.y) * 0.18;
      const half = cursor.offsetWidth / 2;
      cursor.style.transform = `translate3d(${current.x - half}px, ${current.y - half}px, 0)`;
      const moving =
        Math.abs(target.x - current.x) > 0.08 ||
        Math.abs(target.y - current.y) > 0.08;
      if (moving || time < animateUntil) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        current.x = target.x;
        current.y = target.y;
        animationFrame = null;
      }
    }
  }

  function initReveal() {
    const targets = qsa(".reveal-section, .project-gallery__item");
    if (!targets.length) return;

    if (reducedMotion || !("IntersectionObserver" in window)) {
      targets.forEach((target) => target.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );

    targets.forEach((target) => observer.observe(target));
  }

  function finishLoading() {
    document.body.classList.add("is-ready");
    requestAnimationFrame(() => {
      initCursor();
      whenCurtainOpens(initReveal);
    });
  }

  function onceInView(element, callback, options = {}) {
    if (!("IntersectionObserver" in window)) {
      callback();
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        callback();
      },
      { threshold: options.threshold ?? 0.3, rootMargin: options.rootMargin || "0px" }
    );
    observer.observe(element);
  }

  function initViewportVideos(root = document) {
    const videos = qsa("video[autoplay]", root);
    if (!videos.length || !("IntersectionObserver" in window)) return;

    const visibility = new WeakMap();
    const syncPlayback = (video) => {
      if (document.hidden || !visibility.get(video)) {
        video.pause();
      } else {
        video.play().catch(() => {});
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          visibility.set(entry.target, entry.isIntersecting);
          syncPlayback(entry.target);
        });
      },
      { threshold: 0.04, rootMargin: "8% 0px 8% 0px" }
    );

    videos.forEach((video) => observer.observe(video));
    document.addEventListener("visibilitychange", () => {
      videos.forEach(syncPlayback);
    });
  }

  function renderMedia(item, options = {}) {
    const {
      className = "",
      autoplay = false,
      controls = false,
      loading = "lazy",
      defer = false,
    } = options;
    if (item.type === "sequence") {
      const frames = item.sources || [];
      return `
        <div class="lab-media-sequence ${className}" role="img" aria-label="${escapeHTML(item.title)}">
          ${frames
            .map(
              (source, index) => `
                <img
                  class="lab-media-sequence__frame${index === 0 ? " is-active" : ""}"
                  data-src="${escapeHTML(webImage(source))}"
                  alt="${escapeHTML(item.title)} — ${String(index + 1).padStart(2, "0")}"
                  loading="lazy"
                  decoding="async"
                >
              `
            )
            .join("")}
        </div>
      `;
    }
    const source = escapeHTML(item.type === "video" ? webVideo(item.src) : webImage(item.src));
    if (item.type === "video") {
      return `
        <video
          class="${className}"
          ${autoplay && !defer ? "autoplay" : ""}
          ${defer ? `data-src="${source}"` : `src="${source}"`}
          muted
          loop
          playsinline
          ${controls ? "controls" : ""}
          preload="${defer ? "none" : "metadata"}"
        ></video>
      `;
    }
    return `<img class="${className}" ${defer ? `data-src="${source}"` : `src="${source}"`} alt="${escapeHTML(item.title)}" loading="${loading}" decoding="async">`;
  }

  function renderShortAbout() {
    const container = qs("#home-about-copy");
    if (!container) return;
    container.innerHTML = DATA.about.short
      .map((paragraph) => `<p>${escapeHTML(paragraph)}</p>`)
      .join("");
  }

  function createProjectCard(project, index) {
    const gallery = project.images || [];
    const media = project.cover
      ? `<img class="is-front" src="${escapeHTML(webImage(project.cover))}" alt="${escapeHTML(project.title)}" loading="${index < 2 ? "eager" : "lazy"}" decoding="async" draggable="false"${coverStyle(project)}>
         <img class="is-back" alt="" decoding="async" aria-hidden="true" draggable="false"${coverStyle(project)}>`
      : `<div class="project-card__placeholder"><span>Visuals coming soon</span></div>`;

    return `
      <article class="project-card" data-project-index="${index}">
        <a class="project-card__link" href="${projectURL(project)}" data-cursor="View Project" draggable="false">
          <figure class="project-card__media">
            ${media}
            <span class="project-card__media-count">${String(gallery.length).padStart(2, "0")} frames</span>
            <span class="project-card__play-state" aria-hidden="true"><i></i>Playing sequence</span>
            <span class="project-card__progress" aria-hidden="true"></span>
          </figure>
          <div class="project-card__footer">
            <div>
              <p class="project-card__client">${escapeHTML(project.title)}</p>
              <p class="project-card__title">${escapeHTML(project.subtitle)}</p>
            </div>
            <span class="project-card__year">${escapeHTML(project.year)}</span>
          </div>
        </a>
        <button
          class="project-card__advance"
          type="button"
          aria-label="Show ${escapeHTML(project.title)} as the active project"
        ><span aria-hidden="true">→</span></button>
      </article>
    `;
  }

  function initProjectCardCycling(container) {
    const FRAME_HOLD_MS = 2200;
    const CROSSFADE_MS = 550;
    const cards = qsa(".project-card", container);
    let activeIndex = -1;
    let frame = 0;
    let timer = null;
    let loadToken = 0;
    let isInView = false;

    const stopTimer = () => {
      window.clearTimeout(timer);
      timer = null;
    };

    const preloadFrame = (source) => {
      if (!source || !isInView) return;
      const preload = new Image();
      preload.decoding = "async";
      preload.src = webImage(source);
    };

    const resetCard = (index) => {
      const card = cards[index];
      if (!card) return;

      const project = DATA.projects[Number(card.dataset.projectIndex)];
      const front = qs(".project-card__media img.is-front", card);
      const back = qs(".project-card__media img.is-back", card);
      const counter = qs(".project-card__media-count", card);
      const progress = qs(".project-card__progress", card);

      card.classList.remove("is-playing", "is-changing");
      if (front && project) {
        front.src = webImage(project.cover || project.images?.[0]);
        front.alt = project.title;
        front.classList.add("is-front");
        front.classList.remove("is-back");
        if (back) {
          back.onload = null;
          back.onerror = null;
          back.classList.add("is-back");
          back.classList.remove("is-front");
          back.removeAttribute("src");
        }
      }
      if (counter) {
        counter.textContent = `${String(project?.images?.length || 0).padStart(2, "0")} frames`;
      }
      progress?.style.removeProperty("--frame-progress");
    };

    const scheduleNextFrame = (index, transitionDelay = 0) => {
      stopTimer();
      if (
        reducedMotion ||
        !isInView ||
        document.hidden ||
        activeIndex !== index
      ) {
        return;
      }

      timer = window.setTimeout(() => {
        if (
          !isInView ||
          document.hidden ||
          activeIndex !== index
        ) {
          return;
        }
        showFrame(frame + 1);
      }, FRAME_HOLD_MS + transitionDelay);
    };

    const showFrame = (nextFrame, immediate = false) => {
      const index = activeIndex;
      const card = cards[index];
      if (!card) return;

      const project = DATA.projects[Number(card.dataset.projectIndex)];
      const images = project?.images || [];
      const front = qs(".project-card__media img.is-front", card);
      const back = qs(".project-card__media img.is-back", card);
      const counter = qs(".project-card__media-count", card);
      const progress = qs(".project-card__progress", card);
      if (!front || !images.length) return;

      const targetFrame = (nextFrame + images.length) % images.length;
      const source = images[targetFrame];
      const sourceURL = webImage(source);
      const token = ++loadToken;

      const commitFrame = (visibleImage = front, crossfaded = false) => {
        if (activeIndex !== index || token !== loadToken) return;
        frame = targetFrame;
        visibleImage.alt = `${project.title} frame ${frame + 1}`;
        counter.textContent = `${String(frame + 1).padStart(2, "0")} / ${String(images.length).padStart(2, "0")}`;
        progress?.style.setProperty(
          "--frame-progress",
          `${((frame + 1) / images.length) * 100}%`
        );
        card.classList.remove("is-changing");
        preloadFrame(images[(frame + 1) % images.length]);
        scheduleNextFrame(index, crossfaded && !immediate ? CROSSFADE_MS : 0);
      };

      if (front.getAttribute("src") === sourceURL) {
        commitFrame(front);
        return;
      }

      if (!back) {
        front.onload = () => commitFrame(front);
        front.onerror = () => {
          if (activeIndex !== index || token !== loadToken) return;
          frame = targetFrame;
          scheduleNextFrame(index);
        };
        front.src = sourceURL;
        return;
      }

      const reveal = () => {
        if (activeIndex !== index || token !== loadToken) return;
        back.classList.add("is-front");
        front.classList.remove("is-front");
        front.classList.add("is-back");
        back.classList.remove("is-back");
        commitFrame(back, true);
      };

      if (back.getAttribute("src") === sourceURL && back.complete) {
        reveal();
        return;
      }

      back.onload = reveal;
      back.onerror = () => {
        if (activeIndex !== index || token !== loadToken) return;
        frame = targetFrame;
        card.classList.remove("is-changing");
        scheduleNextFrame(index);
      };
      card.classList.add("is-changing");
      back.src = sourceURL;
    };

    const syncPlayback = () => {
      const card = cards[activeIndex];
      if (!card) return;
      const project = DATA.projects[Number(card.dataset.projectIndex)];
      const image = qs(".project-card__media img.is-front", card);

      stopTimer();
      if (
        !isInView ||
        document.hidden ||
        !image ||
        !project?.images?.length
      ) {
        card.classList.remove("is-playing", "is-changing");
        return;
      }

      card.classList.add("is-playing");
      showFrame(frame, true);
    };

    const setActive = (index) => {
      if (index === activeIndex || !cards[index]) return;

      stopTimer();
      loadToken += 1;
      if (activeIndex >= 0) resetCard(activeIndex);

      activeIndex = index;
      frame = 0;
      const card = cards[activeIndex];
      const project = DATA.projects[Number(card.dataset.projectIndex)];
      const image = qs(".project-card__media img.is-front", card);
      if (!image || !project?.images?.length) return;

      syncPlayback();
    };

    setActive(0);
    const section = container.closest(".home-work");
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          isInView = entry.isIntersecting;
          section?.classList.toggle("is-in-view", isInView);
          syncPlayback();
        },
        { threshold: 0.04, rootMargin: "8% 0px 8% 0px" }
      );
      observer.observe(container);
    } else {
      isInView = true;
      section?.classList.add("is-in-view");
      syncPlayback();
    }
    document.addEventListener("visibilitychange", syncPlayback);
    window.addEventListener("pagehide", stopTimer, { once: true });

    return { setActive };
  }

  function renderHomeProjects() {
    const container = qs("#home-projects");
    if (!container) return;

    container.innerHTML = DATA.projects
      .map((project, index) => createProjectCard(project, index))
      .join("");

    const prev = qs("#projects-prev");
    const next = qs("#projects-next");
    const count = qs("#projects-count");
    const cards = qsa(".project-card", container);
    const playback = initProjectCardCycling(container);
    let scrollFrame = null;
    let activeIndex = 0;
    let dragState = null;
    let suppressClick = false;

    const getNearestCardIndex = () => {
      if (!cards.length) return 0;
      const firstOffset = cards[0].offsetLeft;
      const leadingEdge = container.scrollLeft + firstOffset;
      let nearest = 0;
      let distance = Infinity;
      cards.forEach((card, index) => {
        const nextDistance = Math.abs(leadingEdge - card.offsetLeft);
        if (nextDistance < distance) {
          distance = nextDistance;
          nearest = index;
        }
      });
      return nearest;
    };

    const updateActiveProject = () => {
      if (!cards.length || !count) return;
      const nearest = getNearestCardIndex();
      activeIndex = nearest;
      count.textContent = `${String(nearest + 1).padStart(2, "0")} / ${String(cards.length).padStart(2, "0")}`;
      cards.forEach((card, index) => {
        card.classList.toggle("is-next", index === nearest + 1);
      });
      playback.setActive(nearest);
    };

    const scrollToCard = (index, behavior = reducedMotion ? "auto" : "smooth") => {
      if (!cards[index]) return;
      const left = cards[index].offsetLeft - cards[0].offsetLeft;
      container.scrollTo({
        left,
        behavior,
      });
    };

    const scrollByCard = (direction) => {
      const lastLeadingIndex = Math.max(0, cards.length - 1);
      const targetIndex = Math.min(lastLeadingIndex, Math.max(0, activeIndex + direction));
      scrollToCard(targetIndex);
    };

    qsa(".project-card__advance", container).forEach((button, index) => {
      button.addEventListener("pointermove", (event) => {
        const bounds = button.getBoundingClientRect();
        const inset = Math.min(64, bounds.width / 4, bounds.height / 4);
        const x = Math.max(inset, Math.min(bounds.width - inset, event.clientX - bounds.left));
        const y = Math.max(inset, Math.min(bounds.height - inset, event.clientY - bounds.top));
        button.style.setProperty("--arrow-x", `${x}px`);
        button.style.setProperty("--arrow-y", `${y}px`);
      });
      button.addEventListener("pointerleave", () => {
        button.style.removeProperty("--arrow-x");
        button.style.removeProperty("--arrow-y");
      });
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        scrollToCard(index);
      });
    });

    const finishDrag = (event) => {
      if (!dragState || event.pointerId !== dragState.pointerId) return;
      const didDrag = dragState.dragged;
      try {
        if (container.hasPointerCapture?.(event.pointerId)) {
          container.releasePointerCapture(event.pointerId);
        }
      } catch {
        // Pointer capture can already be released when the pointer leaves the viewport.
      }
      container.classList.remove("is-dragging");
      dragState = null;

      if (!didDrag) return;
      suppressClick = true;
      scrollToCard(getNearestCardIndex());
      window.setTimeout(() => {
        suppressClick = false;
      }, 0);
    };

    container.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      if (event.target.closest(".project-card__advance, .round-control")) return;
      if (event.pointerType === "touch") return;

      dragState = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startScrollLeft: container.scrollLeft,
        dragged: false,
      };
    });

    const onPointerMove = (event) => {
      if (!dragState || event.pointerId !== dragState.pointerId) return;
      const delta = event.clientX - dragState.startX;
      if (!dragState.dragged && Math.abs(delta) < 6) return;

      if (!dragState.dragged) {
        dragState.dragged = true;
        container.classList.add("is-dragging");
        try {
          container.setPointerCapture?.(event.pointerId);
        } catch {
          // Scrolling still works when capture is unavailable.
        }
      }

      event.preventDefault();
      container.scrollLeft = dragState.startScrollLeft - delta;
    };

    container.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointermove", onPointerMove);

    container.addEventListener("pointerup", finishDrag);
    window.addEventListener("pointerup", finishDrag);
    container.addEventListener("pointercancel", finishDrag);
    window.addEventListener("pointercancel", finishDrag);
    container.addEventListener("dragstart", (event) => event.preventDefault());
    container.addEventListener(
      "click",
      (event) => {
        if (!suppressClick) return;
        event.preventDefault();
        event.stopImmediatePropagation();
      },
      true
    );

    prev?.addEventListener("click", () => scrollByCard(-1));
    next?.addEventListener("click", () => scrollByCard(1));
    container.addEventListener(
      "scroll",
      () => {
        if (scrollFrame) cancelAnimationFrame(scrollFrame);
        scrollFrame = requestAnimationFrame(updateActiveProject);
      },
      { passive: true }
    );
    updateActiveProject();
  }

  function renderHomeLab() {
    const slots = [qs("#lab-inline-1"), qs("#lab-inline-2"), qs("#lab-inline-3")];
    const items = ["lab-01", "lab-02", "lab-10"].map((id) => DATA.lab.find((item) => item.id === id));
    slots.forEach((slot, index) => {
      if (!slot || !items[index]) return;
      slot.innerHTML = renderMedia(items[index], {
        autoplay: items[index].type === "video",
      });
    });
  }

  function renderHome() {
    const intro = qs("#intro-video");
    if (intro) {
      intro.removeAttribute("poster");
      intro.poster = "";
      const revealIntro = () => intro.classList.add("is-playing");
      intro.addEventListener("playing", revealIntro);
      intro.play().catch(() => revealIntro());
      whenCurtainOpens(() => {
        try {
          intro.currentTime = 0;
        } catch {
          // Without metadata the clip is still at its first frame.
        }
        intro.play().catch(() => {});
      });
    }
    renderShortAbout();
    renderHomeProjects();
    renderHomeLab();
    finishLoading();
    requestAnimationFrame(() => initViewportVideos());
  }

  function renderWork() {
    const container = qs("#work-projects");
    const total = qs("#work-total");
    if (!container) return;

    if (total) total.textContent = `${String(DATA.projects.length).padStart(2, "0")} Projects`;

    container.innerHTML = DATA.projects
      .map((project, projectIndex) => {
        const lead = project.cover
          ? `<img src="${escapeHTML(webImage(project.cover))}" alt="${escapeHTML(project.title)}" loading="${projectIndex < 2 ? "eager" : "lazy"}" decoding="async" fetchpriority="${projectIndex === 0 ? "high" : "low"}"${coverStyle(project)}>`
          : `<div class="work-project__placeholder"><span>Visual documentation coming soon</span></div>`;

        const rail = project.images.length
          ? project.images
              .map(
                (src, index) => `
                  <button
                    class="work-project__thumb${index === 0 ? " is-active" : ""}"
                    type="button"
                    data-full-src="${escapeHTML(webImage(src))}"
                    data-frame="${index + 1}"
                    data-cursor="Open"
                    aria-label="Preview ${escapeHTML(project.title)} image ${index + 1}"
                    aria-pressed="${index === 0 ? "true" : "false"}"
                  >
                    <img src="${escapeHTML(webImage(src, "sm"))}" alt="" loading="lazy" decoding="async" fetchpriority="low">
                    <span>${String(index + 1).padStart(2, "0")}</span>
                  </button>
                `
              )
              .join("")
          : `<div class="work-project__thumb"><div class="work-project__placeholder">No images supplied</div></div>`;

        return `
          <article
            class="work-project reveal-section"
            id="${escapeHTML(project.slug)}"
            data-personas="${escapeHTML((project.personas || []).join(" "))}"
          >
            <header class="work-project__header">
              <span class="work-project__number">${pad2(projectIndex + 1)}</span>
              <a href="${projectURL(project)}"><h2 class="work-project__title">${escapeHTML(project.title)}</h2></a>
              <span class="work-project__discipline">${escapeHTML(project.discipline)}</span>
              <span class="work-project__year">${escapeHTML(project.year)}</span>
            </header>
            <a class="work-project__lead" href="${projectURL(project)}" data-cursor="View project">
              ${lead}
              <span class="work-project__open">↗</span>
            </a>
            <div class="work-project__rail" aria-label="${escapeHTML(project.title)} image strip">
              ${rail}
            </div>
          </article>
        `;
      })
      .join("");

    qsa(".work-project", container).forEach((article) => {
      const leadImage = qs(".work-project__lead img", article);
      if (!leadImage) return;
      const thumbs = qsa(".work-project__thumb[data-full-src]", article);
      let loadToken = 0;

      thumbs.forEach((thumb) => {
        thumb.addEventListener("click", () => {
          const source = thumb.dataset.fullSrc;
          const token = ++loadToken;
          thumbs.forEach((item) => {
            const active = item === thumb;
            item.classList.toggle("is-active", active);
            item.setAttribute("aria-pressed", String(active));
          });
          if (leadImage.getAttribute("src") === source) return;

          leadImage.classList.add("is-swapping");
          const preloaded = new Image();
          preloaded.decoding = "async";
          preloaded.onload = () => {
            if (token !== loadToken) return;
            leadImage.src = source;
            leadImage.alt = `${article.querySelector(".work-project__title")?.textContent || "Project"} — image ${thumb.dataset.frame}`;
            requestAnimationFrame(() => leadImage.classList.remove("is-swapping"));
          };
          preloaded.onerror = () => {
            if (token === loadToken) leadImage.classList.remove("is-swapping");
          };
          preloaded.src = source;
        });
      });
    });

    initWorkLens(container, total);
    finishLoading();
  }

  function initWorkLens(container, total) {
    const lens = qs("#work-lens");
    if (!lens) return;

    const articles = qsa(".work-project", container);
    const personas = DATA.about.avatars.filter((avatar) =>
      DATA.projects.some((project) => project.personas?.includes(avatar.id))
    );
    if (!personas.length) {
      lens.remove();
      return;
    }

    const countFor = (id) => DATA.projects.filter((project) => project.personas?.includes(id)).length;
    lens.innerHTML = `
      <span class="work-lens__label">View through</span>
      <div class="work-lens__chips">
        <button class="work-lens__chip is-active" type="button" data-persona="" aria-pressed="true">
          <span>All work</span><sup>${pad2(DATA.projects.length)}</sup>
        </button>
        ${personas
          .map(
            (avatar) => `
              <button class="work-lens__chip" type="button" data-persona="${escapeHTML(avatar.id)}" aria-pressed="false">
                <img src="${escapeHTML(webImage(avatar.poster, "sm"))}" alt="" loading="lazy" decoding="async">
                <span>${escapeHTML(avatar.label.replace(/^The\s+/i, ""))}</span><sup>${pad2(countFor(avatar.id))}</sup>
              </button>
            `
          )
          .join("")}
      </div>
      <p class="work-lens__lab" hidden>More experiments live in the <a href="lab.html">Lab <span>→</span></a></p>
    `;

    const chips = qsa(".work-lens__chip", lens);
    const labNote = qs(".work-lens__lab", lens);
    const setPersona = (id) => {
      let visible = 0;
      chips.forEach((chip) => {
        const active = chip.dataset.persona === id;
        chip.classList.toggle("is-active", active);
        chip.setAttribute("aria-pressed", String(active));
      });
      articles.forEach((article) => {
        const matches = !id || article.dataset.personas.split(" ").includes(id);
        article.classList.toggle("is-collapsed", !matches);
        if (matches) visible += 1;
      });
      if (total) {
        total.textContent = id
          ? `${pad2(visible)} of ${pad2(articles.length)} Projects`
          : `${pad2(articles.length)} Projects`;
      }
      if (labNote) labNote.hidden = id !== "experimenter";
    };

    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        const id = chip.dataset.persona;
        setPersona(chip.classList.contains("is-active") && id ? "" : id);
      });
    });
  }

  function renderLab() {
    const mediaContainer = qs("#lab-fixed-media");
    const list = qs("#lab-list");
    if (!mediaContainer || !list) {
      finishLoading();
      return;
    }

    mediaContainer.innerHTML = DATA.lab
      .map((item, index) =>
        renderMedia(item, {
          className: index === 0 ? "is-active" : "",
          autoplay: index === 0 && item.type === "video",
          loading: index < 2 ? "eager" : "lazy",
          defer: index > 1,
        })
      )
      .join("");

    const groupedBlocks = [];
    let currentCategory = "";
    DATA.lab.forEach((item, index) => {
      if (item.category !== currentCategory) {
        currentCategory = item.category;
        groupedBlocks.push(`<p class="lab-index__group">${escapeHTML(currentCategory)}</p>`);
      }
      groupedBlocks.push(`
        <button
          class="lab-index__item${index === 0 ? " is-active" : ""}"
          type="button"
          data-lab-index="${index}"
          data-index="${String(index + 1).padStart(2, "0")}"
          aria-pressed="${index === 0 ? "true" : "false"}"
        >
          ${escapeHTML(item.title)}
        </button>
      `);
    });
    list.innerHTML = groupedBlocks.join("");

    const media = [...mediaContainer.children];
    const mediaColumn = mediaContainer.closest(".lab-index__media-col");
    const label = qs("#lab-label");
    const labelMeta = label && qs(".lab-index__label-meta", label);
    const labelText = label && qs(".lab-index__label-text", label);
    const thread = qs("#lab-thread");
    const threadLine = thread && qs(".lab-thread__line", thread);
    const threadKnot = thread && qs(".lab-thread__knot", thread);
    const desktopQuery = window.matchMedia("(min-width: 801px)");
    const inspectQuery = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 801px)");
    const loupe = document.createElement("span");
    loupe.className = "lab-loupe";
    loupe.setAttribute("aria-hidden", "true");
    mediaContainer.append(loupe);
    const LOUPE_ZOOM = 2;
    let labelIndex = -1;
    let labelTimer = null;
    let threadFrame = null;
    let threadSequence = -1;
    let inspecting = false;
    const buttons = qsa(".lab-index__item", list);
    const orderedIndexes = buttons.map((button, sequenceIndex) => {
      button.dataset.labSequence = String(sequenceIndex);
      button.dataset.index = String(sequenceIndex + 1).padStart(2, "0");
      return Number(button.dataset.labIndex);
    });
    let activeSequenceIndex = 0;
    let targetSequenceIndex = 0;
    let transitionTimer = null;
    let scrollFrame = null;
    let scrollFallback = null;
    let cinematicTimer = null;
    let cinematicElement = null;
    let cinematicFrameIndex = 0;

    const ensureMediaLoaded = (mediaIndex) => {
      const element = media[mediaIndex];
      if (element?.classList.contains("lab-media-sequence")) {
        qsa(".lab-media-sequence__frame", element).forEach((frame) => {
          if (!frame.dataset.src) return;
          frame.src = frame.dataset.src;
          delete frame.dataset.src;
        });
        return;
      }
      const deferredSource = element?.dataset.src;
      if (!element || !deferredSource) return;
      element.src = deferredSource;
      delete element.dataset.src;
      if (element instanceof HTMLVideoElement) element.load();
    };

    const pauseCinematicSequence = () => {
      window.clearTimeout(cinematicTimer);
      cinematicTimer = null;
    };

    const resetCinematicSequence = () => {
      pauseCinematicSequence();
      if (cinematicElement) {
        const frames = qsa(".lab-media-sequence__frame", cinematicElement);
        frames.forEach((frame, index) => frame.classList.toggle("is-active", index === 0));
      }
      cinematicElement = null;
      cinematicFrameIndex = 0;
    };

    const scheduleCinematicFrame = () => {
      pauseCinematicSequence();
      if (!cinematicElement || reducedMotion || document.hidden || inspecting) return;
      cinematicTimer = window.setTimeout(() => {
        const frames = qsa(".lab-media-sequence__frame", cinematicElement);
        if (!frames.length) return;
        cinematicFrameIndex = (cinematicFrameIndex + 1) % frames.length;
        frames.forEach((frame, index) =>
          frame.classList.toggle("is-active", index === cinematicFrameIndex)
        );
        scheduleThread();
        scheduleCinematicFrame();
      }, 2200);
    };

    const startCinematicSequence = (element) => {
      if (cinematicElement !== element) {
        resetCinematicSequence();
        cinematicElement = element;
        cinematicFrameIndex = 0;
        const frames = qsa(".lab-media-sequence__frame", element);
        frames.forEach((frame, index) => frame.classList.toggle("is-active", index === 0));
      }
      scheduleCinematicFrame();
    };

    const updateLabel = (index) => {
      if (!label || index === labelIndex) return;
      const firstLabel = labelIndex < 0;
      labelIndex = index;
      const item = DATA.lab[index];
      window.clearTimeout(labelTimer);
      label.classList.add("is-changing");
      labelTimer = window.setTimeout(
        () => {
          labelMeta.textContent = item?.note?.meta || item?.category || "";
          labelText.textContent = item?.note?.text || "";
          label.classList.remove("is-changing");
        },
        firstLabel || reducedMotion ? 0 : 220
      );
    };

    // Media is drawn with object-fit: contain, so the visible picture can be narrower than its box.
    const pictureRect = (element) => {
      const box = mediaContainer.getBoundingClientRect();
      let width = 0;
      let height = 0;
      if (element?.classList.contains("lab-media-sequence")) {
        const frames = qsa(".lab-media-sequence__frame", element);
        const frame = frames[cinematicElement === element ? cinematicFrameIndex : 0];
        width = frame?.naturalWidth || 0;
        height = frame?.naturalHeight || 0;
      } else if (element instanceof HTMLVideoElement) {
        width = element.videoWidth;
        height = element.videoHeight;
      } else if (element instanceof HTMLImageElement) {
        width = element.naturalWidth;
        height = element.naturalHeight;
      }
      if (!width || !height) return box;
      const scale = Math.min(box.width / width, box.height / height);
      const left = box.left + (box.width - width * scale) / 2;
      const top = box.top + (box.height - height * scale) / 2;
      return { left, top, right: left + width * scale, bottom: top + height * scale, width: width * scale };
    };

    const drawThread = () => {
      threadFrame = null;
      if (!thread || !threadLine || !threadKnot) return;
      const button = buttons[activeSequenceIndex];
      const box = pictureRect(media[orderedIndexes[activeSequenceIndex]]);
      const target = button?.getBoundingClientRect();
      const headerBottom = qs(".site-header")?.getBoundingClientRect().bottom || 0;
      const fontSize = button ? parseFloat(getComputedStyle(button).fontSize) : 0;
      const endY = target ? target.top + fontSize * 0.56 : -1;
      const visible =
        desktopQuery.matches &&
        target &&
        box.width > 0 &&
        box.bottom > headerBottom &&
        endY > headerBottom + 12 &&
        endY < window.innerHeight - 12;
      thread.classList.toggle("is-visible", Boolean(visible));
      if (!visible) return;

      const startX = box.right + 2;
      const startY = Math.min(box.bottom - 24, Math.max(box.top + 24, endY));
      const endX = target.left - 18;
      const span = endX - startX;
      const sag = Math.min(34, span * 0.14) + Math.abs(endY - startY) * 0.06;
      threadLine.setAttribute(
        "d",
        `M ${startX} ${startY} C ${startX + span * 0.38} ${startY + sag}, ${endX - span * 0.34} ${endY + sag}, ${endX} ${endY}`
      );
      threadKnot.setAttribute("cx", String(endX));
      threadKnot.setAttribute("cy", String(endY));

      if (threadSequence !== activeSequenceIndex) {
        threadSequence = activeSequenceIndex;
        thread.classList.remove("is-tied");
        void thread.getBoundingClientRect();
        thread.classList.add("is-tied");
      }
    };

    const scheduleThread = () => {
      if (!thread || threadFrame) return;
      threadFrame = requestAnimationFrame(drawThread);
    };

    const placeLoupe = (event) => {
      const frames = cinematicElement ? qsa(".lab-media-sequence__frame", cinematicElement) : [];
      const frame = frames[cinematicFrameIndex];
      const sequenceItem = DATA.lab[orderedIndexes[activeSequenceIndex]];
      if (!frame?.naturalWidth || !sequenceItem?.sources) {
        loupe.classList.remove("is-visible");
        return;
      }
      const box = mediaContainer.getBoundingClientRect();
      const scale = Math.min(box.width / frame.naturalWidth, box.height / frame.naturalHeight);
      const width = frame.naturalWidth * scale;
      const height = frame.naturalHeight * scale;
      const left = (box.width - width) / 2;
      const top = (box.height - height) / 2;
      const x = event.clientX - box.left;
      const y = event.clientY - box.top;
      const inside = x >= left && x <= left + width && y >= top && y <= top + height;
      loupe.classList.toggle("is-visible", inside);
      if (!inside) return;

      const source = mediaURL(sequenceItem.sources[cinematicFrameIndex]);
      if (loupe.dataset.src !== source) {
        loupe.dataset.src = source;
        loupe.style.backgroundImage = `url("${source}")`;
      }
      const size = loupe.offsetWidth;
      loupe.style.transform = `translate3d(${x - size / 2}px, ${y - size / 2}px, 0)`;
      loupe.style.backgroundSize = `${width * LOUPE_ZOOM}px ${height * LOUPE_ZOOM}px`;
      loupe.style.backgroundPosition = `${size / 2 - (x - left) * LOUPE_ZOOM}px ${size / 2 - (y - top) * LOUPE_ZOOM}px`;
    };

    const stopInspecting = (resume = false) => {
      if (!inspecting) return;
      inspecting = false;
      loupe.classList.remove("is-visible");
      document.body.classList.remove("is-inspecting");
      if (resume && cinematicElement) scheduleCinematicFrame();
    };

    const updateInspectable = (index) => {
      const inspectable = inspectQuery.matches && DATA.lab[index]?.type === "sequence";
      mediaColumn?.classList.toggle("is-inspectable", inspectable);
      if (!inspectable) stopInspecting();
    };

    mediaContainer.addEventListener("pointerenter", (event) => {
      if (event.pointerType !== "mouse" || !mediaColumn?.classList.contains("is-inspectable")) return;
      inspecting = true;
      pauseCinematicSequence();
      document.body.classList.add("is-inspecting");
      placeLoupe(event);
    });
    mediaContainer.addEventListener("pointermove", (event) => {
      if (inspecting) placeLoupe(event);
    });
    mediaContainer.addEventListener("pointerleave", () => stopInspecting(true));

    const activateSequence = (sequenceIndex) => {
      const safeSequence = Math.min(
        orderedIndexes.length - 1,
        Math.max(0, sequenceIndex)
      );
      const index = orderedIndexes[safeSequence];
      activeSequenceIndex = safeSequence;

      ensureMediaLoaded(index);
      ensureMediaLoaded(orderedIndexes[safeSequence - 1]);
      ensureMediaLoaded(orderedIndexes[safeSequence + 1]);

      const activeElement = media[index];
      if (activeElement?.classList.contains("lab-media-sequence")) {
        startCinematicSequence(activeElement);
      } else {
        resetCinematicSequence();
      }

      media.forEach((element, mediaIndex) => {
        const active = mediaIndex === index;
        element.classList.toggle("is-active", active);
        if (element instanceof HTMLVideoElement) {
          if (active && !document.hidden) element.play().catch(() => {});
          else element.pause();
        }
      });

      buttons.forEach((button) => {
        const active = Number(button.dataset.labIndex) === index;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });

      updateLabel(index);
      updateInspectable(index);
      scheduleThread();
    };

    const stepToTarget = () => {
      transitionTimer = null;
      if (activeSequenceIndex === targetSequenceIndex) return;
      activateSequence(
        activeSequenceIndex + Math.sign(targetSequenceIndex - activeSequenceIndex)
      );
      if (activeSequenceIndex !== targetSequenceIndex) {
        transitionTimer = window.setTimeout(stepToTarget, reducedMotion ? 0 : 90);
      }
    };

    const setTargetSequence = (sequenceIndex, immediate = false) => {
      targetSequenceIndex = Math.min(
        orderedIndexes.length - 1,
        Math.max(0, sequenceIndex)
      );

      if (immediate) {
        window.clearTimeout(transitionTimer);
        transitionTimer = null;
        activateSequence(targetSequenceIndex);
        return;
      }

      if (!transitionTimer && activeSequenceIndex !== targetSequenceIndex) {
        stepToTarget();
      }
    };

    const updateFromScroll = () => {
      scrollFrame = null;
      window.clearTimeout(scrollFallback);
      scrollFallback = null;
      const referenceY = window.innerHeight * (window.innerWidth <= 800 ? 0.69 : 0.52);
      const currentButton = buttons[targetSequenceIndex];
      const currentBounds = currentButton?.getBoundingClientRect();
      const currentDistance = currentBounds
        ? Math.abs(currentBounds.top + currentBounds.height / 2 - referenceY)
        : Infinity;
      let nearestSequence = targetSequenceIndex;
      let nearestDistance = currentDistance;

      buttons.forEach((button, sequenceIndex) => {
        const bounds = button.getBoundingClientRect();
        const distance = Math.abs(bounds.top + bounds.height / 2 - referenceY);
        if (distance + 28 < nearestDistance) {
          nearestDistance = distance;
          nearestSequence = sequenceIndex;
        }
      });

      setTargetSequence(nearestSequence);
    };

    const scheduleScrollUpdate = () => {
      if (scrollFrame) return;
      scrollFrame = requestAnimationFrame(updateFromScroll);
      scrollFallback = window.setTimeout(() => {
        if (!scrollFrame) return;
        cancelAnimationFrame(scrollFrame);
        scrollFrame = null;
        updateFromScroll();
      }, 80);
    };

    buttons.forEach((button, sequenceIndex) => {
      button.addEventListener("focus", () => setTargetSequence(sequenceIndex, true));
      button.addEventListener("click", () => setTargetSequence(sequenceIndex, true));
    });

    list.addEventListener("keydown", (event) => {
      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      let nextSequence = activeSequenceIndex;
      if (event.key === "ArrowDown") nextSequence += 1;
      if (event.key === "ArrowUp") nextSequence -= 1;
      if (event.key === "Home") nextSequence = 0;
      if (event.key === "End") nextSequence = buttons.length - 1;
      nextSequence = Math.min(buttons.length - 1, Math.max(0, nextSequence));
      setTargetSequence(nextSequence, true);
      buttons[nextSequence]?.focus({ preventScroll: true });
      buttons[nextSequence]?.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "center",
      });
    });

    const syncActiveMedia = () => {
      const index = orderedIndexes[activeSequenceIndex];
      const element = media[index];
      if (document.hidden) {
        pauseCinematicSequence();
        if (element instanceof HTMLVideoElement) element.pause();
        return;
      }
      if (element?.classList.contains("lab-media-sequence")) {
        startCinematicSequence(element);
      } else if (element instanceof HTMLVideoElement) {
        element.play().catch(() => {});
      }
    };
    const cleanUpLab = () => {
      window.clearTimeout(transitionTimer);
      window.clearTimeout(scrollFallback);
      if (scrollFrame) cancelAnimationFrame(scrollFrame);
      resetCinematicSequence();
      media.forEach((element) => {
        if (element instanceof HTMLVideoElement) element.pause();
      });
    };

    window.addEventListener("scroll", scheduleScrollUpdate, { passive: true });
    window.addEventListener("resize", scheduleScrollUpdate, { passive: true });
    window.addEventListener("scroll", scheduleThread, { passive: true });
    window.addEventListener("resize", scheduleThread, { passive: true });
    mediaContainer.addEventListener("load", scheduleThread, true);
    mediaContainer.addEventListener("loadedmetadata", scheduleThread, true);
    inspectQuery.addEventListener?.("change", () => updateInspectable(orderedIndexes[activeSequenceIndex]));
    document.addEventListener("visibilitychange", syncActiveMedia);
    window.addEventListener("pagehide", cleanUpLab, { once: true });

    activateSequence(0);
    requestAnimationFrame(updateFromScroll);
    whenCurtainOpens(() => {
      threadSequence = -1;
      scheduleThread();
    });

    finishLoading();
  }

  function initPersonaCinematics(container) {
    const panel = qs(".persona-panel", container);
    const video = qs(".persona-cinema__video", container);
    const title = qs(".persona-panel__title", container);
    const discipline = qs(".persona-panel__discipline", container);
    const statement = qs(".persona-panel__statement", container);
    const buttons = qsa(".persona-thumbnail", container);
    if (!panel || !video || !title || !discipline || !statement || !buttons.length) return;

    let activeIndex = 0;
    let loadToken = 0;
    let isInView = !("IntersectionObserver" in window);

    const syncPlayback = () => {
      const shouldPlay = isInView && !document.hidden;
      panel.classList.toggle("is-playing", shouldPlay);
      if (shouldPlay) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    };

    const updateProgress = () => {
      const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 1;
      panel.style.setProperty(
        "--persona-progress",
        String(Math.min(1, Math.max(0, video.currentTime / duration)))
      );
    };

    const setPersona = (index, force = false) => {
      const avatar = DATA.about.avatars[index];
      if (!avatar || (!force && index === activeIndex)) {
        syncPlayback();
        return;
      }

      activeIndex = index;
      const token = ++loadToken;
      panel.dataset.personaIndex = String(index);
      panel.classList.add("is-switching");
      panel.style.setProperty("--persona-progress", "0");

      buttons.forEach((button, buttonIndex) => {
        const active = buttonIndex === index;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });

      title.textContent = avatar.label;
      discipline.textContent = avatar.discipline;
      statement.textContent = avatar.statement;
      video.pause();
      video.poster = webImage(avatar.poster);
      video.setAttribute("aria-label", avatar.label);
      video.src = mediaURL(avatar.video);
      video.load();

      video.addEventListener(
        "loadeddata",
        () => {
          if (token !== loadToken) return;
          panel.classList.remove("is-switching");
          try {
            video.currentTime = 0;
          } catch {
            // The selected video is already at its initial frame.
          }
          syncPlayback();
        },
        { once: true }
      );
    };

    buttons.forEach((button, index) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        setPersona(index);
      });
      button.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        const next = (index + (event.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length;
        buttons[next].focus();
        setPersona(next);
      });
    });

    const frame = qs(".persona-cinema__frame", container);
    let swipeStart = null;
    frame?.addEventListener("pointerdown", (event) => {
      swipeStart = { x: event.clientX, y: event.clientY };
    });
    frame?.addEventListener("pointerup", (event) => {
      if (!swipeStart) return;
      const dx = event.clientX - swipeStart.x;
      const dy = event.clientY - swipeStart.y;
      swipeStart = null;
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
      setPersona((activeIndex + (dx < 0 ? 1 : -1) + buttons.length) % buttons.length);
    });
    frame?.addEventListener("pointercancel", () => {
      swipeStart = null;
    });

    video.addEventListener("timeupdate", updateProgress);
    video.addEventListener("loadedmetadata", updateProgress);
    video.addEventListener("error", () => {
      panel.classList.remove("is-switching");
      panel.classList.remove("is-playing");
    });

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          isInView = entry.isIntersecting && entry.intersectionRatio > 0.08;
          syncPlayback();
        },
        { threshold: [0, 0.08, 0.25, 0.5], rootMargin: "8% 0px 8% 0px" }
      );
      observer.observe(panel);
    }

    document.addEventListener("visibilitychange", syncPlayback);
    setPersona(0, true);
  }

  function renderAbout() {
    const text = qs("#extended-about");
    const collage = qs("#avatar-collage");

    if (text) {
      text.innerHTML = DATA.about.extended
        .split(/\s+/)
        .map((word) => `<span class="about-manifesto__word">${escapeHTML(word)} </span>`)
        .join("");

      const words = qsa(".about-manifesto__word", text);
      let scheduled = false;
      const illuminate = () => {
        const threshold = window.innerHeight * 0.7;
        words.forEach((word) => {
          word.classList.toggle("is-lit", word.getBoundingClientRect().top < threshold);
        });
        scheduled = false;
      };
      window.addEventListener(
        "scroll",
        () => {
          if (scheduled) return;
          scheduled = true;
          requestAnimationFrame(illuminate);
        },
        { passive: true }
      );
      illuminate();
    }

    const signature = qs("#about-signature");
    if (signature && DATA.about.signature) {
      signature.style.setProperty("--signature", cssURL(DATA.about.signature));
      whenCurtainOpens(() => onceInView(signature, () => signature.classList.add("is-signed"), { threshold: 0.6 }));
    } else {
      signature?.remove();
    }

    if (collage) {
      const avatar = DATA.about.avatars[0];
      collage.innerHTML = `
        <article
          class="persona-panel reveal-section"
          id="persona-selector"
          data-persona-index="0"
        >
          <div class="persona-panel__inner">
            <figure class="persona-cinema">
              <div class="persona-cinema__frame">
                <video
                  class="persona-cinema__video"
                  src="${escapeHTML(mediaURL(avatar.video))}"
                  poster="${escapeHTML(webImage(avatar.poster))}"
                  aria-label="${escapeHTML(avatar.label)}"
                  autoplay
                  muted
                  loop
                  playsinline
                  preload="metadata"
                ></video>
                <span class="persona-cinema__light" aria-hidden="true"></span>
                <span class="persona-cinema__grain" aria-hidden="true"></span>
                <span class="persona-cinema__progress" aria-hidden="true"></span>
              </div>
            </figure>
            <div class="persona-panel__copy" aria-live="polite">
              <h3 class="persona-panel__title">${escapeHTML(avatar.label)}</h3>
              <p class="persona-panel__discipline">${escapeHTML(avatar.discipline)}</p>
              <blockquote class="persona-panel__statement">${escapeHTML(avatar.statement)}</blockquote>
            </div>
            <nav class="persona-thumbnails" aria-label="Creative persona video selector">
              ${DATA.about.avatars
                .map(
                  (item, thumbnailIndex) => `
                    <button
                      class="persona-thumbnail${thumbnailIndex === 0 ? " is-active" : ""}"
                      type="button"
                      data-persona-index="${thumbnailIndex}"
                      aria-label="Show ${escapeHTML(item.label)}"
                      aria-pressed="${thumbnailIndex === 0 ? "true" : "false"}"
                    >
                      <img src="${escapeHTML(webImage(item.poster, "sm"))}" alt="" loading="lazy" decoding="async">
                    </button>
                  `
                )
                .join("")}
            </nav>
          </div>
        </article>
      `;

      initPersonaCinematics(collage);
    }

    finishLoading();

    if (window.location.hash === "#avatar-grid") {
      setTimeout(() => {
        qs("#avatar-grid")?.scrollIntoView({
          behavior: "auto",
          block: "start",
        });
      }, 0);
    }
  }

  function renderProject() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("slug");
    const project =
      DATA.projects.find((item) => item.slug === slug) || DATA.projects[0];
    const projectIndex = DATA.projects.indexOf(project);

    document.title = `${project.title} — Serap Yıldırım`;
    document.body.dataset.project = project.slug;
    if (project.tone) document.body.dataset.tone = project.tone;

    const hero = qs("#project-hero");
    const info = qs("#project-info");
    const signature = qs("#project-signature");
    const gallery = qs("#project-gallery");
    const related = qs("#related-projects");

    if (hero) {
      const visual = project.cover
        ? `<img src="${escapeHTML(webImage(project.cover))}" alt="${escapeHTML(project.title)}" fetchpriority="high"${coverStyle(project)}>`
        : `<div class="project-hero__placeholder">Visual documentation coming soon</div>`;
      hero.innerHTML = `
        <a class="project-hero__back" href="work.html">← All work</a>
        <figure class="project-hero__frame">
          ${visual}
          <figcaption class="project-hero__overlay">
            <span class="project-hero__eyebrow">${escapeHTML(project.discipline)} · ${escapeHTML(project.year)}</span>
            <h1 class="project-hero__title">${escapeHTML(project.title)}</h1>
          </figcaption>
        </figure>
      `;
    }

    if (info) {
      info.innerHTML = `
        <dl class="project-info__meta">
          <dt>Project</dt><dd>${pad2(projectIndex + 1)} / ${pad2(DATA.projects.length)}</dd>
          <dt>Client</dt><dd>${escapeHTML(project.client)}</dd>
          <dt>Year</dt><dd>${escapeHTML(project.year)}</dd>
          <dt>Role</dt><dd>${escapeHTML(project.role)}</dd>
          <dt>Discipline</dt><dd>${escapeHTML(project.discipline)}</dd>
          ${
            project.materials?.length
              ? `<dt>Materials</dt><dd>${project.materials.map(escapeHTML).join(" · ")}</dd>`
              : ""
          }
          ${
            project.book
              ? `<dt>Pages</dt><dd>${pad2(project.book.pages)}</dd>`
              : `<dt>Images</dt><dd>${pad2(project.images.length)}</dd>`
          }
        </dl>
        <div class="project-info__copy">
          <h1>${escapeHTML(project.title)}</h1>
          <p>${escapeHTML(project.description)}</p>
          <ul class="project-tags">
            ${project.tags.map((tag) => `<li>${escapeHTML(tag)}</li>`).join("")}
          </ul>
        </div>
      `;
    }

    if (signature) {
      const blocks = [
        project.viewpoints && renderViewpoints(project),
        project.reference && renderReference(project),
        project.reduction && renderReduction(project),
        project.book && renderBookReader(project),
        project.summary && renderBrandSummary(project),
      ].filter(Boolean);
      if (blocks.length) signature.innerHTML = blocks.join("");
      else signature.remove();
    }

    if (gallery && project.book) {
      gallery.remove();
    } else if (gallery) {
      gallery.classList.toggle("is-slow", project.pace === "slow");
      gallery.innerHTML = renderProjectGallery(project);
    }

    if (related) {
      const items = [1, 2, 3].map(
        (offset) => DATA.projects[(projectIndex + offset) % DATA.projects.length]
      );
      related.innerHTML = items
        .map(
          (item) => `
            <a class="related-card" href="${projectURL(item)}" data-cursor="View">
              <figure class="related-card__media">
                ${
                  item.cover
                    ? `<img src="${escapeHTML(webImage(item.cover, "sm"))}" alt="${escapeHTML(item.title)}" loading="lazy" decoding="async"${coverStyle(item)}>`
                    : `<div class="project-card__placeholder">Visuals coming soon</div>`
                }
              </figure>
              <h3>${escapeHTML(item.title)}</h3>
              <p>${escapeHTML(item.discipline)} · ${escapeHTML(item.year)}</p>
            </a>
          `
        )
        .join("");
    }

    finishLoading();

    const viewpoints = qs(".viewpoints");
    const reduction = qs(".reduction");
    const bookReader = qs(".book-reader");
    if (viewpoints) initViewpoints(viewpoints);
    if (reduction) initReduction(reduction);
    if (bookReader) initBookReader(bookReader, project);
    initProjectTone(project);
  }

  function sectionTopline(label, aside = "") {
    return `
      <div class="section-topline">
        <span class="section-badge"><span class="section-badge__mark">S</span><span>${escapeHTML(label)}</span></span>
        ${aside ? `<span>${escapeHTML(aside)}</span>` : ""}
      </div>
    `;
  }

  function imageSizeAttributes(path) {
    const size = MEDIA_SIZES[path];
    return size ? `width="${size[0]}" height="${size[1]}"` : "";
  }

  // Justified rows: every image keeps its own proportions and a row shares one height.
  // Wide images keep the site's full / half / half rhythm; boards always take a full row.
  function galleryRows(images, project) {
    const ROW_RATIO = 1.9;
    const rows = [];
    let current = [];
    let currentRatio = 0;
    let wideCount = 0;
    const flush = () => {
      if (current.length) rows.push(current);
      current = [];
      currentRatio = 0;
    };

    images.forEach((src) => {
      const item = { src, ratio: mediaRatio(src), document: project.documents?.[src] || "" };
      if (item.document) {
        flush();
        rows.push([item]);
        wideCount = 0;
        return;
      }
      const wide = item.ratio >= 1.3;
      if (wide && !current.length && wideCount % 3 === 0) {
        wideCount += 1;
        rows.push([item]);
        return;
      }
      if (wide) wideCount += 1;
      current.push(item);
      currentRatio += item.ratio;
      if (currentRatio >= ROW_RATIO || current.length === 3) flush();
    });
    flush();
    return rows;
  }

  const CUTOUT_SHAPES = ["cutout-sprig", "cutout-bloom", "cutout-frond"];

  // Every fourth frame stays flat so the folds keep a rhythm instead of repeating on every image.
  const FOLDS = ["down", "book", "corner", "up", "accordion", "book-back"];
  const ACCORDION_PANELS = 4;

  function foldFlaps(fold, source) {
    const image = `background-image: url('${escapeHTML(source)}')`;
    if (fold === "accordion") {
      return Array.from(
        { length: ACCORDION_PANELS },
        (_, index) => `
          <span class="project-gallery__flap" style="--s: ${index}">
            <span class="project-gallery__flap-face" style="${image}; background-position: ${((index / (ACCORDION_PANELS - 1)) * 100).toFixed(3)}% 50%"></span>
          </span>`
      ).join("");
    }
    return `
      <span class="project-gallery__flap">
        <span class="project-gallery__flap-face" style="${image}"></span>
      </span>`;
  }

  function renderGalleryItem(item, project, position, indexInRow) {
    const motion = !reducedMotion && !item.document;
    const cutout = motion && project.gesture === "cutouts";
    const fold =
      motion && project.gesture === "fold" && position % 4 !== 3
        ? FOLDS[(position - Math.floor(position / 4)) % FOLDS.length]
        : "";
    const source = webImage(item.src);
    const classes = ["project-gallery__item"];
    const style = [`--ratio: ${item.ratio.toFixed(4)}`, `--i: ${indexInRow}`];
    if (item.document) classes.push("is-document");
    if (cutout) {
      classes.push("is-cutout");
      style.push(`--cut-shape: ${cssURL(`assets/masks/${CUTOUT_SHAPES[position % CUTOUT_SHAPES.length]}.svg`)}`);
    }
    if (fold) classes.push("is-fold", `fold-${fold}`);
    if (fold === "corner") style.push(`--fold-axis: ${(-item.ratio).toFixed(4)}`);
    const alt = item.document || `${project.title} — image ${position + 1}`;

    return `
      <figure class="${classes.join(" ")}" style="${escapeHTML(style.join("; "))}">
        <img src="${escapeHTML(source)}" alt="${escapeHTML(alt)}" ${imageSizeAttributes(item.src)} loading="${position < 2 ? "eager" : "lazy"}" decoding="async">
        ${fold ? `<span class="project-gallery__folds" aria-hidden="true">${foldFlaps(fold, source)}</span>` : ""}
        ${item.document ? `<figcaption>${escapeHTML(item.document)}</figcaption>` : ""}
      </figure>
    `;
  }

  function renderProjectGallery(project) {
    const images = project.images || [];
    const skip = images[0] && images[0] === project.cover ? project.cover : "";
    const groups = project.chapters?.length
      ? project.chapters.map((chapter) => ({
          title: chapter.title,
          images: chapter.images.filter((src) => src !== skip),
        }))
      : [{ title: "", images: images.filter((src, index) => !(index === 0 && src === skip)) }];

    let position = 0;
    const parts = [];
    groups.forEach((group, groupIndex) => {
      if (!group.images.length) return;
      if (group.title) {
        parts.push(`
          <h3 class="project-gallery__chapter reveal-section">
            <span>${pad2(groupIndex + 1)}</span>${escapeHTML(group.title)}
          </h3>
        `);
      }
      galleryRows(group.images, project).forEach((row) => {
        const rowRatio = row.reduce((sum, item) => sum + item.ratio, 0);
        parts.push(`
          <div class="project-gallery__row" style="--row-ratio: ${rowRatio.toFixed(4)}; --row-count: ${row.length}">
            ${row.map((item, indexInRow) => renderGalleryItem(item, project, position++, indexInRow)).join("")}
          </div>
        `);
      });
    });

    return parts.length
      ? parts.join("")
      : `<div class="project-gallery__empty project-hero__placeholder">No project images supplied yet</div>`;
  }

  function renderViewpoints(project) {
    const view = project.viewpoints;
    const cameras = view.cameras || [];
    const radians = (degrees) => (degrees * Math.PI) / 180;
    const point = (camera, degrees) => [
      Math.round(camera.x + Math.cos(radians(degrees)) * camera.reach),
      Math.round(camera.y + Math.sin(radians(degrees)) * camera.reach),
    ];
    const cones = cameras
      .map((camera, index) => {
        const [x1, y1] = point(camera, camera.angle - camera.fov / 2);
        const [x2, y2] = point(camera, camera.angle + camera.fov / 2);
        return `
          <g class="viewpoints__cone${index === 0 ? " is-active" : ""}" data-view="${index}" data-cursor="View">
            <path class="viewpoints__fov" d="M ${camera.x} ${camera.y} L ${x1} ${y1} A ${camera.reach} ${camera.reach} 0 0 1 ${x2} ${y2} Z"></path>
            <circle class="viewpoints__eye" cx="${camera.x}" cy="${camera.y}" r="46"></circle>
            <text class="viewpoints__number" x="${camera.x}" y="${camera.y}" dy="0.36em">${pad2(index + 1)}</text>
          </g>
        `;
      })
      .join("");

    return `
      <section class="viewpoints section-pad" aria-label="Plan and viewpoints">
        ${sectionTopline("Plan & Viewpoints", `${pad2(cameras.length)} views`)}
        <div class="viewpoints__layout">
          <figure class="viewpoints__plan">
            <div class="viewpoints__sheet">
              <div class="viewpoints__drawing" style="aspect-ratio: ${view.width} / ${view.height}">
                <img src="${escapeHTML(webImage(view.plan))}" alt="Floor plan of ${escapeHTML(project.title)} with the camera position of each view" loading="lazy" decoding="async">
                <svg viewBox="0 0 ${view.width} ${view.height}" aria-hidden="true" focusable="false">${cones}</svg>
              </div>
            </div>
            <figcaption>${escapeHTML(view.caption || "")}</figcaption>
          </figure>
          <div class="viewpoints__view">
            <div class="viewpoints__frame">
              ${cameras
                .map(
                  (camera, index) => `
                    <img
                      class="${index === 0 ? "is-active" : ""}"
                      data-view="${index}"
                      src="${escapeHTML(webImage(camera.image))}"
                      alt="${escapeHTML(camera.label)}"
                      loading="lazy"
                      decoding="async"
                    >
                  `
                )
                .join("")}
            </div>
            <ol class="viewpoints__list">
              ${cameras
                .map(
                  (camera, index) => `
                    <li>
                      <button class="viewpoints__option${index === 0 ? " is-active" : ""}" type="button" data-view="${index}" aria-pressed="${index === 0 ? "true" : "false"}">
                        <span>${pad2(index + 1)}</span>${escapeHTML(camera.label)}
                      </button>
                    </li>
                  `
                )
                .join("")}
            </ol>
          </div>
        </div>
      </section>
    `;
  }

  function initViewpoints(section) {
    const cones = qsa(".viewpoints__cone", section);
    const options = qsa(".viewpoints__option", section);
    const frames = qsa(".viewpoints__frame img", section);
    let active = 0;

    const setView = (index) => {
      if (index === active || !frames[index]) return;
      active = index;
      cones.forEach((cone) => cone.classList.toggle("is-active", Number(cone.dataset.view) === index));
      frames.forEach((frame) => frame.classList.toggle("is-active", Number(frame.dataset.view) === index));
      options.forEach((option) => {
        const selected = Number(option.dataset.view) === index;
        option.classList.toggle("is-active", selected);
        option.setAttribute("aria-pressed", String(selected));
      });
    };

    [...cones, ...options].forEach((control) => {
      const index = Number(control.dataset.view);
      control.addEventListener("click", () => setView(index));
      control.addEventListener("focus", () => setView(index));
      control.addEventListener("pointerenter", (event) => {
        if (event.pointerType === "mouse") setView(index);
      });
    });
  }

  function renderReference(project) {
    const reference = project.reference;
    return `
      <section class="reference section-pad" aria-label="${escapeHTML(reference.label || "Reference")}">
        ${sectionTopline(reference.label || "Reference", "The starting point")}
        <figure class="reference__figure reveal-section">
          <img src="${escapeHTML(webImage(reference.src))}" alt="${escapeHTML(reference.caption)}" ${imageSizeAttributes(reference.src)} loading="lazy" decoding="async">
          <figcaption>${escapeHTML(reference.caption)}</figcaption>
        </figure>
        ${reference.next ? `<p class="reference__next"><span>${escapeHTML(reference.next)}</span><i aria-hidden="true">↓</i></p>` : ""}
      </section>
    `;
  }

  function initProjectTone(project) {
    if (!project.tone) return;
    const start = project.tone === "matisse" ? qs(".reference") : null;
    const end = qs(".related-projects");
    let frame = null;

    const update = () => {
      frame = null;
      const height = window.innerHeight;
      const started = start ? start.getBoundingClientRect().top < height * 0.6 : true;
      const ended = end ? end.getBoundingClientRect().top < height * 0.65 : false;
      document.body.classList.toggle("is-toned", started && !ended);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    update();
  }

  function renderReduction(project) {
    const reduction = project.reduction;
    const mark = (side, entry) => `
      <figure class="reduction__mark reduction__mark--${side}">
        <div class="reduction__art">
          <img src="${escapeHTML(webImage(entry.src))}" alt="${escapeHTML(entry.note)}" ${imageSizeAttributes(entry.src)} loading="lazy" decoding="async">
        </div>
        <figcaption>
          <strong>${escapeHTML(entry.title)}</strong>
          <span>${escapeHTML(entry.terms)}</span>
          <em>${escapeHTML(entry.note)}</em>
        </figcaption>
      </figure>
    `;
    return `
      <section class="reduction section-pad" aria-label="From the heritage mark to the new emblem">
        ${sectionTopline("Reduktion", `${reduction.from.title} → ${reduction.to.title}`)}
        <div class="reduction__stage">
          ${mark("from", reduction.from)}
          <span class="reduction__line" aria-hidden="true"></span>
          ${mark("to", reduction.to)}
        </div>
        <blockquote class="reduction__statement">
          <p lang="de">${escapeHTML(reduction.statement)}</p>
          <footer>${escapeHTML(reduction.translation)}</footer>
        </blockquote>
      </section>
    `;
  }

  function initReduction(section) {
    const stage = qs(".reduction__stage", section);
    if (!stage) return;
    if (reducedMotion) {
      section.style.setProperty("--reduction", "1");
      return;
    }
    let frame = null;
    let inView = false;
    const update = () => {
      frame = null;
      const bounds = stage.getBoundingClientRect();
      const height = window.innerHeight;
      section.style.setProperty("--reduction", clamp01((height * 0.82 - bounds.top) / (height * 0.5)).toFixed(3));
    };
    const schedule = () => {
      if (inView && !frame) frame = requestAnimationFrame(update);
    };
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting;
        schedule();
      }).observe(section);
    } else {
      inView = true;
    }
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    update();
  }

  function renderBookReader(project) {
    const book = project.book;
    return `
      <section class="book-reader section-pad" aria-label="${escapeHTML(book.title)}">
        <div class="section-topline">
          <span class="section-badge"><span class="section-badge__mark">S</span><span>${escapeHTML(book.title)}</span></span>
          <span class="book-reader__position" aria-live="polite"></span>
        </div>
        <div class="book" data-mode="spread">
          <div
            class="book__stage"
            tabindex="0"
            role="group"
            aria-roledescription="book"
            aria-label="${escapeHTML(book.title)}, ${book.pages} pages. Use the arrow keys to turn the pages."
          >
            <div class="book__page book__page--left"><img alt="" decoding="async"></div>
            <div class="book__page book__page--right"><img alt="" decoding="async"></div>
            <div class="book__leaf" aria-hidden="true">
              <div class="book__face book__face--front"><img alt="" decoding="async"><span class="book__shade"></span></div>
              <div class="book__face book__face--back"><img alt="" decoding="async"><span class="book__shade"></span></div>
            </div>
            <button class="book__turn book__turn--prev" type="button" data-book-step="-1" data-cursor="Previous" aria-label="Previous pages"></button>
            <button class="book__turn book__turn--next" type="button" data-book-step="1" data-cursor="Next" aria-label="Next pages"></button>
          </div>
          <nav class="book__tabs" aria-label="Chapters of the book">
            ${book.tabs
              .map(
                (tab) => `
                  <button class="book__tab" type="button" data-page="${tab.page}">
                    <span>${escapeHTML(tab.label)}</span><small>${pad2(tab.page)}</small>
                  </button>
                `
              )
              .join("")}
          </nav>
        </div>
        <div class="book-reader__controls">
          <button class="round-control" type="button" data-book-step="-1" aria-label="Previous pages">←</button>
          <span class="book-reader__hint">Turn the page at its edge, with ← → or by swiping</span>
          <button class="round-control" type="button" data-book-step="1" aria-label="Next pages">→</button>
        </div>
      </section>
    `;
  }

  function initBookReader(section, project) {
    const book = project.book;
    const spreads = book.spreads;
    const root = qs(".book", section);
    const stage = qs(".book__stage", section);
    const leftImage = qs(".book__page--left img", section);
    const rightImage = qs(".book__page--right img", section);
    const leaf = qs(".book__leaf", section);
    const frontImage = qs(".book__face--front img", leaf);
    const backImage = qs(".book__face--back img", leaf);
    const frontShade = qs(".book__face--front .book__shade", leaf);
    const backShade = qs(".book__face--back .book__shade", leaf);
    const position = qs(".book-reader__position", section);
    const tabs = qsa(".book__tab", section);
    const steppers = qsa("[data-book-step]", section);
    const singleQuery = window.matchMedia("(max-width: 800px)");
    const TURN_MS = 950;
    const EASING = "cubic-bezier(0.645, 0.045, 0.355, 1)";
    const hint = qs(".book-reader__hint", section);
    if (hint && window.matchMedia("(hover: none)").matches) hint.textContent = "Swipe or tap the page edge to turn";
    let single = singleQuery.matches;
    let spreadIndex = 0;
    let pageNumber = 1;
    let busy = false;
    let inView = false;
    let swipe = null;
    let suppressClick = false;

    const pageSource = (number) => webImage(book.page(number), single ? "sm" : "lg");
    const pagesAt = (index) => {
      const pages = spreads[index] || [];
      return [pages[0] || 0, pages[1] || 0];
    };
    const spreadOfPage = (number) => Math.max(0, spreads.findIndex((pages) => pages.includes(number)));
    const visiblePages = () => (single ? [pageNumber] : pagesAt(spreadIndex).filter(Boolean));

    const setPage = (image, number) => {
      image.parentElement.classList.toggle("is-empty", !number);
      if (!number) {
        image.removeAttribute("src");
        image.alt = "";
        return;
      }
      const source = pageSource(number);
      if (image.getAttribute("src") !== source) image.src = source;
      image.alt = `${book.title} — page ${number}`;
    };

    const loadPages = (numbers) =>
      Promise.all(
        numbers.filter(Boolean).map(
          (number) =>
            new Promise((resolve) => {
              const image = new Image();
              image.decoding = "async";
              image.onload = image.onerror = resolve;
              image.src = pageSource(number);
              window.setTimeout(resolve, 1400);
            })
        )
      );

    const preloadAround = () => {
      const neighbours = single
        ? [pageNumber - 1, pageNumber + 1]
        : [...pagesAt(spreadIndex - 1), ...pagesAt(spreadIndex + 1)];
      loadPages(neighbours.filter((number) => number > 0 && number <= book.pages));
    };

    const updateStatus = () => {
      const pages = visiblePages();
      const last = Math.max(...pages);
      position.textContent =
        pages.length > 1
          ? `pp. ${pad2(pages[0])}–${pad2(pages[1])} / ${book.pages}`
          : `p. ${pad2(pages[0])} / ${book.pages}`;
      let activeTab = -1;
      book.tabs.forEach((tab, index) => {
        if (tab.page <= last) activeTab = index;
      });
      tabs.forEach((tab, index) => {
        tab.classList.toggle("is-active", index === activeTab);
        if (index === activeTab) tab.setAttribute("aria-current", "true");
        else tab.removeAttribute("aria-current");
      });
      const atStart = single ? pageNumber <= 1 : spreadIndex <= 0;
      const atEnd = single ? pageNumber >= book.pages : spreadIndex >= spreads.length - 1;
      steppers.forEach((button) => {
        button.disabled = Number(button.dataset.bookStep) < 0 ? atStart : atEnd;
      });
    };

    const showStatic = () => {
      root.dataset.mode = single ? "single" : "spread";
      if (single) {
        setPage(leftImage, 0);
        setPage(rightImage, pageNumber);
      } else {
        const [left, right] = pagesAt(spreadIndex);
        setPage(leftImage, left);
        setPage(rightImage, right);
      }
      updateStatus();
      preloadAround();
    };

    const animateLeaf = (from, to) => {
      const timing = { duration: TURN_MS, easing: EASING };
      frontShade.animate([{ opacity: 0 }, { opacity: 0.42, offset: 0.5 }, { opacity: 0.42 }], timing);
      backShade.animate([{ opacity: 0.42 }, { opacity: 0.42, offset: 0.5 }, { opacity: 0 }], timing);
      return leaf.animate([{ transform: `rotateY(${from}deg)` }, { transform: `rotateY(${to}deg)` }], timing).finished;
    };

    const turnTo = async (target) => {
      if (busy) return;
      const limit = single ? book.pages : spreads.length - 1;
      const floor = single ? 1 : 0;
      const next = Math.min(limit, Math.max(floor, target));
      const current = single ? pageNumber : spreadIndex;
      if (next === current) return;
      const forward = next > current;

      if (reducedMotion || !leaf.animate) {
        if (single) pageNumber = next;
        else spreadIndex = next;
        showStatic();
        return;
      }

      busy = true;
      if (single) {
        await loadPages([next]);
        leaf.classList.remove("is-backward");
        if (forward) {
          setPage(frontImage, pageNumber);
          setPage(backImage, 0);
          setPage(rightImage, next);
        } else {
          setPage(frontImage, next);
          setPage(backImage, 0);
        }
        pageNumber = next;
      } else {
        const [currentLeft, currentRight] = pagesAt(spreadIndex);
        const [nextLeft, nextRight] = pagesAt(next);
        await loadPages([nextLeft, nextRight]);
        leaf.classList.toggle("is-backward", !forward);
        setPage(frontImage, forward ? currentRight : currentLeft);
        setPage(backImage, forward ? nextLeft : nextRight);
        if (forward) setPage(rightImage, nextRight);
        else setPage(leftImage, nextLeft);
        spreadIndex = next;
      }
      updateStatus();

      leaf.classList.add("is-turning");
      const [from, to] = single ? (forward ? [0, -180] : [-180, 0]) : [0, forward ? -180 : 180];
      try {
        await animateLeaf(from, to);
      } catch {
        // An interrupted turn still settles on the target pages below.
      }
      showStatic();
      leaf.classList.remove("is-turning");
      busy = false;
    };

    const step = (direction) => turnTo((single ? pageNumber : spreadIndex) + direction);

    steppers.forEach((button) => {
      button.addEventListener("click", () => {
        if (suppressClick) return;
        step(Number(button.dataset.bookStep));
      });
    });

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const page = Number(tab.dataset.page);
        turnTo(single ? page : spreadOfPage(page));
      });
    });

    const handleKey = (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      step(event.key === "ArrowRight" ? 1 : -1);
    };
    stage.addEventListener("keydown", handleKey);
    document.addEventListener("keydown", (event) => {
      if (!inView || event.defaultPrevented || event.target.closest?.("input, textarea, select, .book__stage")) return;
      handleKey(event);
    });

    stage.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse") return;
      swipe = { id: event.pointerId, x: event.clientX, y: event.clientY };
    });
    stage.addEventListener("pointerup", (event) => {
      if (!swipe || swipe.id !== event.pointerId) return;
      const deltaX = event.clientX - swipe.x;
      const deltaY = event.clientY - swipe.y;
      swipe = null;
      if (Math.abs(deltaX) < 42 || Math.abs(deltaX) < Math.abs(deltaY)) return;
      suppressClick = true;
      window.setTimeout(() => {
        suppressClick = false;
      }, 350);
      step(deltaX < 0 ? 1 : -1);
    });
    stage.addEventListener("pointercancel", () => {
      swipe = null;
    });

    singleQuery.addEventListener?.("change", () => {
      if (busy) return;
      const wasSingle = single;
      single = singleQuery.matches;
      if (single === wasSingle) return;
      if (single) pageNumber = pagesAt(spreadIndex)[0] || 1;
      else spreadIndex = spreadOfPage(pageNumber);
      showStatic();
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(
        ([entry]) => {
          inView = entry.isIntersecting;
        },
        { threshold: 0.45 }
      ).observe(stage);
    }

    showStatic();
  }

  function renderBrandSummary(project) {
    return `
      <section class="brand-summary section-pad" aria-label="Strategy summary">
        ${sectionTopline("Strategy", `In ${project.summary.length} notes`)}
        <div class="brand-summary__grid">
          ${project.summary
            .map(
              (item, index) => `
                <article class="brand-summary__item reveal-section" style="--i: ${index}">
                  <p class="brand-summary__label"><span>${pad2(index + 1)}</span>${escapeHTML(item.label)}</p>
                  <h3>${escapeHTML(item.title)}</h3>
                  <p>${escapeHTML(item.text)}</p>
                  ${
                    item.swatches?.length
                      ? `<ul class="brand-summary__swatches">
                          ${item.swatches
                            .map(
                              ([name, hex]) => `
                                <li>
                                  <i style="background: ${escapeHTML(hex)}"></i>
                                  <span>${escapeHTML(name)}</span>
                                  <small>${escapeHTML(hex)}</small>
                                </li>
                              `
                            )
                            .join("")}
                        </ul>`
                      : ""
                  }
                </article>
              `
            )
            .join("")}
        </div>
      </section>
    `;
  }

  const EDGE_COLORS = { page: "#3f0e15", intro: "#1d0508", menu: "#020202" };

  // Status and tool bars of mobile browsers take the colour of whatever currently fills the screen.
  function updateScreenEdge() {
    const body = document.body;
    let edge = "page";
    if (!qs("#page-transition")?.classList.contains("is-covered")) {
      if (body.classList.contains("menu-open")) {
        edge = "menu";
      } else if (page === "home") {
        const intro = qs("#home");
        if (intro && window.scrollY < intro.offsetHeight - 2) edge = "intro";
      }
    }
    const root = document.documentElement;
    root.classList.toggle("is-edge-intro", edge === "intro");
    root.classList.toggle("is-edge-menu", edge === "menu");
    qs('meta[name="theme-color"]')?.setAttribute("content", EDGE_COLORS[edge]);
  }

  function initScreenEdge() {
    let frame = 0;
    window.addEventListener(
      "scroll",
      () => {
        if (frame) return;
        frame = requestAnimationFrame(() => {
          frame = 0;
          updateScreenEdge();
        });
      },
      { passive: true }
    );
    window.addEventListener("resize", updateScreenEdge, { passive: true });
    updateScreenEdge();
  }

  const SOUND_SRC = "assets/audio/sax-and-piano.mp3";
  const SOUND_VOLUME = 0.3;
  const SOUND_PREF_KEY = "serap-portfolio-sound";
  const SOUND_TIME_KEY = "serap-portfolio-sound-time";

  function readStored(storage, key) {
    try {
      return storage.getItem(key);
    } catch {
      return null;
    }
  }

  function writeStored(storage, key, value) {
    try {
      storage.setItem(key, value);
    } catch {
      // Without storage the music simply starts from the top on the next page.
    }
  }

  // Browsers only allow sound after a tap, click or key press, so the melody starts with the first one
  // and picks up on every page where the previous one left off, unless the visitor has switched it off.
  function initSoundtrack() {
    const button = qs("#sound-toggle");
    if (!button) return;

    const savedTime = Number(readStored(sessionStorage, SOUND_TIME_KEY)) || 0;
    const audio = new Audio();
    audio.loop = true;
    audio.preload = "none";
    audio.src = `${mediaURL(SOUND_SRC)}${savedTime > 0 ? `#t=${savedTime.toFixed(2)}` : ""}`;

    let wanted = readStored(localStorage, SOUND_PREF_KEY) !== "off";
    let playing = false;
    let starting = false;
    let context = null;
    let gain = null;
    let fadeTimer = 0;

    const render = () => {
      button.classList.toggle("is-playing", playing);
      button.setAttribute("aria-pressed", String(playing));
      button.setAttribute("aria-label", playing ? "Pause music" : "Play music");
    };

    // iOS ignores audio.volume, so fades run through a gain node wherever Web Audio exists.
    const connect = () => {
      if (context) return;
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      try {
        context = new AudioContextClass();
        gain = context.createGain();
        gain.gain.value = 0;
        context.createMediaElementSource(audio).connect(gain).connect(context.destination);
        audio.volume = 1;
      } catch {
        context = null;
        gain = null;
      }
    };

    const fadeTo = (value, seconds, done) => {
      window.clearInterval(fadeTimer);
      if (gain && context) {
        const now = context.currentTime;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(value, now + seconds);
        if (done) fadeTimer = window.setTimeout(done, seconds * 1000);
        return;
      }
      const from = audio.volume;
      const started = performance.now();
      fadeTimer = window.setInterval(() => {
        const t = Math.min(1, (performance.now() - started) / (seconds * 1000));
        audio.volume = from + (value - from) * t;
        if (t < 1) return;
        window.clearInterval(fadeTimer);
        done?.();
      }, 40);
    };

    // Web Audio must be woken inside the gesture itself; without one, a blocked resume can stay pending forever.
    const wake = () => {
      if (!context || context.state === "running") return Promise.resolve();
      return Promise.race([context.resume(), new Promise((resolve) => window.setTimeout(resolve, 800))]);
    };

    const start = (fromGesture = false) => {
      if (playing || starting) return;
      starting = true;
      if (fromGesture) connect();
      const woken = wake();
      if (!gain) audio.volume = 0;
      audio
        .play()
        .then(() => {
          if (!context) connect();
          return Promise.all([woken, wake()]);
        })
        .then(() => {
          starting = false;
          if (!wanted || (context && context.state !== "running")) {
            audio.pause();
            return;
          }
          playing = true;
          fadeTo(SOUND_VOLUME, 2.4);
          render();
        })
        .catch(() => {
          starting = false;
          audio.pause();
        });
    };

    const stop = (seconds = 0.8) => {
      if (!playing) return;
      playing = false;
      render();
      fadeTo(0, seconds, () => {
        if (!playing) audio.pause();
      });
    };

    const saveTime = () => {
      if (!audio.paused || audio.currentTime > 0) {
        writeStored(sessionStorage, SOUND_TIME_KEY, String(audio.currentTime));
      }
    };

    button.addEventListener("click", () => {
      wanted = !playing;
      writeStored(localStorage, SOUND_PREF_KEY, wanted ? "on" : "off");
      if (wanted) start(true);
      else stop();
    });

    const onFirstGesture = (event) => {
      if (!wanted || playing || button.contains(event.target)) return;
      start(true);
    };
    ["pointerup", "touchend", "mousedown", "keydown", "click"].forEach((type) =>
      document.addEventListener(type, onFirstGesture, { capture: true, passive: true })
    );

    document.addEventListener("portfolio:navigate", () => {
      saveTime();
      stop(0.6);
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        saveTime();
        if (playing) {
          fadeTo(0, 0.3, () => audio.pause());
          playing = false;
          render();
        }
      } else if (wanted && audio.currentTime > 0) {
        start();
      }
    });
    window.addEventListener("pagehide", saveTime);

    render();
    if (wanted) start();
  }

  function boot() {
    initMediaFallbacks();
    renderShell();
    initMenu();
    initPageTransitions();
    initScreenEdge();
    initSoundtrack();

    switch (page) {
      case "home":
        renderHome();
        break;
      case "work":
        renderWork();
        break;
      case "lab":
        renderLab();
        break;
      case "about":
        renderAbout();
        break;
      case "project":
        renderProject();
        break;
      default:
        finishLoading();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
