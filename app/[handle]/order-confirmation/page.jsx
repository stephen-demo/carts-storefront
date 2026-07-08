'use client'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { ZE, ZN, ZSC } from '../../../lib/styles'

const formatPrice = (n) => `₦${Number(n || 0).toLocaleString('en-NG')}`

function OrderConfirmationContent() {
  const { handle } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()

  const orderId   = searchParams.get('orderId') || ''
  const total     = Number(searchParams.get('total') || 0)
  const buyerName = searchParams.get('name') || ''

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 gap-6" style={{ background: '#060806' }}>
      <div className="flex items-center justify-center" style={{ width: 64, height: 64, borderRadius: 99, background: '#e6fd53' }}>
        <span style={{ fontSize: 30, lineHeight: 1 }}>✓</span>
      </div>
      <div className="text-center">
        <h1 style={{ ...ZE, fontWeight: 700, fontSize: 28, color: 'white', marginBottom: 10 }}>Order Received!</h1>
        <p style={{ ...ZN, fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
          {buyerName && <><span style={{ color: 'white', fontWeight: 600 }}>{buyerName}</span>, the</>}
          {' '}store will confirm your order soon.
        </p>
        {orderId && (
          <p style={{ ...ZN, fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>Order #{orderId.slice(0, 8).toUpperCase()}</p>
        )}
        {total > 0 && (
          <p style={{ ...ZSC, fontSize: 20, fontWeight: 700, color: 'white', marginTop: 12 }}>{formatPrice(total)}</p>
        )}
      </div>
      <div className="w-full flex flex-col gap-3 max-w-sm">
        <button onClick={() => router.push(`/${handle}/saved`)}
          className="w-full flex items-center justify-center py-4 rounded-full"
          style={{ background: '#e6fd53', ...ZE, fontWeight: 700, fontSize: 15, color: '#060806' }}>
          View Messages →
        </button>
        <button onClick={() => router.push(`/${handle}`)}
          className="w-full flex items-center justify-center py-4 rounded-full"
          style={{ background: 'transparent', border: '1.5px solid rgba(255,255,255,0.2)', ...ZE, fontWeight: 700, fontSize: 15, color: 'white' }}>
          Back to store
        </button>
      </div>
    </div>
  )
}

export default function OrderConfirmationPage() {
  return (
    <Suspense>
      <OrderConfirmationContent />
    </Suspense>
  )
}
