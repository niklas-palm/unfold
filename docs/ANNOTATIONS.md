# Annotations

Annotations are visual elements placed at absolute positions within a diagram slide. All annotations have `type`, `x`, and `y` fields.

**Placement rule:** Never place annotations at coordinates that overlap node bounding boxes or arrow paths — annotations render above nodes and arrows in z-order and will obscure them. For every arrow on the slide, trace the straight line between the connected nodes and verify the annotation does not sit on it (diagonal arrows between non-aligned nodes are the most common source of overlap). In post-compact slides, keep annotations in the right panel (x:580+). Annotations that serve the same role across consecutive slides should stay at the same position to prevent visual jumping (see AGENT_GUIDE.md principle 11).

## pill-group

Token composition visualization — pills joined with operators.

```typescript
{
  type: 'pill-group', x: 290, y: 210,
  footnote: 'Runtime creates this composite token:',  // text above pills
  pills: [
    { icon: '👤', text: 'User JWT' },
    { icon: '🤖', text: 'Workload Identity' },
    { icon: '🔑', text: 'WAT', bold: true, color: 'sand' },
  ],
  joinWith: '+',  // separator between pills
}
```

## chip-list

Small colored tags in a row.

```typescript
{
  type: 'chip-list', x: 215, y: 230,
  chips: ['Client ID', 'Client Secret'],
  color: 'mist',
}
```

## status

Success or error indicator box.

```typescript
{
  type: 'status', x: 430, y: 237,
  variant: 'error',        // 'error' | 'success'
  title: 'Empty!',
  detail: 'No token for this WAT + provider',  // optional
}
```

## url-box

Display URLs in a bordered box.

```typescript
{
  type: 'url-box', x: 170, y: 250, color: 'mist',
  title: 'Identity returns:',
  urls: [
    'authorizationUrl: https://bedrock-agentcore.../oauth2/authorize?...',
    'sessionUri: urn:ietf:params:oauth:request_uri:abc123',
  ],
}
```

## tool-box

Function/tool name with icon.

```typescript
{
  type: 'tool-box', x: 570, y: 245,
  icon: '🔧',
  name: 'getTopTracks()',
  detail: 'needs Bearer token',  // optional subtitle
}
```

## popup-box

Browser popup window representation.

```typescript
{
  type: 'popup-box', x: 10, y: 265,
  title: 'Popup window',
  detail: 'AgentCore authorize endpoint',
  w: 180,  // optional width, default 180
}
```

## card-list

Comparison or detail cards. Individual cards can be clickable (opens a drilldown).

```typescript
{
  type: 'card-list', x: 200, y: 310,
  direction: 'row',  // 'row' | 'column', default 'row'
  cards: [
    { label: 'First call', detail: 'OAuth popup + polling (~10s)', borderColor: 'warm' },
    { label: 'Subsequent', detail: 'Instant — token from vault', borderColor: 'sage' },
    { label: 'write_file', detail: 'Create or overwrite files', onClick: 'tool-write-file' },
  ],
}
```

## numbered-list

Setup/configuration steps.

```typescript
{
  type: 'numbered-list', x: 170, y: 255, color: 'mist',
  items: [
    { title: 'Create Spotify App', detail: 'developer.spotify.com → get client_id + secret' },
    { title: 'Create Credential Provider', detail: 'Store credentials → returns callbackUrl' },
    { title: 'Update Redirect URIs', detail: 'Add callbackUrl to Spotify app settings' },
  ],
}
```

## text-block

Explanatory text with inline markdown (**bold** and `code`).

```typescript
{
  type: 'text-block', x: 150, y: 280,
  text: "The agent's tool is wrapped with `withAccessToken`. It checks the **binding key**.",
  w: 500,                // optional width, default 500
  align: 'center',       // 'left' | 'center' | 'right', default 'center'
  onClick: 'wat-code',   // optional drilldown ID
}
```

## brace

Curly brace connector — shows containment or expansion from a parent element to child content below.

```typescript
{
  type: 'brace', x: 80, y: 404, w: 155, h: 18, color: 'mist',
}
```

Place the brace just below a node (`y = node.y + node.h + 4`). Width typically matches the parent node's width. Height controls the curve depth (14–20px works well). Pair with a card-list or numbered-list below the brace to show the contents.

## code-snippet

Inline monospace code display.

```typescript
{
  type: 'code-snippet', x: 160, y: 120,
  code: 'https://bedrock-agentcore.../oauth2/authorize?request_uri=urn:...',
  language: 'text',  // optional
}
```
