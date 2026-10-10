import {
  Files,
  Search,
  Tags,
  Star,
  History,
  ListTree,
  Link2,
  Network,
  Info,
  Settings,
  Focus,
  Type,
  SunMedium,
  LayoutList,
  Globe,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { Tip } from './Tooltip'
import type { LeftPane, RightPane, ThemeName } from '../store/types'

const LEFT_ITEMS: { pane: LeftPane; icon: JSX.Element; label: string }[] = [
  { pane: 'files', icon: <Files size={17} />, label: 'Files' },
  { pane: 'search', icon: <Search size={17} />, label: 'Search' },
  { pane: 'tags', icon: <Tags size={17} />, label: 'Tags' },
  { pane: 'favorites', icon: <Star size={17} />, label: 'Favorites' },
  { pane: 'recent', icon: <History size={17} />, label: 'Recent' },
]

const RIGHT_ITEMS: { pane: RightPane; icon: JSX.Element; label: string }[] = [
  { pane: 'widgets', icon: <LayoutList size={17} />, label: 'Writing widgets' },
  { pane: 'web', icon: <Globe size={17} />, label: 'Web search' },
  { pane: 'outline', icon: <ListTree size={17} />, label: 'Outline' },
  { pane: 'links', icon: <Link2 size={17} />, label: 'Backlinks' },
  { pane: 'graph', icon: <Network size={17} />, label: 'Graph' },
  { pane: 'info', icon: <Info size={17} />, label: 'Note info' },
]

const THEMES: ThemeName[] = ['opencode-dark', 'graphite', 'paper']

export function Ribbon(): JSX.Element {
  const settings = useStore((s) => s.settings)
  const leftPane = useStore((s) => s.leftPane)
  const rightPane = useStore((s) => s.rightPane)
  const setLeftPane = useStore((s) => s.setLeftPane)
  const setRightPane = useStore((s) => s.setRightPane)
  const setSettings = useStore((s) => s.setSettings)
  const setModal = useStore((s) => s.setModal)

  const activateLeft = (pane: LeftPane): void => {
    if (settings.showLeft && leftPane === pane) setSettings({ showLeft: false })
    else setLeftPane(pane)
  }
  const activateRight = (pane: RightPane): void => {
    if (settings.showRight && rightPane === pane) setSettings({ showRight: false })
    else setRightPane(pane)
  }
  const cycleTheme = (): void => {
    const next = THEMES[(THEMES.indexOf(settings.theme) + 1) % THEMES.length]
    setSettings({ theme: next })
  }

  return (
    <nav className="ribbon">
      {LEFT_ITEMS.map(({ pane, icon, label }) => (
        <Tip key={pane} label={label} side="bottom">
          <button
            aria-label={label}
            aria-pressed={settings.showLeft && leftPane === pane}
            className={`ribbon-btn${settings.showLeft && leftPane === pane ? ' active' : ''}`}
            onClick={() => activateLeft(pane)}
          >
            {icon}
          </button>
        </Tip>
      ))}

      <div className="ribbon-sep" />

      {RIGHT_ITEMS.map(({ pane, icon, label }) => (
        <Tip key={pane} label={label} side="bottom">
          <button
            aria-label={label}
            aria-pressed={settings.showRight && rightPane === pane}
            className={`ribbon-btn${settings.showRight && rightPane === pane ? ' active' : ''}`}
            onClick={() => activateRight(pane)}
          >
            {icon}
          </button>
        </Tip>
      ))}

      <div className="ribbon-spacer" />

      <Tip label="Focus mode" side="bottom">
        <button
          aria-label="Focus mode"
          aria-pressed={settings.focusMode}
          className={`ribbon-btn${settings.focusMode ? ' active' : ''}`}
          onClick={() => useStore.getState().runCommand('focus-mode')}
        >
          <Focus size={17} />
        </button>
      </Tip>
      <Tip label="Typewriter mode" side="bottom">
        <button
          aria-label="Typewriter mode"
          aria-pressed={settings.typewriterMode}
          className={`ribbon-btn${settings.typewriterMode ? ' active' : ''}`}
          onClick={() => useStore.getState().runCommand('typewriter-mode')}
        >
          <Type size={17} />
        </button>
      </Tip>
      <Tip label="Cycle theme" side="bottom">
        <button aria-label="Cycle theme" className="ribbon-btn" onClick={cycleTheme}>
          <SunMedium size={17} />
        </button>
      </Tip>
      <Tip label="Settings" keys="Ctrl ," side="bottom">
        <button aria-label="Settings" className="ribbon-btn" onClick={() => setModal('settings')}>
          <Settings size={17} />
        </button>
      </Tip>
    </nav>
  )
}
