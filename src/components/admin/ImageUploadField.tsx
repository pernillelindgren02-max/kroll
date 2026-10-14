import { useRef, useState } from 'react'
import { uploadPatternImage } from '../../lib/imageUpload'
import './ImageUploadField.css'

type Props = {
  label: string
  value: string | null
  patternId: string
  kind: 'cover' | 'gallery' | 'section'
  onChange: (url: string | null) => void
}

export function ImageUploadField({
  label,
  value,
  patternId,
  kind,
  onChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onFile(file: File | undefined) {
    if (!file) return
    setBusy(true)
    setError(null)
    const result = await uploadPatternImage(file, patternId, kind)
    setBusy(false)
    if (!result.ok) {
      setError(result.message)
      return
    }
    onChange(result.url)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="image-upload">
      <p className="image-upload__label">{label}</p>
      <div className="image-upload__preview-wrap">
        {value ? (
          <img
            src={value}
            alt=""
            className="image-upload__preview"
          />
        ) : (
          <div className="image-upload__fallback" aria-hidden>
            Ingen bilde
          </div>
        )}
      </div>
      <div className="image-upload__actions">
        <button
          type="button"
          className="btn btn--primary"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? 'Laster…' : value ? 'Erstatt bilde' : 'Last opp bilde'}
        </button>
        {value && (
          <button
            type="button"
            className="btn btn--ghost"
            disabled={busy}
            onClick={() => {
              onChange(null)
              setError(null)
              if (inputRef.current) inputRef.current.value = ''
            }}
          >
            Fjern
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        hidden
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
      {error && <p className="image-upload__error">{error}</p>}
    </div>
  )
}
