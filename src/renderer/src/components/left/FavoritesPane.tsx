import { useMemo } from 'react'
import { FileText, Star } from 'lucide-react'
import { useStore } from '../../store/useStore'

export function FavoritesPane(): JSX.Element {
  const notes = useStore((s) => s.notes)
  const openNote = useStore((s) => s.openNote)
  const activeId = useStore((s) => s.meta.activeNoteId)

  const favorites = useMemo(() => notes.filter((n) => n.favorite && !n.trashed).sort((a, b) => b.updatedAt - a.updatedAt), [notes])

  if (favorites.length === 0) {
    return (
      <div className="pane-note" style={{ padding: 16 }}>
        No favorites yet. Hover a note in Files and add it to favorites, or press Ctrl/⌘ ⇧ the star.
      </div>
    )
  }

  return (
    <div className="tree" style={{ paddingTop: 8 }}>
      {favorites.map((note) => (
        <div
          key={note.id}
          className={`tree-row${activeId === note.id ? ' active' : ''}`}
          style={{ paddingLeft: 10 }}
          onClick={() => openNote(note.id)}
        >
          <span className="tree-icon" style={{ color: 'var(--accent)' }}>
            <Star size={14} fill="currentColor" />
          </span>
          <span className="tree-label">{note.title}</span>
          <FileText size={12} style={{ color: 'var(--text-faint)' }} />
        </div>
      ))}
    </div>
  )
}
