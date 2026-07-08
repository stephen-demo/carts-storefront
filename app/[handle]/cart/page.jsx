'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Trash } from '@phosphor-icons/react'
import { ZE, ZN, ZSC } from '../../../lib/styles'

const formatPrice = (amount) => `₦${Number(amount).toLocaleString('en-NG')}`
const cartKey = (handle) => `carts_cart_${handle}`

export default function CartPage() {
  const { handle } = useParams()
  const router = useRouter()

  const [items, setItems] = useState([])

  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem(cartKey(handle)) || '[]')) } catch { setItems([]) }
  }, [handle])

  useEffect(() => {
    localStorage.setItem(cartKey(handle), JSON.stringify(items))
  }, [items, handle])

  const updateQty = (i, delta) => {
    setItems(prev => {
      const next = [...prev]
      const newQty = next[i].qty + delta
      if (newQty < 1) next.splice(i, 1)
      else next[i] = { ...next[i], qty: newQty }
      return next
    })
  }

  const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i))

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0)

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-6" style={{ background: '#f5f5f5' }}>
        <div className="text-center">
          <p style={{ ...ZE, fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 6 }}>Your cart is empty</p>
          <p style={{ ...ZN, fontSize: 14, color: '#999' }}>Add some items to get started.</p>
        </div>
        <button onClick={() => router.push(`/${handle}`)} className="px-6 py-3 rounded-full"
          style={{ background: '#111', ...ZN, fontWeight: 700, fontSize: 14, color: 'white' }}>
          Browse store →
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#f5f5f5' }}>
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-4"
        style={{ background: 'white', borderBottom: '1px solid #eee' }}>
        <button onClick={() => router.back()} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#f0f0f0' }}>
          <ArrowLeft size={18} color="#333" />
        </button>
        <div>
          <p style={{ ...ZE, fontWeight: 700, fontSize: 16, color: '#111' }}>
            My Cart <span style={{ fontWeight: 400, color: '#999', fontSize: 14 }}>({items.length} {items.length === 1 ? 'item' : 'items'})</span>
          </p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-4 pb-36 flex flex-col gap-3">
        {items.map((item, i) => (
          <div key={`${item.productId}-${i}`} className="flex items-start gap-3 p-3 rounded-2xl" style={{ background: 'white' }}>
            <div className="w-16 rounded-xl overflow-hidden flex-shrink-0" style={{ aspectRatio: '3/4', background: '#e8e8e8' }}>
              {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-ellipsis overflow-hidden whitespace-nowrap" style={{ ...ZN, fontSize: 13, fontWeight: 600, color: '#111' }}>{item.name}</p>
              {(item.size || item.color) && (
                <p style={{ ...ZN, fontSize: 12, color: '#999', marginTop: 2 }}>{[item.size, item.color].filter(Boolean).join(' · ')}</p>
              )}
              <p style={{ ...ZSC, fontSize: 14, fontWeight: 700, color: '#111', marginTop: 4 }}>{formatPrice(item.price * item.qty)}</p>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-3 px-2 py-1 rounded-full" style={{ background: '#f0f0f0' }}>
                  <button onClick={() => updateQty(i, -1)} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#e0e0e0' }}>
                    <span style={{ fontSize: 16, color: '#333', lineHeight: 1 }}>−</span>
                  </button>
                  <span style={{ ...ZN, fontWeight: 700, fontSize: 14, color: '#111', minWidth: 16, textAlign: 'center' }}>{item.qty}</span>
                  <button onClick={() => updateQty(i, 1)} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#e0e0e0' }}>
                    <span style={{ fontSize: 16, color: '#333', lineHeight: 1 }}>+</span>
                  </button>
                </div>
                <button onClick={() => removeItem(i)}><Trash size={18} color="#bbb" /></button>
              </div>
            </div>
          </div>
        ))}

        <div className="p-4 rounded-2xl" style={{ background: 'white' }}>
          <p style={{ ...ZN, fontSize: 12, fontWeight: 700, color: '#111', marginBottom: 12 }}>Order Summary</p>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between">
              <span style={{ ...ZN, fontSize: 14, color: '#666' }}>Subtotal</span>
              <span style={{ ...ZSC, fontSize: 14, fontWeight: 600, color: '#111' }}>{formatPrice(subtotal)}</span>
            </div>
            <div style={{ height: 1, background: '#eee' }} />
            <div className="flex justify-between">
              <span style={{ ...ZN, fontSize: 14, fontWeight: 700, color: '#111' }}>Total</span>
              <span style={{ ...ZSC, fontSize: 16, fontWeight: 700, color: '#111' }}>{formatPrice(subtotal)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-4 pt-4 pb-8 max-w-2xl mx-auto"
        style={{ background: 'linear-gradient(to top, #f5f5f5 80%, transparent)' }}>
        <button
          onClick={() => router.push(`/${handle}/checkout`)}
          className="w-full py-4 rounded-full"
          style={{ background: '#e6fd53', ...ZE, fontWeight: 700, fontSize: 16, color: '#060806' }}>
          Checkout →
        </button>
      </div>
    </div>
  )
}
