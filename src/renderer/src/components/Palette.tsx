import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Command as CommandIcon,
  FilePlus2,
  FolderPlus,
  CalendarPlus,
  Search,
  Columns2,
  Eye,
  Pencil,
  PanelLeft,
  PanelRight,
  Focus,
  Type,
  Settings,
  Keyboard,
  Info,
  Download,
  Upload,
  FileDown,
  Bold,
  Italic,
  Strikethrough,
  Highlighter,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Link2,
  Brackets,
  Table,
  Minus,
  MessageSquare,
  Star,
  Trash2,
  RotateCcw,
  FileText,
  CornerDownLeft,
  Globe,
  LayoutList,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { fuzzySearchNotes } from '../lib/search'
import { relativeTime } from '../lib/utils'

interface CommandDef {
  id: string
  label: string
  group: string
  icon: JSX.Element
  keywords?: string
  danger?: boolean
}

const COMMANDS: CommandDef[] = [
  { id: 'new-note', label: 'New note', group: 'File', icon: <FilePlus2 size={15} />, keywords: 'create add' },
  { id: 'new-folder', label: 'New folder', group: 'File', icon: <FolderPlus size={15} />, keywords: 'create directory' },
  { id: 'daily-note', label: 'Open today’s daily note', group: 'File', icon: <CalendarPlus size={15} />, keywords: 'journal today' },
  { id: 'export-note', label: 'Export current note as markdown', group: 'File', icon: <Download size={15} /> },
  { id: 'export-vault', label: 'Export vault as JSON', group: 'File', icon: <Download size={15} /> },
  { id: 'export-markdown', label: 'Export all notes as markdown folder', group: 'File', icon: <FileDown size={15} /> },
  { id: 'import-vault', label: 'Import vault from JSON', group: 'File', icon: <Upload size={15} /> },
  { id: 'search-all', label: 'Search all notes', group: 'Navigate', icon: <Search size={15} />, keywords: 'find' },
  { id: 'quick-switcher', label: 'Quick switcher', group: 'Navigate', icon: <Search size={15} /> },
  { id: 'view-source', label: 'View: Source', group: 'View', icon: <Pencil size={15} /> },
  { id: 'view-split', label: 'View: Split', group: 'View', icon: <Columns2 size={15} /> },
  { id: 'view-preview', label: 'View: Preview', group: 'View', icon: <Eye size={15} /> },
  {
    id: 'open-widgets',
    label: 'Show writing widgets',
    group: 'View',
    icon: <LayoutList size={15} />,
    keywords: 'tasks clock timer calendar pomodoro',
  },
  { id: 'open-web', label: 'Show web search', group: 'View', icon: <Globe size={15} />, keywords: 'internet lookup summary' },
  { id: 'toggle-left', label: 'Toggle left sidebar', group: 'View', icon: <PanelLeft size={15} /> },
  { id: 'toggle-right', label: 'Toggle right sidebar', group: 'View', icon: <PanelRight size={15} /> },
  { id: 'focus-mode', label: 'Toggle focus mode', group: 'View', icon: <Focus size={15} /> },
  { id: 'typewriter-mode', label: 'Toggle typewriter mode', group: 'View', icon: <Type size={15} /> },
  { id: 'bold', label: 'Bold', group: 'Format', icon: <Bold size={15} /> },
  { id: 'italic', label: 'Italic', group: 'Format', icon: <Italic size={15} /> },
  { id: 'strike', label: 'Strikethrough', group: 'Format', icon: <Strikethrough size={15} /> },
  { id: 'highlight', label: 'Highlight', group: 'Format', icon: <Highlighter size={15} /> },
  { id: 'code', label: 'Inline code', group: 'Format', icon: <Code2 size={15} /> },
  { id: 'h1', label: 'Heading 1', group: 'Format', icon: <Heading1 size={15} /> },
  { id: 'h2', label: 'Heading 2', group: 'Format', icon: <Heading2 size={15} /> },
  { id: 'h3', label: 'Heading 3', group: 'Format', icon: <Heading3 size={15} /> },
  { id: 'bullet', label: 'Bullet list', group: 'Format', icon: <List size={15} /> },
  { id: 'numbered', label: 'Numbered list', group: 'Format', icon: <ListOrdered size={15} /> },
  { id: 'todo', label: 'Task list', group: 'Format', icon: <ListChecks size={15} /> },
  { id: 'quote', label: 'Quote', group: 'Format', icon: <Quote size={15} /> },
  { id: 'link', label: 'Insert link', group: 'Format', icon: <Link2 size={15} /> },
  { id: 'wikilink', label: 'Insert wiki link', group: 'Format', icon: <Brackets size={15} /> },
  { id: 'table', label: 'Insert table', group: 'Format', icon: <Table size={15} /> },
  { id: 'divider', label: 'Insert divider', group: 'Format', icon: <Minus size={15} /> },
  { id: 'callout', label: 'Insert callout', group: 'Format', icon: <MessageSquare size={15} /> },
  { id: 'toggle-favorite', label: 'Toggle favorite', group: 'Note', icon: <Star size={15} /> },
  { id: 'settings', label: 'Open settings', group: 'App', icon: <Settings size={15} /> },
  { id: 'shortcuts', label: 'Keyboard shortcuts', group: 'App', icon: <Keyboard size={15} /> },
  { id: 'about', label: 'About Novelty', group: 'App', icon: <Info size={15} /> },
  { id: 'delete-note', label: 'Move current note to trash', group: 'Danger', icon: <Trash2 size={15} />, danger: true },
  { id: 'reset-vault', label: 'Erase all vault data', group: 'Danger', icon: <RotateCcw size={15} />, danger: true },
]

function score(text: string, query: string): number {
  const lower = text.toLowerCase()
  const q = query.toLowerCase()
  if (!q) return 1
  if (lower.startsWith(q)) return 100
  if (lower.includes(q)) return 60
  let qi = 0
  for (let i = 0; i < lower.length && qi < q.length; i++) if (lower[i] === q[qi]) qi++
  return qi === q.length ? 20 : 0
}

export function Palette(): JSX.Element | null {
  const palette = useStore((s) => s.palette)
  if (!palette) return null
  return palette === 'command' ? <CommandPalette /> : <QuickSwitcher />
}

function useNav(count: number, onSelect: (index: number) => void): { index: number; onKeyDown: (e: React.KeyboardEvent) => void } {
  const [index, setIndex] = useState(0)
  useEffect(() => setIndex(0), [count])
  const onKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setIndex((i) => Math.min(count - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setIndex((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      onSelect(index)
    }
  }
  return { index: Math.max(0, Math.min(index, count - 1)), onKeyDown }
}

function CommandPalette(): JSX.Element {
  const setPalette = useStore((s) => s.setPalette)
  const runCommand = useStore((s) => s.runCommand)
  const resetVault = useStore((s) => s.resetVault)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => inputRef.current?.focus(), [])

  const results = useMemo(() => {
    const q = query.trim()
    const scored = COMMANDS.map((c) => ({
      c,
      s: Math.max(score(c.label, q), score(c.group, q) * 0.5, c.keywords ? score(c.keywords, q) * 0.4 : 0),
    }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s || a.c.group.localeCompare(b.c.group) || a.c.label.localeCompare(b.c.label))
    return scored.map((r) => r.c)
  }, [query])

  const nav = useNav(results.length, (i) => {
    const cmd = results[i]
    if (!cmd) return
    setPalette(null)
    if (cmd.id === 'reset-vault') void resetVault()
    else runCommand(cmd.id)
  })

  return (
    <Overlay onClose={() => setPalette(null)}>
      <div className="palette" onMouseDown={(e) => e.stopPropagation()} onKeyDown={nav.onKeyDown}>
        <div className="palette-input-wrap">
          <CommandIcon size={17} />
          <input
            ref={inputRef}
            className="palette-input"
            placeholder="Type a command…"
            value={query}
            spellCheck={false}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className="kbd">Esc</span>
        </div>
        <div className="palette-list">
          {results.length === 0 ? (
            <div className="palette-empty">No matching commands</div>
          ) : (
            results.map((cmd, i) => (
              <div
                key={cmd.id}
                className={`palette-item${i === nav.index ? ' active' : ''}`}
                onMouseEnter={() => undefined}
                onClick={() => {
                  setPalette(null)
                  if (cmd.id === 'reset-vault') void resetVault()
                  else runCommand(cmd.id)
                }}
              >
                <span className="palette-item-icon" style={cmd.danger ? { color: 'var(--red)' } : undefined}>
                  {cmd.icon}
                </span>
                <span className="palette-item-label">{cmd.label}</span>
                <span className="palette-item-sub">{cmd.group}</span>
              </div>
            ))
          )}
        </div>
        <div className="palette-footer">
          <span>
            <span className="kbd">↑</span> <span className="kbd">↓</span> navigate
          </span>
          <span>
            <span className="kbd">↵</span> run
          </span>
          <span style={{ marginLeft: 'auto' }}>{results.length} commands</span>
        </div>
      </div>
    </Overlay>
  )
}

function QuickSwitcher(): JSX.Element {
  const notes = useStore((s) => s.notes)
  const folders = useStore((s) => s.folders)
  const openNote = useStore((s) => s.openNote)
  const setPalette = useStore((s) => s.setPalette)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => inputRef.current?.focus(), [])

  const results = useMemo(() => fuzzySearchNotes(notes, query, 40), [notes, query])

  const nav = useNav(results.length, (i) => {
    const note = results[i]
    if (!note) return
    setPalette(null)
    openNote(note.id)
  })

  const folderName = (id: string | null): string => {
    if (!id) return 'Root'
    const parts: string[] = []
    let current = folders.find((f) => f.id === id)
    while (current) {
      parts.unshift(current.name)
      current = current.parentId ? folders.find((f) => f.id === current!.parentId) : undefined
    }
    return parts.join(' / ')
  }

  return (
    <Overlay onClose={() => setPalette(null)}>
      <div className="palette" onMouseDown={(e) => e.stopPropagation()} onKeyDown={nav.onKeyDown}>
        <div className="palette-input-wrap">
          <Search size={17} />
          <input
            ref={inputRef}
            className="palette-input"
            placeholder="Jump to a note…"
            value={query}
            spellCheck={false}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className="kbd">Esc</span>
        </div>
        <div className="palette-list">
          {results.length === 0 ? (
            <div className="palette-empty">No notes found</div>
          ) : (
            results.map((note, i) => (
              <div
                key={note.id}
                className={`palette-item${i === nav.index ? ' active' : ''}`}
                onClick={() => {
                  setPalette(null)
                  openNote(note.id)
                }}
              >
                <span className="palette-item-icon">
                  <FileText size={15} />
                </span>
                <span className="palette-item-label">{note.title}</span>
                <span className="palette-item-sub">
                  {folderName(note.folderId)} · {relativeTime(note.updatedAt)}
                </span>
              </div>
            ))
          )}
        </div>
        <div className="palette-footer">
          <span>
            <span className="kbd">↵</span> open
          </span>
          <span>
            <CornerDownLeft size={11} />
          </span>
          <span style={{ marginLeft: 'auto' }}>{results.length} notes</span>
        </div>
      </div>
    </Overlay>
  )
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }): JSX.Element {
  return (
    <div className="overlay" onMouseDown={onClose}>
      {children}
    </div>
  )
}
