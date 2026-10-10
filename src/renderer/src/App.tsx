import { useEffect } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { useStore } from './store/useStore'
import { TitleBar } from './components/TitleBar'
import { Ribbon } from './components/Ribbon'
import { Sidebar } from './components/Sidebar'
import { MainArea } from './components/MainArea'
import { StatusBar } from './components/StatusBar'
import { Palette } from './components/Palette'
import { Modals } from './components/Modals'
import { ImagePickerModal } from './components/modals/ImagePickerModal'
import { Toasts } from './components/Toasts'
import { ContextMenuHost } from './components/ContextMenu'
import { CONTENT_WIDTHS } from './lib/constants'

let bootstrapped = false

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '')
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  }
}

export default function App(): JSX.Element {
  const loaded = useStore((s) => s.loaded)
  const init = useStore((s) => s.init)
  const flushSaves = useStore((s) => s.flushSaves)
  const settings = useStore((s) => s.settings)

  useEffect(() => {
    if (bootstrapped) return
    bootstrapped = true
    void init()
  }, [init])

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = settings.theme
    root.dataset.density = settings.density
    root.dataset.motion = settings.reduceMotion ? 'reduced' : 'full'
    root.dataset.texture = settings.backgroundTexture ? 'on' : 'off'
    const { r, g, b } = hexToRgb(settings.accent)
    root.style.setProperty('--accent', settings.accent)
    root.style.setProperty('--accent-soft', `rgba(${r}, ${g}, ${b}, 0.15)`)
    root.style.setProperty('--accent-line', `rgba(${r}, ${g}, ${b}, 0.42)`)
    root.style.setProperty('--font-ui', settings.uiFont)
    root.style.setProperty('--font-mono', settings.monoFont)
    root.style.setProperty('--editor-font-size', `${settings.fontSize}px`)
    root.style.setProperty('--preview-font-size', `${settings.previewFontSize}px`)
    root.style.setProperty('--editor-line-height', String(settings.editorLineHeight))
    root.style.setProperty('--focus-dim', String(settings.focusDim))
    root.style.setProperty('--content-width', CONTENT_WIDTHS[settings.contentWidth])
  }, [settings])

  useEffect(() => {
    const off = window.api.onMenuCommand((command) => useStore.getState().runCommand(command))
    return off
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      const s = useStore.getState()
      if (e.key === 'Escape') {
        if (s.palette) s.setPalette(null)
        else if (s.imagePicker) s.setImagePicker(null)
        else if (s.modal) s.setModal(null)
        return
      }
      const mod = e.ctrlKey || e.metaKey
      if (!mod) return
      const key = e.key.toLowerCase()
      if (e.shiftKey) {
        const map: Record<string, string> = {
          n: 'new-folder',
          f: 'search-all',
          x: 'strike',
          h: 'highlight',
          k: 'insert-image',
          '\\': 'toggle-right',
          '|': 'toggle-right',
          w: 'open-widgets',
        }
        const cmd = map[key]
        if (cmd) {
          e.preventDefault()
          s.runCommand(cmd)
        }
        return
      }
      const map: Record<string, string> = {
        n: 'new-note',
        o: 'quick-switcher',
        p: 'command-palette',
        s: 'save',
        b: 'bold',
        i: 'italic',
        k: 'link',
        e: s.settings.viewMode === 'preview' ? 'view-source' : 'view-preview',
        d: 'daily-note',
        ',': 'settings',
        '/': 'shortcuts',
        '\\': 'toggle-left',
        '1': 'view-source',
        '2': 'view-preview',
        '3': 'view-split',
      }
      const cmd = map[key]
      if (cmd) {
        e.preventDefault()
        s.runCommand(cmd)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    const handler = (): void => void flushSaves()
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [flushSaves])

  return (
    <>
      <div className={`app-shell${settings.focusMode ? ' focus-mode' : ''}`}>
        <TitleBar />
        <div className="app-body">
          {settings.showRibbon ? <Ribbon /> : null}
          <PanelGroup direction="horizontal" autoSaveId="novelty-layout" style={{ flex: 1, minWidth: 0 }}>
            {settings.showLeft ? (
              <Panel key="left" order={1} defaultSize={20} minSize={12} maxSize={42}>
                <Sidebar side="left" />
              </Panel>
            ) : null}
            {settings.showLeft ? <PanelResizeHandle key="left-handle" className="resize-handle" /> : null}
            <Panel key="main" order={2} minSize={28}>
              <MainArea />
            </Panel>
            {settings.showRight ? <PanelResizeHandle key="right-handle" className="resize-handle" /> : null}
            {settings.showRight ? (
              <Panel key="right" order={3} defaultSize={22} minSize={14} maxSize={44}>
                <Sidebar side="right" />
              </Panel>
            ) : null}
          </PanelGroup>
        </div>
        {settings.showStatusBar ? <StatusBar /> : null}
      </div>

      {!loaded ? (
        <div className="overlay scrim center">
          <div className="empty">
            <span className="empty-mark spin-slow">
              <span style={{ fontSize: 22 }}>◈</span>
            </span>
            <span className="empty-title">Opening your vault…</span>
          </div>
        </div>
      ) : null}

      <Palette />
      <Modals />
      <ImagePickerModal />
      <Toasts />
      <ContextMenuHost />
    </>
  )
}
