import type { ThemeDef, SemanticColor, ColorSet } from './types'

export const MONO_FONT = "'SF Mono', Menlo, Monaco, 'Courier New', monospace"

export const defaultTheme: ThemeDef = {
  // Text hierarchy — warm stone tones
  text: '#2c2926',       // charcoal — headings, primary values
  textBody: '#5a564e',   // stone-600 — body text
  textMuted: '#7a7568',  // slate — labels, subtitles
  textLight: '#9c968b',  // muted — captions, secondary
  textFaint: '#b5b0a6',  // fog — placeholders, resting states

  // Surfaces — warm neutrals, never pure white
  bgPage: '#f7f3ec',     // parchment — outer container
  bgSurface: '#fdfbf7',  // warmWhite — primary content surface
  bgMuted: '#f0ebe1',    // warm muted — loading states, region fills

  // Borders — warm beige tones
  borderLight: '#e8dfcf',  // light — subtle dividers
  borderMedium: '#d4c4af', // medium — card borders, grid lines
  borderDefault: '#ddd5c8', // default — between light and medium

  // Typography
  fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",

  // Palette from the Scandinavian Design System
  // Every color is muted, desaturated, would look natural on linen
  colors: {
    sea:     { bg: '#edf5f8', border: '#a8cdd8', text: '#2d7d9a' },  // brand teal — most saturated
    warm:    { bg: '#f9f2ec', border: '#ddc4ad', text: '#a07850' },  // terracotta/amber
    sage:    { bg: '#eff4f0', border: '#b8ccba', text: '#5a7e5e' },  // grey-green
    blush:   { bg: '#f8f0f0', border: '#ddbfbf', text: '#a87070' },  // muted rose
    mist:    { bg: '#f0f4f7', border: '#baced8', text: '#6a8da0' },  // light steel blue
    clay:    { bg: '#f6f1ec', border: '#d6c4b4', text: '#96755e' },  // warm taupe
    sky:     { bg: '#edf5f7', border: '#acd0d8', text: '#4a90a4' },  // dusty teal
    stone:   { bg: '#f0f2f4', border: '#b8c2cc', text: '#5a6a7c' },  // medium blue-grey
    sand:    { bg: '#f9f3eb', border: '#e0c8a8', text: '#a08050' },  // light caramel
    slate:   { bg: '#eef0f2', border: '#a8b4c0', text: '#3d4f5f' },  // dark blue-grey
    default: { bg: '#fdfbf7', border: '#ddd5c8', text: '#2c2926' },  // warmWhite
  },
}

export function resolveColor(theme: ThemeDef, color?: SemanticColor): ColorSet {
  return theme.colors[color ?? 'default']
}

export function mergeTheme(override?: Partial<ThemeDef>): ThemeDef {
  if (!override) return defaultTheme
  return {
    ...defaultTheme,
    ...override,
    colors: {
      ...defaultTheme.colors,
      ...override.colors,
    },
  }
}
