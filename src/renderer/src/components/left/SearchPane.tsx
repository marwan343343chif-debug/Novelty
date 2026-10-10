import { useEffect, useMemo, useRef, useState } from 'react'
import { FileText, Search, X } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { searchNotes } from '../../lib/search'

export function SearchPane(): JSX.Element {
  const notes = useStore((s) => s.notes)
  const openNote = useStore((s) => s.openNote)
  const activeId = useStore((s) => s.meta.activeNoteId)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const results = useMemo(() => searchNotes(notes, query), [notes, query])

  return (
    <div className="pane-pad">
      <div className="search-box">
        <Search size={14} />
        <input
          ref={inputRef}
          value={query}
          placeholder="Search all notes…"
          spellCheck={false}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && results[0]) openNote(results[0].noteId)
          }}
        />
        {query ? (
          <button className="icon-btn" aria-label="Clear search" style={{ width: 18, height: 18 }} onClick={() => setQuery('')}>
            <X size={13} />
          </button>
        ) : null}
      </div>

      {query && (
        <div className="pane-note">
          {results.length} result{results.length === 1 ? '' : 's'}
        </div>
      )}
      {!query && <div className="pane-note">Type to search across every note in the vault.</div>}

      <div className="result-list" style={{ padding: '0 0 20px' }}>
        {results.map((r) => (
          <div key={r.noteId} className={`result${activeId === r.noteId ? ' active' : ''}`} onClick={() => openNote(r.noteId)}>
            <div className="result-title">
              <FileText size={13} />
              {r.title}
            </div>
            <div className="result-snippet" dangerouslySetInnerHTML={{ __html: r.snippet }} />
          </div>
        ))}
      </div>
    </div>
  )
}
