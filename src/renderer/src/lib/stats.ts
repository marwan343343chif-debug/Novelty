import { headingId } from './utils'
import type { OutlineItem, Note, TaskItem } from '../store/types'

export function countWords(text: string): number {
  if (!text) return 0
  const cleaned = text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/~~~[\s\S]*?~~~/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_~|-]/g, ' ')
  const match = cleaned.match(/[\p{L}\p{N}'’-]+/gu)
  return match ? match.length : 0
}

export function countChars(text: string): number {
  return text ? text.length : 0
}

export function readingMinutes(words: number): number {
  return words === 0 ? 0 : Math.max(1, Math.round(words / 200))
}

function stripFences(content: string): string {
  return content.replace(/```[\s\S]*?```/g, (m) => m.replace(/[^\n]/g, ' ')).replace(/~~~[\s\S]*?~~~/g, (m) => m.replace(/[^\n]/g, ' '))
}

export function extractTags(content: string): string[] {
  const tags = new Set<string>()
  const fm = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (fm) {
    const line = fm[1].match(/^tags:\s*(.*)$/m)
    if (line) {
      line[1]
        .replace(/[[\]'"]/g, '')
        .split(/[,\s]+/)
        .filter(Boolean)
        .forEach((t) => tags.add(t.replace(/^#/, '').trim()))
    }
  }
  const body = stripFences(content)
  const re = /(^|[\s(])#([\p{L}\p{N}][\p{L}\p{N}_/-]*)/gu
  let m: RegExpExecArray | null
  while ((m = re.exec(body))) {
    const tag = m[2]
    if (!tag) continue
    if (/^\d+$/.test(tag)) continue
    tags.add(tag)
  }
  return Array.from(tags).sort((a, b) => a.localeCompare(b))
}

export function extractWikiLinks(content: string): string[] {
  const links = new Set<string>()
  const re = /\[\[([^\][|]+?)(?:\|([^\]]+))?\]\]/g
  let m: RegExpExecArray | null
  while ((m = re.exec(content))) {
    const target = m[1].split('#')[0].trim()
    if (target) links.add(target)
  }
  return Array.from(links)
}

export function buildOutline(content: string): OutlineItem[] {
  const items: OutlineItem[] = []
  const lines = content.split('\n')
  let inFence = false
  let index = 0
  lines.forEach((line, i) => {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence
      return
    }
    if (inFence) return
    const m = line.match(/^(#{1,6})\s+(.*)$/)
    if (m) {
      const text = m[2].replace(/[*_`~#]/g, '').trim()
      items.push({ level: m[1].length, text, id: headingId(text, index++), line: i })
    }
  })
  return items
}

export interface Stats {
  words: number
  chars: number
  lines: number
  reading: number
  tags: string[]
}

export function computeStats(content: string): Stats {
  const words = countWords(content)
  return {
    words,
    chars: countChars(content),
    lines: content ? content.split('\n').length : 0,
    reading: readingMinutes(words),
    tags: extractTags(content),
  }
}

export function extractTasks(note: Note): TaskItem[] {
  const tasks: TaskItem[] = []
  let index = 0
  note.content.split('\n').forEach((line, i) => {
    const m = line.match(/^\s*[-*+]\s+\[([ xX])\]\s+(.*)$/)
    if (m) {
      tasks.push({
        id: `${note.id}:${index}`,
        noteId: note.id,
        noteTitle: note.title,
        text: m[2].replace(/[*_`~]/g, '').trim() || 'Untitled task',
        done: m[1] !== ' ',
        index,
        line: i,
      })
      index++
    }
  })
  return tasks
}
