# Unfold

The presentation framework for AI agents.

Unfold turns TypeScript data files into animated, diagram-based technical presentations. Agents write structured slide definitions — nodes, arrows, regions, annotations — and the framework renders interactive presentations with smooth animations, drilldown modals, and progressive disclosure. No JSX or React knowledge required.

**When to use Unfold:** progressive architecture presentations where you start with one component and reveal the system piece by piece. Think: "How DNS works", "Kubernetes internals", "Transformer architecture". Not for bullet-point slide decks.

## Setup

### 1. Install the package

In any React + Vite project:

```bash
npm install unfoldjs framer-motion prism-react-renderer
```

### 2. Add the agent skill

The skill teaches your AI agent how to build Unfold presentations. Copy [`skills/SKILL.md`](skills/SKILL.md) into your agent's skill directory:

**Claude Code:**
```bash
mkdir -p .claude/skills
curl -o .claude/skills/unfold.md https://raw.githubusercontent.com/niklas-palm/unfold/main/skills/SKILL.md
```

**Cursor / Windsurf:**
```bash
mkdir -p .cursor/skills  # or .windsurf/skills
curl -o .cursor/skills/unfold.md https://raw.githubusercontent.com/niklas-palm/unfold/main/skills/SKILL.md
```

**Strands SDK:**

Point the `AgentSkills` plugin at a directory containing `SKILL.md`:

```python
from strands import Agent
from strands.agent.plugins import AgentSkills

agent = Agent(
    plugins=[AgentSkills(skills="./skills")]
)
```

**Any other agent:** Add the contents of [`skills/SKILL.md`](skills/SKILL.md) to your agent's system prompt or tool instructions when the user asks for a presentation.

### 3. Ask your agent to build a presentation

```
Build an interactive presentation explaining how DNS resolution works.
```

The agent will confirm that a progressive diagram presentation is the right fit, install the package if needed, study the examples in `node_modules/unfoldjs/examples/`, and build a working presentation.

### 4. Custom styling (optional)

Provide a style guide or describe your preferences:

```
Use a dark theme with our brand blue (#2d7d9a). Font: Inter.
```

The agent translates this into theme overrides. For full control, provide a `STYLE_GUIDE.md` with your brand colors, fonts, and design rules — the agent reads it as the source of truth for visual decisions. See [BRANDING.md](docs/BRANDING.md) for all theme properties.

## How it works

The agent creates TypeScript data files — no JSX:

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
  heading: 'The browser asks the OS',
  nodes: [
    { id: 'browser', label: 'Browser', x: 150, y: 200, w: 160, h: 65, color: 'sea' },
    { id: 'stub', label: 'Stub Resolver', sub: 'OS', x: 500, y: 200, w: 160, h: 65, color: 'stone' },
  ],
  arrows: [
    { from: 'browser', to: 'stub', label: 'getaddrinfo()' },
  ],
}

// Each slide builds on the previous — nodes merge by ID, arrows replace
const slide2 = carry(slide1, {
  heading: 'The stub queries a recursive resolver',
  nodes: [
    { id: 'recursive', label: 'Recursive Resolver', sub: '1.1.1.1', x: 300, y: 350, w: 160, h: 65, color: 'sage' },
  ],
  arrows: [
    { from: 'browser', to: 'stub', label: 'getaddrinfo()' },
    { from: 'stub', to: 'recursive', label: 'DNS query' },
  ],
})

export const presentation: PresentationDef = {
  title: 'How DNS Works',
  slides: [slide0, slide1, slide2],
}
```

Render with a single component:

```typescript
import { PresentationApp } from 'unfoldjs'
import { presentation } from './presentation'

function App() {
  return <PresentationApp presentation={presentation} />
}
```

## Examples

The package includes complete reference presentations that agents study before building:

| Example | Description |
|---------|-------------|
| `examples/dns/` | How DNS works — 15 slides, 6 drilldowns |
| `examples/k8s/` | Kubernetes architecture |
| `examples/transformer-architecture/` | Transformer internals |

After installing, these are at `node_modules/unfoldjs/examples/`.

## Documentation

Detailed reference for agents — also available in `node_modules/unfoldjs/docs/` after install:

| Doc | Purpose |
|-----|---------|
| [AGENT_GUIDE.md](docs/AGENT_GUIDE.md) | Layout principles, workflow, verification checklist |
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
