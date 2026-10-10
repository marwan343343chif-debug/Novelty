/// <reference types="vite/client" />

interface NoveltyApi {
  win: {
    minimize(): void
    toggleMaximize(): void
    close(): void
    isMaximized(): Promise<boolean>
    onMaximizedChange(cb: (value: boolean) => void): () => void
  }
  app: {
    version(): Promise<string>
    platform(): Promise<string>
  }
  dialog: {
    saveText(args: { defaultName: string; content: string; filters?: { name: string; extensions: string[] }[] }): Promise<string | null>
    openJsonText(): Promise<string | null>
    openFolder(): Promise<string | null>
  }
  fs: {
    writeMarkdownToDir(args: {
      dir: string
      files: { name: string; content: string }[]
      assets?: { name: string; dataUrl: string }[]
    }): Promise<number>
  }
  backup: {
    write(snapshot: unknown): Promise<string | null>
  }
  shell: {
    openExternal(url: string): Promise<void>
    showItemInFolder(path: string): Promise<void>
  }
  web: {
    search(query: string): Promise<{
      query: string
      summary: { title: string; extract: string; url: string; source: string } | null
      results: { title: string; snippet: string; url: string }[]
      error?: string
    }>
  }
  onMenuCommand(cb: (command: string) => void): () => void
}

interface Window {
  api: NoveltyApi
}
