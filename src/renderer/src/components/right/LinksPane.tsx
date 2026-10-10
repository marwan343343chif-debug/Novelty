import { useMemo } from 'react'
import { FileText, Link2, Link2Off } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { extractWikiLinks } from '../../lib/stats'
import { escapeRegExp } from '../../lib/utils'

export function LinksPane(): JSX.Element {
  const notes = useStore((s) => s.notes)
  const active = useStore((s) => s.notes.find((n) => n.id === s.meta.activeNoteId))
  const openNote = useStore((s) => s.openNote)

  const linkSignature = useMemo(() => {
    const parts: string[] = [active?.id ?? '', active?.title ?? '']
    for (const n of notes) {
      if (n.trashed) continue
      const links = n.content.match(/\[\[[^\]]*\]\]/g)
      parts.push(`${n.id}:${n.title}:${links ? links.join(',') : ''}`)
    }
    return parts.join('|')
  }, [notes, active])

  const { outgoing, backlinks } = useMemo(() => {
    if (!active)
      return {
        outgoing: [] as { title: string; exists: boolean; id?: string }[],
        backlinks: [] as { id: string; title: string; context: string }[],
      }
    const titleMap = new Map(notes.filter((n) => !n.trashed).map((n) => [n.title.toLowerCase(), n]))
    const outgoing = extractWikiLinks(active.content).map((title) => {
      const match = titleMap.get(title.toLowerCase())
      return { title, exists: !!match, id: match?.id }
    })
    const re = new RegExp(`\\[\\[\\s*${escapeRegExp(active.title)}\\s*(#[^\\]|]*)?(\\|[^\\]]*)?\\]\\]`, 'i')
    const backlinks = notes
      .filter((n) => n.id !== active.id && !n.trashed && re.test(n.content))
      .map((n) => {
        const idx = n.content.search(re)
        const context = n.content.slice(Math.max(0, idx - 40), idx + 80).replace(/\s+/g, ' ')
        return { id: n.id, title: n.title, context }
      })
    return { outgoing, backlinks }
  }, [linkSignature])

  if (!active)
    return (
      <div className="pane-note" style={{ padding: 16 }}>
        Open a note to see its links.
      </div>
    )

  return (
    <div>
      <div className="link-group">
        <div className="link-group-title">Outgoing ({outgoing.length})</div>
        {outgoing.length === 0 ? <div className="pane-note">No outgoing links.</div> : null}
        {outgoing.map((link, i) => (
          <div
            key={`${link.title}-${i}`}
            className="backlink"
            onClick={() => (link.exists && link.id ? openNote(link.id) : undefined)}
            style={{ opacity: link.exists ? 1 : 0.6, cursor: link.exists ? 'pointer' : 'default' }}
          >
            <span className="backlink-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {link.exists ? <Link2 size={12} style={{ color: 'var(--accent)' }} /> : <Link2Off size={12} />}
              {link.title}
            </span>
          </div>
        ))}
      </div>

      <div className="link-group">
        <div className="link-group-title">Backlinks ({backlinks.length})</div>
        {backlinks.length === 0 ? <div className="pane-note">Nothing links here yet.</div> : null}
        {backlinks.map((link) => (
          <div key={link.id} className="backlink" onClick={() => openNote(link.id)}>
            <span className="backlink-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileText size={12} />
              {link.title}
            </span>
            <span className="backlink-context">{link.context}…</span>
          </div>
        ))}
      </div>
    </div>
  )
}
