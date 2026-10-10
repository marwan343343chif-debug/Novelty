import { RotateCcw, Download, Upload, FileDown } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { Modal } from '../Modal'
import { ACCENTS } from '../../lib/colors'
import { UI_FONTS, MONO_FONTS, CONTENT_WIDTHS, DENSITY_OPTIONS } from '../../lib/constants'
import type { ThemeName, ContentWidth, ViewMode, SortMode, Density } from '../../store/types'

const THEME_OPTIONS: { value: ThemeName; label: string }[] = [
  { value: 'opencode-dark', label: 'Opencode Dark' },
  { value: 'graphite', label: 'Graphite' },
  { value: 'paper', label: 'Paper (light)' },
]

export function SettingsModal(): JSX.Element {
  const settings = useStore((s) => s.settings)
  const setSettings = useStore((s) => s.setSettings)
  const setModal = useStore((s) => s.setModal)
  const runCommand = useStore((s) => s.runCommand)
  const resetVault = useStore((s) => s.resetVault)

  return (
    <Modal
      title="Settings"
      onClose={() => setModal(null)}
      wide
      footer={
        <>
          <button className="btn btn-ghost" onClick={() => void resetVault()}>
            <RotateCcw size={14} /> Erase all vault data
          </button>
          <span className="spacer" />
          <button className="btn btn-primary" onClick={() => setModal(null)}>
            Done
          </button>
        </>
      }
    >
      <Section title="Appearance">
        <Row label="Your name" desc="Shown on the home page welcome.">
          <input
            className="text-input"
            type="text"
            placeholder="e.g. Mira"
            value={settings.userName}
            onChange={(e) => setSettings({ userName: e.target.value })}
          />
        </Row>
        <Row label="Theme" desc="Overall color treatment.">
          <select className="select" value={settings.theme} onChange={(e) => setSettings({ theme: e.target.value as ThemeName })}>
            {THEME_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Row>
        <Row label="Accent" desc="Used for highlights, links and focus.">
          <div className="field-inline">
            <div className="swatch-grid">
              {ACCENTS.map((accent) => (
                <div
                  key={accent.name}
                  className={`swatch${settings.accent === accent.value ? ' active' : ''}`}
                  style={{ background: accent.value }}
                  title={accent.name}
                  onClick={() => setSettings({ accent: accent.value })}
                />
              ))}
            </div>
            <input
              className="color-input"
              type="color"
              value={settings.accent}
              title="Custom accent"
              onChange={(e) => setSettings({ accent: e.target.value })}
            />
          </div>
        </Row>
        <Row label="Interface font">
          <select className="select" value={settings.uiFont} onChange={(e) => setSettings({ uiFont: e.target.value })}>
            {UI_FONTS.map((f) => (
              <option key={f.name} value={f.value}>
                {f.name}
              </option>
            ))}
          </select>
        </Row>
        <Row label="Editor font">
          <select className="select" value={settings.monoFont} onChange={(e) => setSettings({ monoFont: e.target.value })}>
            {MONO_FONTS.map((f) => (
              <option key={f.name} value={f.value}>
                {f.name}
              </option>
            ))}
          </select>
        </Row>
        <Row label="Editor font size">
          <input
            className="number-input"
            type="number"
            min={12}
            max={22}
            value={settings.fontSize}
            onChange={(e) => setSettings({ fontSize: Number(e.target.value) })}
          />
        </Row>
        <Row label="Line height" desc="Vertical rhythm in the editor.">
          <input
            className="number-input"
            type="number"
            min={1}
            max={2.6}
            step={0.05}
            value={settings.editorLineHeight}
            onChange={(e) => setSettings({ editorLineHeight: Number(e.target.value) })}
          />
        </Row>
        <Row label="Preview font size">
          <input
            className="number-input"
            type="number"
            min={12}
            max={24}
            value={settings.previewFontSize}
            onChange={(e) => setSettings({ previewFontSize: Number(e.target.value) })}
          />
        </Row>
        <Row label="Content width">
          <select
            className="select"
            value={settings.contentWidth}
            onChange={(e) => setSettings({ contentWidth: e.target.value as ContentWidth })}
          >
            {(Object.keys(CONTENT_WIDTHS) as ContentWidth[]).map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </Row>
        <Row label="Density" desc="Spacing across panels and controls.">
          <select className="select" value={settings.density} onChange={(e) => setSettings({ density: e.target.value as Density })}>
            {DENSITY_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </Row>
        <Toggle label="Reduce motion" value={settings.reduceMotion} onChange={(v) => setSettings({ reduceMotion: v })} />
        <Toggle label="Background texture" value={settings.backgroundTexture} onChange={(v) => setSettings({ backgroundTexture: v })} />
      </Section>

      <Section title="Editor & layout">
        <Row label="Default view">
          <select className="select" value={settings.viewMode} onChange={(e) => setSettings({ viewMode: e.target.value as ViewMode })}>
            <option value="source">Source</option>
            <option value="split">Split</option>
            <option value="preview">Preview</option>
          </select>
        </Row>
        <Row label="Tab size">
          <select className="select" value={settings.tabSize} onChange={(e) => setSettings({ tabSize: Number(e.target.value) })}>
            <option value={2}>2 spaces</option>
            <option value={4}>4 spaces</option>
            <option value={8}>8 spaces</option>
          </select>
        </Row>
        <Toggle label="Line numbers" value={settings.lineNumbers} onChange={(v) => setSettings({ lineNumbers: v })} />
        <Toggle label="Wrap long lines" value={settings.lineWrapping} onChange={(v) => setSettings({ lineWrapping: v })} />
        <Toggle
          label="Highlight active line"
          value={settings.highlightActiveLine}
          onChange={(v) => setSettings({ highlightActiveLine: v })}
        />
        <Toggle label="Spellcheck" value={settings.spellcheck} onChange={(v) => setSettings({ spellcheck: v })} />
        <Toggle label="Show formatting toolbar" value={settings.showToolbar} onChange={(v) => setSettings({ showToolbar: v })} />
        <Toggle label="Show status bar" value={settings.showStatusBar} onChange={(v) => setSettings({ showStatusBar: v })} />
        <Toggle label="Show ribbon" value={settings.showRibbon} onChange={(v) => setSettings({ showRibbon: v })} />
        <Toggle label="Show left sidebar" value={settings.showLeft} onChange={(v) => setSettings({ showLeft: v })} />
        <Toggle label="Show right sidebar" value={settings.showRight} onChange={(v) => setSettings({ showRight: v })} />
        <Toggle label="Focus mode" value={settings.focusMode} onChange={(v) => setSettings({ focusMode: v })} />
        <Toggle label="Typewriter mode" value={settings.typewriterMode} onChange={(v) => setSettings({ typewriterMode: v })} />
        <Row label="Focus dimming" desc="Dim everything but the active line.">
          <input
            className="range-input"
            type="range"
            min={0}
            max={0.8}
            step={0.02}
            value={settings.focusDim}
            onChange={(e) => setSettings({ focusDim: Number(e.target.value) })}
          />
        </Row>
      </Section>

      <Section title="Writing">
        <Row label="Daily word goal" desc="Tracked in the status bar.">
          <input
            className="number-input"
            type="number"
            min={0}
            step={50}
            value={settings.dailyGoal}
            onChange={(e) => setSettings({ dailyGoal: Math.max(0, Number(e.target.value)) })}
          />
        </Row>
        <Row label="Sort notes by">
          <select className="select" value={settings.sort} onChange={(e) => setSettings({ sort: e.target.value as SortMode })}>
            <option value="modified">Last modified</option>
            <option value="name">Name</option>
            <option value="created">Date created</option>
          </select>
        </Row>
        <Toggle label="Show word goal in status bar" value={settings.showWordGoal} onChange={(v) => setSettings({ showWordGoal: v })} />
        <Toggle label="Auto save" value={settings.autoSave} onChange={(v) => setSettings({ autoSave: v })} />
        <Row label="Auto save delay" desc="Milliseconds of idle time before saving.">
          <input
            className="number-input"
            type="number"
            min={150}
            step={50}
            value={settings.autoSaveDelay}
            onChange={(e) => setSettings({ autoSaveDelay: Math.max(150, Number(e.target.value)) })}
          />
        </Row>
      </Section>

      <Section title="Widgets">
        <p className="settings-note">Shown in the right panel when “Writing widgets” is selected.</p>
        <Toggle label="Task list" value={settings.widgetsTodo} onChange={(v) => setSettings({ widgetsTodo: v })} />
        <Toggle label="Clock & timer" value={settings.widgetsClock} onChange={(v) => setSettings({ widgetsClock: v })} />
        <Toggle label="Calendar" value={settings.widgetsCalendar} onChange={(v) => setSettings({ widgetsCalendar: v })} />
        <Row label="Show completed tasks" desc="Include checked items in the task widget.">
          <div
            className={`switch${settings.showCompletedTasks ? ' on' : ''}`}
            onClick={() => setSettings({ showCompletedTasks: !settings.showCompletedTasks })}
          />
        </Row>
        <Toggle label="24-hour clock" value={settings.clock24h} onChange={(v) => setSettings({ clock24h: v })} />
        <Toggle label="Show seconds" value={settings.clockSeconds} onChange={(v) => setSettings({ clockSeconds: v })} />
        <Toggle label="Week starts on Monday" value={settings.weekStartsMonday} onChange={(v) => setSettings({ weekStartsMonday: v })} />
        <Row label="Pomodoro focus" desc="Minutes per focus session.">
          <input
            className="number-input"
            type="number"
            min={1}
            max={180}
            value={settings.pomodoroFocus}
            onChange={(e) => setSettings({ pomodoroFocus: Math.max(1, Number(e.target.value)) })}
          />
        </Row>
        <Row label="Pomodoro break" desc="Minutes per break.">
          <input
            className="number-input"
            type="number"
            min={1}
            max={60}
            value={settings.pomodoroBreak}
            onChange={(e) => setSettings({ pomodoroBreak: Math.max(1, Number(e.target.value)) })}
          />
        </Row>
      </Section>

      <Section title="Data">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn" onClick={() => runCommand('export-vault')}>
            <Download size={14} /> Export vault JSON
          </button>
          <button className="btn" onClick={() => runCommand('import-vault')}>
            <Upload size={14} /> Import vault JSON
          </button>
          <button className="btn" onClick={() => runCommand('export-markdown')}>
            <FileDown size={14} /> Export markdown folder
          </button>
        </div>
      </Section>
    </Modal>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }): JSX.Element {
  return (
    <div className="settings-section">
      <div className="settings-section-title">{title}</div>
      {children}
    </div>
  )
}

function Row({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }): JSX.Element {
  return (
    <div className="field-row">
      <div>
        <div className="field-label">{label}</div>
        {desc ? <div className="field-desc">{desc}</div> : null}
      </div>
      <div className="field-control">{children}</div>
    </div>
  )
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }): JSX.Element {
  return (
    <div className="field-row">
      <div className="field-label">{label}</div>
      <div className={`switch${value ? ' on' : ''}`} onClick={() => onChange(!value)} />
    </div>
  )
}
