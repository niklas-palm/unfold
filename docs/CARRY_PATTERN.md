# The carry() Pattern

`carry()` builds evolving diagrams by merging overrides onto a previous slide. This avoids repeating the full node list on every slide.

## Import

```typescript
import { carry } from 'unfoldjs'
```

## Signature

```typescript
carry(prevSlide: DiagramSlide, overrides: {
  heading?: string
  subheading?: string
  nodes?: NodeDef[]        // merged by ID
  removeNodes?: string[]   // IDs to remove
  arrows?: ArrowDef[]      // replaces wholesale
  regions?: RegionDef[]    // replaces wholesale
  annotations?: AnnotationDef[]  // replaces wholesale
  notes?: string
  presenterNotes?: string
}) => DiagramSlide
```

## Rules

1. **Nodes are merged by ID** — if a node with the same ID exists, its fields are shallow-merged. New IDs are appended.
2. **removeNodes** removes nodes by ID before merging.
3. **Arrows, regions, annotations** are replaced wholesale — the previous slide's arrays are discarded.
4. **heading, subheading, notes, presenterNotes** are replaced if provided. Pass `undefined` to keep the previous value.

## Example

```typescript
const slide6: DiagramSlide = {
  type: 'diagram',
  heading: 'Token Vault',
  nodes: [
    { id: 'client', label: 'Client', icon: '🖥', x: 10, y: 40, w: 130, h: 65 },
    { id: 'agent', label: 'Agent', icon: '🤖', x: 420, y: 40, w: 130, h: 65, color: 'sea' },
    { id: 'credprov', label: 'Credential Provider', x: 200, y: 172, w: 170, h: 50, color: 'mist' },
    { id: 'vault', label: 'Token Vault', icon: '🔐', x: 430, y: 172, w: 130, h: 50, color: 'sand' },
  ],
  // ...arrows, regions, annotations
}

const slide7 = carry(slide6, {
  heading: 'Agent requests a token',
  // Remove Credential Provider, add Identity in its place
  removeNodes: ['credprov'],
  nodes: [
    { id: 'identity', label: 'Identity', icon: '🔑', x: 200, y: 172, w: 150, h: 50, color: 'mist' },
  ],
  // New arrows (replaces slide6's arrows entirely)
  arrows: [
    { from: 'agent', to: 'identity', label: 'withAccessToken', color: 'mist' },
    { from: 'identity', to: 'vault', label: 'check vault', color: 'sand' },
  ],
  annotations: [
    { type: 'status', x: 430, y: 237, variant: 'error', title: 'Empty!' },
  ],
})
```

Result: `slide7` has client, agent, identity, vault (credprov removed, identity added), with new arrows and annotations.

## Tips

- Start your first diagram slide as a regular `DiagramSlide` object
- Use `carry()` from the second diagram slide onward
- The "compact transition" pattern: change node positions in a carry to trigger smooth Framer Motion layout animations
- Keep `removeNodes` and `nodes` in the same carry call — removes happen first, then additions

## Cleanup After Modifications

When modifying a presentation that uses `carry()`, changes cascade — removing a node on slide 4 affects all subsequent slides that inherited it. After any modification:

- Verify all `onClick` references still point to existing drilldown IDs
- Remove orphaned drilldowns that are no longer referenced from any slide
- Check that arrow `from`/`to` IDs reference nodes that exist on that slide
- Walk the full slide sequence to verify the narrative still flows
