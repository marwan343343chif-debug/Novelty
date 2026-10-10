import { app, shell, BrowserWindow, ipcMain, dialog, Menu, type MenuItemConstructorOptions } from 'electron'
import { join } from 'path'
import { promises as fs } from 'fs'

app.setName('Novelty')

let mainWindow: BrowserWindow | null = null

const isDev = !!process.env['ELECTRON_RENDERER_URL']

function sendCommand(cmd: string): void {
  const win = BrowserWindow.getFocusedWindow() ?? mainWindow
  win?.webContents.send('menu:command', cmd)
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 940,
    minHeight: 600,
    show: false,
    frame: false,
    backgroundColor: '#0b0d0e',
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 16, y: 18 },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: true,
    },
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())

  const emitMax = (): void => mainWindow?.webContents.send('win:maximized', mainWindow.isMaximized())
  mainWindow.on('maximize', emitMax)
  mainWindow.on('unmaximize', emitMax)

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (isDev) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] as string)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function buildMenu(): void {
  const isMac = process.platform === 'darwin'
  const send = (id: string) => () => sendCommand(id)

  const template: MenuItemConstructorOptions[] = [
    ...(isMac
      ? ([{ label: app.name, submenu: [{ role: 'about' }, { type: 'separator' }, { role: 'quit' }] }] as MenuItemConstructorOptions[])
      : []),
    {
      label: 'File',
      submenu: [
        { label: 'New Note', accelerator: 'CmdOrCtrl+N', click: send('new-note') },
        { label: 'New Folder', accelerator: 'CmdOrCtrl+Shift+N', click: send('new-folder') },
        { label: 'Daily Note', accelerator: 'CmdOrCtrl+D', click: send('daily-note') },
        { type: 'separator' },
        { label: 'Save', accelerator: 'CmdOrCtrl+S', click: send('save') },
        { type: 'separator' },
        { label: 'Export Note as Markdown…', click: send('export-note') },
        { label: 'Export Vault as JSON…', click: send('export-vault') },
        { label: 'Import Vault JSON…', click: send('import-vault') },
        { type: 'separator' },
        { label: 'Settings', accelerator: 'CmdOrCtrl+,', click: send('settings') },
        ...(isMac ? [] : [{ type: 'separator' as const }, { role: 'quit' as const }]),
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
        { type: 'separator' },
        { label: 'Find in Note', accelerator: 'CmdOrCtrl+F', click: send('find') },
        { label: 'Search All Notes', accelerator: 'CmdOrCtrl+Shift+F', click: send('search-all') },
        { type: 'separator' },
        { label: 'Insert Image…', accelerator: 'CmdOrCtrl+Shift+K', click: send('insert-image') },
        { label: 'Set Cover Image…', click: send('set-cover') },
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Command Palette', accelerator: 'CmdOrCtrl+P', click: send('command-palette') },
        { label: 'Quick Switcher', accelerator: 'CmdOrCtrl+O', click: send('quick-switcher') },
        { type: 'separator' },
        { label: 'Source Mode', accelerator: 'CmdOrCtrl+1', click: send('view-source') },
        { label: 'Preview Mode', accelerator: 'CmdOrCtrl+2', click: send('view-preview') },
        { label: 'Split Mode', accelerator: 'CmdOrCtrl+3', click: send('view-split') },
        { type: 'separator' },
        { label: 'Toggle Left Sidebar', accelerator: 'CmdOrCtrl+\\', click: send('toggle-left') },
        { label: 'Toggle Right Sidebar', accelerator: 'CmdOrCtrl+Shift+\\', click: send('toggle-right') },
        { label: 'Writing Widgets', accelerator: 'CmdOrCtrl+Shift+W', click: send('open-widgets') },
        { label: 'Toggle Focus Mode', click: send('focus-mode') },
        { label: 'Toggle Typewriter Mode', click: send('typewriter-mode') },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { role: 'reload' },
        { role: 'toggleDevTools' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        { label: 'Keyboard Shortcuts', accelerator: 'CmdOrCtrl+/', click: send('shortcuts') },
        { label: 'About Novelty', click: send('about') },
      ],
    },
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

function registerIpc(): void {
  ipcMain.on('win:minimize', () => mainWindow?.minimize())
  ipcMain.on('win:toggleMaximize', () => {
    if (!mainWindow) return
    if (mainWindow.isMaximized()) mainWindow.unmaximize()
    else mainWindow.maximize()
  })
  ipcMain.on('win:close', () => mainWindow?.close())
  ipcMain.handle('win:isMaximized', () => mainWindow?.isMaximized() ?? false)

  ipcMain.handle('app:version', () => app.getVersion())
  ipcMain.handle('app:platform', () => process.platform)

  ipcMain.handle(
    'dialog:saveText',
    async (_e, args: { defaultName: string; content: string; filters?: { name: string; extensions: string[] }[] }) => {
      if (!mainWindow) return null
      const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
        defaultPath: args.defaultName,
        filters: args.filters,
      })
      if (canceled || !filePath) return null
      await fs.writeFile(filePath, args.content, 'utf-8')
      return filePath
    },
  )

  ipcMain.handle('dialog:openJsonText', async () => {
    if (!mainWindow) return null
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [{ name: 'Novelty Vault', extensions: ['json'] }],
    })
    if (canceled || !filePaths[0]) return null
    return fs.readFile(filePaths[0], 'utf-8')
  })

  ipcMain.handle('dialog:openFolder', async () => {
    if (!mainWindow) return null
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory', 'createDirectory'] })
    if (canceled || !filePaths[0]) return null
    return filePaths[0]
  })

  ipcMain.handle(
    'fs:writeMarkdownToDir',
    async (_e, args: { dir: string; files: { name: string; content: string }[]; assets?: { name: string; dataUrl: string }[] }) => {
      let count = 0
      for (const file of args.files) {
        const safe = file.name.replace(/[\\/:*?"<>|]/g, '-').replace(/\.+$/, '') || 'untitled'
        await fs.writeFile(join(args.dir, `${safe}.md`), file.content, 'utf-8')
        count++
      }
      if (args.assets?.length) {
        const assetDir = join(args.dir, 'assets')
        await fs.mkdir(assetDir, { recursive: true })
        for (const asset of args.assets) {
          const comma = asset.dataUrl.indexOf(',')
          if (comma < 0) continue
          const meta = asset.dataUrl.slice(5, comma)
          const isBase64 = /;base64/i.test(meta)
          const raw = asset.dataUrl.slice(comma + 1)
          const buffer = isBase64 ? Buffer.from(raw, 'base64') : Buffer.from(decodeURIComponent(raw), 'utf-8')
          const safe = asset.name.replace(/[\\/:*?"<>|]/g, '-').replace(/\.+$/, '') || 'image.png'
          await fs.writeFile(join(assetDir, safe), buffer)
        }
      }
      return count
    },
  )

  ipcMain.handle('shell:openExternal', (_e, url: string) => {
    if (typeof url === 'string' && /^https?:\/\//i.test(url)) shell.openExternal(url)
  })

  ipcMain.handle('shell:showItemInFolder', (_e, path: string) => {
    if (typeof path === 'string') shell.showItemInFolder(path)
  })

  ipcMain.handle('web:search', (_e, query: string) => webSearch(query))

  ipcMain.handle('vault:backup', async (_e, snapshot: unknown) => {
    const dir = join(app.getPath('userData'), 'backups')
    await fs.mkdir(dir, { recursive: true })
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const file = join(dir, `novelty-${stamp}.json`)
    await fs.writeFile(file, JSON.stringify(snapshot, null, 2), 'utf-8')
    const entries = (await fs.readdir(dir)).filter((f) => /^novelty-.*\.json$/.test(f)).sort()
    const keep = 20
    const stale = entries.length - keep
    for (const name of entries.slice(0, Math.max(0, stale))) {
      await fs.unlink(join(dir, name)).catch(() => {})
    }
    return file
  })
}

interface WebSearchSummary {
  title: string
  extract: string
  url: string
  source: string
}
interface WebSearchResult {
  title: string
  snippet: string
  url: string
}

function stripHtml(input: string): string {
  return input
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

async function fetchJson(url: string, ms = 9000): Promise<unknown> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Novelty/1.0 (desktop note app)', Accept: 'application/json' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

async function webSearch(rawQuery: string): Promise<{
  query: string
  summary: WebSearchSummary | null
  results: WebSearchResult[]
  error?: string
}> {
  const query = typeof rawQuery === 'string' ? rawQuery.trim() : ''
  if (!query) return { query, summary: null, results: [], error: 'Enter a search term.' }
  const enc = encodeURIComponent(query)

  const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${enc}&srlimit=8&format=json&origin=*`
  const ddgUrl = `https://api.duckduckgo.com/?q=${enc}&format=json&no_html=1&skip_disambig=1&t=novelty`

  const [wikiSettled, ddgSettled] = await Promise.allSettled([fetchJson(wikiUrl), fetchJson(ddgUrl)])
  const rejections: unknown[] = [ddgSettled, wikiSettled]
    .filter((s): s is PromiseRejectedResult => s.status === 'rejected')
    .map((s) => (s as PromiseRejectedResult).reason)

  let summary: WebSearchSummary | null = null
  const results: WebSearchResult[] = []

  const ddg = ddgSettled.status === 'fulfilled' ? (ddgSettled.value as Record<string, unknown>) : null
  if (ddg) {
    const abstract = typeof ddg.AbstractText === 'string' ? ddg.AbstractText : ''
    const heading = typeof ddg.Heading === 'string' ? ddg.Heading : query
    const abstractUrl = typeof ddg.AbstractURL === 'string' ? ddg.AbstractURL : ''
    if (abstract) {
      const source = safeHost(abstractUrl) || 'DuckDuckGo'
      summary = { title: heading, extract: stripHtml(abstract), url: abstractUrl, source }
    }
    const related = Array.isArray(ddg.RelatedTopics) ? (ddg.RelatedTopics as unknown[]) : []
    for (const topic of related) {
      const flat = Array.isArray((topic as { Topics?: unknown[] }).Topics)
        ? ((topic as { Topics: unknown[] }).Topics as unknown[])
        : [topic]
      for (const item of flat) {
        const text = (item as { Text?: unknown }).Text
        const url = (item as { FirstURL?: unknown }).FirstURL
        if (typeof text === 'string' && typeof url === 'string') {
          const clean = stripHtml(text)
          results.push({ title: clean.split(' - ')[0].slice(0, 90) || clean.slice(0, 90), snippet: clean, url })
        }
      }
    }
  }

  if (wikiSettled.status === 'fulfilled') {
    const data = wikiSettled.value as { query?: { search?: unknown[] } }
    const hits = Array.isArray(data.query?.search) ? (data.query!.search as unknown[]) : []
    for (const hit of hits) {
      const title = (hit as { title?: unknown }).title
      const snippet = (hit as { snippet?: unknown }).snippet
      if (typeof title !== 'string') continue
      results.push({
        title,
        snippet: typeof snippet === 'string' ? stripHtml(snippet) : '',
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`,
      })
    }
    if (!summary && hits.length) {
      const first = (hits[0] as { title?: string }).title
      if (first) {
        try {
          const sum = (await fetchJson(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(first.replace(/ /g, '_'))}`,
          )) as { title?: string; extract?: string; content_urls?: { desktop?: { page?: string } } }
          if (sum.extract) {
            summary = {
              title: sum.title ?? first,
              extract: sum.extract,
              url: sum.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(first.replace(/ /g, '_'))}`,
              source: 'Wikipedia',
            }
          }
        } catch {
          /* ignore summary failure */
        }
      }
    }
  }

  const seen = new Set<string>()
  const deduped = results.filter((r) => (seen.has(r.url) ? false : (seen.add(r.url), true))).slice(0, 12)

  if (!summary && deduped.length === 0) {
    const failure = rejections[0]
    if (rejections.length === 2 && failure !== undefined) {
      return { query, summary: null, results: [], error: describeSearchFailure(failure) }
    }
    return { query, summary: null, results: [], error: 'No results found. Try different words.' }
  }
  return { query, summary, results: deduped }
}

function describeSearchFailure(err: unknown): string {
  if (err instanceof Error) {
    const msg = err.message
    const name = err.name
    if (name === 'AbortError' || msg === 'This operation was aborted' || msg.includes('aborted')) {
      return 'The search timed out. Check your connection and try again.'
    }
    if (msg.startsWith('HTTP 429')) return 'The search service is rate-limited. Wait a moment and try again.'
    if (/^HTTP 4/.test(msg)) return `The search service returned an error (${msg}). Try again shortly.`
    if (msg === 'fetch failed' || err.cause || /network|socket|http request failed/i.test(msg)) {
      return 'No internet connection. Check your network and try again.'
    }
  }
  return 'Something went wrong while searching. Try again.'
}

function safeHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

app.whenReady().then(() => {
  registerIpc()
  buildMenu()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) app.quit()
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})
