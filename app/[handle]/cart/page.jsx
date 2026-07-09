'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Trash } from '@phosphor-icons/react'

const formatPrice = (amount) => `₦${Number(amount).toLocaleString('en-NG')}`
const cartKey = (handle) => `carts_cart_${handle}`

const STEPS = ['Bag', 'Delivery', 'Payment', 'Done']

function StepBar({ current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 24px', gap: 0 }}>
      {STEPS.map((step, i) => (
        <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: i === current ? '#111' : i < current ? '#111' : 'transparent',
              border: `1.5px solid ${i <= current ? '#111' : '#ccc'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700,
              color: i <= current ? 'white' : '#bbb',
            }}>
              {i < current ? (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5.5L4 7.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : i + 1}
            </div>
            <span style={{ fontSize: 9, color: i === current ? '#111' : '#bbb', fontWeight: i === current ? 700 : 400, letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              {step}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{ width: 36, height: 1, background: i < current ? '#111' : '#ddd', margin: '0 4px', marginBottom: 16, flexShrink: 0 }} />
          )}
        </div>
      ))}
    </div>
  )
}

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

  const itemExtrasTotal = (item) => (item.selectedExtras || []).reduce((s, e) => s + (e.price || 0), 0)
  const itemTotal = (item) => (item.price + itemExtrasTotal(item)) * item.qty
  const subtotal = items.reduce((sum, item) => sum + itemTotal(item), 0)

  if (items.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 24, padding: '0 24px', background: '#f5f2ee' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, color: '#111', marginBottom: 8 }}>Your bag is empty</p>
          <p style={{ fontSize: 14, color: '#8a7f72' }}>Add items to your bag to continue.</p>
        </div>
        <button onClick={() => router.push(`/${handle}`)}
          style={{ padding: '14px 32px', background: '#111', color: 'white', borderRadius: 6, fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', border: 'none', cursor: 'pointer' }}>
          BROWSE STORE
        </button>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f2ee' }}>
      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 20, background: '#faf9f7', borderBottom: '1px solid #e0dbd2' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', maxWidth: 640, margin: '0 auto' }}>
          <button onClick={() => router.back()}
            style={{ fontSize: 13, fontWeight: 600, color: '#8a7f72', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.02em' }}>
            ← Back
          </button>
          <h1 style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 700, fontSize: 13, letterSpacing: '0.12em', color: '#111', textTransform: 'uppercase', margin: 0 }}>
            Shopping Bag
          </h1>
          <button onClick={() => router.push(`/${handle}`)}
            style={{ fontSize: 13, fontWeight: 600, color: '#8a7f72', background: 'none', border: 'none', cursor: 'pointer' }}>
            Edit
          </button>
        </div>
        <StepBar current={0} />
      </header>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '16px 16px 160px' }}>
        {/* Cart items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {items.map((item, i) => (
            <div key={`${item.productId}-${i}`} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '20px 0', borderBottom: '1px solid #e0dbd2' }}>
              {/* Square thumbnail */}
              <div style={{ width: 80, height: 80, background: '#ece8e2', borderRadius: 4, overflow: 'hidden', flexShrink: 0 }}>
                {item.image && <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 10, color: '#8a7f72', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>
                  {item.brand || 'STORE ITEM'}
                </p>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#111', fontFamily: 'Georgia, serif', lineHeight: 1.3, marginBottom: 4 }}>{item.name}</p>
                {(item.size || item.color) && (
                  <p style={{ fontSize: 12, color: '#8a7f72', marginBottom: 6 }}>
                    {[item.color && `Color: ${item.color}`, item.size && `Size: ${item.size}`].filter(Boolean).join('  ')}
                  </p>
                )}
                {item.selectedExtras?.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    {item.selectedExtras.map(ex => (
                      <p key={ex.id} style={{ fontSize: 12, color: '#8a7f72' }}>+ {ex.label} ({formatPrice(ex.price)})</p>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                  {/* Qty controls */}
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e0dbd2', borderRadius: 4, overflow: 'hidden' }}>
                    <button onClick={() => updateQty(i, -1)}
                      style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: '#555', fontSize: 16, cursor: 'pointer' }}>
                      −
                    </button>
                    <span style={{ width: 28, textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#111' }}>{item.qty}</span>
                    <button onClick={() => updateQty(i, 1)}
                      style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: '#555', fontSize: 16, cursor: 'pointer' }}>
                      +
                    </button>
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#111', fontFamily: 'Georgia, serif' }}>{formatPrice(itemTotal(item))}</p>
                </div>
              </div>

              {/* Remove */}
              <button onClick={() => removeItem(i)} style={{ background: 'transparent', border: 'none', padding: 4, cursor: 'pointer', marginTop: 2 }}>
                <Trash size={16} color="#c8c2b8" />
              </button>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div style={{ marginTop: 24, background: 'white', borderRadius: 8, padding: '20px 20px', border: '1px solid #e0dbd2' }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#8a7f72', textTransform: 'uppercase', marginBottom: 16 }}>Order Summary</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, color: '#555' }}>Subtotal</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{formatPrice(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, color: '#555' }}>Delivery</span>
              <span style={{ fontSize: 14, color: '#8a7f72' }}>Calculated at checkout</span>
            </div>
            <div style={{ height: 1, background: '#e0dbd2', margin: '4px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#111', fontFamily: 'Georgia, serif' }}>Estimated Total</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#111', fontFamily: 'Georgia, serif' }}>{formatPrice(subtotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed footer CTA */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#faf9f7', borderTop: '1px solid #e0dbd2', padding: '16px 20px 32px', maxWidth: 640, margin: '0 auto' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <button onClick={() => router.push(`/${handle}/checkout`)}
            style={{ width: '100%', padding: '16px', background: '#111', color: 'white', borderRadius: 6, fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', border: 'none', cursor: 'pointer', display: 'block' }}>
            PROCEED TO CHECKOUT
          </button>
          <button onClick={() => router.push(`/${handle}`)}
            style={{ display: 'block', width: '100%', marginTop: 12, textAlign: 'center', fontSize: 13, color: '#8a7f72', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}>
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  )
}
