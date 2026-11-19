'use client'

import { useId, useState } from 'react'
import Image from 'next/image'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

export function PhotoUploader({
  userId,
  value,
  onChange,
  max,
  label = 'Photos',
}: {
  userId: string
  value: string[]
  onChange: (urls: string[]) => void
  max: number
  label?: string
}) {
  const id = useId()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function upload(files: FileList | null) {
    if (!files?.length) return
    setError('')
    const room = max - value.length
    const list = Array.from(files).slice(0, room)
    if (list.some((f) => !TYPES[f.type] || f.size > 5 * 1024 * 1024)) {
      return setError('Use JPG, PNG or WebP images up to 5 MB each.')
    }
    setBusy(true)
    const supabase = createClient()
    const urls: string[] = []
    for (const file of list) {
      const path = `${userId}/${crypto.randomUUID()}.${TYPES[file.type]}`
      const { error } = await supabase.storage.from('rental-photos').upload(path, file, { contentType: file.type })
      if (error) {
        setError('One or more photos failed to upload. Please try again.')
        break
      }
      urls.push(supabase.storage.from('rental-photos').getPublicUrl(path).data.publicUrl)
    }
    setBusy(false)
    if (urls.length) onChange([...value, ...urls])
  }

  return (
    <div className="flex flex-col gap-2">
      <span id={`${id}-label`} className="text-xs font-semibold text-muted-foreground">
        {label} ({value.length}/{max})
      </span>
      <ul aria-labelledby={`${id}-label`} className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {value.map((url, i) => (
          <li key={url} className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
            <Image src={url} alt={`Photo ${i + 1}`} fill sizes="160px" className="object-cover" />
            <button
              type="button"
              onClick={() => onChange(value.filter((u) => u !== url))}
              className="absolute right-1 top-1 rounded-full bg-background/90 p-1 hover:bg-background"
              aria-label={`Remove photo ${i + 1}`}
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
            {i === 0 && <span className="absolute bottom-1 left-1 rounded bg-background/90 px-1.5 text-[10px] font-semibold">Cover</span>}
          </li>
        ))}
        {value.length < max && (
          <li>
            <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-xs text-muted-foreground hover:border-primary hover:text-primary focus-within:ring-3 focus-within:ring-ring/30">
              {busy ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <ImagePlus className="size-5" aria-hidden="true" />}
              {busy ? 'Uploading' : 'Add photo'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                disabled={busy}
                className="sr-only"
                onChange={(e) => {
                  upload(e.target.files)
                  e.target.value = ''
                }}
              />
            </label>
          </li>
        )}
      </ul>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
