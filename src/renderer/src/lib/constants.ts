import type { Settings, ContentWidth, Density } from '../store/types'

export const APP_NAME = 'Novelty'
export const DB_NAME = 'novelty-vault'
export const DB_VERSION = 2
export const SNAPSHOT_VERSION = 2

export const UI_FONTS = [
  { name: 'Inter (system)', value: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
  { name: 'Grotesk', value: '"Space Grotesk", "Inter", system-ui, sans-serif' },
  { name: 'Serif', value: 'Georgia, "Iowan Old Style", "Times New Roman", serif' },
  { name: 'System Mono', value: 'ui-monospace, SFMono-Regular, Menlo, monospace' },
]

export const MONO_FONTS = [
  { name: 'JetBrains Mono', value: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' },
  { name: 'Cascadia Code', value: '"Cascadia Code", "Cascadia Mono", ui-monospace, monospace' },
  { name: 'Fira Code', value: '"Fira Code", ui-monospace, monospace' },
  { name: 'System Mono', value: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' },
]

export const CONTENT_WIDTHS: Record<ContentWidth, string> = {
  narrow: '620px',
  medium: '760px',
  wide: '960px',
  full: '100%',
}

export const DENSITY_OPTIONS: { value: Density; label: string }[] = [
  { value: 'compact', label: 'Compact' },
  { value: 'cozy', label: 'Cozy' },
  { value: 'spacious', label: 'Spacious' },
]

export const DEFAULT_SETTINGS: Settings = {
  userName: '',
  theme: 'opencode-dark',
  accent: '#f5a524',
  uiFont: UI_FONTS[0].value,
  monoFont: MONO_FONTS[0].value,
  fontSize: 16,
  previewFontSize: 15,
  editorLineHeight: 1.75,
  contentWidth: 'medium',
  density: 'cozy',
  reduceMotion: false,
  backgroundTexture: true,
  lineNumbers: true,
  lineWrapping: true,
  highlightActiveLine: true,
  tabSize: 2,
  spellcheck: true,
  showToolbar: true,
  showStatusBar: true,
  autoSave: true,
  autoSaveDelay: 500,
  focusMode: false,
  focusDim: 0.32,
  typewriterMode: false,
  viewMode: 'source',
  showRibbon: true,
  showLeft: true,
  showRight: true,
  showWordGoal: true,
  dailyGoal: 500,
  sort: 'modified',
  widgetsTodo: true,
  widgetsClock: true,
  widgetsCalendar: true,
  clock24h: true,
  clockSeconds: false,
  pomodoroFocus: 25,
  pomodoroBreak: 5,
  weekStartsMonday: true,
  showCompletedTasks: false,
}

export interface ShortcutItem {
  keys: string
  label: string
  group: string
}

export const SHORTCUTS: ShortcutItem[] = [
  { group: 'General', keys: 'Ctrl/⌘ P', label: 'Command palette' },
  { group: 'General', keys: 'Ctrl/⌘ O', label: 'Quick switcher' },
  { group: 'General', keys: 'Ctrl/⌘ N', label: 'New note' },
  { group: 'General', keys: 'Ctrl/⌘ ⇧ N', label: 'New folder' },
  { group: 'General', keys: 'Ctrl/⌘ D', label: 'Daily note' },
  { group: 'General', keys: 'Ctrl/⌘ S', label: 'Save note' },
  { group: 'General', keys: 'Ctrl/⌘ ,', label: 'Settings' },
  { group: 'General', keys: 'Ctrl/⌘ /', label: 'Keyboard shortcuts' },
  { group: 'Navigation', keys: 'Ctrl/⌘ ⇧ F', label: 'Search all notes' },
  { group: 'Navigation', keys: 'Ctrl/⌘ F', label: 'Find in note' },
  { group: 'Layout', keys: 'Ctrl/⌘ \\', label: 'Toggle left sidebar' },
  { group: 'Layout', keys: 'Ctrl/⌘ ⇧ \\', label: 'Toggle right sidebar' },
  { group: 'Layout', keys: 'Ctrl/⌘ 1', label: 'Source mode' },
  { group: 'Layout', keys: 'Ctrl/⌘ 2', label: 'Preview mode' },
  { group: 'Layout', keys: 'Ctrl/⌘ 3', label: 'Split mode' },
  { group: 'Editing', keys: 'Ctrl/⌘ B', label: 'Bold' },
  { group: 'Editing', keys: 'Ctrl/⌘ I', label: 'Italic' },
  { group: 'Editing', keys: 'Ctrl/⌘ ⇧ X', label: 'Strikethrough' },
  { group: 'Editing', keys: 'Ctrl/⌘ ⇧ H', label: 'Highlight' },
  { group: 'Editing', keys: 'Ctrl/⌘ ⇧ K', label: 'Insert image' },
  { group: 'Editing', keys: 'Ctrl/⌘ K', label: 'Insert link' },
  { group: 'Editing', keys: 'Ctrl/⌘ E', label: 'Toggle edit / preview' },
  { group: 'Editing', keys: 'Ctrl/⌘ Enter', label: 'Toggle checkbox' },
  { group: 'Editing', keys: '/', label: 'Slash commands (line start)' },
  { group: 'Editing', keys: '[[', label: 'Link a note' },
]
