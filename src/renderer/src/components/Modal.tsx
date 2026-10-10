import { X } from 'lucide-react'
import type { ReactNode } from 'react'

export function Modal({
  title,
  children,
  onClose,
  footer,
  small,
  wide,
}: {
  title: string
  children: ReactNode
  onClose: () => void
  footer?: ReactNode
  small?: boolean
  wide?: boolean
}): JSX.Element {
  return (
    <div className="overlay scrim center" onMouseDown={onClose}>
      <div className={`modal${small ? ' small' : ''}${wide ? ' wide' : ''}`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="icon-btn" aria-label="Close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-footer">{footer}</div> : null}
      </div>
    </div>
  )
}
