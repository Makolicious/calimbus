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
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 256,
        }}
      >
        <span
          style={{
            fontSize: 450,
            color: 'white',
            fontWeight: 900,
            fontFamily: 'Courier New, Courier, monospace',
            lineHeight: 1,
            marginRight: 67,
            marginBottom: 16,
            transform: 'rotate(-15deg)',
            textShadow: '8px 8px 0 rgba(0,0,0,0.15), -5px -5px 0 rgba(255,255,255,0.3), 3px 0 0 white, -3px 0 0 white, 0 3px 0 white, 0 -3px 0 white',
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
