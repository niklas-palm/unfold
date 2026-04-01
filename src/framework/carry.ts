import type { DiagramSlide, NodeDef, ArrowDef, RegionDef, AnnotationDef, FocusDef } from './types'

interface CarryOverrides {
  heading?: string
  subheading?: string
  nodes?: NodeDef[]
  removeNodes?: string[]
  arrows?: ArrowDef[]
  regions?: RegionDef[]
  annotations?: AnnotationDef[]
  zoom?: { x: number; y: number; scale: number } | null
  focus?: FocusDef | null
  notes?: string
  presenterNotes?: string
}

/**
 * Build a new diagram slide by merging overrides onto a previous slide.
 *
 * - `nodes`: merged by ID — matching IDs are shallow-merged, new IDs are appended
 * - `removeNodes`: IDs to remove from the carried nodes
 * - `arrows`, `regions`, `annotations`: replaced wholesale (not merged)
 * - `heading`, `subheading`, `notes`: replaced if provided
 */
export function carry(prev: DiagramSlide, overrides: CarryOverrides): DiagramSlide {
  // Start with previous nodes
  let nodes = [...prev.nodes]

  // Remove nodes by ID
  if (overrides.removeNodes) {
    const removeSet = new Set(overrides.removeNodes)
    nodes = nodes.filter(n => !removeSet.has(n.id))
  }

  // Merge/add node overrides by ID
  if (overrides.nodes) {
    for (const override of overrides.nodes) {
      const idx = nodes.findIndex(n => n.id === override.id)
      if (idx >= 0) {
        nodes[idx] = { ...nodes[idx], ...override }
      } else {
        nodes.push(override)
      }
    }
  }

  return {
    type: 'diagram',
    heading: overrides.heading ?? prev.heading,
    subheading: overrides.subheading !== undefined ? overrides.subheading : prev.subheading,
    nodes,
    arrows: overrides.arrows !== undefined ? overrides.arrows : (prev.arrows ?? []),
    regions: overrides.regions !== undefined ? overrides.regions : (prev.regions ?? []),
    annotations: overrides.annotations !== undefined ? overrides.annotations : (prev.annotations ?? []),
    zoom: overrides.zoom || undefined,
    focus: overrides.focus || undefined,
    notes: overrides.notes !== undefined ? overrides.notes : prev.notes,
    presenterNotes: overrides.presenterNotes !== undefined ? overrides.presenterNotes : prev.presenterNotes,
  }
}
