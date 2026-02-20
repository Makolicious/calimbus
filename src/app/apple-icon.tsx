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
          borderRadius: 34,
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize: 150,
            fontWeight: 400,
            fontFamily: 'Arial, sans-serif',
            lineHeight: 1,
            transform: 'rotate(-30deg)',
            marginTop: 0,
          }}
        >
          C
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
