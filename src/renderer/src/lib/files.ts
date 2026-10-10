import type { Note, Snapshot, ImageAsset } from '../store/types'
import { DEFAULT_SETTINGS, SNAPSHOT_VERSION } from './constants'
import { extractImageIds } from './utils'

const MD_FILTER = [{ name: 'Markdown', extensions: ['md'] }]
const JSON_FILTER = [{ name: 'Novelty Vault', extensions: ['json'] }]

function extFromType(type: string): string {
  const map: Record<string, string> = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'image/bmp': '.bmp',
    'image/avif': '.avif',
  }
  return map[type] ?? '.png'
}

function sanitizeBase(name: string): string {
  return name
    .replace(/\.[^.]+$/, '')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, 60)
}

export function inlineImages(content: string, images: ImageAsset[]): string {
  const byId = new Map(images.map((img) => [img.id, img.dataUrl]))
  return content.replace(/novelty:\/\/([^)\s"']+)/g, (match, id: string) => byId.get(id) ?? match)
}

export async function exportNoteAsMarkdown(note: Note, images: ImageAsset[] = []): Promise<string | null> {
  const safe = (note.title || 'untitled').replace(/[\\/:*?"<>|]/g, '-')
  return window.api.dialog.saveText({
    defaultName: `${safe}.md`,
    content: note.content ? inlineImages(note.content, images) : `# ${note.title}\n`,
    filters: MD_FILTER,
  })
}

export async function exportVaultJSON(snapshot: Snapshot): Promise<string | null> {
  return window.api.dialog.saveText({
    defaultName: `${snapshot.vaultName.replace(/\s+/g, '-').toLowerCase()}-vault.json`,
    content: JSON.stringify(snapshot, null, 2),
    filters: JSON_FILTER,
  })
}

export async function importVaultJSON(): Promise<Snapshot | null> {
  const text = await window.api.dialog.openJsonText()
  if (!text) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('That file is not valid JSON.')
  }
  const candidate = parsed as Partial<Snapshot>
  if (!candidate || !Array.isArray(candidate.notes)) {
    throw new Error('That file does not look like a Novelty vault.')
  }
  return {
    app: 'novelty',
    version: candidate.version ?? SNAPSHOT_VERSION,
    exportedAt: candidate.exportedAt ?? Date.now(),
    vaultName: candidate.vaultName ?? 'Imported Vault',
    notes: candidate.notes as Note[],
    folders: (candidate.folders ?? []) as Snapshot['folders'],
    settings: { ...DEFAULT_SETTINGS, ...(candidate.settings ?? {}) },
    images: (candidate.images ?? []) as ImageAsset[],
  }
}

export async function exportAllMarkdown(notes: Note[], images: ImageAsset[] = []): Promise<number> {
  const dir = await window.api.dialog.openFolder()
  if (!dir) return 0

  const live = notes.filter((n) => !n.trashed)
  const usedIds = new Set<string>()
  for (const note of live) for (const id of extractImageIds(note.content)) usedIds.add(id)
  for (const note of live) if (note.cover && !usedIds.has(note.cover)) usedIds.add(note.cover)

  const nameById = new Map<string, string>()
  const taken = new Set<string>()
  const assets: { name: string; dataUrl: string }[] = []
  let counter = 0
  for (const img of images) {
    if (!usedIds.has(img.id)) continue
    const base = sanitizeBase(img.name) || `image-${++counter}`
    let filename = `${base}${extFromType(img.type)}`
    let n = 2
    while (taken.has(filename.toLowerCase())) filename = `${base}-${n++}${extFromType(img.type)}`
    taken.add(filename.toLowerCase())
    nameById.set(img.id, filename)
    assets.push({ name: filename, dataUrl: img.dataUrl })
  }

  const rewritten = (content: string): string =>
    content.replace(/novelty:\/\/([^)\s"']+)/g, (match, id: string) => {
      const file = nameById.get(id)
      return file ? `./assets/${file}` : match
    })

  const files = live.map((n) => ({ name: n.title || 'untitled', content: rewritten(n.content || `# ${n.title}\n`) }))
  return window.api.fs.writeMarkdownToDir({ dir, files, assets })
}
