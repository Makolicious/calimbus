import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
          width: 32,
          height: 32,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          borderRadius: 6,
          padding: 2,
          position: 'relative',
        }}
      >
        {/* Binding rings */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, position: 'absolute', top: 0, left: 0, right: 0 }}>
          <div style={{ width: 3, height: 5, background: 'white', borderRadius: 1 }} />
          <div style={{ width: 3, height: 5, background: 'white', borderRadius: 1 }} />
        </div>
        {/* Top bar */}
        <div style={{ width: '100%', height: 7, background: 'rgba(255,255,255,0.3)', borderRadius: 2, marginTop: 5 }} />
        {/* Date grid */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, padding: 2, marginTop: 2, justifyContent: 'center' }}>
          <div style={{ width: 4, height: 4, background: 'white', borderRadius: 1 }} />
          <div style={{ width: 4, height: 4, background: 'white', borderRadius: 1 }} />
          <div style={{ width: 4, height: 4, background: 'white', borderRadius: 1 }} />
          <div style={{ width: 4, height: 4, background: 'white', borderRadius: 1 }} />
          <div style={{ width: 4, height: 4, background: 'white', borderRadius: 1 }} />
          <div style={{ width: 4, height: 4, background: 'white', borderRadius: 1 }} />
          <div style={{ width: 4, height: 4, background: 'rgba(255,255,255,0.5)', borderRadius: 1 }} />
          <div style={{ width: 4, height: 4, background: 'rgba(255,255,255,0.5)', borderRadius: 1 }} />
          <div style={{ width: 4, height: 4, background: 'rgba(255,255,255,0.5)', borderRadius: 1 }} />
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
