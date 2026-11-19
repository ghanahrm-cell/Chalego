'use client'

import 'leaflet/dist/leaflet.css'
import { useEffect } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet'
import type { LatLng } from '@/lib/rides'

export type MapPoint = LatLng & { kind: 'pickup' | 'dropoff' | 'driver'; label?: string }

const COLORS = { pickup: 'oklch(0.42 0.1 158)', dropoff: 'oklch(0.2 0.035 160)', driver: 'oklch(0.8 0.15 75)' }

function icon(kind: MapPoint['kind']) {
  const size = kind === 'driver' ? 22 : 18
  const shape = kind === 'dropoff' ? 'border-radius:4px' : 'border-radius:9999px'
  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<span style="display:block;width:${size}px;height:${size}px;${shape};background:${COLORS[kind]};border:3px solid white;box-shadow:0 1px 4px rgb(0 0 0 / .35)"></span>`,
  })
}

function FitBounds({ points, center }: { points: MapPoint[]; center: LatLng }) {
  const map = useMap()
  const key = points.map((p) => `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`).join('|')
  useEffect(() => {
    if (points.length === 0) map.setView([center.lat, center.lng], 12)
    else if (points.length === 1) map.setView([points[0].lat, points[0].lng], 14)
    else map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng])), { padding: [40, 40], maxZoom: 15 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map])
  return null
}

export default function RideMapInner({ points, center }: { points: MapPoint[]; center: LatLng }) {
  const pickup = points.find((p) => p.kind === 'pickup')
  const dropoff = points.find((p) => p.kind === 'dropoff')
  return (
    <MapContainer center={[center.lat, center.lng]} zoom={12} scrollWheelZoom={false} className="size-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {pickup && dropoff && (
        <Polyline
          positions={[
            [pickup.lat, pickup.lng],
            [dropoff.lat, dropoff.lng],
          ]}
          pathOptions={{ color: COLORS.pickup, weight: 4, dashArray: '6 8' }}
        />
      )}
      {points.map((p) => (
        <Marker key={p.kind} position={[p.lat, p.lng]} icon={icon(p.kind)} title={p.label ?? p.kind} alt={p.label ?? p.kind} />
      ))}
      <FitBounds points={points} center={center} />
    </MapContainer>
  )
}
