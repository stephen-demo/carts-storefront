'use client'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const formatPrice = (n) => `₦${Number(n || 0).toLocaleString('en-NG')}`

function OrderConfirmationContent() {
  const { handle } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()

  const orderId   = searchParams.get('orderId') || ''
  const total     = Number(searchParams.get('total') || 0)
  const buyerName = searchParams.get('name') || ''
  const firstName = buyerName.split(' ')[0]

  return (
    <div style={{ minHeight: '100vh', background: '#f5f2ee' }}>
      {/* Header */}
      <div style={{ background: '#faf9f7', borderBottom: '1px solid #e0dbd2', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
        <button onClick={() => router.push(`/${handle}`)}
          style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 16, letterSpacing: '0.12em', color: '#111', background: 'none', border: 'none' }}>
          {handle?.toUpperCase()}
        </button>
      </div>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>

        {/* Lime check circle */}
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#c5f135', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
            <path d="M6 15L12.5 21.5L24 9" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Heading */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 32, color: '#111', lineHeight: 1.2, marginBottom: 10 }}>
            Thank you{firstName ? `, ${firstName}` : ''}
          </h1>
          <p style={{ fontSize: 15, color: '#8a7f72', lineHeight: 1.6, margin: 0 }}>
            Your order is confirmed and on its way.
          </p>
          {orderId && (
            <p style={{ fontSize: 13, color: '#bbb', marginTop: 8, letterSpacing: '0.06em', fontWeight: 600 }}>
              ORDER #{orderId.slice(0, 8).toUpperCase()}
            </p>
          )}
        </div>

        {/* Summary card */}
        {total > 0 && (
          <div style={{ width: '100%', background: 'white', borderRadius: 10, padding: '20px 24px', border: '1px solid #e0dbd2' }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#8a7f72', textTransform: 'uppercase', marginBottom: 14 }}>Order Summary</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 14, color: '#555' }}>Total Paid</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#111', fontFamily: 'Georgia, serif' }}>{formatPrice(total)}</span>
            </div>
          </div>
        )}

        {/* What happens next */}
        <div style={{ width: '100%' }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#8a7f72', textTransform: 'uppercase', textAlign: 'center', marginBottom: 20 }}>
            Shipment Timeline
          </p>
          <div style={{ position: 'relative', paddingLeft: 12 }}>
            {/* Vertical connector line */}
            <div style={{ position: 'absolute', left: 11, top: 12, bottom: 40, width: 1, background: '#e0dbd2' }} />
            {[
              { label: 'Order Confirmed', sub: 'Just now', done: true },
              { label: 'Seller Preparing', sub: 'Est. 1–2 days', done: false },
              { label: 'Shipped / Ready', sub: 'Est. 2–5 days', done: false },
              { label: 'Delivered', sub: '', done: false },
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20, position: 'relative' }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  background: step.done ? '#111' : 'white',
                  border: `2px solid ${step.done ? '#111' : '#e0dbd2'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1
                }}>
                  {step.done && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5.5L4 7.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <div>
                  <p style={{ fontSize: 14, color: step.done ? '#111' : '#aaa', fontWeight: step.done ? 600 : 400, marginBottom: 2 }}>{step.label}</p>
                  {step.sub && <p style={{ fontSize: 12, color: '#bbb' }}>{step.sub}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button onClick={() => router.push(`/${handle}`)}
            style={{ width: '100%', padding: '16px', background: '#111', color: 'white', borderRadius: 6, fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', border: 'none', cursor: 'pointer' }}>
            CONTINUE SHOPPING
          </button>
          <button onClick={() => router.push(`/${handle}/saved`)}
            style={{ width: '100%', padding: '15px', background: 'transparent', color: '#111', borderRadius: 6, fontSize: 13, fontWeight: 600, border: '1.5px solid #c8c2b8', cursor: 'pointer', letterSpacing: '0.04em' }}>
            VIEW MESSAGES
          </button>
        </div>

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
