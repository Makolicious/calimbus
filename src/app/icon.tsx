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
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '6px',
        }}
      >
        <span
          style={{
            fontSize: 22,
            color: 'white',
            fontWeight: 900,
            fontFamily: 'Courier New, Courier, monospace',
            letterSpacing: '-2px',
            textAlign: 'center',
            lineHeight: 1,
            marginTop: '-1px',
          }}
        >
          C
        </span>
      </div>
    ),
    {
      ...size,
    }
  )
}
