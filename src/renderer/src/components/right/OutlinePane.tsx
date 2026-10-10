import { useMemo } from 'react'
import { ListTree } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { buildOutline } from '../../lib/stats'
import { bus } from '../../lib/bus'

export function OutlinePane(): JSX.Element {
  const content = useStore((s) => s.notes.find((n) => n.id === s.meta.activeNoteId)?.content ?? '')
  const outline = useMemo(() => buildOutline(content), [content])

  if (outline.length === 0) {
    return (
      <div className="pane-note" style={{ padding: 16 }}>
        No headings yet. Add a <span className="mono">#</span> heading and the outline fills in.
      </div>
    )
  }

  return (
    <div className="outline-list">
      {outline.map((item, i) => (
        <button
          key={`${item.id}-${i}`}
          className="outline-item"
          style={{ paddingLeft: 12 + (item.level - 1) * 14, fontWeight: item.level <= 2 ? 600 : 400 }}
          onClick={() => bus.emit('editor:goto-heading', item)}
        >
          <span style={{ color: 'var(--text-faint)', marginRight: 7 }}>
            <ListTree size={12} />
          </span>
          {item.text}
        </button>
      ))}
    </div>
  )
}
