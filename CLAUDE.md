# Jonathan Quiben — Portfolio Site (School Assignment)

## Project Overview
Personal portfolio site for Jonathan Quiben — Senior Security Engineer at Payoneer and M.Des Game Design student at Shenkar College. Built as a school assignment. Dual identity: security professional by day, game developer by night.

**Dev server:** `npm run dev` → `http://localhost:5174/example_html/`  
**Build tool:** Vite v5.4.1  
**Stack:** Vanilla HTML + CSS + JS (no frameworks), `<script type="module">`

---

## File Structure

```
ex_2_resources_updated/
├── index.html          — single-page site, all sections
├── main.js             — all interactivity (nav, accordion, games, etc.)
├── styles/
│   ├── main.css        — all styles (imports reset.css)
│   └── reset.css       — CSS reset
└── public/
    ├── favicon.png
    └── img/
        ├── covid.svg       — hand-drawn chart SVG for project card
        ├── perlin.svg      — procedural terrain SVG for project card
        └── steamventure.svg
```

---

## Design Tokens (CSS variables)

```css
--bg:           #0b0b12   /* near-black background */
--bg-card:      #13131f
--bg-card-hover:#1a1a2e
--text:         #e2e2ef
--text-muted:   #8888a8
--purple:       #8b5cf6   /* game dev / education accent */
--cyan:         #22d3ee   /* security / work accent */
--border:       rgba(255,255,255,0.07)
--font-serif:   "Frank Ruhl Libre"
--font-mono:    "Space Mono"
```

---

## Sections (in order)

### `#home` — Hero
- Full-viewport, dark background with `hero-bg` gradient overlay (purple 22% bottom-left, cyan 18% top-right, plus a subtle 64px CSS grid mask).
- Canvas overlay `#hero-game` (pointer-events: none, z-index 2).
- Content: eyebrow `// security.exe && game‑dev.exe`, h1 name, role tags, bio, CTA buttons, game hint.
- **Role tag order:** `<span class="role-tag games">Game Developer</span>` (left) × `<span class="role-tag security">Security Engineer</span>` (right).
- CTA: "View Projects" (`.btn-primary`, purple) + "zerogamedev.com ↗" (`.btn-ghost`).
- `.hero-game-hint` — cyan mono text `// mini-game active ← → ↑`, pulsing opacity animation, fades out (`.hidden` class) on first game key press.

### `#about` — About
- Two-column grid: text left, skills right.
- Skills split into Security / Game Dev / Code groups with cyan `›` / purple `›` accents.
- `.fade-in` scroll animation on both columns.

### `#projects` — Projects
- Accordion list (`.project-row`). Each row has a header button + collapsible body.
- Body contains: img (YouTube thumbnail or local SVG), description, links.
- Video links use `data-video` + `data-title` attributes → opens `#video-modal`.
- 14 projects total (01–14).

### `#cv` — Career / CV
- Canvas overlay `#cv-game` (pointer-events: none, z-index 1) for the shooter mini-game.
- Two-column layout: `.dual-timeline` (main, 1fr 88px 1fr grid) + `.cv-sidebar` (260px).
- **Column order: Education LEFT, Work RIGHT.**
- Rows top-to-bottom (newest first):
  | Year | Education (left) | Work (right) |
  |------|-----------------|--------------|
  | 2024 | M.Des Game Dev — Shenkar · 2024–Present | Senior Security Engineer — Payoneer · 2016–Present |
  | 2022 | *(empty)* | Teaching Assistant — Open University · Part-time |
  | 2020 | Game Dev & Design Course — Open University · 2020–2022 | *(empty)* |
  | 2014 | B.Sc Computer Science — H.I.T. · 2014–2018 | *(empty)* |
  | 2013 | *(empty)* | Information Security Analyst — Isracard · 2013–2016 |
  | 2008 | MCSE: Enterprise Admin — Microsoft · 2008 | SIEM/SOC & Forensics — IAF Ofek Unit · 2008–2013 |
- The 3 empty cells (2022-left, 2014-right, 2013-left) are where CV game shapes spawn.
- Sidebar: Certifications, Languages, Tools & Tech tags.
- Dot colors: cyan = work (`.dt-dot--job`), purple = education (`.dt-dot--study`).

### `#contact` — Contact
- Email: `jonycapo89@gmail.com`
- Social links: zerogamedev.com, GitHub (ForteGospel), LinkedIn, YouTube (@zerogamedev).

---

## Interactive Features

### Hero Mini-Game (`#hero-game` canvas)
Transparent canvas overlay on the hero section. The player is a small pixel character that walks on actual HTML elements as platforms.

**Platforms (measured via `getBoundingClientRect()` relative to heroEl):**
- `.btn-primary` → kind: "game" (cyan)
- `.btn-ghost` → kind: "sec" (purple)
- `.role-tag.games` → kind: "game"
- `.role-tag.security` → kind: "sec"
- `hero-name` childNodes[0] ("Jonathan") and childNodes[2] ("Quiben") → kind: "name" (lavender), measured via `document.createRange().selectNode(textNode).getBoundingClientRect()`
- Invisible floor at canvas bottom

**Controls:** Arrow keys or WASD. Always-on (no hover gate).

**Features:**
- Walking animation with leg sway, facing direction (eye pixel)
- Coyote time (6 frames) for forgiving jump timing
- Player color changes to match platform kind (cyan/purple/lavender)
- Engine/shadow glow that changes color with player kind
- **Gems:** 1 diamond per platform, floating with bob + glow, color-coded. Burst particles on collect. Respawn after 10s.
- **Score:** `◆ N` top-right corner with dark backdrop
- **Bug enemy:** Red pixel spider patrolling the lower name platform (Quiben line). Kills player on contact → respawn with 90-frame invincibility (flashing every 4 frames).
- **Hint text:** "← → move ↑ jump" fades in/out for first 360 frames.
- `ResizeObserver` on heroEl → rebuilds platforms on resize.
- DPR scaling: `canvas.width = W * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0)`

### CV Shooter Mini-Game (`#cv-game` canvas)
Transparent canvas overlay on the CV section. A ship navigates the blank timeline spaces.

**Shapes:** 5–7 hollow shapes per empty `.dt-cell` (circle, square, triangle). Drift slowly, bounce off canvas edges, rotate. Colors: cyan / purple / white. Opacity 0.38–0.60. Size 16–30px.

**Ship:** Small cyan triangle with cockpit dot. Tracks mouse angle via `atan2`. Starts in first empty area.

**Controls (listeners on `#cv` section, not canvas):**
- **Mouse move** → ship rotates to face cursor
- **Left click hold** → continuous thrust toward mouse (0.28 px/frame² acceleration, max 6 px/frame, 9% damping). Emits 2–3 exhaust particles per frame from the engine nozzle (purple + orange, spread ±0.55 rad). `mouseup` on `window` always cancels.
- **Right click** → fires missile in ship's facing direction (speed 9 px/frame, max 520px travel). Browser context menu suppressed unless target is `a` or `button`.

**Engine flame glyph:** Visible at 60% min brightness when thrusting (even before speed builds), fades with speed on coast.

**Explosion:** 14 radial particles in shape's color, slight gravity droop, fade over ~10–17 frames. Shape respawns after 3–6 seconds (180–360 frames).

**Hint text:** "click: thrust · right-click: fire" — fades in/out on first mouse entry (360 frames).

**World-space engine nozzle math:**
```
// Local point (0, sz*0.65) after rotate(angle + PI/2):
ex = ship.x - sz * 0.65 * cos(angle)
ey = ship.y - sz * 0.65 * sin(angle)
// Exhaust fires in direction: angle + PI ± spread
```

---

## Key CSS Patterns

### Dual Timeline
```css
.dual-timeline {
  display: grid;
  grid-template-columns: 1fr 88px 1fr;
  position: relative;
}
.dual-timeline::before {  /* continuous vertical line */
  content: '';
  position: absolute;
  top: 2.75rem; bottom: 0; left: 50%;
  transform: translateX(-50%);
  width: 1px;
  background: var(--border);
}
.dt-cell.dt-right { text-align: right; padding: 0.75rem 0 1.75rem 1.5rem; }
.dt-cell          { padding: 0.75rem 1.5rem 1.75rem 0; }
/* Mobile ≤680px: collapses to 1fr, empty cells hidden, right-align reverts */
```

### Canvas Overlays
Both canvases use the same pattern:
```css
position: absolute; inset: 0; width: 100%; height: 100%;
pointer-events: none; z-index: N;
```
Parent section needs `position: relative`.

### Project Accordion
`.project-row-body` uses `max-height: 0 → 500px` with `overflow: hidden` + `transition` for open/close animation (not `grid-template-rows: 0fr` — that failed with padded children).

### Fade-in on scroll
`.fade-in` elements are observed by `IntersectionObserver` (threshold 0.12). Add class `visible` on intersect → CSS transition from `opacity:0; transform: translateY(20px)` to visible state.

---

## JS Architecture (main.js)

All code is top-level module scope (no outer wrapper). Sections in order:
1. **Nav** — `IntersectionObserver` for active link, mobile toggle
2. **Project accordion** — click handler, close others, aria-expanded
3. **Video modal** — `#video-modal`, YouTube iframe src swap, backdrop/ESC close
4. **Fade-in** — scroll observer
5. **Hero game IIFE** — `initHeroGame()`
6. **CV game IIFE** — `initCVGame()`

---

## Things the User Cares About
- Subtle/tasteful use of animation — don't overdo it
- Dual identity (security + game dev) should be felt throughout
- Games should feel like easter eggs, not distractions
- The timeline is the centrepiece of the CV section
- Mobile must work (timeline collapses to single column, empty cells hidden)
