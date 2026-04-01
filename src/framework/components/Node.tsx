import { motion } from 'framer-motion'
import type { ThemeDef, NodeDef, FocusDef } from '../types'
import { resolveColor } from '../theme'

interface NodeProps {
  node: NodeDef
  theme: ThemeDef
  onDrilldown?: (id: string) => void
  dimmed?: boolean
  focusData?: FocusDef
}

const LAYOUT_TRANSITION = {
  duration: 0.5,
  ease: [0.25, 0.1, 0.25, 1] as const,
}

const FOCUS_TRANSITION = {
  duration: 0.7,
  ease: [0.25, 0.1, 0.25, 1] as const,
}

// Base sizes for full-size nodes
const BASE = { icon: 18, label: 12, sub: 9, gap: 3 }

function computeSizes(h: number, hasIcon: boolean, hasSub: boolean) {
  const padding = 12
  const avail = h - padding

  // Full content height at base sizes
  const fullH =
    (hasIcon ? BASE.icon + BASE.gap : 0) +
    BASE.label +
    (hasSub ? BASE.gap + BASE.sub : 0)

  // If content would need aggressive scaling (< 70% of base), drop sub first
  let showSub = hasSub
  let showIcon = hasIcon

  let contentH = fullH
  if (avail < fullH * 0.7 && hasSub && hasIcon) {
    showSub = false
    contentH = BASE.icon + BASE.gap + BASE.label
  }
  if (avail < contentH * 0.65 && showIcon) {
    showIcon = false
    contentH = BASE.label + (showSub ? BASE.gap + BASE.sub : 0)
  }

  const s = Math.min(1, avail / contentH)

  return {
    showIcon,
    showSub,
    iconSize: Math.round(BASE.icon * s),
    labelSize: Math.max(8, Math.round(BASE.label * s)),
    subSize: Math.max(7, Math.round(BASE.sub * s)),
    gap: Math.max(1, Math.round(BASE.gap * s)),
  }
}

export function Node({ node, theme, onDrilldown, dimmed, focusData }: NodeProps) {
  const { id, label, sub, icon, x, y, w = 130, h = 65, color, onClick } = node
  const cs = resolveColor(theme, color)
  const isFocused = !!focusData
  const isClickable = !isFocused && !!(onClick && onDrilldown)

  const sizes = computeSizes(h, !!icon, !!sub)
  const maxTextW = w - 16

  return (
    <motion.div
      data-node-id={id}
      initial={{ opacity: 0, left: x, top: y, width: w, height: h }}
      animate={{
        left: x,
        top: y,
        width: w,
        height: h,
        opacity: dimmed ? 0.12 : 1,
        borderRadius: isFocused ? 16 : Math.min(12, Math.round(h * 0.18)),
      }}
      exit={{ opacity: 0 }}
      transition={{
        opacity: { duration: 0.3 },
        default: isFocused ? FOCUS_TRANSITION : LAYOUT_TRANSITION,
      }}
      onClick={isClickable ? () => onDrilldown!(onClick!) : undefined}
      style={{
        position: 'absolute',
        background: cs.bg,
        border: `1px solid ${cs.border}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: isFocused ? 'stretch' : 'center',
        justifyContent: isFocused ? 'flex-start' : 'center',
        gap: isFocused ? 0 : sizes.gap,
        zIndex: isFocused ? 20 : 2,
        cursor: isClickable ? 'pointer' : undefined,
        boxShadow: isFocused
          ? `0 8px 32px ${theme.bgPage}, 0 2px 8px ${theme.bgPage}`
          : undefined,
        overflow: 'hidden',
      }}
    >
      {isFocused ? (
        <ExpandedContent
          label={label}
          color={color}
          focusData={focusData!}
          theme={theme}
          onDrilldown={onDrilldown}
        />
      ) : (
        <>
          {sizes.showIcon && icon && (
            <span style={{ fontSize: sizes.iconSize, lineHeight: 1 }}>{icon}</span>
          )}
          <span style={{
            fontSize: sizes.labelSize,
            fontWeight: 600,
            color: cs.text,
            letterSpacing: '-0.015em',
            maxWidth: maxTextW,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {label}
          </span>
          {sizes.showSub && sub && (
            <span style={{
              fontSize: sizes.subSize,
              color: theme.textLight,
              maxWidth: maxTextW,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {sub}
            </span>
          )}
          {isClickable && (
            <span style={{
              position: 'absolute', top: 4, right: 6,
              fontSize: 10, color: theme.textFaint,
              lineHeight: 1,
            }}>
              ↗
            </span>
          )}
        </>
      )}
    </motion.div>
  )
}

// --- Expanded node content (shown when focus is active) ---

function ExpandedContent({ label, color, focusData, theme, onDrilldown }: {
  label: string
  color?: string
  focusData: FocusDef
  theme: ThemeDef
  onDrilldown?: (id: string) => void
}) {
  const cs = resolveColor(theme, color as any)

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      padding: '14px 16px 12px',
    }}>
      {/* Header */}
      <div style={{
        fontSize: 10,
        fontWeight: 500,
        color: cs.text,
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        marginBottom: 12,
      }}>
        {label}
      </div>

      {/* Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        {focusData.items.map((item, i) => {
          const itemCs = resolveColor(theme, item.color)
          const clickable = !!(item.onClick && onDrilldown)
          return (
            <div
              key={i}
              onClick={clickable ? (e) => { e.stopPropagation(); onDrilldown!(item.onClick!) } : undefined}
              style={{
                padding: '10px 14px',
                background: item.color ? `${itemCs.bg}` : theme.bgSurface,
                borderLeft: `3px solid ${item.color ? itemCs.border : theme.borderMedium}`,
                borderRadius: '0 6px 6px 0',
                cursor: clickable ? 'pointer' : undefined,
                transition: 'background 0.15s',
              }}
            >
              <div style={{
                fontSize: 12, fontWeight: 600,
                color: theme.text,
                lineHeight: 1.3,
              }}>
                {item.label}
                {clickable && (
                  <span style={{ fontSize: 9, color: theme.textFaint, marginLeft: 6 }}>↗</span>
                )}
              </div>
              {item.sub && (
                <div style={{
                  fontSize: 10, color: theme.textLight,
                  marginTop: 3, lineHeight: 1.3,
                }}>
                  {item.sub}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footnote */}
      {focusData.footnote && (
        <div
          onClick={focusData.footnoteOnClick && onDrilldown
            ? (e) => { e.stopPropagation(); onDrilldown!(focusData.footnoteOnClick!) }
            : undefined}
          style={{
            fontSize: 10,
            color: theme.textMuted,
            textAlign: 'center',
            marginTop: 10,
            cursor: focusData.footnoteOnClick ? 'pointer' : undefined,
            textDecoration: focusData.footnoteOnClick ? 'underline' : undefined,
            textUnderlineOffset: 2,
          }}
        >
          {focusData.footnote}
        </div>
      )}
    </div>
  )
}
