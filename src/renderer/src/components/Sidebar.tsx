import { FilePlus2, FolderPlus } from 'lucide-react'
import { useStore } from '../store/useStore'
import { FileExplorer } from './left/FileExplorer'
import { SearchPane } from './left/SearchPane'
import { TagsPane } from './left/TagsPane'
import { FavoritesPane } from './left/FavoritesPane'
import { RecentPane } from './left/RecentPane'
import { OutlinePane } from './right/OutlinePane'
import { LinksPane } from './right/LinksPane'
import { GraphPane } from './right/GraphPane'
import { InfoPane } from './right/InfoPane'
import { WidgetsPane } from './right/WidgetsPane'
import { WebSearchPane } from './right/WebSearchPane'
import type { LeftPane, RightPane } from '../store/types'

const LEFT_TITLES: Record<LeftPane, string> = {
  files: 'Files',
  search: 'Search',
  tags: 'Tags',
  favorites: 'Favorites',
  recent: 'Recent',
}
const RIGHT_TITLES: Record<RightPane, string> = {
  outline: 'Outline',
  links: 'Links',
  graph: 'Graph',
  info: 'Note info',
  widgets: 'Writing widgets',
  web: 'Web search',
}

export function Sidebar({ side }: { side: 'left' | 'right' }): JSX.Element {
  const leftPane = useStore((s) => s.leftPane)
  const rightPane = useStore((s) => s.rightPane)
  const createNote = useStore((s) => s.createNote)
  const createFolder = useStore((s) => s.createFolder)

  const title = side === 'left' ? LEFT_TITLES[leftPane] : RIGHT_TITLES[rightPane]

  return (
    <aside className={`sidebar ${side}`}>
      <div className="sidebar-header">
        <span className="sidebar-title">{title}</span>
        <div className="sidebar-actions">
          {side === 'left' && leftPane === 'files' ? (
            <>
              <button className="icon-btn" aria-label="New note" title="New note" onClick={() => createNote(null)}>
                <FilePlus2 size={15} />
              </button>
              <button className="icon-btn" aria-label="New folder" title="New folder" onClick={() => createFolder(null)}>
                <FolderPlus size={15} />
              </button>
            </>
          ) : null}
        </div>
      </div>
      <div className="sidebar-body">
        {side === 'left' ? (
          leftPane === 'files' ? (
            <FileExplorer />
          ) : leftPane === 'search' ? (
            <SearchPane />
          ) : leftPane === 'tags' ? (
            <TagsPane />
          ) : leftPane === 'favorites' ? (
            <FavoritesPane />
          ) : (
            <RecentPane />
          )
        ) : rightPane === 'outline' ? (
          <OutlinePane />
        ) : rightPane === 'links' ? (
          <LinksPane />
        ) : rightPane === 'graph' ? (
          <GraphPane />
        ) : rightPane === 'widgets' ? (
          <WidgetsPane />
        ) : rightPane === 'web' ? (
          <WebSearchPane />
        ) : (
          <InfoPane />
        )}
      </div>
    </aside>
  )
}
