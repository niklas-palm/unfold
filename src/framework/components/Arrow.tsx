import type { ThemeDef, ArrowDef } from '../types'
import type { Rect } from '../utils/arrowRouter'
import { resolveArrows } from '../utils/arrowRouter'
import { resolveColor } from '../theme'

interface ArrowLayerProps {
  arrows: ArrowDef[]
  nodeRects: Map<string, Rect>
  theme: ThemeDef
}

/**
 * Renders all arrows as a single SVG overlay.
 * Parallel arrows between the same node pair are automatically spread into lanes.
 */
export function ArrowLayer({ arrows, nodeRects, theme }: ArrowLayerProps) {
  const resolved = resolveArrows(arrows, nodeRects)

  if (resolved.length === 0) return null

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
              key={`head-${i}`}
              id={`arrowhead-${i}`}
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

        // Build the line element: polyline for via arrows, line for straight
        let lineEl: React.ReactNode
        if (r.via && r.via.length > 0) {
          // Polyline: build full path with shortened last segment for arrowhead
          const pts = [{ x: r.x1, y: r.y1 }, ...r.via, { x: r.x2, y: r.y2 }]
          const n = pts.length
          const ldx = pts[n - 1].x - pts[n - 2].x
          const ldy = pts[n - 1].y - pts[n - 2].y
          const llen = Math.sqrt(ldx * ldx + ldy * ldy)
          if (llen > 2) {
            pts[n - 1] = { x: pts[n - 1].x - (ldx / llen) * 2, y: pts[n - 1].y - (ldy / llen) * 2 }
          }
          lineEl = (
            <polyline
              points={pts.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke={color}
              strokeWidth={1.5}
              strokeLinejoin="round"
              strokeDasharray={arrow.dashed ? '6 4' : undefined}
              markerEnd={`url(#arrowhead-${i})`}
            />
          )
        } else {
          // Straight line: shorten slightly so arrowhead doesn't overshoot
          const dx = r.x2 - r.x1
          const dy = r.y2 - r.y1
          const len = Math.sqrt(dx * dx + dy * dy)
          const endX = len > 2 ? r.x2 - (dx / len) * 2 : r.x2
          const endY = len > 2 ? r.y2 - (dy / len) * 2 : r.y2
          lineEl = (
            <line
              x1={r.x1} y1={r.y1} x2={endX} y2={endY}
              stroke={color}
              strokeWidth={1.5}
              strokeDasharray={arrow.dashed ? '6 4' : undefined}
              markerEnd={`url(#arrowhead-${i})`}
            />
          )
        }

        return (
          <g key={i}>
            {lineEl}
            {arrow.label && (
              <text
                x={r.labelX}
                y={r.labelY + 3}
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
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

