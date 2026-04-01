import { createElement } from 'react'
import type { ReactNode } from 'react'
import { MONO_FONT } from '../theme'

/**
 * Minimal inline markdown: **bold** and `code`
 * Returns an array of React nodes.
 */
export function parseInlineMarkdown(text: string, codeBg = '#f5f5f5'): ReactNode[] {
  const parts: ReactNode[] = []
  const regex = /(\*\*(.+?)\*\*|`(.+?)`)/g
  let last = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index))
    }
    if (match[2]) {
      parts.push(createElement('strong', { key: match.index }, match[2]))
    } else if (match[3]) {
      parts.push(createElement('code', {
        key: match.index,
        style: {
          fontSize: '0.9em',
          background: codeBg,
          padding: '1px 4px',
          borderRadius: 3,
          fontFamily: MONO_FONT,
        },
      }, match[3]))
    }
    last = match.index + match[0].length
  }

  if (last < text.length) {
    parts.push(text.slice(last))
  }

  return parts
}
