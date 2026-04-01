---
name: unfold
description: >
  Build animated diagram presentations that explain how systems work. Progressive architecture walkthroughs with nodes, arrows, and drilldowns. Use for educational/technical content — NOT bullet-point decks or business reports.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Unfold — Presentation Building Skill

Unfold turns TypeScript data files into animated, diagram-based technical presentations. You write structured slide definitions (nodes, arrows, regions, annotations) and the framework renders interactive presentations with smooth animations, drilldown modals, and progressive disclosure. No JSX or React knowledge needed. **All styling is inline — never use Tailwind or CSS classes.**

## Before You Start — Confirm with the User

Unfold creates **progressive architecture diagrams** — presentations that start with one component and reveal a system piece by piece. They are designed for educational content that explains how systems work and fit together.

**Before building, confirm with the user that this is what they want.** Say something like:

> "Unfold creates progressive diagram presentations — animated architecture walkthroughs where I reveal components one by one to explain how a system works. Think 'How DNS works' or 'Kubernetes internals'. Is that the kind of presentation you're looking for?"

**Good fit:** "Explain how DNS resolution works", "Walk through our microservice architecture", "Teach how transformers process text"

**Bad fit:** "Create a quarterly business review", "Make slides for a sales pitch", "Build a financial report deck"

If the user wants bullet-point slides, marketing decks, or text-heavy reports, tell them Unfold is not the right tool and suggest alternatives.

## Setup

```bash
npm install unfoldjs
```

All imports use the `unfoldjs` package:

```typescript
import type { PresentationDef, DiagramSlide, SlideDef } from 'unfoldjs'
import { carry } from 'unfoldjs'
```

Render with `<PresentationApp presentation={presentation} />` in any React app.

## Layout Rules (Critical)

These 12 principles produce clear, professional presentations. Follow them strictly.

### 1. Rows = Architectural Layers
Each horizontal row is a system layer. Top = user-facing, bottom = infrastructure. Peers share the same `y`.

### 2. Grow, Don't Move
Once placed, a node stays there. Add new content in empty space. Never rearrange.

### 3. One Compact Transition
Slides 1-3: large nodes (w:160-200, h:65-75), 2-3 components. Slide 4: everything shrinks (w:100-155, h:48), new nodes appear. Slides 5+: positions permanently fixed.

### 4. Nodes = Structure, Annotations = Detail
Nodes are components with relationships (arrows). Don't create nodes for concepts or labels. Use annotations for explanatory text: card-lists, text-blocks, numbered-lists, chip-lists.

### 5. Reserve the Right Panel
Diagram canvas is 900x560. Keep nodes in the left ~550px. Reserve x:580+ for annotations. Never place annotations overlapping nodes or arrow paths.

### 6. Arrow Cleanliness
- Horizontal arrows: same `y` (±5px)
- Vertical arrows: same `x` (±5px)
- 80px+ vertical gaps, 100px+ horizontal gaps between connected nodes for labels
- Let the framework auto-route (plain node IDs). Don't use `side` hints unless auto-routing fails.
- Check that arrows don't pass through intermediate nodes. Fix by repositioning nodes.

### 7. Progressive Disclosure
Each slide adds ONE new concept. The audience must be able to say what changed.

### 8. Color Consistency
One semantic color per component type, used throughout. Available: `sea`, `warm`, `sage`, `blush`, `mist`, `clay`, `sky`, `stone`, `sand`, `slate`.

### 9. No Emojis
Clean labels. Color coding provides visual distinction. Keep labels 1-3 words.

### 10. Regions — y >= 55
Nodes inside a region must have `y >= 55`. The region extends `padding` (default 28) above the top node; lower y values clip the region label off-canvas.

### 11. Annotation Position Consistency
Annotations that serve the same role across slides must stay at the same (x, y) position.

### 12. Design the Final Slide First
Sketch the full-picture slide with all components, arrows, and regions. Then work backwards to plan the narrative.

## Essential Types

### NodeDef
```typescript
{ id: string, label: string, sub?: string, x: number, y: number,
  w?: number, h?: number, color?: SemanticColor, onClick?: string }
```
Default size: 130x65. Canvas: 900x560.

### ArrowDef
```typescript
{ from: string | AnchorPoint, to: string | AnchorPoint,
  label?: string, labelOffset?: { dx?: number, dy?: number },
  color?: SemanticColor, dashed?: boolean }
```

### RegionDef
```typescript
{ id: string, label: string, contains?: string[], padding?: number,
  group?: string, x?: number, y?: number, w?: number, h?: number }
```
Use `contains` (recommended) to auto-size around nodes.

### SlideDef — Three types

**TitleSlide**: `{ type: 'title', title: string, subtitle?: string, hint?: string }`

**DiagramSlide**: `{ type: 'diagram', heading: string, nodes: NodeDef[], arrows?: ArrowDef[], regions?: RegionDef[], annotations?: AnnotationDef[], focus?: FocusDef, notes?: string }`

**ListSlide**: `{ type: 'list', heading: string, items: { title: string, desc: string }[] }`

### PresentationDef
```typescript
{ title: string, slides: SlideDef[], drilldowns?: DrilldownDef[], theme?: Partial<ThemeDef>, logo?: string }
```

## The carry() Pattern

Build evolving diagrams by merging overrides onto a previous slide:

```typescript
const slide2 = carry(slide1, {
  heading: 'New concept',
  nodes: [
    { id: 'db', label: 'Database', x: 300, y: 300, color: 'mist' },
  ],
  arrows: [
    { from: 'api', to: 'db', label: 'Query' },
  ],
})
```

Rules:
- **Nodes merge by ID** — existing fields are shallow-merged, new IDs are appended
- **`removeNodes: string[]`** — removes nodes by ID before merging
- **Arrows, regions, annotations replace wholesale** — previous arrays are discarded
- **heading, subheading, notes** replace if provided

## Annotation Types

All annotations have `type`, `x`, `y`. Place in the right panel (x:580+) in post-compact slides.

| Type | Purpose |
|------|---------|
| `text-block` | Explanatory text with `**bold**` and `` `code` ``. Has `w`, `align`, optional `onClick` |
| `card-list` | Comparison cards. `cards: [{ label, detail, borderColor?, onClick? }]`, `direction: 'row'\|'column'` |
| `numbered-list` | Step-by-step. `items: [{ title, detail }]`, `color` |
| `chip-list` | Tags in a row. `chips: string[]`, `color` |
| `pill-group` | Joined pills. `pills: [{ text, icon?, color?, bold? }]`, `joinWith`, `footnote` |
| `status` | Success/error. `variant: 'error'\|'success'`, `title`, `detail?` |
| `code-snippet` | Monospace code. `code: string` |
| `url-box` | URL display. `urls: string[]`, `title?`, `color` |
| `tool-box` | Function name. `icon?`, `name`, `detail?` |
| `popup-box` | Browser popup. `title`, `detail?`, `w?` |
| `brace` | Curly brace connector. `w`, `h`, `color?` |

## Drilldowns

Modal deep-dives triggered by `onClick` on nodes or annotations. 3-8 per presentation.

### Content Drilldown
```typescript
{
  type: 'content', id: 'my-drilldown', title: 'Title', subtitle: 'Subtitle',
  sections: [{
    heading?: string, body?: string,
    columns?: [{ heading, badge?: { text, color }, body, items?: [{ label, detail }] }],
    note?: { title, body },
  }],
}
```

### Code Drilldown
```typescript
{
  type: 'code', id: 'my-code', title: 'Title',
  language: 'typescript', code: `const x = 1`,
  callouts: [{ title: 'Note', body: 'Explanation' }],
}
```

### Sequence Drilldown
```typescript
{
  type: 'sequence', id: 'my-seq', title: 'Title',
  actors: [{ id: 'a', label: 'Service A', color: 'sea' }],
  phases: [{
    name: 'Phase 1',
    messages: [
      { from: 'a', to: 'b', label: 'Request' },
      { actor: 'a', text: 'Note on actor' },
    ],
  }],
}
```

## Focus Expansion

Expand a node to reveal internals. Everything else dims.

```typescript
const slide = carry(prev, {
  focus: {
    nodeId: 'pod', x: 250, y: 100, w: 400, h: 320,
    items: [
      { label: 'Web Server', sub: ':8080', color: 'sea' },
      { label: 'App Container', sub: ':3000', color: 'sage' },
    ],
    footnote: 'Shared network namespace',
  },
})
```
Next slide without `focus` automatically collapses it back.

## Theme

Override the default theme in your PresentationDef:

```typescript
theme: {
  bgPage: '#1a1a2e', bgSurface: '#16213e', text: '#eee',
  fontFamily: "'Inter', sans-serif",
  fontUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  colors: { sea: { bg: '#1a3a4a', border: '#2d7d9a', text: '#5bc0de' } },
}
```

10 semantic colors: `sea`, `warm`, `sage`, `blush`, `mist`, `clay`, `sky`, `stone`, `sand`, `slate`. Each has `{ bg, border, text }`.

## Custom Style Guide

If the user provides a style guide (brand colors, fonts, design preferences), create a `STYLE_GUIDE.md` in the presentation directory that documents the visual identity. Then apply it via the theme override in `presentation.ts`.

If the user describes preferences verbally ("dark theme", "use our brand blue"), translate them directly into theme overrides — no style guide file needed.

**Creating a style guide from user input:**

```markdown
# Style Guide — [Presentation Name]

## Colors
- Primary: sea (#2d7d9a) — main components
- Secondary: sage (#5a7e5e) — supporting services
- Accent: warm (#a07850) — external systems

## Typography
- Font: Inter (Google Fonts)
- Headings: 600 weight
- Body: 400 weight

## Surfaces
- Background: #1a1a2e (dark navy)
- Cards: #16213e
- Text: #eee
```

**Applying it:**

```typescript
export const presentation: PresentationDef = {
  title: 'My Presentation',
  theme: {
    bgPage: '#1a1a2e',
    bgSurface: '#16213e',
    text: '#eee',
    textBody: '#ccc',
    fontFamily: "'Inter', sans-serif",
    fontUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  },
  slides,
}
```

For full theme property reference, read `node_modules/unfoldjs/docs/BRANDING.md`.

## Workflow

1. **Plan the final slide** — all components, arrows, regions on the grid
2. **Plan the narrative** — which component appears on which slide
3. **Write slides.ts** — title slide, then diagram slides using `carry()`
4. **Write drilldowns.ts** — 3-8 drilldowns for deep-dive content
5. **Write presentation.ts** — assemble PresentationDef
6. **Verify** — run `npm run dev`, walk every slide start to finish

## Verification Checklist

After every change, walk the full slide sequence:

- [ ] Arrow labels visible — not hidden behind nodes
- [ ] No arrows pass through intermediate nodes
- [ ] Nodes sit on logical rows/columns
- [ ] Region labels visible (top nodes at y >= 55)
- [ ] Annotations don't overlap nodes or arrow paths
- [ ] Each slide adds exactly one concept
- [ ] Post-compact, no node moves
- [ ] Every `onClick` points to an existing drilldown ID
- [ ] Every drilldown is reachable from at least one slide
- [ ] No orphaned drilldowns

## Complete Minimal Example

```typescript
// slides.ts
import type { DiagramSlide, SlideDef } from 'unfoldjs'
import { carry } from 'unfoldjs'

const slide0: SlideDef = {
  type: 'title',
  title: 'How DNS Works',
  subtitle: 'From browser to authoritative nameserver',
}

const slide1: DiagramSlide = {
  type: 'diagram',
  heading: 'The browser asks the OS',
  nodes: [
    { id: 'browser', label: 'Browser', x: 150, y: 200, w: 170, h: 70, color: 'sea' },
    { id: 'stub', label: 'Stub Resolver', sub: 'OS library', x: 550, y: 200, w: 170, h: 70, color: 'stone' },
  ],
  arrows: [
    { from: 'browser', to: 'stub', label: 'getaddrinfo()' },
  ],
}

const slide2 = carry(slide1, {
  heading: 'The stub queries a recursive resolver',
  nodes: [
    // Compact existing
    { id: 'browser', x: 100, y: 55, w: 120, h: 48 },
    { id: 'stub', x: 280, y: 55, w: 140, h: 48 },
    // Add new
    { id: 'recursive', label: 'Recursive Resolver', sub: '1.1.1.1', x: 200, y: 180, w: 155, h: 48, color: 'sage' },
  ],
  arrows: [
    { from: 'browser', to: 'stub', label: 'getaddrinfo()' },
    { from: 'stub', to: 'recursive', label: 'DNS query' },
  ],
  annotations: [
    { type: 'text-block', x: 500, y: 80, w: 350,
      text: 'The stub resolver is a simple library that forwards queries to a configured recursive resolver.' },
  ],
})

export const slides: SlideDef[] = [slide0, slide1, slide2]

// presentation.ts
import type { PresentationDef } from 'unfoldjs'
import { slides } from './slides'

export const presentation: PresentationDef = {
  title: 'How DNS Works',
  slides,
}
```

## Study the Examples

The npm package includes complete example presentations. Read them to understand real-world patterns:

- `node_modules/unfoldjs/examples/dns/` — 15 slides, 6 drilldowns
- `node_modules/unfoldjs/examples/k8s/` — Kubernetes architecture
- `node_modules/unfoldjs/examples/transformer-architecture/` — Transformer internals

For the full type reference, read `node_modules/unfoldjs/docs/SCHEMA.md`.
For arrow routing details, read `node_modules/unfoldjs/docs/ARROWS.md`.
