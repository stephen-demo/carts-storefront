'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Heart, ShoppingBag, ChatCircle, CaretDown, ShareNetwork, MagnifyingGlass, Storefront } from '@phosphor-icons/react'
import { doc, getDoc, addDoc, setDoc, collection, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore'
import { db } from '../../../lib/firebase'
import { ZE, ZN, ZSC } from '../../../lib/styles'

const formatPrice = (amount) => `₦${Number(amount).toLocaleString('en-NG')}`

const COLOR_CSS = {
  black:'#111',white:'#f8f8f8',red:'#e53935',blue:'#1e88e5',green:'#43a047',
  yellow:'#fdd835',pink:'#e91e63',purple:'#8e24aa',orange:'#fb8c00',
  brown:'#6d4c41',grey:'#9e9e9e',gray:'#9e9e9e',navy:'#1a237e',cream:'#fff8e1',
  beige:'#d7ccc8',gold:'#ffc107',silver:'#bdbdbd',maroon:'#880e4f',
  khaki:'#c8b560',olive:'#808000',coral:'#ff7043',teal:'#00897b',
  mint:'#a5d6a7',lavender:'#ce93d8','sky blue':'#29b6f6','baby pink':'#f48fb1',
  multi:'#a78bfa',floral:'#f472b6',champagne:'#f5e6c8',sage:'#87a887',
  blush:'#f4a9b0',camel:'#c19a6b',nude:'#e8c9a0',burgundy:'#800020',
}

function cartKey(handle) { return `carts_cart_${handle}` }

export default function ProductDetailPage() {
  const { handle, productId } = useParams()
  const router = useRouter()

  const [product, setProduct]   = useState(null)
  const [storeUid, setStoreUid] = useState(null)
  const [storeName, setStoreName] = useState('')
  const [loading, setLoading]   = useState(true)
  const [saved, setSaved]       = useState(false)
  const [inCart, setInCart]     = useState(false)
  const [cartQty, setCartQty]   = useState(1)
  const [addAnim, setAddAnim]   = useState(false)
  const [qty, setQty]           = useState(1)
  const [selectedSize, setSelectedSize]   = useState(null)
  const [selectedColor, setSelectedColor] = useState(null)
  const [imgIndex, setImgIndex] = useState(0)
  const [showDesc, setShowDesc] = useState(false)
  const [question, setQuestion] = useState('')
  const [qaItems, setQaItems]   = useState([])
  const [qaSubmitting, setQaSubmitting] = useState(false)
  const [qaSubmitted, setQaSubmitted]   = useState(false)
  const [storeEmail, setStoreEmail] = useState('')
  const [startingChat, setStartingChat] = useState(false)
  const [showChatForm, setShowChatForm] = useState(false)
  const [chatName, setChatName] = useState('')
  const [chatEmail, setChatEmail] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const handleSnap = await getDoc(doc(db, 'handles', handle))
        if (!handleSnap.exists()) { setLoading(false); return }
        const uid = handleSnap.data().uid
        setStoreUid(uid)
        const [prodSnap, storeSnap, qaSnap] = await Promise.all([
          getDoc(doc(db, 'stores', uid, 'products', productId)),
          getDoc(doc(db, 'stores', uid)),
          getDocs(query(
            collection(db, 'stores', uid, 'qa'),
            where('productId', '==', productId),
            where('public', '==', true),
            where('answered', '==', true),
            orderBy('askedAt', 'desc')
          )).catch(() => ({ docs: [] })),
        ])
        if (storeSnap.exists()) {
          setStoreName(storeSnap.data().storeName || handle)
          setStoreEmail(storeSnap.data().email || '')
        }
        if (prodSnap.exists()) {
          setProduct({ id: prodSnap.id, ...prodSnap.data() })
          const savedIds = JSON.parse(localStorage.getItem(`carts_saved_${handle}`) || '[]')
          setSaved(savedIds.includes(prodSnap.id))
          const cart = JSON.parse(localStorage.getItem(cartKey(handle)) || '[]')
          setInCart(cart.some(i => i.productId === prodSnap.id))
        }
        setQaItems(qaSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch { /* offline */ }
      setLoading(false)
    }
    load()
  }, [handle, productId])

  const toggleSave = () => {
    const key = `carts_saved_${handle}`
    const ids = JSON.parse(localStorage.getItem(key) || '[]')
    const next = saved ? ids.filter(i => i !== productId) : [...ids, productId]
    localStorage.setItem(key, JSON.stringify(next))
    setSaved(!saved)
  }

  const addToCart = () => {
    const key = cartKey(handle)
    const cart = JSON.parse(localStorage.getItem(key) || '[]')
    const existingIdx = cart.findIndex(i => i.productId === productId && i.size === selectedSize && i.color === selectedColor)
    if (existingIdx >= 0) {
      cart[existingIdx].qty += qty
    } else {
      cart.push({ productId, name: product.name, price: product.price, image: product.images?.[0] || null, qty, size: selectedSize, color: selectedColor })
    }
    localStorage.setItem(key, JSON.stringify(cart))
    setCartQty(qty); setAddAnim(true)
    setTimeout(() => { setAddAnim(false); setInCart(true) }, 420)
  }

  const updateCartQty = (delta) => {
    const next = Math.max(1, Math.min(maxQty, cartQty + delta))
    setCartQty(next)
    const key = cartKey(handle)
    const cart = JSON.parse(localStorage.getItem(key) || '[]')
    const idx = cart.findIndex(i => i.productId === productId && i.size === selectedSize && i.color === selectedColor)
    if (idx >= 0) { cart[idx].qty = next; localStorage.setItem(key, JSON.stringify(cart)) }
  }

  const startChat = () => {
    if (!storeUid) return
    const existingChatId = localStorage.getItem(`carts_chat_${storeUid}`)
    if (existingChatId) { router.push(`/${handle}/saved`); return }
    setShowChatForm(true)
  }

  const submitChatForm = async () => {
    if (!chatName.trim() || !storeUid || startingChat) return
    setStartingChat(true)
    try {
      let buyerId = localStorage.getItem('carts_buyer_id')
      if (!buyerId) {
        buyerId = `b_${Math.random().toString(36).slice(2, 10)}`
        localStorage.setItem('carts_buyer_id', buyerId)
      }
      const firstName = chatName.trim().split(' ')[0]
      const chatRef = await addDoc(collection(db, 'stores', storeUid, 'chats'), {
        buyerId,
        buyerFirstName: firstName,
        buyerName: chatName.trim(),
        buyerEmail: chatEmail.trim().toLowerCase(),
        productId,
        productName: product?.name || '',
        createdAt: serverTimestamp(),
        lastMessage: '',
        lastMessageAt: serverTimestamp(),
        unread: true,
      })
      // Add to customer list so they appear in broadcasts
      await setDoc(doc(db, 'stores', storeUid, 'customers', buyerId), {
        name: chatName.trim(),
        email: chatEmail.trim().toLowerCase(),
        buyerId,
        source: 'chat',
        lastChat: serverTimestamp(),
        orderCount: 0,
        totalSpent: 0,
      }, { merge: true })
      // Notify seller of new chat
      if (storeEmail) {
        fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'merchant-message',
            merchantEmail: storeEmail,
            storeName,
            storeHandle: handle,
            chatId: chatRef.id,
            buyerFirstName: firstName,
            buyerEmail: chatEmail.trim().toLowerCase(),
            message: `${chatName.trim()} started a conversation about "${product?.name || 'a product'}".`,
          }),
        }).catch(() => {})
      }
      localStorage.setItem(`carts_chat_${storeUid}`, chatRef.id)
      router.push(`/${handle}/chat/${chatRef.id}`)
    } catch { setStartingChat(false) }
  }

  const submitQuestion = async () => {
    if (!question.trim() || !storeUid || qaSubmitting) return
    setQaSubmitting(true)
    try {
      await addDoc(collection(db, 'stores', storeUid, 'qa'), {
        productId, productName: product?.name || '',
        question: question.trim(), askedAt: serverTimestamp(),
        answered: false, public: true, buyerName: null,
      })
      setQuestion(''); setQaSubmitted(true)
    } catch { /* offline */ }
    setQaSubmitting(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#f5f5f5' }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#111', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6" style={{ background: '#f5f5f5' }}>
        <MagnifyingGlass size={48} weight="duotone" color="#bbb" />
        <p style={{ ...ZE, fontWeight: 700, fontSize: 18, color: '#111', textAlign: 'center' }}>Product not found</p>
        <button onClick={() => router.push(`/${handle}`)} className="px-6 py-3 rounded-full"
          style={{ background: '#111', ...ZN, fontWeight: 700, fontSize: 14, color: 'white' }}>
          Visit Store
        </button>
      </div>
    )
  }

  const images = product.images?.length > 0 ? product.images : [null]
  const recolourCss = selectedColor ? (COLOR_CSS[selectedColor.toLowerCase()] ?? null) : null
  const maxQty = product.stock > 0 ? product.stock : 0

  return (
    <div className="min-h-screen" style={{ background: '#f5f5f5' }}>
      {/* Top nav bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3"
        style={{ background: 'white', borderBottom: '1px solid #eee' }}>
        <button onClick={() => router.push(`/${handle}`)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full"
          style={{ background: '#f0f0f0' }}>
          <Storefront size={14} weight="fill" color="#111" />
          <span style={{ ...ZN, fontWeight: 600, fontSize: 12, color: '#111' }}>
            {storeName || handle}
          </span>
        </button>
        <div className="flex items-center gap-2">
          <button onClick={toggleSave} className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: '#f0f0f0' }}>
            <Heart size={16} weight={saved ? 'fill' : 'regular'} color={saved ? '#ef4444' : '#111'} />
          </button>
        </div>
      </div>

      {/* ── Desktop: two-column layout ── */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 md:py-8">
        <div className="md:grid md:grid-cols-2 md:gap-12">

          {/* LEFT: image gallery */}
          <div>
            {/* Main image */}
            <div className="relative overflow-hidden md:rounded-3xl"
              style={{ aspectRatio: '3/4', background: recolourCss ?? '#e5e7eb' }}>
              {images[imgIndex]
                ? <img src={images[imgIndex]} alt={product.name} className="w-full h-full object-cover"
                    style={{ mixBlendMode: recolourCss ? 'multiply' : 'normal' }} />
                : <div className="w-full h-full flex items-center justify-center"><span style={{ ...ZN, fontSize: 14, color: '#bbb' }}>{product.name}</span></div>}
              {product.discount > 0 && (
                <span className="absolute bottom-4 left-4 px-3 py-1 rounded-full text-xs font-bold" style={{ background: '#ef4444', color: 'white' }}>-{product.discount}% OFF</span>
              )}
              {recolourCss && (
                <div className="absolute bottom-4 right-4 px-2.5 py-1 rounded-full" style={{ background: 'rgba(0,0,0,0.45)' }}>
                  <span style={{ ...ZN, fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>Colour preview</span>
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="flex gap-2 mt-3 px-4 md:px-0">
                {images.map((im, i) => (
                  <button key={i} onClick={() => setImgIndex(i)} className="rounded-xl overflow-hidden flex-shrink-0"
                    style={{ width: 56, height: 56, background: '#e0e0e0', border: i === imgIndex ? '2px solid #111' : '2px solid transparent' }}>
                    {im && <img src={im} alt="" className="w-full h-full object-cover" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: product info */}
          <div className="px-4 md:px-0 pt-4 md:pt-0 pb-32 md:pb-8">
            {/* Category + badges */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {product.category && (
                <span style={{ ...ZN, fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {product.category}{product.gender ? ` · ${product.gender}` : ''}
                </span>
              )}
              {product.isReplica && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: '#f0f0f0', color: '#555' }}>Replica</span>
              )}
            </div>

            <h1 style={{ ...ZE, fontWeight: 700, fontSize: 22, color: '#111', lineHeight: 1.3 }}>{product.name}</h1>
            {product.brand && <p style={{ ...ZN, fontSize: 13, color: '#999', marginTop: 2 }}>{product.brand}</p>}

            <div className="flex items-baseline gap-3 mt-3">
              <p style={{ ...ZSC, fontWeight: 800, fontSize: 26, color: '#111' }}>{formatPrice(product.price)}</p>
            </div>

            <p className="mt-1" style={{ ...ZN, fontSize: 12, fontWeight: 600,
              color: product.stock > 3 ? '#22c55e' : product.stock > 0 ? '#f59e0b' : '#ef4444' }}>
              {product.stock > 3 ? 'In Stock' : product.stock > 0 ? `Only ${product.stock} left!` : 'Out of Stock'}
            </p>

            {/* Colors */}
            {product.colors?.length > 0 && (
              <div className="mt-5">
                <p style={{ ...ZN, fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                  Colour{selectedColor ? ` · ${selectedColor}` : ''}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {product.colors.map((c, i) => {
                    const css = COLOR_CSS[c.toLowerCase()] ?? '#ccc'
                    const isSelected = selectedColor === c
                    return (
                      <button key={i} onClick={() => setSelectedColor(isSelected ? null : c)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                        style={{ background: isSelected ? '#111' : '#f0f0f0', border: isSelected ? '1.5px solid #111' : '1.5px solid #e0e0e0' }}>
                        <span className="inline-block rounded-full" style={{ width: 12, height: 12, background: css, border: '1px solid rgba(0,0,0,0.12)' }} />
                        <span style={{ ...ZN, fontSize: 12, color: isSelected ? 'white' : '#444' }}>{c}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Sizes */}
            {product.attrs?.sizes?.length > 0 && (
              <div className="mt-5">
                <p style={{ ...ZN, fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Size</p>
                <div className="flex flex-wrap gap-2">
                  {product.attrs.sizes.map(size => (
                    <button key={size} onClick={() => setSelectedSize(size)} className="rounded-xl"
                      style={{ ...ZN, padding: '8px 14px', background: selectedSize === size ? '#111' : '#f0f0f0',
                        color: selectedSize === size ? '#fff' : '#555',
                        border: selectedSize === size ? '1px solid #111' : '1px solid transparent' }}>
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            {!inCart && product.stock > 0 && (
              <div className="mt-5 flex items-center justify-between">
                <p style={{ ...ZN, fontSize: 13, fontWeight: 600, color: '#111' }}>Quantity</p>
                <div className="flex items-center gap-0 rounded-2xl overflow-hidden" style={{ border: '1.5px solid #e0e0e0' }}>
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center" style={{ background: qty <= 1 ? '#f5f5f5' : 'white' }}>
                    <span style={{ ...ZN, fontSize: 18, color: qty <= 1 ? '#ccc' : '#111', lineHeight: 1 }}>−</span>
                  </button>
                  <span className="w-10 text-center" style={{ ...ZN, fontWeight: 700, fontSize: 15, color: '#111' }}>{qty}</span>
                  <button onClick={() => setQty(q => Math.min(maxQty, q + 1))} className="w-10 h-10 flex items-center justify-center" style={{ background: qty >= maxQty ? '#f5f5f5' : 'white' }}>
                    <span style={{ ...ZN, fontSize: 18, color: qty >= maxQty ? '#ccc' : '#111', lineHeight: 1 }}>+</span>
                  </button>
                </div>
              </div>
            )}

            {/* CTA buttons — desktop */}
            <div className="hidden md:flex gap-3 mt-6">
              <button onClick={startChat} disabled={startingChat}
                className="flex items-center gap-2 px-5 py-3.5 rounded-2xl font-semibold"
                style={{ ...ZN, background: '#f0f0f0', color: '#333' }}>
                {startingChat ? <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: '#333', borderTopColor: 'transparent' }} /> : <ChatCircle size={18} weight="fill" />}
                Chat
              </button>
              {!inCart && !addAnim && product.stock > 0 && (
                <button onClick={addToCart} className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl"
                  style={{ ...ZN, background: '#111', fontWeight: 700, fontSize: 14, color: 'white' }}>
                  <ShoppingBag size={18} weight="fill" /> Add to Cart
                </button>
              )}
              {addAnim && <div className="flex-1 flex items-center justify-center py-3.5 rounded-2xl" style={{ background: '#22c55e' }}><span style={{ ...ZE, fontWeight: 700, fontSize: 14, color: 'white' }}>✓ Added!</span></div>}
              {product.stock === 0 && <div className="flex-1 flex items-center justify-center py-3.5 rounded-2xl" style={{ background: '#e5e5e5' }}><span style={{ ...ZN, fontSize: 14, color: '#bbb' }}>Out of Stock</span></div>}
              {inCart && !addAnim && (
                <div className="flex-1 flex gap-2">
                  <div className="flex items-center rounded-2xl overflow-hidden" style={{ background: '#f0f0f0', border: '1.5px solid #e0e0e0' }}>
                    <button onClick={() => updateCartQty(-1)} className="w-10 h-full flex items-center justify-center" style={{ color: cartQty <= 1 ? '#ccc' : '#111' }}><span style={{ fontSize: 18, lineHeight: 1 }}>−</span></button>
                    <span className="w-8 text-center" style={{ ...ZN, fontWeight: 700, fontSize: 15, color: '#111' }}>{cartQty}</span>
                    <button onClick={() => updateCartQty(1)} className="w-10 h-full flex items-center justify-center" style={{ color: cartQty >= maxQty ? '#ccc' : '#111' }}><span style={{ fontSize: 18, lineHeight: 1 }}>+</span></button>
                  </div>
                  <button onClick={() => router.push(`/${handle}/cart`)} className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl"
                    style={{ ...ZN, background: '#111', fontWeight: 700, fontSize: 14, color: 'white' }}>
                    <ShoppingBag size={16} weight="fill" /> Go to Cart
                  </button>
                </div>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="mt-6 rounded-3xl bg-white overflow-hidden">
                <button onClick={() => setShowDesc(d => !d)} className="flex items-center w-full px-5 py-4">
                  <p style={{ ...ZN, fontWeight: 700, fontSize: 13, color: '#111', flex: 1 }}>Description</p>
                  <CaretDown size={14} weight="bold" color="#666" style={{ transform: showDesc ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
                {showDesc && (
                  <div className="px-5 pb-5">
                    <p style={{ ...ZN, fontSize: 13, color: '#555', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{product.description}</p>
                  </div>
                )}
              </div>
            )}

            {/* Q&A */}
            <div className="mt-4 rounded-3xl bg-white p-5">
              <p style={{ ...ZN, fontWeight: 700, fontSize: 13, color: '#111', marginBottom: 12 }}>Questions & Answers</p>
              {qaItems.length > 0 && (
                <div className="flex flex-col gap-4 mb-5">
                  {qaItems.map(qa => (
                    <div key={qa.id}>
                      <div className="flex gap-2 mb-1.5">
                        <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5"><span style={{ fontSize: 10 }}>Q</span></div>
                        <p style={{ ...ZN, fontSize: 13, color: '#555', lineHeight: 1.55 }}>{qa.question}</p>
                      </div>
                      <div className="flex gap-2 pl-1">
                        <div className="w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0 mt-0.5"><span style={{ fontSize: 10, color: 'white' }}>A</span></div>
                        <p style={{ ...ZN, fontSize: 13, fontWeight: 600, color: '#111', lineHeight: 1.55 }}>{qa.answer}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {qaSubmitted ? (
                <p style={{ ...ZN, fontSize: 13, color: '#22c55e', fontWeight: 600 }}>✓ Question submitted! The seller will answer soon.</p>
              ) : (
                <div className="flex gap-2">
                  <input className="flex-1 rounded-xl px-4 py-2.5 outline-none"
                    style={{ ...ZN, fontSize: 13, background: '#f5f5f5', color: '#111', border: '1px solid #e8e8e8' }}
                    placeholder="Ask the store a question…"
                    value={question} onChange={e => setQuestion(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && question.trim()) submitQuestion() }} />
                  <button onClick={submitQuestion} disabled={!question.trim() || qaSubmitting}
                    className="px-4 py-2.5 rounded-xl"
                    style={{ ...ZN, fontWeight: 700, fontSize: 13, background: question.trim() ? '#111' : '#e0e0e0', color: question.trim() ? 'white' : '#aaa' }}>
                    {qaSubmitting ? '…' : 'Ask'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Pre-chat form modal ── */}
      {showChatForm && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setShowChatForm(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl px-5 pt-5 pb-10 max-w-lg mx-auto"
            style={{ background: 'white', boxShadow: '0 -4px 32px rgba(0,0,0,0.12)' }}>
            <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-5" />
            <p style={{ ...ZE, fontWeight: 700, fontSize: 20, color: '#111', marginBottom: 4 }}>Say hello 👋</p>
            <p style={{ ...ZN, fontSize: 14, color: '#888', marginBottom: 20 }}>
              Let the seller know who you are so they can reply.
            </p>
            <div className="flex flex-col gap-4 mb-5">
              <div>
                <label style={{ ...ZN, fontSize: 11, fontWeight: 700, color: '#999', letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                  Your name
                </label>
                <input
                  className="w-full rounded-2xl px-4 py-3.5 outline-none"
                  style={{ ...ZN, fontSize: 15, background: '#f5f5f5', color: '#111', border: '1.5px solid #e8e8e8' }}
                  placeholder="e.g. Amaka"
                  value={chatName}
                  onChange={e => setChatName(e.target.value)}
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter' && chatName.trim()) submitChatForm() }}
                />
              </div>
              <div>
                <label style={{ ...ZN, fontSize: 11, fontWeight: 700, color: '#999', letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                  Email (optional — get reply by email too)
                </label>
                <input
                  className="w-full rounded-2xl px-4 py-3.5 outline-none"
                  type="email"
                  style={{ ...ZN, fontSize: 15, background: '#f5f5f5', color: '#111', border: '1.5px solid #e8e8e8' }}
                  placeholder="your@email.com"
                  value={chatEmail}
                  onChange={e => setChatEmail(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && chatName.trim()) submitChatForm() }}
                />
              </div>
            </div>
            <button
              onClick={submitChatForm}
              disabled={!chatName.trim() || startingChat}
              className="w-full py-4 rounded-2xl flex items-center justify-center gap-2"
              style={{ ...ZN, fontWeight: 700, fontSize: 15, background: chatName.trim() ? '#111' : '#e0e0e0', color: chatName.trim() ? 'white' : '#aaa' }}
            >
              {startingChat
                ? <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
                : 'Start Chat'}
            </button>
          </div>
        </>
      )}

      {/* ── Mobile: fixed bottom CTA ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 px-4 py-4 flex gap-3"
        style={{ background: 'white', borderTop: '1px solid #eee' }}>
        <button onClick={startChat} disabled={startingChat}
          className="flex items-center gap-2 px-4 py-3.5 rounded-2xl font-semibold text-sm flex-shrink-0"
          style={{ ...ZN, background: '#f0f0f0', color: '#333' }}>
          {startingChat ? <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: '#333', borderTopColor: 'transparent' }} /> : <ChatCircle size={18} weight="fill" />}
          Chat
        </button>
        {!inCart && !addAnim && product.stock > 0 && (
          <button onClick={addToCart} className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl"
            style={{ ...ZN, background: '#111', fontWeight: 700, fontSize: 14, color: 'white' }}>
            <ShoppingBag size={18} weight="fill" /> Add to Cart
          </button>
        )}
        {addAnim && <div className="flex-1 flex items-center justify-center py-3.5 rounded-2xl" style={{ background: '#22c55e' }}><span style={{ ...ZE, fontWeight: 700, fontSize: 14, color: 'white' }}>✓ Added!</span></div>}
        {product.stock === 0 && <div className="flex-1 flex items-center justify-center py-3.5 rounded-2xl" style={{ background: '#e5e5e5' }}><span style={{ ...ZN, fontSize: 14, color: '#bbb' }}>Out of Stock</span></div>}
        {inCart && !addAnim && (
          <div className="flex-1 flex gap-2">
            <div className="flex items-center rounded-2xl overflow-hidden" style={{ background: '#f0f0f0', border: '1.5px solid #e0e0e0' }}>
              <button onClick={() => updateCartQty(-1)} className="w-10 h-full flex items-center justify-center"><span style={{ fontSize: 18, lineHeight: 1, color: cartQty <= 1 ? '#ccc' : '#111' }}>−</span></button>
              <span className="w-8 text-center" style={{ ...ZN, fontWeight: 700, fontSize: 15, color: '#111' }}>{cartQty}</span>
              <button onClick={() => updateCartQty(1)} className="w-10 h-full flex items-center justify-center"><span style={{ fontSize: 18, lineHeight: 1, color: cartQty >= maxQty ? '#ccc' : '#111' }}>+</span></button>
            </div>
            <button onClick={() => router.push(`/${handle}/cart`)} className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl"
              style={{ ...ZN, background: '#111', fontWeight: 700, fontSize: 14, color: 'white' }}>
              <ShoppingBag size={16} weight="fill" /> Go to Cart
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
