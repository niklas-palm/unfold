# Focus (Node Expansion)

Focus lets you "open up" a node to reveal its internal structure. The node grows into a larger card while everything else dims behind a semi-transparent overlay. This creates a spotlight effect that draws the audience's attention to what's inside a component.

## When to Use Focus

- **Zooming into internals** — a Kubernetes pod contains multiple containers, a service has internal modules, a pipeline has stages
- **Highlighting internal workings** — show what's inside a black box that was introduced as a single node earlier
- **Breaking down complexity** — a component that the audience has been treating as atomic now needs to be explained in detail
- **Before-and-after reveal** — show a compact node, expand it to teach internals, then collapse it back and continue the narrative

Focus works best as a **one-slide detour**: expand on one slide, collapse on the next. This keeps the overall diagram stable while giving the audience a deep dive into one component.

## How It Works

1. The targeted node animates from its compact position/size to the expanded position/size (0.7s, slow and deliberate)
2. All other nodes, regions, arrows, and annotations dim behind a semi-transparent overlay
3. The expanded node renders a header (the node's label) and a vertical list of internal items
4. Items have colored left borders and a distinct visual style — clearly different from regular nodes
5. On the next slide (without `focus`), the node shrinks back and the overlay fades out

## Basic Example

```typescript
// Slide 5: introduce the pod as a single node
const slide5 = carry(slide4, {
  heading: 'One sandbox per project',
  nodes: [
    { id: 'sandbox', label: 'Sandbox Pod', x: 80, y: 350, w: 155, h: 48, color: 'mist' },
  ],
})

// Slide 6: expand the pod to show internals
const slide6 = carry(slide5, {
  heading: 'Inside each sandbox',
  focus: {
    nodeId: 'sandbox',
    x: 250, y: 100,      // expanded position (centered in diagram)
    w: 400, h: 320,       // expanded size
    items: [
      { label: 'Vite Dev Server', sub: ':5173 · HMR preview', color: 'sea' },
      { label: 'FastAPI Backend', sub: ':3001 · User app', color: 'sage' },
      { label: 'Tools API', sub: ':8000 · Agent tools', color: 'warm' },
    ],
    footnote: 'All share a /workspace PVC',
  },
})

// Slide 7: collapse back — node shrinks, overlay fades
const slide7 = carry(slide6, {
  heading: 'Multi-tenant isolation',
  // No focus → node returns to compact size
  nodes: [
    { id: 'sandbox', label: 'Sandbox', sub: 'project-a', x: 80, y: 350, w: 120, h: 48 },
    { id: 'sb2', label: 'Sandbox', sub: 'project-b', x: 230, y: 350, w: 120, h: 48 },
  ],
})
```

## Positioning the Expanded Card

The `x` and `y` fields override where the expanded card appears. If omitted, it expands in place (which usually overflows the diagram area). **Always specify x and y** to center the expanded card in a visible region.

Good starting points for a 900×560 diagram:
- **Centered**: `x: 250, y: 100, w: 400, h: 320`
- **Left-aligned**: `x: 50, y: 80, w: 380, h: 340`
- **Right-aligned**: `x: 450, y: 80, w: 400, h: 340`

The expanded card should not overlap the heading/subheading area (top ~60px of the slide).

## Sizing the Expanded Card

Each focus item is roughly 55px tall (label + sub + padding + gap). Size the card to fit:

| Items | Recommended h |
|-------|--------------|
| 2 | 220–240 |
| 3 | 280–320 |
| 4 | 340–380 |
| 5 | 400–440 |

Add ~40px if using a footnote.

## Focus Items vs Regular Nodes

Focus items are intentionally styled differently from regular nodes:

| | Regular Nodes | Focus Items |
|---|---|---|
| Layout | Centered icon + label + sub | Left-aligned label + sub |
| Border | Full border, rounded | Left border only (3px colored) |
| Background | Semantic color fill | Subtle tint or surface color |
| Interactivity | `onClick` opens drilldown | `onClick` opens drilldown |
| Purpose | Architecture component | Internal sub-component |

This visual distinction helps the audience understand that focus items are **parts of** the expanded node, not independent architectural components.

## Clickable Items and Footnotes

Items and footnotes can open drilldowns:

```typescript
focus: {
  nodeId: 'pod',
  w: 400, h: 320,
  items: [
    { label: 'Tools API', sub: '14 endpoints', color: 'warm', onClick: 'tools-drilldown' },
  ],
  footnote: 'Click for full internals',
  footnoteOnClick: 'pod-internals',
}
```

## Carry Behavior

Focus does **not** carry forward. Each slide that wants focus must explicitly set it. This means:
- The slide after a focus slide automatically collapses the node
- You don't need to explicitly clear focus with `focus: null`
- The collapse animation happens automatically via Framer Motion's layout system

## Animation Details

| Transition | Duration | What happens |
|---|---|---|
| Enter focus | 0.7s | Node expands, overlay fades in (0.3s) |
| Exit focus | 0.5s | Node shrinks back, overlay fades out (0.3s) |

The slower expansion (0.7s vs the standard 0.5s) is deliberate — it gives the audience time to follow the node as it "opens up."
