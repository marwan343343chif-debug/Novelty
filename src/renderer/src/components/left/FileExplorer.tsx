import { useMemo, useRef, useState } from 'react'
import {
  ChevronRight,
  FilePlus2,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  Pencil,
  Star,
  Copy,
  Trash2,
  Download,
  Palette,
} from 'lucide-react'
import { useStore } from '../../store/useStore'
import { openContextMenu, type MenuItem } from '../ContextMenu'
import { NOTE_COLORS } from '../../lib/colors'
import { exportNoteAsMarkdown } from '../../lib/files'
import type { Note, Folder as FolderType, SortMode } from '../../store/types'

function sortNotes(notes: Note[], sort: SortMode): Note[] {
  const arr = [...notes]
  arr.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    if (sort === 'name') return a.title.localeCompare(b.title)
    if (sort === 'created') return b.createdAt - a.createdAt
    return b.updatedAt - a.updatedAt
  })
  return arr
}

function sortFolders(folders: FolderType[]): FolderType[] {
  return [...folders].sort((a, b) => a.name.localeCompare(b.name))
}

export function FileExplorer(): JSX.Element {
  const notes = useStore((s) => s.notes)
  const folders = useStore((s) => s.folders)
  const activeId = useStore((s) => s.meta.activeNoteId)
  const sort = useStore((s) => s.settings.sort)
  const openNote = useStore((s) => s.openNote)
  const toggleFolder = useStore((s) => s.toggleFolder)
  const createNote = useStore((s) => s.createNote)
  const createFolder = useStore((s) => s.createFolder)
  const renameNote = useStore((s) => s.renameNote)
  const renameFolder = useStore((s) => s.renameFolder)
  const toggleFavorite = useStore((s) => s.toggleFavorite)
  const duplicateNote = useStore((s) => s.duplicateNote)
  const trashNote = useStore((s) => s.trashNote)
  const deleteFolder = useStore((s) => s.deleteFolder)
  const setNoteColor = useStore((s) => s.setNoteColor)
  const moveNote = useStore((s) => s.moveNote)
  const moveFolder = useStore((s) => s.moveFolder)

  const [editing, setEditing] = useState<{ id: string; type: 'note' | 'folder' } | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  const byFolder = useMemo(() => {
    const map = new Map<string, Note[]>()
    for (const note of notes) {
      if (note.trashed) continue
      const key = note.folderId ?? '__root__'
      const list = map.get(key) ?? []
      list.push(note)
      map.set(key, list)
    }
    return map
  }, [notes])

  const childFolders = useMemo(() => {
    const map = new Map<string, FolderType[]>()
    for (const folder of folders) {
      const key = folder.parentId ?? '__root__'
      const list = map.get(key) ?? []
      list.push(folder)
      map.set(key, list)
    }
    return map
  }, [folders])

  const noteMenu = (note: Note): MenuItem[] => [
    { label: 'Rename', icon: <Pencil size={14} />, onClick: () => setEditing({ id: note.id, type: 'note' }) },
    { label: note.favorite ? 'Remove favorite' : 'Add to favorites', icon: <Star size={14} />, onClick: () => toggleFavorite(note.id) },
    { label: 'Duplicate', icon: <Copy size={14} />, onClick: () => duplicateNote(note.id) },
    { label: 'Export as markdown', icon: <Download size={14} />, onClick: () => void exportNoteAsMarkdown(note) },
    { separator: true },
    ...NOTE_COLORS.slice(1).map((swatch) => ({
      label: `Color: ${swatch.name}`,
      icon: <span className="tree-dot" style={{ background: swatch.value, opacity: 0.35 }} />,
      onClick: () => setNoteColor(note.id, note.color === swatch.value ? '' : swatch.value),
    })),
    { separator: true },
    { label: 'Move to trash', icon: <Trash2 size={14} />, danger: true, onClick: () => trashNote(note.id) },
  ]

  const folderMenu = (folder: FolderType): MenuItem[] => [
    { label: 'New note', icon: <FilePlus2 size={14} />, onClick: () => createNote(folder.id) },
    { label: 'New subfolder', icon: <FolderPlus size={14} />, onClick: () => createFolder(folder.id) },
    { label: 'Rename', icon: <Pencil size={14} />, onClick: () => setEditing({ id: folder.id, type: 'folder' }) },
    { separator: true },
    { label: 'Delete folder', icon: <Trash2 size={14} />, danger: true, onClick: () => deleteFolder(folder.id) },
  ]

  const handleDrop = (targetFolderId: string | null, e: React.DragEvent): void => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(null)
    const noteId = e.dataTransfer.getData('application/x-novelty-note')
    const folderId = e.dataTransfer.getData('application/x-novelty-folder')
    if (noteId) moveNote(noteId, targetFolderId)
    else if (folderId && folderId !== targetFolderId) moveFolder(folderId, targetFolderId)
  }

  const renderFolder = (folder: FolderType, depth: number): JSX.Element => {
    const isEditing = editing?.id === folder.id && editing.type === 'folder'
    const childNotes = sortNotes(byFolder.get(folder.id) ?? [], sort)
    const subFolders = sortFolders(childFolders.get(folder.id) ?? [])
    return (
      <div key={folder.id}>
        <div
          className={`tree-row${dragOver === folder.id ? ' drop-target' : ''}`}
          style={{ paddingLeft: 6 + depth * 12 }}
          onClick={() => toggleFolder(folder.id)}
          onContextMenu={(e) => {
            e.preventDefault()
            openContextMenu(e.clientX, e.clientY, folderMenu(folder))
          }}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(folder.id)
          }}
          onDragLeave={() => setDragOver((current) => (current === folder.id ? null : current))}
          onDrop={(e) => handleDrop(folder.id, e)}
        >
          <span className={`tree-caret${folder.expanded ? ' open' : ''}`}>
            <ChevronRight size={13} />
          </span>
          <span className="tree-icon">{folder.expanded ? <FolderOpen size={15} /> : <Folder size={15} />}</span>
          {isEditing ? (
            <RenameInput
              value={folder.name}
              onCommit={(v) => {
                renameFolder(folder.id, v)
                setEditing(null)
              }}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <span className="tree-label">{folder.name}</span>
          )}
          <span className="tree-count">{childNotes.length + subFolders.length || ''}</span>
        </div>
        {folder.expanded ? (
          <div>
            {subFolders.map((f) => renderFolder(f, depth + 1))}
            {childNotes.map((n) => renderNoteAtDepth(n, depth + 1))}
          </div>
        ) : null}
      </div>
    )
  }

  const renderNoteAtDepth = (note: Note, depth: number): JSX.Element => {
    const isEditing = editing?.id === note.id && editing.type === 'note'
    return (
      <div
        key={note.id}
        className={`tree-row${activeId === note.id ? ' active' : ''}`}
        style={{ paddingLeft: 6 + depth * 12 + 18 }}
        draggable={!isEditing}
        onDragStart={(e) => {
          e.dataTransfer.setData('application/x-novelty-note', note.id)
          e.dataTransfer.effectAllowed = 'move'
        }}
        onClick={() => !isEditing && openNote(note.id)}
        onDoubleClick={() => setEditing({ id: note.id, type: 'note' })}
        onContextMenu={(e) => {
          e.preventDefault()
          openContextMenu(e.clientX, e.clientY, noteMenu(note))
        }}
      >
        {note.color ? <span className="tree-dot" style={{ background: note.color }} /> : null}
        <span className="tree-icon">
          <FileText size={14} />
        </span>
        {isEditing ? (
          <RenameInput
            value={note.title}
            onCommit={(v) => {
              renameNote(note.id, v)
              setEditing(null)
            }}
            onCancel={() => setEditing(null)}
          />
        ) : (
          <span className="tree-label">{note.title}</span>
        )}
        {note.favorite ? <Star size={11} style={{ color: 'var(--accent)' }} /> : null}
      </div>
    )
  }

  const rootNotes = sortNotes(byFolder.get('__root__') ?? [], sort)
  const rootFolders = sortFolders(childFolders.get('__root__') ?? [])
  const isEmpty = rootNotes.length === 0 && rootFolders.length === 0

  return (
    <div className="tree" ref={rootRef} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(null, e)}>
      {rootFolders.map((f) => renderFolder(f, 0))}
      {rootNotes.map((n) => renderNoteAtDepth(n, 0))}

      {isEmpty ? (
        <div className="pane-note" style={{ padding: '20px 10px', textAlign: 'center' }}>
          No notes yet. Create one to get started.
        </div>
      ) : null}

      <div style={{ display: 'flex', gap: 6, padding: '10px 6px 0' }}>
        <button className="btn btn-ghost" style={{ height: 26, flex: 1, fontSize: 12 }} onClick={() => createNote(null)}>
          <FilePlus2 size={13} /> Note
        </button>
        <button className="btn btn-ghost" style={{ height: 26, flex: 1, fontSize: 12 }} onClick={() => createFolder(null)}>
          <FolderPlus size={13} /> Folder
        </button>
      </div>
    </div>
  )
}

function RenameInput({ value, onCommit, onCancel }: { value: string; onCommit: (v: string) => void; onCancel: () => void }): JSX.Element {
  const [draft, setDraft] = useState(value)
  return (
    <input
      className="tree-label-input"
      value={draft}
      autoFocus
      spellCheck={false}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => onCommit(draft)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          onCommit(draft)
        } else if (e.key === 'Escape') {
          e.preventDefault()
          onCancel()
        }
      }}
    />
  )
}
