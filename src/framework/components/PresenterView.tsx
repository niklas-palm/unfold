import { useEffect, useState, useRef } from 'react'
import type { ThemeDef, SlideDef } from '../types'

interface PresenterViewProps {
  slides: SlideDef[]
  theme: ThemeDef
}

export function PresenterView({ slides, theme }: PresenterViewProps) {
  const [step, setStep] = useState(0)
  const bcRef = useRef<BroadcastChannel | null>(null)
  const maxStep = slides.length - 1

  useEffect(() => {
    const bc = new BroadcastChannel('presentation-sync')
    bcRef.current = bc

    bc.onmessage = (e) => {
      if (e.data?.type === 'slide-change') {
        setStep(e.data.step)
      }
    }
    return () => bc.close()
  }, [])

  // Keyboard navigation — syncs back to main view
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      let newStep: number | null = null
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        newStep = Math.min(step + 1, maxStep)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        newStep = Math.max(step - 1, 0)
      }
      if (newStep !== null && newStep !== step) {
        setStep(newStep)
        bcRef.current?.postMessage({ type: 'slide-change', step: newStep })
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [step, maxStep])

  const slide = slides[step]
  const notes = slide?.presenterNotes || slide?.notes || 'No notes for this slide.'
  const heading = slide?.type === 'title' ? slide.title
    : slide?.type === 'diagram' ? slide.heading
    : slide?.type === 'list' ? slide.heading
    : ''

  return (
    <div style={{
      padding: 32, fontFamily: theme.fontFamily,
      background: theme.bgPage, minHeight: '100vh',
    }}>
      <div style={{
        fontSize: 11, fontWeight: 600, color: theme.textLight,
        letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8,
      }}>
        Slide {step + 1} of {slides.length}
      </div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20, letterSpacing: '-0.02em' }}>
        {heading}
      </h1>
      <div style={{
        fontSize: 14, color: theme.textBody, lineHeight: 1.8,
        whiteSpace: 'pre-wrap', maxWidth: 600,
      }}>
        {notes}
      </div>
    </div>
  )
}
