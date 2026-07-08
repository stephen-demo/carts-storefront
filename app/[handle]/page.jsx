'use client'
import { useState, useRef, useEffect, createContext, useContext } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MagnifyingGlass, ShoppingBag, Heart, X, PaperPlaneTilt } from '@phosphor-icons/react'
import { doc, getDoc, setDoc, collection, getDocs, addDoc, updateDoc, serverTimestamp, query, where } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { BannerPreview } from '../../components/BannerTemplates'
import { getTheme, FONT_LOOKUP, fontCss, fontGoogleUrl } from '../../lib/vibes'
import { ZE, ZN, ZSC } from '../../lib/styles'

const formatPrice = (n) => `₦${Number(n).toLocaleString('en-NG')}`
const ThemeCtx = createContext(getTheme('clean'))

function filterProducts(products, criteria, category, count, search, activeFilter) {
  let items = products.filter(p => p.active !== false)
  if (search) items = items.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()))
  if (criteria === 'new') {
    items = [...items].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
  } else if (criteria === 'cat' && category) {
    items = items.filter(p => p.category === category)
  } else if (criteria === 'all' && activeFilter) {
    items = items.filter(p => p.category === activeFilter)
  }
  return items.slice(0, count || 6)
}

export default function StorePage() {
  const { handle } = useParams()
  const router = useRouter()

  const [store, setStore]           = useState(null)
  const [storeUid, setStoreUid]     = useState(null)
  const [products, setProducts]     = useState([])
  const [pageBlocks, setPageBlocks] = useState([])
  const [loading, setLoading]       = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  const [activeFilter, setActiveFilter]     = useState(null)
  const [search, setSearch]         = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [cart, setCart]             = useState([])
  const [saved, setSaved]           = useState([])

  const [chatText, setChatText]           = useState('')
  const [showBuyerSheet, setShowBuyerSheet] = useState(false)
  const [buyerInfo, setBuyerInfo]         = useState({ firstName: '', email: '' })
  const [chatId, setChatId]               = useState(null)
  const [chatSent, setChatSent]           = useState(false)
  const [chatSending, setChatSending]     = useState(false)
  const [chatError, setChatError]         = useState(false)
  const chatInputRef = useRef(null)

  useEffect(() => {
    async function load() {
      try {
        // If slug is exactly 4 alpha chars, check product_codes first
        if (/^[A-Za-z]{4}$/.test(handle)) {
          const code     = handle.toUpperCase()
          const codeSnap = await getDoc(doc(db, 'product_codes', code))
          if (codeSnap.exists()) {
            const { storeId, productId } = codeSnap.data()
            const storeSnap = await getDoc(doc(db, 'stores', storeId))
            if (storeSnap.exists()) {
              router.replace(`/${storeSnap.data().handle}/${productId}`)
              return
            }
          }
        }

        let uid = null
        const handleSnap = await getDoc(doc(db, 'handles', handle))
        if (handleSnap.exists()) {
          uid = handleSnap.data().uid
        } else {
          const storesQ = await getDocs(query(collection(db, 'stores'), where('handle', '==', handle)))
          if (!storesQ.empty) {
            uid = storesQ.docs[0].id
            setDoc(doc(db, 'handles', handle), { uid }).catch(() => {})
          }
        }
        if (!uid) { setLoading(false); return }
        setStoreUid(uid)
        const [storeSnap, prodSnap, blocksSnap] = await Promise.all([
          getDoc(doc(db, 'stores', uid)),
          getDocs(collection(db, 'stores', uid, 'products')),
          getDoc(doc(db, 'stores', uid, 'pageBlocks', 'home')),
        ])
        if (storeSnap.exists()) setStore(storeSnap.data())
        setProducts(prodSnap.docs.map(d => ({ id: d.id, ...d.data() })))
        if (blocksSnap.exists() && blocksSnap.data().blocks?.length) {
          setPageBlocks(blocksSnap.data().blocks)
        }
      } catch (err) {
        console.error('[Storefront] load error:', err)
      }
      setLoading(false)
    }
    load()
  }, [handle])

  useEffect(() => {
    if (storeUid) {
      const savedChat = localStorage.getItem(`carts_chat_${storeUid}`)
      if (savedChat) setChatId(savedChat)
    }
    const savedIds = JSON.parse(localStorage.getItem(`carts_saved_${handle}`) || '[]')
    if (savedIds.length) setSaved(savedIds)
    const cartIds = JSON.parse(localStorage.getItem(`carts_cart_${handle}`) || '[]')
    setCart(cartIds.map ? cartIds.map(i => i.productId || i).filter(Boolean) : [])
  }, [storeUid, handle])

  const allActive   = products.filter(p => p.active !== false)
  const categories  = ['All', ...Array.from(new Set(allActive.map(p => p.category).filter(Boolean)))]
  const saleItems   = allActive.filter(p => p.discount > 0)
  const showingAll  = activeCategory === 'All' && !search

  const filtered = allActive.filter(p => {
    const matchCat    = activeCategory === 'All' || p.category === activeCategory
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const toggleSave = id => {
    const key = `carts_saved_${handle}`
    setSaved(prev => {
      const next = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      localStorage.setItem(key, JSON.stringify(next))
      return next
    })
  }

  const addToCart = id => {
    const key = `carts_cart_${handle}`
    const existing = JSON.parse(localStorage.getItem(key) || '[]')
    if (!existing.some(i => i.productId === id)) {
      const p = products.find(p => p.id === id)
      existing.push({ productId: id, name: p?.name, price: p?.price, image: p?.images?.[0] || null, qty: 1 })
      localStorage.setItem(key, JSON.stringify(existing))
    }
    setCart(prev => prev.includes(id) ? prev : [...prev, id])
  }

  const cardProps = (p) => ({
    product: p,
    isSaved: saved.includes(p.id),
    inCart: cart.includes(p.id),
    onSave: () => toggleSave(p.id),
    onCart: () => addToCart(p.id),
    onClick: () => router.push(`/${handle}/${p.id}`),
  })

  const handleSendAttempt = () => {
    if (!chatText.trim() || !storeUid) return
    if (chatId) sendToExistingThread()
    else setShowBuyerSheet(true)
  }

  const sendToExistingThread = async () => {
    const msg = chatText.trim()
    if (!msg || !chatId) return
    setChatSending(true); setChatError(false)
    try {
      await addDoc(collection(db, 'stores', storeUid, 'chats', chatId, 'messages'), {
        text: msg, from: 'buyer', createdAt: serverTimestamp(),
      })
      await updateDoc(doc(db, 'stores', storeUid, 'chats', chatId), {
        lastMessage: msg, lastMessageAt: serverTimestamp(), unread: true,
      })
      setChatText(''); setChatSent(true)
      setTimeout(() => setChatSent(false), 3000)
    } catch { setChatError(true) }
    setChatSending(false)
  }

  const handleBuyerSubmit = async () => {
    const firstName = buyerInfo.firstName.trim()
    const email = buyerInfo.email.trim()
    if (!firstName || !email || !chatText.trim()) return
    const msg = chatText.trim()
    setShowBuyerSheet(false); setChatSending(true)
    try {
      const chatRef = await addDoc(collection(db, 'stores', storeUid, 'chats'), {
        buyerFirstName: firstName, buyerEmail: email,
        createdAt: serverTimestamp(), lastMessage: msg,
        lastMessageAt: serverTimestamp(), unread: true,
      })
      await addDoc(collection(db, 'stores', storeUid, 'chats', chatRef.id, 'messages'), {
        text: msg, from: 'buyer', createdAt: serverTimestamp(),
      })
      localStorage.setItem(`carts_chat_${storeUid}`, chatRef.id)
      setChatId(chatRef.id); setChatText('')
      setChatSent(true); setTimeout(() => setChatSent(false), 6000)
      if (store?.email) {
        fetch('https://app.carts.ng/api/notify', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'merchant-message', merchantEmail: store.email,
            storeName: store.storeName, storeHandle: handle,
            chatId: chatRef.id, buyerFirstName: firstName,
            buyerEmail: email, message: msg,
          }),
        }).catch(() => {})
      }
    } catch { setChatError(true) }
    setChatSending(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#f5f5f5' }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#111', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (!store) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center" style={{ background: '#f5f5f5' }}>
        <p style={{ ...ZE, fontWeight: 700, fontSize: 20, color: '#111' }}>Store not found</p>
        <p style={{ ...ZN, fontSize: 14, color: '#999', marginTop: 8 }}>carts.ng/{handle} doesn&apos;t exist yet.</p>
      </div>
    )
  }

  const hasBlocks = pageBlocks.length > 0
  const baseTheme = getTheme(store.theme)
  const selectedFont = store.storeFont ? FONT_LOOKUP[store.storeFont] : null
  const headingFont  = selectedFont ? fontCss(selectedFont) : null
  const theme = headingFont ? {
    ...baseTheme, headingFont,
    header:  { ...baseTheme.header, nameFont: headingFont },
    section: { ...baseTheme.section, font: headingFont },
    card:    { ...baseTheme.card, nameFont: headingFont },
  } : { ...baseTheme, headingFont: baseTheme.header.nameFont }

  const cartItemCount = JSON.parse(localStorage.getItem(`carts_cart_${handle}`) || '[]').length

  return (
    <ThemeCtx.Provider value={theme}>
      <div style={{ minHeight: '100vh', background: theme.bg }}>
        {selectedFont && <link rel="stylesheet" href={fontGoogleUrl(selectedFont)} />}
        <style>{`@keyframes sfTicker{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>

        {/* ── Desktop header ── */}
        <header className="sticky top-0 z-20"
          style={{ background: theme.header.bg, borderBottom: `1px solid ${theme.header.border}` }}>
          <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center gap-4 py-3">
            <h1 className="flex-1" style={{ fontFamily: theme.header.nameFont, fontWeight: theme.header.nameWeight, fontSize: theme.header.nameFontSize, color: theme.header.text, letterSpacing: '0.02em' }}>
              {store.storeName?.toUpperCase()}
            </h1>

            {/* Desktop: inline search */}
            <div className="hidden md:flex items-center gap-2 rounded-full px-4 py-2"
              style={{ background: theme.search.bg, border: `1px solid ${theme.search.border}`, minWidth: 240 }}>
              <MagnifyingGlass size={14} color={theme.search.iconColor} />
              <input className="bg-transparent text-sm outline-none flex-1"
                placeholder="Search products…"
                value={search} onChange={e => setSearch(e.target.value)}
                style={{ ...ZN, color: theme.search.text }} />
              {search && <button onClick={() => setSearch('')}><X size={12} color={theme.search.iconColor} /></button>}
            </div>

            {/* Category tabs — desktop only */}
            <div className="hidden lg:flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {categories.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className="px-3 py-1.5 rounded-full text-sm"
                  style={{ fontFamily: theme.section.font, fontWeight: activeCategory === cat ? 700 : 500,
                    background: activeCategory === cat ? theme.tab.activeBg : theme.tab.bg,
                    color: activeCategory === cat ? theme.tab.activeText : theme.tab.text,
                    whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {cat}
                </button>
              ))}
            </div>

            {/* Icon buttons */}
            <div className="flex items-center gap-2">
              <button onClick={() => setShowSearch(s => !s)} className="md:hidden w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: theme.header.iconBg }}>
                <MagnifyingGlass size={16} weight="bold" color={theme.header.text} />
              </button>
              <button onClick={() => router.push(`/${handle}/saved`)} className="relative w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: theme.header.iconBg }}>
                <Heart size={16} weight={saved.length ? 'fill' : 'regular'} color={saved.length ? '#ef4444' : theme.header.text} />
                {saved.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#ef4444', fontSize: 9, fontWeight: 700, color: 'white' }}>{saved.length > 9 ? '9+' : saved.length}</span>}
              </button>
              <button onClick={() => router.push(`/${handle}/cart`)} className="relative w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: theme.header.iconBg }}>
                <ShoppingBag size={16} weight={cartItemCount > 0 ? 'fill' : 'regular'} color={theme.header.text} />
                {cartItemCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#111', fontSize: 9, fontWeight: 700, color: 'white' }}>{cartItemCount > 9 ? '9+' : cartItemCount}</span>}
              </button>
            </div>
          </div>

          {/* Mobile search bar */}
          {showSearch && (
            <div className="md:hidden flex gap-2 items-center px-4 py-3"
              style={{ background: theme.header.bg, borderBottom: `1px solid ${theme.header.border}` }}>
              <div className="flex-1 flex items-center gap-2 rounded-full px-4 py-2.5"
                style={{ background: theme.search.bg, border: `1px solid ${theme.search.border}` }}>
                <MagnifyingGlass size={14} color={theme.search.iconColor} />
                <input autoFocus className="bg-transparent text-sm outline-none w-full"
                  placeholder="Search products…"
                  value={search} onChange={e => setSearch(e.target.value)}
                  style={{ ...ZN, color: theme.search.text }} />
                {search && <button onClick={() => setSearch('')}><X size={14} color={theme.search.iconColor} /></button>}
              </div>
              <button onClick={() => { setShowSearch(false); setSearch('') }}
                style={{ ...ZN, fontSize: 13, fontWeight: 600, color: theme.header.text }}>
                Cancel
              </button>
            </div>
          )}

          {/* Mobile category tabs */}
          <div className="lg:hidden flex gap-2 px-4 py-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className="px-4 py-1.5 rounded-full text-sm"
                style={{ fontFamily: theme.section.font, fontWeight: activeCategory === cat ? 700 : 500,
                  background: activeCategory === cat ? theme.tab.activeBg : theme.tab.bg,
                  color: activeCategory === cat ? theme.tab.activeText : theme.tab.text,
                  whiteSpace: 'nowrap', flexShrink: 0 }}>
                {cat}
              </button>
            ))}
          </div>
        </header>

        {/* ── Main content ── */}
        <main className="max-w-7xl mx-auto px-4 md:px-8 pb-32 md:pb-16">
          {hasBlocks && !search ? (
            <div>
              {pageBlocks.map(block => (
                <BlockRenderer key={block.id} block={block} products={allActive} categories={categories}
                  router={router} handle={handle} saved={saved} cart={cart} cardProps={cardProps}
                  activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
              ))}
            </div>
          ) : (
            <>
              {showingAll && !hasBlocks && (
                <div className="mt-6 rounded-3xl overflow-hidden relative"
                  style={{ height: 220, background: 'linear-gradient(135deg, #1c1c1e 0%, #2a2a2e 60%, #111 100%)' }}>
                  <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full" style={{ background: 'rgba(230,253,83,0.12)' }} />
                  <div className="absolute -bottom-14 -left-8 w-56 h-56 rounded-full" style={{ background: 'rgba(230,253,83,0.07)' }} />
                  <div className="absolute inset-0 p-6 flex flex-col justify-end">
                    <span style={{ ...ZN, fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{store.storeName}</span>
                    <h2 style={{ ...ZE, fontWeight: 800, fontSize: 26, color: 'white', marginTop: 4, lineHeight: 1.2 }}>Welcome to our store</h2>
                  </div>
                </div>
              )}

              {showingAll && saleItems.length > 0 && (
                <section className="mt-8">
                  <div className="flex items-center gap-2 mb-4">
                    <h2 style={{ fontFamily: theme.section.font, fontWeight: theme.section.weight, fontSize: 16, color: theme.section.color }}>Flash Deals</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: '#ef4444', color: 'white' }}>SALE</span>
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                    {saleItems.map(p => <ProductCard key={p.id} compact {...cardProps(p)} />)}
                  </div>
                </section>
              )}

              <section className="mt-8">
                {!showingAll && (
                  <p className="mb-4" style={{ fontFamily: theme.section.font, fontSize: 13, color: theme.section.subColor }}>
                    {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
                    {activeCategory !== 'All' ? ` in ${activeCategory}` : ''}
                    {search ? ` for "${search}"` : ''}
                  </p>
                )}
                {showingAll && (
                  <div className="flex items-center mb-4">
                    <h2 className="flex-1" style={{ fontFamily: theme.section.font, fontWeight: theme.section.weight, fontSize: 16, color: theme.section.color }}>All Products</h2>
                    <span style={{ fontFamily: theme.section.font, fontSize: 12, color: theme.section.subColor }}>{allActive.length} items</span>
                  </div>
                )}
                {(showingAll ? allActive : filtered).length === 0 ? (
                  <div className="text-center py-16 px-6">
                    <p style={{ fontFamily: theme.section.font, fontSize: 14, color: theme.section.subColor }}>No products found</p>
                    {(search || activeCategory !== 'All') && (
                      <button className="mt-3 text-sm font-semibold" style={{ color: theme.section.color }}
                        onClick={() => { setSearch(''); setActiveCategory('All') }}>
                        Clear filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {(showingAll ? allActive : filtered).map(p => <ProductCard key={p.id} {...cardProps(p)} />)}
                  </div>
                )}
              </section>
            </>
          )}
        </main>

        {/* ── Bottom chat bar — mobile only ── */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50"
          style={{ background: theme.bottom.bg, borderTop: `1px solid ${theme.bottom.border}` }}>
          {chatError && (
            <div className="flex items-center gap-2 px-4 py-2" style={{ background: '#ef4444' }}>
              <p style={{ ...ZN, fontSize: 12, color: 'white', flex: 1 }}>Couldn&apos;t send — check your connection.</p>
              <button onClick={() => setChatError(false)} style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>✕</button>
            </div>
          )}
          {chatSent && (
            <div className="flex items-center gap-2 px-4 py-2" style={{ background: '#111' }}>
              <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#4ade80' }}>
                <span style={{ color: '#111', fontSize: 9, fontWeight: 900 }}>✓</span>
              </div>
              <p style={{ ...ZN, fontSize: 12, color: 'white', flex: 1 }}>
                Sent! <span style={{ color: 'rgba(255,255,255,0.5)' }}>{store.storeName} will reply soon.</span>
              </p>
              {chatId && <button onClick={() => router.push(`/${handle}/saved`)} style={{ ...ZN, fontSize: 11, fontWeight: 700, color: '#e6fd53' }}>View →</button>}
            </div>
          )}
          <div className="flex items-center gap-3 px-4 py-3">
            <button onClick={() => router.push(`/${handle}/saved`)} className="relative flex-shrink-0">
              <Heart size={22} weight={saved.length ? 'fill' : 'regular'} color={saved.length ? '#ef4444' : theme.bottom.iconColor} />
              {saved.length > 0 && <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#ef4444', fontSize: 9, fontWeight: 700, color: 'white' }}>{saved.length > 9 ? '9+' : saved.length}</span>}
            </button>
            <div className="flex-1 flex items-center rounded-full gap-2 px-4" style={{ background: theme.bottom.inputBg, border: `1px solid ${theme.bottom.inputBorder}`, height: 42 }}>
              <input ref={chatInputRef} className="flex-1 bg-transparent outline-none text-sm"
                style={{ ...ZN, color: theme.bottom.textColor, fontSize: 13 }}
                placeholder={`Message ${store.storeName}…`}
                value={chatText} onChange={e => setChatText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && chatText.trim()) handleSendAttempt() }} />
              {chatText.trim() && (
                <button onClick={handleSendAttempt} disabled={chatSending} className="flex-shrink-0">
                  <PaperPlaneTilt size={16} weight="fill" color={chatSending ? '#ccc' : '#111'} />
                </button>
              )}
            </div>
            <button onClick={() => router.push(`/${handle}/cart`)} className="relative flex-shrink-0">
              <ShoppingBag size={22} weight={cart.length ? 'fill' : 'regular'} color={cart.length ? theme.bottom.textColor : theme.bottom.iconColor} />
              {cart.length > 0 && <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#111', fontSize: 9, fontWeight: 700, color: 'white' }}>{cart.length > 9 ? '9+' : cart.length}</span>}
            </button>
          </div>
        </div>

        {/* ── Desktop: floating chat button ── */}
        <div className="hidden md:block fixed bottom-8 right-8 z-50">
          {chatSent ? (
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg" style={{ background: '#111' }}>
              <span style={{ ...ZN, fontSize: 13, color: 'white' }}>Message sent!</span>
              {chatId && <button onClick={() => router.push(`/${handle}/saved`)} style={{ ...ZN, fontSize: 12, fontWeight: 700, color: '#e6fd53' }}>View →</button>}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-3 rounded-2xl shadow-lg"
              style={{ background: theme.bottom.bg, border: `1px solid ${theme.bottom.border}`, minWidth: 280 }}>
              <input className="flex-1 bg-transparent outline-none text-sm"
                style={{ ...ZN, color: theme.bottom.textColor, fontSize: 13 }}
                placeholder={`Message ${store.storeName}…`}
                value={chatText} onChange={e => setChatText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && chatText.trim()) handleSendAttempt() }} />
              {chatText.trim() && (
                <button onClick={handleSendAttempt} disabled={chatSending}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: '#111' }}>
                  <PaperPlaneTilt size={14} weight="fill" color="white" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Buyer info sheet ── */}
        {showBuyerSheet && (
          <>
            <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setShowBuyerSheet(false)} />
            <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg z-50 px-5 pt-5 pb-10 rounded-t-3xl sheet-enter" style={{ background: 'white' }}>
              <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: '#e0e0e0' }} />
              <p style={{ ...ZE, fontWeight: 700, fontSize: 16, color: '#111', marginBottom: 4 }}>One quick thing</p>
              <p style={{ ...ZN, fontSize: 13, color: '#888', marginBottom: 20 }}>So {store.storeName} knows who to reply to</p>
              <div className="flex flex-col gap-3">
                <input autoFocus className="w-full outline-none rounded-2xl px-4 py-3.5"
                  style={{ ...ZN, fontSize: 14, background: '#f5f5f5', color: '#111' }}
                  placeholder="Your first name"
                  value={buyerInfo.firstName} onChange={e => setBuyerInfo(p => ({ ...p, firstName: e.target.value }))} />
                <input className="w-full outline-none rounded-2xl px-4 py-3.5"
                  style={{ ...ZN, fontSize: 14, background: '#f5f5f5', color: '#111' }}
                  placeholder="Your email (for reply notifications)" type="email"
                  value={buyerInfo.email} onChange={e => setBuyerInfo(p => ({ ...p, email: e.target.value }))} />
                <button onClick={handleBuyerSubmit}
                  disabled={!buyerInfo.firstName.trim() || !buyerInfo.email.trim() || chatSending}
                  className="w-full py-4 rounded-2xl mt-1"
                  style={{ ...ZN, fontWeight: 700, fontSize: 14,
                    background: (buyerInfo.firstName.trim() && buyerInfo.email.trim()) ? '#111' : '#ddd',
                    color: (buyerInfo.firstName.trim() && buyerInfo.email.trim()) ? 'white' : '#aaa' }}>
                  {chatSending ? 'Sending…' : 'Send message'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </ThemeCtx.Provider>
  )
}

// ── Block renderer ────────────────────────────────────────────────────────────
function BlockRenderer({ block, products, categories, router, handle, saved, cart, cardProps, activeFilter, setActiveFilter }) {
  switch (block.type) {
    case 'carousel':     return <CarouselBlock block={block} />
    case 'strip':        return <StripBlock block={block} products={products} cardProps={cardProps} activeFilter={activeFilter} />
    case 'grid':         return <GridBlock block={block} products={products} cardProps={cardProps} activeFilter={activeFilter} />
    case 'announcement': return <AnnouncementBlock block={block} />
    case 'categories':   return <CategoriesBlock block={block} categories={categories} activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
    case 'spacer':       return <SpacerBlock block={block} />
    case 'featured':     return <FeaturedBlock block={block} products={products} cardProps={cardProps} />
    default:             return null
  }
}

function CarouselBlock({ block }) {
  const theme = useContext(ThemeCtx)
  const banners = (block.banners || []).filter(b => b.enabled !== false)
  const [idx, setIdx] = useState(0)
  const touchStartX = useRef(0)
  const autoRef = useRef(null)
  useEffect(() => {
    if (!block.autoScroll || banners.length < 2) return
    autoRef.current = setInterval(() => setIdx(i => (i + 1) % banners.length), block.autoScroll * 1000)
    return () => clearInterval(autoRef.current)
  }, [block.autoScroll, banners.length])
  if (banners.length === 0) return null
  return (
    <div className="mt-6">
      <div onTouchStart={e => { touchStartX.current = e.touches[0].clientX }}
        onTouchEnd={e => {
          const dx = touchStartX.current - e.changedTouches[0].clientX
          if (Math.abs(dx) > 40) setIdx(i => dx > 0 ? (i + 1) % banners.length : (i - 1 + banners.length) % banners.length)
        }}>
        <BannerPreview banner={banners[idx]} headingFont={theme.headingFont} style={{ borderRadius: 12 }} />
      </div>
      {block.showIndicator !== false && banners.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {banners.map((_, i) => (
            <div key={i} onClick={() => setIdx(i)} style={{ width: i === idx ? 20 : 6, height: 4, borderRadius: 2, background: i === idx ? '#111' : '#ccc', transition: 'width 0.2s', cursor: 'pointer' }} />
          ))}
        </div>
      )}
    </div>
  )
}

function StripBlock({ block, products, cardProps, activeFilter }) {
  const theme = useContext(ThemeCtx)
  const items = filterProducts(products, block.criteria, block.category, block.count || 6, '', activeFilter)
  if (items.length === 0) return null
  return (
    <section className="mt-8">
      {(block.title || block.description) && (
        <div className="mb-4">
          {block.title && <h2 style={{ fontFamily: theme.section.font, fontWeight: theme.section.weight, fontSize: 16, color: theme.section.color }}>{block.title}</h2>}
          {block.description && <p style={{ fontFamily: theme.section.font, fontSize: 12, color: theme.section.subColor, marginTop: 2 }}>{block.description}</p>}
        </div>
      )}
      <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
        {items.map(p => <ProductCard key={p.id} compact {...cardProps(p)} />)}
      </div>
    </section>
  )
}

function GridBlock({ block, products, cardProps, activeFilter }) {
  const theme = useContext(ThemeCtx)
  const maxItems = (block.rows || 2) * 4
  const items = filterProducts(products, block.criteria, block.category, maxItems, '', activeFilter)
  if (items.length === 0) return null
  return (
    <section className="mt-8">
      {(block.title || block.description) && (
        <div className="mb-4">
          {block.title && <h2 style={{ fontFamily: theme.section.font, fontWeight: theme.section.weight, fontSize: 16, color: theme.section.color }}>{block.title}</h2>}
          {block.description && <p style={{ fontFamily: theme.section.font, fontSize: 12, color: theme.section.subColor, marginTop: 2 }}>{block.description}</p>}
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map(p => <ProductCard key={p.id} {...cardProps(p)} />)}
      </div>
    </section>
  )
}

function AnnouncementBlock({ block }) {
  const theme = useContext(ThemeCtx)
  if (!block.text) return null
  const duration = block.speed === 'fast' ? 12 : block.speed === 'slow' ? 35 : 22
  return (
    <div className="mt-4" style={{ background: theme.announcement.bg, height: 36, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
      <div style={{ display: 'flex', animation: `sfTicker ${duration}s linear infinite`, willChange: 'transform', flexShrink: 0 }}>
        {[...Array(4)].map((_, i) => (
          <span key={i} style={{ fontFamily: theme.section.font, fontSize: 12, fontWeight: 600, color: theme.announcement.text, whiteSpace: 'nowrap', padding: '0 40px' }}>{block.text}</span>
        ))}
      </div>
    </div>
  )
}

function CategoriesBlock({ block, categories, activeFilter, setActiveFilter }) {
  const theme = useContext(ThemeCtx)
  const hidden  = block.hiddenCats || []
  const visible = categories.filter(c => c !== 'All' && !hidden.includes(c))
  if (visible.length === 0) return null
  return (
    <section className="mt-6">
      {block.title && <h2 style={{ fontFamily: theme.section.font, fontWeight: theme.section.weight, fontSize: 16, color: theme.section.color, marginBottom: 10 }}>{block.title}</h2>}
      <div className="flex gap-2 flex-wrap">
        {activeFilter && (
          <button onClick={() => setActiveFilter(null)} style={{ fontFamily: theme.section.font, fontSize: 13, fontWeight: 600, padding: '8px 14px', borderRadius: 100, background: theme.tab.bg, color: theme.tab.text }}>All</button>
        )}
        {visible.map(cat => (
          <button key={cat} onClick={() => setActiveFilter(activeFilter === cat ? null : cat)}
            style={{ fontFamily: theme.section.font, fontSize: 13, fontWeight: activeFilter === cat ? 700 : 500, padding: '8px 14px', borderRadius: 100, background: activeFilter === cat ? theme.tab.activeBg : theme.tab.bg, color: activeFilter === cat ? theme.tab.activeText : theme.tab.text }}>
            {cat}
          </button>
        ))}
      </div>
    </section>
  )
}

function SpacerBlock({ block }) {
  const h = block.height === 'small' ? 16 : block.height === 'large' ? 48 : 28
  return <div style={{ height: h }} />
}

function FeaturedBlock({ block, products, cardProps }) {
  const product = products.find(p => p.id === block.productId)
  if (!product) return null
  return (
    <section className="mt-8">
      {block.title && <h2 style={{ fontFamily: "'Zalando Sans'", fontWeight: 700, fontSize: 16, color: '#111', marginBottom: 10 }}>{block.title}</h2>}
      <div style={{ maxWidth: 280 }}>
        <ProductCard {...cardProps(product)} />
      </div>
    </section>
  )
}

// ── Product card ──────────────────────────────────────────────────────────────
const COLOR_HEX = {
  black:'#111',white:'#f8f8f8',red:'#e53935',blue:'#1e88e5',green:'#43a047',
  yellow:'#fdd835',pink:'#e91e63',purple:'#8e24aa',orange:'#fb8c00',
  brown:'#6d4c41',grey:'#9e9e9e',gray:'#9e9e9e',navy:'#1a237e',cream:'#fff8e1',
  beige:'#d7ccc8',gold:'#ffc107',silver:'#bdbdbd',maroon:'#880e4f',
  khaki:'#c8b560',olive:'#808000',coral:'#ff7043',teal:'#00897b',
}

function ProductCard({ product, isSaved, inCart, onSave, onCart, onClick, compact }) {
  const theme = useContext(ThemeCtx)
  const [imgIdx, setImgIdx] = useState(0)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const touchEndX = useRef(0)
  const isDragging = useRef(false)
  const images = product.images?.length > 0 ? product.images : [null]

  return (
    <div className={compact ? 'flex-shrink-0 cursor-pointer' : 'cursor-pointer'} style={compact ? { width: 155 } : undefined}>
      <div className="relative overflow-hidden"
        style={{ aspectRatio: '3/4', background: theme.card.imgBg, borderRadius: theme.card.radius }}
        onTouchStart={e => { touchStartX.current = e.touches[0].clientX; touchStartY.current = e.touches[0].clientY; isDragging.current = false }}
        onTouchMove={e => {
          const dx = Math.abs(e.touches[0].clientX - touchStartX.current)
          const dy = Math.abs(e.touches[0].clientY - touchStartY.current)
          if (dx > 8 && dx > dy) isDragging.current = true
          touchEndX.current = e.touches[0].clientX
        }}
        onTouchEnd={() => {
          const dx = touchStartX.current - touchEndX.current
          if (Math.abs(dx) > 30) {
            if (dx > 0 && imgIdx < images.length - 1) setImgIdx(i => i + 1)
            if (dx < 0 && imgIdx > 0) setImgIdx(i => i - 1)
          }
        }}
        onClick={() => { if (!isDragging.current) onClick() }}>
        {images[imgIdx]
          ? <img src={images[imgIdx]} alt={product.name} className="w-full h-full object-cover select-none" draggable={false} loading="lazy" />
          : <div className="w-full h-full flex items-center justify-center"><span style={{ fontFamily: theme.card.nameFont, fontSize: 11, color: theme.card.catColor }}>{product.category}</span></div>}
        <button onClick={e => { e.stopPropagation(); onSave() }}
          className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.88)' }}>
          <Heart size={14} weight={isSaved ? 'fill' : 'regular'} color={isSaved ? '#ef4444' : '#555'} />
        </button>
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.discount > 0 && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: '#ef4444', color: '#fff' }}>-{product.discount}%</span>}
          {product.isReplica && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'rgba(0,0,0,0.65)', color: '#e6fd53' }}>Replica</span>}
        </div>
        {product.stock <= 3 && product.stock > 0 && (
          <div className="absolute bottom-7 left-0 right-0 flex justify-center">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold" style={{ background: 'rgba(0,0,0,0.75)', color: '#e6fd53' }}>Only {product.stock} left</span>
          </div>
        )}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
            {images.map((_, i) => <div key={i} className="rounded-full" style={{ width: i === imgIdx ? 12 : 4, height: 4, background: i === imgIdx ? 'white' : 'rgba(255,255,255,0.5)' }} />)}
          </div>
        )}
      </div>
      <div className="mt-2 px-0.5" onClick={onClick}>
        <p style={{ fontFamily: theme.card.nameFont, fontSize: 10, color: theme.card.catColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{product.brand || product.category}</p>
        <p className="mt-0.5 leading-snug line-clamp-2" style={{ fontFamily: theme.card.nameFont, fontSize: compact ? 12 : 13, fontWeight: theme.card.nameWeight, color: theme.card.nameColor }}>{product.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <p style={{ fontFamily: theme.card.priceFontFamily, fontSize: compact ? 13 : 14, fontWeight: 700, color: theme.card.priceColor }}>{formatPrice(product.price)}</p>
        </div>
        {product.colors?.length > 0 && (
          <div className="flex items-center gap-1 mt-1.5">
            {product.colors.slice(0, 4).map((c, i) => <div key={i} className="w-3 h-3 rounded-full" style={{ background: COLOR_HEX[c?.toLowerCase()] ?? '#ccc', border: '1px solid rgba(0,0,0,0.1)' }} />)}
            {product.colors.length > 4 && <span style={{ fontFamily: "'Zalando Sans'", fontSize: 10, color: '#999' }}>+{product.colors.length - 4}</span>}
          </div>
        )}
      </div>
    </div>
  )
}
