import { motion } from 'framer-motion'
import type { ThemeDef, RegionDef } from '../types'

interface RegionProps {
  region: RegionDef & { x: number; y: number; w: number; h: number }
  theme: ThemeDef
}

const LAYOUT_TRANSITION = {
  duration: 0.5,
  ease: [0.25, 0.1, 0.25, 1] as const,
}

export function Region({ region, theme }: RegionProps) {
  const { label, x, y, w, h } = region

  return (
    <motion.div
      initial={{ opacity: 0, left: x, top: y, width: w, height: h }}
      animate={{
        left: x,
        top: y,
        width: w,
        height: h,
        opacity: 1,
      }}
      exit={{ opacity: 0 }}
      transition={{
        opacity: { duration: 0.3 },
        default: LAYOUT_TRANSITION,
      }}
      style={{
        position: 'absolute',
        background: theme.bgMuted,
        border: `1px dashed ${theme.borderLight}`,
        borderRadius: 16,
      }}
    >
      {label && (
        <span style={{
          position: 'absolute',
          top: 12,
          left: 16,
          fontSize: 10,
          fontWeight: 500,
          color: theme.textFaint,
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
        }}>
          {label}
        </span>
      )}
    </motion.div>
  )
}
