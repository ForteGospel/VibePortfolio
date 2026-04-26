// === NAV: active section highlighting ===
const sections = document.querySelectorAll("section[id]");
const navLinks = document.querySelectorAll(".nav-link");

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        navLinks.forEach((link) => link.classList.remove("active"));
        const active = document.querySelector(
          `.nav-link[href="#${entry.target.id}"]`
        );
        if (active) active.classList.add("active");
      }
    });
  },
  { rootMargin: "-35% 0px -60% 0px" }
);

sections.forEach((s) => sectionObserver.observe(s));

// === NAV: mobile toggle ===
const navToggle = document.querySelector(".nav-toggle");
const navLinksList = document.querySelector(".nav-links");

navToggle.addEventListener("click", () => {
  const isOpen = navLinksList.classList.toggle("open");
  navToggle.classList.toggle("open", isOpen);
  navToggle.setAttribute("aria-expanded", isOpen);
});

// close mobile nav when a link is clicked
navLinksList.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinksList.classList.remove("open");
    navToggle.classList.remove("open");
    navToggle.setAttribute("aria-expanded", false);
  });
});

// === PROJECT ACCORDION ===
document.querySelectorAll(".project-row-header").forEach((header) => {
  header.addEventListener("click", () => {
    const row = header.closest(".project-row");
    const isOpen = row.classList.contains("open");

    // close all others
    document.querySelectorAll(".project-row.open").forEach((r) => {
      r.classList.remove("open");
      r.querySelector(".project-row-header").setAttribute("aria-expanded", "false");
    });

    // toggle clicked
    if (!isOpen) {
      row.classList.add("open");
      header.setAttribute("aria-expanded", "true");
    }
  });
});

// === VIDEO MODAL ===
const modal     = document.getElementById("video-modal");
const iframe    = document.getElementById("modal-iframe");
const modalTitle = document.getElementById("modal-title");
const closeBtn  = modal.querySelector(".modal-close");
const backdrop  = modal.querySelector(".modal-backdrop");

function openModal(videoId, title) {
  iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`;
  modalTitle.textContent = title || "";
  modal.hidden = false;
  document.body.style.overflow = "hidden";
  closeBtn.focus();
}

function closeModal() {
  modal.hidden = true;
  iframe.src = "";                      // stops the video
  document.body.style.overflow = "";
}

document.querySelectorAll("[data-video]").forEach((btn) => {
  btn.addEventListener("click", () => {
    openModal(btn.dataset.video, btn.dataset.title);
  });
});

closeBtn.addEventListener("click", closeModal);
backdrop.addEventListener("click", closeModal);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modal.hidden) closeModal();
});

// === FADE-IN on scroll ===
const fadeEls = document.querySelectorAll(".fade-in");

const fadeObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        fadeObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

fadeEls.forEach((el) => fadeObserver.observe(el));

// === HERO MINI-GAME: Dual Boot (overlay) ===
(function initHeroGame() {
  const canvas  = document.getElementById("hero-game");
  if (!canvas) return;
  const heroEl  = document.getElementById("home");
  const ctx     = canvas.getContext("2d");

  const CYAN    = "#22d3ee";
  const PURPLE  = "#8b5cf6";
  const LAVENDER= "#a78bfa";
  const GRAVITY = 0.48;
  const JUMP_V  = -14;
  const SPEED   = 3.2;
  const PW = 14, PH = 20;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  let W = 0, H = 0, platforms = [], gems = [], bug = null;

  const player = {
    x: 80, y: 100, vx: 0, vy: 0,
    grounded: false, coyote: 0, facing: 1,
    walkTimer: 0, inited: false, kind: "game",
    score: 0, invincible: 0,
  };

  const parts = [];
  function burst(x, y, col, n = 5) {
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i / n) + Math.random() * 0.7;
      const s = 0.8 + Math.random() * 1.6;
      parts.push({ x, y, vx: Math.cos(a)*s, vy: Math.sin(a)*s - 0.8,
                   life: 1, col, r: 1 + Math.random() * 1.5 });
    }
  }

  // ── Platform measurement from DOM ────────────────────────────
  function heroRel(el) {
    const hr = heroEl.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    return { x: er.left-hr.left, y: er.top-hr.top, w: er.width, h: er.height };
  }

  function textNodeRect(node) {
    const range = document.createRange();
    range.selectNode(node);
    const r  = range.getBoundingClientRect();
    const hr = heroEl.getBoundingClientRect();
    return { x: r.left-hr.left, y: r.top-hr.top, w: r.width, h: r.height };
  }

  function gemColor(kind) {
    return kind === "sec" ? PURPLE : kind === "name" ? LAVENDER : CYAN;
  }

  function buildPlatforms() {
    platforms = [];
    platforms.push({ x: 0, y: H - 2, w: W, h: 6, kind: "floor" });

    function addEl(sel, kind) {
      const el = document.querySelector(sel);
      if (!el) return;
      const r = heroRel(el);
      if (r.w > 0 && r.h > 0) platforms.push({ ...r, kind });
    }

    addEl(".btn-primary",       "game");
    addEl(".btn-ghost",         "sec");
    addEl(".role-tag.games",    "game");
    addEl(".role-tag.security", "sec");
    addEl(".hero-game-hint",    "game");   // hint pill is a platform

    const nameEl = document.querySelector(".hero-name");
    if (nameEl) {
      [nameEl.childNodes[0], nameEl.childNodes[2]].forEach(node => {
        if (!node) return;
        const r = textNodeRect(node);
        if (r.w > 10) platforms.push({ ...r, kind: "name" });
      });
    }

    // Drawn side platforms — anchored to the HTML platform bounding box
    // so they're always within jumping range regardless of viewport width
    const htmlPlats = platforms.filter(p => p.kind !== "floor");
    if (htmlPlats.length > 0) {
      const minX = Math.min(...htmlPlats.map(p => p.x));
      const maxX = Math.max(...htmlPlats.map(p => p.x + p.w));
      const pw   = Math.max(55, Math.min(80, W * 0.07));
      const gap  = 85; // horizontal gap — within one full-speed jump (~186px max)
      const lx   = Math.max(10, minX - gap - pw);
      const rx   = Math.min(W - pw - 10, maxX + gap);
      [
        { x: lx, y: H * 0.30, w: pw,      kind: "sec"  },
        { x: lx, y: H * 0.55, w: pw + 12, kind: "game" },
        { x: rx, y: H * 0.22, w: pw,      kind: "game" },
        { x: rx, y: H * 0.46, w: pw + 12, kind: "sec"  },
        { x: rx, y: H * 0.70, w: pw,      kind: "game" },
      ].forEach(p => platforms.push({ ...p, h: 8, drawn: true }));
    }

    // spawn player on lowest real platform (first load only)
    if (!player.inited && platforms.length > 1) {
      const real   = platforms.filter(p => p.kind !== "floor");
      const lowest = real.reduce((a, b) => a.y > b.y ? a : b);
      player.x = lowest.x + 10;
      player.y = lowest.y - PH - 2;
      player.inited = true;
    }

    // one gem per real platform, centered just above it
    gems = platforms
      .filter(p => p.kind !== "floor")
      .map((p, i) => ({
        x: p.x + p.w * 0.5,
        y: p.y - 18,
        kind: p.kind,
        off: i * 1.3,
        gone: false,
      }));

    // enemy bug patrols the lower name platform (Quiben line)
    const namePlats = platforms.filter(p => p.kind === "name");
    if (namePlats.length > 0) {
      const bp = namePlats.reduce((a, b) => a.y > b.y ? a : b);
      if (!bug) {
        bug = { x: bp.x + bp.w * 0.35, y: bp.y - 11, vx: 1.1, plat: bp };
      } else {
        bug.plat = bp;
        bug.y    = bp.y - 11;
        bug.x    = Math.max(bp.x + 5, Math.min(bug.x, bp.x + bp.w - 17));
      }
    }
  }

  // ── Resize ───────────────────────────────────────────────────
  function resize() {
    W = heroEl.offsetWidth;
    H = heroEl.offsetHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildPlatforms();
  }

  new ResizeObserver(resize).observe(heroEl);
  resize();

  // ── Input — always on ────────────────────────────────────────
  const K = {};
  document.addEventListener("keydown", e => { K[e.code] = true;  });
  document.addEventListener("keyup",   e => { delete K[e.code]; });

  // Hide the HTML hint on first movement key
  const gameHintEl = document.querySelector(".hero-game-hint");
  const GAME_KEYS = new Set(["ArrowLeft","ArrowRight","ArrowUp","KeyA","KeyD","KeyW"]);
  document.addEventListener("keydown", e => {
    if (GAME_KEYS.has(e.code) && gameHintEl) {
      gameHintEl.classList.add("hidden");
    }
  }, { once: true });

  // ── Update ───────────────────────────────────────────────────
  let t = 0;

  function respawnPlayer() {
    const real = platforms.filter(p => p.kind !== "floor");
    const low  = real.length ? real.reduce((a, b) => a.y > b.y ? a : b)
                             : { x: 80, y: H - 40 };
    player.x = low.x + 10; player.y = low.y - PH - 2;
    player.vx = 0; player.vy = 0; player.grounded = false;
    player.invincible = 90;
  }

  function update() {
    t++;

    if (player.invincible > 0) player.invincible--;

    const left  = K["ArrowLeft"]  || K["KeyA"];
    const right = K["ArrowRight"] || K["KeyD"];
    const jump  = K["ArrowUp"]    || K["KeyW"];

    if (left)       { player.vx = -SPEED; player.facing = -1; }
    else if (right) { player.vx =  SPEED; player.facing =  1; }
    else            { player.vx *= 0.72; }

    if (Math.abs(player.vx) > 0.4) player.walkTimer++;
    else player.walkTimer = 0;

    if (jump && player.coyote > 0) {
      player.vy = JUMP_V;
      player.coyote = 0;
      burst(player.x + PW/2, player.y + PH,
            player.kind === "sec" ? PURPLE : CYAN, 5);
    }

    player.vy = Math.min(player.vy + GRAVITY, 18);
    player.x += player.vx;
    player.y += player.vy;

    if (player.x + PW < 0) player.x = W;
    if (player.x > W)      player.x = -PW;
    if (player.y > H + 40) respawnPlayer();

    // collisions — land on top only
    const wasGrounded = player.grounded;
    player.grounded = false;
    if (player.coyote > 0) player.coyote--;

    for (const p of platforms) {
      const prevBtm  = player.y + PH - player.vy;
      const curBtm   = player.y + PH;
      const overlapX = player.x + PW > p.x + 4 && player.x < p.x + p.w - 4;

      if (p.kind === "floor") {
        if (curBtm >= p.y && prevBtm < p.y + 8 && player.vy >= 0) {
          player.y = p.y - PH; player.vy = 0;
          player.grounded = true; player.coyote = 6;
        }
      } else if (overlapX && curBtm >= p.y && prevBtm < p.y + 8 && player.vy >= 0) {
        player.y = p.y - PH; player.vy = 0;
        player.grounded = true; player.coyote = 6;
        player.kind = p.kind;
      }
    }

    if (!wasGrounded && player.grounded) {
      burst(player.x + PW/2, player.y + PH,
            player.kind === "sec" ? PURPLE : CYAN, 4);
    }

    // gem collection
    for (const g of gems) {
      if (g.gone) continue;
      const bob = Math.sin(t * 0.05 + g.off) * 3;
      if (player.x + PW > g.x - 7 && player.x < g.x + 7 &&
          player.y + PH > g.y + bob - 7 && player.y < g.y + bob + 7) {
        g.gone = true;
        player.score++;
        burst(g.x, g.y + bob, gemColor(g.kind), 8);
        setTimeout(() => { g.gone = false; }, 10000);
      }
    }

    // bug
    if (bug) {
      bug.x += bug.vx;
      const bp = bug.plat;
      if (bug.x < bp.x + 5)              { bug.x = bp.x + 5;              bug.vx =  Math.abs(bug.vx); }
      if (bug.x + 12 > bp.x + bp.w - 5)  { bug.x = bp.x + bp.w - 17;     bug.vx = -Math.abs(bug.vx); }
      bug.y = bp.y - 11;

      // bug hits player
      if (player.invincible === 0 &&
          player.x + PW > bug.x + 2 && player.x < bug.x + 12 &&
          player.y + PH > bug.y + 2 && player.y < bug.y + 10) {
        burst(player.x + PW/2, player.y + PH/2, "#ff5555", 10);
        respawnPlayer();
      }
    }

    // particles
    for (let i = parts.length-1; i >= 0; i--) {
      const p = parts[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life -= 0.045;
      if (p.life <= 0) parts.splice(i, 1);
    }
  }

  // ── Draw ─────────────────────────────────────────────────────
  function drawGem(g) {
    if (g.gone) return;
    const bob  = Math.sin(t * 0.05 + g.off) * 3;
    const glow = 0.5 + 0.5 * Math.sin(t * 0.08 + g.off);
    const col  = gemColor(g.kind);
    ctx.save();
    ctx.shadowColor = col;
    ctx.shadowBlur  = 6 + glow * 7;
    ctx.fillStyle   = col;
    const gy = g.y + bob;
    ctx.beginPath();
    ctx.moveTo(g.x,     gy - 6);
    ctx.lineTo(g.x + 5, gy);
    ctx.lineTo(g.x,     gy + 6);
    ctx.lineTo(g.x - 5, gy);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillRect(g.x - 1, gy - 3, 2, 3);
    ctx.restore();
  }

  function drawBug() {
    if (!bug) return;
    const pulse = 0.8 + 0.2 * Math.sin(t * 0.25);
    ctx.save();
    ctx.fillStyle   = `rgba(255,60,60,${pulse})`;
    ctx.shadowColor = "#ff3c3c";
    ctx.shadowBlur  = 6;
    const bx = Math.round(bug.x), by = Math.round(bug.y);
    ctx.fillRect(bx+2,  by+2, 8, 6);   // body
    ctx.fillRect(bx+3,  by,   6, 4);   // head
    ctx.fillRect(bx,    by+3, 2, 1);   // L top leg
    ctx.fillRect(bx+10, by+3, 2, 1);   // R top leg
    ctx.fillRect(bx,    by+5, 2, 1);   // L bot leg
    ctx.fillRect(bx+10, by+5, 2, 1);   // R bot leg
    ctx.fillStyle = "#ff0000";
    ctx.fillRect(bx+4, by+1, 1, 1);    // L eye
    ctx.fillRect(bx+7, by+1, 1, 1);    // R eye
    ctx.restore();
  }

  function drawPlayer() {
    const acc = player.kind === "sec" ? PURPLE
              : player.kind === "name" ? LAVENDER
              : CYAN;
    // flash during invincibility
    if (player.invincible > 0 && Math.floor(t / 4) % 2 === 0) return;

    const px  = Math.round(player.x);
    const py  = Math.round(player.y);
    const leg = player.grounded && Math.abs(player.vx) > 0.4
      ? Math.round(Math.sin(player.walkTimer * 0.32) * 2) : 0;

    ctx.save();
    ctx.shadowColor = acc;
    ctx.shadowBlur  = 12;

    ctx.fillStyle = "#e2e2ef";
    ctx.fillRect(px+4,  py,      6, 6);
    ctx.fillRect(px+2,  py+6,   10, 7);
    ctx.fillRect(px,    py+6,    2, 4);
    ctx.fillRect(px+12, py+6,    2, 4);
    ctx.fillRect(px+3,  py+13,   3, 5 + (leg > 0 ?  leg : 0));
    ctx.fillRect(px+8,  py+13,   3, 5 + (leg < 0 ? -leg : 0));

    ctx.fillStyle = "#0b0b12";
    ctx.fillRect(player.facing > 0 ? px+9 : px+4, py+2, 1, 1);

    ctx.fillStyle = acc;
    ctx.fillRect(px+4, py+7, 6, 3);

    if (player.grounded) {
      ctx.shadowBlur = 0;
      ctx.fillStyle  = acc + "44";
      ctx.beginPath();
      ctx.ellipse(px + PW/2, py + PH + 1, 7, 2, 0, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawScore() {
    ctx.save();
    ctx.font      = "bold 12px 'Space Mono', monospace";
    ctx.textAlign = "right";
    // backdrop
    ctx.fillStyle = "rgba(11,11,18,0.55)";
    ctx.fillRect(W - 68, 10, 58, 22);
    // text
    ctx.fillStyle = "rgba(136,136,168,0.75)";
    ctx.fillText(`◆ ${player.score}`, W - 14, 26);
    ctx.restore();
  }

  function drawPlatforms() {
    for (const p of platforms) {
      if (!p.drawn) continue;
      const col = p.kind === "sec" ? CYAN : PURPLE;
      ctx.save();
      // Body
      ctx.globalAlpha = 0.10;
      ctx.fillStyle   = col;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      // Top glow edge
      ctx.globalAlpha = 0.75;
      ctx.fillStyle   = col;
      ctx.shadowColor = col;
      ctx.shadowBlur  = 10;
      ctx.fillRect(p.x, p.y, p.w, 2);
      // End caps
      ctx.shadowBlur  = 6;
      ctx.fillRect(p.x, p.y, 2, p.h);
      ctx.fillRect(p.x + p.w - 2, p.y, 2, p.h);
      ctx.restore();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    drawPlatforms();
    for (const g of gems) drawGem(g);
    drawBug();

    for (const p of parts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.shadowColor = p.col;
      ctx.shadowBlur  = 4;
      ctx.fillStyle   = p.col;
      ctx.fillRect(p.x-p.r, p.y-p.r, p.r*2, p.r*2);
      ctx.restore();
    }

    drawPlayer();
    drawScore();

    // hint — visible for ~8 s then fades (canvas copy, HTML label handles discovery)
    if (t < 540) {
      const a = t < 60 ? (t / 60) * 0.6 : t > 420 ? 0.6 * (1 - (t - 420) / 120) : 0.6;
      ctx.save();
      ctx.font      = "11px 'Space Mono', monospace";
      ctx.fillStyle = `rgba(136,136,168,${a})`;
      ctx.textAlign = "center";
      ctx.fillText("← → move  ↑ jump", W / 2, H - 20);
      ctx.restore();
    }
  }

  (function loop() {
    if (!document.hidden) { update(); draw(); }
    requestAnimationFrame(loop);
  })();
})();

// === CV SHOOTER MINI-GAME ===
(function initCVGame() {
  const canvas = document.getElementById("cv-game");
  if (!canvas) return;
  const cvEl = document.getElementById("cv");
  const ctx  = canvas.getContext("2d");
  const dpr  = Math.min(window.devicePixelRatio || 1, 2);

  const CYAN   = "#22d3ee";
  const PURPLE = "#8b5cf6";

  let W = 0, H = 0;
  const mouse = { x: -999, y: -999 };
  let shapes = [], missiles = [], particles = [];
  let hintTimer = 0;
  let isThrusting = false;

  const ship = {
    x: 100, y: 100,
    vx: 0, vy: 0,
    angle: 0,
    size: 8,
  };

  // ── Measure empty dt-cells ────────────────────────────
  function getEmptyAreas() {
    const areas = [];
    const cvR = cvEl.getBoundingClientRect();
    cvEl.querySelectorAll(".dt-cell").forEach(el => {
      if (!el.children.length && !el.textContent.trim()) {
        const r = el.getBoundingClientRect();
        if (r.width > 30 && r.height > 30) {
          areas.push({ x: r.left - cvR.left, y: r.top - cvR.top, w: r.width, h: r.height });
        }
      }
    });
    return areas;
  }

  function rndIn(area, pad = 20) {
    return {
      x: area.x + pad + Math.random() * Math.max(0, area.w - pad * 2),
      y: area.y + pad + Math.random() * Math.max(0, area.h - pad * 2),
    };
  }

  // ── Spawn shapes in empty cells ───────────────────────
  function spawnShapes(areas) {
    shapes = [];
    const TYPES = ["circle", "square", "triangle"];
    const COLS  = [CYAN, PURPLE, "rgba(226,226,239,0.85)"];
    let idx = 0;
    areas.forEach(area => {
      const n = 5 + Math.floor(Math.random() * 3); // 5–7 per empty cell
      for (let i = 0; i < n; i++, idx++) {
        const pos = rndIn(area, 14);
        shapes.push({
          x: pos.x, y: pos.y,
          vx: (Math.random() - 0.5) * 0.7,
          vy: (Math.random() - 0.5) * 0.7,
          rot: Math.random() * Math.PI * 2,
          rotSpd: (Math.random() - 0.5) * 0.022,
          type: TYPES[idx % TYPES.length],
          size: 16 + Math.random() * 14,  // 16–30px
          col: COLS[idx % COLS.length],
          opacity: 0.38 + Math.random() * 0.22,  // 0.38–0.60
          alive: true,
          respawn: 0,
        });
      }
    });
    const start = areas[0];
    if (start) {
      const p = rndIn(start);
      ship.x = p.x; ship.y = p.y;
    } else {
      ship.x = W * 0.25; ship.y = H * 0.5;
    }
    ship.vx = 0; ship.vy = 0;
  }

  // ── Resize / rebuild ──────────────────────────────────
  function resize() {
    W = cvEl.offsetWidth;
    H = cvEl.offsetHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    spawnShapes(getEmptyAreas());
  }

  new ResizeObserver(resize).observe(cvEl);
  resize();

  // ── Input (canvas has pointer-events:none so we listen on section) ──
  cvEl.addEventListener("mousemove", e => {
    const r = cvEl.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
    if (hintTimer === 0) hintTimer = 1;
  });

  cvEl.addEventListener("mouseleave", () => {
    mouse.x = -999; mouse.y = -999;
    isThrusting = false;
  });

  cvEl.addEventListener("mousedown", e => {
    if (e.button !== 0) return;
    if (e.target.closest("a, button")) return;
    isThrusting = true;
  });

  // Release anywhere so button-up outside the section always stops thrust
  window.addEventListener("mouseup", e => {
    if (e.button === 0) isThrusting = false;
  });

  cvEl.addEventListener("contextmenu", e => {
    if (e.target.closest("a, button")) return;
    e.preventDefault();
    missiles.push({
      x: ship.x, y: ship.y,
      vx: Math.cos(ship.angle) * 9,
      vy: Math.sin(ship.angle) * 9,
      dist: 0,
    });
  });

  // ── Explosion burst ───────────────────────────────────
  function explode(x, y, col, n = 14) {
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i / n) + Math.random() * 0.8;
      const s = 0.5 + Math.random() * 2.5;
      particles.push({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        life: 1, decay: 0.022 + Math.random() * 0.02,
        r: 1 + Math.random() * 1.8, col,
      });
    }
  }

  // ── Update ────────────────────────────────────────────
  function update() {
    // Ship angle follows mouse
    if (mouse.x > -900) {
      ship.angle = Math.atan2(mouse.y - ship.y, mouse.x - ship.x);
    }

    // Continuous thrust while left button held
    if (isThrusting && mouse.x > -900) {
      const dx = mouse.x - ship.x;
      const dy = mouse.y - ship.y;
      const d  = Math.hypot(dx, dy) || 1;
      const ACCEL = 0.28;
      ship.vx += (dx / d) * ACCEL;
      ship.vy += (dy / d) * ACCEL;
      // Cap speed
      const spd = Math.hypot(ship.vx, ship.vy);
      if (spd > 6) { ship.vx = ship.vx / spd * 6; ship.vy = ship.vy / spd * 6; }

      // Exhaust particles from engine nozzle (world-space transform of local (0, sz*0.65))
      // wx = ship.x - sz*0.65*cos(angle),  wy = ship.y - sz*0.65*sin(angle)
      const sz = ship.size;
      const ex = ship.x - sz * 0.65 * Math.cos(ship.angle);
      const ey = ship.y - sz * 0.65 * Math.sin(ship.angle);
      const numP = Math.random() < 0.5 ? 2 : 3;
      for (let i = 0; i < numP; i++) {
        const spread = (Math.random() - 0.5) * 1.1;
        const ea = ship.angle + Math.PI + spread;
        const ps = 1.2 + Math.random() * 2.2;
        particles.push({
          x: ex + (Math.random() - 0.5) * 3,
          y: ey + (Math.random() - 0.5) * 3,
          vx: Math.cos(ea) * ps,
          vy: Math.sin(ea) * ps,
          life: 1,
          decay: 0.07 + Math.random() * 0.06,
          r: 1 + Math.random() * 1.6,
          col: Math.random() < 0.55 ? PURPLE : "#f97316",
        });
      }
    }

    ship.x += ship.vx; ship.y += ship.vy;
    ship.vx *= 0.91;   ship.vy *= 0.91;

    const sz = ship.size;
    if (ship.x < sz)     { ship.x = sz;     ship.vx =  Math.abs(ship.vx) * 0.4; }
    if (ship.x > W - sz) { ship.x = W - sz; ship.vx = -Math.abs(ship.vx) * 0.4; }
    if (ship.y < sz)     { ship.y = sz;     ship.vy =  Math.abs(ship.vy) * 0.4; }
    if (ship.y > H - sz) { ship.y = H - sz; ship.vy = -Math.abs(ship.vy) * 0.4; }

    // Shapes drift and bounce
    for (const s of shapes) {
      if (!s.alive) { if (--s.respawn <= 0) s.alive = true; continue; }
      s.x += s.vx; s.y += s.vy; s.rot += s.rotSpd;
      if (s.x < s.size)     { s.x = s.size;     s.vx =  Math.abs(s.vx); }
      if (s.x > W - s.size) { s.x = W - s.size; s.vx = -Math.abs(s.vx); }
      if (s.y < s.size)     { s.y = s.size;      s.vy =  Math.abs(s.vy); }
      if (s.y > H - s.size) { s.y = H - s.size;  s.vy = -Math.abs(s.vy); }
    }

    // Missiles travel and hit-test
    for (let i = missiles.length - 1; i >= 0; i--) {
      const m = missiles[i];
      m.x += m.vx; m.y += m.vy; m.dist += 9;
      if (m.dist > 520 || m.x < -20 || m.x > W + 20 || m.y < -20 || m.y > H + 20) {
        missiles.splice(i, 1); continue;
      }
      for (const s of shapes) {
        if (!s.alive) continue;
        if (Math.hypot(m.x - s.x, m.y - s.y) < s.size + 3) {
          explode(s.x, s.y, s.col, 14);
          s.alive = false;
          s.respawn = (180 + Math.random() * 180) | 0;
          missiles.splice(i, 1);
          break;
        }
      }
    }

    // Particles decay
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.06;
      p.life -= p.decay;
      if (p.life <= 0) particles.splice(i, 1);
    }

    if (hintTimer > 0) hintTimer++;
  }

  // ── Draw shapes ───────────────────────────────────────
  function drawShape(s) {
    if (!s.alive) return;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rot);
    ctx.globalAlpha = s.opacity;
    ctx.strokeStyle = s.col;  ctx.lineWidth  = 1.2;
    ctx.shadowColor = s.col;  ctx.shadowBlur = 10;
    ctx.beginPath();
    if (s.type === "circle") {
      ctx.arc(0, 0, s.size, 0, Math.PI * 2);
    } else if (s.type === "square") {
      ctx.rect(-s.size, -s.size, s.size * 2, s.size * 2);
    } else {
      ctx.moveTo(0, -s.size);
      ctx.lineTo( s.size * 0.866,  s.size * 0.5);
      ctx.lineTo(-s.size * 0.866,  s.size * 0.5);
      ctx.closePath();
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawShip() {
    const spd = Math.hypot(ship.vx, ship.vy);
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle + Math.PI / 2);  // +90° so angle=0 (right) points tip right
    const sz = ship.size;

    // Engine flame — brighter while thrusting, dimmer on coasting
    const flameOn = isThrusting ? Math.max(spd / 4, 0.6) : spd / 4;
    if (flameOn > 0.05) {
      ctx.globalAlpha = 0.75 * Math.min(flameOn, 1);
      ctx.fillStyle   = PURPLE;
      ctx.shadowColor = PURPLE; ctx.shadowBlur = 16;
      const fl = isThrusting ? sz * 0.65 + spd * 1.8 + 4 : sz * 0.65 + spd * 1.8;
      ctx.beginPath();
      ctx.moveTo(-sz * 0.35, sz * 0.65);
      ctx.lineTo(0, fl);
      ctx.lineTo( sz * 0.35, sz * 0.65);
      ctx.closePath();
      ctx.fill();
    }

    // Ship body
    ctx.globalAlpha = 1;
    ctx.fillStyle   = "rgba(34,211,238,0.12)";
    ctx.strokeStyle = CYAN; ctx.lineWidth  = 1.5;
    ctx.shadowColor = CYAN; ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(0,   -sz * 1.6);
    ctx.lineTo( sz,  sz);
    ctx.lineTo(0,    sz * 0.5);
    ctx.lineTo(-sz,  sz);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cockpit dot
    ctx.globalAlpha = 0.65;
    ctx.fillStyle   = CYAN; ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.arc(0, -sz * 0.45, sz * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawMissile(m) {
    ctx.save();
    ctx.strokeStyle = PURPLE; ctx.lineWidth  = 2;
    ctx.shadowColor = PURPLE; ctx.shadowBlur = 8;
    ctx.globalAlpha = 0.85;   ctx.lineCap    = "round";
    ctx.beginPath();
    ctx.moveTo(m.x, m.y);
    ctx.lineTo(m.x - m.vx * 2.5, m.y - m.vy * 2.5);
    ctx.stroke();
    ctx.fillStyle  = "#e2e2ef"; ctx.shadowBlur = 3;
    ctx.beginPath();
    ctx.arc(m.x, m.y, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ── Draw frame ────────────────────────────────────────
  function draw() {
    ctx.clearRect(0, 0, W, H);

    for (const s of shapes)   drawShape(s);
    for (const m of missiles) drawMissile(m);

    for (const p of particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle   = p.col;
      ctx.shadowColor = p.col; ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    drawShip();

    // Hint — fades in and out, shown once on first mouse entry
    if (hintTimer > 0 && hintTimer < 360) {
      const a = hintTimer < 60 ? hintTimer / 60 : hintTimer > 300 ? (360 - hintTimer) / 60 : 1;
      ctx.save();
      ctx.font      = "10px 'Space Mono', monospace";
      ctx.fillStyle = `rgba(136,136,168,${a * 0.5})`;
      ctx.textAlign = "center";
      ctx.fillText("click: thrust  ·  right-click: fire", W / 2, H - 18);
      ctx.restore();
    }
  }

  (function loop() {
    if (!document.hidden) { update(); draw(); }
    requestAnimationFrame(loop);
  })();
})();
