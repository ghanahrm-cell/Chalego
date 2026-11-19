'use client'

import { useEffect, useId, useState } from 'react'
import useSWR from 'swr'
import { Crosshair, Loader2, MapPin } from 'lucide-react'
import { fieldClass } from '@/lib/account'
import type { Place } from '@/lib/rides'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then((r) => r.json() as Promise<{ results: Place[]; error?: string }>)

type Props = {
  label: string
  country: string
  value: Place | null
  onChange: (place: Place | null) => void
  placeholder?: string
  allowCurrentLocation?: boolean
  savedPlaces?: Place[]
}

export function LocationInput({ label, country, value, onChange, placeholder, allowCurrentLocation, savedPlaces = [] }: Props) {
  const id = useId()
  const [text, setText] = useState(value?.label ?? '')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [locating, setLocating] = useState(false)
  const [geoError, setGeoError] = useState('')

  useEffect(() => {
    setText(value?.label ?? '')
  }, [value?.label])

  useEffect(() => {
    const t = setTimeout(() => setQuery(text.trim()), 450)
    return () => clearTimeout(t)
  }, [text])

  const shouldSearch = open && query.length >= 3 && query !== value?.label
  const { data, isLoading } = useSWR(
    shouldSearch ? `/api/geocode?country=${country}&q=${encodeURIComponent(query)}` : null,
    fetcher,
    { revalidateOnFocus: false, keepPreviousData: true },
  )

  const saved = text.length < 3 ? savedPlaces : []
  const options = shouldSearch ? (data?.results ?? []) : saved

  function choose(place: Place) {
    onChange(place)
    setText(place.label)
    setOpen(false)
    setActive(-1)
  }

  function useMyLocation() {
    if (!navigator.geolocation) return setGeoError('Location is not supported on this device.')
    setLocating(true)
    setGeoError('')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        try {
          const res = await fetcher(`/api/geocode?country=${country}&lat=${lat}&lng=${lng}`)
          choose(res.results[0] ?? { label: 'Current location', lat, lng })
        } catch {
          choose({ label: 'Current location', lat, lng })
        } finally {
          setLocating(false)
        }
      },
      () => {
        setLocating(false)
        setGeoError('Could not get your location. Search for an address instead.')
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const listId = `${id}-list`

  return (
    <div className="relative flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-muted-foreground">
        {label}
      </label>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open && options.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${id}-opt-${active}` : undefined}
          autoComplete="off"
          value={text}
          placeholder={placeholder}
          onChange={(e) => {
            setText(e.target.value)
            setOpen(true)
            setActive(-1)
            if (value) onChange(null)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setActive((a) => Math.min(a + 1, options.length - 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setActive((a) => Math.max(a - 1, 0))
            } else if (e.key === 'Enter' && active >= 0 && options[active]) {
              if (e.nativeEvent.isComposing || e.keyCode === 229) return
              e.preventDefault()
              choose(options[active])
            } else if (e.key === 'Escape') {
              setOpen(false)
            }
          }}
          className={cn(fieldClass, 'pl-9', allowCurrentLocation && 'pr-11')}
        />
        {allowCurrentLocation && (
          <button
            type="button"
            onClick={useMyLocation}
            disabled={locating}
            className="absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-primary hover:bg-primary/10 disabled:opacity-60"
          >
            {locating ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Crosshair className="size-4" aria-hidden="true" />}
            <span className="sr-only">Use my current location</span>
          </button>
        )}
      </div>
      {geoError && <p className="text-xs text-destructive">{geoError}</p>}
      {open && (options.length > 0 || (shouldSearch && (isLoading || data))) && (
        <ul
          id={listId}
          role="listbox"
          className="absolute top-full z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border bg-popover p-1 text-sm shadow-lg"
        >
          {saved.length > 0 && <li className="px-2 py-1 text-xs font-semibold text-muted-foreground">Saved places</li>}
          {options.map((o, i) => (
            <li
              key={`${o.lat},${o.lng},${i}`}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(o)}
              className={cn('cursor-pointer rounded-md px-2 py-2', i === active ? 'bg-primary/10' : 'hover:bg-muted')}
            >
              {o.label}
            </li>
          ))}
          {shouldSearch && isLoading && options.length === 0 && <li className="px-2 py-2 text-muted-foreground">Searching…</li>}
          {shouldSearch && !isLoading && data && options.length === 0 && (
            <li className="px-2 py-2 text-muted-foreground">{data.error ?? 'No matching places. Try a landmark or area name.'}</li>
          )}
        </ul>
      )}
    </div>
  )
}
