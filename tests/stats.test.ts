import { describe, expect, it } from 'vitest'
import {
  buildOutline,
  computeStats,
  countChars,
  countWords,
  extractTags,
  extractTasks,
  extractWikiLinks,
  readingMinutes,
} from '../src/renderer/src/lib/stats'
import { makeNote } from './helpers'

describe('countWords', () => {
  it('counts plain words', () => {
    expect(countWords('Hello world')).toBe(2)
    expect(countWords('')).toBe(0)
  })

  it('excludes fenced code blocks', () => {
    expect(countWords('intro\n```js\nconst a = 1;\n```\noutro')).toBe(2)
  })

  it('counts link text but not the URL', () => {
    expect(countWords('[click here](https://example.com)')).toBe(2)
  })

  it('strips decoration characters', () => {
    expect(countWords('# Heading')).toBe(1)
    expect(countWords('- [ ] todo item')).toBe(2)
  })
})

describe('countChars & readingMinutes', () => {
  it('counts characters', () => {
    expect(countChars('abc')).toBe(3)
    expect(countChars('')).toBe(0)
  })

  it('establishes reading time', () => {
    expect(readingMinutes(0)).toBe(0)
    expect(readingMinutes(200)).toBe(1)
    expect(readingMinutes(600)).toBe(3)
  })
})

describe('extractTags', () => {
  it('extracts inline tags', () => {
    expect(extractTags('see #todo and #ideas/one')).toEqual(['ideas/one', 'todo'])
  })

  it('ignores numeric-only tokens', () => {
    expect(extractTags('version #1 is old')).toEqual([])
  })

  it('parses tags in front matter', () => {
    const content = '---\ntags: [book, reading, "daily"]\n---\nbody #extra'
    expect(extractTags(content)).toEqual(['book', 'daily', 'extra', 'reading'])
  })

  it('skips tags inside code fences', () => {
    const content = 'title\n```\n#notareal tag\n```'
    expect(extractTags(content)).toEqual([])
  })
})

describe('extractWikiLinks', () => {
  it('extracts simple links', () => {
    expect(extractWikiLinks('see [[Alpha]] and [[Beta ]]')).toEqual(['Alpha', 'Beta'])
  })

  it('handles aliases and heading fragments', () => {
    expect(extractWikiLinks('[[Alpha|display text]] and [[Beta#Chapter 2]]')).toEqual(['Alpha', 'Beta'])
  })

  it('deduplicates', () => {
    expect(extractWikiLinks('[[A]] [[A]]')).toEqual(['A'])
  })
})

describe('buildOutline', () => {
  it('builds nested headings with line numbers', () => {
    const outline = buildOutline('# One\ntext\n## Two')
    expect(outline).toEqual([
      { level: 1, text: 'One', id: 'one-0', line: 0 },
      { level: 2, text: 'Two', id: 'two-1', line: 2 },
    ])
  })

  it('ignores headings inside code fences', () => {
    const outline = buildOutline('```\n# fake\n```\n# real')
    expect(outline.map((o) => o.text)).toEqual(['real'])
  })
})

describe('extractTasks', () => {
  const note = makeNote({
    id: 'n1',
    title: 'Notes',
    content: 'ok\n- [ ] open task\n- [x] done task\n- bullet\n  - [ ] nested\n',
  })

  it('extracts task lines with indices', () => {
    const tasks = extractTasks(note)
    expect(tasks).toHaveLength(3)
    expect(tasks[0]).toMatchObject({ text: 'open task', done: false, index: 0 })
    expect(tasks[1]).toMatchObject({ text: 'done task', done: true, index: 1 })
    expect(tasks[2]).toMatchObject({ text: 'nested', done: false, index: 2 })
  })

  it('scopes ids to the note', () => {
    const task = extractTasks(note)[0]
    expect(task.id).toBe('n1:0')
    expect(task.noteId).toBe('n1')
    expect(task.noteTitle).toBe('Notes')
  })
})

describe('computeStats', () => {
  it('aggregates basic stats', () => {
    const stats = computeStats('# Title\n\nhello world #tag')
    expect(stats.words).toBe(4)
    expect(stats.chars).toBeGreaterThan(0)
    expect(stats.lines).toBe(3)
    expect(stats.reading).toBe(1)
    expect(stats.tags).toEqual(['tag'])
  })
})
