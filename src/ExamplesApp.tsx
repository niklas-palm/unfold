import { useState, useEffect } from 'react'
import { PresentationApp } from './framework'
import type { PresentationDef } from './framework/types'

const modules = import.meta.glob<{ presentation: PresentationDef }>(
  '../examples/*/presentation.ts',
  { eager: true },
)

const presentations = Object.entries(modules).map(([path, mod]) => {
  const name = path.split('/').at(-2)!
  return { name, title: mod.presentation.title, presentation: mod.presentation }
})

export default function ExamplesApp() {
  const [selected, setSelected] = useState<string | null>(() => {
    if (presentations.length === 1) return presentations[0].name
    return localStorage.getItem('selected-example')
  })

  useEffect(() => {
    if (selected) localStorage.setItem('selected-example', selected)
  }, [selected])

  const current = presentations.find(p => p.name === selected)

  if (!current) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f2ed',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: '#2c2c2c', marginBottom: 8 }}>
            Examples
          </h1>
          <p style={{ fontSize: 13, color: '#8a8680', marginBottom: 32 }}>
            Reference presentations built with Unfold
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {presentations.map(p => (
              <button
                key={p.name}
                onClick={() => setSelected(p.name)}
                style={{
                  padding: '16px 32px',
                  background: '#faf8f5',
                  border: '1px solid #d9d5cc',
                  borderRadius: 10,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#b8c9d9')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#d9d5cc')}
              >
                <div style={{ fontSize: 15, fontWeight: 600, color: '#2c2c2c' }}>
                  {p.title}
                </div>
                <div style={{ fontSize: 11, color: '#8a8680', marginTop: 4 }}>
                  {p.name}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={() => setSelected(null)}
        style={{
          position: 'fixed', top: 8, left: 8, zIndex: 100,
          padding: '4px 10px', fontSize: 11,
          background: 'rgba(255,255,255,0.8)',
          border: '1px solid #d9d5cc',
          borderRadius: 6,
          cursor: 'pointer',
          color: '#6b6963',
          backdropFilter: 'blur(4px)',
        }}
      >
        &larr; Back
      </button>
      <PresentationApp presentation={current.presentation} />
    </div>
  )
}
