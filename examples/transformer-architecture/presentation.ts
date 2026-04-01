import type { PresentationDef } from 'unfoldjs'
import { slides } from './slides'
import { drilldowns } from './drilldowns'

export const presentation: PresentationDef = {
  title: 'How Transformers Work',
  theme: {
    // Text — green phosphor brightness steps (bright enough for small card text)
    text: '#00ff41',
    textBody: '#00dd3a',
    textMuted: '#00bb33',
    textLight: '#00aa2e',
    textFaint: '#007a1a',

    // Surfaces — near-black with warm cast
    bgPage: '#0a0a00',
    bgSurface: '#0d0d01',
    bgMuted: '#111102',

    // Borders — phosphor glow
    borderLight: '#005a15',
    borderMedium: '#009926',
    borderDefault: '#007a1a',

    // Typography — VT323 pixel terminal font
    fontFamily: "'Share Tech Mono', monospace",
    fontUrl: 'https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap',

    // Semantic colors — bold, clearly distinct on near-black
    colors: {
      sea:     { bg: '#00441a', border: '#00ff41', text: '#00ff55' },   // bright green — input/tokens
      warm:    { bg: '#442200', border: '#ffaa00', text: '#ffcc33' },   // amber — variants
      sage:    { bg: '#220044', border: '#9955dd', text: '#bb88ff' },   // purple — encoder
      blush:   { bg: '#440a0a', border: '#ff3333', text: '#ff6666' },   // red — errors
      mist:    { bg: '#002244', border: '#0099ff', text: '#33bbff' },   // blue — attention
      clay:    { bg: '#333300', border: '#aaaa00', text: '#dddd33' },   // yellow — output head
      sky:     { bg: '#003344', border: '#00bbdd', text: '#33ddff' },   // cyan — positional enc
      stone:   { bg: '#2a2a00', border: '#99aa00', text: '#bbcc33' },   // khaki — normalization
      sand:    { bg: '#3d2800', border: '#eebb33', text: '#ffcc44' },   // gold — FFN
      slate:   { bg: '#003333', border: '#00bbaa', text: '#33ddcc' },   // teal — decoder
      default: { bg: '#1a3300', border: '#00cc33', text: '#00ff41' },   // green — cards
    },
  },
  slides,
  drilldowns,
}
