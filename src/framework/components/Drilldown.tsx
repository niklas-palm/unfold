import { motion, AnimatePresence } from 'framer-motion'
import { Highlight, themes } from 'prism-react-renderer'
import type { ThemeDef, DrilldownDef, ContentDrilldown, CodeDrilldown } from '../types'
import { resolveColor, MONO_FONT } from '../theme'
import { SequenceDiagramModal } from './SequenceDiagram'

interface DrilldownProps {
  drilldown: DrilldownDef | null
  theme: ThemeDef
  onClose: () => void
}

export function Drilldown({ drilldown, theme, onClose }: DrilldownProps) {
  return (
    <AnimatePresence>
      {drilldown && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, background: `color-mix(in srgb, ${theme.bgPage} 75%, transparent)`, backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: theme.bgSurface, borderRadius: 16,
              border: `1px solid ${theme.borderLight}`,
              padding: '28px 32px',
              maxWidth: drilldown.type === 'sequence' ? 960 : 680,
              width: '100%',
              boxShadow: `0 20px 60px ${theme.bgPage}`,
              maxHeight: '90vh',
              overflow: drilldown.type === 'sequence' ? 'hidden' : 'auto',
              display: drilldown.type === 'sequence' ? 'flex' : undefined,
              flexDirection: drilldown.type === 'sequence' ? 'column' : undefined,
            }}
          >
            {drilldown.type === 'content' && <ContentView d={drilldown} theme={theme} onClose={onClose} />}
            {drilldown.type === 'code' && <CodeView d={drilldown} theme={theme} onClose={onClose} />}
            {drilldown.type === 'sequence' && (
              <SequenceDiagramModal drilldown={drilldown} theme={theme} onClose={onClose} />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// --- Header ---

function Header({ title, subtitle, theme, onClose }: {
  title: string; subtitle?: string; theme: ThemeDef; onClose: () => void
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', color: theme.text }}>{title}</div>
        {subtitle && <div style={{ fontSize: 13, color: theme.textLight, marginTop: 4 }}>{subtitle}</div>}
      </div>
      <button onClick={onClose} style={{
        background: 'none', border: 'none', fontSize: 18, color: theme.textFaint,
        cursor: 'pointer', padding: '4px 8px', borderRadius: 8, lineHeight: 1,
      }}>
        ✕
      </button>
    </div>
  )
}

// --- Content Drilldown ---

function ContentView({ d, theme, onClose }: { d: ContentDrilldown; theme: ThemeDef; onClose: () => void }) {
  return (
    <>
      <Header title={d.title} subtitle={d.subtitle} theme={theme} onClose={onClose} />
      {d.sections.map((section, si) => (
        <div key={si} style={{ marginBottom: 20 }}>
          {section.heading && (
            <div style={{ fontSize: 13, fontWeight: 600, color: theme.text, marginBottom: 6 }}>
              {section.heading}
            </div>
          )}
          {section.body && (
            <div style={{ fontSize: 13, color: theme.textBody, lineHeight: 1.65 }}
                 dangerouslySetInnerHTML={{ __html: section.body }}
            />
          )}
          {section.items && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
              {section.items.map((item, i) => (
                <div key={i} style={{ fontSize: 12, color: theme.textBody, display: 'flex', gap: 6 }}>
                  <span style={{ color: theme.textMuted, fontWeight: 600, minWidth: 16 }}>{i + 1}.</span>
                  {item.detail}
                </div>
              ))}
            </div>
          )}
          {section.columns && (
            <div style={{ display: 'flex', gap: 14 }}>
              {section.columns.map((col, ci) => {
                const badgeColor = col.badge?.color ? resolveColor(theme, col.badge.color) : null
                return (
                  <div key={ci} style={{
                    flex: 1, padding: '16px 18px', background: theme.bgSurface,
                    border: `1px solid ${theme.borderLight}`, borderRadius: 12,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      {col.badge && (
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: '3px 8px',
                          borderRadius: 6, letterSpacing: '0.03em',
                          background: badgeColor?.bg ?? theme.bgMuted,
                          color: badgeColor?.text ?? theme.textMuted,
                        }}>
                          {col.badge.text}
                        </span>
                      )}
                      <span style={{ fontSize: 13, fontFamily: MONO_FONT, fontWeight: 600 }}>{col.heading}</span>
                    </div>
                    {col.authBadge && (
                      <div style={{
                        display: 'inline-block', fontSize: 11, fontWeight: 500,
                        padding: '3px 10px', borderRadius: 10,
                        background: theme.bgMuted, color: theme.textMuted,
                        marginBottom: 10,
                      }}>
                        {col.authBadge}
                      </div>
                    )}
                    <div style={{ fontSize: 13, color: theme.textBody, lineHeight: 1.65 }}
                         dangerouslySetInnerHTML={{ __html: col.body }}
                    />
                    {col.items && (
                      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {col.items.map((item, i) => (
                          <div key={i} style={{ fontSize: 12, color: theme.textBody, display: 'flex', gap: 6 }}>
                            <span style={{ color: theme.textMuted, fontWeight: 600, minWidth: 16 }}>{i + 1}.</span>
                            {item.detail}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          {section.note && (
            <div style={{
              padding: '14px 18px', background: theme.bgPage,
              borderRadius: 10, border: `1px solid ${theme.borderLight}`, marginTop: 16,
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: theme.textMuted, marginBottom: 4 }}>
                {section.note.title}
              </div>
              <div style={{ fontSize: 13, color: theme.textBody, lineHeight: 1.6 }}
                   dangerouslySetInnerHTML={{ __html: section.note.body }}
              />
            </div>
          )}
        </div>
      ))}
    </>
  )
}

// --- Code Drilldown ---

function CodeView({ d, theme, onClose }: { d: CodeDrilldown; theme: ThemeDef; onClose: () => void }) {
  return (
    <>
      <Header title={d.title} subtitle={d.subtitle} theme={theme} onClose={onClose} />
      <Highlight theme={themes.nightOwl} code={d.code} language={d.language}>
        {({ style, tokens, getLineProps, getTokenProps }) => (
          <pre style={{
            ...style, margin: 0, padding: '16px 20px', borderRadius: 12,
            marginBottom: 18, overflow: 'auto', fontSize: 12, lineHeight: 1.65,
            fontFamily: MONO_FONT,
          }}>
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
      {d.callouts && (
        <div style={{ display: 'flex', gap: 14 }}>
          {d.callouts.map((callout, i) => (
            <div key={i} style={{
              flex: 1, padding: '14px 18px', background: theme.bgPage,
              borderRadius: 10, border: `1px solid ${theme.borderLight}`,
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: theme.text, marginBottom: 4 }}>
                {callout.title}
              </div>
              <div style={{ fontSize: 13, color: theme.textBody, lineHeight: 1.55 }}>
                {callout.body}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
