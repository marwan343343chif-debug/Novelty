import { useMemo } from 'react'
import { FileText } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { relativeTime } from '../../lib/utils'

export function RecentPane(): JSX.Element {
  const notes = useStore((s) => s.notes)
  const openNote = useStore((s) => s.openNote)
  const activeId = useStore((s) => s.meta.activeNoteId)

  const recent = useMemo(
    () =>
      notes
        .filter((n) => !n.trashed)
        .sort((a, b) => b.openedAt - a.openedAt)
        .slice(0, 40),
    [notes],
  )

  return (
    <div className="tree" style={{ paddingTop: 8 }}>
      {recent.map((note) => (
        <div
          key={note.id}
          className={`tree-row${activeId === note.id ? ' active' : ''}`}
          style={{ paddingLeft: 10 }}
          onClick={() => openNote(note.id)}
        >
          <span className="tree-icon">
            <FileText size={14} />
          </span>
          <span className="tree-label">{note.title}</span>
          <span className="tree-count">{relativeTime(note.openedAt)}</span>
        </div>
      ))}
    </div>
  )
}
