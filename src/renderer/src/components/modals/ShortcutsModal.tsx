import { useStore } from '../../store/useStore'
import { Modal } from '../Modal'
import { SHORTCUTS } from '../../lib/constants'

export function ShortcutsModal(): JSX.Element {
  const setModal = useStore((s) => s.setModal)
  const groups = Array.from(new Set(SHORTCUTS.map((s) => s.group)))

  return (
    <Modal title="Keyboard shortcuts" onClose={() => setModal(null)}>
      {groups.map((group) => (
        <div key={group} className="shortcut-group">
          <div className="settings-section-title">{group}</div>
          {SHORTCUTS.filter((s) => s.group === group).map((s) => (
            <div key={s.label} className="shortcut-row">
              <span>{s.label}</span>
              <span className="kbd">{s.keys}</span>
            </div>
          ))}
        </div>
      ))}
    </Modal>
  )
}
