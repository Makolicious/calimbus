import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
          width: 180,
          height: 180,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 90,
        }}
      >
        <span
          style={{
            fontSize: 120,
            color: 'white',
            fontWeight: 900,
            fontFamily: 'monospace',
            lineHeight: 1,
            marginRight: 8,
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
