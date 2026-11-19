import { NextResponse, type NextRequest } from 'next/server'

const NOMINATIM = 'https://nominatim.openstreetmap.org'
const ALLOWED_COUNTRIES = new Set(['gh', 'ng'])
const HEADERS = { 'User-Agent': 'CHALEGO/1.0 (https://chalego.com)', 'Accept-Language': 'en' }

type NominatimResult = { lat: string; lon: string; display_name: string; name?: string }

function shortLabel(r: NominatimResult) {
  const parts = r.display_name.split(',').map((p) => p.trim())
  return parts.slice(0, 3).join(', ')
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const country = (params.get('country') ?? 'gh').toLowerCase()
  if (!ALLOWED_COUNTRIES.has(country)) return NextResponse.json({ results: [] }, { status: 400 })

  const lat = Number(params.get('lat'))
  const lng = Number(params.get('lng'))
  const q = (params.get('q') ?? '').trim().slice(0, 120)

  try {
    if (params.has('lat') && Number.isFinite(lat) && Number.isFinite(lng)) {
      if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return NextResponse.json({ results: [] }, { status: 400 })
      const res = await fetch(`${NOMINATIM}/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=17`, {
        headers: HEADERS,
        next: { revalidate: 86400 },
      })
      if (!res.ok) throw new Error('reverse failed')
      const r = (await res.json()) as NominatimResult
      return NextResponse.json({ results: r?.display_name ? [{ label: shortLabel(r), lat, lng }] : [] })
    }

    if (q.length < 3) return NextResponse.json({ results: [] })
    const url = `${NOMINATIM}/search?format=jsonv2&limit=6&countrycodes=${country}&q=${encodeURIComponent(q)}`
    const res = await fetch(url, { headers: HEADERS, next: { revalidate: 86400 } })
    if (!res.ok) throw new Error('search failed')
    const data = (await res.json()) as NominatimResult[]
    return NextResponse.json({
      results: data.map((r) => ({ label: shortLabel(r), lat: Number(r.lat), lng: Number(r.lon) })),
    })
  } catch {
    return NextResponse.json({ results: [], error: 'Location search is unavailable right now.' }, { status: 502 })
  }
}
