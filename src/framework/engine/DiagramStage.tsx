import { useMemo, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { ThemeDef, DiagramSlide, RegionDef } from '../types'
import { Node } from '../components/Node'
import { ArrowLayer } from '../components/Arrow'
import { Region } from '../components/Region'
import { Annotation } from '../components/Annotations'
import { buildNodeRects } from '../utils/arrowRouter'

interface DiagramStageProps {
  slide: DiagramSlide
  theme: ThemeDef
  onDrilldown: (id: string) => void
}

type ResolvedRegion = RegionDef & { x: number; y: number; w: number; h: number }

/**
 * Resolve regions to concrete x/y/w/h.
 * - `contains` regions auto-size from their nodes' bounding box
 * - `group` regions align to share the same x and width (stacked card layout)
 */
function resolveRegions(regions: RegionDef[], nodes: DiagramSlide['nodes']): ResolvedRegion[] {
  // Pass 1: resolve each region's bounds
  const resolved: ResolvedRegion[] = regions.map(region => {
    if (!region.contains || region.contains.length === 0) {
      return region as ResolvedRegion
    }

    const pad = region.padding ?? 28
    const labelH = region.label ? 24 : 0 // extra space for the label at top
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

    for (const nodeId of region.contains) {
      const node = nodes.find(n => n.id === nodeId)
      if (!node) continue
      minX = Math.min(minX, node.x)
      minY = Math.min(minY, node.y)
      maxX = Math.max(maxX, node.x + (node.w ?? 130))
      maxY = Math.max(maxY, node.y + (node.h ?? 65))
    }

    if (!isFinite(minX)) return region as ResolvedRegion

    return {
      ...region,
      x: region.x ?? minX - pad,
      y: region.y ?? minY - pad - labelH,
      w: region.w ?? maxX - minX + pad * 2,
      h: region.h ?? maxY - minY + pad * 2 + labelH,
    }
  })

  // Pass 2: align grouped regions to share x and width
  const groups = new Map<string, number[]>()
  resolved.forEach((r, i) => {
    if (r.group) {
      const list = groups.get(r.group) ?? []
      list.push(i)
      groups.set(r.group, list)
    }
  })

  const GROUP_GAP = 12 // vertical gap between stacked grouped regions

  for (const indices of groups.values()) {
    if (indices.length < 2) continue

    // Find the union x range across all regions in the group
    let minX = Infinity, maxRight = -Infinity
    for (const i of indices) {
      minX = Math.min(minX, resolved[i].x)
      maxRight = Math.max(maxRight, resolved[i].x + resolved[i].w)
    }

    // Apply shared x and width
    for (const i of indices) {
      resolved[i].x = minX
      resolved[i].w = maxRight - minX
    }

    // Sort by y position and ensure minimum gap between stacked regions
    const sorted = [...indices].sort((a, b) => resolved[a].y - resolved[b].y)
    for (let j = 1; j < sorted.length; j++) {
      const prev = resolved[sorted[j - 1]]
      const curr = resolved[sorted[j]]
      const prevBottom = prev.y + prev.h
      const gap = curr.y - prevBottom
      if (gap < GROUP_GAP) {
        curr.y = prevBottom + GROUP_GAP
      }
    }
  }

  return resolved
}

export function DiagramStage({ slide, theme, onDrilldown }: DiagramStageProps) {
  // Arrow routing uses original node positions (not focus-overridden)
  const nodeRects = useMemo(
    () => buildNodeRects(slide.nodes),
    [slide.nodes],
  )

  const resolvedRegions = useMemo(
    () => resolveRegions(slide.regions ?? [], slide.nodes),
    [slide.regions, slide.nodes],
  )

  const hasFocus = !!slide.focus

  // Zoom: track previous origin so zoom-out animates from the correct point
  const lastZoomRef = useRef<{ x: number; y: number } | null>(null)
  if (slide.zoom) {
    lastZoomRef.current = { x: slide.zoom.x, y: slide.zoom.y }
  }

  const zoomScale = slide.zoom?.scale ?? 1
  const origin = slide.zoom
    ? { x: slide.zoom.x, y: slide.zoom.y }
    : lastZoomRef.current
  const zoomOrigin = origin ? `${origin.x}px ${origin.y}px` : '450px 280px'

  return (
    <div style={{ position: 'relative', width: 900, height: 560, overflow: 'hidden' }}>
        <motion.div
          animate={{ scale: zoomScale }}
          transition={{ duration: slide.zoom ? 0.8 : 0.5, ease: 'easeInOut' }}
          style={{ position: 'absolute', inset: 0, transformOrigin: zoomOrigin }}
        >
          {/* Regions (background layer) */}
          <AnimatePresence>
            {resolvedRegions.map(region => (
              <Region key={region.id} region={region} theme={theme} />
            ))}
          </AnimatePresence>

          {/* Nodes — override position/size for focused node */}
          <AnimatePresence>
            {slide.nodes.map(node => {
              const isFocused = hasFocus && node.id === slide.focus!.nodeId
              const effectiveNode = isFocused ? {
                ...node,
                x: slide.focus!.x ?? node.x,
                y: slide.focus!.y ?? node.y,
                w: slide.focus!.w,
                h: slide.focus!.h,
              } : node

              return (
                <Node
                  key={node.id}
                  node={effectiveNode}
                  theme={theme}
                  onDrilldown={onDrilldown}
                  dimmed={hasFocus && !isFocused}
                  focusData={isFocused ? slide.focus : undefined}
                />
              )
            })}
          </AnimatePresence>

          {/* Focus dimming overlay — sits between regular nodes (z:2) and focused node (z:20) */}
          <AnimatePresence>
            {hasFocus && (
              <motion.div
                key="focus-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  position: 'absolute', inset: 0, zIndex: 10,
                  background: `${theme.bgPage}bb`,
                }}
              />
            )}
          </AnimatePresence>

          {/* Arrow SVG overlay */}
          <ArrowLayer
            arrows={slide.arrows ?? []}
            nodeRects={nodeRects}
            theme={theme}
          />

          {/* Annotations */}
          {(slide.annotations ?? []).map((annotation, i) => (
            <Annotation key={i} annotation={annotation} theme={theme} onDrilldown={onDrilldown} />
          ))}
        </motion.div>
    </div>
  )
}
