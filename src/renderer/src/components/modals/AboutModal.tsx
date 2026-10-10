import { useEffect, useState } from 'react'
import { Feather } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { Modal } from '../Modal'

export function AboutModal(): JSX.Element {
  const setModal = useStore((s) => s.setModal)
  const notes = useStore((s) => s.notes)
  const [version, setVersion] = useState('1.0.0')

  useEffect(() => {
    void window.api.app.version().then(setVersion)
  }, [])

  return (
    <Modal title="About Novelty" onClose={() => setModal(null)} small>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center', padding: '8px 0 4px' }}>
        <span className="titlebar-mark" style={{ width: 46, height: 46, borderRadius: 14 }}>
          <Feather size={24} />
        </span>
        <div style={{ fontSize: 18, fontWeight: 650 }}>Novelty</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 12.5, maxWidth: 320, lineHeight: 1.6 }}>
          A premium markdown studio for chapters, notes, and everything in between. Local-first, offline, and entirely yours.
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <span className="badge">v{version}</span>
          <span className="badge">{notes.filter((n) => !n.trashed).length} notes</span>
        </div>
        <div style={{ color: 'var(--text-faint)', fontSize: 11, marginTop: 6 }}>Built with Electron, React, CodeMirror & marked.</div>
      </div>
    </Modal>
  )
}
