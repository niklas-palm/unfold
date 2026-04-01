# Branding

How to apply your company's visual identity to an Unfold presentation.

## Theme Override

The `theme` property in `presentation.ts` overrides the default theme. Only include properties you want to change — everything else keeps its default.

```typescript
export const presentation: PresentationDef = {
  title: 'My Presentation',
  theme: {
    // Surfaces
    bgPage: '#f5f2ed',
    bgSurface: '#faf8f5',

    // Text
    text: '#2c2926',
    textBody: '#5a564e',
    textMuted: '#7a7568',

    // Typography
    fontFamily: "'Inter', sans-serif",
    fontUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',

    // Semantic colors (only override what you need)
    colors: {
      sea:  { bg: '#edf5f8', border: '#a8cdd8', text: '#2d7d9a' },
      sage: { bg: '#eff4f0', border: '#b8ccba', text: '#5a7e5e' },
    },
  },
  slides,
}
```

Colors deep-merge: only the colors you specify are overridden, the rest keep their defaults.

## Font

The default font is DM Sans, loaded from Google Fonts via `index.html`.

To use a different font, set two theme properties:

| Property | Purpose | Example |
|----------|---------|---------|
| `fontFamily` | CSS font-family string | `"'Inter', sans-serif"` |
| `fontUrl` | URL or imported font file | See below |

### Google Fonts (or any stylesheet URL)

```typescript
theme: {
  fontFamily: "'Inter', sans-serif",
  fontUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
}
```

### Self-hosted font file

Place `.woff2` files in your project's `assets/` directory and import them:

```typescript
import customFont from './assets/MyFont.woff2'

export const presentation: PresentationDef = {
  title: 'My Presentation',
  theme: {
    fontFamily: "'MyFont', sans-serif",
    fontUrl: customFont,
  },
  slides,
}
```

The framework detects font files (`.woff2`, `.woff`, `.ttf`, `.otf`) and generates `@font-face` rules automatically.

## Logo

Place your logo file in your project's `assets/` directory, then import it in `presentation.ts`:

```typescript
import logo from './assets/logo.svg'

export const presentation: PresentationDef = {
  title: 'My Presentation',
  logo,
  slides,
}
```

The logo renders as a small watermark in the top-right corner of every slide (24px height, 60% opacity).

Supported formats: SVG (recommended), PNG, JPG.

## Assets Directory

```
assets/
  logo.svg           # Company logo
  fonts/             # Self-hosted font files (optional)
```

All files in `assets/` are processed by Vite — use standard imports to reference them.

## Style Guide

Each presentation includes a `STYLE_GUIDE.md` that describes the current visual identity. When applying a new brand:

1. Create or update your presentation's `STYLE_GUIDE.md` with your company's style guide
2. Update `presentation.ts` theme to match
3. Drop brand assets (logo, fonts) into your `assets/` directory

The style guide is the contract between you and the coding agent — it reads this file to understand what colors, fonts, and assets to use when building slides.

## Theme Properties Reference

### Surfaces
| Property | Role |
|----------|------|
| `bgPage` | Outer container background |
| `bgSurface` | Primary content surface |
| `bgMuted` | Loading states, region fills |

### Text
| Property | Role |
|----------|------|
| `text` | Headings, primary values |
| `textBody` | Body text |
| `textMuted` | Labels, subtitles |
| `textLight` | Captions, secondary |
| `textFaint` | Placeholders, resting states |

### Borders
| Property | Role |
|----------|------|
| `borderLight` | Subtle dividers |
| `borderMedium` | Card borders, grid lines |
| `borderDefault` | Standard borders |

### Typography
| Property | Role |
|----------|------|
| `fontFamily` | CSS font-family string |
| `fontUrl` | URL to load the font (optional) |

### Semantic Colors
10 named colors, each with `{ bg, border, text }`:
`sea`, `warm`, `sage`, `blush`, `mist`, `clay`, `sky`, `stone`, `sand`, `slate`
