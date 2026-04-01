import { useState, useCallback, useEffect, useRef, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { PresentationDef, DrilldownDef, SlideDef } from '../types'
import { mergeTheme } from '../theme'
import type { ThemeDef } from '../types'
import { SlideRenderer } from './SlideRenderer'
import { Drilldown } from '../components/Drilldown'
import { PresenterView } from '../components/PresenterView'

interface PresentationAppProps {
  presentation: PresentationDef
}

const DEFAULT_ZOOM = 0.92

export function PresentationApp({ presentation }: PresentationAppProps) {
  const theme = mergeTheme(presentation.theme)
  const { slides, drilldowns = [], logo } = presentation

  // Dynamically load custom font if fontUrl is provided
  useEffect(() => {
    if (!theme.fontUrl) return
    const id = 'unfold-custom-font'
    if (document.getElementById(id)) return

    const isFontFile = /\.(woff2?|ttf|otf)(\?|$)/i.test(theme.fontUrl)
    if (isFontFile) {
      // Local font file — inject @font-face rule
      const familyName = theme.fontFamily.match(/['"]([^'"]+)['"]/)?.[1]
        || theme.fontFamily.split(',')[0].trim()
      const ext = theme.fontUrl.match(/\.(woff2?|ttf|otf)/i)?.[1]?.toLowerCase()
      const format = ext === 'woff2' ? 'woff2' : ext === 'woff' ? 'woff' : ext === 'otf' ? 'opentype' : 'truetype'
      const style = document.createElement('style')
      style.id = id
      style.textContent = `@font-face { font-family: '${familyName}'; src: url('${theme.fontUrl}') format('${format}'); font-display: swap; }`
      document.head.appendChild(style)
      return () => { style.remove() }
    } else {
      // Stylesheet URL (Google Fonts, Adobe Fonts, etc.)
      const link = document.createElement('link')
      link.id = id
      link.rel = 'stylesheet'
      link.href = theme.fontUrl
      document.head.appendChild(link)
      return () => { link.remove() }
    }
  }, [theme.fontUrl, theme.fontFamily])

  const isPresenter = window.location.hash.includes('presenter')
  if (isPresenter) {
    return <PresenterView slides={slides} theme={theme} />
  }

  return <MainView slides={slides} drilldowns={drilldowns} theme={theme} logo={logo} />
}

function MainView({ slides, drilldowns, theme, logo }: {
  slides: PresentationDef['slides']
  drilldowns: DrilldownDef[]
  theme: ReturnType<typeof mergeTheme>
  logo?: string
}) {
  const [step, setStep] = useState(0)
  const [activeDrilldown, setActiveDrilldown] = useState<DrilldownDef | null>(null)
  const [notesOpen, setNotesOpen] = useState(false)
  const [userZoom, setUserZoom] = useState(DEFAULT_ZOOM)
  const drilldownRef = useRef(activeDrilldown)
  drilldownRef.current = activeDrilldown

  const maxStep = slides.length - 1

  // Check if any slide has notes
  const hasAnyNotes = slides.some(s => s.notes)

  // Broadcast slide changes to presenter view
  useEffect(() => {
    const bc = new BroadcastChannel('presentation-sync')
    bc.postMessage({ type: 'slide-change', step })

    bc.onmessage = (e) => {
      if (e.data?.type === 'slide-change' && typeof e.data.step === 'number') {
        setStep(e.data.step)
      }
    }

    return () => bc.close()
  }, [step])

  const openDrilldown = useCallback((id: string) => {
    const dd = drilldowns.find(d => d.id === id)
    if (dd) setActiveDrilldown(dd)
  }, [drilldowns])

  const closeDrilldown = useCallback(() => {
    setActiveDrilldown(null)
  }, [])

  // Keyboard navigation — suppressed when drilldown is open
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      // Zoom: Cmd/Ctrl +/- or just +/-
      if (e.key === '=' || e.key === '+') {
        e.preventDefault()
        setUserZoom(z => Math.min(z + 0.04, 1.15))
        return
      }
      if (e.key === '-') {
        e.preventDefault()
        setUserZoom(z => Math.max(z - 0.04, 0.5))
        return
      }
      if (e.key === '0' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setUserZoom(DEFAULT_ZOOM)
        return
      }

      // When a drilldown is open, only Escape closes it; left/right go to the drilldown
      if (drilldownRef.current) {
        if (e.key === 'Escape') {
          e.preventDefault()
          setActiveDrilldown(null)
        }
        return // let sequence diagram etc handle their own keys
      }

      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        setStep(s => Math.min(s + 1, maxStep))
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setStep(s => Math.max(s - 1, 0))
      } else if (e.key === 'p' || e.key === 'P') {
        window.open(`${window.location.pathname}#presenter`, '_blank', 'width=700,height=600')
      } else if (e.key === 'n' || e.key === 'N') {
        if (hasAnyNotes) setNotesOpen(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [maxStep, hasAnyNotes])

  const slide = slides[step]
  const NOTES_WIDTH = 320

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', display: 'flex', fontFamily: theme.fontFamily, background: theme.bgPage, color: theme.textBody }}>
      {/* Logo watermark */}
      {logo && (
        <img
          src={logo}
          alt=""
          style={{
            position: 'fixed', top: 14, right: notesOpen ? NOTES_WIDTH + 14 : 14,
            height: 24, opacity: 0.6, zIndex: 50, pointerEvents: 'none',
            transition: 'right 0.3s ease',
          }}
        />
      )}

      {/* Main slide area */}
      <div style={{
        position: 'relative',
        flex: 1,
        transition: 'margin-right 0.3s ease',
        marginRight: notesOpen ? NOTES_WIDTH : 0,
        overflow: 'hidden',
      }}>
        {/* Slide counter */}
        <div style={{
          position: 'absolute', bottom: 16, left: 20, zIndex: 50,
          fontSize: 10, fontWeight: 500, color: theme.textFaint,
          letterSpacing: '0.05em',
        }}>
          {step + 1} / {slides.length}
        </div>

        {/* Notes toggle button */}
        {hasAnyNotes && (
          <button
            onClick={() => setNotesOpen(prev => !prev)}
            title="Toggle notes (N)"
            style={{
              position: 'absolute', bottom: 14, right: 20, zIndex: 50,
              background: notesOpen ? theme.bgMuted : theme.bgSurface,
              border: `1px solid ${notesOpen ? theme.borderMedium : theme.borderLight}`,
              borderRadius: 8, padding: '4px 10px',
              fontSize: 10, fontWeight: 500, color: notesOpen ? theme.textMuted : theme.textFaint,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
              letterSpacing: '0.03em',
            }}
          >
            <span style={{ fontSize: 12 }}>&#9776;</span>
            Notes
          </button>
        )}

        {/* Main slide content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.type === 'title' ? `title-${step}` : slide.type === 'list' ? `list-${step}` : 'diagram'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{ position: 'absolute', inset: 0 }}
          >
            <ViewportScaler userZoom={userZoom}>
              <SlideRenderer
                slide={slide}
                slideIndex={step}
                theme={theme}
                onDrilldown={openDrilldown}
              />
            </ViewportScaler>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Notes panel */}
      {hasAnyNotes && (
        <NotesPanel
          slide={slide}
          theme={theme}
          open={notesOpen}
          width={NOTES_WIDTH}
        />
      )}

      {/* Drilldown modal */}
      <Drilldown drilldown={activeDrilldown} theme={theme} onClose={closeDrilldown} />
    </div>
  )
}

// --- Viewport Scaler ---
// Scales the fixed-size slide content (960x700 design area) to fit the viewport,
// with a user-controllable zoom multiplier (+/- keys).

const DESIGN_W = 960
const DESIGN_H = 700

function ViewportScaler({ children, userZoom }: { children: ReactNode; userZoom: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [baseScale, setBaseScale] = useState(1)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => {
      const scaleX = el.clientWidth / DESIGN_W
      const scaleY = el.clientHeight / DESIGN_H
      setBaseScale(Math.min(scaleX, scaleY))
    }
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const finalScale = baseScale * userZoom

  return (
    <div ref={ref} style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      <div style={{
        width: DESIGN_W,
        height: DESIGN_H,
        transform: `scale(${finalScale})`,
        position: 'relative',
      }}>
        {children}
      </div>
    </div>
  )
}

// --- Notes Panel ---

function NotesPanel({ slide, theme, open, width }: {
  slide: SlideDef
  theme: ThemeDef
  open: boolean
  width: number
}) {
  const notes = slide.notes

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0,
      width,
      transform: open ? 'translateX(0)' : `translateX(${width}px)`,
      transition: 'transform 0.3s ease',
      background: theme.bgSurface,
      borderLeft: `1px solid ${theme.borderLight}`,
      zIndex: 40,
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        padding: '20px 20px 12px',
        borderBottom: `1px solid ${theme.borderLight}`,
        fontSize: 10, fontWeight: 500, color: theme.textLight,
        letterSpacing: '0.15em', textTransform: 'uppercase',
      }}>
        Slide notes
      </div>
      <div style={{
        flex: 1, overflow: 'auto', padding: '16px 20px',
      }}>
        {notes ? (
          <div style={{
            fontSize: 13, color: theme.textBody,
            lineHeight: 1.7, whiteSpace: 'pre-wrap',
          }}>
            {notes}
          </div>
        ) : (
          <div style={{
            fontSize: 12, color: theme.textFaint, fontStyle: 'italic',
          }}>
            No notes for this slide.
          </div>
        )}
      </div>
      <div style={{
        padding: '10px 20px',
        borderTop: `1px solid ${theme.borderLight}`,
        fontSize: 10, color: theme.textFaint,
      }}>
        Press <kbd style={{
          padding: '1px 5px', background: theme.bgMuted,
          border: `1px solid ${theme.borderLight}`, borderRadius: 3,
          fontFamily: 'inherit', fontSize: 10,
        }}>N</kbd> to toggle
      </div>
    </div>
  )
}
