import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export interface MenuItem {
  label?: string
  icon?: ReactNode
  onClick?: () => void
  danger?: boolean
  shortcut?: string
  separator?: boolean
  disabled?: boolean
}

interface MenuState {
  x: number
  y: number
  items: MenuItem[]
}

let setMenuState: ((state: MenuState | null) => void) | null = null

export function openContextMenu(x: number, y: number, items: MenuItem[]): void {
  setMenuState?.({ x, y, items })
}

export function ContextMenuHost(): ReactNode {
  const [state, setState] = useState<MenuState | null>(null)

  useEffect(() => {
    setMenuState = setState
    return () => {
      setMenuState = null
    }
  }, [])

  useEffect(() => {
    if (!state) return
    const close = (): void => setState(null)
    window.addEventListener('click', close)
    window.addEventListener('resize', close)
    window.addEventListener('scroll', close, true)
    window.addEventListener('blur', close)
    return () => {
      window.removeEventListener('click', close)
      window.removeEventListener('resize', close)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('blur', close)
    }
  }, [state])

  if (!state) return null

  const width = 224
  const height = state.items.reduce((acc, item) => acc + (item.separator ? 9 : 32), 12)
  const left = Math.min(state.x, window.innerWidth - width - 8)
  const top = Math.min(state.y, window.innerHeight - height - 8)

  return createPortal(
    <div className="context-menu" style={{ left, top, width }} onClick={(e) => e.stopPropagation()}>
      {state.items.map((item, i) =>
        item.separator ? (
          <div key={i} className="context-sep" />
        ) : (
          <div
            key={i}
            className={`context-item${item.danger ? ' danger' : ''}`}
            style={item.disabled ? { opacity: 0.4, pointerEvents: 'none' } : undefined}
            onClick={() => {
              setState(null)
              item.onClick?.()
            }}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.shortcut ? <span className="kbd">{item.shortcut}</span> : null}
          </div>
        ),
      )}
    </div>,
    document.body,
  )
}
