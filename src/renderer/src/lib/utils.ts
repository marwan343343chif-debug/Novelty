export const uid = (prefix = ''): string => {
  const rand = Math.random().toString(36).slice(2, 10)
  const time = Date.now().toString(36)
  return `${prefix}${prefix ? '-' : ''}${time}${rand}`
}

export const cn = (...parts: Array<string | false | null | undefined>): string => parts.filter(Boolean).join(' ')

export const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value))

export function debounce<T extends (...args: never[]) => void>(fn: T, wait = 300): (this: unknown, ...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  return function (this: unknown, ...args: Parameters<T>) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      fn.apply(this, args)
    }, wait)
  }
}

export const slugify = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)

export function headingId(text: string, index: number): string {
  const base = slugify(text) || 'section'
  return `${base}-${index}`
}

export function formatDateTime(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDateShort(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const sameYear = d.getFullYear() === now.getFullYear()
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  })
}

export function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  const sec = Math.round(diff / 1000)
  if (sec < 45) return 'just now'
  const min = Math.round(sec / 60)
  if (min < 60) return `${min} min ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr} hr ago`
  const day = Math.round(hr / 24)
  if (day < 30) return `${day} d ago`
  return formatDateShort(ts)
}

export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

export function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`
}

export function todayKey(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function greeting(date = new Date()): string {
  const h = date.getHours()
  if (h < 5) return 'Good night'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export function titleFromContent(content: string, fallback = 'Untitled'): string {
  const lines = content.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const heading = trimmed.match(/^#{1,6}\s+(.*)$/)
    if (heading) return heading[1].trim().slice(0, 120) || fallback
    return trimmed.replace(/^[-*>]\s*/, '').slice(0, 120) || fallback
  }
  return fallback
}

export const IMAGE_SCHEME = 'novelty://'

export function imageUrl(id: string): string {
  return `${IMAGE_SCHEME}${id}`
}

export function imageIdFromUrl(url: string): string | null {
  if (!url.startsWith(IMAGE_SCHEME)) return null
  const id = url.slice(IMAGE_SCHEME.length).trim()
  return id || null
}

export function extractImageIds(content: string): string[] {
  const ids = new Set<string>()
  const re = /!\[[^\]]*\]\(novelty:\/\/([^)\s]+)\)/g
  let match: RegExpExecArray | null
  while ((match = re.exec(content))) ids.add(match[1])
  return Array.from(ids)
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export function loadImageSize(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => resolve({ width: 0, height: 0 })
    img.src = src
  })
}

export function formatBytes(bytes: number): string {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

export function startOfDay(date = new Date()): number {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function dateKeyFromDate(date: Date): string {
  return todayKey(date)
}
