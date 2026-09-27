/*
 * Intro — "Threads and the name": the cursor parts the vertical threads of the fabric like a bead
 * curtain and they sway back on a spring; the lettering knits itself together from threads when the
 * curtain opens and unravels into hanging strands as the page is scrolled away. Loose strands part
 * around the hand together with the fabric.
 */
(function () {
  "use strict";

  if (!window.IntroStage) return;

  // Low-resolution displacement field, simulated on the CPU and sampled with linear filtering.
  const COLS = 120;
  const ROWS = 68;
  const MAX_SHIFT = 0.07;
  const STIFFNESS = 38;
  const DAMPING = 5.2;
  // Along a thread (vertical neighbours) and between threads; explicit steps stay stable below ~7000.
  const TENSION = 900;
  const COUPLING = 160;
  const PUSH = 34;
  const DRAG = 9;

  const KNIT_SECONDS = 2.8;
  const STRIPS = 110;
  const TEXT_IMAGE = "assets/intro/intro-text.png";
  const CUE_MOVE = "Move through the threads";
  const CUE_SCROLL = "Scroll to unravel";

  const shift = new Float32Array(COLS * ROWS);
  const speed = new Float32Array(COLS * ROWS);
  const bytes = new Uint8Array(COLS * ROWS);

  let sweepStart = -1;
  let knitStart = -1;
  let touched = false;
  let scrolled = false;

  const fragment = `
    uniform sampler2D uField;
    uniform float uAmp;
    uniform float uScroll;
    uniform float uKnit;
    uniform sampler2D uProfile;

    const float STRIPS = ${STRIPS}.0;

    float field(vec2 s) { return (texture2D(uField, s).r - 0.5) * 2.0; }

    void main() {
      vec2 s = vUv;
      float offset = field(s);
      float stretch = (field(s + vec2(1.0 / ${COLS}.0, 0.0)) - field(s - vec2(1.0 / ${COLS}.0, 0.0))) * ${COLS}.0 * uAmp;

      // The fabric parts around the hand, and stretches and dims a little as it is pulled up with the page.
      vec2 parted = toVideo(vec2(s.x - offset * uAmp, s.y));
      vec3 color = fabric(vec2(parted.x, (parted.y - 0.5) / (1.0 + uScroll * 0.45) + 0.5));

      // Threads pushed together catch more light; where they part, the dark ground shows.
      color *= clamp(1.0 - stretch * 0.35, 0.55, 1.6);
      color += vec3(0.2, 0.035, 0.06) * smoothstep(0.25, 1.0, abs(offset));
      color *= 1.0 - uScroll * 0.3;

      // Whole letters barely move with the threads; unravelled strands swing with them fully.
      float unravelled = clamp(max(uScroll * uTextCover.y * 0.45, uKnit * uKnit * 0.3) * 7.0, 0.0, 1.0);
      vec2 v = toText(vec2(s.x - offset * uAmp * mix(0.12, 1.0, unravelled), s.y));

      float tx = (v.x - uTextRect.x) / uTextRect.z;
      if (tx >= 0.0 && tx <= 1.0) {
        float strip = floor(tx * STRIPS);
        float r = hash(strip);
        float r2 = hash(strip + 7.13);

        float knit = clamp(uKnit * 1.45 - r2 * 0.45, 0.0, 1.0);
        float drop = uScroll * uTextCover.y * (0.45 + 0.6 * r) + knit * knit * (0.3 + 0.35 * r);

        vec2 hand = toText(uPointer.xy);
        float tug = exp(-pow((v.x - hand.x) * 18.0, 2.0) - pow((v.y - hand.y) * 5.0, 2.0)) * uPointer.z;
        drop += tug * 0.035 * (0.4 + r);

        // Whole letters while at rest; once loose, each strip narrows to a single strand.
        float loose = clamp(drop * 7.0, 0.0, 1.0);
        float across = abs(fract(tx * STRIPS) - 0.5);
        float width = mix(0.62, 0.17, loose);
        float body = 1.0 - smoothstep(width - 0.06, width, across);
        float thread = 1.0 - smoothstep(0.06, 0.11, across);

        float piece = lettering(vec2(v.x, v.y - drop)).a * body;

        // One continuous strand from where the strip's letters were down to the falling piece.
        vec3 profile = texture2D(uProfile, vec2((strip + 0.5) / STRIPS, 0.5)).rgb;
        float ty = (v.y - uTextRect.y) / uTextRect.w;
        float fall = drop / uTextRect.w;
        float along = (ty - profile.r) / max(fall, 0.0001);
        float strand = profile.b * thread * loose * step(0.0, along) * step(along, 1.0) * mix(0.3, 0.85, along);

        float alpha = max(piece, strand);
        vec3 ink = mix(vec3(0.98, 0.96, 0.93), vec3(0.88, 0.46, 0.56), loose * 0.85);
        color = mix(color, ink, alpha);
      }
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  function step(ctx, dt, hand) {
    const { aspect } = ctx;
    for (let row = 0; row < ROWS; row += 1) {
      const y = (row + 0.5) / ROWS;
      for (let col = 0; col < COLS; col += 1) {
        const index = row * COLS + col;
        const x = (col + 0.5) / COLS;
        const current = shift[index];
        const up = row > 0 ? shift[index - COLS] : current;
        const down = row < ROWS - 1 ? shift[index + COLS] : current;
        const left = col > 0 ? shift[index - 1] : current;
        const right = col < COLS - 1 ? shift[index + 1] : current;

        let force =
          -STIFFNESS * current -
          DAMPING * speed[index] +
          TENSION * (up + down - 2 * current) +
          COUPLING * (left + right - 2 * current);

        if (hand.presence > 0.01) {
          const dx = (x - hand.x) * aspect;
          const dy = y - hand.y;
          const reach = Math.exp(-(dx * dx) / 0.006 - (dy * dy) / 0.02);
          if (reach > 0.002) {
            const side = Math.sign(dx) * Math.min(1, Math.abs(dx) / 0.02);
            force += reach * hand.presence * (side * PUSH + hand.vx * DRAG);
          }
        }
        speed[index] += force * dt;
      }
    }
    for (let index = 0; index < shift.length; index += 1) {
      shift[index] = Math.max(-1, Math.min(1, shift[index] + speed[index] * dt));
    }
  }

  // Before anyone touches the intro, one slow hand passes through so the gesture is discovered.
  function ghostHand(ctx) {
    if (touched || sweepStart < 0) return null;
    const t = (ctx.time - sweepStart) / 2.4;
    if (t < 0 || t > 1) return null;
    const eased = t * t * (3 - 2 * t);
    return { x: -0.05 + eased * 1.1, y: 0.66 + Math.sin(t * Math.PI) * -0.08, vx: 0.45, presence: Math.sin(t * Math.PI) };
  }

  // Top of the lettering in every strip, so strands can be drawn as one line.
  function profile(ctx) {
    ctx.texture("uProfile", null);
    const image = new Image();
    image.onload = () => {
      const sheet = document.createElement("canvas");
      sheet.width = image.naturalWidth;
      sheet.height = image.naturalHeight;
      const paint = sheet.getContext("2d", { willReadFrequently: true });
      paint.drawImage(image, 0, 0);
      const { data, width, height } = paint.getImageData(0, 0, sheet.width, sheet.height);
      const strips = document.createElement("canvas");
      strips.width = STRIPS;
      strips.height = 1;
      const row = strips.getContext("2d");
      const out = row.createImageData(STRIPS, 1);
      for (let strip = 0; strip < STRIPS; strip += 1) {
        const x0 = Math.floor((strip / STRIPS) * width);
        const x1 = Math.max(x0 + 1, Math.floor(((strip + 1) / STRIPS) * width));
        let top = -1;
        for (let y = 0; y < height && top < 0; y += 1) {
          for (let x = x0; x < x1; x += 1) {
            if (data[(y * width + x) * 4 + 3] > 60) {
              top = y;
              break;
            }
          }
        }
        out.data[strip * 4] = top < 0 ? 0 : Math.round((top / height) * 255);
        out.data[strip * 4 + 2] = top < 0 ? 0 : 255;
        out.data[strip * 4 + 3] = 255;
      }
      row.putImageData(out, 0, 0);
      ctx.texture("uProfile", strips);
    };
    image.src = TEXT_IMAGE;
  }

  // One cue at a time: first the threads, then — once they have been touched — the scroll.
  function nextCue(ctx) {
    const cue = ctx.section.querySelector(".home-intro__cue");
    if (!cue || scrolled) return;
    cue.classList.remove("is-visible");
    setTimeout(() => {
      if (scrolled) return;
      cue.textContent = CUE_SCROLL;
      cue.classList.add("is-visible");
    }, 700);
  }

  window.IntroStage.start({
    cue: CUE_MOVE,
    fragment,
    init(ctx) {
      ctx.texture("uField", bytes.fill(128), { width: COLS, height: ROWS });
      ctx.gl.uniform1f(ctx.uniform("uAmp"), MAX_SHIFT);
      ctx.gl.uniform1f(ctx.uniform("uKnit"), 1);
      profile(ctx);

      const update = () => {
        const travelled = window.scrollY - ctx.runway;
        const progress = Math.min(1.2, Math.max(0, travelled / Math.max(1, ctx.section.offsetHeight - ctx.runway)));
        ctx.gl.uniform1f(ctx.uniform("uScroll"), progress);
        if (!scrolled && travelled > 24) {
          scrolled = true;
          ctx.dismissCue();
        }
      };
      ctx.updateScroll = update;
      window.addEventListener("scroll", update, { passive: true });
      update();
    },
    curtainOpen(ctx) {
      knitStart = ctx.time + 0.25;
      sweepStart = knitStart + KNIT_SECONDS + 0.2;
    },
    pointermove(ctx) {
      if (!touched) {
        touched = true;
        nextCue(ctx);
      }
    },
    frame(ctx, dt) {
      let knit = 1;
      if (knitStart >= 0) {
        const t = Math.min(1, Math.max(0, (ctx.time - knitStart) / KNIT_SECONDS));
        knit = 1 - t * t * (3 - 2 * t);
      }
      ctx.gl.uniform1f(ctx.uniform("uKnit"), knit);
      ctx.updateScroll();

      const pointer = ctx.pointer;
      const hand = ghostHand(ctx) || { x: pointer.x, y: pointer.y, vx: pointer.vx, presence: pointer.presence };
      const steps = Math.max(1, Math.round(dt / (1 / 120)));
      for (let i = 0; i < steps; i += 1) step(ctx, dt / steps, hand);
      for (let index = 0; index < shift.length; index += 1) bytes[index] = 128 + Math.round(shift[index] * 127);
      ctx.texture("uField", bytes, { width: COLS, height: ROWS });
    },
  });
})();
