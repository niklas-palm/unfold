import { PresentationApp } from './framework'
import type { PresentationDef } from './framework/types'

const modules = import.meta.glob<{ presentation: PresentationDef }>(
  '../presentation/presentation.ts',
  { eager: true },
)
const presentation = Object.values(modules)[0]?.presentation

export default function App() {
  if (!presentation) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f2ed',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}>
        <p style={{ fontSize: 14, color: '#8a8680' }}>
          No presentation found. Add slides to <code>presentation/</code>
        </p>
      </div>
    )
  }

  return <PresentationApp presentation={presentation} />
}
