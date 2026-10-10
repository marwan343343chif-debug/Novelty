import { marked, type TokenizerAndRendererExtension } from 'marked'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js/lib/common'
import 'highlight.js/styles/github-dark.css'
import { escapeHtml, headingId } from './utils'

function esc(text: string): string {
  return escapeHtml(text)
}

const highlightExt: TokenizerAndRendererExtension = {
  name: 'highlight',
  level: 'inline',
  start(src: string) {
    return src.indexOf('==')
  },
  tokenizer(src: string) {
    const match = /^==([^=\n]+)==/.exec(src)
    if (match) {
      return { type: 'highlight', raw: match[0], text: match[1] }
    }
    return undefined
  },
  renderer(token) {
    return `<mark>${esc(token.text as string)}</mark>`
  },
}

const wikiExt: TokenizerAndRendererExtension = {
  name: 'wikilink',
  level: 'inline',
  start(src: string) {
    return src.indexOf('[[')
  },
  tokenizer(src: string) {
    const match = /^\[\[([^\][|#]+?)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/.exec(src)
    if (match) {
      const target = match[1].trim()
      const heading = match[2]?.trim()
      const alias = (match[3] ?? match[1]).trim()
      return { type: 'wikilink', raw: match[0], target, heading, alias }
    }
    return undefined
  },
  renderer(token) {
    const target = token.target as string
    const heading = token.heading as string | undefined
    const alias = token.alias as string
    const missing = token.missing ? ' wiki-missing' : ''
    return `<a href="#" class="wiki-link${missing}" data-wiki="${esc(target)}"${
      heading ? ` data-wiki-heading="${esc(heading)}"` : ''
    }>${esc(alias)}</a>`
  },
}

const tagExt: TokenizerAndRendererExtension = {
  name: 'tag',
  level: 'inline',
  start(src: string) {
    return src.indexOf('#')
  },
  tokenizer(src: string) {
    const match = /^#([\p{L}\p{N}][\p{L}\p{N}_/-]*)/u.exec(src)
    if (match && !/^\d+$/.test(match[1])) {
      return { type: 'tag', raw: match[0], tag: match[1] }
    }
    return undefined
  },
  renderer(token) {
    return `<a href="#" class="tag-pill" data-tag="${esc(token.tag as string)}">#${esc(token.tag as string)}</a>`
  },
}

marked.use({ extensions: [highlightExt, wikiExt, tagExt] })
marked.setOptions({ gfm: true, breaks: false })

function svg(inner: string): string {
  return `<svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`
}

const ICONS: Record<string, string> = {
  note: svg('<path d="M3.5 2.5h6l3 3v8h-9z"/><path d="M9.5 2.5v3h3"/>'),
  info: svg('<circle cx="8" cy="8" r="6.2"/><path d="M8 7.3v3.4"/><path d="M8 5.1h.01"/>'),
  tip: svg('<path d="M6 11.5a4 4 0 1 1 4 0v1.5H6z"/><path d="M6.8 14.5h2.4"/>'),
  warning: svg('<path d="M8 2.5 1.8 13.5h12.4z"/><path d="M8 6.4v3.1"/><path d="M8 11.7h.01"/>'),
  danger: svg('<path d="M5.2 1.8h5.6l3.4 3.4v5.6l-3.4 3.4H5.2L1.8 10.8V5.2z"/><path d="M8 5.5v3.2"/><path d="M8 10.9h.01"/>'),
  quote: svg('<path d="M6 4.5H3.5v3H6V10c0 1-.7 1.7-1.7 2M12.5 4.5H10v3h2.5V10c0 1-.7 1.7-1.7 2"/>'),
  example: svg(
    '<path d="M5.5 4.5h8M5.5 8h8M5.5 11.5h8"/><circle cx="2.8" cy="4.5" r=".7" fill="currentColor"/><circle cx="2.8" cy="8" r=".7" fill="currentColor"/><circle cx="2.8" cy="11.5" r=".7" fill="currentColor"/>',
  ),
  success: svg('<circle cx="8" cy="8" r="6.2"/><path d="M5.2 8.3 7 10.1l3.8-4"/>'),
  failure: svg('<circle cx="8" cy="8" r="6.2"/><path d="M5.8 5.8 10.2 10.2M10.2 5.8 5.8 10.2"/>'),
  question: svg('<circle cx="8" cy="8" r="6.2"/><path d="M6.2 6.3a1.9 1.9 0 1 1 2.6 1.7c-.5.3-.8.6-.8 1.2"/><path d="M8 11.4h.01"/>'),
  todo: svg('<rect x="2.5" y="2.5" width="11" height="11" rx="2"/><path d="M5.4 8.2 7.2 10l3.4-3.6"/>'),
}

const CALLOUT_TITLES: Record<string, string> = {
  note: 'Note',
  info: 'Info',
  tip: 'Tip',
  hint: 'Hint',
  warning: 'Warning',
  caution: 'Caution',
  danger: 'Danger',
  error: 'Error',
  quote: 'Quote',
  cite: 'Quote',
  example: 'Example',
  success: 'Success',
  check: 'Success',
  done: 'Done',
  failure: 'Failure',
  fail: 'Failure',
  missing: 'Missing',
  bug: 'Bug',
  question: 'Question',
  faq: 'Question',
  todo: 'Todo',
  abstract: 'Summary',
  summary: 'Summary',
  tldr: 'TL;DR',
}

function slugifyHeading(text: string, index: number): string {
  return headingId(text.replace(/[*_`~]/g, '').trim(), index)
}

let scratchDoc: Document | null = null

function getScratchDoc(): Document {
  if (!scratchDoc) scratchDoc = document.implementation.createHTMLDocument('novelty')
  return scratchDoc
}

function enhance(html: string, resolveImage?: (src: string) => string | null): string {
  const doc = getScratchDoc()
  const root = doc.body
  root.innerHTML = html

  let hIndex = 0
  root.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
    const id = slugifyHeading(h.textContent ?? '', hIndex++)
    h.id = id
  })

  if (resolveImage) {
    root.querySelectorAll('img').forEach((node) => {
      const img = node as HTMLImageElement
      const src = img.getAttribute('src') ?? ''
      const resolved = resolveImage(src)
      if (resolved) {
        img.setAttribute('src', resolved)
      } else {
        img.removeAttribute('src')
        img.classList.add('md-image-missing')
      }
      img.setAttribute('loading', 'lazy')
      img.setAttribute('decoding', 'async')
      img.classList.add('md-image')
    })
  }

  root.querySelectorAll('pre code').forEach((node) => {
    const code = node as HTMLElement
    const langClass = code.className.match(/language-([\w-]+)/)
    const lang = langClass?.[1]
    const source = code.textContent ?? ''
    try {
      const result = lang && hljs.getLanguage(lang) ? hljs.highlight(source, { language: lang }) : hljs.highlightAuto(source)
      code.innerHTML = result.value
      code.classList.add('hljs')
      if (lang) code.parentElement?.setAttribute('data-lang', lang)
    } catch {
      /* ignore highlighting failures */
    }
  })

  root.querySelectorAll('blockquote').forEach((bq) => {
    const first = bq.querySelector('p')
    if (!first) return
    const raw = first.textContent ?? ''
    const match = raw.match(/^\s*\[!(\w+)\]([+-])?\s*(.*)$/s)
    if (!match) return
    const type = match[1].toLowerCase()
    const foldable = match[2]
    const title = (match[3] || CALLOUT_TITLES[type] || 'Note').trim()
    bq.classList.add('callout', `callout-${type}`)
    if (foldable) bq.classList.add('callout-foldable')

    const header = doc.createElement('div')
    header.className = 'callout-title'
    const icon = doc.createElement('span')
    icon.className = 'callout-icon'
    icon.innerHTML = ICONS[type] ?? ICONS.note
    const label = doc.createElement('span')
    label.className = 'callout-label'
    label.textContent = title
    header.appendChild(icon)
    header.appendChild(label)
    bq.insertBefore(header, bq.firstChild)

    const remaining = match[3] ? '' : first.innerHTML.replace(/^\s*\[!\w+\][+-]?\s*/, '')
    if (remaining.trim()) {
      first.innerHTML = remaining
    } else {
      first.remove()
    }
  })

  root.querySelectorAll('a[href^="http"]').forEach((a) => {
    a.setAttribute('target', '_blank')
    a.setAttribute('rel', 'noopener noreferrer')
  })

  root.querySelectorAll('input[type="checkbox"]').forEach((box) => {
    box.removeAttribute('disabled')
    box.setAttribute('tabindex', '-1')
  })

  return root.innerHTML
}

const PURIFY_CONFIG = {
  ADD_ATTR: ['target', 'rel', 'data-wiki', 'data-wiki-heading', 'data-tag', 'data-lang'],
  ADD_TAGS: ['mark'],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|data):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
}

export function renderMarkdown(markdown: string, resolveImage?: (src: string) => string | null): string {
  const raw = marked.parse(markdown, { async: false }) as string
  const enhanced = enhance(raw, resolveImage)
  return DOMPurify.sanitize(enhanced, PURIFY_CONFIG)
}

export function renderMarkdownInline(markdown: string): string {
  const raw = marked.parseInline(markdown, { async: false }) as string
  return DOMPurify.sanitize(raw, PURIFY_CONFIG)
}
