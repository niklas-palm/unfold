# Swiss / International Design System — Unified Reference

A design system for building authoritative, structured, typographically rigorous artifacts in React. Covers **presentations** (slide decks) and **dashboards** (data-dense single-page apps). Both share a philosophy rooted in the International Typographic Style — objective information hierarchy, strict grid discipline, and Helvetica-first type.

**Tech stack**: React 18, Tailwind CSS, Recharts, Lucide React icons. No animation libraries.

---

## 1. Design Philosophy

- **The grid is sacred.** Every element occupies a defined column. Nothing breaks the grid arbitrarily. The underlying column structure should be perceptible even without guidelines visible.
- **Typography carries hierarchy.** Size, weight, and spacing alone — not color or decoration — establish what is most important. A Swiss layout is readable without any color at all.
- **One accent color, used sparingly.** The palette is white, black, and a single strong primary (typically red, though deep blue or black are acceptable). The accent is used for structural emphasis, never decoration.
- **Flush left, ragged right.** Text is never centered (except in special typographic compositions). Alignment is always to the left column edge. No justified text.
- **Whitespace is active.** Margins and spacing are not empty space — they are visual rests that give weight to what surrounds them. Compact layouts are rejected.
- **Objectivity as aesthetic.** The system is neutral, universal, and intentionally impersonal. It communicates data and information, not personality.

---

## 2. Typography

### Font Selection

| Artifact | Font | Import |
|---|---|---|
| Presentations | **Helvetica Neue** (system) or **Inter** (web fallback) | System font stack — no import needed for Helvetica Neue |
| Dashboards | **Inter** (all weights for maximum legibility) | `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&display=swap')` |

**Font stack**:
```css
font-family: 'Helvetica Neue', 'Helvetica', 'Arial', 'Inter', sans-serif;
```

Never use a serif, monospace, or display font. The Swiss system is exclusively grotesque sans-serif.

Apply with `-webkit-font-smoothing: antialiased`.

### Weight Rules

| Weight | Usage |
|---|---|
| **900 (black)** | Display titles, oversized hero numbers, slide titles |
| **700 (bold)** | Card headings, section labels, emphasized values |
| **600 (semibold)** | Navigation, sub-headings, table headers |
| **400 (regular)** | Body text, descriptions, captions, most UI text |
| **300 (light)** | Supplementary labels, footnotes, large decorative numbers |

### Typographic Signatures

- **Tight tracking on display type**: `tracking-tighter` or `letter-spacing: -0.03em` on all headlines. Swiss type is tight, not loose.
- **Strict typographic scale**: Every size in the system is a precise step. Never use a font size not in the defined scale.
- **No decorative underlines or italics**: Emphasis is conveyed through weight only. Underline is reserved for actual hyperlinks.
- **Uppercase for labels only**: Section labels and axis titles use `uppercase tracking-widest`. Body copy, headings, and values are always sentence case or title case.
- **Rule lines instead of whitespace**: Thin horizontal rules (`border-t`) are used between sections, not extra margin. The rule is the separator.
- **Numerals**: Always tabular/monospace rendering for data values — use `font-variant-numeric: tabular-nums` on all number displays.

### Dashboard Type Scale

| Element | Classes |
|---|---|
| Page title | `text-2xl font-black tracking-tighter` |
| Page subtitle | `text-sm font-normal text-zinc-500` |
| Chart card title | `text-sm font-bold tracking-tight` |
| Chart card subtitle | `text-xs text-zinc-500` |
| KPI big number | `text-4xl font-black tracking-tighter tabular-nums` |
| KPI label | `text-[10px] font-semibold uppercase tracking-widest` |
| Section divider | `text-[10px] font-semibold uppercase tracking-widest` |
| Table cells | `text-xs font-normal tabular-nums` |
| Table headers | `text-[10px] font-semibold uppercase tracking-widest` |
| Body prose | `text-sm font-normal leading-relaxed` |

### Presentation Type Scale

| Element | Classes |
|---|---|
| Slide title | `text-6xl font-black tracking-tighter leading-none` |
| Slide subtitle | `text-xl font-light text-zinc-600` |
| Eyebrow / category | `text-[10px] font-semibold uppercase tracking-[0.25em]` |
| Card heading | `text-base font-bold tracking-tight` |
| Body text | `text-sm font-normal leading-relaxed` |
| Data/stat values | `text-3xl font-bold tracking-tight tabular-nums` |

---

## 3. Color System

### Philosophy

The palette is built around white, near-black, and a single structural accent. Color is applied architecturally — to mark divisions, signal importance, and anchor the eye. It is never used atmospherically.

### Surface & Text Colors

| Role | Hex | Usage |
|---|---|---|
| Base background | `#ffffff` | Page background — pure white |
| Surface 1 | `#ffffff` | Cards — also white; depth via rule lines |
| Surface 2 | `#f8f8f8` | Recessed panels, table alternating rows |
| Rule line | `#e0e0e0` | Thin dividers between sections |
| Accent rule | `#e63946` | Primary accent — thick rule lines, active states |
| Border | `#d0d0d0` | Card outlines (subtle, not black) |
| Primary text | `#111111` | Headlines, primary values |
| Secondary text | `#555555` | Labels, descriptions |
| Muted text | `#999999` | Captions, placeholders, disabled |
| Inverted surface | `#111111` | Header bars, hero blocks |

### Accent Color

The primary accent is a single structural red. Only one accent is ever active in the system:

```js
const ACCENT = '#e63946'  // Swiss signal red
// Alternative acceptable accents:
// '#1a1a2e'  — deep navy (financial, institutional)
// '#000000'  — pure black (maximally austere)
```

The accent is used for:
- Thick left-border or top-border on active/featured cards
- The active navigation underline
- The primary CTA button background
- A decorative rule at the top of presentations
- The primary chart series color

**Never use more than one accent color in a single artifact.**

### Chart Color Sequence

```js
const CHART_PALETTE = [
  '#e63946',  // primary series — accent red
  '#111111',  // secondary series — near-black
  '#888888',  // tertiary series — mid-grey
  '#cccccc',  // quaternary — light grey
  '#457b9d',  // fifth — muted blue (if a fifth is truly needed)
]
```

### Semantic Color Assignment

| Color | Role |
|---|---|
| **accent red** | Primary series, CTAs, active state, key emphasis |
| **near-black** | Secondary series, primary text, borders |
| **mid-grey** | Tertiary series, inactive, supplementary |
| **light grey** | Quaternary, disabled, placeholder |

---

## 4. Surfaces, Borders & Depth

### Cards

| Property | Presentation | Dashboard |
|---|---|---|
| Background | `bg-white` | `bg-white` |
| Border | `border border-zinc-200` | `border border-zinc-200` |
| Radius | `rounded-none` | `rounded-none` |
| Padding | `p-6` | `p-4` |
| Shadow | **none** | **none** |

### Depth Through Rule Lines

Depth is expressed through rule lines, not shadows or luminance stepping.

```
Full-width rule: border-t border-zinc-200 (divides sections)
Accent rule:     border-t-4 border-[#e63946] (marks featured/primary card)
Left accent:     border-l-4 border-[#e63946] (marks active or selected state)
```

### Featured Card Pattern

The primary way to elevate one card above others:

```jsx
<div className="border border-zinc-200 border-t-4 border-t-[#e63946] p-4">
  {/* Featured content */}
</div>
```

Or left-edge variant for list items:

```jsx
<div className={`border-l-4 pl-4 ${isActive ? 'border-l-[#e63946]' : 'border-l-transparent'}`}>
```

### Focus States

```css
:focus-visible {
  outline: 2px solid #e63946;
  outline-offset: 2px;
}
```

---

## 5. Recharts Styling

### Axes

```jsx
<XAxis
  dataKey="label"
  tick={{ fontSize: 10, fill: '#999999', fontFamily: 'Inter', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}
  axisLine={{ stroke: '#e0e0e0', strokeWidth: 1 }}
  tickLine={false}
/>
<YAxis
  tick={{ fontSize: 10, fill: '#999999', fontFamily: 'Inter', fontWeight: 600 }}
  axisLine={false}
  tickLine={false}
  width={44}
/>
```

X-axis has a visible light grey line. Y-axis omits it. No tick marks. Labels are uppercase, spaced, muted.

### Gridlines

```jsx
<CartesianGrid strokeDasharray="0" stroke="#f0f0f0" strokeWidth={1} vertical={false} />
```

Solid, very light horizontal lines only. No vertical gridlines.

### Bars

```jsx
<Bar fill="#e63946" radius={[0, 0, 0, 0]} barSize={18}>
  {data.map((_, i) => <Cell key={i} fillOpacity={0.9} />)}
</Bar>
```

Square corners. Accent red for primary series. No stroke on bars.

### Area Charts

```jsx
<defs>
  <linearGradient id="swissGrad" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stopColor="#e63946" stopOpacity={0.15} />
    <stop offset="100%" stopColor="#e63946" stopOpacity={0} />
  </linearGradient>
</defs>
<Area type="monotone" stroke="#e63946" strokeWidth={2} fill="url(#swissGrad)" />
```

### Line Charts

```jsx
<Line type="monotone" strokeWidth={2} stroke="#e63946" dot={false} />
```

No dots. Clean lines. Secondary line: `stroke="#111" strokeWidth={1.5}`.

### Pie / Donut Charts

```jsx
<Pie innerRadius={50} outerRadius={78} paddingAngle={2} strokeWidth={0} cx="50%" cy="50%">
  {data.map((d, i) => <Cell key={i} fill={d.color} />)}
</Pie>
```

No stroke between segments. Center stat: large, bold, black. Use `font-variant-numeric: tabular-nums`.

### Tooltips

```jsx
<div className="bg-white border border-zinc-300 border-t-2 border-t-[#e63946] px-4 py-3 text-xs shadow-sm">
  <div className="text-[10px] uppercase tracking-widest text-zinc-400 mb-1">{label}</div>
  <div className="text-xl font-bold tracking-tight tabular-nums">{value}</div>
</div>
```

White card, light border, accent top edge, subtle box shadow (the one place a shadow is permitted).

### Legends

```jsx
const renderLegend = ({ payload }) => (
  <div className="flex gap-5">
    {payload.map((p, i) => (
      <span key={i} className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-500">
        <span className="w-4 h-[2px] inline-block" style={{ background: p.color }} />
        {p.value}
      </span>
    ))}
  </div>
)
```

Line markers (not squares or circles). Understated and typographic.

---

## 6. Spacing & Layout

### Dashboard

- Container: `max-w-[1400px] mx-auto px-8`
- Vertical rhythm: `space-y-8` (32px) — generous; Swiss design values breathing room
- KPI grids: `gap-6` (24px)
- Chart grids: `gap-6` (24px)
- Section dividers: `border-t border-zinc-200 pt-8` — the rule line replaces spacing

### Presentation

- Slide canvas: `max-w-[1100px]`, `aspect-[16/9]`
- Content padding: `px-14 py-12` — wider margins than other systems; the margin is visible
- Grid gaps: `gap-6`

### Column Grid

The Swiss grid uses a 12-column base. Always design in multiples of the column unit:

```jsx
<div className="grid grid-cols-12 gap-6">
  <div className="col-span-8">{/* Main content — 8/12 */}</div>
  <div className="col-span-4">{/* Sidebar — 4/12 */}</div>
</div>
```

Common column splits: **8/4**, **7/5**, **6/6**, **4/4/4**, **3/3/3/3**.

---

## 7. Component Patterns

### Shared: Section Divider

A rule line with a small uppercase label:

```jsx
<div className="border-t border-zinc-200 pt-3 mt-8">
  <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
    {label}
  </span>
</div>
```

### Dashboard Components

**KpiCard** — White card with accent top border on primary metric:

```jsx
<div className={`border border-zinc-200 p-5 ${isPrimary ? 'border-t-4 border-t-[#e63946]' : ''}`}>
  <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-3">
    {label}
  </div>
  <div className="text-4xl font-black tracking-tighter tabular-nums text-zinc-900">{value}</div>
  <DeltaBadge value={delta} />
</div>
```

**Delta Badge** — Minimal, inline:

```jsx
const DeltaBadge = ({ value }) => (
  <div className="flex items-center gap-1.5 mt-2">
    <span className={`text-xs font-semibold ${value >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
      {value >= 0 ? '↑' : '↓'} {Math.abs(value)}%
    </span>
    <span className="text-xs text-zinc-400">vs prior period</span>
  </div>
)
```

**ChartCard**:

```jsx
<div className="border border-zinc-200 p-5">
  <div className="mb-5 border-b border-zinc-100 pb-4">
    <div className="text-sm font-bold tracking-tight">{title}</div>
    {subtitle && <div className="text-xs text-zinc-500 mt-0.5">{subtitle}</div>}
  </div>
  {children}
</div>
```

**StatusDot** — Rule-based status indicator:

```jsx
<div className="flex items-center gap-3">
  <div className="w-6 h-[2px]" style={{ background: status === 'ok' ? '#22c55e' : '#e63946' }} />
  <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">{label}</span>
</div>
```

**DataTable** — Clean, structured:

```jsx
<table className="w-full">
  <thead>
    <tr className="border-b-2 border-zinc-900">
      {cols.map(c => (
        <th key={c} className="pb-2 text-left text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
          {c}
        </th>
      ))}
    </tr>
  </thead>
  <tbody className="divide-y divide-zinc-100">
    {rows.map((r, i) => (
      <tr key={i} className="hover:bg-zinc-50 transition-colors">
        {r.map((cell, j) => (
          <td key={j} className="py-3 text-sm tabular-nums">{cell}</td>
        ))}
      </tr>
    ))}
  </tbody>
</table>
```

**Button — Primary**:

```jsx
<button className="bg-[#e63946] text-white px-5 py-2.5 text-sm font-semibold uppercase tracking-wider
  hover:bg-red-700 active:bg-red-800 transition-colors">
  {label}
</button>
```

**Button — Secondary**:

```jsx
<button className="bg-white text-zinc-900 border border-zinc-300 px-5 py-2.5 text-sm font-semibold uppercase tracking-wider
  hover:border-zinc-500 active:bg-zinc-50 transition-colors">
  {label}
</button>
```

### Presentation-Specific

**SlideHeader** — Accent rule above title:

```jsx
function SlideHeader({ title, subtitle, category }) {
  return (
    <div className="mb-10">
      {category && (
        <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-zinc-400 mb-4">
          {category}
        </div>
      )}
      <div className="border-l-4 border-[#e63946] pl-5">
        <h2 className="text-6xl font-black tracking-tighter leading-none text-zinc-900">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xl font-light text-zinc-500 mt-3">{subtitle}</p>
        )}
      </div>
    </div>
  )
}
```

**Slide Layout Templates**

| Type | Layout |
|---|---|
| **Title** | Left-aligned. Thick accent left border on headline. Subtitle and meta below. Optional accent rule across full width. White background. |
| **KPI Grid** | 4-col (3+1 or 2+2). Primary KPI has accent top border. Generous padding. |
| **Chart + Context** | 8/4 column split. Chart on left. Right: key insight in large type + 2–3 supporting figures. |
| **Full-width Table** | Single card. Tight but legible. Bold 2px border-bottom on header row. |
| **Comparison** | 6/6 split with a visible center rule. Each side: label + large number + supporting text. |
| **Statement / Pull Quote** | Single centered number or sentence in display type (text-7xl font-black). Eyebrow label above, source below. |

**Slide Transitions** — Clean, fast:

```jsx
if (animClass === 'exit') {
  style = { opacity: 0, transition: 'opacity 0.15s ease-in' }
} else if (animClass === 'enter-start') {
  style = { opacity: 0 }
} else if (animClass === 'enter-end') {
  style = { opacity: 1, transition: 'opacity 0.2s ease-out' }
} else {
  style = { opacity: 1 }
}
```

Fade only — no transform. Clean and professional.

**Navigation — Bottom Bar**:

```jsx
<nav className="border-t border-zinc-200 flex bg-white">
  {slides.map(s => (
    <button
      key={s.id}
      className={`px-5 py-3 text-[10px] font-semibold uppercase tracking-widest transition-colors ${
        active === s.id
          ? 'text-[#e63946] border-b-2 border-[#e63946]'
          : 'text-zinc-400 hover:text-zinc-700'
      }`}
    >
      {s.label}
    </button>
  ))}
</nav>
```

Active tab uses accent underline, not background fill.

---

## 8. Key Rules Checklist

1. **Helvetica Neue / Inter exclusively** — grotesque sans-serif only; no display, serif, or mono
2. **One accent color per artifact** — signal red `#e63946` by default; never two accents
3. **No rounded corners** — `rounded-none` on all cards, inputs, and buttons
4. **No shadows on cards** — only tooltip gets a `shadow-sm`; everything else uses rule lines
5. **Flush-left text only** — no centered body copy; alignment is always left-anchored
6. **Tabular numerals on all data values** — `font-variant-numeric: tabular-nums` or `tabular-nums` class
7. **Uppercase labels with `tracking-widest`** — section headers, table heads, axis labels, button text
8. **Accent top border = featured card** — `border-t-4 border-t-[#e63946]`; used on exactly one card per group
9. **Generous margins** — `px-8` minimum container padding; `space-y-8` minimum vertical rhythm
10. **12-column grid discipline** — all layouts use multiples of the 12-col unit
11. **Line legend markers** — not squares or circles; a short horizontal line from the series color
12. **Fade transitions only** — no slide, scale, or bounce; opacity change only
13. **Charts: no axis lines on Y, light line on X** — `axisLine` only on XAxis
14. **No more than 4 chart series** — restraint is mandatory; add a grey baseline if needed