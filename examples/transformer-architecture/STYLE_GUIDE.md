# Y2K / Retro Terminal Design System — Unified Reference

A design system for building nostalgic, character-rich, deliberately retro artifacts in React. Covers **presentations** (slide decks) and **dashboards** (data-dense single-page apps). Both share a philosophy rooted in CRT phosphor displays, early web aesthetics, and the visual language of 1990s–2000s operating systems and terminals.

**Tech stack**: React 18, Tailwind CSS, Recharts, Lucide React icons. No animation libraries.

---

## 1. Design Philosophy

- **CRT as metaphor.** The screen is a monitor. Scanlines are visible. The phosphor glows. Colors are the limited palette of early CRTs — phosphor green, amber, or blue-white on near-black.
- **Pixel precision.** Borders are 1px or 2px. Elements sit on a visible grid. Nothing bleeds or blurs. The aesthetic is precise, mechanical, and low-resolution by choice.
- **Noise and texture are structural.** Scanlines, dot patterns, and subtle noise overlays are part of the design — they communicate "this is a screen," not decoration.
- **Blinking and pulsing signal liveness.** The only animation permitted is cursor blink (`animate-pulse` on `_` or `█`) and a slow scanline drift. These are period-appropriate and functional.
- **Typography is a character.** The font *is* the system. Pixel fonts, bitmap recreations, or monospaced fonts with strong mechanical character define the look entirely.
- **Retro-forward.** This is not pastiche. It is a deliberate aesthetic choice — the nostalgia is wielded with control. Use the visual vocabulary purposefully, not exhaustively.

---

## 2. Typography

### Font Selection

| Artifact | Font | Import |
|---|---|---|
| Presentations | **VT323** (pixel terminal font, strong identity) | `@import url('https://fonts.googleapis.com/css2?family=VT323&display=swap')` |
| Dashboards | **Share Tech Mono** (readable at small sizes, techy) | `@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap')` |
| Alternative | **Press Start 2P** (pure pixel, use sparingly for headers only) | `@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap')` |

Apply with `-webkit-font-smoothing: none` (crisp pixel rendering, not smooth). The slight roughness is intentional.

> **Note on Press Start 2P**: Very wide and dense. Use only for large display text and titles. Never for body copy or table cells — it becomes unreadable below 14px.

### Weight Rules

VT323 and Share Tech Mono are single-weight fonts. Weight variation is achieved through:
- **Size**: Primary values are large; secondary text is small
- **Color brightness**: Bright phosphor for primary, dim phosphor for secondary
- **All-caps**: Used for section labels, categories, and system-level information

### Typographic Signatures

- **The blinking cursor**: A `█` or `_` character rendered in the phosphor color with `animate-pulse`. Used at the end of active/loading states.
- **Prompt prefixes**: All interactive elements and labels use terminal prompt syntax: `$`, `>`, `#`, `[USER@SYSTEM]`, `C:\>`.
- **Bracket notation for metadata**: `[OK]`, `[ERROR]`, `[2024-03-31]`, `[LIVE]`, `[--]`. Brackets are a key syntactic element.
- **Scrolling ticker**: Horizontal marquee-style status information in a footer bar.
- **Line noise**: Occasionally insert a line of `░░░░░░` or `────────` as a divider. More expressive than a plain border.
- **No mixed case in labels**: Everything is `UPPERCASE` for system labels, or lowercase for data values — never title case.

### Dashboard Type Scale

| Element | Classes / Style |
|---|---|
| Page title | `text-xl uppercase tracking-widest font-mono` in phosphor color |
| Page subtitle | `text-xs font-mono` at 60% phosphor opacity |
| Chart card title | `text-sm uppercase tracking-wider font-mono` |
| Chart card subtitle | `text-[11px] font-mono` at 50% opacity |
| KPI big number | `text-4xl font-mono` (VT323 renders large cleanly) |
| KPI label | `text-[10px] uppercase tracking-widest font-mono` |
| Section divider | `text-[10px] uppercase tracking-[0.2em] font-mono` |
| Table cells | `text-xs font-mono` |
| Body prose | `text-sm font-mono` |

### Presentation Type Scale

| Element | Style |
|---|---|
| Slide title | `text-5xl` VT323 or `text-3xl` Press Start 2P — phosphor color |
| Slide subtitle | `text-base font-mono` at 65% phosphor |
| System label | `text-[10px] uppercase tracking-[0.3em] font-mono` at 45% opacity |
| Card heading | `text-sm uppercase tracking-wider font-mono` |
| Body text | `text-sm font-mono` |

---

## 3. Color System

### Philosophy

The palette is the CRT phosphor. Pick one phosphor color and use it exclusively for all primary content. Secondary and muted variants are brightness steps of the same hue. Never use multiple saturated colors simultaneously — this breaks the monochromatic terminal illusion.

### Phosphor Presets

```js
const PHOSPHORS = {
  green: {
    primary:    '#00ff41',  // classic green phosphor — max brightness
    secondary:  '#00dd3a',  // mid brightness
    dim:        '#00aa2e',  // low brightness / muted (must stay readable at 9px)
    ghost:      '#005a15',  // barely visible — grid lines, placeholders
    bg:         '#0a0a00',  // near-black with warm cast
  },
  amber: {
    primary:    '#ffb000',  // amber phosphor
    secondary:  '#cc8800',  // mid amber
    dim:        '#7a5200',  // dim amber
    ghost:      '#3d2900',  // ghost amber
    bg:         '#0a0600',  // near-black with warm cast
  },
  blue: {
    primary:    '#00aaff',  // blue-white CRT
    secondary:  '#0077cc',  // mid blue
    dim:        '#004477',  // dim blue
    ghost:      '#001f3d',  // ghost blue
    bg:         '#00000a',  // near-black with cool cast
  },
}

// Default: green phosphor
const PHOSPHOR = PHOSPHORS.green
```

### Surface Colors

| Role | Value (Green preset) | Usage |
|---|---|---|
| Base background | `#0a0a00` | Outer page — near-black, warm |
| Surface 1 | `#0d0d01` | Cards, panels |
| Surface 2 | `#111102` | Elevated panels, active rows |
| Border | `#005a15` (ghost green) | Card borders, dividers |
| Border bright | `#009926` (dim green) | Active borders, focused elements |

### Chart Color Sequence

In monochromatic mode (recommended):
```js
const CHART_PALETTE_MONO = [
  '#00ff41',  // 100% — primary series
  '#00dd3a',  // 80% — secondary
  '#00aa2e',  // 50% — tertiary
  '#007a1a',  // 30% — quaternary
]
```

For multi-series charts where differentiation is essential:
```js
const CHART_PALETTE_MULTI = [
  '#00ff41',  // green — primary
  '#ffb000',  // amber — secondary
  '#00aaff',  // blue — tertiary
  '#ff4444',  // red — error/alert only
]
```

### CRT Effects

```css
/* Scanline overlay — apply as ::after on root container */
.scanlines::after {
  content: '';
  position: fixed;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 255, 65, 0.025) 2px,
    rgba(0, 255, 65, 0.025) 4px
  );
  pointer-events: none;
  z-index: 9999;
}

/* Phosphor glow on primary elements */
.glow-phosphor { text-shadow: 0 0 8px rgba(0, 255, 65, 0.8), 0 0 20px rgba(0, 255, 65, 0.3); }

/* Box glow on cards */
.glow-box { box-shadow: 0 0 10px rgba(0, 255, 65, 0.1), inset 0 0 20px rgba(0, 255, 65, 0.03); }

/* Screen flicker — very subtle, on entire screen container */
@keyframes flicker {
  0%, 100% { opacity: 1; }
  92% { opacity: 1; }
  93% { opacity: 0.97; }
  94% { opacity: 1; }
}
.crt-flicker { animation: flicker 8s infinite; }

/* Cursor blink — use on _ or █ characters */
@keyframes blink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
.cursor-blink { animation: blink 1s step-end infinite; }
```

### Semantic Color Assignment

| Color | Role |
|---|---|
| **primary phosphor** | Active data, primary values, online status, main series |
| **secondary phosphor** | Secondary series, supporting values |
| **dim phosphor** | Inactive, disabled, muted labels |
| **ghost phosphor** | Borders, gridlines, placeholders |
| **red (#ff6666)** | Errors, failures, system alerts |
| **amber (#ffcc33)** | Warnings only (if not using amber phosphor preset) |

### Node Accent Colors

Diagram nodes use bold, distinct accent colors so components are immediately recognizable. Each color has a tinted `bg`, a saturated `border`, and a bright `text`. Backgrounds must be clearly visible against the near-black page — not near-black themselves.

| Name | Hue | bg | border | text | Used for |
|---|---|---|---|---|---|
| **sea** | Bright green | `#00441a` | `#00ff41` | `#00ff55` | Input, tokens, embeddings |
| **sage** | Purple | `#220044` | `#9955dd` | `#bb88ff` | Encoder |
| **slate** | Teal | `#003333` | `#00bbaa` | `#33ddcc` | Decoder |
| **mist** | Blue | `#002244` | `#0099ff` | `#33bbff` | Attention mechanisms |
| **sky** | Cyan | `#003344` | `#00bbdd` | `#33ddff` | Positional encoding |
| **clay** | Yellow | `#333300` | `#aaaa00` | `#dddd33` | Output head |
| **sand** | Gold | `#3d2800` | `#eebb33` | `#ffcc44` | FFN |
| **stone** | Khaki | `#2a2a00` | `#99aa00` | `#bbcc33` | Normalization |
| **warm** | Amber | `#442200` | `#ffaa00` | `#ffcc33` | Variants, external |
| **blush** | Red | `#440a0a` | `#ff3333` | `#ff6666` | Errors, alerts |
| **default** | Green | `#1a3300` | `#00cc33` | `#00ff41` | Cards, uncolored elements |

**Key principle:** Adjacent nodes must use colors with clearly different hues — not just different brightness levels of the same hue. Green vs emerald is too subtle; green vs teal or green vs yellow is distinct.

---

## 4. Surfaces, Borders & Depth

### Cards

| Property | Presentation | Dashboard |
|---|---|---|
| Background | `bg-[#0d0d01]` | `bg-[#0d0d01]` |
| Border | `border border-[#003d0d]` | `border border-[#003d0d]` |
| Radius | `rounded-none` | `rounded-none` |
| Padding | `p-4` | `p-3` |
| Shadow / Glow | `glow-box` | `glow-box` |

### Window Chrome Pattern

Cards in this system are styled as terminal windows with a title bar:

```jsx
<div className="border border-[#003d0d] glow-box">
  {/* Title bar */}
  <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[#003d0d] bg-[#111102]">
    <span className="text-[#00ff41] text-[10px] font-mono uppercase tracking-widest">{title}</span>
    <span className="ml-auto text-[#007a1a] text-[10px] font-mono">[{status}]</span>
  </div>
  {/* Content */}
  <div className="p-3">{children}</div>
</div>
```

### Depth Through Border Brightness

```
Background (#0a0a00) → Surface 1 (#0d0d01) → Surface 2 (#111102)
Borders: ghost (#005a15) → dim (#009926) → secondary (#00dd3a) → primary (#00ff41)
```

Active/selected elements use a brighter border color, not a background fill.

### Active State Pattern

```jsx
<div className={`border font-mono transition-none ${
  isActive
    ? 'border-[#00cc33] text-[#00ff41]'
    : 'border-[#003d0d] text-[#007a1a] hover:border-[#007a1a] hover:text-[#00cc33]'
}`} />
```

---

## 5. Recharts Styling

### Axes

```jsx
<XAxis
  dataKey="label"
  tick={{ fontSize: 10, fill: '#007a1a', fontFamily: 'Share Tech Mono' }}
  axisLine={{ stroke: '#003d0d', strokeWidth: 1 }}
  tickLine={{ stroke: '#003d0d', strokeWidth: 1 }}
/>
<YAxis
  tick={{ fontSize: 10, fill: '#007a1a', fontFamily: 'Share Tech Mono' }}
  axisLine={{ stroke: '#003d0d', strokeWidth: 1 }}
  tickLine={false}
  width={40}
/>
```

Visible axis lines in ghost color. Tick marks on X only.

### Gridlines

```jsx
<CartesianGrid strokeDasharray="2 4" stroke="#003d0d" strokeWidth={1} />
```

Short dashes on long gaps — resembles graph paper or old oscilloscope grids.

### Bars

```jsx
<Bar fill="#00ff41" radius={[0, 0, 0, 0]} barSize={16} fillOpacity={0.7}>
  {data.map((_, i) => <Cell key={i} />)}
</Bar>
```

Square corners. Semi-transparent phosphor fill — the grid shows through.

### Area Charts — Phosphor Gradient

```jsx
<defs>
  <linearGradient id="phosphorGrad" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stopColor="#00ff41" stopOpacity={0.3} />
    <stop offset="100%" stopColor="#00ff41" stopOpacity={0} />
  </linearGradient>
</defs>
<Area type="monotone" stroke="#00cc33" strokeWidth={1.5} fill="url(#phosphorGrad)" />
```

### Line Charts

```jsx
<Line type="monotone" strokeWidth={1.5} stroke="#00ff41" strokeOpacity={0.9} dot={false} />
```

Thin lines — CRT vector plots were never thick. Secondary: `stroke="#007a1a"`.

### Pie / Donut Charts

Avoid. Use a horizontal bar chart with `░` / `█` ASCII fill instead for the full effect:

```jsx
function AsciiBar({ label, value, max }) {
  const filled = Math.round((value / max) * 20)
  const bar = '█'.repeat(filled) + '░'.repeat(20 - filled)
  return (
    <div className="font-mono text-xs flex gap-3">
      <span className="text-[#007a1a] w-20 truncate">{label}</span>
      <span className="text-[#00ff41]">{bar}</span>
      <span className="text-[#00cc33]">{value}</span>
    </div>
  )
}
```

### Tooltips

```jsx
<div className="border border-[#00cc33] bg-[#0a0a00] px-3 py-2 text-xs font-mono glow-box">
  <div className="text-[#007a1a] text-[10px] uppercase tracking-widest mb-1">[{label}]</div>
  <div className="text-[#00ff41] text-base font-mono glow-phosphor">{value}</div>
</div>
```

No radius. Phosphor glow on the value.

### Legends

```jsx
const renderLegend = ({ payload }) => (
  <div className="flex gap-5">
    {payload.map((p, i) => (
      <span key={i} className="flex items-center gap-2 text-[10px] font-mono uppercase">
        <span style={{ color: p.color }}>██</span>
        <span style={{ color: '#007a1a' }}>{p.value}</span>
      </span>
    ))}
  </div>
)
```

ASCII block markers. Monospace, dim color for label.

---

## 6. Spacing & Layout

### Dashboard

- Container: `max-w-[1400px] mx-auto px-4`
- Vertical rhythm: `space-y-3` (12px) — compact; terminal UIs are dense
- KPI grids: `gap-2` (8px)
- Chart grids: `gap-3` (12px)

### Presentation

- Slide canvas: `max-w-[1100px]`, `aspect-[16/9]`
- Content padding: `px-10 py-8`
- Grid gaps: `gap-3`

### Boot Screen Pattern (Title Slide)

```jsx
<div className="flex flex-col items-start justify-center h-full px-10 py-8 font-mono">
  <div className="text-[#007a1a] text-xs mb-6 space-y-0.5">
    <div>BIOS v2.40.12 © 1998–2024</div>
    <div>Detecting components...</div>
    <div>RAM OK [65536KB]</div>
    <div>CPU OK [DATACORE/486]</div>
    <div className="text-[#00cc33]">SYSTEM READY</div>
  </div>
  <div className="text-[#00ff41] text-5xl leading-tight glow-phosphor" style={{ fontFamily: 'VT323' }}>
    {title}
  </div>
  <div className="text-[#00cc33] text-base mt-4">{subtitle} <span className="cursor-blink">█</span></div>
</div>
```

### Status Bar (Persistent Footer)

```jsx
<div className="border-t border-[#003d0d] bg-[#0a0a00] px-4 py-1 flex items-center justify-between text-[10px] font-mono text-[#007a1a]">
  <span>[SYSTEM ONLINE] // {new Date().toISOString()}</span>
  <span>MEM: 82% // CPU: 34% // NET: OK</span>
  <span>USER@PROD <span className="cursor-blink text-[#00ff41]">_</span></span>
</div>
```

---

## 7. Component Patterns

### Shared: Section Divider

ASCII-style rule:

```jsx
<div className="flex items-center gap-2 my-4 font-mono text-[#003d0d] text-xs">
  <span>{'────'}</span>
  <span className="text-[10px] uppercase tracking-widest text-[#007a1a] whitespace-nowrap">
    // {label}
  </span>
  <span className="flex-1">{'──────────────────────────────────'}</span>
</div>
```

### Dashboard Components

**KpiCard** — Window-chrome style with phosphor glow on value:

```jsx
<div className="border border-[#003d0d] glow-box">
  <div className="border-b border-[#003d0d] bg-[#111102] px-3 py-1 flex items-center justify-between">
    <span className="text-[10px] font-mono uppercase tracking-widest text-[#007a1a]">{label}</span>
    <span className="text-[10px] font-mono text-[#003d0d]">[KPI]</span>
  </div>
  <div className="p-3">
    <div className="text-4xl font-mono text-[#00ff41] glow-phosphor tabular-nums">{value}</div>
    <DeltaBadge value={delta} />
  </div>
</div>
```

**Delta Badge** — Inline, monospace:

```jsx
const DeltaBadge = ({ value }) => (
  <div className={`text-xs font-mono mt-1 ${value >= 0 ? 'text-[#00cc33]' : 'text-[#ff4444]'}`}>
    {value >= 0 ? '[+' : '['}{value}%] {value >= 0 ? '↑ INCREASE' : '↓ DECREASE'}
  </div>
)
```

**ChartCard** — Terminal window:

```jsx
<div className="border border-[#003d0d] glow-box">
  <div className="border-b border-[#003d0d] bg-[#111102] px-3 py-1.5 flex items-center gap-2">
    <span className="text-[#00cc33] text-[10px] font-mono">$</span>
    <span className="text-[10px] font-mono uppercase tracking-widest text-[#00cc33]">{title}</span>
    {subtitle && <span className="ml-auto text-[10px] font-mono text-[#007a1a]">{subtitle}</span>}
  </div>
  <div className="p-3">{children}</div>
</div>
```

**StatusDot** — Bracket status:

```jsx
<span className={`text-xs font-mono ${status === 'ok' ? 'text-[#00ff41]' : 'text-[#ff4444]'}`}>
  {status === 'ok' ? '[OK]' : '[ERR]'} {label.toUpperCase()}
</span>
```

**DataTable**:

```jsx
<div className="border border-[#003d0d] glow-box font-mono">
  <div className="border-b border-[#00cc33] bg-[#111102] px-3 py-1.5 grid gap-4" style={{ gridTemplateColumns: cols.map(() => '1fr').join(' ') }}>
    {cols.map(c => (
      <span key={c} className="text-[10px] uppercase tracking-widest text-[#00cc33]">{c}</span>
    ))}
  </div>
  {rows.map((r, i) => (
    <div key={i} className={`px-3 py-1.5 grid gap-4 border-b border-[#003d0d] hover:bg-[#111102] transition-none ${i % 2 !== 0 ? 'bg-[#0d0d01]' : ''}`}
      style={{ gridTemplateColumns: cols.map(() => '1fr').join(' ') }}>
      {r.map((cell, j) => (
        <span key={j} className="text-xs text-[#00cc33] tabular-nums">{cell}</span>
      ))}
    </div>
  ))}
</div>
```

**Terminal Log**:

```jsx
<div className="border border-[#003d0d] bg-[#0a0a00] glow-box">
  <div className="border-b border-[#003d0d] bg-[#111102] px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-[#007a1a]">
    [SYSTEM LOG] -- LIVE FEED
  </div>
  <div className="p-3 font-mono text-xs max-h-48 overflow-y-auto space-y-0.5">
    {events.map((e, i) => (
      <div key={i} className="flex gap-3">
        <span className="text-[#003d0d] shrink-0 tabular-nums">{e.time}</span>
        <span className="text-[#007a1a] shrink-0">[{e.level.toUpperCase()}]</span>
        <span className={e.level === 'error' ? 'text-[#ff4444]' : e.level === 'warn' ? 'text-[#ffb000]' : 'text-[#00cc33]'}>
          {e.message}
        </span>
      </div>
    ))}
    <div className="text-[#00ff41]">{'> '}<span className="cursor-blink">█</span></div>
  </div>
</div>
```

**Button — Primary**:

```jsx
<button className="border border-[#00cc33] bg-[#003d0d] text-[#00ff41] px-4 py-2 text-xs font-mono uppercase tracking-widest
  hover:bg-[#007a1a] hover:border-[#00ff41] transition-none glow-box">
  {'> '}{label}
</button>
```

**Button — Secondary**:

```jsx
<button className="border border-[#003d0d] text-[#007a1a] px-4 py-2 text-xs font-mono uppercase tracking-widest
  hover:border-[#007a1a] hover:text-[#00cc33] transition-none">
  [{label}]
</button>
```

### Presentation-Specific

**Slide Layout Templates**

| Type | Layout |
|---|---|
| **Boot/Title** | Simulated BIOS boot sequence text, then large VT323 headline. Blinking cursor. |
| **KPI Grid** | 4-col window-chrome cards. Each with `[KPI]` tag in title bar. Phosphor numbers with glow. |
| **Chart + Context** | 5-col. Chart window (3 col) + ASCII stat block (2 col) with `░`/`█` bar graphs. |
| **Terminal Output** | Full-slide black background, white/green monospace text, simulated command output. |
| **Table** | Full-width data table with bright header row. `[LOADING COMPLETE]` footer. |
| **System Alert** | Full-bleed red-tinted slide. `[CRITICAL ERROR]` or `[WARNING]` in large type. |

**Slide Transitions**:

```jsx
if (animClass === 'exit') {
  style = { opacity: 0, transition: 'opacity 0.08s linear' }  // fast cut like screen mode change
} else if (animClass === 'enter-start') {
  style = { opacity: 0 }
} else if (animClass === 'enter-end') {
  style = { opacity: 1, transition: 'opacity 0.12s linear' }  // quick fade-in
} else {
  style = { opacity: 1 }
}
```

Fast linear fades — like switching terminal modes. No easing. No transform.

**Navigation**:

```jsx
<nav className="border-t border-[#003d0d] bg-[#0a0a00] flex">
  {slides.map(s => (
    <button key={s.id}
      className={`px-4 py-2 text-[10px] font-mono uppercase tracking-widest border-r border-[#003d0d] transition-none ${
        active === s.id
          ? 'text-[#00ff41] bg-[#003d0d] glow-box'
          : 'text-[#007a1a] hover:text-[#00cc33] hover:bg-[#0d0d01]'
      }`}>
      {active === s.id ? '> ' : '  '}{s.label}
    </button>
  ))}
</nav>
```

Active item prefixed with `> `. No underline — the prompt arrow is the indicator.

---

## 8. Key Rules Checklist

1. **Single phosphor color for text and UI chrome** — green phosphor for body text, headings, and borders. Diagram nodes use distinct accent colors (see Node Accent Colors) to differentiate components
2. **All text is monospace** — Share Tech Mono (dashboards) or VT323 (presentations); no sans-serif
3. **No rounded corners** — `rounded-none` everywhere; pixel precision is the identity
4. **Scanline overlay on root container** — the `::after` scanline CSS is always present
5. **Window chrome on all cards** — title bar with `$` or `[LABEL]` prefix + status tag on right
6. **Blinking cursor on active/loading states** — `cursor-blink` class on `█` or `_` character
7. **No box shadows — only phosphor glow** — `glow-box` for containers, `glow-phosphor` for key text
8. **ASCII dividers** — `────` line characters, not `<hr>` or CSS borders for decorative dividers
9. **Bracket notation for all metadata** — `[OK]`, `[2024-03-31]`, `[LIVE]`; not plain text
10. **Charts use `type="linear"`** — no bezier curves; straight lines only on all line/area charts
11. **Fast linear transitions** — `0.08–0.12s linear`; no easing, no transforms
12. **`-webkit-font-smoothing: none`** — crisp pixel rendering; do not antialias
13. **Delta badges use bracket notation** — `[+12%] ↑ INCREASE` not a pill component
14. **Diagram nodes use bold accent colors** — see the Node Accent Colors table for the full palette. Each node type gets a distinct hue (green, emerald, teal, blue, cyan, yellow, gold, amber). Body text and UI chrome remain monochromatic phosphor.
