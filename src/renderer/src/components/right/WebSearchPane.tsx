import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, CloudOff, ExternalLink, Globe, Loader2, RotateCcw, Search, Sparkles, X } from 'lucide-react'
import { useStore } from '../../store/useStore'
import type { WebSearchResult } from '../../store/types'

const SUGGESTIONS = ['Lingua franca', 'Zettelkasten', 'CSS grid', 'Byte order mark']

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

export function WebSearchPane(): JSX.Element {
  const query = useStore((s) => s.webQuery)
  const response = useStore((s) => s.webResponse)
  const loading = useStore((s) => s.webLoading)
  const error = useStore((s) => s.webError)
  const setWebQuery = useStore((s) => s.setWebQuery)
  const runWebSearch = useStore((s) => s.runWebSearch)
  const inputRef = useRef<HTMLInputElement>(null)
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const goOnline = (): void => setOnline(true)
    const goOffline = (): void => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  const open = (url: string): void => {
    if (url) void window.api.shell.openExternal(url)
  }

  const submit = (e: React.FormEvent): void => {
    e.preventDefault()
    void runWebSearch()
  }

  return (
    <div className="web-pane">
      <form className="web-search" onSubmit={submit}>
        <Search size={14} className="web-search-icon" />
        <input
          ref={inputRef}
          className="web-input"
          type="text"
          value={query}
          spellCheck={false}
          placeholder="Search the web…"
          onChange={(e) => setWebQuery(e.target.value)}
        />
        {query ? (
          <button type="button" className="web-clear" title="Clear" onClick={() => setWebQuery('')}>
            <X size={13} />
          </button>
        ) : null}
        <button type="submit" className="web-go" title="Search" disabled={loading || !query.trim()}>
          {loading ? <Loader2 size={14} className="spin" /> : <ArrowUpRight size={14} />}
        </button>
      </form>

      <div className="web-body">
        {error ? (
          <div className="web-error" role="alert">
            <span className="web-error-icon">
              {!online ? <CloudOff size={16} /> : <Search size={16} />}
            </span>
            <div className="web-error-text">
              <span className="web-error-title">{!online ? 'You are offline' : 'Search failed'}</span>
              <span className="web-error-message">{!online ? 'Connect to the internet and try again.' : error}</span>
            </div>
            <button className="web-chip" onClick={() => void runWebSearch()} disabled={loading}>
              <RotateCcw size={12} /> Retry
            </button>
          </div>
        ) : null}

        {loading ? (
          <div className="web-loading">
            <Loader2 size={18} className="spin" />
            <span>Searching…</span>
          </div>
        ) : null}

        {!loading && !response && !error ? (
          <div className="web-intro">
            <span className="web-intro-mark">
              <Globe size={22} />
            </span>
            <p className="web-intro-title">Quick web search</p>
            <p className="web-intro-desc">Look up a term and get a short, readable summary without leaving your notes.</p>
            <div className="web-suggestions">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="web-chip" onClick={() => void runWebSearch(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {response?.summary ? (
          <article className="web-summary">
            <header className="web-summary-head">
              <span className="web-summary-badge">
                <Sparkles size={12} /> Summary
              </span>
              {response.summary.source ? <span className="web-summary-source">{response.summary.source}</span> : null}
            </header>
            <h3 className="web-summary-title">{response.summary.title}</h3>
            <p className="web-summary-text">{response.summary.extract}</p>
            {response.summary.url ? (
              <button className="web-open" onClick={() => open(response.summary!.url)}>
                <ExternalLink size={13} /> Open source
              </button>
            ) : null}
          </article>
        ) : null}

        {response && response.results.length > 0 ? (
          <div className="web-results">
            <div className="web-results-label">Results</div>
            {response.results.map((r: WebSearchResult) => (
              <button key={r.url} className="web-result" onClick={() => open(r.url)} title={r.url}>
                <span className="web-result-host">{hostOf(r.url)}</span>
                <span className="web-result-title">{r.title}</span>
                {r.snippet ? <span className="web-result-snippet">{r.snippet}</span> : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
