import type { Completion, CompletionContext, CompletionResult } from '@codemirror/autocomplete'
import type { EditorView } from '@codemirror/view'
import { useStore } from '../../store/useStore'

function place(view: EditorView, from: number, to: number, insert: string, cursorOffset = insert.length): void {
  view.dispatch({
    changes: { from, to, insert },
    selection: { anchor: from + cursorOffset },
  })
}

interface SlashItem {
  label: string
  detail: string
  build: (view: EditorView, from: number, to: number) => void
}

const SLASH_ITEMS: SlashItem[] = [
  { label: 'Heading 1', detail: '# ', build: (v, f, t) => place(v, f, t, '# ') },
  { label: 'Heading 2', detail: '## ', build: (v, f, t) => place(v, f, t, '## ') },
  { label: 'Heading 3', detail: '### ', build: (v, f, t) => place(v, f, t, '### ') },
  { label: 'Bullet list', detail: '- item', build: (v, f, t) => place(v, f, t, '- ') },
  { label: 'Numbered list', detail: '1. item', build: (v, f, t) => place(v, f, t, '1. ') },
  { label: 'Task', detail: '- [ ] ', build: (v, f, t) => place(v, f, t, '- [ ] ') },
  { label: 'Quote', detail: '> ', build: (v, f, t) => place(v, f, t, '> ') },
  { label: 'Callout', detail: '> [!note] Title', build: (v, f, t) => place(v, f, t, '> [!note] Title\n> ') },
  { label: 'Code block', detail: '```', build: (v, f, t) => place(v, f, t, '```\n\n```', 4) },
  { label: 'Inline code', detail: '`code`', build: (v, f, t) => place(v, f, t, '``', 1) },
  {
    label: 'Table',
    detail: '2 columns',
    build: (v, f, t) => place(v, f, t, '| Column | Column |\n| --- | --- |\n|  |  |', 15),
  },
  { label: 'Divider', detail: '---', build: (v, f, t) => place(v, f, t, '\n---\n') },
  { label: 'Highlight', detail: '==text==', build: (v, f, t) => place(v, f, t, '====', 2) },
  { label: 'Wiki link', detail: '[[note]]', build: (v, f, t) => place(v, f, t, '[[]]', 2) },
  {
    label: 'Colored text',
    detail: '<span style>',
    build: (v, f, t) => place(v, f, t, '<span style="color:#f5a524">text</span>', 29),
  },
]

export function noveltyCompletion(context: CompletionContext): CompletionResult | null {
  const state = useStore.getState()

  const wiki = context.matchBefore(/\[\[[^\][|]*$/)
  if (wiki) {
    const notes = state.notes.filter((n) => !n.trashed)
    const from = wiki.from + 2
    const query = wiki.text.slice(2)
    return {
      from,
      options: notes
        .filter((n) => n.title.toLowerCase().includes(query.toLowerCase()))
        .map((n): Completion => ({
          label: n.title,
          type: 'class',
          apply: (view, _c, _f, to) => place(view, from, to, `${n.title}]]`),
        })),
      validFor: /^[^\][|]*$/,
    }
  }

  const tag = context.matchBefore(/#[\p{L}\p{N}_/-]*/u)
  if (tag && (tag.from === 0 || /\s/.test(context.state.sliceDoc(tag.from - 1, tag.from)))) {
    const allTags = new Set<string>()
    for (const note of state.notes) for (const t of note.tags) allTags.add(t)
    const from = tag.from + 1
    const query = tag.text.slice(1)
    const options: Completion[] = Array.from(allTags)
      .filter((t) => t.toLowerCase().includes(query.toLowerCase()))
      .map((t) => ({ label: t, type: 'property' }))
    if (options.length) return { from, options, validFor: /^[\p{L}\p{N}_/-]*$/u }
  }

  const slash = context.matchBefore(/\/[\w-]*/)
  if (slash) {
    const line = context.state.doc.lineAt(context.pos)
    const before = line.text.slice(0, slash.from - line.from)
    if (before.trim() === '') {
      return {
        from: slash.from,
        options: SLASH_ITEMS.map((item): Completion => ({
          label: item.label,
          detail: item.detail,
          type: 'keyword',
          apply: (view, _c, from, to) => item.build(view, from, to),
        })),
        validFor: /^\/[\w-]*$/,
      }
    }
  }

  return null
}
