'use client'
import { useState, useEffect, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Star, CheckCircle, ShoppingBag } from '@phosphor-icons/react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../../../lib/firebase'
import { ZE, ZN, ZSC } from '../../../../lib/styles'

const formatPrice = (n) => `₦${Number(n || 0).toLocaleString('en-NG')}`

const STATUS_STEPS = ['New', 'Packed', 'Shipped', 'Received']
const STATUS_LABELS = { New: 'Order received', Packed: 'Being packed', Shipped: 'On the way', Received: 'Delivered' }

function useActionParam() {
  const searchParams = useSearchParams()
  return searchParams.get('action')
}

function OrderTrackingPageInner() {
  const { handle, orderId } = useParams()
  const router = useRouter()
  const actionParam = useActionParam()

  const [order, setOrder]       = useState(null)
  const [storeName, setStoreName] = useState(handle)
  const [storeUid, setStoreUid] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [confirmed, setConfirmed] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [rating, setRating]     = useState(0)
  const [feedback, setFeedback] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const handleSnap = await getDoc(doc(db, 'handles', handle))
        if (!handleSnap.exists()) { setLoading(false); return }
        const uid = handleSnap.data().uid
        setStoreUid(uid)
        const [orderSnap, storeSnap] = await Promise.all([
          getDoc(doc(db, 'stores', uid, 'orders', orderId)),
          getDoc(doc(db, 'stores', uid)),
        ])
        if (storeSnap.exists()) setStoreName(storeSnap.data().storeName || handle)
        if (orderSnap.exists()) {
          const data = { id: orderSnap.id, ...orderSnap.data() }
          setOrder(data)
          if (data.buyerConfirmed) setConfirmed(true)
          if (data.buyerFeedback) setSubmitted(true)
        }
      } catch { /* offline */ }
      setLoading(false)
    }
    load()
  }, [handle, orderId])

  // Auto-trigger confirm flow if ?action=received in URL
  useEffect(() => {
    if (actionParam === 'received' && order && !confirmed) {
      setShowFeedback(true)
    }
  }, [actionParam, order, confirmed])

  const confirmReceived = async () => {
    if (!storeUid || confirming) return
    setConfirming(true)
    try {
      await updateDoc(doc(db, 'stores', storeUid, 'orders', orderId), { buyerConfirmed: true, status: 'Received' })
      setConfirmed(true)
      setShowFeedback(true)
      setOrder(prev => ({ ...prev, buyerConfirmed: true, status: 'Received' }))
    } catch {}
    setConfirming(false)
  }

  const submitFeedback = async () => {
    if (!storeUid || submitting || (!rating && !feedback.trim())) return
    setSubmitting(true)
    try {
      await updateDoc(doc(db, 'stores', storeUid, 'orders', orderId), {
        buyerRating: rating || null,
        buyerFeedback: feedback.trim() || null,
      })
      setSubmitted(true)
    } catch {}
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f5f2ee' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #111', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  if (!order) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f5f2ee', gap: 12, padding: 24, textAlign: 'center' }}>
        <ShoppingBag size={48} color="#c8bfb0" weight="duotone" />
        <p style={{ fontSize: 18, fontWeight: 700, color: '#1a1209', margin: 0 }}>Order not found</p>
        <p style={{ fontSize: 14, color: '#8a7f72', margin: 0 }}>This order may have been removed or the link is incorrect.</p>
        <button onClick={() => router.push(`/${handle}`)} style={{ marginTop: 12, background: '#1a1209', color: 'white', border: 'none', borderRadius: 8, padding: '12px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          Browse store
        </button>
      </div>
    )
  }

  const currentStepIdx = STATUS_STEPS.indexOf(order.status)

  return (
    <div style={{ minHeight: '100vh', background: '#f5f2ee', paddingBottom: 120 }}>

      {/* Nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '48px 20px 20px', background: '#faf9f7', borderBottom: '1px solid #e8e2d9' }}>
        <button onClick={() => router.push(`/${handle}`)} style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid #e0dbd2', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <ArrowLeft size={16} color="#1a1209" />
        </button>
        <div>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1a1209', fontFamily: 'Georgia, serif' }}>
            Order #{orderId.slice(0, 8).toUpperCase()}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#8a7f72' }}>{storeName}</p>
        </div>
      </div>

      <div style={{ maxWidth: 540, margin: '0 auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Confirm received prompt */}
        {!confirmed && order.status !== 'Received' && (
          <div style={{ background: 'white', borderRadius: 12, padding: '20px 20px', border: '1px solid #e8e2d9' }}>
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#1a1209' }}>Have you received your order?</p>
            <p style={{ margin: '0 0 14px', fontSize: 13, color: '#8a7f72', lineHeight: 1.5 }}>Let {storeName} know once your order arrives so they can mark it as complete.</p>
            <button onClick={confirmReceived} disabled={confirming}
              style={{ background: '#1a1209', color: 'white', border: 'none', borderRadius: 8, padding: '12px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: confirming ? 0.6 : 1 }}>
              <CheckCircle size={16} weight="bold" color="white" />
              {confirming ? 'Confirming…' : 'Yes, I received it'}
            </button>
          </div>
        )}

        {/* Confirmed banner */}
        {confirmed && !submitted && !showFeedback && (
          <div style={{ background: '#f0fdf4', borderRadius: 12, padding: '16px 20px', border: '1px solid #86efac', display: 'flex', alignItems: 'center', gap: 12 }}>
            <CheckCircle size={24} color="#16a34a" weight="fill" />
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#15803d' }}>Delivery confirmed!</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#16a34a' }}>Thank you for letting {storeName} know.</p>
            </div>
          </div>
        )}

        {/* Status timeline */}
        <div style={{ background: 'white', borderRadius: 12, padding: '20px 20px', border: '1px solid #e8e2d9' }}>
          <p style={{ margin: '0 0 16px', fontSize: 10, color: '#a09080', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>Order Status</p>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {STATUS_STEPS.map((step, i) => {
              const done = i <= currentStepIdx
              const current = i === currentStepIdx
              return (
                <div key={step} style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24, flexShrink: 0 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: done ? '#1a1209' : 'transparent', border: done ? 'none' : '2px solid #e0dbd2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {done && <span style={{ fontSize: 12, color: 'white', fontWeight: 700 }}>✓</span>}
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div style={{ width: 2, height: 32, background: i < currentStepIdx ? '#1a1209' : '#e8e2d9', borderRadius: 99, marginTop: 2, marginBottom: 2 }} />
                    )}
                  </div>
                  <div style={{ flex: 1, paddingBottom: 8 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: current ? 700 : done ? 500 : 400, color: done ? '#1a1209' : '#c8bfb0' }}>
                      {STATUS_LABELS[step] || step}
                    </p>
                    {current && <p style={{ margin: '2px 0 0', fontSize: 12, color: '#8a7f72' }}>Current status</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Items */}
        {order.items?.length > 0 && (
          <div style={{ background: 'white', borderRadius: 12, padding: '20px 20px', border: '1px solid #e8e2d9' }}>
            <p style={{ margin: '0 0 14px', fontSize: 10, color: '#a09080', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>Items</p>
            {order.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 12, borderBottom: i < order.items.length - 1 ? '1px solid #f0ece4' : 'none', marginBottom: i < order.items.length - 1 ? 12 : 0 }}>
                {item.image && (
                  <div style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', background: '#ece8e2', flexShrink: 0 }}>
                    <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1a1209', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                  {(item.size || item.color) && <p style={{ margin: '2px 0 0', fontSize: 12, color: '#8a7f72' }}>{[item.size, item.color].filter(Boolean).join(' · ')}</p>}
                </div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1a1209', flexShrink: 0 }}>{formatPrice((item.price || 0) * (item.qty || 1))}</p>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: '2px solid #1a1209' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1209', fontFamily: 'Georgia, serif' }}>Total</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#1a1209', fontFamily: 'Georgia, serif' }}>{formatPrice(order.total)}</span>
            </div>
          </div>
        )}

        {/* Feedback / review */}
        {(showFeedback || confirmed) && !submitted && (
          <div style={{ background: 'white', borderRadius: 12, padding: '20px 20px', border: '1px solid #e8e2d9' }}>
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#1a1209' }}>How was your experience?</p>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#8a7f72', lineHeight: 1.5 }}>Your feedback helps {storeName} get better.</p>

            {/* Star rating */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} onClick={() => setRating(s)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  <Star size={28} weight={s <= rating ? 'fill' : 'regular'} color={s <= rating ? '#f59e0b' : '#e0dbd2'} />
                </button>
              ))}
            </div>

            <textarea
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              placeholder="Tell them what you loved or what could be better…"
              rows={3}
              style={{ width: '100%', boxSizing: 'border-box', background: '#faf9f7', border: '1px solid #e8e2d9', borderRadius: 8, padding: '12px 14px', fontSize: 14, color: '#1a1209', outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: 1.5 }}
            />

            <button onClick={submitFeedback} disabled={submitting || (!rating && !feedback.trim())}
              style={{ marginTop: 12, background: rating || feedback.trim() ? '#1a1209' : '#e8e2d9', color: rating || feedback.trim() ? 'white' : '#a09080', border: 'none', borderRadius: 8, padding: '12px 24px', fontSize: 13, fontWeight: 700, cursor: rating || feedback.trim() ? 'pointer' : 'not-allowed', width: '100%', opacity: submitting ? 0.6 : 1 }}>
              {submitting ? 'Sending…' : 'Send feedback'}
            </button>
          </div>
        )}

        {submitted && (
          <div style={{ background: '#f0fdf4', borderRadius: 12, padding: '16px 20px', border: '1px solid #86efac', textAlign: 'center' }}>
            <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: '#15803d' }}>Thank you! 🙌</p>
            <p style={{ margin: 0, fontSize: 13, color: '#16a34a' }}>Your feedback has been sent to {storeName}.</p>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 20px 32px', background: 'linear-gradient(to top, #f5f2ee 80%, transparent)' }}>
        <div style={{ maxWidth: 540, margin: '0 auto' }}>
          <button onClick={() => router.push(`/${handle}`)}
            style={{ width: '100%', background: '#1a1209', color: 'white', border: 'none', borderRadius: 8, padding: '14px', fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>
            Browse more from {storeName}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function OrderTrackingPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f5f2ee' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #111', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <OrderTrackingPageInner />
    </Suspense>
  )
}
