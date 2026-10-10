import { useStore } from '../store/useStore'
import { SettingsModal } from './modals/SettingsModal'
import { ShortcutsModal } from './modals/ShortcutsModal'
import { AboutModal } from './modals/AboutModal'
import { ImportModal } from './modals/ImportModal'

export function Modals(): JSX.Element | null {
  const modal = useStore((s) => s.modal)
  if (modal === 'settings') return <SettingsModal />
  if (modal === 'shortcuts') return <ShortcutsModal />
  if (modal === 'about') return <AboutModal />
  if (modal === 'import') return <ImportModal />
  return null
}
