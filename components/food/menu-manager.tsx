'use client'

import { useId, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Loader2, Pencil, Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PhotoUploader } from '@/components/rentals/photo-uploader'
import { createClient } from '@/lib/supabase/client'
import { fieldClass, formatMoney } from '@/lib/account'
import { errorMessage } from '@/lib/rides'
import type { Addon, MenuCategory, MenuItem } from '@/lib/food'
import { cn } from '@/lib/utils'

type Props = { restaurantId: string; userId: string; currency: string; locale: string; categories: MenuCategory[]; items: MenuItem[] }

const itemPayload = (i: MenuItem) => ({
  name: i.name,
  description: i.description ?? '',
  price: i.price,
  category_id: i.category_id ?? '',
  photo_url: i.photo_url ?? '',
  addons: i.addons,
  is_available: i.is_available,
  sort_order: i.sort_order,
})

export function MenuManager({ restaurantId, userId, currency, locale, categories, items }: Props) {
  const base = useId()
  const router = useRouter()
  const [editing, setEditing] = useState<string | 'new' | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [catName, setCatName] = useState('')
  const money = (n: number) => formatMoney(n, currency, locale)

  async function rpc(key: string, fn: string, args: Record<string, unknown>) {
    setBusy(key)
    setError('')
    const { error } = await createClient().rpc(fn, args)
    setBusy(null)
    if (error) {
      setError(errorMessage(error))
      return false
    }
    router.refresh()
    return true
  }

  const groups = [
    ...categories.map((c) => ({ id: c.id, name: c.name, items: items.filter((i) => i.category_id === c.id) })),
    { id: '', name: 'Uncategorised', items: items.filter((i) => !i.category_id) },
  ].filter((g) => g.id || g.items.length)

  return (
    <section aria-labelledby={`${base}-menu`} className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={`${base}-menu`} className="font-heading text-xl font-semibold">Menu <span className="text-base font-normal text-muted-foreground">({items.length} items)</span></h2>
        <Button type="button" className="h-10" onClick={() => setEditing('new')} disabled={editing === 'new'}>
          <Plus data-icon="inline-start" aria-hidden="true" /> Add dish
        </Button>
      </div>

      {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <form
        className="flex flex-wrap items-end gap-2 rounded-2xl border bg-card p-4"
        onSubmit={async (e) => {
          e.preventDefault()
          if (await rpc('cat', 'save_menu_category', { p_restaurant: restaurantId, p_id: null, p_name: catName, p_sort: categories.length })) setCatName('')
        }}
      >
        <div className="flex min-w-48 flex-1 flex-col gap-1.5">
          <label htmlFor={`${base}-cat`} className="text-xs font-semibold text-muted-foreground">New menu section</label>
          <input id={`${base}-cat`} value={catName} onChange={(e) => setCatName(e.target.value)} minLength={2} maxLength={40} required placeholder="e.g. Rice dishes, Soups, Drinks" className={fieldClass} />
        </div>
        <Button type="submit" variant="outline" className="h-11" disabled={busy === 'cat'}>{busy === 'cat' ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : 'Add section'}</Button>
      </form>

      {editing === 'new' && (
        <ItemForm restaurantId={restaurantId} userId={userId} categories={categories} onDone={() => setEditing(null)} />
      )}

      {groups.map((g) => (
        <div key={g.id || 'none'} className="overflow-hidden rounded-2xl border bg-card">
          <div className="flex items-center justify-between gap-3 border-b bg-muted/50 px-4 py-2.5">
            <h3 className="font-medium">{g.name}</h3>
            {g.id && (
              <button
                type="button"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                onClick={() => {
                  if (window.confirm(`Delete the “${g.name}” section? Dishes in it move to Uncategorised.`)) rpc(`del-${g.id}`, 'delete_menu_category', { p_id: g.id })
                }}
              >
                <Trash2 className="size-3.5" aria-hidden="true" /> Delete section
              </button>
            )}
          </div>
          {g.items.length === 0 ? (
            <p className="px-4 py-4 text-sm text-muted-foreground">No dishes in this section yet.</p>
          ) : (
            <ul className="divide-y">
              {g.items.map((i) =>
                editing === i.id ? (
                  <li key={i.id} className="p-3">
                    <ItemForm restaurantId={restaurantId} userId={userId} categories={categories} initial={i} onDone={() => setEditing(null)} />
                  </li>
                ) : (
                  <li key={i.id} className="flex items-center gap-3 px-4 py-3">
                    {i.photo_url ? (
                      <Image src={i.photo_url} alt="" width={48} height={48} className="size-12 shrink-0 rounded-lg object-cover" />
                    ) : (
                      <span className="size-12 shrink-0 rounded-lg bg-muted" aria-hidden="true" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className={cn('truncate font-medium', !i.is_available && 'text-muted-foreground line-through')}>{i.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {money(i.price)}
                        {i.addons.length > 0 && ` · ${i.addons.length} add-on${i.addons.length > 1 ? 's' : ''}`}
                      </p>
                    </div>
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={i.is_available}
                        disabled={busy === i.id}
                        onChange={(e) => rpc(i.id, 'save_menu_item', { p_restaurant: restaurantId, p_id: i.id, p: { ...itemPayload(i), is_available: e.target.checked } })}
                        className="size-4 accent-primary"
                      />
                      Available
                    </label>
                    <button type="button" onClick={() => setEditing(i.id)} aria-label={`Edit ${i.name}`} className="rounded-md p-2 hover:bg-muted">
                      <Pencil className="size-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Remove ${i.name}`}
                      className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => {
                        if (window.confirm(`Remove ${i.name} from the menu?`)) rpc(i.id, 'save_menu_item', { p_restaurant: restaurantId, p_id: i.id, p: { ...itemPayload(i), is_active: false } })
                      }}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </li>
                ),
              )}
            </ul>
          )}
        </div>
      ))}
    </section>
  )
}

function ItemForm({ restaurantId, userId, categories, initial, onDone }: { restaurantId: string; userId: string; categories: MenuCategory[]; initial?: MenuItem; onDone: () => void }) {
  const base = useId()
  const router = useRouter()
  const [photo, setPhoto] = useState<string[]>(initial?.photo_url ? [initial.photo_url] : [])
  const [addons, setAddons] = useState<Addon[]>(initial?.addons ?? [])
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setPending(true)
    setError('')
    const { error } = await createClient().rpc('save_menu_item', {
      p_restaurant: restaurantId,
      p_id: initial?.id ?? null,
      p: {
        name: f.get('name'),
        description: f.get('description'),
        price: Number(f.get('price')),
        category_id: f.get('category_id'),
        photo_url: photo[0] ?? '',
        addons: addons.filter((a) => a.name.trim()),
        is_available: f.get('is_available') === 'on',
        sort_order: initial?.sort_order ?? 0,
      },
    })
    setPending(false)
    if (error) return setError(errorMessage(error))
    router.refresh()
    onDone()
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-2xl border border-primary/40 bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{initial ? `Edit ${initial.name}` : 'New dish'}</h3>
        <button type="button" onClick={onDone} aria-label="Close" className="rounded-md p-1.5 hover:bg-muted"><X className="size-4" aria-hidden="true" /></button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor={`${base}-name`} className="text-xs font-semibold text-muted-foreground">Name</label>
          <input id={`${base}-name`} name="name" required minLength={2} maxLength={80} defaultValue={initial?.name} className={fieldClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${base}-price`} className="text-xs font-semibold text-muted-foreground">Price</label>
          <input id={`${base}-price`} name="price" type="number" min={0.01} step="0.01" required defaultValue={initial?.price} className={fieldClass} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${base}-desc`} className="text-xs font-semibold text-muted-foreground">Description</label>
        <textarea id={`${base}-desc`} name="description" rows={2} maxLength={500} defaultValue={initial?.description ?? ''} className={cn(fieldClass, 'h-auto py-2')} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${base}-cat`} className="text-xs font-semibold text-muted-foreground">Section</label>
          <select id={`${base}-cat`} name="category_id" defaultValue={initial?.category_id ?? ''} className={fieldClass}>
            <option value="">Uncategorised</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 self-end pb-3 text-sm">
          <input type="checkbox" name="is_available" defaultChecked={initial?.is_available ?? true} className="size-4 accent-primary" /> Available to order
        </label>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-xs font-semibold text-muted-foreground">Add-ons (optional, up to 12)</legend>
        {addons.map((a, idx) => (
          <div key={idx} className="flex gap-2">
            <input aria-label={`Add-on ${idx + 1} name`} value={a.name} maxLength={40} placeholder="e.g. Extra chicken" onChange={(e) => setAddons((x) => x.map((y, j) => (j === idx ? { ...y, name: e.target.value } : y)))} className={fieldClass} />
            <input aria-label={`Add-on ${idx + 1} price`} type="number" min={0} step="0.01" value={a.price} onChange={(e) => setAddons((x) => x.map((y, j) => (j === idx ? { ...y, price: Number(e.target.value) } : y)))} className={cn(fieldClass, 'w-28')} />
            <button type="button" aria-label={`Remove add-on ${idx + 1}`} onClick={() => setAddons((x) => x.filter((_, j) => j !== idx))} className="rounded-md px-2 hover:bg-muted"><X className="size-4" aria-hidden="true" /></button>
          </div>
        ))}
        {addons.length < 12 && (
          <Button type="button" variant="ghost" className="h-9 self-start" onClick={() => setAddons((x) => [...x, { name: '', price: 0 }])}>
            <Plus data-icon="inline-start" aria-hidden="true" /> Add option
          </Button>
        )}
      </fieldset>

      <PhotoUploader userId={userId} value={photo} onChange={setPhoto} max={1} label="Dish photo" />

      {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" className="h-11 px-6" disabled={pending}>{pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}{initial ? 'Save dish' : 'Add to menu'}</Button>
        <Button type="button" variant="ghost" className="h-11" onClick={onDone}>Cancel</Button>
      </div>
    </form>
  )
}
