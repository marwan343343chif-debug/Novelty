import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Circle, Clock, ListTodo, Pause, Play, RotateCcw } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { extractTasks } from '../../lib/stats'
import type { Note } from '../../store/types'

const pad = (n: number): string => n.toString().padStart(2, '0')

const WD_MON = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const WD_SUN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function TodoWidget(): JSX.Element {
  const notes = useStore((s) => s.notes)
  const showCompleted = useStore((s) => s.settings.showCompletedTasks)
  const setSettings = useStore((s) => s.setSettings)
  const toggleTask = useStore((s) => s.toggleTask)
  const openNote = useStore((s) => s.openNote)

  const { tasks, done, total } = useMemo(() => {
    const live = notes.filter((n) => !n.trashed)
    const all = live.flatMap((n) => extractTasks(n))
    const doneCount = all.filter((t) => t.done).length
    const visible = (showCompleted ? all : all.filter((t) => !t.done)).sort((a, b) => Number(a.done) - Number(b.done))
    return { tasks: visible, done: doneCount, total: all.length }
  }, [notes, showCompleted])

  const pct = total ? Math.round((done / total) * 100) : 0

  return (
    <section className="widget">
      <header className="widget-head">
        <span className="widget-title">
          <ListTodo size={14} /> Tasks
        </span>
        <button
          className={`widget-chip${showCompleted ? ' active' : ''}`}
          onClick={() => setSettings({ showCompletedTasks: !showCompleted })}
          title={showCompleted ? 'Hide completed' : 'Show completed'}
        >
          {done}/{total}
        </button>
      </header>
      <div className="widget-progress">
        <span style={{ width: `${pct}%` }} />
      </div>
      <div className="widget-body todo-list">
        {tasks.length === 0 ? (
          <p className="widget-empty">
            No open tasks. Add <code>- [ ]</code> items to any note.
          </p>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className={`todo-item${task.done ? ' done' : ''}`}>
              <button className="todo-check" onClick={() => toggleTask(task.noteId, task.index)} title="Toggle task">
                {task.done ? <CheckCircle2 size={15} /> : <Circle size={15} />}
              </button>
              <button className="todo-text" onClick={() => openNote(task.noteId)} title={`In ${task.noteTitle}`}>
                <span>{task.text}</span>
                <em>{task.noteTitle}</em>
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

function ClockWidget(): JSX.Element {
  const settings = useStore((s) => s.settings)
  const timer = useStore((s) => s.timer)
  const startTimer = useStore((s) => s.startTimer)
  const pauseTimer = useStore((s) => s.pauseTimer)
  const resetTimer = useStore((s) => s.resetTimer)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (timer.running && timer.endsAt && now >= timer.endsAt) useStore.getState().completeTimer()
  }, [now, timer.running, timer.endsAt])

  const date = new Date(now)
  const clock = settings.clock24h
    ? `${pad(date.getHours())}:${pad(date.getMinutes())}${settings.clockSeconds ? `:${pad(date.getSeconds())}` : ''}`
    : `${((date.getHours() + 11) % 12) + 1}:${pad(date.getMinutes())}${settings.clockSeconds ? `:${pad(date.getSeconds())}` : ''} ${date.getHours() < 12 ? 'AM' : 'PM'}`
  const dateLabel = date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })

  const remaining = timer.running && timer.endsAt ? Math.max(0, timer.endsAt - now) : timer.remaining
  const totalMs = (timer.mode === 'focus' ? settings.pomodoroFocus : settings.pomodoroBreak) * 60000
  const seconds = Math.ceil(remaining / 1000)
  const pct = totalMs ? Math.max(0, Math.min(100, (remaining / totalMs) * 100)) : 0

  return (
    <section className="widget">
      <header className="widget-head">
        <span className="widget-title">
          <Clock size={14} /> Clock
        </span>
        <span className={`widget-chip timer-mode ${timer.mode}`}>{timer.mode === 'focus' ? 'Focus' : 'Break'}</span>
      </header>
      <div className="widget-body clock-body">
        <div className="clock-time">{clock}</div>
        <div className="clock-date">{dateLabel}</div>
        <div className="timer">
          <div className="timer-progress">
            <span style={{ width: `${pct}%` }} />
          </div>
          <div className="timer-row">
            <span className="timer-count">
              {pad(Math.floor(seconds / 60))}:{pad(seconds % 60)}
            </span>
            <div className="timer-actions">
              <button
                className="icon-btn"
                aria-label={timer.running ? 'Pause' : 'Start'}
                onClick={timer.running ? pauseTimer : startTimer}
                title={timer.running ? 'Pause' : 'Start'}
              >
                {timer.running ? <Pause size={15} /> : <Play size={15} />}
              </button>
              <button className="icon-btn" aria-label="Reset timer" onClick={resetTimer} title="Reset">
                <RotateCcw size={15} />
              </button>
            </div>
          </div>
          <div className="timer-caption">
            {timer.sessions} {timer.sessions === 1 ? 'session' : 'sessions'} completed
          </div>
        </div>
      </div>
    </section>
  )
}

function CalendarWidget(): JSX.Element {
  const notes = useStore((s) => s.notes)
  const settings = useStore((s) => s.settings)
  const createDailyNoteFor = useStore((s) => s.createDailyNoteFor)
  const openNote = useStore((s) => s.openNote)
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  const dailyByDay = useMemo(() => {
    const map = new Map<string, Note>()
    for (const n of notes) {
      if (!n.trashed && n.tags.includes('daily')) map.set(new Date(n.createdAt).toDateString(), n)
    }
    return map
  }, [notes])

  const weekdays = settings.weekStartsMonday ? WD_MON : WD_SUN
  const firstDay = new Date(cursor.getFullYear(), cursor.getMonth(), 1).getDay()
  const offset = settings.weekStartsMonday ? (firstDay + 6) % 7 : firstDay
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()
  const cells: (number | null)[] = [...Array.from({ length: offset }, () => null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  const todayStr = new Date().toDateString()
  const monthLabel = cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  const shift = (delta: number): void => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1))

  const pick = (day: number): void => {
    const date = new Date(cursor.getFullYear(), cursor.getMonth(), day)
    const existing = dailyByDay.get(date.toDateString())
    if (existing) openNote(existing.id)
    else createDailyNoteFor(date)
  }

  return (
    <section className="widget">
      <header className="widget-head">
        <span className="widget-title">
          <CalendarDays size={14} /> Calendar
        </span>
        <div className="calendar-nav">
          <button className="icon-btn" aria-label="Previous month" onClick={() => shift(-1)} title="Previous month">
            <ChevronLeft size={14} />
          </button>
          <button className="icon-btn" aria-label="Next month" onClick={() => shift(1)} title="Next month">
            <ChevronRight size={14} />
          </button>
        </div>
      </header>
      <div className="widget-body calendar-body">
        <div className="calendar-month">{monthLabel}</div>
        <div className="calendar-grid">
          {weekdays.map((wd) => (
            <span key={wd} className="calendar-wd">
              {wd[0]}
            </span>
          ))}
          {cells.map((day, i) => {
            if (day === null) return <span key={`b${i}`} className="calendar-cell empty" />
            const date = new Date(cursor.getFullYear(), cursor.getMonth(), day)
            const dayStr = date.toDateString()
            const hasDaily = dailyByDay.has(dayStr)
            return (
              <button
                key={dayStr}
                className={`calendar-cell${dayStr === todayStr ? ' today' : ''}${hasDaily ? ' has-note' : ''}`}
                onClick={() => pick(day)}
                title={hasDaily ? 'Open daily note' : 'Create daily note'}
              >
                {day}
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function WidgetsPane(): JSX.Element {
  const widgets = useStore((s) => s.settings)
  return (
    <div className="widgets-pane">
      {widgets.widgetsTodo ? <TodoWidget /> : null}
      {widgets.widgetsClock ? <ClockWidget /> : null}
      {widgets.widgetsCalendar ? <CalendarWidget /> : null}
      {!widgets.widgetsTodo && !widgets.widgetsClock && !widgets.widgetsCalendar ? (
        <p className="widget-empty">All widgets are hidden. Enable them in Settings → Widgets.</p>
      ) : null}
    </div>
  )
}
