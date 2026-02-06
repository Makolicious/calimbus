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
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 16,
        }}
      >
        <span
          style={{
            fontSize: 28,
            color: 'white',
            fontWeight: 900,
            fontFamily: 'Courier New, Courier, monospace',
            lineHeight: 1,
            marginRight: 4,
            marginBottom: 1,
            transform: 'rotate(-15deg)',
            textShadow: '1px 1px 0 rgba(0,0,0,0.15), 0 0 0 white',
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
