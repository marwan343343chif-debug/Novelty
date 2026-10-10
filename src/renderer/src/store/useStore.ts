import { create } from 'zustand'
import type {
  Note,
  Folder,
  Settings,
  Meta,
  Snapshot,
  LeftPane,
  RightPane,
  ImageAsset,
  TimerState,
  TimerMode,
  WebSearchResponse,
} from './types'
import { DEFAULT_SETTINGS, SNAPSHOT_VERSION } from '../lib/constants'
import * as db from '../lib/db'
import { uid, titleFromContent, todayKey, readFileAsDataUrl, loadImageSize } from '../lib/utils'
import { extractTags, countWords } from '../lib/stats'
import { exportNoteAsMarkdown, exportVaultJSON, importVaultJSON, exportAllMarkdown } from '../lib/files'
import { bus } from '../lib/bus'

export type SaveStatus = 'idle' | 'saving' | 'saved'
export interface Toast {
  id: string
  message: string
  type: 'info' | 'success' | 'error'
}
export type ModalName = 'settings' | 'shortcuts' | 'about' | 'import' | null
export type PaletteType = 'command' | 'quick' | null
export type ImagePickerMode = 'insert' | 'cover' | null

interface Store {
  loaded: boolean
  notes: Note[]
  folders: Folder[]
  images: ImageAsset[]
  settings: Settings
  meta: Meta
  leftPane: LeftPane
  rightPane: RightPane
  activeTag: string | null
  saveStatus: SaveStatus
  toasts: Toast[]
  modal: ModalName
  palette: PaletteType
  imagePicker: ImagePickerMode
  timer: TimerState
  webQuery: string
  webResponse: WebSearchResponse | null
  webLoading: boolean
  webError: string | null
  importSnapshot: Snapshot | null

  init: () => Promise<void>
  resetVault: () => Promise<void>
  backupNow: () => void
  setImportSnapshot: (snapshot: Snapshot | null) => void
  applyImport: (mode: 'replace' | 'merge') => Promise<void>

  createNote: (folderId?: string | null, content?: string) => string
  openNote: (id: string) => void
  closeNote: (id: string) => void
  closeOtherTabs: (id: string) => void
  closeAllTabs: () => void
  setActiveNote: (id: string) => void
  goHome: () => void

  renameNote: (id: string, title: string) => void
  setNoteContent: (id: string, content: string) => void
  updateNote: (id: string, patch: Partial<Note>) => void
  toggleFavorite: (id: string) => void
  togglePin: (id: string) => void
  setNoteColor: (id: string, color: string) => void
  setNoteCover: (noteId: string, imageId: string | null) => void
  trashNote: (id: string) => void
  restoreNote: (id: string) => void
  deleteNoteForever: (id: string) => void
  emptyTrash: () => void
  duplicateNote: (id: string) => string | null
  toggleTask: (id: string, taskIndex: number) => void

  createFolder: (parentId?: string | null, name?: string) => string
  renameFolder: (id: string, name: string) => void
  deleteFolder: (id: string) => void
  toggleFolder: (id: string) => void
  moveNote: (noteId: string, folderId: string | null) => void
  moveFolder: (folderId: string, parentId: string | null) => void

  addImage: (file: File) => Promise<string>
  addImageFromDataUrl: (args: { name: string; type: string; dataUrl: string; preset?: boolean }) => Promise<string>
  deleteImage: (id: string) => Promise<void>
  insertImage: (id: string, alt?: string) => void
  setImagePicker: (mode: ImagePickerMode) => void

  setSettings: (patch: Partial<Settings>) => void
  setMeta: (patch: Partial<Meta>) => void
  setLeftPane: (pane: LeftPane) => void
  setRightPane: (pane: RightPane) => void
  setActiveTag: (tag: string | null) => void

  setTimer: (patch: Partial<TimerState>) => void
  startTimer: () => void
  pauseTimer: () => void
  resetTimer: () => void
  completeTimer: () => void

  markSaving: () => void
  markSaved: () => void
  flushSaves: () => Promise<void>

  toast: (message: string, type?: Toast['type']) => void
  dismissToast: (id: string) => void
  setModal: (modal: ModalName) => void
  setPalette: (palette: PaletteType) => void

  setWebQuery: (query: string) => void
  runWebSearch: (query?: string) => Promise<void>

  createDailyNote: () => void
  createDailyNoteFor: (date: Date) => void
  runCommand: (id: string) => void
}

const contentTimers = new Map<string, ReturnType<typeof setTimeout>>()
const pendingNotes = new Map<string, Note>()
let metaTimer: ReturnType<typeof setTimeout> | null = null
let saveStatusTimer: ReturnType<typeof setTimeout> | null = null
const wordCache = new Map<string, number>()

function persistContent(note: Note): void {
  pendingNotes.set(note.id, note)
  const existing = contentTimers.get(note.id)
  if (existing) clearTimeout(existing)
  contentTimers.set(
    note.id,
    setTimeout(() => {
      const latest = pendingNotes.get(note.id)
      contentTimers.delete(note.id)
      pendingNotes.delete(note.id)
      if (latest) void db.putNote(latest)
    }, 450),
  )
}

function persistMeta(meta: Meta): void {
  if (metaTimer) clearTimeout(metaTimer)
  metaTimer = setTimeout(() => void db.putMeta(meta), 300)
}

const emptyMeta = (): Meta => ({
  openTabIds: [],
  activeNoteId: null,
  vaultName: 'My Vault',
  activity: {},
})

const snapshotOf = (state: Store): Snapshot => ({
  app: 'novelty',
  version: SNAPSHOT_VERSION,
  exportedAt: Date.now(),
  vaultName: state.meta.vaultName,
  notes: state.notes,
  folders: state.folders,
  settings: state.settings,
  images: state.images,
})

export const useStore = create<Store>((set, get) => ({
  loaded: false,
  notes: [],
  folders: [],
  images: [],
  settings: { ...DEFAULT_SETTINGS },
  meta: emptyMeta(),
  leftPane: 'files',
  rightPane: 'outline',
  activeTag: null,
  saveStatus: 'idle',
  toasts: [],
  modal: null,
  palette: null,
  imagePicker: null,
  timer: { mode: 'focus', running: false, endsAt: null, remaining: DEFAULT_SETTINGS.pomodoroFocus * 60000, sessions: 0 },
  webQuery: '',
  webResponse: null,
  webLoading: false,
  webError: null,
  importSnapshot: null,

  init: async () => {
    const vault = await db.loadVault()
    const settings: Settings = { ...DEFAULT_SETTINGS, ...(vault.settings ?? {}) }
    const timer: TimerState = { mode: 'focus', running: false, endsAt: null, remaining: settings.pomodoroFocus * 60000, sessions: 0 }

    if (vault.notes.length === 0 && vault.folders.length === 0) {
      const meta: Meta = {
        openTabIds: [],
        activeNoteId: null,
        vaultName: vault.meta?.vaultName ?? 'My Vault',
        activity: {},
      }
      await db.putSettings(settings)
      await db.putMeta(meta)
      set({ loaded: true, notes: [], folders: [], images: [], settings, meta, timer })
      return
    }

    const noteMap = new Map(vault.notes.map((n) => [n.id, n]))
    const openTabIds = (vault.meta?.openTabIds ?? []).filter((id) => noteMap.has(id))
    const activeNoteId =
      vault.meta?.activeNoteId && noteMap.has(vault.meta.activeNoteId) ? vault.meta.activeNoteId : (openTabIds[0] ?? null)
    const meta: Meta = {
      ...emptyMeta(),
      ...(vault.meta ?? {}),
      openTabIds: activeNoteId && !openTabIds.includes(activeNoteId) ? [activeNoteId, ...openTabIds] : openTabIds,
      activeNoteId,
    }
    set({ loaded: true, notes: vault.notes, folders: vault.folders, images: vault.images, settings, meta, timer })
    get().backupNow()
  },

  resetVault: async () => {
    get().backupNow()
    await db.wipeVault()
    set({ loaded: false })
    await get().init()
    get().toast('Vault cleared', 'success')
  },

  backupNow: () => {
    const state = get()
    if (state.notes.length === 0 && state.folders.length === 0) return
    void window.api.backup.write(snapshotOf(state)).catch((err: unknown) => console.warn('[novelty] backup failed', err))
  },

  setImportSnapshot: (snapshot) => set({ importSnapshot: snapshot }),

  applyImport: async (mode) => {
    const snapshot = get().importSnapshot
    if (!snapshot) return
    try {
      get().backupNow()
      if (mode === 'replace') await db.replaceAll(snapshot)
      else await db.mergeAll(snapshot, true)
      set({ loaded: false, importSnapshot: null, modal: null })
      await get().init()
      get().toast(mode === 'replace' ? 'Vault imported' : 'Vault merged', 'success')
    } catch (err) {
      get().toast(err instanceof Error ? err.message : 'Import failed', 'error')
    }
  },

  createNote: (folderId = null, content = '') => {
    const now = Date.now()
    const note: Note = {
      id: uid('note'),
      title: titleFromContent(content, 'Untitled'),
      content,
      folderId: folderId ?? null,
      tags: extractTags(content),
      favorite: false,
      pinned: false,
      trashed: false,
      createdAt: now,
      updatedAt: now,
      openedAt: now,
    }
    const meta = get().meta
    const newMeta: Meta = {
      ...meta,
      openTabIds: [note.id, ...meta.openTabIds],
      activeNoteId: note.id,
    }
    set({ notes: [note, ...get().notes], meta: newMeta })
    void db.putNote(note)
    persistMeta(newMeta)
    if (folderId) {
      const folder = get().folders.find((f) => f.id === folderId)
      if (folder && !folder.expanded) get().toggleFolder(folderId)
    }
    return note.id
  },

  openNote: (id) => {
    const note = get().notes.find((n) => n.id === id)
    if (!note) return
    const meta = get().meta
    const openTabIds = meta.openTabIds.includes(id) ? meta.openTabIds : [...meta.openTabIds, id]
    const updated = { ...note, openedAt: Date.now() }
    const newMeta: Meta = { ...meta, openTabIds, activeNoteId: id }
    set({ meta: newMeta, notes: get().notes.map((n) => (n.id === id ? updated : n)) })
    void db.putNote(updated)
    persistMeta(newMeta)
  },

  closeNote: (id) => {
    const meta = get().meta
    const index = meta.openTabIds.indexOf(id)
    const openTabIds = meta.openTabIds.filter((t) => t !== id)
    let activeNoteId = meta.activeNoteId
    if (activeNoteId === id) {
      activeNoteId = openTabIds[Math.min(index, openTabIds.length - 1)] ?? null
    }
    const newMeta: Meta = { ...meta, openTabIds, activeNoteId }
    set({ meta: newMeta })
    persistMeta(newMeta)
  },

  closeOtherTabs: (id) => {
    const meta = get().meta
    const newMeta: Meta = { ...meta, openTabIds: [id], activeNoteId: id }
    set({ meta: newMeta })
    persistMeta(newMeta)
  },

  closeAllTabs: () => {
    const newMeta: Meta = { ...get().meta, openTabIds: [], activeNoteId: null }
    set({ meta: newMeta })
    persistMeta(newMeta)
  },

  setActiveNote: (id) => {
    get().openNote(id)
  },

  goHome: () => {
    const newMeta: Meta = { ...get().meta, activeNoteId: null }
    set({ meta: newMeta })
    persistMeta(newMeta)
  },

  renameNote: (id, title) => {
    const note = get().notes.find((n) => n.id === id)
    if (!note) return
    const updated = { ...note, title: title || 'Untitled', updatedAt: Date.now() }
    set({ notes: get().notes.map((n) => (n.id === id ? updated : n)) })
    void db.putNote(updated)
  },

  setNoteContent: (id, content) => {
    const note = get().notes.find((n) => n.id === id)
    if (!note) return
    const words = countWords(content)
    const previous = wordCache.get(id) ?? countWords(note.content)
    const delta = Math.max(0, words - previous)
    wordCache.set(id, words)
    const updated: Note = { ...note, content, tags: extractTags(content), updatedAt: Date.now() }
    let activity = get().meta.activity
    if (delta > 0) {
      const key = todayKey()
      activity = { ...activity, [key]: (activity[key] ?? 0) + delta }
    }
    const meta = delta > 0 ? { ...get().meta, activity } : get().meta
    set({ notes: get().notes.map((n) => (n.id === id ? updated : n)), meta, saveStatus: 'saving' })
    persistContent(updated)
    if (delta > 0) persistMeta(meta)
    get().markSaved()
  },

  updateNote: (id, patch) => {
    const note = get().notes.find((n) => n.id === id)
    if (!note) return
    const updated = { ...note, ...patch, updatedAt: Date.now() }
    set({ notes: get().notes.map((n) => (n.id === id ? updated : n)) })
    void db.putNote(updated)
  },

  toggleFavorite: (id) => {
    const note = get().notes.find((n) => n.id === id)
    if (!note) return
    const updated = { ...note, favorite: !note.favorite }
    set({ notes: get().notes.map((n) => (n.id === id ? updated : n)) })
    void db.putNote(updated)
  },

  togglePin: (id) => {
    const note = get().notes.find((n) => n.id === id)
    if (!note) return
    const updated = { ...note, pinned: !note.pinned }
    set({ notes: get().notes.map((n) => (n.id === id ? updated : n)) })
    void db.putNote(updated)
  },

  setNoteColor: (id, color) => {
    const note = get().notes.find((n) => n.id === id)
    if (!note) return
    const updated = { ...note, color: color || undefined }
    set({ notes: get().notes.map((n) => (n.id === id ? updated : n)) })
    void db.putNote(updated)
  },

  trashNote: (id) => {
    const note = get().notes.find((n) => n.id === id)
    if (!note) return
    const updated = { ...note, trashed: true, updatedAt: Date.now() }
    const meta = get().meta
    const openTabIds = meta.openTabIds.filter((t) => t !== id)
    const activeNoteId = meta.activeNoteId === id ? (openTabIds[openTabIds.length - 1] ?? null) : meta.activeNoteId
    const newMeta: Meta = { ...meta, openTabIds, activeNoteId }
    set({ notes: get().notes.map((n) => (n.id === id ? updated : n)), meta: newMeta })
    void db.putNote(updated)
    persistMeta(newMeta)
    get().toast('Moved to trash')
  },

  restoreNote: (id) => {
    const note = get().notes.find((n) => n.id === id)
    if (!note) return
    const updated = { ...note, trashed: false, updatedAt: Date.now() }
    set({ notes: get().notes.map((n) => (n.id === id ? updated : n)) })
    void db.putNote(updated)
    get().toast('Restored', 'success')
  },

  deleteNoteForever: (id) => {
    set({ notes: get().notes.filter((n) => n.id !== id) })
    void db.deleteNoteDB(id)
  },

  emptyTrash: () => {
    const trashed = get().notes.filter((n) => n.trashed)
    trashed.forEach((n) => void db.deleteNoteDB(n.id))
    set({ notes: get().notes.filter((n) => !n.trashed) })
    get().toast(`Emptied ${trashed.length} note${trashed.length === 1 ? '' : 's'} from trash`)
  },

  duplicateNote: (id) => {
    const note = get().notes.find((n) => n.id === id)
    if (!note) return null
    const now = Date.now()
    const copy: Note = { ...note, id: uid('note'), title: `${note.title} copy`, createdAt: now, updatedAt: now, openedAt: now }
    const meta = get().meta
    const newMeta: Meta = { ...meta, openTabIds: [copy.id, ...meta.openTabIds], activeNoteId: copy.id }
    set({ notes: [copy, ...get().notes], meta: newMeta })
    void db.putNote(copy)
    persistMeta(newMeta)
    return copy.id
  },

  toggleTask: (id, taskIndex) => {
    const note = get().notes.find((n) => n.id === id)
    if (!note) return
    let seen = -1
    const lines = note.content.split('\n').map((line) => {
      if (/^\s*[-*+]\s+\[[ xX]\]/.test(line)) {
        seen++
        if (seen === taskIndex) {
          return line.replace(/\[([ xX])\]/, (_m, s) => (s === ' ' ? '[x]' : '[ ]'))
        }
      }
      return line
    })
    get().setNoteContent(id, lines.join('\n'))
  },

  createFolder: (parentId = null, name = 'New Folder') => {
    const folder: Folder = { id: uid('fld'), name, parentId: parentId ?? null, expanded: true, createdAt: Date.now() }
    set({ folders: [...get().folders, folder] })
    void db.putFolder(folder)
    if (parentId) {
      const parent = get().folders.find((f) => f.id === parentId)
      if (parent && !parent.expanded) get().toggleFolder(parentId)
    }
    return folder.id
  },

  renameFolder: (id, name) => {
    const folder = get().folders.find((f) => f.id === id)
    if (!folder) return
    const updated = { ...folder, name: name || 'Folder' }
    set({ folders: get().folders.map((f) => (f.id === id ? updated : f)) })
    void db.putFolder(updated)
  },

  deleteFolder: (id) => {
    const folders = get().folders
    const folder = folders.find((f) => f.id === id)
    if (!folder) return
    const parentId = folder.parentId
    const notes = get().notes.map((n) => (n.folderId === id ? { ...n, folderId: parentId } : n))
    const remaining = folders.filter((f) => f.id !== id).map((f) => (f.parentId === id ? { ...f, parentId } : f))
    set({ folders: remaining, notes })
    void db.deleteFolderDB(id)
    notes.filter((n) => n.folderId === parentId).forEach((n) => void db.putNote(n))
    remaining.filter((f) => f.parentId === parentId).forEach((f) => void db.putFolder(f))
  },

  toggleFolder: (id) => {
    const folder = get().folders.find((f) => f.id === id)
    if (!folder) return
    const updated = { ...folder, expanded: !folder.expanded }
    set({ folders: get().folders.map((f) => (f.id === id ? updated : f)) })
    void db.putFolder(updated)
  },

  moveNote: (noteId, folderId) => {
    const note = get().notes.find((n) => n.id === noteId)
    if (!note) return
    const updated = { ...note, folderId, updatedAt: Date.now() }
    set({ notes: get().notes.map((n) => (n.id === noteId ? updated : n)) })
    void db.putNote(updated)
  },

  moveFolder: (folderId, parentId) => {
    const folder = get().folders.find((f) => f.id === folderId)
    if (!folder || folderId === parentId) return
    const descendant = (candidate: string | null): boolean => {
      let current = candidate
      while (current) {
        if (current === folderId) return true
        current = get().folders.find((f) => f.id === current)?.parentId ?? null
      }
      return false
    }
    if (descendant(parentId)) return
    const updated = { ...folder, parentId }
    set({ folders: get().folders.map((f) => (f.id === folderId ? updated : f)) })
    void db.putFolder(updated)
  },

  addImage: async (file) => {
    const dataUrl = await readFileAsDataUrl(file)
    const { width, height } = await loadImageSize(dataUrl)
    const image: ImageAsset = {
      id: uid('img'),
      name: file.name || 'image',
      type: file.type || 'image/png',
      dataUrl,
      size: file.size || Math.round(dataUrl.length * 0.75),
      width,
      height,
      createdAt: Date.now(),
    }
    set({ images: [image, ...get().images] })
    await db.putImage(image)
    return image.id
  },

  addImageFromDataUrl: async ({ name, type, dataUrl, preset }) => {
    const { width, height } = await loadImageSize(dataUrl)
    const image: ImageAsset = {
      id: uid('img'),
      name: name || 'image',
      type: type || 'image/png',
      dataUrl,
      size: Math.round(dataUrl.length * 0.75),
      width,
      height,
      createdAt: Date.now(),
      preset,
    }
    set({ images: [image, ...get().images] })
    await db.putImage(image)
    return image.id
  },

  deleteImage: async (id) => {
    const affected = get().notes.filter((n) => n.cover === id)
    const updatedNotes = affected.map((n) => ({ ...n, cover: undefined }))
    set({
      images: get().images.filter((img) => img.id !== id),
      notes: get().notes.map((n) => (n.cover === id ? { ...n, cover: undefined } : n)),
    })
    await db.deleteImageDB(id)
    for (const note of updatedNotes) await db.putNote(note)
  },

  insertImage: (id, alt = '') => {
    bus.emit('editor:insert-image', { id, alt })
  },

  setImagePicker: (imagePicker) => set({ imagePicker }),

  setNoteCover: (noteId, imageId) => {
    const note = get().notes.find((n) => n.id === noteId)
    if (!note) return
    const updated: Note = { ...note, cover: imageId ?? undefined, updatedAt: Date.now() }
    set({ notes: get().notes.map((n) => (n.id === noteId ? updated : n)) })
    void db.putNote(updated)
  },

  setSettings: (patch) => {
    const settings = { ...get().settings, ...patch }
    set({ settings })
    void db.putSettings(settings)
  },

  setMeta: (patch) => {
    const meta = { ...get().meta, ...patch }
    set({ meta })
    persistMeta(meta)
  },

  setLeftPane: (pane) => {
    set({ leftPane: pane })
    if (!get().settings.showLeft) get().setSettings({ showLeft: true })
  },
  setRightPane: (pane) => {
    set({ rightPane: pane })
    if (!get().settings.showRight) get().setSettings({ showRight: true })
  },
  setActiveTag: (tag) => set({ activeTag: tag }),

  setTimer: (patch) => set({ timer: { ...get().timer, ...patch } }),

  startTimer: () => {
    const t = get().timer
    const duration = (t.mode === 'focus' ? get().settings.pomodoroFocus : get().settings.pomodoroBreak) * 60000
    const remaining = t.remaining > 0 ? t.remaining : duration
    set({ timer: { ...t, running: true, endsAt: Date.now() + remaining, remaining } })
  },

  pauseTimer: () => {
    const t = get().timer
    if (!t.running || !t.endsAt) return
    set({ timer: { ...t, running: false, endsAt: null, remaining: Math.max(0, t.endsAt - Date.now()) } })
  },

  resetTimer: () => {
    const t = get().timer
    const duration = (t.mode === 'focus' ? get().settings.pomodoroFocus : get().settings.pomodoroBreak) * 60000
    set({ timer: { ...t, running: false, endsAt: null, remaining: duration } })
  },

  completeTimer: () => {
    const t = get().timer
    const nextMode: TimerMode = t.mode === 'focus' ? 'break' : 'focus'
    const sessions = t.mode === 'focus' ? t.sessions + 1 : t.sessions
    const duration = (nextMode === 'focus' ? get().settings.pomodoroFocus : get().settings.pomodoroBreak) * 60000
    set({ timer: { mode: nextMode, running: false, endsAt: null, remaining: duration, sessions } })
    get().toast(t.mode === 'focus' ? 'Focus session complete — time for a break' : 'Break over — back to it', 'success')
    bus.emit('timer:complete', nextMode)
  },

  markSaving: () => set({ saveStatus: 'saving' }),
  markSaved: () => {
    if (saveStatusTimer) clearTimeout(saveStatusTimer)
    saveStatusTimer = setTimeout(() => set({ saveStatus: 'saved' }), 600)
  },

  flushSaves: async () => {
    const pending = Array.from(pendingNotes.values())
    contentTimers.forEach((t) => clearTimeout(t))
    contentTimers.clear()
    pendingNotes.clear()
    if (pending.length) await db.putNotes(pending)
    if (metaTimer) {
      clearTimeout(metaTimer)
      metaTimer = null
      await db.putMeta(get().meta)
    }
  },

  toast: (message, type = 'info') => {
    const toast: Toast = { id: uid('toast'), message, type }
    set({ toasts: [...get().toasts, toast] })
    setTimeout(() => get().dismissToast(toast.id), 3200)
  },

  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
  setModal: (modal) => set({ modal }),
  setPalette: (palette) => set({ palette }),

  setWebQuery: (query) => set({ webQuery: query }),

  runWebSearch: async (query) => {
    const q = (query ?? get().webQuery).trim()
    if (!q) return
    set({ webQuery: q, webLoading: true, webError: null })
    try {
      const res = await window.api.web.search(q)
      set({ webResponse: res, webLoading: false, webError: res.error ?? null })
    } catch (err) {
      set({ webLoading: false, webError: String(err), webResponse: null })
    }
  },

  createDailyNote: () => {
    get().createDailyNoteFor(new Date())
    get().toast('Opened today’s daily note')
  },

  createDailyNoteFor: (date) => {
    const existing = get().notes.find((n) => n.tags.includes('daily') && new Date(n.createdAt).toDateString() === date.toDateString())
    if (existing) {
      get().openNote(existing.id)
      return
    }
    const label = date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    const content = `# ${label}\n\n> [!info] ${label}\n> A quiet page for this day.\n\n## Focus\n- [ ] \n\n## Log\n- \n\n## Gratitude\n- \n\n#daily`
    get().createNote(null, content)
    get().toast('Daily note created', 'success')
  },

  runCommand: (id) => {
    const state = get()
    switch (id) {
      case 'new-note':
        state.createNote(state.meta.activeNoteId ? (state.notes.find((n) => n.id === state.meta.activeNoteId)?.folderId ?? null) : null)
        break
      case 'new-folder':
        if (state.leftPane !== 'files') state.setLeftPane('files')
        state.createFolder(null, 'New Folder')
        break
      case 'daily-note':
        state.createDailyNote()
        break
      case 'save':
        void state.flushSaves().then(() => state.toast('Saved', 'success'))
        break
      case 'export-note': {
        const note = state.notes.find((n) => n.id === state.meta.activeNoteId)
        if (!note) {
          state.toast('No note open to export', 'error')
          break
        }
        void exportNoteAsMarkdown(note).then((path) => {
          if (path) state.toast('Exported note', 'success')
        })
        break
      }
      case 'export-vault':
        void exportVaultJSON(snapshotOf(state)).then((path) => {
          if (path) state.toast('Vault exported', 'success')
        })
        break
      case 'export-markdown':
        void exportAllMarkdown(state.notes, state.images).then((count) => {
          if (count > 0) state.toast(`Exported ${count} notes as markdown`, 'success')
        })
        break
      case 'import-vault':
        void importVaultJSON()
          .then((snapshot) => {
            if (!snapshot) return
            state.setImportSnapshot(snapshot)
            state.setModal('import')
          })
          .catch((err: Error) => get().toast(err.message, 'error'))
        break
      case 'settings':
        state.setModal('settings')
        break
      case 'shortcuts':
        state.setModal('shortcuts')
        break
      case 'about':
        state.setModal('about')
        break
      case 'insert-image':
        if (!state.meta.activeNoteId) {
          state.toast('Open a note first', 'error')
          break
        }
        if (state.settings.viewMode === 'preview') state.setSettings({ viewMode: 'source' })
        state.setImagePicker('insert')
        break
      case 'set-cover':
        if (!state.meta.activeNoteId) {
          state.toast('Open a note first', 'error')
          break
        }
        state.setImagePicker('cover')
        break
      case 'remove-cover': {
        const coverNote = state.meta.activeNoteId
        if (coverNote) state.setNoteCover(coverNote, null)
        break
      }
      case 'open-widgets':
        state.setRightPane('widgets')
        break
      case 'open-web':
        state.setRightPane('web')
        break
      case 'timer-toggle':
        if (state.timer.running) state.pauseTimer()
        else state.startTimer()
        break
      case 'timer-reset':
        state.resetTimer()
        break
      case 'command-palette':
        state.setPalette('command')
        break
      case 'quick-switcher':
        state.setPalette('quick')
        break
      case 'search-all':
        state.setLeftPane('search')
        state.setPalette(null)
        break
      case 'find':
        bus.emit('editor:find')
        break
      case 'view-source':
        state.setSettings({ viewMode: 'source' })
        break
      case 'view-preview':
        state.setSettings({ viewMode: 'preview' })
        break
      case 'view-split':
        state.setSettings({ viewMode: 'split' })
        break
      case 'toggle-left':
        state.setSettings({ showLeft: !state.settings.showLeft })
        break
      case 'toggle-right':
        state.setSettings({ showRight: !state.settings.showRight })
        break
      case 'focus-mode':
        state.setSettings({ focusMode: !state.settings.focusMode })
        state.toast(`Focus mode ${!state.settings.focusMode ? 'on' : 'off'}`)
        break
      case 'typewriter-mode':
        state.setSettings({ typewriterMode: !state.settings.typewriterMode })
        state.toast(`Typewriter mode ${!state.settings.typewriterMode ? 'on' : 'off'}`)
        break
      case 'toggle-favorite': {
        const active = state.meta.activeNoteId
        if (active) state.toggleFavorite(active)
        break
      }
      case 'delete-note': {
        const active = state.meta.activeNoteId
        if (active) state.trashNote(active)
        break
      }
      case 'open-today':
        state.createDailyNote()
        break
      default:
        bus.emit(`editor:${id}`)
    }
  },
}))
