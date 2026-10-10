import { useCallback, useMemo, useRef, useState, type MouseEvent } from 'react'
import { useStore } from '../../store/useStore'
import { renderMarkdown } from '../../lib/markdown'

const SCHEME = 'novelty://'

export function Preview({ noteId, content }: { noteId: string; content: string }): JSX.Element {
  const notes = useStore((s) => s.notes)
  const images = useStore((s) => s.images)
  const openNote = useStore((s) => s.openNote)
  const toggleTask = useStore((s) => s.toggleTask)
  const setActiveTag = useStore((s) => s.setActiveTag)
  const setLeftPane = useStore((s) => s.setLeftPane)
  const toast = useStore((s) => s.toast)
  const ref = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState<string | null>(null)

  const imageMap = useMemo(() => new Map(images.map((img) => [img.id, img.dataUrl])), [images])
  const resolveImage = useCallback(
    (src: string): string | null => {
      if (src.startsWith(SCHEME)) return imageMap.get(src.slice(SCHEME.length)) ?? null
      return src
    },
    [imageMap],
  )

  const html = useMemo(() => renderMarkdown(content, resolveImage), [content, resolveImage])
  const titleSignature = useMemo(
    () =>
      notes
        .filter((n) => !n.trashed)
        .map((n) => `${n.title.toLowerCase()}:${n.id}`)
        .join('|'),
    [notes],
  )
  const titleMap = useMemo(() => new Map(notes.filter((n) => !n.trashed).map((n) => [n.title.toLowerCase(), n.id])), [titleSignature])

  const handleClick = (e: MouseEvent<HTMLDivElement>): void => {
    const target = e.target as HTMLElement

    const wiki = target.closest('.wiki-link') as HTMLElement | null
    if (wiki) {
      e.preventDefault()
      const title = wiki.dataset.wiki ?? ''
      const id = titleMap.get(title.toLowerCase())
      if (id) openNote(id)
      else toast(`No note titled “${title}” — create it?`, 'info')
      return
    }

    const tag = target.closest('.tag-pill') as HTMLElement | null
    if (tag) {
      e.preventDefault()
      setActiveTag(tag.dataset.tag ?? null)
      setLeftPane('tags')
      return
    }

    const anchor = target.closest('a[href^="http"]') as HTMLAnchorElement | null
    if (anchor) {
      e.preventDefault()
      void window.api.shell.openExternal(anchor.href)
      return
    }

    if (target.tagName === 'IMG' && target.classList.contains('md-image')) {
      const src = (target as HTMLImageElement).src
      if (src) {
        e.preventDefault()
        setZoom(src)
      }
      return
    }

    if (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'checkbox') {
      e.preventDefault()
      const boxes = Array.from(ref.current?.querySelectorAll('input[type="checkbox"]') ?? [])
      const index = boxes.indexOf(target as HTMLInputElement)
      if (index >= 0) toggleTask(noteId, index)
    }
  }

  return (
    <div className="preview-scroll">
      <div className="preview-inner">
        <div ref={ref} className="markdown-body" onClick={handleClick} dangerouslySetInnerHTML={{ __html: html }} />
      </div>
      {zoom ? (
        <div className="image-lightbox" onClick={() => setZoom(null)} title="Click to close">
          <img src={zoom} alt="" />
        </div>
      ) : null}
    </div>
  )
}
