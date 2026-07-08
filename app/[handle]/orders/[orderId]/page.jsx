'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from '@phosphor-icons/react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../../../lib/firebase'
import { ZE, ZN, ZSC } from '../../../../lib/styles'

const formatPrice = (n) => `₦${Number(n || 0).toLocaleString('en-NG')}`

const STATUS_STEPS = ['New', 'Confirmed', 'Packed', 'Shipped', 'Delivered']

export default function OrderTrackingPage() {
  const { handle, orderId } = useParams()
  const router = useRouter()

  const [order, setOrder]     = useState(null)
  const [storeName, setStoreName] = useState(handle)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const handleSnap = await getDoc(doc(db, 'handles', handle))
        if (!handleSnap.exists()) { setLoading(false); return }
        const uid = handleSnap.data().uid
        const [orderSnap, storeSnap] = await Promise.all([
          getDoc(doc(db, 'stores', uid, 'orders', orderId)),
          getDoc(doc(db, 'stores', uid)),
        ])
        if (storeSnap.exists()) setStoreName(storeSnap.data().storeName || handle)
        if (orderSnap.exists()) setOrder({ id: orderSnap.id, ...orderSnap.data() })
      } catch { /* offline */ }
      setLoading(false)
    }
    load()
  }, [handle, orderId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#060806' }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#e6fd53', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  const currentStepIdx = order ? STATUS_STEPS.indexOf(order.status) : 0

  return (
    <div className="flex flex-col min-h-screen pb-32" style={{ background: '#060806' }}>
      <div className="flex items-center gap-3 px-4 pt-12 pb-6">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.07)' }}>
          <ArrowLeft size={18} color="white" />
        </button>
        <div>
          <p style={{ ...ZE, fontWeight: 700, fontSize: 16, color: 'white' }}>
            Track Order <span style={{ color: '#e6fd53' }}>#{orderId.slice(0, 8).toUpperCase()}</span>
          </p>
          <p style={{ ...ZN, fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{storeName}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto w-full flex flex-col gap-6 px-4">
        {/* Progress */}
        <div className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex flex-col">
            {STATUS_STEPS.map((step, i) => {
              const done = i <= currentStepIdx
              return (
                <div key={step} className="flex items-start gap-4">
                  <div className="flex flex-col items-center" style={{ width: 20, flexShrink: 0 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 99, background: done ? '#e6fd53' : 'transparent', border: done ? 'none' : '2px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {done && <span style={{ fontSize: 11, color: '#060806', fontWeight: 700, lineHeight: 1 }}>✓</span>}
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div style={{ width: 2, height: 36, background: STATUS_STEPS[i + 1] && i + 1 <= currentStepIdx ? 'rgba(230,253,83,0.5)' : 'rgba(255,255,255,0.1)', borderRadius: 99, marginTop: 2, marginBottom: 2 }} />
                    )}
                  </div>
                  <div className="flex-1 pb-2" style={{ minHeight: 28 }}>
                    <p style={{ ...ZN, fontSize: 14, fontWeight: done ? 600 : 400, color: done ? 'white' : 'rgba(255,255,255,0.35)' }}>{step}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Order items */}
        {order?.items?.length > 0 && (
          <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p style={{ ...ZN, fontWeight: 700, fontSize: 13, color: 'white', marginBottom: 12 }}>Items</p>
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3 py-2" style={{ borderBottom: i < order.items.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                {item.image && (
                  <div className="w-10 h-12 rounded-lg overflow-hidden flex-shrink-0" style={{ background: 'rgba(255,255,255,0.07)' }}>
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="truncate" style={{ ...ZN, fontSize: 13, fontWeight: 600, color: 'white' }}>{item.name}</p>
                  {(item.size || item.color) && <p style={{ ...ZN, fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>{[item.size, item.color].filter(Boolean).join(' · ')}</p>}
                </div>
                <span style={{ ...ZSC, fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.8)', flexShrink: 0 }}>{formatPrice(item.price * (item.qty || 1))}</span>
              </div>
            ))}
            <div className="flex justify-between mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ ...ZN, fontSize: 14, fontWeight: 700, color: 'white' }}>Total</span>
              <span style={{ ...ZSC, fontSize: 16, fontWeight: 700, color: 'white' }}>{formatPrice(order.total)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-4 pt-4 pb-10" style={{ background: 'linear-gradient(to top, #060806 80%, transparent)' }}>
        <div className="max-w-2xl mx-auto">
          <button onClick={() => router.push(`/${handle}/saved`)}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-full"
            style={{ background: '#e6fd53', ...ZE, fontWeight: 700, fontSize: 15, color: '#060806' }}>
            Message {storeName}
          </button>
        </div>
      </div>
    </div>
  )
}
