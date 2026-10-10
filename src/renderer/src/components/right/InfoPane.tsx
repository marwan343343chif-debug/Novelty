import { Calendar, Clock, FileText, Folder, Keyboard, Star, Trash2 } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { computeStats } from '../../lib/stats'
import { formatDateTime, relativeTime } from '../../lib/utils'
import { NOTE_COLORS } from '../../lib/colors'

export function InfoPane(): JSX.Element {
  const active = useStore((s) => s.notes.find((n) => n.id === s.meta.activeNoteId))
  const folders = useStore((s) => s.folders)
  const toggleFavorite = useStore((s) => s.toggleFavorite)
  const setNoteColor = useStore((s) => s.setNoteColor)
  const trashNote = useStore((s) => s.trashNote)
  const setActiveTag = useStore((s) => s.setActiveTag)
  const setLeftPane = useStore((s) => s.setLeftPane)

  if (!active)
    return (
      <div className="pane-note" style={{ padding: 16 }}>
        Open a note to inspect it.
      </div>
    )

  const stats = computeStats(active.content)
  const folder = active.folderId ? (folders.find((f) => f.id === active.folderId)?.name ?? '—') : 'Root'

  return (
    <div>
      <div className="info-grid">
        <Row icon={<FileText size={12} />} label="Title" value={active.title} />
        <Row icon={<Folder size={12} />} label="Folder" value={folder} />
        <Row icon={<Calendar size={12} />} label="Created" value={formatDateTime(active.createdAt)} />
        <Row icon={<Clock size={12} />} label="Modified" value={relativeTime(active.updatedAt)} />
        <Row icon={<Keyboard size={12} />} label="Words" value={String(stats.words)} />
        <Row icon={<Keyboard size={12} />} label="Characters" value={String(stats.chars)} />
        <Row icon={<Clock size={12} />} label="Reading" value={`${stats.reading} min`} />
      </div>

      <div className="link-group">
        <div className="link-group-title">Tags ({stats.tags.length})</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '4px 8px 10px' }}>
          {stats.tags.length === 0 ? <span className="pane-note">None</span> : null}
          {stats.tags.map((tag) => (
            <span
              key={tag}
              className="tag-pill"
              style={{ cursor: 'pointer' }}
              onClick={() => {
                setActiveTag(tag)
                setLeftPane('tags')
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      <div className="link-group">
        <div className="link-group-title">Color</div>
        <div className="swatch-grid" style={{ padding: '4px 10px 14px' }}>
          {NOTE_COLORS.map((swatch) => (
            <div
              key={swatch.name}
              className={`swatch${swatch.value ? '' : ' none'}${active.color === swatch.value || (!active.color && !swatch.value) ? ' active' : ''}`}
              style={swatch.value ? { background: swatch.value } : undefined}
              onClick={() => setNoteColor(active.id, swatch.value)}
              title={swatch.name}
            />
          ))}
        </div>
      </div>

      <div className="link-group" style={{ display: 'flex', gap: 6, padding: '8px 10px 20px' }}>
        <button className={`btn${active.favorite ? ' btn-primary' : ''}`} style={{ flex: 1 }} onClick={() => toggleFavorite(active.id)}>
          <Star size={14} fill={active.favorite ? 'currentColor' : 'none'} /> {active.favorite ? 'Favorited' : 'Favorite'}
        </button>
        <button className="btn btn-ghost" onClick={() => trashNote(active.id)} title="Move to trash">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

function Row({ icon, label, value }: { icon: JSX.Element; label: string; value: string }): JSX.Element {
  return (
    <div className="info-row">
      <span className="info-key" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon}
        {label}
      </span>
      <span className="info-val">{value}</span>
    </div>
  )
}
