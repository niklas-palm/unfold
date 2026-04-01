# Schema Reference

Complete type reference for all presentation data structures. Source: `src/framework/types.ts`.

## Primitives

```typescript
type SemanticColor = 'sea' | 'warm' | 'sage' | 'blush' | 'mist' | 'clay' | 'sky' | 'stone' | 'sand' | 'slate' | 'default'
type Side = 'top' | 'bottom' | 'left' | 'right'
```

## ArrowEndpoint (union)

Arrow `from`/`to` fields accept three endpoint types:

| Type | Example | Description |
|------|---------|-------------|
| `string` | `'agent'` | Node ID — auto-routes to closest edge |
| `AnchorPoint` | `{ id: 'agent', side: 'bottom', offset: 0.3 }` | Node ID with explicit edge and position |
| `PixelPoint` | `{ x: 195, y: 300 }` | Absolute pixel coordinate in the 900×560 diagram area |

You can mix types: e.g. `from: { x: 75, y: 107 }` and `to: { id: 'node', side: 'left' }`.

## AnchorPoint

Used in arrow `from`/`to` fields for fine control over where arrows connect.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | string | yes | — | Node ID to connect to |
| `side` | Side | no | auto | Which edge of the node |
| `offset` | number | no | 0.5 | Position along edge (0=start, 1=end) |

## PixelPoint

Absolute pixel coordinate in the diagram area.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `x` | number | yes | X position (0–900) |
| `y` | number | yes | Y position (0–500) |

## NodeDef

A box in the diagram.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | string | yes | — | Unique ID (used for layoutId animations and arrow routing) |
| `label` | string | yes | — | Display text |
| `sub` | string | no | — | Subtitle below label |
| `icon` | string | no | — | Emoji shown above label |
| `x` | number | yes | — | Left position in 900x560 diagram area |
| `y` | number | yes | — | Top position in 900x560 diagram area |
| `w` | number | no | 130 | Width in pixels |
| `h` | number | no | 65 | Height in pixels |
| `color` | SemanticColor | no | 'default' | Color scheme |
| `onClick` | string | no | — | Drilldown ID to open when clicked |

## ArrowDef

A directed arrow between two nodes.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `from` | ArrowEndpoint | yes | — | Source: node ID, anchor, or pixel point |
| `to` | ArrowEndpoint | yes | — | Target: node ID, anchor, or pixel point |
| `label` | string | no | — | Text label at midpoint |
| `labelOffset` | { dx?, dy? } | no | — | Fine-tune label position (pixels) |
| `color` | SemanticColor | no | — | Arrow and label color |
| `dashed` | boolean | no | false | Dashed line style |

## RegionDef

A dashed container box (background layer). Two positioning modes: manual or auto-fit.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | string | yes | — | Unique ID (used for layoutId animations) |
| `label` | string | yes | — | Label text (uppercase, top-left) |
| `x` | number | no | — | Left position (manual mode) |
| `y` | number | no | — | Top position (manual mode) |
| `w` | number | no | — | Width (manual mode) |
| `h` | number | no | — | Height (manual mode) |
| `contains` | string[] | no | — | Node IDs — region auto-sizes to their bounding box |
| `padding` | number | no | 28 | Extra space around contained nodes (only with `contains`) |
| `group` | string | no | — | Regions in the same group share x position and width |

### Manual positioning

```typescript
{ id: 'region-a', label: 'My Region', x: 100, y: 50, w: 400, h: 200 }
```

### Auto-fit (recommended)

The region computes its bounds from the bounding box of the listed nodes, plus padding and label space:

```typescript
{ id: 'ac-region', label: 'AgentCore Runtime', contains: ['runtime', 'agent'] }
```

### Grouped regions

Regions in the same `group` automatically share the same x position and width (stacked card layout), with a gap between them:

```typescript
regions: [
  { id: 'runtime-region', label: 'AgentCore Runtime', contains: ['runtime', 'agent'], group: 'ac' },
  { id: 'identity-region', label: 'AgentCore Identity', contains: ['identity', 'vault'], group: 'ac' },
]
// → Both regions get the same left edge and width, stacked vertically
```

You can mix: use `contains` for auto-sizing but override specific dimensions with `x`/`y`/`w`/`h`.

## SlideDef (union)

Every slide has a `type` discriminator: `'title'`, `'diagram'`, or `'list'`.

### TitleSlide

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | 'title' | yes | — |
| `eyebrow` | string | no | Small uppercase text above title |
| `title` | string | yes | Main heading |
| `subtitle` | string | no | Supports HTML (e.g. `<br />`) |
| `hint` | string | no | Faded text at bottom |
| `notes` | string | no | Slide notes (shown in the notes panel, toggled with N key) |
| `presenterNotes` | string | no | Verbose speaker notes (shown in the presenter view, opened with P key) |

### DiagramSlide

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | 'diagram' | yes | — |
| `heading` | string | yes | Slide heading |
| `subheading` | string | no | Below heading |
| `nodes` | NodeDef[] | yes | All nodes in diagram |
| `arrows` | ArrowDef[] | no | Arrows between nodes |
| `regions` | RegionDef[] | no | Background containers |
| `annotations` | AnnotationDef[] | no | Labels, status indicators, etc. |
| `focus` | FocusDef | no | Expand a node to reveal internal structure (see below) |
| `zoom` | { x, y, scale } | no | Scale the entire diagram from a point |
| `notes` | string | no | Slide notes (shown in the notes panel, toggled with N key) |
| `presenterNotes` | string | no | Verbose speaker notes (shown in the presenter view, opened with P key) |

### ListSlide

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | 'list' | yes | — |
| `eyebrow` | string | no | Small uppercase text |
| `heading` | string | yes | Slide heading |
| `subheading` | string | no | Below heading |
| `items` | { icon?, title, desc }[] | yes | List items |
| `itemBorderColor` | SemanticColor | no | Border color for items |
| `notes` | string | no | Slide notes (shown in the notes panel, toggled with N key) |
| `presenterNotes` | string | no | Verbose speaker notes (shown in the presenter view, opened with P key) |

## FocusDef

Expands a single node into a larger card that reveals its internal components. Everything else dims behind a semi-transparent overlay. The expanded node floats above the overlay with an elevated shadow. See [FOCUS.md](./FOCUS.md) for detailed usage guide.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `nodeId` | string | yes | ID of the node to expand |
| `x` | number | no | Override x position when expanded (defaults to node's x) |
| `y` | number | no | Override y position when expanded (defaults to node's y) |
| `w` | number | yes | Width of the expanded node |
| `h` | number | yes | Height of the expanded node |
| `items` | FocusItem[] | yes | Internal components displayed vertically |
| `footnote` | string | no | Text at the bottom of the expanded card |
| `footnoteOnClick` | string | no | Drilldown ID for the footnote |

### FocusItem

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `label` | string | yes | Component name |
| `sub` | string | no | Description text below label |
| `color` | SemanticColor | no | Left border color |
| `onClick` | string | no | Drilldown ID |

Focus does **not** carry forward via `carry()` — each slide must explicitly set it. The next slide automatically collapses the node back to its normal size.

## AnnotationDef (union)

See [ANNOTATIONS.md](./ANNOTATIONS.md) for detailed examples of each type.

## DrilldownDef (union)

Three types: `'content'`, `'code'`, `'sequence'`. See [DRILLDOWNS.md](./DRILLDOWNS.md) for full examples.

All drilldowns share: `id` (string, used by `onClick`), `title`, `subtitle?`.

### DrilldownSection (used by ContentDrilldown)

| Field | Type | Description |
|-------|------|-------------|
| `heading` | string? | Section heading |
| `body` | string? | HTML body text |
| `items` | { label, detail }[]? | Numbered list |
| `columns` | Column[]? | Side-by-side cards |
| `note` | { title, body }? | Highlighted info box |

Each **Column** has: `heading`, `badge?: { text, color? }`, `authBadge?: string`, `body`, `items?: { label, detail }[]`.

### CodeDrilldown

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | string | yes | Code to display |
| `language` | string | yes | Language for display (e.g. `'typescript'`) |
| `callouts` | { title, body }[] | no | Explanation cards below the code |

### SequenceDrilldown

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `actors` | SequenceActor[] | yes | Columns: `{ id, label, sub?, color? }` |
| `phases` | SequencePhase[] | yes | Phases revealed with arrow keys |

Each **SequencePhase** has `name` and `messages[]`. Messages are either:
- **Arrow**: `{ from, to, label?, dashed? }` — arrow between actors
- **Annotation**: `{ actor, text }` — note on a single actor (supports `\n`)

## ThemeDef

The framework ships a default light theme. Override any field via `theme` on your `PresentationDef`:

```typescript
export const presentation: PresentationDef = {
  title: 'My Preso',
  theme: {
    bgPage: '#1a1a2e',
    text: '#eee',
    // ... override only the fields you want
  },
  slides,
}
```

Key color fields: `text`, `textBody`, `textMuted`, `textLight`, `textFaint`, `bgPage`, `bgSurface`, `bgMuted`, `borderLight`, `borderMedium`, `borderDefault`.

Semantic colors (`colors` object): each key (`sea`, `warm`, `sage`, `blush`, `mist`, `clay`, `sky`, `stone`, `sand`, `slate`, `default`) maps to `{ bg, border, text }`.

## PresentationDef

Top-level structure.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | yes | Presentation title |
| `theme` | Partial\<ThemeDef\> | no | Custom theme overrides |
| `slides` | SlideDef[] | yes | Ordered array of slides |
| `drilldowns` | DrilldownDef[] | no | Modal content triggered by onClick |
