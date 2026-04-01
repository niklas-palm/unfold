// ============================================================
// Presentation Framework — Type Definitions
// ============================================================

// --- Primitives ---

export type SemanticColor =
  | 'sea' | 'warm' | 'sage' | 'blush' | 'mist'
  | 'clay' | 'sky' | 'stone' | 'sand' | 'slate'
  | 'default'
export type Side = 'top' | 'bottom' | 'left' | 'right'

export interface AnchorPoint {
  id: string
  side?: Side
  offset?: number // 0–1 along edge, default 0.5
}

export interface PixelPoint {
  x: number
  y: number
}

export type ArrowEndpoint = string | AnchorPoint | PixelPoint

// --- Theme ---

export interface ColorSet {
  bg: string
  border: string
  text: string
}

export interface ThemeDef {
  text: string
  textBody: string
  textMuted: string
  textLight: string
  textFaint: string
  bgPage: string
  bgSurface: string
  bgMuted: string
  borderLight: string
  borderMedium: string
  borderDefault: string
  fontFamily: string
  fontUrl?: string
  colors: Record<SemanticColor, ColorSet>
}

// --- Nodes ---

export interface NodeDef {
  id: string
  label: string
  sub?: string
  icon?: string
  x: number
  y: number
  w?: number  // default 130
  h?: number  // default 65
  color?: SemanticColor
  onClick?: string // drilldown ID
}

// --- Arrows ---

export interface ArrowDef {
  from: ArrowEndpoint
  to: ArrowEndpoint
  via?: PixelPoint[]  // intermediate waypoints — renders as polyline
  label?: string
  labelOffset?: { dx?: number; dy?: number }  // fine-tune label position
  color?: SemanticColor
  dashed?: boolean
}

// --- Regions ---

export interface RegionDef {
  id: string
  label: string
  // Option 1: manual positioning
  x?: number
  y?: number
  w?: number
  h?: number
  // Option 2: auto-fit around specific nodes
  contains?: string[]  // node IDs — region auto-sizes to their bounding box
  padding?: number     // extra space around contained nodes (default 20)
  // Alignment: regions in the same group share x and width (stacked card layout)
  group?: string
}

// --- Annotations (discriminated union) ---

export interface PillGroupAnnotation {
  type: 'pill-group'
  x: number; y: number
  pills: { icon?: string; text: string; bold?: boolean; color?: SemanticColor }[]
  joinWith?: string
  footnote?: string
}

export interface ChipListAnnotation {
  type: 'chip-list'
  x: number; y: number
  chips: string[]
  color?: SemanticColor
}

export interface StatusAnnotation {
  type: 'status'
  x: number; y: number
  variant: 'success' | 'error'
  title: string
  detail?: string
}

export interface UrlBoxAnnotation {
  type: 'url-box'
  x: number; y: number
  title?: string
  urls: string[]
  color?: SemanticColor
}

export interface ToolBoxAnnotation {
  type: 'tool-box'
  x: number; y: number
  icon?: string
  name: string
  detail?: string
}

export interface PopupBoxAnnotation {
  type: 'popup-box'
  x: number; y: number
  title: string
  detail?: string
  w?: number
}

export interface CardListAnnotation {
  type: 'card-list'
  x: number; y: number
  cards: { label: string; detail: string; borderColor?: SemanticColor; onClick?: string }[]
  direction?: 'row' | 'column'
}

export interface NumberedListAnnotation {
  type: 'numbered-list'
  x: number; y: number
  items: { title: string; detail?: string }[]
  color?: SemanticColor
}

export interface TextBlockAnnotation {
  type: 'text-block'
  x: number; y: number
  text: string  // supports **bold** and `code`
  w?: number
  align?: 'left' | 'center' | 'right'
  onClick?: string // drilldown ID
}

export interface CodeSnippetAnnotation {
  type: 'code-snippet'
  x: number; y: number
  code: string
  language?: string
  w?: number
}

export interface BraceAnnotation {
  type: 'brace'
  x: number
  y: number
  w: number     // span of the brace
  h: number     // depth of the curve
  color?: SemanticColor
}

export type AnnotationDef =
  | PillGroupAnnotation
  | ChipListAnnotation
  | StatusAnnotation
  | UrlBoxAnnotation
  | ToolBoxAnnotation
  | PopupBoxAnnotation
  | CardListAnnotation
  | NumberedListAnnotation
  | TextBlockAnnotation
  | CodeSnippetAnnotation
  | BraceAnnotation

// --- Focus (node expansion) ---

export interface FocusItem {
  label: string
  sub?: string
  color?: SemanticColor
  onClick?: string
}

export interface FocusDef {
  nodeId: string
  x?: number         // override position when expanded
  y?: number
  w: number          // expanded width
  h: number          // expanded height
  items: FocusItem[] // internal components shown vertically
  footnote?: string
  footnoteOnClick?: string
}

// --- Slides ---

export interface TitleSlide {
  type: 'title'
  eyebrow?: string
  title: string
  subtitle?: string
  hint?: string
  notes?: string
  presenterNotes?: string
}

export interface DiagramSlide {
  type: 'diagram'
  heading: string
  subheading?: string
  nodes: NodeDef[]
  arrows?: ArrowDef[]
  regions?: RegionDef[]
  annotations?: AnnotationDef[]
  zoom?: { x: number; y: number; scale: number }
  focus?: FocusDef
  notes?: string
  presenterNotes?: string
}

export interface ListSlide {
  type: 'list'
  eyebrow?: string
  heading: string
  subheading?: string
  items: { icon?: string; title: string; desc: string }[]
  itemBorderColor?: SemanticColor
  notes?: string
  presenterNotes?: string
}

export type SlideDef = TitleSlide | DiagramSlide | ListSlide

// --- Drilldowns ---

export interface DrilldownSection {
  heading?: string
  body?: string
  items?: { label: string; detail: string }[]
  columns?: {
    heading: string
    badge?: { text: string; color?: SemanticColor }
    authBadge?: string
    body: string
    items?: { label: string; detail: string }[]
  }[]
  note?: { title: string; body: string }
}

export interface ContentDrilldown {
  type: 'content'
  id: string
  title: string
  subtitle?: string
  sections: DrilldownSection[]
}

export interface CodeDrilldown {
  type: 'code'
  id: string
  title: string
  subtitle?: string
  code: string
  language: string
  callouts?: { title: string; body: string }[]
}

export interface SequenceActor {
  id: string
  label: string
  sub?: string
  color?: SemanticColor
}

export interface SequenceMessage {
  from?: string
  to?: string
  label?: string
  dashed?: boolean
  actor?: string   // for annotations on a single actor
  text?: string    // annotation text (supports \n)
}

export interface SequencePhase {
  name: string
  messages: SequenceMessage[]
}

export interface SequenceDrilldown {
  type: 'sequence'
  id: string
  title: string
  subtitle?: string
  actors: SequenceActor[]
  phases: SequencePhase[]
}

export type DrilldownDef = ContentDrilldown | CodeDrilldown | SequenceDrilldown

// --- Presentation ---

export interface PresentationDef {
  title: string
  theme?: Partial<ThemeDef>
  logo?: string
  slides: SlideDef[]
  drilldowns?: DrilldownDef[]
}
