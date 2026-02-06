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
            fontSize: 130,
            color: 'white',
            fontWeight: 900,
            fontFamily: 'monospace',
            lineHeight: 1,
            marginRight: 10,
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
