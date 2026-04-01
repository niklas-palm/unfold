# Unfold Presentation Framework

Data-driven presentation engine for animated, diagram-based technical presentations. Authors write TypeScript data files only — no React/JSX needed. The framework handles rendering, animations, arrow routing, and responsive scaling.

## Project Structure

    src/framework/           Engine source
    examples/                Reference presentations
      dns/                   How DNS works
      k8s/                   Kubernetes architecture
      transformer-architecture/  Transformer internals
    docs/                    Documentation
    skills/                  Agent skill definitions

## Building a Presentation

1. Read `docs/AGENT_GUIDE.md` — layout principles, workflow, verification checklist
2. Read `docs/SCHEMA.md` for the type reference
3. Study `examples/dns/` as a working reference
4. Create your presentation files (slides.ts, presentation.ts, optional drilldowns.ts)
5. Run `npm run dev` to preview

## Imports

All framework imports use the `unfoldjs` package:

    import type { PresentationDef, DiagramSlide, SlideDef } from 'unfoldjs'
    import { carry } from 'unfoldjs'

## Key Documentation

| Doc | Purpose |
|-----|---------|
| `docs/AGENT_GUIDE.md` | **Start here.** Layout principles, step-by-step workflow, verification checklist |
| `docs/SCHEMA.md` | Complete type reference for all slides, nodes, arrows, annotations, drilldowns |
| `docs/BRANDING.md` | Fonts, logo, colors, theme customization |
| `docs/ARROWS.md` | Arrow routing, label spacing, side hints |
| `docs/DRILLDOWNS.md` | Content, Code, and Sequence drilldown modals |
| `docs/CARRY_PATTERN.md` | Evolving diagrams with `carry()` |
| `docs/ANNOTATIONS.md` | All annotation types |
| `docs/FOCUS.md` | Focus expansion pattern |

## Rules

- All node positions are hard-coded coordinates in a 900x560 diagram canvas.
- Uses inline styles throughout — no CSS framework, no Tailwind.
- Simplicity and readability is key.
