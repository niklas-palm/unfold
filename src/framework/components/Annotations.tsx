import type { ThemeDef, AnnotationDef, SemanticColor } from '../types'
import { resolveColor, MONO_FONT } from '../theme'
import { parseInlineMarkdown } from '../utils/markdown'
import { Highlight, themes } from 'prism-react-renderer'

interface AnnotationProps {
  annotation: AnnotationDef
  theme: ThemeDef
  onDrilldown?: (id: string) => void
}

export function Annotation({ annotation, theme, onDrilldown }: AnnotationProps) {
  switch (annotation.type) {
    case 'pill-group':    return <PillGroup a={annotation} theme={theme} />
    case 'chip-list':     return <ChipList a={annotation} theme={theme} />
    case 'status':        return <Status a={annotation} theme={theme} />
    case 'url-box':       return <UrlBox a={annotation} theme={theme} />
    case 'tool-box':      return <ToolBox a={annotation} theme={theme} />
    case 'popup-box':     return <PopupBox a={annotation} theme={theme} />
    case 'card-list':     return <CardList a={annotation} theme={theme} onDrilldown={onDrilldown} />
    case 'numbered-list': return <NumberedList a={annotation} theme={theme} />
    case 'text-block':    return <TextBlock a={annotation} theme={theme} onDrilldown={onDrilldown} />
    case 'code-snippet':  return <CodeSnippet a={annotation} theme={theme} />
    case 'brace':         return <Brace a={annotation} theme={theme} />
  }
}

// --- Helpers ---

function cs(theme: ThemeDef, color?: SemanticColor) {
  return resolveColor(theme, color)
}

// --- Pill Group ---

function PillGroup({ a, theme }: { a: Extract<AnnotationDef, { type: 'pill-group' }>; theme: ThemeDef }) {
  return (
    <div style={{ position: 'absolute', left: a.x, top: a.y }}>
      {a.footnote && (
        <div style={{ fontSize: 10, color: theme.textLight, marginBottom: 6 }}>{a.footnote}</div>
      )}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {a.pills.map((pill, i) => {
          const c = cs(theme, pill.color)
          return (
            <span key={i}>
              {i > 0 && a.joinWith && (
                <span style={{ color: theme.textFaint, fontSize: 14, marginRight: 8 }}>{a.joinWith}</span>
              )}
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '5px 12px', borderRadius: 20,
                border: `1.5px solid ${pill.color ? c.border : theme.borderDefault}`,
                background: pill.color ? c.bg : theme.bgSurface,
                fontSize: 10, fontWeight: pill.bold ? 600 : 500, color: theme.textMuted,
              }}>
                {pill.icon && <span style={{ fontSize: 11 }}>{pill.icon}</span>}
                {pill.text}
              </span>
            </span>
          )
        })}
      </div>
    </div>
  )
}

// --- Chip List ---

function ChipList({ a, theme }: { a: Extract<AnnotationDef, { type: 'chip-list' }>; theme: ThemeDef }) {
  const c = cs(theme, a.color)
  return (
    <div style={{ position: 'absolute', left: a.x, top: a.y, display: 'flex', gap: 6 }}>
      {a.chips.map((chip, i) => (
        <span key={i} style={{
          fontSize: 8, padding: '2px 7px',
          background: c.bg, borderRadius: 10,
          color: c.text, fontWeight: 500,
        }}>
          {chip}
        </span>
      ))}
    </div>
  )
}

// --- Status ---

function Status({ a, theme }: { a: Extract<AnnotationDef, { type: 'status' }>; theme: ThemeDef }) {
  const color = a.variant === 'error' ? 'blush' : 'sage'
  const c = cs(theme, color)
  return (
    <div style={{ position: 'absolute', left: a.x, top: a.y }}>
      <div style={{
        padding: '6px 14px', background: c.bg,
        border: `1.5px solid ${c.border}`, borderRadius: 8, textAlign: 'center',
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: c.text }}>{a.title}</div>
        {a.detail && <div style={{ fontSize: 9, color: theme.textLight, marginTop: 2 }}>{a.detail}</div>}
      </div>
    </div>
  )
}

// --- URL Box ---

function UrlBox({ a, theme }: { a: Extract<AnnotationDef, { type: 'url-box' }>; theme: ThemeDef }) {
  const c = cs(theme, a.color)
  return (
    <div style={{ position: 'absolute', left: a.x, top: a.y }}>
      <div style={{
        padding: '8px 12px', background: theme.bgSurface,
        border: `1.5px solid ${c.border}`, borderRadius: 8,
      }}>
        {a.title && (
          <div style={{ fontSize: 9, fontWeight: 600, color: c.text, marginBottom: 3 }}>{a.title}</div>
        )}
        {a.urls.map((url, i) => (
          <div key={i} style={{ fontSize: 8, color: theme.textMuted, fontFamily: MONO_FONT, lineHeight: 1.5 }}>
            {url}
          </div>
        ))}
      </div>
    </div>
  )
}

// --- Tool Box ---

function ToolBox({ a, theme }: { a: Extract<AnnotationDef, { type: 'tool-box' }>; theme: ThemeDef }) {
  return (
    <div style={{ position: 'absolute', left: a.x, top: a.y }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '5px 12px', borderRadius: 8,
        border: `1.5px solid ${theme.borderMedium}`,
        background: theme.bgSurface, fontSize: 11,
      }}>
        {a.icon && <span style={{ color: theme.text }}>{a.icon}</span>}
        <span style={{ fontWeight: 600, color: theme.text }}>{a.name}</span>
      </div>
      {a.detail && (
        <div style={{ fontSize: 9, color: theme.textLight, marginTop: 4, textAlign: 'center' }}>
          {a.detail}
        </div>
      )}
    </div>
  )
}

// --- Popup Box ---

function PopupBox({ a, theme }: { a: Extract<AnnotationDef, { type: 'popup-box' }>; theme: ThemeDef }) {
  return (
    <div style={{ position: 'absolute', left: a.x, top: a.y }}>
      <div style={{
        width: a.w ?? 180, padding: '16px 14px',
        background: theme.bgSurface,
        border: `1.5px solid ${theme.borderMedium}`,
        borderRadius: 16, textAlign: 'left',
      }}>
        <div style={{ fontSize: 9, fontWeight: 600, color: theme.textBody }}>{a.title}</div>
        {a.detail && (
          <div style={{ fontSize: 8, color: theme.textLight, marginTop: 4 }}>{a.detail}</div>
        )}
      </div>
    </div>
  )
}

// --- Card List ---

function CardList({ a, theme, onDrilldown }: {
  a: Extract<AnnotationDef, { type: 'card-list' }>
  theme: ThemeDef
  onDrilldown?: (id: string) => void
}) {
  return (
    <div style={{
      position: 'absolute', left: a.x, top: a.y,
      display: 'flex', gap: 10,
      flexDirection: a.direction === 'column' ? 'column' : 'row',
    }}>
      {a.cards.map((card, i) => {
        const c = cs(theme, card.borderColor)
        const isClickable = !!(card.onClick && onDrilldown)
        return (
          <div key={i}
            onClick={isClickable ? () => onDrilldown!(card.onClick!) : undefined}
            style={{
              padding: '8px 14px', background: theme.bgSurface,
              border: `1px solid ${card.borderColor ? c.border : theme.borderDefault}`,
              borderRadius: 12,
              cursor: isClickable ? 'pointer' : undefined,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: theme.text }}>{card.label}</span>
              {isClickable && <span style={{ fontSize: 9, color: theme.textFaint }}>↗</span>}
            </div>
            <div style={{ fontSize: 9, color: theme.textLight }}>{card.detail}</div>
          </div>
        )
      })}
    </div>
  )
}

// --- Numbered List ---

function NumberedList({ a, theme }: { a: Extract<AnnotationDef, { type: 'numbered-list' }>; theme: ThemeDef }) {
  const c = cs(theme, a.color)
  return (
    <div style={{
      position: 'absolute', left: a.x, top: a.y,
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      {a.items.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: c.text, minWidth: 14 }}>{i + 1}.</span>
          <div>
            <span style={{ fontSize: 10, fontWeight: 600, color: theme.text }}>{item.title}</span>
            {item.detail && (
              <span style={{ fontSize: 9, color: theme.textLight, marginLeft: 6 }}>{item.detail}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// --- Text Block ---

function TextBlock({ a, theme, onDrilldown }: {
  a: Extract<AnnotationDef, { type: 'text-block' }>
  theme: ThemeDef
  onDrilldown?: (id: string) => void
}) {
  const isClickable = !!(a.onClick && onDrilldown)
  return (
    <div
      style={{
        position: 'absolute', left: a.x, top: a.y,
        width: a.w ?? 500,
        fontSize: 11, color: isClickable ? theme.colors.sea.text : theme.textMuted,
        lineHeight: 1.7,
        textAlign: a.align ?? 'center',
        whiteSpace: 'pre-wrap',
        cursor: isClickable ? 'pointer' : undefined,
        ...(isClickable ? {
          padding: '6px 14px',
          background: theme.colors.sea.bg,
          border: `1px solid ${theme.colors.sea.border}`,
          borderRadius: 10,
          fontWeight: 500,
          fontSize: 10,
        } : {}),
      }}
      onClick={isClickable ? () => onDrilldown!(a.onClick!) : undefined}
    >
      {parseInlineMarkdown(a.text)}
      {isClickable && <span style={{ marginLeft: 6, color: theme.textMuted }}>↗</span>}
    </div>
  )
}

// --- Code Snippet ---

function CodeSnippet({ a, theme }: { a: Extract<AnnotationDef, { type: 'code-snippet' }>; theme: ThemeDef }) {
  return (
    <div style={{ position: 'absolute', left: a.x, top: a.y, width: a.w }}>
      <Highlight theme={themes.nightOwlLight} code={a.code} language={a.language ?? 'text'}>
        {({ tokens, getLineProps, getTokenProps }) => (
          <pre style={{
            margin: 0, background: 'transparent',
            fontSize: 8, fontFamily: MONO_FONT,
            lineHeight: 1.5, textAlign: 'left',
          }}>
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  )
}

// --- Brace ---

function Brace({ a, theme }: { a: Extract<AnnotationDef, { type: 'brace' }>; theme: ThemeDef }) {
  const c = cs(theme, a.color)
  const { w, h } = a
  const mx = w / 2
  const d = [
    `M 0 0`,
    `C ${w * 0.15} 0, ${mx - w * 0.15} ${h}, ${mx} ${h}`,
    `C ${mx + w * 0.15} ${h}, ${w - w * 0.15} 0, ${w} 0`,
  ].join(' ')

  return (
    <div style={{ position: 'absolute', left: a.x, top: a.y, pointerEvents: 'none' }}>
      <svg width={w} height={h + 2} style={{ overflow: 'visible' }}>
        <path d={d} fill="none" stroke={a.color ? c.border : theme.borderMedium} strokeWidth={1.5} />
      </svg>
    </div>
  )
}
