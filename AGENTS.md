# Unfold — Agent Instructions

This repo is the **Unfold presentation framework** — a data-driven engine for animated, diagram-based technical presentations. You build presentations by writing TypeScript data files. No React or JSX knowledge is needed.

## Getting Started

Read `docs/AGENT_GUIDE.md`. It contains the complete workflow: layout principles, step-by-step instructions, and a verification checklist. That is your primary reference.

Supporting documentation:

- `docs/SCHEMA.md` — Type reference for all slides, nodes, arrows, annotations, drilldowns
- `docs/BRANDING.md` — Fonts, logo, colors, theme customization
- `docs/ARROWS.md` — Arrow routing and label spacing rules
- `docs/DRILLDOWNS.md` — Content, Code, and Sequence drilldown modals
- `docs/CARRY_PATTERN.md` — Evolving diagrams with `carry()`
- `docs/ANNOTATIONS.md` — All annotation types
- `docs/FOCUS.md` — Focus expansion pattern

## Reference Presentations

Study these before building:

- `examples/dns/` — How DNS works — 15 slides, 6 drilldowns
- `examples/k8s/` — Kubernetes architecture
- `examples/transformer-architecture/` — Transformer internals

## Working on a Presentation

1. Create your presentation files (slides.ts, drilldowns.ts, presentation.ts)
2. Import from `unfoldjs`: `import type { SlideDef } from 'unfoldjs'`
3. Run `npm run dev` to preview

## Rules

- **Do NOT modify `src/framework/`** — this is the engine.
- All node positions are hard-coded coordinates in a 900x560 diagram canvas.
- Uses inline styles throughout — no CSS framework, no Tailwind.
- Simplicity and readability is key.
