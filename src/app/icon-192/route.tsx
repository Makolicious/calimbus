import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
          width: 192,
          height: 192,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          borderRadius: 36,
          padding: 12,
          position: 'relative',
        }}
      >
        {/* Binding rings */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 48, position: 'absolute', top: -2, left: 0, right: 0 }}>
          <div style={{ width: 16, height: 28, background: 'white', borderRadius: 4 }} />
          <div style={{ width: 16, height: 28, background: 'white', borderRadius: 4 }} />
        </div>
        {/* Top bar */}
        <div style={{ width: '100%', height: 36, background: 'rgba(255,255,255,0.3)', borderRadius: 8, marginTop: 28 }} />
        {/* Date grid */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, padding: 8, marginTop: 8, justifyContent: 'center' }}>
          <div style={{ width: 24, height: 24, background: 'white', borderRadius: 4 }} />
          <div style={{ width: 24, height: 24, background: 'white', borderRadius: 4 }} />
          <div style={{ width: 24, height: 24, background: 'white', borderRadius: 4 }} />
          <div style={{ width: 24, height: 24, background: 'white', borderRadius: 4 }} />
          <div style={{ width: 24, height: 24, background: 'white', borderRadius: 4 }} />
          <div style={{ width: 24, height: 24, background: 'white', borderRadius: 4 }} />
          <div style={{ width: 24, height: 24, background: 'rgba(255,255,255,0.5)', borderRadius: 4 }} />
          <div style={{ width: 24, height: 24, background: 'rgba(255,255,255,0.5)', borderRadius: 4 }} />
          <div style={{ width: 24, height: 24, background: 'rgba(255,255,255,0.5)', borderRadius: 4 }} />
        </div>
      </div>
    ),
    {
      width: 192,
      height: 192,
    }
  )
}
