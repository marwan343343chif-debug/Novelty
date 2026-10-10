import Fuse from 'fuse.js'
import type { Note, SearchResult } from '../store/types'
import { escapeHtml, escapeRegExp } from './utils'

export function createTitleIndex(notes: Note[]): Fuse<Note> {
  return new Fuse(notes, {
    keys: [
      { name: 'title', weight: 0.7 },
      { name: 'tags', weight: 0.3 },
    ],
    threshold: 0.42,
    ignoreLocation: true,
    includeScore: true,
    minMatchCharLength: 1,
  })
}

export function fuzzySearchNotes(notes: Note[], query: string, limit = 30): Note[] {
  const list = notes.filter((n) => !n.trashed)
  if (!query.trim()) {
    return [...list].sort((a, b) => b.openedAt - a.openedAt).slice(0, limit)
  }
  return createTitleIndex(list)
    .search(query, { limit })
    .map((r) => r.item)
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0
  let count = 0
  let index = haystack.indexOf(needle)
  while (index !== -1) {
    count++
    index = haystack.indexOf(needle, index + needle.length)
  }
  return count
}

function buildSnippet(content: string, terms: string[]): string {
  const lower = content.toLowerCase()
  let firstIndex = -1
  for (const term of terms) {
    const idx = lower.indexOf(term)
    if (idx !== -1 && (firstIndex === -1 || idx < firstIndex)) firstIndex = idx
  }
  if (firstIndex === -1) {
    return escapeHtml(content.replace(/\s+/g, ' ').trim().slice(0, 140))
  }
  const start = Math.max(0, firstIndex - 50)
  const end = Math.min(content.length, firstIndex + 110)
  let snippet = content.slice(start, end).replace(/\s+/g, ' ').trim()
  snippet = escapeHtml(snippet)
  for (const term of terms) {
    if (!term) continue
    snippet = snippet.replace(new RegExp(`(${escapeRegExp(term)})`, 'gi'), '<mark>$1</mark>')
  }
  return `${start > 0 ? '…' : ''}${snippet}${end < content.length ? '…' : ''}`
}

export function searchNotes(notes: Note[], query: string): SearchResult[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return []
  const results: SearchResult[] = []
  for (const note of notes) {
    if (note.trashed) continue
    const title = note.title.toLowerCase()
    const content = note.content.toLowerCase()
    let score = 0
    let matches = 0
    let allPresent = true
    for (const term of terms) {
      const titleCount = countOccurrences(title, term)
      const contentCount = countOccurrences(content, term)
      if (titleCount === 0 && contentCount === 0) {
        allPresent = false
        break
      }
      score += titleCount * 25 + contentCount
      matches += titleCount + contentCount
    }
    if (!allPresent) continue
    results.push({
      noteId: note.id,
      title: note.title,
      snippet: buildSnippet(note.content, terms),
      score,
      matches,
    })
  }
  return results.sort((a, b) => b.score - a.score)
}
