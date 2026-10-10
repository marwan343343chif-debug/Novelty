import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import { DB_NAME, DB_VERSION, DEFAULT_SETTINGS } from './constants'
import type { Note, Folder, Settings, Meta, Snapshot, ImageAsset } from '../store/types'

interface NoveltyDB extends DBSchema {
  notes: { key: string; value: Note }
  folders: { key: string; value: Folder }
  images: { key: string; value: ImageAsset }
  kv: { key: string; value: { id: string; value: unknown } }
}

let dbPromise: Promise<IDBPDatabase<NoveltyDB>> | null = null

function getDB(): Promise<IDBPDatabase<NoveltyDB>> {
  if (!dbPromise) {
    dbPromise = openDB<NoveltyDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('notes')) db.createObjectStore('notes', { keyPath: 'id' })
        if (!db.objectStoreNames.contains('folders')) db.createObjectStore('folders', { keyPath: 'id' })
        if (!db.objectStoreNames.contains('images')) db.createObjectStore('images', { keyPath: 'id' })
        if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv', { keyPath: 'id' })
      },
    })
  }
  return dbPromise
}

export interface LoadedVault {
  notes: Note[]
  folders: Folder[]
  images: ImageAsset[]
  settings: Settings | null
  meta: Meta | null
}

export async function loadVault(): Promise<LoadedVault> {
  const db = await getDB()
  const [notes, folders, images, settings, meta] = await Promise.all([
    db.getAll('notes'),
    db.getAll('folders'),
    db.getAll('images'),
    db.get('kv', 'settings'),
    db.get('kv', 'meta'),
  ])
  return {
    notes,
    folders,
    images,
    settings: (settings?.value as Settings) ?? null,
    meta: (meta?.value as Meta) ?? null,
  }
}

export async function putNote(note: Note): Promise<void> {
  const db = await getDB()
  await db.put('notes', note)
}

export async function putNotes(notes: Note[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('notes', 'readwrite')
  await Promise.all([...notes.map((n) => tx.store.put(n)), tx.done])
}

export async function deleteNoteDB(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('notes', id)
}

export async function putFolder(folder: Folder): Promise<void> {
  const db = await getDB()
  await db.put('folders', folder)
}

export async function deleteFolderDB(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('folders', id)
}

export async function putImage(image: ImageAsset): Promise<void> {
  const db = await getDB()
  await db.put('images', image)
}

export async function putImages(images: ImageAsset[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('images', 'readwrite')
  await Promise.all([...images.map((img) => tx.store.put(img)), tx.done])
}

export async function deleteImageDB(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('images', id)
}

export async function putSettings(settings: Settings): Promise<void> {
  const db = await getDB()
  await db.put('kv', { id: 'settings', value: settings })
}

export async function putMeta(meta: Meta): Promise<void> {
  const db = await getDB()
  await db.put('kv', { id: 'meta', value: meta })
}

export async function replaceAll(snapshot: Snapshot): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(['notes', 'folders', 'images', 'kv'], 'readwrite')
  await tx.objectStore('notes').clear()
  await tx.objectStore('folders').clear()
  await tx.objectStore('images').clear()
  await tx.objectStore('kv').clear()
  await Promise.all(snapshot.notes.map((n) => tx.objectStore('notes').put(n)))
  await Promise.all(snapshot.folders.map((f) => tx.objectStore('folders').put(f)))
  await Promise.all((snapshot.images ?? []).map((img) => tx.objectStore('images').put(img)))
  await tx.objectStore('kv').put({
    id: 'meta',
    value: {
      openTabIds: snapshot.notes[0] ? [snapshot.notes[0].id] : [],
      activeNoteId: snapshot.notes[0]?.id ?? null,
      vaultName: snapshot.vaultName,
      activity: {},
    } satisfies Meta,
  })
  await tx.objectStore('kv').put({ id: 'settings', value: snapshot.settings })
  await tx.done
}

export async function mergeAll(snapshot: Snapshot, keepLocal: boolean): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(['notes', 'folders', 'images', 'kv'], 'readwrite')

  for (const n of snapshot.notes) await tx.objectStore('notes').put(n)
  for (const f of snapshot.folders) await tx.objectStore('folders').put(f)
  for (const img of snapshot.images ?? []) await tx.objectStore('images').put(img)

  const current = (await tx.objectStore('kv').get('settings'))?.value as Partial<Settings> | undefined
  const merged: Settings = keepLocal
    ? { ...DEFAULT_SETTINGS, ...(snapshot.settings ?? {}), ...(current ?? {}) }
    : { ...DEFAULT_SETTINGS, ...(current ?? {}), ...(snapshot.settings ?? {}) }
  const meta = (await tx.objectStore('kv').get('meta'))?.value as Meta | undefined
  await tx.objectStore('kv').put({ id: 'settings', value: merged })
  await tx.objectStore('kv').put({
    id: 'meta',
    value: { activity: {}, vaultName: 'My Vault', ...(meta ?? {}), openTabIds: [], activeNoteId: null } satisfies Meta,
  })
  await tx.done
}

export async function wipeVault(): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(['notes', 'folders', 'images', 'kv'], 'readwrite')
  await tx.objectStore('notes').clear()
  await tx.objectStore('folders').clear()
  await tx.objectStore('images').clear()
  await tx.objectStore('kv').clear()
  await tx.done
}
