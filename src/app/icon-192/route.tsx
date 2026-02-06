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
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 96,
        }}
      >
        <span
          style={{
            fontSize: 170,
            color: 'white',
            fontWeight: 900,
            fontFamily: 'Courier New, Courier, monospace',
            lineHeight: 1,
            marginRight: 25,
            marginBottom: 6,
            transform: 'rotate(-15deg)',
            textShadow: '3px 3px 0 rgba(0,0,0,0.15), -2px -2px 0 rgba(255,255,255,0.3), 1px 0 0 white, -1px 0 0 white, 0 1px 0 white, 0 -1px 0 white',
          }}
        >
          C
        </span>
      </div>
    ),
    {
      width: 192,
      height: 192,
    }
  )
}
