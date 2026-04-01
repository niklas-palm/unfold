import type { PresentationDef } from 'unfold-ai'
import { slides } from './slides'
import { drilldowns } from './drilldowns'

export const presentation: PresentationDef = {
  title: 'How Kubernetes Works',
  theme: {
    text: '#111111',
    textBody: '#333333',
    textMuted: '#555555',
    textLight: '#777777',
    textFaint: '#999999',
    bgPage: '#ffffff',
    bgSurface: '#ffffff',
    bgMuted: '#f8f8f8',
    borderLight: '#e0e0e0',
    borderMedium: '#d0d0d0',
    borderDefault: '#e0e0e0',
    fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', 'Inter', sans-serif",
    colors: {
      sea:     { bg: '#fef2f2', border: '#e63946', text: '#c1121f' },
      warm:    { bg: '#f5f0eb', border: '#8a7968', text: '#5a4a3a' },
      sage:    { bg: '#f2f4f2', border: '#8a9a8a', text: '#4a5a4a' },
      blush:   { bg: '#f8f4f4', border: '#c0a0a0', text: '#704040' },
      mist:    { bg: '#f0f4f7', border: '#8aa0b0', text: '#4a6070' },
      clay:    { bg: '#f4f0ec', border: '#a09080', text: '#605040' },
      sky:     { bg: '#f0f4f8', border: '#7090b0', text: '#304060' },
      stone:   { bg: '#f0f2f4', border: '#8898a8', text: '#485868' },
      sand:    { bg: '#f5f2ec', border: '#b0a088', text: '#706040' },
      slate:   { bg: '#f0f0f0', border: '#555555', text: '#111111' },
      default: { bg: '#ffffff', border: '#d0d0d0', text: '#111111' },
    },
  },
  slides,
  drilldowns,
}
