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
            fontSize: 160,
            color: 'white',
            fontWeight: 900,
            fontFamily: 'Courier New, Courier, monospace',
            lineHeight: 1,
            marginRight: 23,
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
      ...size,
    }
  )
}
