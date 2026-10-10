import { useMemo } from 'react'
import { CalendarDays, CheckCircle2, Circle, Clock, FileText, Plus, Search, Settings as SettingsIcon, Sparkles, Star } from 'lucide-react'
import { useStore } from '../store/useStore'
import { extractTasks } from '../lib/stats'
import { relativeTime } from '../lib/utils'
import type { Note } from '../store/types'

function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Still up'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export function HomeView(): JSX.Element {
  const notes = useStore((s) => s.notes)
  const userName = useStore((s) => s.settings.userName)
  const openNote = useStore((s) => s.openNote)
  const createNote = useStore((s) => s.createNote)
  const createDailyNote = useStore((s) => s.createDailyNote)
  const toggleTask = useStore((s) => s.toggleTask)
  const setPalette = useStore((s) => s.setPalette)
  const setModal = useStore((s) => s.setModal)

  const recent = useMemo(
    () =>
      notes
        .filter((n) => !n.trashed)
        .slice()
        .sort((a, b) => (b.openedAt || b.updatedAt) - (a.openedAt || a.updatedAt))
        .slice(0, 6),
    [notes],
  )

  const favorites = useMemo(
    () =>
      notes
        .filter((n) => !n.trashed && n.favorite)
        .slice()
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 6),
    [notes],
  )

  const tasks = useMemo(
    () =>
      notes
        .filter((n) => !n.trashed)
        .flatMap((n) => extractTasks(n))
        .filter((t) => !t.done)
        .slice(0, 6),
    [notes],
  )

  const isEmptyVault = notes.filter((n) => !n.trashed).length === 0
  const name = userName.trim()

  return (
    <div className="home">
      <div className="home-inner">
        <header className="home-hero">
          <span className="home-eyebrow">
            <Sparkles size={13} /> {greeting()}
          </span>
          <h1 className="home-title">{name ? `Welcome back, ${name}` : 'Welcome to Novelty'}</h1>
          <p className="home-sub">
            {isEmptyVault
              ? 'Your vault is a blank page. Create your first note and start writing.'
              : 'Pick up where you left off, or start something new.'}
          </p>
          <div className="home-actions">
            <button className="btn btn-primary" onClick={() => createNote(null)}>
              <Plus size={15} /> New note
            </button>
            <button className="btn" onClick={createDailyNote}>
              <CalendarDays size={15} /> Today’s note
            </button>
            <button className="btn" onClick={() => setPalette('quick')}>
              <Search size={15} /> Quick switcher
            </button>
          </div>
          {!name ? (
            <button className="home-name-hint" onClick={() => setModal('settings')}>
              <SettingsIcon size={13} /> Add your name in Settings to personalize this page
            </button>
          ) : null}
        </header>

        <div className="home-grid">
          <section className="home-card">
            <header className="home-card-head">
              <span className="home-card-title">
                <Clock size={14} /> Recent
              </span>
              <span className="home-card-count">{recent.length}</span>
            </header>
            <div className="home-list">
              {recent.length === 0 ? (
                <p className="home-empty">No notes yet.</p>
              ) : (
                recent.map((n: Note) => (
                  <button key={n.id} className="home-item" onClick={() => openNote(n.id)}>
                    <FileText size={14} className="home-item-icon" />
                    <span className="home-item-title">{n.title || 'Untitled'}</span>
                    <span className="home-item-meta">{relativeTime(n.openedAt || n.updatedAt)}</span>
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="home-card">
            <header className="home-card-head">
              <span className="home-card-title">
                <Star size={14} /> Favorites
              </span>
              <span className="home-card-count">{favorites.length}</span>
            </header>
            <div className="home-list">
              {favorites.length === 0 ? (
                <p className="home-empty">Star a note to keep it close.</p>
              ) : (
                favorites.map((n: Note) => (
                  <button key={n.id} className="home-item" onClick={() => openNote(n.id)}>
                    <Star size={14} className="home-item-icon" />
                    <span className="home-item-title">{n.title || 'Untitled'}</span>
                    <span className="home-item-meta">{relativeTime(n.updatedAt)}</span>
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="home-card">
            <header className="home-card-head">
              <span className="home-card-title">
                <CheckCircle2 size={14} /> To-do
              </span>
              <span className="home-card-count">{tasks.length}</span>
            </header>
            <div className="home-list">
              {tasks.length === 0 ? (
                <p className="home-empty">
                  Nothing on the list. Add <code>- [ ]</code> tasks to any note.
                </p>
              ) : (
                tasks.map((t) => (
                  <div key={t.id} className="home-task">
                    <button className="home-task-check" title="Mark done" onClick={() => toggleTask(t.noteId, t.index)}>
                      <Circle size={14} />
                    </button>
                    <button className="home-task-text" onClick={() => openNote(t.noteId)} title={t.noteTitle}>
                      <span className="home-item-title">{t.text}</span>
                      <span className="home-item-meta">{t.noteTitle}</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
