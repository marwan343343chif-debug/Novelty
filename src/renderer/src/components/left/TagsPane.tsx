import { useMemo, useState } from 'react'
import { ChevronRight, FileText } from 'lucide-react'
import { useStore } from '../../store/useStore'

export function TagsPane(): JSX.Element {
  const notes = useStore((s) => s.notes)
  const openNote = useStore((s) => s.openNote)
  const activeId = useStore((s) => s.meta.activeNoteId)
  const [selected, setSelected] = useState<string | null>(null)

  const tagMap = useMemo(() => {
    const map = new Map<string, typeof notes>()
    for (const note of notes) {
      if (note.trashed) continue
      for (const tag of note.tags) {
        const list = map.get(tag) ?? []
        list.push(note)
        map.set(tag, list)
      }
    }
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
  }, [notes])

  if (tagMap.length === 0) {
    return (
      <div className="pane-note" style={{ padding: 16 }}>
        No tags yet. Add #tags inside a note and they appear here.
      </div>
    )
  }

  return (
    <div className="tag-list">
      {tagMap.map(([tag, list]) => {
        const isOpen = selected === tag
        return (
          <div key={tag}>
            <div className={`tag-row${isOpen ? ' active' : ''}`} onClick={() => setSelected(isOpen ? null : tag)}>
              <ChevronRight size={13} style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform var(--dur)' }} />
              <span className="tag-hash">#</span>
              <span>{tag}</span>
              <span className="tag-count">{list.length}</span>
            </div>
            {isOpen ? (
              <div style={{ paddingLeft: 8 }}>
                {list.map((note) => (
                  <div
                    key={note.id}
                    className={`tree-row${activeId === note.id ? ' active' : ''}`}
                    style={{ paddingLeft: 16 }}
                    onClick={() => openNote(note.id)}
                  >
                    <span className="tree-icon">
                      <FileText size={13} />
                    </span>
                    <span className="tree-label">{note.title}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
