export interface Note {
  id: string
  title: string
  content: string
  folderId: string | null
  tags: string[]
  favorite: boolean
  pinned: boolean
  trashed: boolean
  color?: string
  cover?: string
  coverPosition?: 'top' | 'center' | 'bottom'
  createdAt: number
  updatedAt: number
  openedAt: number
}

export interface Folder {
  id: string
  name: string
  parentId: string | null
  expanded: boolean
  createdAt: number
}

export interface ImageAsset {
  id: string
  name: string
  type: string
  dataUrl: string
  size: number
  width?: number
  height?: number
  createdAt: number
  preset?: boolean
}

export type ViewMode = 'source' | 'preview' | 'split'
export type ThemeName = 'opencode-dark' | 'graphite' | 'paper'
export type ContentWidth = 'narrow' | 'medium' | 'wide' | 'full'
export type Density = 'compact' | 'cozy' | 'spacious'
export type SortMode = 'name' | 'modified' | 'created'
export type LeftPane = 'files' | 'search' | 'tags' | 'favorites' | 'recent'
export type RightPane = 'outline' | 'links' | 'graph' | 'info' | 'widgets' | 'web'

export interface WebSearchResult {
  title: string
  snippet: string
  url: string
}
export interface WebSearchSummary {
  title: string
  extract: string
  url: string
  source: string
}
export interface WebSearchResponse {
  query: string
  summary: WebSearchSummary | null
  results: WebSearchResult[]
  error?: string
}

export interface Settings {
  userName: string
  theme: ThemeName
  accent: string
  uiFont: string
  monoFont: string
  fontSize: number
  previewFontSize: number
  editorLineHeight: number
  contentWidth: ContentWidth
  density: Density
  reduceMotion: boolean
  backgroundTexture: boolean
  lineNumbers: boolean
  lineWrapping: boolean
  highlightActiveLine: boolean
  tabSize: number
  spellcheck: boolean
  showToolbar: boolean
  showStatusBar: boolean
  autoSave: boolean
  autoSaveDelay: number
  focusMode: boolean
  focusDim: number
  typewriterMode: boolean
  viewMode: ViewMode
  showRibbon: boolean
  showLeft: boolean
  showRight: boolean
  showWordGoal: boolean
  dailyGoal: number
  sort: SortMode
  widgetsTodo: boolean
  widgetsClock: boolean
  widgetsCalendar: boolean
  clock24h: boolean
  clockSeconds: boolean
  pomodoroFocus: number
  pomodoroBreak: number
  weekStartsMonday: boolean
  showCompletedTasks: boolean
}

export interface Meta {
  openTabIds: string[]
  activeNoteId: string | null
  vaultName: string
  activity: Record<string, number>
}

export interface Snapshot {
  app: 'novelty'
  version: number
  exportedAt: number
  vaultName: string
  notes: Note[]
  folders: Folder[]
  settings: Settings
  images?: ImageAsset[]
}

export interface SearchResult {
  noteId: string
  title: string
  snippet: string
  score: number
  matches: number
}

export interface OutlineItem {
  level: number
  text: string
  id: string
  line: number
}

export interface LinkRef {
  id: string
  title: string
}

export interface TaskItem {
  id: string
  noteId: string
  noteTitle: string
  text: string
  done: boolean
  index: number
  line: number
}

export type TimerMode = 'focus' | 'break'

export interface TimerState {
  mode: TimerMode
  running: boolean
  endsAt: number | null
  remaining: number
  sessions: number
}
