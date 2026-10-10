import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../lib/utils'

interface TipProps {
  label: string
  keys?: string
  side?: 'top' | 'bottom'
  children: ReactNode
}

export function Tip({ label, keys, side = 'bottom', children }: TipProps): ReactNode {
  const ref = useRef<HTMLSpanElement>(null)
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!visible || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    setPos({
      x: rect.left + rect.width / 2,
      y: side === 'bottom' ? rect.bottom + 6 : rect.top - 6,
    })
  }, [visible, side])

  return (
    <span
      ref={ref}
      className="tip-anchor"
      style={{ display: 'contents' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onMouseDown={() => setVisible(false)}
    >
      {children}
      {visible &&
        createPortal(
          <div
            className="tooltip"
            style={{
              left: pos.x,
              top: pos.y,
              transform: `translate(-50%, ${side === 'bottom' ? '0' : '-100%'})`,
            }}
          >
            {label}
            {keys ? <span style={{ marginLeft: 6, opacity: 0.6 }}>{keys}</span> : null}
          </div>,
          document.body,
        )}
    </span>
  )
}

export function cx(...args: Parameters<typeof cn>): string {
  return cn(...args)
}
