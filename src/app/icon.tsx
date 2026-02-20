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
          borderRadius: 6,
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize: 28,
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
