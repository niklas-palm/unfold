import type { PresentationDef } from 'unfoldjs'
import { slides } from './slides'
import { drilldowns } from './drilldowns'

export const presentation: PresentationDef = {
  title: 'How DNS Works',
  theme: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontUrl: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap',

    // Neobrutalism surfaces — warm off-white paper
    bgPage: '#fffce8',
    bgSurface: '#ffffff',
    bgMuted: '#f5f5f0',

    // Text — near-black primary, dark grey body
    text: '#0a0a0a',
    textBody: '#3a3a3a',
    textMuted: '#555555',
    textLight: '#777777',
    textFaint: '#999999',

    // Borders — black (neobrutalism signature)
    borderLight: '#cccccc',
    borderMedium: '#000000',
    borderDefault: '#000000',

    // Saturated neobrutalism fills with black borders
    colors: {
      sage:    { bg: '#a8ff78', border: '#000000', text: '#1a4a0a' },  // lime — user/client
      stone:   { bg: '#e8f0e8', border: '#000000', text: '#2a3a2a' },  // muted green — stub resolver
      sea:     { bg: '#78c1ff', border: '#000000', text: '#0a2a4a' },  // sky blue — recursive resolver
      mist:    { bg: '#78ffd6', border: '#000000', text: '#0a4a3a' },  // mint — root servers
      sky:     { bg: '#c4b5fd', border: '#000000', text: '#2a1a4a' },  // lavender — TLD servers
      blush:   { bg: '#ff78c4', border: '#000000', text: '#4a0a2a' },  // pink — authoritative NS
      warm:    { bg: '#ffe566', border: '#000000', text: '#4a3a00' },  // yellow — caching/TTL
      sand:    { bg: '#ffe8b0', border: '#000000', text: '#4a3a10' },  // gold — DNSSEC/trust
      clay:    { bg: '#ff6b6b', border: '#000000', text: '#4a0a0a' },  // coral — security threats
      slate:   { bg: '#e8e0f0', border: '#000000', text: '#2a2040' },  // muted purple — records/data
      default: { bg: '#ffffff', border: '#000000', text: '#0a0a0a' },  // white
    },
  },
  slides,
  drilldowns,
}
