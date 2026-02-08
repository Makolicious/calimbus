import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
          width: 512,
          height: 512,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          borderRadius: 96,
          padding: 32,
          position: 'relative',
        }}
      >
        {/* Binding rings */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 128, position: 'absolute', top: -4, left: 0, right: 0 }}>
          <div style={{ width: 42, height: 72, background: 'white', borderRadius: 10 }} />
          <div style={{ width: 42, height: 72, background: 'white', borderRadius: 10 }} />
        </div>
        {/* Top bar */}
        <div style={{ width: '100%', height: 96, background: 'rgba(255,255,255,0.3)', borderRadius: 20, marginTop: 72 }} />
        {/* Date grid */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, padding: 20, marginTop: 20, justifyContent: 'center' }}>
          <div style={{ width: 60, height: 60, background: 'white', borderRadius: 10 }} />
          <div style={{ width: 60, height: 60, background: 'white', borderRadius: 10 }} />
          <div style={{ width: 60, height: 60, background: 'white', borderRadius: 10 }} />
          <div style={{ width: 60, height: 60, background: 'white', borderRadius: 10 }} />
          <div style={{ width: 60, height: 60, background: 'white', borderRadius: 10 }} />
          <div style={{ width: 60, height: 60, background: 'white', borderRadius: 10 }} />
          <div style={{ width: 60, height: 60, background: 'rgba(255,255,255,0.5)', borderRadius: 10 }} />
          <div style={{ width: 60, height: 60, background: 'rgba(255,255,255,0.5)', borderRadius: 10 }} />
          <div style={{ width: 60, height: 60, background: 'rgba(255,255,255,0.5)', borderRadius: 10 }} />
        </div>
      </div>
    ),
    {
      width: 512,
      height: 512,
    }
  )
}
