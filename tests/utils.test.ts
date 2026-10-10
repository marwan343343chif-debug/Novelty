import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  clamp,
  cn,
  debounce,
  escapeHtml,
  escapeRegExp,
  extractImageIds,
  formatBytes,
  greeting,
  headingId,
  imageIdFromUrl,
  imageUrl,
  pluralize,
  slugify,
  titleFromContent,
  todayKey,
  uid,
} from '../src/renderer/src/lib/utils'

describe('uid', () => {
  it('prepends a prefix with a dash', () => {
    expect(uid('note')).toMatch(/^note-[0-9a-z]{9,}$/)
    expect(uid()).not.toContain('-')
  })
})

describe('cn', () => {
  it('joins truthy class names', () => {
    expect(cn('a', false, 'b', null, undefined, 'c')).toBe('a b c')
  })
})

describe('clamp', () => {
  it('bounds a value', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(99, 0, 10)).toBe(10)
  })
})

describe('slugify & headingId', () => {
  it('slugifies text', () => {
    expect(slugify('  Hello, World!  ')).toBe('hello-world')
    expect(slugify('')).toBe('')
  })

  it('creates stable heading ids', () => {
    expect(headingId('Chapter One', 3)).toBe('chapter-one-3')
    expect(headingId('$$$', 0)).toBe('section-0')
  })
})

describe('titleFromContent', () => {
  it('uses the first heading', () => {
    expect(titleFromContent('# The Title\ntext')).toBe('The Title')
  })

  it('falls back to the first non-empty line', () => {
    expect(titleFromContent('\n\nJust a line')).toBe('Just a line')
  })

  it('returns the fallback when empty', () => {
    expect(titleFromContent('   ', 'Untitled')).toBe('Untitled')
  })
})

describe('string escaping', () => {
  it('escapes html', () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;')
  })

  it('escapes regex specials', () => {
    expect(escapeRegExp('a.b*c')).toBe('a\\.b\\*c')
  })
})

describe('pluralize & formatBytes', () => {
  it('pluralizes', () => {
    expect(pluralize(1, 'note')).toBe('1 note')
    expect(pluralize(3, 'note')).toBe('3 notes')
  })

  it('formats byte sizes', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(1024)).toBe('1.0 KB')
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB')
  })
})

describe('dates', () => {
  it('formats a date key', () => {
    expect(todayKey(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('greets according to the hour', () => {
    expect(greeting(new Date(2026, 0, 1, 4))).toBe('Good night')
    expect(greeting(new Date(2026, 0, 1, 9))).toBe('Good morning')
    expect(greeting(new Date(2026, 0, 1, 14))).toBe('Good afternoon')
    expect(greeting(new Date(2026, 0, 1, 20))).toBe('Good evening')
  })
})

describe('image helpers', () => {
  it('round-trips image urls', () => {
    const url = imageUrl('abc123')
    expect(url).toBe('novelty://abc123')
    expect(imageIdFromUrl(url)).toBe('abc123')
    expect(imageIdFromUrl('novelty://')).toBeNull()
    expect(imageIdFromUrl('https://x/y')).toBeNull()
  })

  it('extracts image ids from markdown', () => {
    const ids = extractImageIds('a ![pic](novelty://img1) b ![x](novelty://img2) c ![no](https://x/y)')
    expect(ids).toEqual(['img1', 'img2'])
  })
})

describe('debounce', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('coalesces calls within the wait window', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const debounced = debounce(fn, 100)
    debounced()
    debounced()
    vi.advanceTimersByTime(99)
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(1)
  })
})