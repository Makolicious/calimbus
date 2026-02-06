import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 360,
          background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '100px',
          color: 'white',
          fontWeight: 'bold',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        C
      </div>
    ),
    {
      width: 512,
      height: 512,
    }
  )
}
