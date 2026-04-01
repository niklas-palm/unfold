import type { ArrowDef, ArrowEndpoint, AnchorPoint, PixelPoint, NodeDef, Side } from '../types'

export interface Rect {
  x: number; y: number; w: number; h: number
}

export interface ResolvedArrow {
  x1: number; y1: number
  x2: number; y2: number
  via?: { x: number; y: number }[]
  labelX: number; labelY: number
}

const PAD = 8

// --- Endpoint type guards ---

function isPixelPoint(ep: ArrowEndpoint): ep is PixelPoint {
  return typeof ep === 'object' && 'x' in ep && 'y' in ep && !('id' in ep)
}

function isAnchorPoint(ep: ArrowEndpoint): ep is AnchorPoint {
  return typeof ep === 'object' && 'id' in ep
}

function isNodeId(ep: ArrowEndpoint): ep is string {
  return typeof ep === 'string'
}

// --- Explicit side placement (used when side hint is specified) ---

function pointOnEdge(rect: Rect, side: Side, offset: number): { x: number; y: number } {
  switch (side) {
    case 'top':    return { x: rect.x + rect.w * offset, y: rect.y - PAD }
    case 'bottom': return { x: rect.x + rect.w * offset, y: rect.y + rect.h + PAD }
    case 'left':   return { x: rect.x - PAD,              y: rect.y + rect.h * offset }
    case 'right':  return { x: rect.x + rect.w + PAD,     y: rect.y + rect.h * offset }
  }
}

// --- Angle-snapping auto-router ---

// Snap angles: horizontal/vertical get a wide attraction zone,
// then 30° increments fill in the rest for clean diagonals.
const SNAP_ANGLES = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330]
const HV_BIAS = 25 // degrees — if within 25° of horizontal/vertical, snap to it

function snapAngle(deg: number): number {
  const norm = ((deg % 360) + 360) % 360

  // Strong preference for horizontal (0°/180°) and vertical (90°/270°)
  for (const hv of [0, 90, 180, 270]) {
    const diff = Math.abs(norm - hv)
    if (diff <= HV_BIAS || diff >= 360 - HV_BIAS) return hv
  }

  // Snap to nearest clean angle
  let best = 0, bestDist = 360
  for (const a of SNAP_ANGLES) {
    const diff = Math.min(Math.abs(norm - a), 360 - Math.abs(norm - a))
    if (diff < bestDist) { bestDist = diff; best = a }
  }
  return best
}

/**
 * Cast a ray from the center of a rectangle at `angleDeg` and return
 * the point where it exits the perimeter, plus PAD pixels outward.
 */
function rayExit(
  cx: number, cy: number, hw: number, hh: number, angleDeg: number,
): { x: number; y: number } {
  const rad = angleDeg * Math.PI / 180
  const dx = Math.cos(rad)
  const dy = Math.sin(rad)

  // Find smallest positive t where ray hits a rectangle edge
  let t = Infinity

  if (Math.abs(dx) > 1e-9) {
    const tx = (dx > 0 ? hw : -hw) / dx
    if (tx > 0 && Math.abs(dy * tx) <= hh + 0.01) t = Math.min(t, tx)
  }
  if (Math.abs(dy) > 1e-9) {
    const ty = (dy > 0 ? hh : -hh) / dy
    if (ty > 0 && Math.abs(dx * ty) <= hw + 0.01) t = Math.min(t, ty)
  }

  if (!isFinite(t)) t = 0

  return {
    x: cx + dx * (t + PAD),
    y: cy + dy * (t + PAD),
  }
}

function rectCenter(rect: Rect): { x: number; y: number } {
  return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 }
}

/**
 * Resolve a single endpoint to a pixel coordinate.
 *
 * For auto-routed endpoints (no explicit side), uses the snapped angle
 * from center-to-center to cast a ray from this node's perimeter.
 */
function resolveEndpoint(
  ep: ArrowEndpoint,
  nodeRects: Map<string, Rect>,
  otherPoint: { x: number; y: number } | null,
  isFrom: boolean,
): { x: number; y: number } | null {
  // Absolute pixel coordinate — use directly
  if (isPixelPoint(ep)) {
    return { x: ep.x, y: ep.y }
  }

  // Node ID string — resolve with auto-routing
  const anchor: AnchorPoint = isNodeId(ep) ? { id: ep } : ep
  const rect = nodeRects.get(anchor.id)
  if (!rect) return null

  // If side is specified, use the explicit edge placement
  if (anchor.side) {
    return pointOnEdge(rect, anchor.side, anchor.offset ?? 0.5)
  }

  // Auto-route: cast a ray toward the other point at a snapped angle
  if (!otherPoint) {
    return pointOnEdge(rect, 'right', 0.5)
  }

  const center = rectCenter(rect)
  // Angle from this node's center toward the other point
  const towardOther = Math.atan2(otherPoint.y - center.y, otherPoint.x - center.x) * 180 / Math.PI
  const snapped = snapAngle(towardOther)

  return rayExit(center.x, center.y, rect.w / 2, rect.h / 2, snapped)
}

/**
 * Get the "center" of an endpoint for auto-routing decisions.
 */
function endpointCenter(ep: ArrowEndpoint, nodeRects: Map<string, Rect>): { x: number; y: number } | null {
  if (isPixelPoint(ep)) return { x: ep.x, y: ep.y }
  const id = isNodeId(ep) ? ep : ep.id
  const rect = nodeRects.get(id)
  if (!rect) return null
  return rectCenter(rect)
}

/**
 * Build a rect map directly from node definitions.
 */
export function buildNodeRects(nodes: NodeDef[]): Map<string, Rect> {
  const map = new Map<string, Rect>()
  for (const node of nodes) {
    map.set(node.id, {
      x: node.x,
      y: node.y,
      w: node.w ?? 130,
      h: node.h ?? 65,
    })
  }
  return map
}

/**
 * Compute the midpoint along a multi-segment path, plus the direction
 * of the segment containing the midpoint (used for label offset).
 */
function pathMidpoint(
  points: { x: number; y: number }[],
): { midX: number; midY: number; segDx: number; segDy: number } {
  let totalLen = 0
  const segLens: number[] = []
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x
    const dy = points[i].y - points[i - 1].y
    segLens.push(Math.sqrt(dx * dx + dy * dy))
    totalLen += segLens[segLens.length - 1]
  }
  let target = totalLen / 2
  for (let i = 0; i < segLens.length; i++) {
    if (target <= segLens[i] && segLens[i] > 0) {
      const t = target / segLens[i]
      return {
        midX: points[i].x + (points[i + 1].x - points[i].x) * t,
        midY: points[i].y + (points[i + 1].y - points[i].y) * t,
        segDx: points[i + 1].x - points[i].x,
        segDy: points[i + 1].y - points[i].y,
      }
    }
    target -= segLens[i]
  }
  const last = points.length - 1
  return {
    midX: points[last].x,
    midY: points[last].y,
    segDx: last > 0 ? points[last].x - points[last - 1].x : 0,
    segDy: last > 0 ? points[last].y - points[last - 1].y : 0,
  }
}

/**
 * Resolve a single arrow to pixel coordinates.
 * `laneOffset` shifts the arrow perpendicular to its direction (for parallel arrows).
 */
export function resolveArrow(
  arrow: ArrowDef,
  nodeRects: Map<string, Rect>,
  laneOffset = 0,
): ResolvedArrow | null {
  // Prevent self-referencing node arrows
  const fromId = isNodeId(arrow.from) ? arrow.from : isAnchorPoint(arrow.from) ? arrow.from.id : null
  const toId = isNodeId(arrow.to) ? arrow.to : isAnchorPoint(arrow.to) ? arrow.to.id : null
  if (fromId && toId && fromId === toId) return null

  // --- Via arrows: polyline through waypoints ---
  // Endpoints resolve toward the nearest waypoint (not the other endpoint),
  // so auto-routing naturally picks the correct exit side.
  if (arrow.via && arrow.via.length > 0) {
    const viaPoints = arrow.via
    const p1 = resolveEndpoint(arrow.from, nodeRects, viaPoints[0], true)
    const p2 = resolveEndpoint(arrow.to, nodeRects, viaPoints[viaPoints.length - 1], false)
    if (!p1 || !p2) return null

    const fullPath = [p1, ...viaPoints, p2]
    const { midX, midY, segDx, segDy } = pathMidpoint(fullPath)

    const segLen = Math.sqrt(segDx * segDx + segDy * segDy)
    let labelX = midX
    let labelY = midY - 14
    if (segLen > 0) {
      const px = -segDy / segLen
      const py = segDx / segLen
      const sign = py <= 0 ? 1 : -1
      labelX = midX + px * 14 * sign
      labelY = midY + py * 14 * sign
    }

    if (arrow.labelOffset) {
      labelX += arrow.labelOffset.dx ?? 0
      labelY += arrow.labelOffset.dy ?? 0
    }

    return {
      x1: p1.x, y1: p1.y,
      x2: p2.x, y2: p2.y,
      via: viaPoints.map(p => ({ x: p.x, y: p.y })),
      labelX, labelY,
    }
  }

  // --- Standard straight-line arrow ---

  // Get centers for auto-routing decisions
  const fromCenter = endpointCenter(arrow.from, nodeRects)
  const toCenter = endpointCenter(arrow.to, nodeRects)

  // Resolve endpoints
  const p1 = resolveEndpoint(arrow.from, nodeRects, toCenter, true)
  const p2 = resolveEndpoint(arrow.to, nodeRects, fromCenter, false)

  if (!p1 || !p2) return null

  // When both endpoints are auto-routed and nearly H/V aligned,
  // force perfect alignment so arrows are crisp vertical/horizontal lines.
  // This handles the case where two nodes have slightly different centers.
  const isFromAuto = isNodeId(arrow.from) || (isAnchorPoint(arrow.from) && !arrow.from.side)
  const isToAuto = isNodeId(arrow.to) || (isAnchorPoint(arrow.to) && !arrow.to.side)
  if (isFromAuto && isToAuto) {
    const absDx = Math.abs(p2.x - p1.x)
    const absDy = Math.abs(p2.y - p1.y)
    if (absDy > 10 && absDx < absDy * 0.2) {
      const avgX = (p1.x + p2.x) / 2
      p1.x = avgX
      p2.x = avgX
    }
    if (absDx > 10 && absDy < absDx * 0.2) {
      const avgY = (p1.y + p2.y) / 2
      p1.y = avgY
      p2.y = avgY
    }
  }

  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  const len = Math.sqrt(dx * dx + dy * dy)

  // Apply lane offset perpendicular to arrow direction
  if (laneOffset !== 0 && len > 0) {
    const px = -dy / len
    const py = dx / len
    p1.x += px * laneOffset
    p1.y += py * laneOffset
    p2.x += px * laneOffset
    p2.y += py * laneOffset
  }

  // Label at midpoint, offset perpendicular to arrow direction
  const midX = (p1.x + p2.x) / 2
  const midY = (p1.y + p2.y) / 2

  // Offset label perpendicular to arrow, always "above" (toward top-left)
  let labelX = midX
  let labelY = midY - 14
  if (len > 0) {
    const px = -dy / len
    const py = dx / len
    const sign = py <= 0 ? 1 : -1
    labelX = midX + px * 14 * sign
    labelY = midY + py * 14 * sign
  }

  // Apply manual label offset if specified
  if (arrow.labelOffset) {
    labelX += arrow.labelOffset.dx ?? 0
    labelY += arrow.labelOffset.dy ?? 0
  }

  return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, labelX, labelY }
}

const LANE_SPACING = 12  // pixels between overlapping arrows
const OVERLAP_ANGLE = 15 // degrees — arrows within this angle are "parallel"
const OVERLAP_DIST = 15  // pixels — max perpendicular distance to count as overlapping

/**
 * Resolve all arrows with two automatic corrections:
 * 1. Angle-snapped routing (per-arrow, in resolveArrow)
 * 2. Overlap spreading — any arrows on nearly the same path get spread into lanes
 *    (handles A↔B, A→B + A→C through B, or any coincidental overlaps)
 */
export function resolveArrows(
  arrows: ArrowDef[],
  nodeRects: Map<string, Rect>,
): { arrow: ArrowDef; resolved: ResolvedArrow }[] {
  // Resolve all arrows first
  const items: { arrow: ArrowDef; r: ResolvedArrow; idx: number }[] = []
  arrows.forEach((arrow, i) => {
    const r = resolveArrow(arrow, nodeRects)
    if (r) items.push({ arrow, r, idx: i })
  })

  // Detect overlapping arrows and group them
  // Two arrows overlap if they're nearly parallel AND their midpoints are close perpendicularly
  const assigned = new Set<number>()
  const groups: number[][] = [] // groups of indices into `items`

  for (let i = 0; i < items.length; i++) {
    if (assigned.has(i)) continue
    // Via arrows control their own routing — skip overlap detection
    if (items[i].r.via) { assigned.add(i); continue }
    const group = [i]
    assigned.add(i)
    const ai = items[i].r
    const aAngle = Math.atan2(ai.y2 - ai.y1, ai.x2 - ai.x1)
    const aLen = Math.sqrt((ai.x2 - ai.x1) ** 2 + (ai.y2 - ai.y1) ** 2)
    if (aLen < 1) continue

    for (let j = i + 1; j < items.length; j++) {
      if (assigned.has(j)) continue
      const bj = items[j].r
      const bAngle = Math.atan2(bj.y2 - bj.y1, bj.x2 - bj.x1)

      // Check if nearly parallel (or anti-parallel)
      let angleDiff = Math.abs(aAngle - bAngle)
      if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff
      if (angleDiff > Math.PI / 2) angleDiff = Math.PI - angleDiff
      const threshRad = OVERLAP_ANGLE * Math.PI / 180
      if (angleDiff > threshRad) continue

      // Check perpendicular distance between midpoints
      const px = -Math.sin(aAngle)
      const py = Math.cos(aAngle)
      const amx = (ai.x1 + ai.x2) / 2, amy = (ai.y1 + ai.y2) / 2
      const bmx = (bj.x1 + bj.x2) / 2, bmy = (bj.y1 + bj.y2) / 2
      const perpDist = Math.abs((bmx - amx) * px + (bmy - amy) * py)
      if (perpDist > OVERLAP_DIST) continue

      // Check that their spans actually overlap along the arrow direction
      // (two parallel arrows far apart along their length shouldn't be grouped)
      const dx = Math.cos(aAngle), dy = Math.sin(aAngle)
      const aStart = Math.min(ai.x1 * dx + ai.y1 * dy, ai.x2 * dx + ai.y2 * dy)
      const aEnd = Math.max(ai.x1 * dx + ai.y1 * dy, ai.x2 * dx + ai.y2 * dy)
      const bStart = Math.min(bj.x1 * dx + bj.y1 * dy, bj.x2 * dx + bj.y2 * dy)
      const bEnd = Math.max(bj.x1 * dx + bj.y1 * dy, bj.x2 * dx + bj.y2 * dy)
      if (aEnd < bStart || bEnd < aStart) continue // no overlap along length

      group.push(j)
      assigned.add(j)
    }

    if (group.length > 1) groups.push(group)
  }

  // Apply lane offsets to each overlap group
  for (const group of groups) {
    const n = group.length
    for (let j = 0; j < n; j++) {
      const offset = (j - (n - 1) / 2) * LANE_SPACING
      if (offset === 0) continue

      const r = items[group[j]].r
      const dx = r.x2 - r.x1
      const dy = r.y2 - r.y1
      const len = Math.sqrt(dx * dx + dy * dy)
      if (len < 1) continue

      const px = -dy / len
      const py = dx / len
      r.x1 += px * offset
      r.y1 += py * offset
      r.x2 += px * offset
      r.y2 += py * offset
      r.labelX += px * offset
      r.labelY += py * offset
    }
  }

  return items.map(({ arrow, r }) => ({ arrow, resolved: r }))
}
