import { CheckCircle2, Info, XCircle } from 'lucide-react'
import { useStore } from '../store/useStore'

export function Toasts(): JSX.Element {
  const toasts = useStore((s) => s.toasts)
  const dismiss = useStore((s) => s.dismissToast)

  return (
    <div className="toasts">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`} onClick={() => dismiss(t.id)}>
          <span className="toast-icon">
            {t.type === 'success' ? <CheckCircle2 size={16} /> : t.type === 'error' ? <XCircle size={16} /> : <Info size={16} />}
          </span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}
