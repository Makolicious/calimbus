import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '100px',
        }}
      >
        <span
          style={{
            fontSize: 380,
            color: 'white',
            fontWeight: 900,
            fontFamily: 'Courier New, Courier, monospace',
            letterSpacing: '-25px',
            textAlign: 'center',
            lineHeight: 1,
          }}
        >
          C
        </span>
      </div>
    ),
    {
      width: 512,
      height: 512,
    }
  )
}
