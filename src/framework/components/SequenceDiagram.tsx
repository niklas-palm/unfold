import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import type { ThemeDef, SequenceDrilldown } from '../types'
import { resolveColor } from '../theme'

interface SequenceDiagramModalProps {
  drilldown: SequenceDrilldown
  theme: ThemeDef
  onClose: () => void
}

const MSG_START = 16
const MIN_ROW_H = 34
const NOTE_LINE_H = 15
const NOTE_PAD_V = 14
const NOTE_PAD_H = 24
const CHAR_W = 5.5

function computeNoteSize(text: string) {
  const lines = text.split('\n')
  const maxLen = Math.max(...lines.map(l => l.length))
  return {
    w: Math.max(120, maxLen * CHAR_W + NOTE_PAD_H),
    h: lines.length * NOTE_LINE_H + NOTE_PAD_V,
    lines,
  }
}

export function SequenceDiagramModal({ drilldown, theme, onClose }: SequenceDiagramModalProps) {
  const { actors, phases, title, subtitle } = drilldown
  const [phase, setPhase] = useState(0)
  const totalPhases = phases.length
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleKey = useCallback((e: KeyboardEvent) => {
    e.stopPropagation()
    if (e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault()
      setPhase(p => Math.min(p + 1, totalPhases - 1))
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      setPhase(p => Math.max(p - 1, 0))
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }, [onClose, totalPhases])

  useEffect(() => {
    setPhase(0)
    window.addEventListener('keydown', handleKey, true)
    return () => window.removeEventListener('keydown', handleKey, true)
  }, [handleKey])

  // Build column map
  const COL: Record<string, number> = {}
  actors.forEach((a, i) => { COL[a.id] = i })

  const COL_W = 130
  const MARGIN_LEFT = 20
  const colX = (id: string) => MARGIN_LEFT + COL[id] * COL_W + COL_W / 2

  // Flatten all messages with phase info
  const allMessages = phases.flatMap((p, pi) => p.messages.map(m => ({ ...m, phase: pi })))
  const visibleMessages = allMessages.filter(m => m.phase <= phase)

  // Compute per-message row heights and cumulative Y positions
  const { rowY, rowHeights, svgHeight } = useMemo(() => {
    const heights = allMessages.map(msg => {
      if (msg.actor && msg.text) {
        const { h } = computeNoteSize(msg.text)
        return Math.max(MIN_ROW_H, h + 10)
      }
      return MIN_ROW_H
    })

    const positions: number[] = []
    let y = MSG_START
    for (const h of heights) {
      positions.push(y)
      y += h
    }

    return { rowY: positions, rowHeights: heights, svgHeight: y + 40 }
  }, [allMessages])

  // Auto-scroll to keep the current phase visible
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const allMsgPhases = phases.flatMap((p, pi) => p.messages.map(() => pi))

    // Find first and last message index for the current phase
    let firstMsgIdx = -1
    let lastMsgIdx = -1
    for (let i = 0; i < allMsgPhases.length; i++) {
      if (allMsgPhases[i] === phase) {
        if (firstMsgIdx < 0) firstMsgIdx = i
        lastMsgIdx = i
      }
    }
    if (firstMsgIdx < 0 || lastMsgIdx < 0) return

    const firstMsgTop = rowY[firstMsgIdx] - 10
    const lastMsgBottom = rowY[lastMsgIdx] + rowHeights[lastMsgIdx] + 10

    // Scroll up if the first message of the current phase is above the visible area
    if (firstMsgTop < el.scrollTop) {
      el.scrollTo({ top: Math.max(0, firstMsgTop - 20), behavior: 'smooth' })
    }
    // Scroll down if the last message is below the visible area
    else if (lastMsgBottom > el.scrollTop + el.clientHeight) {
      const scrollTarget = lastMsgBottom - el.clientHeight + 20
      el.scrollTo({ top: Math.max(0, scrollTarget), behavior: 'smooth' })
    }
  }, [phase, phases, rowY, rowHeights])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: 'calc(90vh - 56px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', color: theme.text }}>{title}</div>
          {subtitle && <div style={{ fontSize: 13, color: theme.textLight, marginTop: 4 }}>{subtitle}</div>}
        </div>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', fontSize: 18, color: theme.textFaint,
          cursor: 'pointer', padding: '4px 8px', borderRadius: 8, lineHeight: 1,
        }}>✕</button>
      </div>

      {/* Actor headers — fixed */}
      <div style={{ display: 'flex', paddingLeft: MARGIN_LEFT, marginBottom: 6, flexShrink: 0 }}>
        {actors.map(a => {
          const c = a.color ? resolveColor(theme, a.color) : { text: theme.text }
          return (
            <div key={a.id} style={{
              width: COL_W, textAlign: 'center',
              padding: '8px 0', background: theme.bgPage,
              border: `1px solid ${theme.borderLight}`, borderRadius: 10,
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: c.text }}>{a.label}</div>
              {a.sub && <div style={{ fontSize: 10, color: theme.textLight, marginTop: 2 }}>{a.sub}</div>}
            </div>
          )
        })}
      </div>

      {/* Diagram area — scrollable */}
      <div ref={scrollRef} style={{ flex: 1, overflow: 'auto', position: 'relative', minHeight: 0 }}>
        <svg width={MARGIN_LEFT + actors.length * COL_W + 120} height={svgHeight}
             style={{ fontFamily: theme.fontFamily }}>
          {/* Lifelines */}
          {actors.map((a, i) => {
            const x = MARGIN_LEFT + i * COL_W + COL_W / 2
            return (
              <line key={a.id}
                x1={x} y1={0} x2={x} y2={svgHeight}
                stroke={theme.borderLight} strokeWidth={1} strokeDasharray="4 3"
              />
            )
          })}

          {/* Phase separators */}
          {(() => {
            let msgIdx = 0
            return phases.map((p, pi) => {
              const y = rowY[msgIdx] ?? MSG_START
              const count = p.messages.length
              msgIdx += count
              if (pi === 0) return null
              const visible = pi <= phase
              return (
                <g key={`phase-${pi}`} opacity={visible ? 0.6 : 0}>
                  <line
                    x1={MARGIN_LEFT}
                    y1={y - 8}
                    x2={MARGIN_LEFT + actors.length * COL_W}
                    y2={y - 8}
                    stroke={theme.borderLight}
                    strokeWidth={0.5}
                    strokeDasharray="2 4"
                  />
                  <text
                    x={MARGIN_LEFT + actors.length * COL_W + 6}
                    y={y - 3}
                    fontSize={9}
                    fill={theme.textFaint}
                    fontStyle="italic"
                  >
                    {p.name}
                  </text>
                </g>
              )
            })
          })()}

          {/* Messages */}
          {visibleMessages.map((msg, i) => {
            const y = rowY[i] ?? MSG_START
            const isCurrentPhase = msg.phase === phase
            const opacity = isCurrentPhase ? 1 : 0.4

            // Note (annotation on single actor)
            if (msg.actor && msg.text) {
              const x = colX(msg.actor)
              const note = computeNoteSize(msg.text)
              return (
                <g key={i} opacity={opacity}>
                  <rect
                    x={x - note.w / 2} y={y - 4} width={note.w} height={note.h}
                    rx={6} fill={theme.bgMuted} stroke={theme.borderLight} strokeWidth={0.5}
                  />
                  {note.lines.map((line, li) => (
                    <text key={li} x={x} y={y + 10 + li * NOTE_LINE_H} textAnchor="middle"
                      fontSize={10} fill={theme.textMuted} fontStyle="italic">
                      {line}
                    </text>
                  ))}
                </g>
              )
            }

            // Arrow message
            if (!msg.from || !msg.to) return null
            const x1 = colX(msg.from)
            const x2 = colX(msg.to)
            const dir = x2 > x1 ? 1 : -1
            const pad = 10
            const ax1 = x1 + dir * pad
            const ax2 = x2 - dir * pad
            const midX = (ax1 + ax2) / 2

            const senderActor = actors.find(a => a.id === msg.from)
            const senderColor = senderActor?.color ? resolveColor(theme, senderActor.color).text : theme.textLight

            const label = msg.label ?? ''
            const span = Math.abs(ax2 - ax1)
            const charW = CHAR_W
            const maxLabelW = span - 24
            const naturalW = label.length * charW + 16
            const labelW = Math.min(naturalW, maxLabelW)
            const displayLabel = labelW < naturalW
              ? label.slice(0, Math.floor((labelW - 16) / charW)) + '...'
              : label

            return (
              <g key={i} opacity={opacity}>
                <line
                  x1={ax1} y1={y + 8} x2={ax2} y2={y + 8}
                  stroke={senderColor} strokeWidth={1.5}
                  strokeDasharray={msg.dashed ? '5 3' : undefined}
                />
                <polygon
                  points={`${ax2},${y + 8} ${ax2 - dir * 7},${y + 3.5} ${ax2 - dir * 7},${y + 12.5}`}
                  fill={senderColor}
                />
                {label && (
                  <>
                    <rect
                      x={midX - labelW / 2} y={y - 6}
                      width={labelW} height={14}
                      rx={4} fill={theme.bgSurface} opacity={0.92}
                    />
                    <text x={midX} y={y + 4} textAnchor="middle"
                      fontSize={9.5} fill={senderColor} fontWeight={500}>
                      {displayLabel}
                    </text>
                  </>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Footer — phase indicator */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 14, borderTop: `1px solid ${theme.borderLight}`, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {phases.map((p, i) => (
            <button
              key={i}
              onClick={() => setPhase(i)}
              title={p.name}
              style={{
                padding: '4px 10px', fontSize: 11, fontWeight: i === phase ? 600 : 500,
                borderRadius: 8, border: 'none', cursor: 'pointer',
                background: i === phase ? theme.text : i <= phase ? theme.bgMuted : 'transparent',
                color: i === phase ? theme.bgSurface : i <= phase ? theme.textMuted : theme.textLight,
                transition: 'all 0.15s ease',
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 13, fontWeight: 500, color: theme.textMuted }}>
          {phase + 1}/{totalPhases} — {phases[phase].name}
        </div>
        <div style={{ fontSize: 11, color: theme.textLight }}>
          ← → keys
        </div>
      </div>
    </div>
  )
}
