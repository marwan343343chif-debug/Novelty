import { useMemo } from 'react'
import { FileText, Plus, X, Copy, Star, Trash2, XCircle, Home } from 'lucide-react'
import { useStore } from '../store/useStore'
import { loadable } from './Loadable'
import { EditorHeader } from './editor/EditorHeader'
import { HomeView } from './HomeView'
import { openContextMenu } from './ContextMenu'

interface MarkdownEditorProps {
  noteId: string
  value: string
  onChange: (content: string) => void
}

interface PreviewProps {
  noteId: string
  content: string
}

const MarkdownEditor = loadable<MarkdownEditorProps>(() => import('./editor/MarkdownEditor').then((m) => ({ default: m.MarkdownEditor })))
const Preview = loadable<PreviewProps>(() => import('./editor/Preview').then((m) => ({ default: m.Preview })))

export function MainArea(): JSX.Element {
  const notes = useStore((s) => s.notes)
  const openTabIds = useStore((s) => s.meta.openTabIds)
  const activeId = useStore((s) => s.meta.activeNoteId)
  const viewMode = useStore((s) => s.settings.viewMode)
  const openNote = useStore((s) => s.openNote)
  const closeNote = useStore((s) => s.closeNote)
  const closeOtherTabs = useStore((s) => s.closeOtherTabs)
  const closeAllTabs = useStore((s) => s.closeAllTabs)
  const createNote = useStore((s) => s.createNote)
  const setNoteContent = useStore((s) => s.setNoteContent)
  const toggleFavorite = useStore((s) => s.toggleFavorite)
  const duplicateNote = useStore((s) => s.duplicateNote)
  const trashNote = useStore((s) => s.trashNote)
  const goHome = useStore((s) => s.goHome)

  const noteById = useMemo(() => new Map(notes.map((n) => [n.id, n])), [notes])
  const tabs = useMemo(
    () => openTabIds.map((id) => noteById.get(id)).filter((n): n is NonNullable<typeof n> => !!n),
    [openTabIds, noteById],
  )
  const note = activeId ? (noteById.get(activeId) ?? null) : null

  return (
    <div className="main">
      <div className="tabbar">
        <button className={`tab-home${!activeId ? ' active' : ''}`} title="Home" onClick={() => goHome()}>
          <Home size={15} />
        </button>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`tab${tab.id === activeId ? ' active' : ''}`}
            onClick={() => openNote(tab.id)}
            onAuxClick={(e) => {
              if (e.button === 1) closeNote(tab.id)
            }}
            onContextMenu={(e) => {
              e.preventDefault()
              openContextMenu(e.clientX, e.clientY, [
                { label: 'Close', icon: <X size={14} />, onClick: () => closeNote(tab.id) },
                { label: 'Close others', icon: <XCircle size={14} />, onClick: () => closeOtherTabs(tab.id) },
                { label: 'Close all', icon: <XCircle size={14} />, onClick: () => closeAllTabs() },
                { separator: true },
                {
                  label: tab.favorite ? 'Remove favorite' : 'Add favorite',
                  icon: <Star size={14} />,
                  onClick: () => toggleFavorite(tab.id),
                },
                { label: 'Duplicate', icon: <Copy size={14} />, onClick: () => duplicateNote(tab.id) },
                { separator: true },
                { label: 'Move to trash', icon: <Trash2 size={14} />, danger: true, onClick: () => trashNote(tab.id) },
              ])
            }}
          >
            <FileText size={13} style={{ color: 'var(--text-faint)', flex: '0 0 auto' }} />
            <span className="tab-title">{tab.title}</span>
            <span
              className="tab-close"
              onClick={(e) => {
                e.stopPropagation()
                closeNote(tab.id)
              }}
            >
              <X size={13} />
            </span>
          </div>
        ))}
        <button className="tab-new" title="New note" onClick={() => createNote(null)}>
          <Plus size={15} />
        </button>
      </div>

      {note ? (
        <div className="editor-col">
          <EditorHeader note={note} />
          <div className="content-area">
            {viewMode !== 'preview' ? (
              <div className="pane-half">
                <MarkdownEditor noteId={note.id} value={note.content} onChange={(content) => setNoteContent(note.id, content)} />
              </div>
            ) : null}
            {viewMode !== 'source' ? (
              <div className="pane-half">
                <Preview noteId={note.id} content={note.content} />
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <HomeView />
      )}
    </div>
  )
}
