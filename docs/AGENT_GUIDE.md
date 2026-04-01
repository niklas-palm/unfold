# Agent Guide

Step-by-step instructions for AI agents creating new presentations with this framework.

## Prerequisites

- Read this file completely
- Read your presentation's `STYLE_GUIDE.md` — **the source of truth for all visual styling**: colors, typography, spacing, design rules. Every presentation has its own style guide. Always read it before building or modifying slides.
- Read `docs/SCHEMA.md` for the type reference
- Study `examples/dns/slides.ts` as a working reference

---

## Presentation Philosophy

This framework teaches how systems fit together through **progressive unfolding** — starting with one component and revealing the architecture piece by piece until the audience understands the whole.

**Prioritize architecture and data flow over implementation details.** The main slide sequence should answer: what are the components, how do they connect, and what flows between them. Technical depth is welcome but belongs in supporting material:

- **Main slides**: components, connections, data flow, system boundaries
- **Drilldowns**: architecture deep-dives, interaction sequences, essential code patterns
- **Not the main story**: configuration files, boilerplate code, deployment manifests

Err on the side of high-level overview. Users will guide toward more detail when they want it. An overly detailed presentation loses the audience; an overly abstract one can always be drilled into.

---

## Layout Philosophy

These principles are **opinionated** — follow them to produce clear, professional presentations. They are the result of iterating on real presentations and observing what works.

### 1. Rows Are Architectural Layers

Assign each horizontal row to a layer of your system. The audience reads top-to-bottom as "outside to inside" or "user to infrastructure":

```
Row 0:  User-facing layer      (browser, client, SPA)
Row 1:  API / service layer    (backend, databases, external services)
Row 2:  Control plane          (controllers, operators, orchestrators)
Row 3:  Workload layer         (pods, VMs, functions, runtimes)
```

Components within a row share the same `y` coordinate. This makes horizontal arrows between them perfectly clean and communicates that they're peers in the architecture.

### 2. Grow, Don't Move

Once you place a component, **it stays there**. Add new content by filling empty space — don't rearrange existing nodes. The audience builds a mental model of where things are. Moving nodes breaks that model.

The one exception is the **compact transition** (see below).

### 3. One Compact Transition

Start with large, focused nodes (the "zoom in" phase — typically slides 1-3). When you need to show the full system, do **one** compact transition where everything shrinks and repositions. After that, positions are permanently fixed.

```
Slides 1-3:   Large nodes (w:160-200, h:65-75) — 2-3 components
Slide 4:       COMPACT — all nodes shrink (w:100-155, h:48) — new components appear
Slides 5+:    Stable positions — only new nodes, arrows, and annotations change
```

### 4. Annotations for Detail, Nodes for Structure

**Nodes** represent components that participate in the architecture — things that have relationships (arrows). Don't create nodes for concepts, labels, or details.

**Annotations** carry the explanatory text: card-lists for bullet points, text-blocks for prose, numbered-lists for sequences, chip-lists for tags. Place them adjacent to the relevant nodes, typically in a dedicated panel on the right side of the stage.

### 5. Reserve the Right Panel

The diagram stage is 900×560px. Keep architectural nodes in the left ~550px and reserve the right ~350px (x:580+) for annotations. This creates a clean two-column layout: architecture on the left, explanation on the right. If your grid uses 3 columns and nodes extend past x:580 (e.g., rightmost column at x:490 with w:135 → right edge at x:625), push annotations further right accordingly (e.g., x:650). The x:580 guideline assumes nodes stay within ~550px — adjust it based on your actual rightmost node edge.

**Never place annotations at coordinates that overlap node bounding boxes or arrow paths.** Annotations render above nodes and arrows in z-order and will visually obscure them.

- **Node overlap**: Before placing an annotation, check that its (x, y) position does not fall within any node's rectangle (nodeX, nodeY, nodeX+w, nodeY+h). If you must place annotations in the same column as nodes, push them below the lowest node row (e.g., y:280+ when nodes occupy rows at y:55 and y:190).
- **Arrow overlap**: For every arrow on the current slide, mentally trace the straight line between the two connected nodes. Do not place annotations on or near that line. Diagonal arrows are the most common source of this problem — annotations placed between two diagonally-connected nodes will sit directly in the arrow's path. The fix is to move the annotation to the right panel (x:580+) or to a region of the canvas that no arrow crosses.

Exception: in pre-compact slides (large nodes), annotations can go below or beside the nodes since there's more space — but still check arrow paths.

### 6. Arrow Cleanliness

The arrow router snaps to horizontal/vertical when the center-to-center angle is within 25° of a cardinal direction, and auto-aligns endpoints for crisp lines. **Design for this**:

- **Horizontal arrows**: place connected nodes at the same `y` (±5px is fine)
- **Vertical arrows**: place connected nodes at the same `x` (±5px is fine)
- **Avoid diagonals**: if two nodes must connect but aren't aligned, accept one diagonal but route it so it doesn't cross other nodes

**Always let the framework route arrows by default.** Use plain node IDs (`from: 'a', to: 'b'`) — the auto-router picks the closest edges based on relative node positions. **Do not use `side` hints** (`{ id: 'a', side: 'bottom' }`) unless you have visually confirmed that the auto-router picks the wrong edge. This is rare with the 25° snapping — it almost always gets it right when nodes are grid-aligned. Side hints force unnatural routing and should be treated as a last resort, not a layout tool.

**Do not use `via` waypoints to fix crossing issues.** If an arrow's straight-line path crosses an intermediate node, the correct fix is to reposition nodes so the path is clear — not to add waypoints that create ugly bent paths. See the "Arrow corridors" section below. (`via` waypoints are great for intentional U-shaped or L-shaped arrows — see `docs/ARROWS.md`.)

Check that arrows don't pass through intermediate nodes. If `A → C` crosses `B`, reposition `B` or use side hints as a last resort.

**Label spacing.** Arrow labels are 10px text positioned at the arrow's midpoint. The framework does **no collision detection** — labels will silently disappear behind overlapping nodes.

- Keep arrow labels to **1-3 words** (good: "JWT", "spans", "REST + NDJSON"; bad: "sends authenticated request to the API")
- Vertical arrows between rows: at least **80px vertical gap** between the bottom of the upper node and the top of the lower node
- Horizontal arrows between columns: at least **100px horizontal gap** between the right edge of the left node and the left edge of the right node
- If a label would overlap a nearby node, **increase the gap or shorten the label** — do not reach for `labelOffset` as a first fix
- `labelOffset: { dx, dy }` exists for fine-tuning, but needing it on more than one or two arrows means the grid is too tight — go back to Step 1 and re-plan spacing

### 6a. Arrow Corridors

The framework draws straight lines between nodes — there is no obstacle avoidance. When an arrow must skip a row (e.g., row 1 → row 3), any node on the intermediate row (row 2) that sits in the straight-line path will be crossed.

**Plan corridors during layout design, not after.** For every arrow that skips a row, trace the straight line from source to target and verify that no intermediate node's bounding box intersects it. If it does, shift the intermediate nodes to create a clear corridor:

```
BAD — Scheduler blocks the API→kubelet arrow:

  Row 1:  [API Server x:180]
  Row 2:  [Scheduler x:180] [Controller Mgr x:340]    ← directly below API
  Row 3:  [kubelet x:100]

  The arrow from API (center ~250) to kubelet (center ~150) passes
  through the Scheduler (x:180-300) at row 2.

GOOD — Shift Scheduler right to open a vertical corridor:

  Row 1:  [API Server x:150]
  Row 2:               [Scheduler x:300] [Controller Mgr x:460]   ← shifted right
  Row 3:  [kubelet x:100]

  The arrow from API (center ~220) to kubelet (center ~155) now passes
  through x:200 at row 2, which is left of the Scheduler (x:300+). Clear.
```

**For crossing issues, the fix is always layout adjustment.** Don't use `via` waypoints or `side` hints to dodge intermediate nodes — reposition the nodes instead. (Reserve `via` for intentional shapes like U-arrows.)

### 6b. Fan-Out Arrows

When one node connects to multiple nodes on the same row, arrows to distant targets will cross through intermediate nodes. The framework does not do obstacle avoidance.

**Rule: connect to the nearest target only.** Use an annotation to explain that the connection fans out to all targets. One clean arrow communicates the relationship better than three crossing arrows.

```
BAD — Service connects to all three pods, crossing through Pod A:

  [Service x:30] ──► [Pod A x:160] [Pod B x:300] [Pod C x:440]
       └────────────────────────────►──────────────────────────►

GOOD — Single arrow to nearest, annotation explains the rest:

  [Service x:30] ► [Pod A x:160] [Pod B x:300] [Pod C x:440]
  + annotation: "Traffic is load-balanced across all matching pods"
```

Alternative: if the source node is centered directly above or below the targets, a symmetric fan-out works — arrows go left, center, and right without crossing.

### 6c. Adding Nodes to the Layout

When adding a new node in later slides, follow these rules:

1. **Same row as peers.** If the new node is the same type or layer as existing nodes, place it on the same row (same `y`). Don't create a new row between existing rows — it cramps vertical spacing and creates arrow collisions.

2. **Never squeeze between rows.** If the vertical gap between two rows is 115px (e.g., y:295 to y:410), don't insert a node at y:370 — it leaves only 27px gaps above and below, which is too tight for arrows or labels.

3. **Annotate instead of adding nodes.** Not every concept needs a node. Nodes are for components that participate in the architecture (have arrows). Concepts like HPA, RBAC policies, or scheduling algorithms are better explained via annotations.

### 7. Progressive Disclosure

Each slide introduces **one new concept**. The audience should be able to articulate what changed. Don't add three nodes and five arrows in one slide — add one node and the arrows it needs.

Typical narrative arc:
1. **Entry point** (user, client) — who initiates
2. **Core service** — what receives requests
3. **Dependencies** — databases, external APIs
4. **Internal machinery** — controllers, workers, operators
5. **Workloads** — what actually runs (pods, containers, functions)
6. **Interactions** — agent loops, tool calls, data flows
7. **Outputs** — deployed apps, results, artifacts
8. **Full picture** — all arrows, drilldown links

### 8. Color Consistency

Assign one semantic color per component type and use it throughout. The available palette is defined in the presentation's `STYLE_GUIDE.md`. Typical mappings:

| Color | Typical use |
|-------|------------|
| `sea` | User-facing (frontend, client, preview) |
| `sage` | Backend services (API, controller) |
| `mist` | Data/storage (databases, pods, workloads) |
| `warm` | External services, outputs (LLM, deployed apps) |
| `clay` | Infrastructure, ephemeral (placeholders, caches) |
| `slate` | Stateful services (databases, registries) |
| `sand` | Secondary infrastructure (vaults, caches) |
| `blush` | Alerts, attention states |
| `sky` | Networking, ingress, routing |
| `stone` | Neutral, supporting components |

**Color distinction rules:**
- Adjacent nodes must use colors with **clearly different hues** — not brightness variants of the same hue. If two nodes sit next to each other, their colors should be immediately distinguishable.
- The semantic color `bg` must be visibly distinct from `bgPage`. If a node blends into the background, the color is too subtle — increase saturation. This is especially important for dark themes.
- Use the same color for nodes in the same logical group (e.g., all input-related nodes share `sea`).

Refer to the presentation's `STYLE_GUIDE.md` for the full color definitions, typography, and design rules. That file is the source of truth for visual styling — always follow it over defaults.

### 9. Professional Typography

- **No emojis** — use clean labels and sub-labels. Color coding provides visual distinction.
- Keep labels short (1-3 words). Use `sub` for secondary info (port numbers, tech stack).
- In compact mode (h:48), drop `sub` if it's not essential — set `sub: ''` to clear inherited values.

### 10. Regions for Boundaries

Use regions (`contains: [...]`) to draw boundaries around components that share an infrastructure context (e.g., "EKS Cluster", "VPC", "Namespace"). Regions auto-size with padding.

- Regions can grow as you add nodes across slides
- Components outside the region are visually distinct (external services, clients)
- One or two regions per slide is enough — don't over-box

**Region label clipping — critical rule:**

> **Any node inside a region must have y ≥ 55.** The region box extends `padding` pixels above the top node (default 28), and the region label renders at 12px inside the top of that box. With y:55 and padding:28, the region top is at y:27 and the label renders at y:39 — safely on-canvas. Lower y values push the label off the top edge of the canvas, making it invisible.

This is the most common region bug. Before placing nodes inside a region, verify:
1. The topmost node has `y: 55` or higher
2. With the region's `padding`, the region top (`y - padding`) is at least `y: 10` so the label at `regionTop + 12` is visible

```
BROKEN — label clipped off-canvas:
  Node y:10, padding:28 → region top: -18 → label at y:-6 (invisible)
  Node y:30, padding:20 → region top: 10  → label at y:22 (barely visible, tight)

SAFE — label clearly visible:
  Node y:55, padding:20 → region top: 35  → label at y:47 (visible)
  Node y:55, padding:28 → region top: 27  → label at y:39 (visible)
```

### 11. Annotation Position Consistency

Annotations that serve the same semantic role across consecutive slides **must appear at the same position**. When an annotation on slide N is replaced by a related annotation on slide N+1 (e.g., a status changing from "Empty!" to "✓ Token bound"), keep the same `x` and `y` coordinates. This prevents visual jumping and lets the audience track state changes in place.

Common cases:
- **Status annotations** that evolve (error → success): same position
- **Text blocks** that update their message: same position and width
- **Tool boxes** or **pill groups** that persist: same position unless a node moved

When using `carry()`, annotations are replaced wholesale — the framework does not auto-match them. You must manually ensure positional continuity for annotations that represent the same concept.

### 12. Design the Final Slide First

Before writing any code, sketch the **final "full picture" slide** — the one with all components, all arrows, all regions visible. This determines the post-compact grid. Then work backwards:

1. What's the narrative to get from a blank stage to this final picture?
2. Which component appears on which slide?
3. Where do the pre-compact (large) nodes go?

This prevents layouts that grow organically and end up cramped. If you design forward (slide 1, then slide 2, then...), you'll discover on slide 8 that there's no room for the components you still need to add.

The reference presentations (`dns/`, `k8s/`, `transformer-architecture/`) were built this way — the final slide's grid was planned first, then the unfolding narrative was designed to arrive at it.

---

## Step 1: Plan Your Layout Grid

This is the most important step. Plan the **full post-compact layout** before writing any slides. If you get the grid right, content flows naturally without restructuring.

1. **List all components** that will appear by the final slide
2. **Assign each to a row** (user-facing → API → control plane → workloads)
3. **Assign x positions** — components in the same row get the same `y`, spaced horizontally
4. **Sketch the compact grid** — this is the permanent layout from slide 4 onward:

```
Example grid (post-compact):
  y:55   [User w:105]  [Frontend w:145]        ← y:55+ if inside a region
  y:170  [Postgres w:125]  [API w:155]          [Bedrock w:150]
  y:290  [Controller w:130]
  y:410  [Sandbox w:120]  [Sandbox w:120]  [Sandbox w:120]
         ← inside EKS region →               ← outside →
```

5. **Trace every arrow on the final slide** — for each connection, verify:
   - Is there enough gap between the two nodes for the label? (80px vertical, 100px horizontal — see principle 6)
   - Does the arrow cross through any intermediate node? If so, reposition the intermediate node or place connected nodes on adjacent rows/columns
   - Are connected nodes on the same row (horizontal arrow) or same column (vertical arrow) where possible?
6. **Decide the narrative arc** — which component appears on which slide, one concept at a time
7. **Plan pre-compact slides** (1-3) with large nodes at different positions — these are the "zoom in" phase
8. **Plan the compact transition** (slide 4) where everything shrinks to the grid above

The goal: after the compact transition, **no node ever moves again**. Only new nodes, arrows, and annotations change.

## Step 2: Create Your Files

Create these files in your project:

```
slides.ts          # All slide definitions
drilldowns.ts      # Optional drilldown modals
presentation.ts    # Top-level PresentationDef
```

## Step 3: Write slides.ts

```typescript
import type { DiagramSlide, SlideDef } from 'unfold-ai'
import { carry } from 'unfold-ai'

// Start with a title slide
const slide0: SlideDef = {
  type: 'title',
  title: 'My Topic',
  subtitle: 'A presentation about...',
  hint: 'Use arrow keys to navigate',
}

// First diagram slide — define all initial nodes
const slide1: DiagramSlide = {
  type: 'diagram',
  heading: 'First concept',
  subheading: 'Explanation here',
  nodes: [
    { id: 'a', label: 'Service A', x: 100, y: 200, color: 'sea' },
    { id: 'b', label: 'Service B', x: 500, y: 200, color: 'sage' },
  ],
  arrows: [
    { from: 'a', to: 'b', label: 'Request' },
  ],
}

// Evolving diagram — use carry() to build on previous
const slide2 = carry(slide1, {
  heading: 'Next concept',
  nodes: [
    { id: 'c', label: 'Database', x: 500, y: 350, color: 'mist' },
  ],
  arrows: [
    { from: 'a', to: 'b', label: 'Request' },
    { from: 'b', to: 'c', label: 'Query', color: 'mist' },
  ],
})

export const slides: SlideDef[] = [slide0, slide1, slide2]
```

## Step 4: Write presentation.ts

```typescript
import type { PresentationDef } from 'unfold-ai'
import { slides } from './slides'

export const presentation: PresentationDef = {
  title: 'My Topic',
  slides,
}
```

## Step 5: Verify End-to-End

After creating **or modifying** any slides, run the presentation and walk through **every slide** start to finish.

```bash
npm run dev
```

### Visual checks (every slide)

- Arrow labels are visible — not hidden behind nodes, not clipped by stage edges
- No arrows pass through intermediate nodes unnecessarily (reposition nodes if they do)
- Nodes sit on logical rows and columns — the grid looks intentional, not accidental
- Region labels are visible (not pushed off-canvas by nodes at low y-values)
- Annotations don't overlap nodes, arrows, or each other — trace each arrow's straight-line path and verify no annotation sits on it (diagonal arrows are the most common culprit)

### Narrative checks (full sequence)

- Each slide adds exactly one concept — you can articulate what changed
- The compact transition feels like a single "zoom out" moment
- Post-compact, no node moves (except via intentional `removeNodes`)
- Annotation positions are consistent across consecutive slides (same concept = same position)
- Arrow labels don't change names between slides unless the change teaches something

### Reference integrity checks

- Every `onClick` on a node, annotation, or focus item points to an existing drilldown ID
- Every drilldown is reachable — at least one slide references its ID via `onClick`
- No orphaned drilldowns (defined in `drilldowns.ts` but never referenced from any slide)

Layout problems compound — a misplaced node on slide 4 creates arrow label and spacing problems on slides 5-12. Fix issues before moving on.

## Step 7: Add Notes (Optional)

Two kinds of notes:

- **`notes`** — concise technical description for the side panel (toggle with **N** key). Describes the system, not the slide.
- **`presenterNotes`** — speaker notes for the presenter view (open with **P** key). What you'd say to a technical colleague over a video call.

### Tone guidelines

Notes should be **educational and informal** — one technical person explaining to another. They should:

- Describe the system directly — what it is, how it works, why it matters
- **Never reference the diagram** — no "as you can see", "notice the arrow", "look at the node", "the three cards show"
- **Never be salesy** — no "elegant solution", "powerful feature", "bridges the gap"
- Relate specifically to what this slide introduces — not a general overview

```typescript
// Good:
notes: "The controller watches Sandbox CRDs and reconciles pods, services, PVCs, and secrets."
presenterNotes: "The controller watches Sandbox CRDs. When the API creates one, it reconciles the full set of resources — pod, service, PVC, and secrets. Standard controller-runtime pattern."

// Bad:
notes: "As you can see, the controller elegantly manages sandbox lifecycles."
presenterNotes: "Look at the diagram — you can see the controller watching Sandbox CRDs."
```

Both are optional. The notes panel only appears if at least one slide has `notes`. The presenter view falls back to `notes` if `presenterNotes` is not set.

---

## Drilldown Philosophy

Drilldowns deepen understanding of architecture and flow — they are **not** a place to dump implementation code.

### Preferred types

- **Content** (`type: 'content'`): Rich text with columns — best for explaining internal architecture, comparing alternatives, detailing resource types
- **Sequence** (`type: 'sequence'`): Interactive phased diagrams — best for multi-step interactions, request lifecycles, distributed flows

### Use code drilldowns sparingly

Code drilldowns (`type: 'code'`) should show **essential patterns**, not boilerplate. Good: a proxy pattern that shows how tool calls are routed. Bad: a full configuration file or standard setup commands.

### Quantity and reachability

- **3-8 drilldowns is typical.** Don't create one for every node or concept — only for things that benefit from a deeper explanation.
- **Every drilldown must be reachable** from at least one slide via an `onClick` on a node, annotation, or focus item.
- If a drilldown isn't reachable, either add an `onClick` reference or delete the drilldown.

---

## Modifying Existing Presentations

When updating an existing presentation (adding slides, changing nodes, modifying drilldowns):

1. **Read the entire `slides.ts` and `drilldowns.ts` first.** Understand the current narrative arc and grid layout before making changes.
2. **After any change, verify onClick integrity:**
   - Search for every `onClick` string in `slides.ts` — each must match a drilldown `id` in `drilldowns.ts`
   - Search for every drilldown `id` in `drilldowns.ts` — each must be referenced by at least one `onClick` in `slides.ts`
3. **Remove orphaned content:**
   - Delete drilldowns that are no longer referenced by any slide
   - Remove actors or sections within drilldowns that no longer match the presentation
4. **Walk the full slide sequence** (Step 6) to verify the narrative still flows after your changes.

Partial modifications are the most common source of broken presentations. A removed node can leave behind onClick references, orphaned drilldowns, and arrows pointing to non-existent IDs.

---

## Diagram Layout Tips

- The diagram area is **900px wide x 560px tall**
- Default node size is **130x65** — good for most labels
- Use larger nodes (160-200 wide, 65-75 tall) in pre-compact slides for emphasis
- Compact nodes: **100-155 wide, 48 tall** — drop unnecessary `sub` fields
- Place nodes so connected pairs share the same `x` or `y` for clean arrows
- Keep **80px+ vertical gaps** and **100px+ horizontal gaps** between connected nodes for labeled arrows (see principle 6)
- For unlabeled arrows, 50px gaps are sufficient
- Verify that arrows between distant nodes don't pass through intermediate nodes

### Regions

Use `contains` to auto-size regions around their nodes (recommended):

```typescript
regions: [
  { id: 'runtime-region', label: 'AgentCore Runtime', contains: ['runtime', 'agent'] },
]
```

**Remember:** the topmost node inside a region must have `y ≥ 55` — see principle 10 for the math. This is the most common source of clipped region labels.

Use `group` to align multiple stacked regions:

```typescript
regions: [
  { id: 'runtime-region', label: 'Runtime', contains: ['runtime', 'agent'], group: 'ac' },
  { id: 'identity-region', label: 'Identity', contains: ['identity', 'vault'], group: 'ac' },
]
```

You can also position regions manually with `x`, `y`, `w`, `h` if needed.

## Animation Tips

- Nodes with the same `id` across slides animate smoothly (Framer Motion layoutId)
- Changing a node's `x`/`y` triggers a smooth position animation
- Adding new nodes: they fade in
- Removing nodes (via `removeNodes`): they fade out
- **Focus expansion**: adding `focus` on a slide makes one node grow large while the rest dim; removing `focus` on the next slide collapses it back (0.7s expand, 0.5s collapse)
- This is the "evolving diagram" pattern — one diagram that progressively changes

## Common Patterns

**Compact transition**: Shrink existing nodes to make room for new layers:
```typescript
const slide4 = carry(slide3, {
  nodes: [
    // Shrink existing nodes — same IDs, smaller dimensions, new positions
    { id: 'user', label: 'User', sub: '', x: 100, y: 55, w: 105, h: 48, color: 'sea' },
    { id: 'api', label: 'API', sub: 'FastAPI', x: 237, y: 125, w: 155, h: 48, color: 'sage' },
    // Add new node in the space created below
    { id: 'controller', label: 'Controller', x: 80, y: 240, w: 130, h: 48, color: 'sage' },
  ],
})
```

**Clearing inherited sub-labels**: When compacting, explicitly set `sub: ''` to clear:
```typescript
{ id: 'frontend', label: 'React SPA', sub: '', x: 240, y: 5, w: 145, h: 48 }
// Without sub: '', the previous slide's sub value carries through
```

**Clickable annotations**: card-list items and text-blocks can trigger drilldowns:
```typescript
// Card list with clickable items
{ type: 'card-list', cards: [
  { label: 'write_file', detail: 'Create files', onClick: 'tool-write-file' },
]}
// Text block link
{ type: 'text-block', text: 'Click to see code', onClick: 'my-drilldown' }
```

**Clickable nodes**: Open drilldowns on click:
```typescript
{ id: 'authsvc', label: 'Auth Service', ..., onClick: 'auth-service' }
```

**Focus expansion**: Open a node to show its internal structure. The node expands into a detailed card while everything else dims. Use this when you need to teach what's *inside* a component — containers in a pod, modules in a service, stages in a pipeline:
```typescript
const slide6 = carry(slide5, {
  heading: 'Inside the pod',
  focus: {
    nodeId: 'pod',
    x: 250, y: 100, w: 400, h: 320,
    items: [
      { label: 'Web Server', sub: ':8080 · Nginx', color: 'sea' },
      { label: 'App Container', sub: ':3000 · Node.js', color: 'sage' },
      { label: 'Sidecar', sub: ':9090 · Envoy proxy', color: 'mist' },
    ],
    footnote: 'Shared network namespace',
  },
})
// Next slide: no focus → node collapses back automatically
```
See [FOCUS.md](../docs/FOCUS.md) for full guide including sizing, positioning, and animation details.
