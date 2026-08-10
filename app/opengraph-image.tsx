// app/opengraph-image.tsx
import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 800, color: 'white', textAlign: 'center' }}>
          Cash For Test Strips USA
        </div>
        <div style={{ fontSize: 32, color: '#d1fae5', marginTop: 24, textAlign: 'center' }}>
          Sell your unused diabetic test strips for cash
        </div>
      </div>
    ),
    { ...size }
  )
}
