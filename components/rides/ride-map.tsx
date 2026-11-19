'use client'

import dynamic from 'next/dynamic'
import type { LatLng } from '@/lib/rides'
import type { MapPoint } from './ride-map-inner'
import { cn } from '@/lib/utils'

const Inner = dynamic(() => import('./ride-map-inner'), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse bg-muted" />,
})

export type { MapPoint }

export function RideMap({ points, center, className }: { points: MapPoint[]; center: LatLng; className?: string }) {
  return (
    <div
      role="img"
      aria-label={points.length ? `Map showing ${points.map((p) => p.label ?? p.kind).join(' and ')}` : 'Map'}
      className={cn('relative isolate z-0 overflow-hidden rounded-2xl border bg-muted', className)}
    >
      <Inner points={points} center={center} />
    </div>
  )
}
