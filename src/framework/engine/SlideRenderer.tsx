import { motion, AnimatePresence } from 'framer-motion'
import type { ThemeDef, SlideDef } from '../types'
import { DiagramStage } from './DiagramStage'

interface SlideRendererProps {
  slide: SlideDef
  slideIndex: number
  theme: ThemeDef
  onDrilldown: (id: string) => void
}

export function SlideRenderer({ slide, slideIndex, theme, onDrilldown }: SlideRendererProps) {
  switch (slide.type) {
    case 'title':
      return <TitleRenderer slide={slide} theme={theme} />
    case 'diagram':
      return <DiagramRenderer slide={slide} slideIndex={slideIndex} theme={theme} onDrilldown={onDrilldown} />
    case 'list':
      return <ListRenderer slide={slide} theme={theme} />
  }
}

// --- Title Slide ---

function TitleRenderer({ slide, theme }: { slide: Extract<SlideDef, { type: 'title' }>; theme: ThemeDef }) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
    }}>
      {slide.eyebrow && (
        <div style={{
          fontSize: 10, fontWeight: 500, color: theme.textFaint,
          letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 16,
        }}>
          {slide.eyebrow}
        </div>
      )}
      <h1 style={{
        fontSize: 52, fontWeight: 600,
        letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 14,
        color: theme.text,
      }}>
        {slide.title}
      </h1>
      {slide.subtitle && (
        <p style={{ fontSize: 20, color: theme.textMuted, fontWeight: 300 }}
           dangerouslySetInnerHTML={{ __html: slide.subtitle }}
        />
      )}
      {slide.hint && (
        <p style={{ marginTop: 40, fontSize: 13, color: theme.textFaint }}>
          {slide.hint}
        </p>
      )}
    </div>
  )
}

// --- Diagram Slide ---

function DiagramRenderer({ slide, slideIndex, theme, onDrilldown }: {
  slide: Extract<SlideDef, { type: 'diagram' }>
  slideIndex: number
  theme: ThemeDef
  onDrilldown: (id: string) => void
}) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center',
      paddingTop: 40,
    }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={`heading-${slide.heading}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{ textAlign: 'center', marginBottom: 24 }}
        >
          <h2 style={{
            fontSize: 30, fontWeight: 600,
            letterSpacing: '-0.02em', marginBottom: 6,
            color: theme.text,
          }}>
            {slide.heading}
          </h2>
          {slide.subheading && (
            <p style={{ fontSize: 15, color: theme.textLight, fontWeight: 400 }}>
              {slide.subheading}
            </p>
          )}
        </motion.div>
      </AnimatePresence>

      <DiagramStage slide={slide} theme={theme} onDrilldown={onDrilldown} />
    </div>
  )
}

// --- List Slide ---

function ListRenderer({ slide, theme }: { slide: Extract<SlideDef, { type: 'list' }>; theme: ThemeDef }) {
  const borderCs = slide.itemBorderColor
    ? theme.colors[slide.itemBorderColor]
    : { border: theme.borderMedium }

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
    }}>
      {slide.eyebrow && (
        <div style={{
          fontSize: 10, fontWeight: 500, color: theme.textFaint,
          letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 12,
        }}>
          {slide.eyebrow}
        </div>
      )}
      <h2 style={{
        fontSize: 30, fontWeight: 600,
        letterSpacing: '-0.02em', marginBottom: 6,
        color: theme.text,
      }}>
        {slide.heading}
      </h2>
      {slide.subheading && (
        <p style={{ fontSize: 15, color: theme.textLight, fontWeight: 400, marginBottom: 32 }}>
          {slide.subheading}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 740 }}>
        {slide.items.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 + i * 0.08 }}
            style={{
              display: 'flex', gap: 16, padding: '14px 18px',
              background: theme.bgSurface,
              border: `1px solid ${borderCs.border}`,
              borderRadius: 16,
            }}
          >
            {item.icon && (
              <div style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{item.icon}</div>
            )}
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: theme.text, marginBottom: 3 }}>
                {item.title}
              </div>
              <div style={{ fontSize: 10, color: theme.textMuted, lineHeight: 1.55 }}>
                {item.desc}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
