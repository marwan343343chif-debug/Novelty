import { useEffect, useState } from 'react'
import { Command, Minus, Search, Square, Copy, X, Plus, Feather } from 'lucide-react'
import { useStore } from '../store/useStore'
import { Tip } from './Tooltip'

export function TitleBar(): JSX.Element {
  const vaultName = useStore((s) => s.meta.vaultName)
  const setPalette = useStore((s) => s.setPalette)
  const createNote = useStore((s) => s.createNote)
  const [maximized, setMaximized] = useState(false)

  useEffect(() => {
    const off = window.api.win.onMaximizedChange(setMaximized)
    void window.api.win.isMaximized().then(setMaximized)
    return off
  }, [])

  return (
    <header className="titlebar">
      <div className="titlebar-brand no-drag">
        <span className="titlebar-mark">
          <Feather size={14} />
        </span>
        <span>Novelty</span>
      </div>
      <div className="titlebar-vault">{vaultName}</div>

      <div className="titlebar-center">
        <button className="titlebar-search no-drag" onClick={() => setPalette('quick')}>
          <Search size={13} />
          <span>Search notes…</span>
          <span className="kbd">{navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'} O</span>
        </button>
      </div>

      <div className="titlebar-right">
        <Tip label="New note" keys="Ctrl N" side="bottom">
          <button className="win-btn no-drag" aria-label="New note" onClick={() => createNote(null)}>
            <Plus size={16} />
          </button>
        </Tip>
        <Tip label="Command palette" keys="Ctrl P" side="bottom">
          <button className="win-btn no-drag" aria-label="Command palette" onClick={() => setPalette('command')}>
            <Command size={15} />
          </button>
        </Tip>
        <div className="win-controls no-drag">
          <button className="win-btn" aria-label="Minimize" onClick={() => window.api.win.minimize()} title="Minimize">
            <Minus size={15} />
          </button>
          <button
            className="win-btn"
            aria-label={maximized ? 'Restore' : 'Maximize'}
            onClick={() => window.api.win.toggleMaximize()}
            title={maximized ? 'Restore' : 'Maximize'}
          >
            {maximized ? <Copy size={13} /> : <Square size={12} />}
          </button>
          <button className="win-btn close" aria-label="Close" onClick={() => window.api.win.close()} title="Close">
            <X size={15} />
          </button>
        </div>
      </div>
    </header>
  )
}
