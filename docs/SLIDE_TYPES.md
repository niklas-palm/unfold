# Slide Types

Three slide types: Title, Diagram, and List.

## Title Slide

Full-screen centered text. Use for intro/closing slides.

```typescript
{
  type: 'title',
  eyebrow: 'Amazon Bedrock AgentCore',    // small uppercase text
  title: 'Authorization Code Flow',        // large heading
  subtitle: 'How agents access APIs<br />on behalf of users',  // supports HTML
  hint: 'Use arrow keys to navigate',      // faded bottom text
  notes: 'Speaker notes here...',
}
```

## Diagram Slide

The core slide type. Contains a 900x560 pixel diagram area with nodes, arrows, regions, and annotations.

```typescript
{
  type: 'diagram',
  heading: 'The starting point',
  subheading: 'A user talks to an agent through a client application',
  nodes: [
    { id: 'client', label: 'Client', sub: 'Browser', icon: '🖥', x: 120, y: 160, w: 160, h: 80 },
    { id: 'agent', label: 'Agent', icon: '🤖', x: 460, y: 160, w: 180, h: 80, color: 'sea' },
  ],
  arrows: [
    { from: 'client', to: 'agent', label: '"What are my top tracks?"' },
  ],
  regions: [
    { id: 'runtime-region', label: 'AgentCore', contains: ['client', 'agent'] },
  ],
  annotations: [
    { type: 'status', x: 430, y: 237, variant: 'error', title: 'Empty!' },
  ],
  notes: 'Speaker notes...',
}
```

**Coordinate system:** The diagram area is 900px wide by 560px tall. Node positions are absolute pixel values within this area.

### Focus (expanding a node)

Use `focus` on a diagram slide to expand a single node into a detailed view, dimming everything else. The node animates from its compact size to the expanded size. On the next slide (without `focus`), it collapses back.

```typescript
{
  type: 'diagram',
  heading: 'Inside the pod',
  subheading: 'Three services share one container image',
  nodes: [
    { id: 'pod', label: 'Sandbox Pod', x: 80, y: 350, w: 155, h: 48, color: 'mist' },
    // ...other nodes stay in place but get dimmed
  ],
  focus: {
    nodeId: 'pod',
    x: 250, y: 100,       // where the expanded card appears
    w: 400, h: 320,        // expanded size
    items: [
      { label: 'Vite Dev Server', sub: ':5173 · HMR preview', color: 'sea' },
      { label: 'FastAPI Backend', sub: ':3001 · User app', color: 'sage' },
      { label: 'Tools API', sub: ':8000 · Agent tools', color: 'warm', onClick: 'tools-drilldown' },
    ],
    footnote: 'All share a /workspace PVC',
    footnoteOnClick: 'internals-drilldown',
  },
}
```

Focus items render as visually distinct sub-component cards with colored left borders — they look different from regular nodes to clearly communicate "these are internal parts."

## List Slide

Full-screen centered list with animated stagger. Use for recap/summary slides.

```typescript
{
  type: 'list',
  eyebrow: 'Before you build',
  heading: 'Common pitfalls',
  subheading: 'Things that will break your implementation',
  itemBorderColor: 'warm',
  items: [
    {
      icon: '🪪',
      title: 'JWT mismatch',
      desc: 'CompleteResourceTokenAuth must receive the same identity type used to create the WAT.',
    },
    {
      icon: '⏸️',
      title: 'Blocking tool call',
      desc: 'The agent pauses while polling. Your streaming code needs to yield auth URL events concurrently.',
    },
  ],
  notes: 'Speaker notes...',
}
```
