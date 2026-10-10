import { useRef, useState } from 'react'
import { ImagePlus, Trash2, Upload } from 'lucide-react'
import { Modal } from '../Modal'
import { useStore } from '../../store/useStore'
import { formatBytes } from '../../lib/utils'
import type { ImageAsset } from '../../store/types'

export function ImagePickerModal(): JSX.Element | null {
  const mode = useStore((s) => s.imagePicker)
  const images = useStore((s) => s.images)
  const activeNoteId = useStore((s) => s.meta.activeNoteId)
  const setImagePicker = useStore((s) => s.setImagePicker)
  const addImage = useStore((s) => s.addImage)
  const insertImage = useStore((s) => s.insertImage)
  const setNoteCover = useStore((s) => s.setNoteCover)
  const deleteImage = useStore((s) => s.deleteImage)
  const toast = useStore((s) => s.toast)
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [drag, setDrag] = useState(false)

  if (!mode) return null

  const close = (): void => setImagePicker(null)
  const isCover = mode === 'cover'
  const coverForNote = useStore.getState().notes.find((n) => n.id === activeNoteId)?.cover

  const handleFiles = async (files: FileList | null): Promise<void> => {
    if (!files?.length) return
    setBusy(true)
    try {
      const ids: string[] = []
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue
        ids.push(await addImage(file))
      }
      if (!ids.length) {
        toast('No image files found in that drop', 'error')
      } else if (isCover && activeNoteId) {
        setNoteCover(activeNoteId, ids[ids.length - 1])
        close()
      } else if (!isCover) {
        for (const id of ids) insertImage(id)
        toast(`Inserted ${ids.length} image${ids.length > 1 ? 's' : ''}`, 'success')
        close()
      } else {
        toast(`Added ${ids.length} image${ids.length > 1 ? 's' : ''}`, 'success')
      }
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const pick = (id: string): void => {
    if (isCover && activeNoteId) {
      setNoteCover(activeNoteId, id)
      close()
    } else {
      insertImage(id)
      close()
    }
  }

  return (
    <Modal title={isCover ? 'Set cover image' : 'Insert image'} onClose={close} wide>
      <div
        className={`dropzone${drag ? ' dragging' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDrag(true)
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDrag(false)
          void handleFiles(e.dataTransfer.files)
        }}
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => void handleFiles(e.target.files)} />
        <Upload size={20} />
        <div>
          <strong>{busy ? 'Adding…' : 'Drop images here'}</strong>
          <span>or click to browse — PNG, JPG, GIF, WebP, SVG</span>
        </div>
      </div>

      {isCover && coverForNote ? (
        <button
          className="ghost-btn danger"
          onClick={() => {
            if (activeNoteId) setNoteCover(activeNoteId, null)
            close()
          }}
        >
          <Trash2 size={14} /> Remove current cover
        </button>
      ) : null}

      {images.length === 0 ? (
        <p className="muted-empty">No images in this vault yet.</p>
      ) : (
        <div className="image-grid">
          {images.map((img: ImageAsset) => (
            <div key={img.id} className={`image-tile${coverForNote === img.id ? ' active' : ''}`}>
              <button className="image-thumb" onClick={() => pick(img.id)} title={isCover ? 'Use as cover' : 'Insert into note'}>
                <img src={img.dataUrl} alt={img.name} loading="lazy" />
              </button>
              <div className="image-meta">
                <span className="image-name" title={img.name}>
                  {img.name}
                </span>
                <span className="image-size">
                  {img.width}×{img.height} · {formatBytes(img.size)}
                </span>
              </div>
              <button
                className="image-delete"
                title="Delete image from vault"
                onClick={(e) => {
                  e.stopPropagation()
                  void deleteImage(img.id)
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="image-picker-hint">
        <ImagePlus size={13} />
        {isCover ? 'Pick an image to use as this note’s banner.' : 'Pick an image to insert at the cursor.'}
      </div>
    </Modal>
  )
}
