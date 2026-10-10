import { useState } from 'react'
import {
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
  Palette,
  Columns2,
  Eye,
  Pencil,
  ImagePlus,
  Image as ImageIcon,
  X,
} from 'lucide-react'
import { useStore } from '../../store/useStore'
import { bus } from '../../lib/bus'
import { relativeTime } from '../../lib/utils'
import { TEXT_COLORS } from '../../lib/colors'
import type { Note, ViewMode } from '../../store/types'

export function EditorHeader({ note }: { note: Note }): JSX.Element {
  const renameNote = useStore((s) => s.renameNote)
  const viewMode = useStore((s) => s.settings.viewMode)
  const showToolbar = useStore((s) => s.settings.showToolbar)
  const setSettings = useStore((s) => s.setSettings)
  const setImagePicker = useStore((s) => s.setImagePicker)
  const setNoteCover = useStore((s) => s.setNoteCover)
  const cover = useStore((s) => s.notes.find((n) => n.id === note.id)?.cover)
  const coverImage = useStore((s) => s.images.find((i) => i.id === cover))
  const [showColor, setShowColor] = useState(false)

  const emit = (channel: string): void => bus.emit(`editor:${channel}`)

  const viewModes: { mode: ViewMode; icon: JSX.Element; label: string }[] = [
    { mode: 'source', icon: <Pencil size={13} />, label: 'Source' },
    { mode: 'split', icon: <Columns2 size={13} />, label: 'Split' },
    { mode: 'preview', icon: <Eye size={13} />, label: 'Preview' },
  ]

  return (
    <div className="doc-header">
      {coverImage ? (
        <div className="doc-cover" style={{ objectPosition: `center ${note.coverPosition ?? 50}%` }}>
          <img src={coverImage.dataUrl} alt="" />
          <button className="doc-cover-remove" title="Remove cover" onClick={() => setNoteCover(note.id, null)}>
            <X size={14} />
          </button>
        </div>
      ) : null}
      <div className="doc-title-row">
        <input
          className="doc-title-input"
          value={note.title}
          spellCheck={false}
          placeholder="Untitled"
          onChange={(e) => renameNote(note.id, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
          }}
        />
        <span className="doc-meta">
          <span>{relativeTime(note.updatedAt)}</span>
        </span>
      </div>

      {showToolbar ? (
        <div className="toolbar">
          <ToolBtn label="Bold" keys="Ctrl B" onClick={() => emit('bold')}>
            <Bold size={15} />
          </ToolBtn>
          <ToolBtn label="Italic" keys="Ctrl I" onClick={() => emit('italic')}>
            <Italic size={15} />
          </ToolBtn>
          <ToolBtn label="Strikethrough" onClick={() => emit('strike')}>
            <Strikethrough size={15} />
          </ToolBtn>
          <ToolBtn label="Highlight" onClick={() => emit('highlight')}>
            <Highlighter size={15} />
          </ToolBtn>
          <ToolBtn label="Inline code" onClick={() => emit('code')}>
            <Code2 size={15} />
          </ToolBtn>

          <span className="toolbar-sep" />
          <ToolBtn label="Heading 1" onClick={() => emit('h1')}>
            <Heading1 size={15} />
          </ToolBtn>
          <ToolBtn label="Heading 2" onClick={() => emit('h2')}>
            <Heading2 size={15} />
          </ToolBtn>
          <ToolBtn label="Heading 3" onClick={() => emit('h3')}>
            <Heading3 size={15} />
          </ToolBtn>

          <span className="toolbar-sep" />
          <ToolBtn label="Bullet list" onClick={() => emit('bullet')}>
            <List size={15} />
          </ToolBtn>
          <ToolBtn label="Numbered list" onClick={() => emit('numbered')}>
            <ListOrdered size={15} />
          </ToolBtn>
          <ToolBtn label="Task list" onClick={() => emit('todo')}>
            <ListChecks size={15} />
          </ToolBtn>
          <ToolBtn label="Quote" onClick={() => emit('quote')}>
            <Quote size={15} />
          </ToolBtn>

          <span className="toolbar-sep" />
          <ToolBtn label="Link" onClick={() => emit('link')}>
            <Link2 size={15} />
          </ToolBtn>
          <ToolBtn label="Wiki link" onClick={() => emit('wikilink')}>
            <Brackets size={15} />
          </ToolBtn>
          <ToolBtn label="Table" onClick={() => emit('table')}>
            <Table size={15} />
          </ToolBtn>
          <ToolBtn label="Callout" onClick={() => emit('callout')}>
            <MessageSquare size={15} />
          </ToolBtn>
          <ToolBtn label="Divider" onClick={() => emit('divider')}>
            <Minus size={15} />
          </ToolBtn>

          <span className="toolbar-sep" />
          <ToolBtn label="Insert image" keys="Ctrl ⇧ K" onClick={() => setImagePicker('insert')}>
            <ImagePlus size={15} />
          </ToolBtn>
          <ToolBtn label="Set cover image" onClick={() => setImagePicker('cover')}>
            <ImageIcon size={15} />
          </ToolBtn>

          <span className="relative" style={{ position: 'relative' }}>
            <ToolBtn label="Text color" onClick={() => setShowColor((v) => !v)} active={showColor}>
              <Palette size={15} />
            </ToolBtn>
            {showColor ? (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setShowColor(false)} />
                <div className="context-menu" style={{ position: 'absolute', top: 32, left: 0, width: 168, zIndex: 50 }}>
                  <div className="swatch-grid" style={{ padding: 8 }}>
                    {TEXT_COLORS.map((color) => (
                      <div
                        key={color.name}
                        className="swatch"
                        title={color.name}
                        aria-label={`${color.name} color`}
                        style={{ background: color.value }}
                        onClick={() => {
                          bus.emit('editor:color', { color: color.value })
                          setShowColor(false)
                        }}
                      />
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </span>

          <div className="toolbar-spacer" />

          <div className="toolbar-viewmodes">
            {viewModes.map((vm) => (
              <button
                key={vm.mode}
                className={viewMode === vm.mode ? 'active' : ''}
                aria-label={vm.label}
                aria-pressed={viewMode === vm.mode}
                title={vm.label}
                onClick={() => setSettings({ viewMode: vm.mode })}
              >
                {vm.icon}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function ToolBtn({
  label,
  keys,
  onClick,
  active,
  children,
}: {
  label: string
  keys?: string
  onClick: () => void
  active?: boolean
  children: JSX.Element
}): JSX.Element {
  return (
    <button className={`toolbar-btn${active ? ' active' : ''}`} title={keys ? `${label} (${keys})` : label} onClick={onClick}>
      {children}
    </button>
  )
}
