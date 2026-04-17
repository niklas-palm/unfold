import { motion } from 'framer-motion'
import type { ThemeDef, ArrowDef, ArrowEndpoint } from '../types'
import type { Rect } from '../utils/arrowRouter'
import { resolveArrows } from '../utils/arrowRouter'
import { resolveColor } from '../theme'

interface ArrowLayerProps {
  arrows: ArrowDef[]
  nodeRects: Map<string, Rect>
  theme: ThemeDef
}

const ARROW_TRANSITION = {
  duration: 0.5,
  ease: [0.25, 0.1, 0.25, 1] as const,
}

function endpointKey(ep: ArrowEndpoint): string {
  if (typeof ep === 'string') return ep
  if ('id' in ep) return `${ep.id}:${ep.side ?? '_'}@${ep.offset ?? 0.5}`
  return `px:${ep.x},${ep.y}`
}

/** Stable identity for an arrow across slides. Changing waypoint count forces a fresh element. */
function baseKey(arrow: ArrowDef, viaCount: number): string {
  return `${endpointKey(arrow.from)}->${endpointKey(arrow.to)}|v${viaCount}`
}

/**
 * Renders all arrows as a single SVG overlay.
 * Parallel arrows between the same node pair are automatically spread into lanes.
 * Endpoints animate smoothly between slides (nodes sliding take arrows with them).
 */
export function ArrowLayer({ arrows, nodeRects, theme }: ArrowLayerProps) {
  const resolved = resolveArrows(arrows, nodeRects)

  if (resolved.length === 0) return null

  // Disambiguate arrows with identical endpoint signatures so each lane gets a stable key
  const keyCounts = new Map<string, number>()
  const keys = resolved.map(({ arrow, resolved: r }) => {
    const base = baseKey(arrow, r.via?.length ?? 0)
    const n = keyCounts.get(base) ?? 0
    keyCounts.set(base, n + 1)
    return n === 0 ? base : `${base}#${n}`
  })

  return (
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
        overflow: 'visible',
      }}
    >
      <defs>
        {resolved.map(({ arrow }, i) => {
          const cs = resolveColor(theme, arrow.color)
          const color = arrow.color ? cs.text : theme.borderMedium
          return (
            <marker
              key={`head-${keys[i]}`}
              id={`arrowhead-${keys[i]}`}
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill={color} />
            </marker>
          )
        })}
      </defs>
      {resolved.map(({ arrow, resolved: r }, i) => {
        const cs = resolveColor(theme, arrow.color)
        const color = arrow.color ? cs.text : theme.borderMedium
        const key = keys[i]

        let lineEl: React.ReactNode
        if (r.via && r.via.length > 0) {
          const pts = [{ x: r.x1, y: r.y1 }, ...r.via, { x: r.x2, y: r.y2 }]
          const n = pts.length
          const ldx = pts[n - 1].x - pts[n - 2].x
          const ldy = pts[n - 1].y - pts[n - 2].y
          const llen = Math.sqrt(ldx * ldx + ldy * ldy)
          if (llen > 2) {
            pts[n - 1] = { x: pts[n - 1].x - (ldx / llen) * 2, y: pts[n - 1].y - (ldy / llen) * 2 }
          }
          const pointsStr = pts.map(p => `${p.x},${p.y}`).join(' ')
          lineEl = (
            <motion.polyline
              initial={false}
              animate={{ points: pointsStr }}
              transition={ARROW_TRANSITION}
              fill="none"
              stroke={color}
              strokeWidth={1.5}
              strokeLinejoin="round"
              strokeDasharray={arrow.dashed ? '6 4' : undefined}
              markerEnd={`url(#arrowhead-${key})`}
            />
          )
        } else {
          const dx = r.x2 - r.x1
          const dy = r.y2 - r.y1
          const len = Math.sqrt(dx * dx + dy * dy)
          const endX = len > 2 ? r.x2 - (dx / len) * 2 : r.x2
          const endY = len > 2 ? r.y2 - (dy / len) * 2 : r.y2
          lineEl = (
            <motion.line
              initial={false}
              animate={{ x1: r.x1, y1: r.y1, x2: endX, y2: endY }}
              transition={ARROW_TRANSITION}
              stroke={color}
              strokeWidth={1.5}
              strokeDasharray={arrow.dashed ? '6 4' : undefined}
              markerEnd={`url(#arrowhead-${key})`}
            />
          )
        }

        return (
          <g key={key}>
            {lineEl}
            {arrow.label && (
              <motion.text
                initial={false}
                animate={{ x: r.labelX, y: r.labelY + 3 }}
                transition={ARROW_TRANSITION}
                textAnchor="middle"
                fontSize={10}
                fontWeight={500}
                fill={arrow.color ? color : theme.textMuted}
                fontFamily={theme.fontFamily}
                stroke={theme.bgPage}
                strokeWidth={3}
                strokeLinejoin="round"
                paintOrder="stroke"
              >
                {arrow.label}
              </motion.text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
