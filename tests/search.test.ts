import { describe, expect, it } from 'vitest'
import { fuzzySearchNotes, searchNotes } from '../src/renderer/src/lib/search'
import { makeNote } from './helpers'

describe('fuzzySearchNotes', () => {
  const notes = [
    makeNote({ id: 'a', title: 'Alpha', openedAt: 300, updatedAt: 300, trashed: false }),
    makeNote({ id: 'b', title: 'Beta', openedAt: 200, updatedAt: 200, trashed: false }),
    makeNote({ id: 'c', title: 'Gamma', openedAt: 100, updatedAt: 100, trashed: true }),
  ]

  it('returns recent notes first for an empty query', () => {
    expect(fuzzySearchNotes(notes, '').map((n) => n.id)).toEqual(['a', 'b'])
    expect(fuzzySearchNotes(notes, '').some((n) => n.id === 'c')).toBe(false)
  })

  it('ranks the best title match first', () => {
    const result = fuzzySearchNotes(notes, 'alp')
    expect(result[0].id).toBe('a')
  })
})

describe('searchNotes', () => {
  it('returns an empty list for an empty query', () => {
    expect(searchNotes([makeNote({ content: 'x' })], '')).toEqual([])
  })

  it('requires every term to be present', () => {
    const haystack = makeNote({ id: 'n', title: 'Note', content: 'alpha present' })
    expect(searchNotes([haystack], 'alpha missing')).toEqual([])
    expect(searchNotes([haystack], 'alpha present')).toHaveLength(1)
  })

  it('scores title hits above content hits', () => {
    const inTitle = makeNote({ id: 't', title: 'Driven', content: '' })
    const inBody = makeNote({ id: 'b', title: 'Other', content: 'driven driver quote' })
    const results = searchNotes([inBody, inTitle], 'driven')
    expect(results[0].noteId).toBe('t')
  })

  it('builds snippets with highlighted terms and escapes html', () => {
    const note = makeNote({ title: 'Note', content: 'before <script> the keyword is fluffy things after' })
    const [result] = searchNotes([note], 'fluffy')
    expect(result.snippet).toContain('<mark>fluffy</mark>')
    expect(result.snippet).not.toContain('<script>')
  })

  it('skips trashed notes', () => {
    const note = makeNote({ id: 'x', title: 'Note', content: 'term here', trashed: true })
    expect(searchNotes([note], 'term')).toEqual([])
  })
})