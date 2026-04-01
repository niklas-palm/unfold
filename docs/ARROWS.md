# Arrows

Arrows connect nodes by ID. The framework computes positions directly from node data (x, y, w, h) — no DOM measurement, so arrows are always correct on first render.

## Basic Usage

The simplest arrow — just node IDs:

```typescript
arrows: [
  { from: 'client', to: 'agent', label: 'JWT' },
]
```

The engine picks the closest edges automatically based on relative node positions.

## Side Hints

Force an arrow to exit/enter a specific edge:

```typescript
{ from: { id: 'agent', side: 'bottom', offset: 0.3 }, to: { id: 'identity', side: 'right' } }
```

- `side`: `'top'` | `'bottom'` | `'left'` | `'right'`
- `offset`: 0 to 1 along the edge (0.5 = center, default)

Use side hints when:
- Auto-routing picks the wrong edge (nodes at diagonal positions)
- You want multiple arrows on the same edge (spread with different `offset` values)
- You need a specific visual flow direction

## Pixel Coordinates (Escape Hatch)

For arrows that don't connect to nodes — or when you need precise control — use `{ x, y }` pixel coordinates:

```typescript
// Arrow from a fixed point to a node
{ from: { x: 195, y: 300 }, to: { id: 'spotify-idp', side: 'left' }, label: 'redirect', dashed: true }

// Arrow between two fixed points (e.g. a "self-arrow" or annotation connector)
{ from: { x: 75, y: 107 }, to: { x: 75, y: 258 }, label: 'opens popup', color: 'sage' }
```

You can mix endpoint types: one end can be a node ID or anchor, the other a pixel point.

Use pixel coordinates when:
- Drawing arrows to/from annotations (popup boxes, code snippets, etc.)
- Creating vertical "self-referencing" arrows on the same x-coordinate
- Auto-routing can't produce the visual you need

### Fine-tuning labels

Use `labelOffset` to nudge a label from its default position:

```typescript
{ from: 'a', to: 'b', label: 'text', labelOffset: { dx: 20, dy: -10 } }
```

## Styling

```typescript
{ from: 'agent', to: 'client', label: 'SSE: authUrl', color: 'mist', dashed: true }
```

- `color`: SemanticColor — colors the line, arrowhead, and label
- `dashed`: renders a dashed line instead of solid
- `label`: text displayed at the midpoint, offset 14px above the line

## Auto-Routing Algorithm

When no explicit `side` is specified, the router uses **angle-snapped ray casting**:

1. Compute the angle from node A's center to node B's center
2. **Snap** to the nearest clean angle: 0°, 30°, 45°, 60°, 90°, 120°, 135°, 150°, 180°, etc.
   - Horizontal (0°/180°) and vertical (90°/270°) have a **wide 25° attraction zone** — if the raw angle is within 25° of H/V, it snaps to it
   - This means most side-by-side nodes produce perfectly horizontal arrows, and stacked nodes produce perfectly vertical arrows
3. Cast a ray from each node's center at the snapped angle; the point where it exits the rectangle + 8px padding becomes the arrow endpoint
4. **Endpoint alignment**: when both endpoints are auto-routed and the resolved points are nearly H/V aligned (off-axis < 20% of on-axis), the framework forces perfect alignment. This ensures crisp vertical/horizontal lines even when nodes have slightly different centers.
5. Self-referencing arrows (same node) are skipped — use a text-block annotation instead
6. Label placed at midpoint, offset perpendicular to the arrow direction

## Overlap Spreading

When arrows end up on nearly the same path, the framework automatically spreads them into parallel lanes (12px apart) so they're visually distinct. This handles:

- **Same pair**: `A→B` and `B→A` — two arrows between the same nodes
- **Shared segment**: `A→B` and `A→C` where B and C are in the same direction — the overlapping portion gets spread
- **Any coincidental overlap** — even unrelated arrows that happen to be parallel and close

```typescript
arrows: [
  { from: 'client', to: 'runtime', label: 'JWT' },
  { from: 'runtime', to: 'agent', label: 'WAT' },
  { from: 'client', to: 'agent', label: 'direct' },  // overlaps client→runtime segment
]
// → The client→agent arrow shifts up slightly so all three are distinct
```

No configuration needed — it just works.

## Rendering

Arrows are rendered as a single SVG overlay on top of the diagram, using proper SVG markers for arrowheads. This ensures:
- Clean rendering at any zoom level
- No z-index conflicts between arrows and labels
- Proper dashing and arrowhead shapes

## Label Spacing

Arrow labels are rendered as 10px SVG text at the arrow's midpoint. The framework performs **no collision detection** — if a label overlaps a node, it silently disappears behind it.

- Keep labels to **1-3 words** (good: "JWT", "spans", "REST + NDJSON")
- Connected nodes need enough gap for the label to be visible:
  - **Vertical arrows**: at least **80px** between the bottom of the upper node and the top of the lower node
  - **Horizontal arrows**: at least **100px** between the right edge of the left node and the left edge of the right node
- If labels overlap nodes, **increase node spacing or shorten the label** — don't use `labelOffset` as a first fix
- For unlabeled arrows, 50px gaps are sufficient

If you find yourself adding `labelOffset` to many arrows, the layout grid is too tight. Go back and re-plan node positions with more generous spacing.

## Via Waypoints (U-Shaped Arrows)

Use `via` waypoints to create multi-segment arrows — useful when you need a U-shaped path connecting nodes on the same row, or any intentional non-straight path:

```typescript
// U-shaped arrow connecting two nodes on the same row, going underneath
{ from: { id: 'svc-a', side: 'bottom' }, to: { id: 'svc-c', side: 'bottom' },
  via: [{ x: 200, y: 350 }, { x: 400, y: 350 }], label: 'sync' }
```

Each waypoint is a `{ x, y }` pixel coordinate. The arrow renders as a polyline through all points in order.

**When to use `via`:**
- U-shaped arrows that intentionally go around a group of nodes
- L-shaped or stepped paths that are part of the visual design
- Any arrow where a straight line isn't the right shape

**When NOT to use `via`:**
- To route around a node that blocks a straight-line path — fix the layout instead

```typescript
// BAD — using via to dodge an intermediate node
{ from: 'api', to: 'kubelet', label: 'pod specs', via: [{ x: 70, y: 230 }] }

// GOOD — shift the intermediate node so the straight-line path is clear
{ from: 'api', to: 'kubelet', label: 'pod specs' }
```

## Common Pitfalls

### Don't use `side` hints as a layout tool

Side hints (`{ id: 'node', side: 'bottom' }`) force arrows to exit/enter specific edges. This almost always looks worse than the auto-router's choice. The auto-router with 25° angle snapping gets it right when nodes are grid-aligned. Only use side hints after visually confirming the auto-router picks the wrong edge — which is rare.

### Don't fan out from an offset node to a full row

When one node connects to multiple nodes on the same row, arrows to distant targets will cross through intermediate nodes (the framework draws straight lines — no obstacle avoidance).

```
BAD — Service is offset left, arrows to Pod B and Pod C cross through Pod A:

  [Service]  ──────────►  [Pod A]  [Pod B]  [Pod C]
       └──────────────────────────►────────────────►

GOOD — connect to the nearest target only, explain fan-out in an annotation:

  [Service]  ►  [Pod A]  [Pod B]  [Pod C]

Or center the source directly above/below the targets so arrows fan symmetrically.
```

## Tips

- For most arrows, just use node IDs — the angle-snapping auto-router handles the rest
- Use `side` hints only when the auto-router picks the wrong edge (rare with snapping)
- Use `{ x, y }` pixel coordinates for arrows that don't connect to nodes
- If an arrow doesn't appear, verify both `from` and `to` node IDs exist in the current slide's `nodes[]`
- Labels automatically get a background stroke for readability over other elements
