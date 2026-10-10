import { AlertTriangle, GitMerge, Replace } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { Modal } from '../Modal'
import { pluralize } from '../../lib/utils'

export function ImportModal(): JSX.Element | null {
  const snapshot = useStore((s) => s.importSnapshot)
  const setModal = useStore((s) => s.setModal)
  const setImportSnapshot = useStore((s) => s.setImportSnapshot)
  const applyImport = useStore((s) => s.applyImport)

  if (!snapshot) return null

  const notes = snapshot.notes.length
  const folders = snapshot.folders.length
  const images = snapshot.images?.length ?? 0

  const close = (): void => {
    setImportSnapshot(null)
    setModal(null)
  }

  return (
    <Modal
      title="Import vault"
      onClose={close}
      small
      footer={
        <>
          <button className="btn btn-ghost" onClick={close}>
            Cancel
          </button>
          <span className="spacer" />
          <button className="btn btn-danger" onClick={() => void applyImport('replace')}>
            <Replace size={14} /> Replace
          </button>
          <button className="btn btn-primary" onClick={() => void applyImport('merge')}>
            <GitMerge size={14} /> Merge
          </button>
        </>
      }
    >
      <p className="modal-lead">
        <strong>{snapshot.vaultName || 'Imported Vault'}</strong> contains {pluralize(notes, 'note')}, {pluralize(folders, 'folder')} and{' '}
        {pluralize(images, 'image')}.
      </p>

      <div className="import-options">
        <div className="import-option">
          <span className="import-option-head">
            <GitMerge size={15} /> Merge
          </span>
          <span className="import-option-desc">
            Add the imported notes and folders to your current vault. Items with the same id are overwritten; your settings and vault name stay as
            they are.
          </span>
        </div>
        <div className="import-option danger">
          <span className="import-option-head">
            <AlertTriangle size={15} /> Replace
          </span>
          <span className="import-option-desc">Erase your current vault entirely and load the imported one. A backup is written automatically first.</span>
        </div>
      </div>

      <p className="import-note">A backup of your current vault is saved before anything changes.</p>
    </Modal>
  )
}