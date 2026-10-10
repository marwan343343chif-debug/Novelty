import { useEffect, useState } from 'react'
import { Check, Loader2, Target, Type, Hash } from 'lucide-react'
import { useStore } from '../store/useStore'
import { bus } from '../lib/bus'
import { computeStats } from '../lib/stats'
import { pluralize, todayKey } from '../lib/utils'

export function StatusBar(): JSX.Element {
  const content = useStore((s) => s.notes.find((n) => n.id === s.meta.activeNoteId)?.content ?? '')
  const saveStatus = useStore((s) => s.saveStatus)
  const dailyGoal = useStore((s) => s.settings.dailyGoal)
  const showWordGoal = useStore((s) => s.settings.showWordGoal)
  const activity = useStore((s) => s.meta.activity)
  const setLeftPane = useStore((s) => s.setLeftPane)
  const setRightPane = useStore((s) => s.setRightPane)
  const [cursor, setCursor] = useState({ line: 1, col: 1 })

  useEffect(() => {
    return bus.on('editor:cursor', (payload) => setCursor(payload as { line: number; col: number }))
  }, [])

  const stats = computeStats(content)
  const written = activity[todayKey()] ?? 0
  const progress = dailyGoal > 0 ? Math.min(100, Math.round((written / dailyGoal) * 100)) : 0

  return (
    <footer className="statusbar">
      <span className="status-item">{pluralize(stats.words, 'word')}</span>
      <span className="status-item">{stats.chars.toLocaleString()} chars</span>
      <span className="status-item">{stats.reading} min read</span>
      {content ? (
        <span className="status-item clickable" onClick={() => setLeftPane('tags')} title="Open tags">
          <Hash size={11} /> {stats.tags.length}
        </span>
      ) : null}
      <span className="status-item clickable" onClick={() => setRightPane('outline')} title="Jump to heading">
        <Type size={11} /> Ln {cursor.line}, Col {cursor.col}
      </span>

      <span className="status-spacer" />

      {showWordGoal ? (
        <span className="status-item clickable" title="Words written today vs goal">
          <Target size={11} /> {written}/{dailyGoal}
          <span className="progress-track">
            <span className="progress-fill" style={{ width: `${progress}%` }} />
          </span>
        </span>
      ) : null}
      <span className={`status-item ${saveStatus === 'saving' ? 'status-saving' : saveStatus === 'saved' ? 'status-saved' : ''}`}>
        {saveStatus === 'saving' ? (
          <>
            <Loader2 size={11} className="spin" /> Saving…
          </>
        ) : (
          <>
            <Check size={11} /> Saved
          </>
        )}
      </span>
    </footer>
  )
}
