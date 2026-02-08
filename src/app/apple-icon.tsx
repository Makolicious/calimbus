import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
          width: 180,
          height: 180,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          borderRadius: 34,
          padding: 12,
          position: 'relative',
        }}
      >
        {/* Binding rings */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 44, position: 'absolute', top: -2, left: 0, right: 0 }}>
          <div style={{ width: 15, height: 26, background: 'white', borderRadius: 4 }} />
          <div style={{ width: 15, height: 26, background: 'white', borderRadius: 4 }} />
        </div>
        {/* Top bar */}
        <div style={{ width: '100%', height: 34, background: 'rgba(255,255,255,0.3)', borderRadius: 8, marginTop: 26 }} />
        {/* Date grid */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, padding: 8, marginTop: 8, justifyContent: 'center' }}>
          <div style={{ width: 22, height: 22, background: 'white', borderRadius: 4 }} />
          <div style={{ width: 22, height: 22, background: 'white', borderRadius: 4 }} />
          <div style={{ width: 22, height: 22, background: 'white', borderRadius: 4 }} />
          <div style={{ width: 22, height: 22, background: 'white', borderRadius: 4 }} />
          <div style={{ width: 22, height: 22, background: 'white', borderRadius: 4 }} />
          <div style={{ width: 22, height: 22, background: 'white', borderRadius: 4 }} />
          <div style={{ width: 22, height: 22, background: 'rgba(255,255,255,0.5)', borderRadius: 4 }} />
          <div style={{ width: 22, height: 22, background: 'rgba(255,255,255,0.5)', borderRadius: 4 }} />
          <div style={{ width: 22, height: 22, background: 'rgba(255,255,255,0.5)', borderRadius: 4 }} />
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
