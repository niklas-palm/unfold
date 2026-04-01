# Drilldowns

Modal overlays triggered by clicking nodes or annotations. Three types: Content, Code, and Sequence.

## Philosophy

Drilldowns deepen understanding of **architecture and data flow** — they are not a place for implementation boilerplate.

- **Content** and **Sequence** drilldowns are the workhorses — use them for internal architecture, comparisons, and multi-step flows
- **Code** drilldowns should show essential patterns only (e.g., a proxy pattern, an SDK wrapper), not configuration files or setup commands
- **3-8 drilldowns per presentation is typical.** Curate for what genuinely benefits from deeper explanation — don't create one for every node.
- **Every drilldown must be reachable** via `onClick` from at least one slide. Orphaned drilldowns (defined but unreferenced) should be deleted.
- When modifying a presentation, verify that all `onClick` references still point to existing drilldown IDs, and remove any drilldowns that are no longer referenced.

## Triggering

Add an `onClick` field to a node or text-block annotation with the drilldown's `id`:

```typescript
// In a node:
{ id: 'authsvc', label: 'Auth Service', ..., onClick: 'auth-service' }

// In a text-block annotation:
{ type: 'text-block', ..., onClick: 'sequence-diagram' }
```

Close with Escape key or clicking outside.

## Content Drilldown

Rich multi-section layout with columns, notes, and numbered items.

```typescript
{
  type: 'content',
  id: 'auth-service',
  title: 'Auth Service',
  subtitle: 'Single Lambda behind CloudFront',
  sections: [
    {
      columns: [
        {
          heading: '/oauth2/callback',
          badge: { text: 'GET', color: 'sage' },
          authBadge: 'No auth',
          body: 'Browser redirect target...',
          items: [
            { label: '1', detail: 'Extracts session_id from URL' },
          ],
        },
      ],
    },
    {
      note: {
        title: 'Why two endpoints?',
        body: 'The callback is a browser redirect...',
      },
    },
  ],
}
```

### Section Fields

- `heading`: Section heading text
- `body`: HTML body text
- `items`: Numbered list items `{ label, detail }`
- `columns`: Side-by-side cards, each with `heading`, `badge`, `authBadge`, `body`, `items`
- `note`: Highlighted info box with `title` and `body`

## Code Drilldown

Syntax-highlighted code block with callout cards.

```typescript
{
  type: 'code',
  id: 'wat-code',
  title: 'withAccessToken',
  subtitle: 'SDK helper that retrieves and injects OAuth tokens',
  language: 'typescript',
  code: `import { withAccessToken } from 'bedrock-agentcore/identity'
// ...code here...`,
  callouts: [
    { title: 'First call', body: 'Vault is empty. Returns authorizationUrl...' },
    { title: 'Subsequent calls', body: 'Token exists — injected directly...' },
  ],
}
```

## Sequence Drilldown

Interactive SVG sequence diagram with phased reveal.

```typescript
{
  type: 'sequence',
  id: 'sequence-diagram',
  title: 'Authorization Code Flow',
  subtitle: 'Use arrow keys to step through',
  actors: [
    { id: 'client', label: 'Client', sub: 'Browser SPA' },
    { id: 'agent', label: 'Agent', sub: 'Runtime', color: 'sea' },
  ],
  phases: [
    {
      name: 'Initial Request',
      messages: [
        { from: 'client', to: 'agent', label: 'POST /invocations (JWT)' },
        { actor: 'agent', text: 'Validates JWT\nCreates WAT' },  // annotation
      ],
    },
  ],
}
```

### Message Types

Arrow messages:
- `from`, `to`: actor IDs
- `label`: text on the arrow
- `dashed`: optional dashed style

Actor annotations:
- `actor`: actor ID
- `text`: annotation text (supports `\n` for multiline)

Navigate phases with arrow keys within the modal.
