'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, CaretDown, Tag, X, CreditCard, Package } from '@phosphor-icons/react'
import { db } from '../../../lib/firebase'
import { collection, addDoc, doc, getDoc, setDoc, getDocs, query, where, serverTimestamp, increment, updateDoc } from 'firebase/firestore'
import { ZE, ZN, ZSC } from '../../../lib/styles'

const formatPrice = (n) => `₦${Number(n || 0).toLocaleString('en-NG')}`

const inputStyle = {
  background: '#f0f0f0', border: '1px solid transparent', borderRadius: 12,
  padding: '14px 16px', color: '#111', fontSize: 15, width: '100%',
  outline: 'none', fontFamily: "'Zalando Sans'",
}

const DELIVERY_OPTIONS = [
  { id: 'pickup', label: 'Pickup from store', sub: 'Free',              price: 0    },
  { id: 'gig',    label: 'GIG Express',        sub: '1–2 days · ₦1,500', price: 1500 },
  { id: 'kwik',   label: 'Kwik Delivery',      sub: 'Same day · ₦2,500', price: 2500 },
]

function calcDiscount(deal, items, itemsTotal, deliveryPrice) {
  if (!deal) return 0
  if (deal.dealType === 'free_ship') return deliveryPrice
  if (deal.dealType === 'pct_off' || deal.dealType === 'flash') {
    const pct = Number(deal.pctValue || deal.flashPct || 0)
    if (!pct) return 0
    if (deal.applyToAll) return Math.round(itemsTotal * pct / 100)
    const eligibleTotal = items.filter(i => (deal.selectedItems || []).includes(i.productId))
      .reduce((s, i) => s + (i.price ?? 0) * (i.qty ?? 1), 0)
    return Math.round(eligibleTotal * pct / 100)
  }
  if (deal.dealType === 'fixed_off') return Math.min(Number(deal.fixedValue || 0), itemsTotal)
  return 0
}

function usePaystack() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.PaystackPop) { setReady(true); return }
    const s = document.createElement('script')
    s.src = 'https://js.paystack.co/v1/inline.js'
    s.onload = () => setReady(true)
    document.head.appendChild(s)
    return () => s.remove()
  }, [])
  return ready
}

export default function CheckoutPage() {
  const { handle } = useParams()
  const router = useRouter()
  const paystackReady = usePaystack()

  const [cartItems, setCartItems] = useState([])
  const [storeUid, setStoreUid]   = useState(null)
  const [storeData, setStoreData] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const [deals, setDeals]             = useState([])
  const [appliedDeal, setAppliedDeal] = useState(null)
  const [promoInput, setPromoInput]   = useState('')
  const [promoError, setPromoError]   = useState('')
  const [promoOpen, setPromoOpen]     = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('delivery')

  const [form, setForm] = useState({ name: '', email: '', phone: '', delivery: 'pickup', street: '', city: '', note: '' })
  const [summaryOpen, setSummaryOpen] = useState(false)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(`carts_cart_${handle}`) || '[]')
      setCartItems(saved)
    } catch { setCartItems([]) }
  }, [handle])

  useEffect(() => {
    getDoc(doc(db, 'handles', handle)).then(snap => {
      if (!snap.exists()) return
      const uid = snap.data().uid
      setStoreUid(uid)
      Promise.all([
        getDoc(doc(db, 'stores', uid)),
        getDocs(query(collection(db, 'stores', uid, 'deals'), where('active', '==', true))),
      ]).then(([storeSnap, dealsSnap]) => {
        if (storeSnap.exists()) setStoreData(storeSnap.data())
        const active = dealsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        setDeals(active)
        const autoDeal = active.find(d => d.autoApply)
        if (autoDeal) setAppliedDeal(autoDeal)
      }).catch(() => {})
    })
  }, [handle])

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const deliveryOption    = DELIVERY_OPTIONS.find(d => d.id === form.delivery)
  const itemsTotal        = cartItems.reduce((s, i) => s + (i.price ?? 0) * (i.qty ?? 1), 0)
  const deliveryFee       = deliveryOption?.price || 0
  const discount          = calcDiscount(appliedDeal, cartItems, itemsTotal, deliveryFee)
  const effectiveDelivery = appliedDeal?.dealType === 'free_ship' ? 0 : deliveryFee
  const total             = itemsTotal + effectiveDelivery - (appliedDeal?.dealType === 'free_ship' ? 0 : discount)
  const showAddress       = form.delivery !== 'pickup'
  const hasPaystackKey    = !!storeData?.paystackPublicKey

  const applyPromoCode = () => {
    setPromoError('')
    const code = promoInput.trim().toUpperCase()
    const match = deals.find(d => (d.promoCode || '').toUpperCase() === code)
    if (!match) { setPromoError('Code not found or no longer active'); return }
    setAppliedDeal(match); setPromoOpen(false); setPromoInput('')
  }

  const baseValid = form.name && form.phone.length >= 7
  const cardValid = paymentMethod !== 'card' || (hasPaystackKey && form.email.includes('@'))
  const canSubmit = baseValid && cardValid && !submitting

  const buildOrderData = (paymentRef = null) => ({
    buyerName: form.name.trim(), buyerPhone: form.phone,
    buyerEmail: form.email.trim() || null, delivery: form.delivery,
    deliveryFee: effectiveDelivery,
    ...(showAddress && form.street ? { street: form.street.trim() } : {}),
    ...(showAddress && form.city   ? { city: form.city.trim() }   : {}),
    ...(form.note ? { note: form.note.trim() } : {}),
    items: cartItems, itemsTotal, discount, total,
    ...(appliedDeal ? { dealId: appliedDeal.id, dealName: appliedDeal.name } : {}),
    paymentMethod,
    ...(paymentRef ? { paymentRef, paymentStatus: 'paid' } : { paymentStatus: 'pending' }),
    status: 'New', handle, createdAt: serverTimestamp(),
  })

  const commitOrder = async (paymentRef = null) => {
    setSubmitting(true); setSubmitError('')
    try {
      const orderData = buildOrderData(paymentRef)
      const ref = await addDoc(collection(db, 'stores', storeUid, 'orders'), orderData)

      const phone = form.phone.replace(/\D/g, '')
      await setDoc(doc(db, 'stores', storeUid, 'customers', phone), {
        name: form.name.trim(), phone,
        ...(form.email ? { email: form.email.trim() } : {}),
        lastOrder: serverTimestamp(), orderCount: increment(1), totalSpent: increment(total),
      }, { merge: true })

      if (appliedDeal) {
        updateDoc(doc(db, 'stores', storeUid, 'deals', appliedDeal.id), { usedCount: increment(1) }).catch(() => {})
      }

      const notifPrefs = storeData?.notifPrefs ?? {}
      if (notifPrefs.newOrders !== false && storeData?.email) {
        fetch('https://app.carts.ng/api/notify', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'merchant-order', merchantEmail: storeData.email,
            storeName: storeData.storeName || handle, storeHandle: handle,
            orderId: ref.id, buyerName: form.name.trim(), buyerPhone: form.phone,
            delivery: form.delivery, items: cartItems, total, discount,
            dealName: appliedDeal?.name || '', paymentMethod,
          }),
        }).catch(() => {})
      }

      // Clear cart
      localStorage.removeItem(`carts_cart_${handle}`)
      router.push(`/${handle}/order-confirmation?orderId=${ref.id}&total=${total}&name=${encodeURIComponent(form.name)}`)
    } catch (err) {
      console.error('Order error:', err)
      setSubmitError('Could not place order. Please try again.')
      setSubmitting(false)
    }
  }

  const handleSubmit = () => {
    if (!canSubmit || !storeUid) return
    if (paymentMethod === 'card') {
      if (!paystackReady || !window.PaystackPop) {
        setSubmitError('Payment not ready. Please wait a moment and try again.')
        return
      }
      setSubmitting(true)
      const handler = window.PaystackPop.setup({
        key: storeData.paystackPublicKey, email: form.email.trim(),
        amount: Math.round(total * 100), currency: 'NGN',
        ref: `carts_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        metadata: { custom_fields: [{ display_name: 'Store', value: handle }] },
        callback: (response) => commitOrder(response.reference),
        onClose: () => setSubmitting(false),
      })
      handler.openIframe()
    } else {
      commitOrder()
    }
  }

  return (
    <div className="min-h-screen pb-44" style={{ background: '#f5f5f5' }}>
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-4" style={{ background: 'white', borderBottom: '1px solid #eee' }}>
        <button onClick={() => router.back()} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#f0f0f0' }}>
          <ArrowLeft size={18} color="#333" />
        </button>
        <p style={{ ...ZE, fontWeight: 700, fontSize: 16, color: '#111' }}>Checkout</p>
      </header>

      <div className="max-w-2xl mx-auto flex flex-col gap-4 px-4 pt-4">
        {/* Contact */}
        <div className="p-4 rounded-2xl flex flex-col gap-4" style={{ background: 'white' }}>
          <p style={{ ...ZE, fontSize: 11, fontWeight: 700, color: '#111', letterSpacing: '0.06em' }}>CONTACT</p>
          <input style={inputStyle} placeholder="Your name" value={form.name} onChange={e => set('name', e.target.value)} />
          <div className="flex items-center rounded-xl overflow-hidden" style={{ background: '#f0f0f0' }}>
            <span className="px-4 py-[14px] flex-shrink-0" style={{ ...ZN, fontSize: 15, color: '#555', borderRight: '1px solid #ddd' }}>+234</span>
            <input style={{ ...inputStyle, background: 'transparent', borderRadius: 0, paddingLeft: 12 }}
              placeholder="801 234 5678" type="tel" value={form.phone}
              onChange={e => set('phone', e.target.value.replace(/\D/g, ''))} />
          </div>
          <input style={inputStyle}
            placeholder={paymentMethod === 'card' ? 'Email address (required for payment)' : 'Email address (optional, for receipt)'}
            type="email" value={form.email} onChange={e => set('email', e.target.value)} />
        </div>

        {/* Delivery */}
        <div className="p-4 rounded-2xl flex flex-col gap-3" style={{ background: 'white' }}>
          <p style={{ ...ZE, fontSize: 11, fontWeight: 700, color: '#111', letterSpacing: '0.06em' }}>DELIVERY</p>
          {DELIVERY_OPTIONS.map(opt => (
            <button key={opt.id} onClick={() => set('delivery', opt.id)}
              className="flex items-center gap-3 p-3 rounded-2xl text-left w-full"
              style={{ background: form.delivery === opt.id ? 'rgba(230,253,83,0.08)' : '#f7f7f7', border: `2px solid ${form.delivery === opt.id ? '#e6fd53' : 'transparent'}` }}>
              <div style={{ width: 18, height: 18, borderRadius: 99, flexShrink: 0, border: form.delivery === opt.id ? '5px solid #111' : '2px solid #ccc' }} />
              <div className="flex-1">
                <p style={{ ...ZN, fontSize: 14, fontWeight: 600, color: '#111' }}>{opt.label}</p>
                <p style={{ ...ZN, fontSize: 12, color: '#999' }}>{opt.sub}</p>
              </div>
            </button>
          ))}
          {showAddress && (
            <div className="flex flex-col gap-3 pt-2">
              <input style={inputStyle} placeholder="Street address" value={form.street} onChange={e => set('street', e.target.value)} />
              <input style={inputStyle} placeholder="City / LGA" value={form.city} onChange={e => set('city', e.target.value)} />
            </div>
          )}
        </div>

        {/* Promo */}
        <div className="p-4 rounded-2xl" style={{ background: 'white' }}>
          <p style={{ ...ZE, fontSize: 11, fontWeight: 700, color: '#111', letterSpacing: '0.06em', marginBottom: 12 }}>PROMO</p>
          {appliedDeal ? (
            <div className="flex items-center justify-between px-3 py-3 rounded-xl" style={{ background: 'rgba(230,253,83,0.1)', border: '1.5px solid rgba(230,253,83,0.4)' }}>
              <div className="flex items-center gap-2">
                <Tag size={14} color="#5a6e00" weight="fill" />
                <div>
                  <p style={{ ...ZN, fontWeight: 700, fontSize: 13, color: '#111' }}>{appliedDeal.name}</p>
                  <p style={{ ...ZN, fontSize: 11, color: '#5a6e00' }}>{discount > 0 ? `−${formatPrice(discount)}` : 'Applied'}</p>
                </div>
              </div>
              <button onClick={() => { setAppliedDeal(null); setPromoInput(''); setPromoError('') }}><X size={14} color="#888" /></button>
            </div>
          ) : promoOpen ? (
            <div className="flex gap-2">
              <input style={{ ...inputStyle, flex: 1 }} placeholder="Enter promo code"
                value={promoInput} onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoError('') }}
                onKeyDown={e => e.key === 'Enter' && applyPromoCode()} autoFocus />
              <button onClick={applyPromoCode} className="px-4 rounded-xl flex-shrink-0"
                style={{ background: '#111', ...ZN, fontWeight: 700, fontSize: 13, color: 'white' }}>Apply</button>
            </div>
          ) : (
            <button onClick={() => setPromoOpen(true)} className="flex items-center gap-2"
              style={{ ...ZN, fontWeight: 600, fontSize: 13, color: '#888' }}>
              <Tag size={14} color="#aaa" /> Have a promo code?
            </button>
          )}
          {promoError && <p style={{ ...ZN, fontSize: 12, color: '#ef4444', marginTop: 8 }}>{promoError}</p>}
        </div>

        {/* Payment */}
        <div className="p-4 rounded-2xl flex flex-col gap-3" style={{ background: 'white' }}>
          <p style={{ ...ZE, fontSize: 11, fontWeight: 700, color: '#111', letterSpacing: '0.06em' }}>PAYMENT</p>
          {[
            { id: 'delivery', icon: <Package size={18} weight="fill" />, label: 'Pay on Delivery', sub: 'Cash or transfer when you receive', disabled: false },
            { id: 'card', icon: <CreditCard size={18} weight="fill" />, label: 'Pay with Card / Transfer', sub: hasPaystackKey ? 'Secure online payment via Paystack' : 'Not available for this store yet', disabled: !hasPaystackKey },
          ].map(opt => (
            <button key={opt.id} onClick={() => !opt.disabled && setPaymentMethod(opt.id)}
              className="flex items-center gap-3 p-3 rounded-2xl text-left w-full"
              style={{ background: paymentMethod === opt.id ? 'rgba(230,253,83,0.08)' : '#f7f7f7', border: `2px solid ${paymentMethod === opt.id ? '#e6fd53' : 'transparent'}`, opacity: opt.disabled ? 0.45 : 1 }}>
              <div style={{ width: 18, height: 18, borderRadius: 99, flexShrink: 0, border: paymentMethod === opt.id ? '5px solid #111' : '2px solid #ccc' }} />
              <span style={{ color: paymentMethod === opt.id ? '#111' : '#bbb' }}>{opt.icon}</span>
              <div className="flex-1">
                <p style={{ ...ZN, fontSize: 14, fontWeight: 600, color: '#111' }}>{opt.label}</p>
                <p style={{ ...ZN, fontSize: 12, color: '#999' }}>{opt.sub}</p>
              </div>
            </button>
          ))}
          {paymentMethod === 'card' && !form.email.includes('@') && (
            <p style={{ ...ZN, fontSize: 12, color: '#f59e0b', paddingLeft: 4 }}>Enter your email above to pay with card.</p>
          )}
        </div>

        {/* Note */}
        <div className="p-4 rounded-2xl" style={{ background: 'white' }}>
          <p style={{ ...ZE, fontSize: 11, fontWeight: 700, color: '#111', letterSpacing: '0.06em', marginBottom: 12 }}>NOTE</p>
          <textarea rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Note to seller (optional)"
            value={form.note} onChange={e => set('note', e.target.value)} />
        </div>
      </div>

      {/* Fixed bottom */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-8" style={{ background: 'white', borderTop: '1px solid #eee', paddingTop: 12 }}>
        <div className="max-w-2xl mx-auto">
          <button onClick={() => setSummaryOpen(o => !o)}
            className="w-full flex items-center justify-between px-3 py-3 rounded-xl mb-3" style={{ background: '#f7f7f7' }}>
            <span style={{ ...ZN, fontSize: 13, color: '#555' }}>
              {cartItems.length > 0 ? `${cartItems.length} item${cartItems.length !== 1 ? 's' : ''} · ` : ''}{formatPrice(total)} total
            </span>
            <CaretDown size={14} color="#999" style={{ transform: summaryOpen ? 'rotate(180deg)' : 'none' }} />
          </button>
          {summaryOpen && (
            <div className="px-3 mb-3 flex flex-col gap-2">
              <div className="flex justify-between"><span style={{ ...ZN, fontSize: 13, color: '#999' }}>Items</span><span style={{ ...ZSC, fontSize: 13, fontWeight: 600, color: '#111' }}>{formatPrice(itemsTotal)}</span></div>
              <div className="flex justify-between"><span style={{ ...ZN, fontSize: 13, color: '#999' }}>Delivery</span><span style={{ ...ZSC, fontSize: 13, fontWeight: 600, color: '#111' }}>{effectiveDelivery === 0 ? 'Free' : formatPrice(effectiveDelivery)}</span></div>
              {discount > 0 && appliedDeal?.dealType !== 'free_ship' && (
                <div className="flex justify-between"><span style={{ ...ZN, fontSize: 13, color: '#5a6e00' }}>Discount</span><span style={{ ...ZSC, fontSize: 13, fontWeight: 600, color: '#5a6e00' }}>−{formatPrice(discount)}</span></div>
              )}
              <div className="flex justify-between pt-1" style={{ borderTop: '1px solid #eee' }}>
                <span style={{ ...ZN, fontSize: 13, fontWeight: 700, color: '#111' }}>Total</span>
                <span style={{ ...ZSC, fontSize: 14, fontWeight: 700, color: '#111' }}>{formatPrice(total)}</span>
              </div>
            </div>
          )}
          <p style={{ ...ZN, fontSize: 11, color: '#aaa', textAlign: 'center', marginBottom: 8, lineHeight: 1.5 }}>
            Your details are shared with the seller to fulfil your order.{' '}
            <a href="https://app.carts.ng/privacy.html" target="_blank" rel="noopener noreferrer" style={{ color: '#888', textDecoration: 'underline' }}>Privacy Policy</a>
          </p>
          {submitError && <p style={{ ...ZN, fontSize: 13, color: '#ef4444', textAlign: 'center', marginBottom: 8 }}>{submitError}</p>}
          <button onClick={handleSubmit} disabled={!canSubmit}
            className="w-full py-4 rounded-full flex items-center justify-center gap-2"
            style={{ background: canSubmit ? '#e6fd53' : 'rgba(230,253,83,0.3)', ...ZE, fontWeight: 700, fontSize: 16, color: '#060806', cursor: canSubmit ? 'pointer' : 'not-allowed' }}>
            {submitting && <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: '#060806', borderTopColor: 'transparent' }} />}
            {submitting ? 'Processing…' : paymentMethod === 'card' ? 'Continue to Payment →' : 'Place Order'}
          </button>
        </div>
      </div>
    </div>
  )
}
