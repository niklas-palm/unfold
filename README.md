# Unfold

The presentation framework for AI agents.

Unfold turns TypeScript data files into animated, diagram-based technical presentations. Agents write structured slide definitions — nodes, arrows, regions, annotations — and the framework renders them as interactive presentations with smooth animations, drilldown modals, and progressive disclosure. No JSX or React knowledge required.

## When to use Unfold

Unfold is designed for **progressive architecture presentations** — the kind where you start with one component and reveal the system piece by piece until the audience understands the whole. Think: "How DNS works", "Kubernetes internals", "Transformer architecture".

It is **not** a bullet-point slide deck tool. If your content is mostly text with occasional diagrams, use a traditional slide framework.

## Quick Start

```bash
npm install unfoldjs
```

Create a `presentation.ts`:

```typescript
import type { PresentationDef, SlideDef } from 'unfoldjs'
import { carry } from 'unfoldjs'

const slide0: SlideDef = {
  type: 'title',
  title: 'How DNS Works',
  subtitle: 'From browser to authoritative nameserver',
}

const slide1: SlideDef = {
  type: 'diagram',
  heading: 'The browser makes a request',
  nodes: [
    { id: 'browser', label: 'Browser', x: 100, y: 200, w: 160, h: 65, color: 'sea' },
    { id: 'resolver', label: 'Stub Resolver', sub: 'OS', x: 400, y: 200, w: 160, h: 65, color: 'stone' },
  ],
  arrows: [
    { from: 'browser', to: 'resolver', label: 'getaddrinfo()' },
  ],
}

const slide2 = carry(slide1, {
  heading: 'The resolver queries upstream',
  nodes: [
    { id: 'recursive', label: 'Recursive Resolver', sub: '1.1.1.1', x: 250, y: 350, w: 160, h: 65, color: 'sage' },
  ],
  arrows: [
    { from: 'browser', to: 'resolver', label: 'getaddrinfo()' },
    { from: 'resolver', to: 'recursive', label: 'DNS query' },
  ],
})

export const presentation: PresentationDef = {
  title: 'How DNS Works',
  slides: [slide0, slide1, slide2],
}
```

Render it in your React app:

```typescript
import { PresentationApp } from 'unfoldjs'
import { presentation } from './presentation'

function App() {
  return <PresentationApp presentation={presentation} />
}
```

## Examples

| Example | Description |
|---------|-------------|
| `examples/dns/` | How DNS works — 15 slides, 6 drilldowns, custom neobrutalism theme |
| `examples/k8s/` | Kubernetes architecture |
| `examples/transformer-architecture/` | Transformer internals |

## Documentation

| Doc | Purpose |
|-----|---------|
| [AGENT_GUIDE.md](docs/AGENT_GUIDE.md) | **Start here.** Layout principles, workflow, verification checklist |
| [SCHEMA.md](docs/SCHEMA.md) | Complete type reference |
| [BRANDING.md](docs/BRANDING.md) | Fonts, logo, colors, theme customization |
| [CARRY_PATTERN.md](docs/CARRY_PATTERN.md) | Evolving diagrams with `carry()` |
| [ARROWS.md](docs/ARROWS.md) | Arrow routing and side hints |
| [ANNOTATIONS.md](docs/ANNOTATIONS.md) | All annotation types |
| [DRILLDOWNS.md](docs/DRILLDOWNS.md) | Content, Code, Sequence drilldown modals |
| [FOCUS.md](docs/FOCUS.md) | Focus expansion pattern |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Arrow keys | Navigate slides |
| Space | Next slide |
| N | Toggle notes panel |
| P | Open presenter view |
| + / - | Zoom in / out |
| Ctrl+0 | Reset zoom |
| Escape | Close drilldown |

## License

MIT
