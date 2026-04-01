# Neobrutalism Design System — Unified Reference

A design system for building bold, energetic, product-friendly artifacts in React. Covers **presentations** (slide decks) and **dashboards** (data-dense single-page apps). Both share a visual philosophy rooted in thick borders, offset shadows, saturated fills, and chunky typography — brutalism made approachable and fun.

**Tech stack**: React 18, Tailwind CSS, Recharts, Lucide React icons. No animation libraries.

---

## 1. Design Philosophy

- **Visible structure.** Borders are thick and black. Every element has a clear boundary. Nothing floats — everything is grounded.
- **Offset shadow as depth.** The signature technique: a solid black shadow offset 3–5px down-right. No blur. Gives a 2.5D stacked-paper feel.
- **Colour is loud and deliberate.** Backgrounds use bold fills — lime, coral, sky blue, hot pink, yellow. White is a neutral, not a default.
- **Type is heavy.** Headlines are large, black-weight, and tight. Space Grotesk or similar grotesque with strong optical weight.
- **No softness.** Rounded corners are minimal — 4px maximum on cards. Pills and tags may use more. Nothing is soft or blurry.
- **Interaction is physical.** Buttons press down on click (shadow collapses, element shifts 3px). Hover lifts the shadow slightly. The UI feels tactile.

---

## 2. Typography

### Font Selection

| Artifact | Font | Import |
|---|---|---|
| Presentations | **Space Grotesk** (bold, geometric, personality) | `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap')` |
| Dashboards | **Space Grotesk** (headings/labels) + **Inter** (body prose) | `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap&family=Inter:wght@400;500&display=swap')` |

Apply with `-webkit-font-smoothing: antialiased`.

### Weight Rules

| Weight | Usage |
|---|---|
| **700 (bold)** | Slide titles, KPI numbers, card headings, button labels |
| **600 (semibold)** | Section labels, table headers, emphasized values |
| **500 (medium)** | Navigation, secondary labels, tag text |
| **400 (regular)** | Body text, descriptions, captions |

### Typographic Signatures

- **All-caps section labels**: `tracking-widest text-[10px] uppercase font-bold`. Used on dividers, card eyebrows, and axis labels.
- **Tight headlines**: `tracking-tight` or `tracking-tighter` on large titles. Neobrutalism headlines sit close together.
- **No italic**: The style does not use italic type. Emphasis is conveyed through weight, colour, or underline.
- **Underline as accent**: Text underlines use the primary accent colour, not the text colour. `text-decoration-color: #000` or a specific accent.

### Dashboard Type Scale

| Element | Classes |
|---|---|
| Page title | `text-xl font-bold tracking-tight font-sans` |
| Page subtitle | `text-xs font-medium text-zinc-600` |
| Chart card title | `text-sm font-bold` |
| Chart card subtitle | `text-[11px] text-zinc-500` |
| KPI big number | `text-3xl font-bold tracking-tight` |
| KPI label | `text-[10px] font-bold uppercase tracking-widest` |
| Section divider | `text-[10px] font-bold uppercase tracking-widest` |
| Table cells | `text-xs font-medium` |
| Body prose | `text-sm font-sans font-normal` |

### Presentation Type Scale

| Element | Classes |
|---|---|
| Slide title | `text-5xl font-bold tracking-tighter` |
| Slide subtitle | `text-xl font-medium text-zinc-600` |
| Eyebrow / tag | `text-[10px] font-bold uppercase tracking-widest` |
| Card heading | `text-base font-bold` |
| Body text | `text-sm font-normal` |

---

## 3. Color System

### Philosophy

The palette is loud and unapologetic. Cards, backgrounds, and highlights use fully saturated fills. Black and white anchor everything. One surface is never the same colour as its neighbour — contrast is structural, not decorative.

### Surface & Text Colors

| Role | Hex | Usage |
|---|---|---|
| Base background | `#fffce8` | Warm off-white — the "paper" |
| Surface 1 | `#ffffff` | Cards, panels |
| Surface 2 | `#f5f5f5` | Nested panels, table rows |
| Border | `#000000` | All card and element borders |
| Primary text | `#0a0a0a` | Headings, values |
| Secondary text | `#3a3a3a` | Labels, descriptions |
| Muted text | `#777777` | Captions, placeholders |

### Accent Fill Palette

Bold fills for card backgrounds, KPI highlights, and chart colours:

```js
const PALETTE = {
  lime:    '#a8ff78',  // primary accent — growth, success, primary CTA
  sky:     '#78c1ff',  // information, links, secondary series
  pink:    '#ff78c4',  // attention, highlights, alerts
  yellow:  '#ffe566',  // warning, featured, decorative
  coral:   '#ff6b6b',  // error, negative change, destructive
  mint:    '#78ffd6',  // secondary positive, online status
  lavender:'#c4b5fd',  // tertiary series, categories
  white:   '#ffffff',  // neutral card fills
  black:   '#0a0a0a',  // inverted cards, hero elements
}
```

Charts cycle through: **lime → sky → pink → lavender → coral → mint → yellow**.

### Offset Shadow System

The defining visual primitive. Always solid black, never blurred:

```css
/* Standard card shadow */
.shadow-neo { box-shadow: 4px 4px 0 #000; }

/* Large hero shadow */
.shadow-neo-lg { box-shadow: 6px 6px 0 #000; }

/* Small component shadow */
.shadow-neo-sm { box-shadow: 2px 2px 0 #000; }

/* Button press state (shadow collapses, element shifts) */
.btn-neo:active {
  box-shadow: 0px 0px 0 #000;
  transform: translate(4px, 4px);
}

/* Button hover (shadow grows) */
.btn-neo:hover {
  box-shadow: 6px 6px 0 #000;
  transform: translate(-1px, -1px);
}
```

### Semantic Color Assignment

| Color | Role |
|---|---|
| **lime** | Primary CTA, positive change, success, primary series |
| **coral** | Errors, negative change, destructive actions |
| **yellow** | Warnings, featured items, highlighted rows |
| **sky** | Links, info states, secondary series |
| **pink** | Alerts, attention, notifications |
| **mint** | Online/live status, secondary positive |
| **black fill** | Inverted (hero) cards, primary nav active state |

---

## 4. Surfaces, Borders & Depth

### Cards

| Property | Presentation | Dashboard |
|---|---|---|
| Background | varies by accent | `bg-white` or accent fill |
| Border | `border-2 border-black` | `border-2 border-black` |
| Radius | `rounded` (4px) | `rounded` (4px) |
| Padding | `p-5` | `p-3` to `p-4` |
| Shadow | `shadow-neo` (4px 4px 0 #000) | `shadow-neo` |

**The offset shadow is non-negotiable on interactive cards.** Static decorative panels may omit it. Every button, card, and input has a 2px black border minimum.

### Depth Through Shadow

No gradients or luminance stepping. Depth comes entirely from shadow size:

```
No shadow → shadow-neo-sm (2px) → shadow-neo (4px) → shadow-neo-lg (6px)
```

Modals and popovers use `shadow-neo-lg`. Inline elements use `shadow-neo-sm`.

### Active / Selected State

Selected items invert: black background, white text, shadow reverses direction or collapses.

```jsx
<div className={`border-2 border-black p-3 transition-all ${
  isActive
    ? 'bg-black text-white shadow-none translate-x-[2px] translate-y-[2px]'
    : 'bg-white shadow-neo hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-neo-lg'
}`} />
```

---

## 5. Recharts Styling

### Axes

```jsx
<XAxis
  dataKey="label"
  tick={{ fontSize: 10, fill: '#777777', fontFamily: 'Space Grotesk', fontWeight: 700 }}
  axisLine={{ stroke: '#000', strokeWidth: 2 }}
  tickLine={false}
/>
<YAxis
  tick={{ fontSize: 10, fill: '#777777', fontFamily: 'Space Grotesk', fontWeight: 700 }}
  axisLine={false}
  tickLine={false}
  width={40}
/>
```

X-axis has a thick black axis line (2px). Y-axis omits it. No tick lines on either. Labels are bold and uppercase.

### Gridlines

```jsx
<CartesianGrid strokeDasharray="0" stroke="#e5e5e5" strokeWidth={1} />
```

Solid (not dashed), light grey. For vertical bar charts: `horizontal={true} vertical={false}`.

### Bars

```jsx
<Bar fill="#a8ff78" radius={[0, 0, 0, 0]} barSize={24} stroke="#000" strokeWidth={2}>
  {data.map((_, i) => <Cell key={i} />)}
</Bar>
```

Square corners. **Always a 2px black stroke on bars.** This is the neobrutalist signature on charts.

### Area Charts

```jsx
<defs>
  <linearGradient id="limeGrad" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stopColor="#a8ff78" stopOpacity={0.6} />
    <stop offset="100%" stopColor="#a8ff78" stopOpacity={0.05} />
  </linearGradient>
</defs>
<Area type="monotone" stroke="#000" strokeWidth={2.5} fill="url(#limeGrad)" />
```

Stroke is black (2.5px), not the accent color. The fill uses the accent. This maintains the "drawn" feel.

### Line Charts

```jsx
<Line type="monotone" strokeWidth={2.5} stroke="#000" dot={{ r: 4, fill: '#a8ff78', stroke: '#000', strokeWidth: 2 }} />
```

Lines are black. Dots are filled accent with a black border. **Always show dots** — unlike the dark terminal system, dots are part of the visual identity here.

### Pie / Donut Charts

```jsx
<Pie innerRadius={45} outerRadius={75} paddingAngle={4} stroke="#000" strokeWidth={2} cx="50%" cy="50%">
  {data.map((d, i) => <Cell key={i} fill={d.color} />)}
</Pie>
```

Black stroke on each segment. Center stat in bold Space Grotesk.

### Tooltips

```jsx
<div className="bg-white border-2 border-black shadow-neo px-3 py-2 text-xs font-bold font-sans">
  <span className="text-zinc-500 uppercase tracking-widest text-[9px]">{label}</span>
  <div className="text-lg font-bold text-black">{value}</div>
</div>
```

White card with black border and offset shadow — consistent with card system.

### Legends

Monospace small caps, square color markers (not circles) with a black border:

```jsx
const renderLegend = ({ payload }) => (
  <div className="flex gap-4">
    {payload.map((p, i) => (
      <span key={i} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest">
        <span className="w-3 h-3 border-2 border-black" style={{ background: p.color }} />
        {p.value}
      </span>
    ))}
  </div>
)
```

---

## 6. Spacing & Layout

### Dashboard

- Container: `max-w-[1440px] mx-auto px-5`
- Vertical rhythm: `space-y-5` (20px)
- KPI grids: `gap-4` (16px)
- Chart grids: `gap-4` (16px)
- All gaps are generous — neobrutalism needs breathing room for shadows

### Presentation

- Slide canvas: `max-w-[1100px]`, `aspect-[16/9]`
- Content padding: `px-12 py-10`
- Grid gaps: `gap-5`

> **Shadow clearance rule**: Always allow at least 8px of space beyond a card's right and bottom edges so the offset shadow doesn't clip. Use `pr-2 pb-2` on grid containers.

---

## 7. Component Patterns

### Shared: Section Divider

A thick black horizontal rule with a bold label:

```jsx
<div className="flex items-center gap-3 my-5">
  <div className="h-[2px] flex-1 bg-black" />
  <span className="text-[10px] font-bold uppercase tracking-widest px-2">
    {label}
  </span>
  <div className="h-[2px] flex-1 bg-black" />
</div>
```

### Dashboard Components

**KpiCard** — Accent-filled card with thick border and offset shadow. Large bold number, uppercase label, delta badge below.

```jsx
<div className="border-2 border-black shadow-neo p-4 bg-[#a8ff78]">
  <div className="text-[10px] font-bold uppercase tracking-widest text-black/60">
    {label}
  </div>
  <div className="text-3xl font-bold tracking-tight text-black mt-1">{value}</div>
  <DeltaBadge value={delta} />
</div>
```

**Delta Badge** — Bold, bordered, offset-shadowed pill:

```jsx
const DeltaBadge = ({ value }) => {
  const pos = value >= 0
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 border-2 border-black shadow-neo-sm ${pos ? 'bg-[#a8ff78]' : 'bg-[#ff6b6b]'}`}>
      {pos ? '↑' : '↓'} {Math.abs(value)}%
    </span>
  )
}
```

**ChartCard** — White card with thick border:

```jsx
<div className="border-2 border-black shadow-neo p-4 bg-white">
  <div className="mb-3">
    <div className="text-sm font-bold">{title}</div>
    <div className="text-[11px] text-zinc-500">{subtitle}</div>
  </div>
  {children}
</div>
```

**StatusDot** — Bordered pill with bold label:

```jsx
<span className="inline-flex items-center gap-2 text-xs font-bold border-2 border-black px-2 py-0.5 shadow-neo-sm bg-[#78ffd6]">
  <span className="w-2 h-2 rounded-full bg-black" />
  operational
</span>
```

**DataTable** — Bold header row, thick top/bottom borders, no internal side borders:

```jsx
<table className="w-full border-2 border-black">
  <thead>
    <tr className="border-b-2 border-black bg-black text-white">
      {cols.map(c => (
        <th key={c} className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-widest">
          {c}
        </th>
      ))}
    </tr>
  </thead>
  <tbody>
    {rows.map((r, i) => (
      <tr key={i} className={`border-b border-zinc-200 hover:bg-[#ffe566] transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'}`}>
        {r.map((cell, j) => (
          <td key={j} className="px-3 py-2 text-xs font-medium">{cell}</td>
        ))}
      </tr>
    ))}
  </tbody>
</table>
```

**Button — Primary**:

```jsx
<button className="bg-[#a8ff78] border-2 border-black shadow-neo px-4 py-2 text-sm font-bold
  hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-neo-lg
  active:translate-x-[4px] active:translate-y-[4px] active:shadow-none
  transition-all duration-75">
  {label}
</button>
```

**Button — Secondary**:

```jsx
<button className="bg-white border-2 border-black shadow-neo px-4 py-2 text-sm font-bold
  hover:bg-zinc-50 hover:shadow-neo-lg active:translate-x-[3px] active:translate-y-[3px] active:shadow-none
  transition-all duration-75">
  {label}
</button>
```

**Input / Dropdown**:

```jsx
<input className="border-2 border-black px-3 py-2 text-sm font-medium bg-white shadow-neo-sm
  focus:outline-none focus:shadow-neo focus:ring-0 transition-all" />
```

### Presentation-Specific

**SlideHeader**:

```jsx
function SlideHeader({ title, subtitle, tag }) {
  return (
    <div className="mb-8">
      {tag && (
        <div className="inline-block border-2 border-black px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest mb-3 bg-[#ffe566] shadow-neo-sm">
          {tag}
        </div>
      )}
      <h2 className="text-5xl font-bold tracking-tighter text-black leading-none">{title}</h2>
      {subtitle && <p className="text-xl font-medium text-zinc-600 mt-3">{subtitle}</p>}
    </div>
  )
}
```

**Slide Layout Templates**

| Type | Layout |
|---|---|
| **Title** | Centered. Giant headline, subtitle, row of accent-filled stat boxes with offset shadows. Off-white `#fffce8` background. |
| **KPI Grid** | 4-col grid, each card a different accent fill. Bold number, uppercase label, delta badge. |
| **Chart + Context** | 5-col. Chart card (3 col) + insight panel (2 col) with a lime or yellow highlight box. |
| **Comparison** | Side-by-side panels with a thick black divider. Left = black fill (inverted), Right = white. |
| **Table** | Full-width bordered table with black header row and hover states in yellow. |
| **Statement** | Full-bleed accent colour background (lime, coral, sky), single oversized quote or stat centered. |

**Slide Transitions**:

```jsx
if (animClass === 'exit') {
  style = { opacity: 0, transform: 'translateX(-8px)',
    transition: 'opacity 0.18s ease-in, transform 0.18s ease-in' }
} else if (animClass === 'enter-start') {
  style = { opacity: 0, transform: 'translateX(8px)' }
} else if (animClass === 'enter-end') {
  style = { opacity: 1, transform: 'translateX(0)',
    transition: 'opacity 0.22s ease-out, transform 0.22s ease-out' }
} else {
  style = { opacity: 1, transform: 'translateX(0)' }
}
```

**Navigation — Bottom Bar**:

```jsx
<nav className="bg-white border-t-2 border-black flex">
  {slides.map(s => (
    <button
      key={s.id}
      className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all border-r-2 border-black ${
        active === s.id
          ? 'bg-black text-white'
          : 'hover:bg-[#ffe566]'
      }`}
    >
      {s.label}
    </button>
  ))}
</nav>
```

---

## 8. Key Rules Checklist

1. **2px black border on everything interactive** — cards, buttons, inputs, badges
2. **Offset shadow on all cards** — `4px 4px 0 #000`, no blur, no spread
3. **Button press animation** — shadow collapses + 3–4px translate on `:active`
4. **Accent fills, not accent borders** — colour lives in the background, not the border
5. **No rounded corners on cards** — `rounded` (4px) maximum; most things are square
6. **Square legend markers** — never circles; always with a black border
7. **Axis lines on X only** — thick black (2px); Y-axis omits the line
8. **Dots on line charts** — filled accent + black border stroke; always visible
9. **Black stroke on chart bars** — `stroke="#000" strokeWidth={2}`
10. **Shadow clearance** — 8px minimum space beyond card edges for shadow visibility
11. **No gradients on surfaces** — only in chart area fills; surfaces are solid flat fills
12. **Delta badges are bordered pills** — not plain text; always with border and shadow
13. **Hover = shadow grows + slight lift** — `-translate-x/y-[1px]` + larger shadow
14. **Section dividers are thick black rules** — 2px, not 1px