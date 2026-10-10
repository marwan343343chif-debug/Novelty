import { contextBridge, ipcRenderer } from 'electron'

type Unsub = () => void

const api = {
  win: {
    minimize: (): void => ipcRenderer.send('win:minimize'),
    toggleMaximize: (): void => ipcRenderer.send('win:toggleMaximize'),
    close: (): void => ipcRenderer.send('win:close'),
    isMaximized: (): Promise<boolean> => ipcRenderer.invoke('win:isMaximized'),
    onMaximizedChange: (cb: (value: boolean) => void): Unsub => {
      const listener = (_e: unknown, value: boolean): void => cb(value)
      ipcRenderer.on('win:maximized', listener)
      return () => ipcRenderer.removeListener('win:maximized', listener)
    },
  },
  app: {
    version: (): Promise<string> => ipcRenderer.invoke('app:version'),
    platform: (): Promise<string> => ipcRenderer.invoke('app:platform'),
  },
  dialog: {
    saveText: (args: {
      defaultName: string
      content: string
      filters?: { name: string; extensions: string[] }[]
    }): Promise<string | null> => ipcRenderer.invoke('dialog:saveText', args),
    openJsonText: (): Promise<string | null> => ipcRenderer.invoke('dialog:openJsonText'),
    openFolder: (): Promise<string | null> => ipcRenderer.invoke('dialog:openFolder'),
  },
  fs: {
    writeMarkdownToDir: (args: {
      dir: string
      files: { name: string; content: string }[]
      assets?: { name: string; dataUrl: string }[]
    }): Promise<number> => ipcRenderer.invoke('fs:writeMarkdownToDir', args),
  },
  backup: {
    write: (snapshot: unknown): Promise<string | null> => ipcRenderer.invoke('vault:backup', snapshot),
  },
  shell: {
    openExternal: (url: string): Promise<void> => ipcRenderer.invoke('shell:openExternal', url),
    showItemInFolder: (path: string): Promise<void> => ipcRenderer.invoke('shell:showItemInFolder', path),
  },
  web: {
    search: (
      query: string,
    ): Promise<{
      query: string
      summary: { title: string; extract: string; url: string; source: string } | null
      results: { title: string; snippet: string; url: string }[]
      error?: string
    }> => ipcRenderer.invoke('web:search', query),
  },
  onMenuCommand: (cb: (command: string) => void): Unsub => {
    const listener = (_e: unknown, command: string): void => cb(command)
    ipcRenderer.on('menu:command', listener)
    return () => ipcRenderer.removeListener('menu:command', listener)
  },
}

contextBridge.exposeInMainWorld('api', api)

export type NoveltyApi = typeof api
