# Novelty — Build Guide

> A premium, Obsidian-style markdown & plain-text studio for chapters, notes, and everything in between.
> Electron + React + TypeScript, IndexedDB vault, opencode-inspired dark UI.

This document is the authoritative plan. It is written before the code and followed during the build.
Update the checkboxes as the work lands.

> **Status:** implemented. Novelty now also ships a Home page, an empty
> first-run vault (no seeded demo), image support with note covers, a Writing
> widgets pane (tasks / clock + Pomodoro / calendar), and a Web search pane —
> see **§11 Post-plan additions**. Stale details below (seed vault, IPC names)
> have been corrected.

---

## 1. Product definition

**Name:** Novelty
**Tagline:** _A premium markdown studio for chapters, notes, and everything in between._
**Platform:** Electron desktop app (frameless window, custom titlebar, native menus & file dialogs).
**Storage:** Local vault persisted in IndexedDB (renderer). Import/export to disk (JSON vault, `.md` notes) through IPC.
**Aesthetic:** opencode-inspired dark — near-black neutrals, hairline borders, monospace accents, warm amber signature accent, generous spacing, subtle motion.
**Layout:** Obsidian-like — far-left ribbon, collapsible left sidebar with switchable panes, central tabbed editor + preview, collapsible right sidebar (outline/links/graph), bottom status bar, command palette on top.

**Guiding principle:** every panel is useful and every feature actually works. No dead buttons. First launch is a clean, empty vault that opens on the Home page and invites the first note.

---

## 2. Stack & rationale

| Concern          | Choice                                  | Why                                                          |
| ---------------- | --------------------------------------- | ------------------------------------------------------------ |
| Shell            | Electron 33+                            | Native files, dialogs, menus, window control                 |
| Build/dev        | electron-vite                           | Main/preload/renderer builds + HMR, TS out of the box        |
| UI               | React 18 + TypeScript (strict)          | Component model, ecosystem                                   |
| State            | Zustand                                 | Tiny, no boilerplate, easy persistence hooks                 |
| Editor           | CodeMirror 6 (markdown + language-data) | Best-in-class markdown source editing, themable, completions |
| Preview          | marked + DOMPurify + highlight.js       | Fast, extensible, safe render with colored code              |
| Persistence      | idb (IndexedDB wrapper)                 | Local, large, async, no backend                              |
| Panels/splitters | react-resizable-panels                  | Resizable + collapsible sidebars                             |
| Icons            | lucide-react                            | Clean, consistent, premium                                   |
| Fuzzy search     | fuse.js                                 | Quick switcher + search ranking                              |
| Packaging        | electron-builder (config only)          | Optional distributables                                      |

Fonts: system sans stack for UI/body; a mono stack (JetBrains Mono → SF Mono → Menlo → monospace) for code, tags, paths, shortcuts.

---

## 3. Directory layout

```
Novelty_App/
  package.json
  electron.vite.config.ts
  tsconfig.json  tsconfig.node.json  tsconfig.web.json
  electron-builder.yml
  GUIDE.md
  src/
    main/index.ts              # window, menus, IPC (fs + dialogs)
    preload/index.ts           # contextBridge -> window.api
    renderer/
      index.html
      src/
        main.tsx  App.tsx
        styles/global.css  styles/themes.css  styles/preview.css
        lib/ (db, markdown, search, utils, constants, stats, colors, files, bus)
        store/ (types.ts, useStore.ts)
        components/ (TitleBar, Ribbon, Sidebars, Editor, Preview, StatusBar,
                     HomeView, CommandPalette (Palette), Modals, ContextMenu,
                     Tooltip, ErrorBoundary, ImagePickerModal,
                     right/WebSearchPane, right/WidgetsPane, ...)
```

---

## 4. Data model

```ts
type Note = {
  id: string
  title: string
  content: string
  folderId: string | null
  tags: string[]
  favorite: boolean
  pinned: boolean
  trashed: boolean
  color?: string // note accent
  createdAt: number
  updatedAt: number
  openedAt: number
}
type Folder = { id; name; parentId: string | null; expanded: boolean; createdAt }
type Settings = {
  theme: 'opencode-dark' | 'graphite' | 'paper'
  accent: string
  uiFont
  monoFont
  fontSize: number
  contentWidth: 'narrow' | 'medium' | 'wide' | 'full'
  lineNumbers
  lineWrapping
  spellcheck
  showRibbon: boolean
  showLeft
  showRight: boolean
  viewMode: 'source' | 'preview' | 'split'
  focusMode
  typewriterMode
  autoSave
  vimMode?: boolean
  dailyGoal: number
  sort: 'name' | 'modified' | 'created'
}
type Meta = {
  openTabIds: string[]
  activeNoteId: string | null
  lastFolderId: string | null
  vaultName: string
  activity: Record<string, number> /* date -> words written */
}
type ImageAsset = {
  id: string
  name: string
  type: string
  size: number
  width: number
  height: number
  createdAt: number
  dataUrl: string
}
```

`Settings` has since grown to include: `userName`, `density`, `reduceMotion`,
`backgroundTexture`, `previewFontSize`, `editorLineHeight`, `focusDim`,
`clock24h`, `clockSeconds`, `weekStartsMonday`, `showStatusBar`,
`showCompletedTasks`, `pomodoroFocus`, `pomodoroBreak`, `widgetsTodo`,
`widgetsClock`, `widgetsCalendar`, plus per-note `cover`/`coverPosition`.

IndexedDB `novelty` (v2): stores `notes` (keyPath id, idx folderId/updatedAt),
`folders` (id), `images` (id), `kv` (settings, meta).

---

## 5. Feature list

**Core**

- [ ] Create / rename / duplicate / delete / restore(P) notes and nested folders
- [ ] Auto-save (debounced) + manual save, live save-status indicator
- [ ] Open tabs, tab switching, dirty/last-saved, close, reopen last session
- [ ] Source / Preview / Split view modes
- [ ] Markdown syntax highlighting, line numbers, wrap, active-line, search-in-doc
- [ ] Rendered markdown: GFM, tables, task lists, code highlighting, callouts
- [ ] `==highlight==`, colored text spans, wiki-links `[[Note]]`/`[[Note|alias]]`, `#tags`

**Navigation & discovery**

- [ ] File explorer tree w/ folders, expand/collapse, sort, context menu
- [ ] Favorites / bookmarks pane
- [ ] Tags pane (aggregated, filterable, click to see notes)
- [ ] Full-text search pane (ranked, snippet highlight, click to open)
- [ ] Outline pane (headings, click to scroll)
- [ ] Backlinks + outgoing links pane
- [ ] Local graph view (canvas force graph of note links)
- [ ] Quick switcher (fuzzy, Ctrl/Cmd+O)
- [ ] Command palette (Ctrl/Cmd+P)
- [ ] Recent notes

**Writing aids**

- [ ] Slash commands (`/`) — headings, lists, todo, quote, code, table, divider, callout, wikilink, color
- [ ] Wiki-link + tag autocompletion
- [ ] Toolbar: bold/italic/strike/highlight/color/link/code/heading/list/table
- [ ] Focus mode (dim non-active lines) & typewriter mode (center caret)
- [ ] Live stats: words, chars, lines, reading time, cursor line/col
- [ ] Daily word goal with progress in status bar

**Data**

- [ ] Export note as `.md`; export full vault as JSON; export all notes as `.md` folder
- [ ] Import vault JSON (merge/replace)
- [ ] Trash with restore + empty trash
- [ ] Clean empty vault on first run (Home page guides the first note)

**App**

- [ ] 3 themes + accent picker, font size, content width, toggles (Settings modal)
- [ ] Native menu + accelerators; custom frameless titlebar w/ window controls
- [ ] Keyboard shortcuts everywhere; tooltips
- [ ] Toast notifications

---

## 6. UI layout map

```
┌──────────────────────────────────────────────────────────────────────┐
│ TitleBar  ◈ Novelty · vault        [+ New] [⌘P]     ─ □ ✕            │
├────┬────────────────┬──────────────────────────────┬─────────────────┤
│ R  │ Left Sidebar   │ Editor Tabs                  │ Right Sidebar   │
│ i  │  Files/Search/ │ ┌──────────────────────────┐ │  Outline        │
│ b  │  Tags/Favs     │ │  toolbar                 │ │  Backlinks      │
│ b  │  (resizable,   │ │  CodeMirror / Preview    │ │  Links / Graph  │
│ o  │   collapsible) │ │  / Split                 │ │  Note info      │
│ n  │                │ └──────────────────────────┘ │ (resizable)     │
├────┴────────────────┴──────────────────────────────┴─────────────────┤
│ StatusBar  • 412 words · 2,310 chars · 2 min · Ln 12 Col 4 · Saved ✓ │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 7. Design tokens (opencode-inspired)

```
--bg:#0b0d0e  --bg-panel:#101314  --bg-elevated:#15191a  --bg-hover:#1b2021
--border:#222728  --border-soft:#1a1e1f
--text:#e7e9e9  --text-muted:#9aa3a3  --text-faint:#636b6b
--accent:#f5a524 (amber)  --accent-2:#2dd4bf (teal)
--red:#f0616d --green:#41c777 --blue:#4aa8ff --purple:#b48cff
radius: 6-10px, shadows subtle, focus ring = accent @ 30%
```

Light "paper" theme provided as a bonus. `[data-theme]` swaps variables.

---

## 8. Keymaps

`Ctrl/Cmd`: N new note · Shift+N new folder · O quick switcher · P command palette ·
Shift+F search · S save · B bold · I italic · K link · E toggle view · `\` left sidebar ·
Shift+`\` right sidebar · D daily note · , settings · / toggle comment-ish.
`Esc` closes overlays. Editor: Enter continues lists/todos/quotes; Tab indents; Ctrl+Enter toggles checkbox.

---

## 9. IPC surface (preload `window.api`)

```
win.minimize | toggleMaximize | close | isMaximized | onMaximizedChange
app.version | platform
dialog.saveText({ defaultName, content, filters })
dialog.openJsonText()
dialog.openFolder()
fs.writeMarkdownToDir({ dir, files, assets? }) -> count
shell.openExternal(url) | shell.showItemInFolder(path)
web.search(query) -> { query, summary, results, error? }
backup.write(snapshot) -> path
onMenuCommand(cb)  // menu items -> commands
```

`contextIsolation:true`, `nodeIntegration:false`, whitelisted channels only.

---

## 11. Post-plan additions

Features added after the original plan (all implemented and verified):

- **Home page** (`HomeView`): time-based greeting, welcome title using
  `settings.userName`, Recent, Favorites, and a mini to-do list; shown whenever
  no note is active. A Home button sits at the start of the tab bar.
- **Images**: paste/upload into the vault, insert into notes (`novelty://<id>`),
  set note covers, preview lightbox, and export with an `assets/` folder.
- **Writing widgets** (`right/WidgetsPane`): aggregated task list, clock +
  Pomodoro timer, and a calendar for daily notes. Toggle via `Ctrl/Cmd+Shift+W`.
- **Web search** (`right/WebSearchPane`): DuckDuckGo Instant Answer + Wikipedia
  summary and a text result list, fetched in the main process to avoid CORS.
  Offline/rate-limit/timeout failures are classified and shown as an error card
  with a retry action.
- **Auto-backups**: on launch (and before any destructive import/reset) the vault
  is written to `<userData>/backups/novelty-<timestamp>.json`; the newest 20 are
  kept. `app.setName('Novelty')` keeps the userData path consistent in dev and
  packaged builds.
- **Import merge/replace** (`modals/ImportModal`): importing a vault JSON now
  asks whether to _merge_ (upsert notes/folders/images by id, keep current
  settings and vault name) or _replace_ (wipe and load). A backup is taken first.
- **Lazy-loaded editor**: CodeMirror and the markdown/preview pipeline are split
  into on-demand chunks (`Loadable` + `React.lazy`), keeping the startup bundle
  small. `highlight.js/lib/common` is used instead of all languages.
- **Error boundary**: a themed fallback so a render error never white-screens
  the app.
- **Packaging**: `electron-builder.yml` + `build/` icons for AppImage/deb, dmg,
  and NSIS.
- **Tooling**: ESLint (flat config) + Prettier + Vitest (unit tests for the pure
  `stats`/`utils`/`search` helpers).

---

## 10. Build order (execution plan)

1. Scaffold: package.json, tsconfigs, electron.vite.config.ts, index.html, base CSS.
2. Install deps; verify versions.
3. Main process (frameless window, menu, IPC) + preload.
4. lib: types, constants, colors, utils, stats, db, seed.
5. store: zustand with actions + persistence wiring.
6. Layout shell: TitleBar, Ribbon, StatusBar, resizable sidebars.
7. Editor: CodeMirror theme, markdown config, extensions, toolbar, completions.
8. Preview: marked pipeline + preview.css + interactions.
9. Panes: explorer, search, tags, favorites, outline, backlinks, graph.
10. Overlays: command palette, quick switcher, modals, toasts, context menu.
11. Export/import + settings + daily goal + focus/typewriter.
12. Seed vault, polish, animations, empty states.
13. `tsc --noEmit`, `electron-vite build`, launch Electron, screenshot, fix.

**Definition of done:** app launches without console errors, seeded vault renders, you can create/edit/nest/search/tag/link notes, switch views, export/import, change themes, and everything in section 5 works.
