/*
 * Intro stage: draws the home intro as WebGL so an effect can shape the fabric (the text-free
 * Intro.mp4) and the lettering (assets/intro/intro-text.png) separately.
 * Without WebGL, or with reduced motion, the page keeps the original <video> with baked-in text.
 */
(function () {
  "use strict";

  // Where the lettering sits inside the 1920×1080 frame, fitted against Intro_yazılı.mp4.
  const TEXT_RECT = [0.19453, 0.40833, 0.6099, 0.19352];
  const VIDEO_ASPECT = 16 / 9;
  // Widest share of the screen the lettering may take; beyond it the name is shrunk instead of cropped.
  const TEXT_MAX_WIDTH = 0.88;
  const TEXT_FREE_SOURCES = ["assets/web/Intro/Intro.mp4", "Intro/Intro.mp4"];
  const TEXT_IMAGE = "assets/intro/intro-text.png";
  // First frame of Intro.mp4, shown until anything moves.
  const STILL_IMAGE = "assets/web/Intro/intro-still.jpg";
  // Portrait phones only ever show the middle of the frame, so they get a clip cropped to it (a quarter of
  // the bytes) plus a sheet of its first frames, drawn until the clip plays: phones hold video back on slow
  // connections and, in Low Power Mode, until the visitor touches the page.
  const COMPACT_SOURCES = ["assets/web/Intro/intro-mobile.mp4"];
  const COMPACT_RECT = [632 / 1920, 0, 656 / 1920, 1];
  const COMPACT_MAX_ASPECT = 0.6;
  const SPRITE = { src: "assets/web/Intro/intro-sprite.jpg", frames: 48, columns: 8, width: 328, height: 540, fps: 8 };
  const CROSSFADE_SECONDS = 0.8;
  // Colour of the page around the intro (#1a0103): the fabric dims into it at the top and bottom of phone
  // screens so the bars mobile browsers paint in that colour join the picture instead of cutting it.
  const EDGE_COLOR = [26 / 255, 1 / 255, 3 / 255];
  const EDGE_FADE = { top: 110, bottom: 130 };
  // Canvas pixels the stage may draw: phones get their full screen density, very large screens a little less.
  const PIXEL_BUDGET = 4.2e6;

  const VERTEX = `
    attribute vec2 aPosition;
    varying vec2 vUv;
    void main() {
      vUv = vec2(aPosition.x * 0.5 + 0.5, 0.5 - aPosition.y * 0.5);
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `;

  // vUv runs top-left to bottom-right; textures are uploaded unflipped so the same convention holds.
  // hash() needs highp: at mediump, fract() of its large products collapses on many phones.
  const PRELUDE = `
    #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    #else
    precision mediump float;
    #endif
    varying vec2 vUv;
    uniform sampler2D uVideo;
    uniform sampler2D uText;
    uniform vec2 uRes;
    uniform vec4 uCover;
    uniform vec4 uTextCover;
    uniform vec4 uTextRect;
    uniform float uTime;
    uniform vec3 uPointer;
    uniform sampler2D uSprite;
    uniform vec4 uVideoRect;
    uniform vec4 uSpriteRect;
    uniform float uMix;
    uniform vec4 uEdge;
    uniform vec3 uEdgeColor;

    vec2 toVideo(vec2 s) { return s * uCover.xy + uCover.zw; }
    // Like toVideo, but on narrow screens zoomed out so the whole name stays readable.
    vec2 toText(vec2 s) { return s * uTextCover.xy + uTextCover.zw; }
    // v is a point of the full 1920×1080 frame; each source covers the part of it given by its rect.
    vec3 fabric(vec2 v) {
      vec3 color = texture2D(uVideo, clamp((v - uVideoRect.xy) / uVideoRect.zw, 0.0, 1.0)).rgb;
      if (uMix < 1.0) {
        vec3 sprite = texture2D(uSprite, clamp((v - uSpriteRect.xy) / uSpriteRect.zw, 0.0, 1.0)).rgb;
        color = mix(sprite, color, uMix);
      }
      return color;
    }
    // The grade of the original clip, then the screen edges settle into the colour behind the browser bars.
    vec3 finish(vec2 s, vec3 color) {
      float grey = dot(color, vec3(0.2126, 0.7152, 0.0722));
      color = (mix(vec3(grey), color, 0.9) - 0.5) * 1.05 + 0.5;
      float top = smoothstep(uEdge.x, uEdge.x + uEdge.y, s.y);
      float bottom = smoothstep(uEdge.z, uEdge.z + uEdge.w, 1.0 - s.y);
      return mix(uEdgeColor, color, min(top, bottom));
    }
    vec4 lettering(vec2 v) {
      vec2 t = (v - uTextRect.xy) / uTextRect.zw;
      if (t.x < 0.0 || t.y < 0.0 || t.x > 1.0 || t.y > 1.0) return vec4(0.0);
      return texture2D(uText, t);
    }
    float hash(float n) { return fract(sin(n * 12.9898) * 43758.5453); }
  `;

  function start(effect) {
    const section = document.querySelector(".home-intro");
    const video = document.querySelector("#intro-video");
    if (!section || !video) return null;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return null;

    const canvas = document.createElement("canvas");
    canvas.className = "home-intro__stage";
    canvas.setAttribute("aria-hidden", "true");
    const gl = canvas.getContext("webgl", { alpha: false, antialias: false, premultipliedAlpha: false });
    if (!gl) return null;

    const compile = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.warn("Intro shader:", gl.getShaderInfoLog(shader));
        return null;
      }
      return shader;
    };
    const vertex = compile(gl.VERTEX_SHADER, VERTEX);
    const fragment = compile(gl.FRAGMENT_SHADER, PRELUDE + effect.fragment);
    if (!vertex || !fragment) return null;
    const program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const locations = new Map();
    const uniform = (name) => {
      if (!locations.has(name)) locations.set(name, gl.getUniformLocation(program, name));
      return locations.get(name);
    };

    const textures = new Map();
    let nextUnit = 0;
    // Creates the texture on first use; later calls re-upload the source (video, canvas, image or bytes).
    const texture = (name, source, options = {}) => {
      let entry = textures.get(name);
      if (!entry) {
        entry = { unit: nextUnit++, handle: gl.createTexture() };
        textures.set(name, entry);
        gl.activeTexture(gl.TEXTURE0 + entry.unit);
        gl.bindTexture(gl.TEXTURE_2D, entry.handle);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.uniform1i(uniform(name), entry.unit);
      }
      gl.activeTexture(gl.TEXTURE0 + entry.unit);
      gl.bindTexture(gl.TEXTURE_2D, entry.handle);
      if (source instanceof Uint8Array) {
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, options.width, options.height, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, source);
      } else if (source) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      } else {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(options.fill || [0, 0, 0, 0]));
      }
      return entry;
    };

    let stopped = false;
    let frameId = 0;
    let cue = null;
    // Back to the original clip with the name baked in, e.g. when an intro asset fails to load.
    const restoreSources = video.innerHTML;
    const fallBack = () => {
      if (stopped) return;
      stopped = true;
      cancelAnimationFrame(frameId);
      canvas.remove();
      cue?.remove();
      video.innerHTML = restoreSources;
      video.load();
      video.play().catch(() => {});
    };

    const coarse = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    const compact = coarse && section.clientWidth / Math.max(1, section.clientHeight) <= COMPACT_MAX_ASPECT;

    texture("uVideo", null, { fill: [30, 0, 4, 255] });
    texture("uText", null);
    texture("uSprite", null, { fill: [30, 0, 4, 255] });
    gl.uniform4f(uniform("uVideoRect"), 0, 0, 1, 1);
    gl.uniform4f(uniform("uSpriteRect"), ...COMPACT_RECT);
    gl.uniform1f(uniform("uMix"), 1);
    gl.uniform3f(uniform("uEdgeColor"), ...EDGE_COLOR);
    gl.uniform4f(uniform("uEdge"), 0, 0.0001, 0, 0.0001);
    // The lettering is resampled to its size on screen: sampled straight from the large image,
    // the thin strokes of the subtitle would vanish between pixels on small screens.
    const textImage = new Image();
    const textSheet = document.createElement("canvas");
    let textReady = false;
    let textWidth = 0;
    const uploadText = () => {
      if (!textImage.naturalWidth) return;
      const width = Math.round((ctx.width * TEXT_RECT[2]) / ctx.textCover[0]);
      if (width === textWidth) return;
      textWidth = width;
      if (width >= textImage.naturalWidth) {
        texture("uText", textImage);
        return;
      }
      textSheet.width = width;
      textSheet.height = Math.max(1, Math.round((width * textImage.naturalHeight) / textImage.naturalWidth));
      const paint = textSheet.getContext("2d");
      paint.imageSmoothingQuality = "high";
      paint.clearRect(0, 0, textSheet.width, textSheet.height);
      paint.drawImage(textImage, 0, 0, textSheet.width, textSheet.height);
      texture("uText", textSheet);
    };
    textImage.onload = () => {
      if (stopped) return;
      uploadText();
      textReady = true;
    };
    textImage.onerror = fallBack;
    textImage.src = TEXT_IMAGE;

    // The same element keeps playing so app.js still restarts it when the curtain opens.
    let videoRect = compact ? COMPACT_RECT : [0, 0, 1, 1];
    const loadSources = (sources) => {
      video.innerHTML = sources.map((src) => `<source src="${src}" type="video/mp4">`).join("");
      video.lastElementChild.addEventListener("error", fallBack);
      video.load();
      video.play().catch(() => {});
    };
    video.addEventListener("error", fallBack, { once: true });
    loadSources(compact ? COMPACT_SOURCES : TEXT_FREE_SOURCES);
    video.after(canvas);
    section.classList.add("has-stage");

    let hasFrame = false;
    let stillReady = false;
    const still = new Image();
    still.onload = () => {
      if (stopped || hasFrame) return;
      texture("uVideo", still);
      stillReady = true;
      request();
    };
    still.src = STILL_IMAGE;

    // Sprite frames play until the clip delivers its own, then the clip is faded in over them.
    let spriteReady = false;
    let spriteFrame = -1;
    let spriteStart = 0;
    let mix = 1;
    const sprite = new Image();
    const spriteCell = document.createElement("canvas");
    spriteCell.width = SPRITE.width;
    spriteCell.height = SPRITE.height;
    if (compact) {
      sprite.onload = () => {
        if (stopped || hasFrame) return;
        spriteReady = true;
        spriteStart = ctx.time;
        request();
      };
      sprite.src = SPRITE.src;
    }
    const drawSprite = () => {
      const period = 2 * (SPRITE.frames - 1);
      const step = Math.floor((ctx.time - spriteStart) * SPRITE.fps) % period;
      const index = step < SPRITE.frames ? step : period - step;
      if (index === spriteFrame) return;
      spriteFrame = index;
      const paint = spriteCell.getContext("2d");
      const sx = (index % SPRITE.columns) * SPRITE.width;
      const sy = Math.floor(index / SPRITE.columns) * SPRITE.height;
      paint.drawImage(sprite, sx, sy, SPRITE.width, SPRITE.height, 0, 0, SPRITE.width, SPRITE.height);
      texture("uSprite", spriteCell);
    };

    const pointer = { x: 0.5, y: 0.5, vx: 0, vy: 0, active: false, down: false, moved: 0, presence: 0 };
    const ctx = {
      gl,
      canvas,
      section,
      video,
      pointer,
      uniform,
      texture,
      time: 0,
      width: 1,
      height: 1,
      aspect: 1,
      cover: [1, 1, 0, 0],
      textCover: [1, 1, 0, 0],
      curtainOpen: document.body.classList.contains("is-curtain-open"),
      dismissCue: () => cue?.classList.remove("is-visible"),
    };

    if (effect.cue) {
      cue = document.createElement("p");
      cue.className = "home-intro__cue";
      cue.textContent = effect.cue;
      section.append(cue);
    }

    const resize = () => {
      const cssWidth = section.clientWidth;
      const cssHeight = section.clientHeight;
      const scale = Math.min(
        window.devicePixelRatio || 1,
        effect.maxPixelRatio || 3,
        Math.sqrt(PIXEL_BUDGET / Math.max(1, cssWidth * cssHeight))
      );
      const width = Math.max(1, Math.round(cssWidth * scale));
      const height = Math.max(1, Math.round(cssHeight * scale));
      if (width === canvas.width && height === canvas.height) return;
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
      ctx.width = width;
      ctx.height = height;
      ctx.aspect = width / height;
      const aspect = ctx.aspect;
      ctx.cover =
        aspect > VIDEO_ASPECT
          ? [1, VIDEO_ASPECT / aspect, 0, (1 - VIDEO_ASPECT / aspect) / 2]
          : [aspect / VIDEO_ASPECT, 1, (1 - aspect / VIDEO_ASPECT) / 2, 0];

      const [textX, textY, textWidth, textHeight] = TEXT_RECT;
      const fitScale = textWidth / TEXT_MAX_WIDTH;
      ctx.textCover = ctx.cover;
      if (fitScale > ctx.cover[0]) {
        const scaleY = (fitScale * VIDEO_ASPECT) / aspect;
        const centerY = textY + textHeight / 2;
        ctx.textCover = [fitScale, scaleY, textX - ((1 - TEXT_MAX_WIDTH) / 2) * fitScale, centerY * (1 - scaleY)];
      }

      // The cropped clip only covers portrait screens; turned sideways, the phone gets the full frame.
      if (videoRect === COMPACT_RECT && aspect > COMPACT_MAX_ASPECT) {
        videoRect = [0, 0, 1, 1];
        hasFrame = false;
        mix = 1;
        spriteReady = false;
        loadSources(TEXT_FREE_SOURCES);
      }

      // Phone screens: flat edge colour behind the status bar and browser toolbar, then a soft fade into the fabric.
      if (coarse) {
        const safeTop = parseFloat(getComputedStyle(section).getPropertyValue("--safe-top")) || 0;
        const hiddenBottom = Math.max(0, cssHeight - window.innerHeight);
        gl.uniform4f(
          uniform("uEdge"),
          (safeTop + 6) / cssHeight,
          EDGE_FADE.top / cssHeight,
          (hiddenBottom + 24) / cssHeight,
          EDGE_FADE.bottom / cssHeight
        );
      }
      gl.uniform2f(uniform("uRes"), width, height);
      gl.uniform4f(uniform("uCover"), ...ctx.cover);
      gl.uniform4f(uniform("uTextCover"), ...ctx.textCover);
      uploadText();
      effect.resize?.(ctx);
    };
    gl.uniform4f(uniform("uTextRect"), ...TEXT_RECT);

    const toLocal = (event) => {
      const rect = section.getBoundingClientRect();
      return [(event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height];
    };
    let lastMove = 0;
    const move = (event) => {
      const [x, y] = toLocal(event);
      const now = performance.now();
      const dt = Math.max(8, now - lastMove) / 1000;
      if (pointer.active) {
        pointer.vx = pointer.vx * 0.5 + ((x - pointer.x) / dt) * 0.5;
        pointer.vy = pointer.vy * 0.5 + ((y - pointer.y) / dt) * 0.5;
      }
      pointer.x = x;
      pointer.y = y;
      pointer.active = true;
      pointer.moved = now;
      lastMove = now;
      effect.pointermove?.(ctx, event);
    };
    section.addEventListener("pointermove", move, { passive: true });
    section.addEventListener("pointerdown", (event) => {
      move(event);
      pointer.down = true;
      effect.pointerdown?.(ctx, event);
    });
    const release = () => {
      pointer.down = false;
    };
    section.addEventListener("pointerup", release);
    section.addEventListener("pointercancel", release);
    section.addEventListener("pointerleave", () => {
      release();
      pointer.active = false;
    });

    // The effect's opening plays once the curtain has parted and the stage is actually showing.
    let ready = false;
    let opened = false;
    const open = () => {
      if (opened || !ready || !ctx.curtainOpen) return;
      opened = true;
      effect.curtainOpen?.(ctx);
    };
    document.addEventListener("portfolio:curtain-open", () => {
      ctx.curtainOpen = true;
      open();
    });

    let visible = true;
    new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      if (visible) request();
    }).observe(section);
    window.addEventListener("resize", resize, { passive: true });

    let newFrame = true;
    const watchFrames = () => {
      newFrame = true;
      video.requestVideoFrameCallback(watchFrames);
    };
    if ("requestVideoFrameCallback" in HTMLVideoElement.prototype) video.requestVideoFrameCallback(watchFrames);

    let previous = performance.now();
    const request = () => {
      if (!frameId && !stopped) frameId = requestAnimationFrame(render);
    };
    const render = (now) => {
      frameId = 0;
      if (stopped || !visible || document.hidden) return;
      if (document.body.classList.contains("menu-open")) {
        previous = now;
        request();
        return;
      }
      const dt = Math.min(0.05, (now - previous) / 1000);
      previous = now;
      ctx.time += dt;
      resize();

      if (spriteReady && !hasFrame) {
        drawSprite();
        mix = 0;
      } else if (hasFrame && mix < 1) {
        mix = Math.min(1, mix + dt / CROSSFADE_SECONDS);
        if (mix < 1 && spriteReady) drawSprite();
      }
      gl.uniform1f(uniform("uMix"), mix);

      const idle = now - pointer.moved > 1200;
      pointer.presence += ((pointer.active && !idle ? 1 : 0) - pointer.presence) * Math.min(1, dt * 5);
      pointer.vx *= Math.pow(0.02, dt);
      pointer.vy *= Math.pow(0.02, dt);

      // A clip that is held back still decodes its first frame; only a playing clip may replace the sprite.
      if (
        video.readyState >= 2 &&
        !video.paused &&
        (newFrame || !("requestVideoFrameCallback" in HTMLVideoElement.prototype))
      ) {
        texture("uVideo", video);
        newFrame = false;
        if (!hasFrame) gl.uniform4f(uniform("uVideoRect"), ...videoRect);
        hasFrame = true;
      }
      if (!ready && textReady && (hasFrame || stillReady || spriteReady)) {
        ready = true;
        canvas.classList.add("is-ready");
        cue?.classList.add("is-visible");
        open();
      }
      gl.uniform1f(uniform("uTime"), ctx.time);
      gl.uniform3f(uniform("uPointer"), pointer.x, pointer.y, pointer.presence);
      effect.frame?.(ctx, dt);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      request();
    };
    document.addEventListener("visibilitychange", () => {
      previous = performance.now();
      request();
    });

    canvas.addEventListener("webglcontextlost", fallBack);

    resize();
    effect.init?.(ctx);
    request();
    return ctx;
  }

  window.IntroStage = { start };
})();
