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
            fontSize: 20,
            color: 'white',
            fontWeight: 900,
            fontFamily: 'monospace',
            lineHeight: 1,
            marginRight: 1,
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
