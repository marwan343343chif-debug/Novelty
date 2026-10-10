import { useEffect, useRef } from 'react'
import { EditorState, Compartment, Prec } from '@codemirror/state'
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  drawSelection,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
  placeholder as cmPlaceholder,
} from '@codemirror/view'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { searchKeymap, openSearchPanel } from '@codemirror/search'
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'
import { syntaxHighlighting, indentOnInput, bracketMatching } from '@codemirror/language'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { noveltyTheme, noveltyHighlight } from './cmTheme'
import { noveltyCompletion } from './cmCompletions'
import { useStore } from '../../store/useStore'
import { bus } from '../../lib/bus'
import type { OutlineItem } from '../../store/types'

const lineNumberComp = new Compartment()
const wrapComp = new Compartment()
const spellComp = new Compartment()
const activeLineComp = new Compartment()
const tabSizeComp = new Compartment()

function wrapSelection(view: EditorView, before: string, after = before): void {
  const { state } = view
  const sel = state.selection.main
  const selected = state.sliceDoc(sel.from, sel.to)
  if (sel.from === sel.to) {
    view.dispatch({ changes: { from: sel.from, insert: before + after }, selection: { anchor: sel.from + before.length } })
  } else if (selected.startsWith(before) && selected.endsWith(after) && selected.length >= before.length + after.length) {
    const inner = selected.slice(before.length, selected.length - after.length)
    view.dispatch({
      changes: { from: sel.from, to: sel.to, insert: inner },
      selection: { anchor: sel.from, head: sel.from + inner.length },
    })
  } else {
    view.dispatch({
      changes: { from: sel.from, to: sel.to, insert: before + selected + after },
      selection: { anchor: sel.from + before.length, head: sel.from + before.length + selected.length },
    })
  }
  view.focus()
}

function toggleLinePrefix(view: EditorView, prefix: string, toggleOff: RegExp): void {
  const { state } = view
  const startLine = state.doc.lineAt(state.selection.main.from).number
  const endLine = state.doc.lineAt(state.selection.main.to).number
  const changes: { from: number; to?: number; insert: string }[] = []
  for (let n = startLine; n <= endLine; n++) {
    const line = state.doc.line(n)
    const match = line.text.match(toggleOff)
    if (match) changes.push({ from: line.from, to: line.from + match[0].length, insert: '' })
    else changes.push({ from: line.from, insert: prefix })
  }
  view.dispatch({ changes })
  view.focus()
}

function setHeading(view: EditorView, level: number): void {
  const { state } = view
  const line = state.doc.lineAt(state.selection.main.from)
  const current = line.text.match(/^#{1,6}\s+/)
  const prefix = `${'#'.repeat(level)} `
  if (current && current[0] === prefix) {
    view.dispatch({ changes: { from: line.from, to: line.from + current[0].length, insert: '' } })
  } else if (current) {
    view.dispatch({ changes: { from: line.from, to: line.from + current[0].length, insert: prefix } })
  } else {
    view.dispatch({ changes: { from: line.from, insert: prefix } })
  }
  view.focus()
}

function insertLink(view: EditorView): void {
  const sel = view.state.selection.main
  const text = view.state.sliceDoc(sel.from, sel.to) || 'text'
  const insert = `[${text}](url)`
  const urlStart = sel.from + 1 + text.length + 2
  view.dispatch({ changes: { from: sel.from, to: sel.to, insert }, selection: { anchor: urlStart, head: urlStart + 3 } })
  view.focus()
}

function colorSelection(view: EditorView, color: string): void {
  const sel = view.state.selection.main
  const text = view.state.sliceDoc(sel.from, sel.to) || 'text'
  const open = `<span style="color:${color}">`
  const insert = `${open}${text}</span>`
  view.dispatch({
    changes: { from: sel.from, to: sel.to, insert },
    selection: { anchor: sel.from + open.length, head: sel.from + open.length + text.length },
  })
  view.focus()
}

function insertText(view: EditorView, text: string, cursorOffset?: number): void {
  const sel = view.state.selection.main
  view.dispatch({
    changes: { from: sel.from, to: sel.to, insert: text },
    selection: { anchor: sel.from + (cursorOffset ?? text.length) },
  })
  view.focus()
}

function continueList(view: EditorView): boolean {
  const { state } = view
  const sel = state.selection.main
  if (sel.from !== sel.to) return false
  const line = state.doc.lineAt(sel.from)
  if (sel.from !== line.to) return false
  const match = line.text.match(/^(\s*)([-*+]|\d+\.)\s+(\[[ xX]\]\s+)?(.*)$/)
  if (!match) return false
  const [, indent, marker, task, rest] = match
  if (rest.trim() === '' && !task) {
    view.dispatch({ changes: { from: line.from, to: line.to, insert: indent } })
    return true
  }
  let nextMarker = marker
  if (/^\d+\.$/.test(marker)) nextMarker = `${parseInt(marker, 10) + 1}.`
  const insert = `\n${indent}${nextMarker} ${task ?? ''}`
  view.dispatch({ changes: { from: sel.from, insert }, selection: { anchor: sel.from + insert.length } })
  return true
}

function toggleCheckboxLine(view: EditorView): boolean {
  const { state } = view
  const line = state.doc.lineAt(state.selection.main.from)
  const match = line.text.match(/\[([ xX])\]/)
  if (!match) return false
  const next = match[1] === ' ' ? '[x]' : '[ ]'
  const from = line.from + match.index!
  view.dispatch({ changes: { from, to: from + 3, insert: next } })
  return true
}

export function MarkdownEditor({
  noteId,
  value,
  onChange,
}: {
  noteId: string
  value: string
  onChange: (content: string) => void
}): JSX.Element {
  const hostRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const lastEmitted = useRef(value)
  const settings = useStore((s) => s.settings)

  useEffect(() => {
    if (!hostRef.current) return
    lastEmitted.current = value
    const state = EditorState.create({
      doc: value,
      extensions: [
        history(),
        drawSelection(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        rectangularSelection(),
        crosshairCursor(),
        activeLineComp.of(useStore.getState().settings.highlightActiveLine ? [highlightActiveLine(), highlightActiveLineGutter()] : []),
        tabSizeComp.of(EditorState.tabSize.of(useStore.getState().settings.tabSize)),
        autocompletion({ override: [noveltyCompletion], activateOnTyping: true, closeOnBlur: true, icons: true }),
        markdown({ base: markdownLanguage, codeLanguages: languages, addKeymap: true }),
        syntaxHighlighting(noveltyHighlight),
        cmPlaceholder('Start writing…'),
        lineNumberComp.of(useStore.getState().settings.lineNumbers ? lineNumbers() : []),
        wrapComp.of(useStore.getState().settings.lineWrapping ? EditorView.lineWrapping : []),
        spellComp.of(EditorView.contentAttributes.of({ spellcheck: useStore.getState().settings.spellcheck ? 'true' : 'false' })),
        noveltyTheme,
        Prec.high(keymap.of([{ key: 'Enter', run: continueList }, { key: 'Mod-Enter', run: toggleCheckboxLine }, ...closeBracketsKeymap])),
        keymap.of([indentWithTab, ...defaultKeymap, ...historyKeymap, ...completionKeymap, ...searchKeymap]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const text = update.state.doc.toString()
            lastEmitted.current = text
            onChangeRef.current(text)
          }
          if (update.selectionSet || update.docChanged) {
            const head = update.state.selection.main.head
            const line = update.state.doc.lineAt(head)
            bus.emit('editor:cursor', { line: line.number, col: head - line.from + 1 })
          }
        }),
      ],
    })
    const view = new EditorView({ state, parent: hostRef.current })
    viewRef.current = view
    bus.emit('editor:cursor', { line: 1, col: 1 })

    const offs: (() => void)[] = [
      bus.on('editor:bold', () => wrapSelection(view, '**')),
      bus.on('editor:italic', () => wrapSelection(view, '*')),
      bus.on('editor:strike', () => wrapSelection(view, '~~')),
      bus.on('editor:highlight', () => wrapSelection(view, '==')),
      bus.on('editor:code', () => wrapSelection(view, '`')),
      bus.on('editor:link', () => insertLink(view)),
      bus.on('editor:color', (payload) => colorSelection(view, (payload as { color: string })?.color ?? '#f5a524')),
      bus.on('editor:h1', () => setHeading(view, 1)),
      bus.on('editor:h2', () => setHeading(view, 2)),
      bus.on('editor:h3', () => setHeading(view, 3)),
      bus.on('editor:bullet', () => toggleLinePrefix(view, '- ', /^\s*[-*+]\s+/)),
      bus.on('editor:numbered', () => toggleLinePrefix(view, '1. ', /^\s*\d+\.\s+/)),
      bus.on('editor:todo', () => toggleLinePrefix(view, '- [ ] ', /^\s*[-*+]\s+\[[ xX]\]\s+/)),
      bus.on('editor:quote', () => toggleLinePrefix(view, '> ', /^\s*>\s+/)),
      bus.on('editor:table', () => insertText(view, '| Column | Column |\n| --- | --- |\n|  |  |', 15)),
      bus.on('editor:divider', () => insertText(view, '\n---\n')),
      bus.on('editor:callout', () => insertText(view, '> [!note] Title\n> ')),
      bus.on('editor:wikilink', () => insertText(view, '[[]]', 2)),
      bus.on('editor:insert-image', (payload) => {
        const data = payload as { id?: string; alt?: string } | undefined
        if (!data?.id) return
        insertText(view, `![${data.alt ?? ''}](novelty://${data.id})`)
      }),
      bus.on('editor:find', () => openSearchPanel(view)),
      bus.on('editor:goto-heading', (payload) => {
        const item = payload as OutlineItem
        const line = view.state.doc.line(Math.min(item.line + 1, view.state.doc.lines))
        view.dispatch({
          selection: { anchor: line.from },
          effects: EditorView.scrollIntoView(line.from, { y: 'start', yMargin: 80 }),
        })
        view.focus()
      }),
    ]

    return () => {
      offs.forEach((off) => off())
      view.destroy()
      viewRef.current = null
    }
  }, [noteId])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    if (value !== lastEmitted.current) {
      if (view.state.doc.toString() !== value) {
        view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value }, selection: { anchor: 0 } })
      }
      lastEmitted.current = value
    }
  }, [value])

  useEffect(() => {
    viewRef.current?.dispatch({ effects: lineNumberComp.reconfigure(settings.lineNumbers ? lineNumbers() : []) })
  }, [settings.lineNumbers])

  useEffect(() => {
    viewRef.current?.dispatch({ effects: wrapComp.reconfigure(settings.lineWrapping ? EditorView.lineWrapping : []) })
  }, [settings.lineWrapping])

  useEffect(() => {
    viewRef.current?.dispatch({
      effects: spellComp.reconfigure(EditorView.contentAttributes.of({ spellcheck: settings.spellcheck ? 'true' : 'false' })),
    })
  }, [settings.spellcheck])

  useEffect(() => {
    viewRef.current?.dispatch({
      effects: activeLineComp.reconfigure(settings.highlightActiveLine ? [highlightActiveLine(), highlightActiveLineGutter()] : []),
    })
  }, [settings.highlightActiveLine])

  useEffect(() => {
    viewRef.current?.dispatch({ effects: tabSizeComp.reconfigure(EditorState.tabSize.of(settings.tabSize)) })
  }, [settings.tabSize])

  return <div ref={hostRef} className={`cm-host${settings.typewriterMode ? ' typewriter-mode' : ''}`} />
}
