import type { Note } from '../src/renderer/src/store/types'

export function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'n1',
    title: 'Test note',
    content: '',
    folderId: null,
    tags: [],
    favorite: false,
    pinned: false,
    trashed: false,
    createdAt: 1_000_000,
    updatedAt: 1_000_000,
    openedAt: 1_000_000,
    ...overrides,
  }
}