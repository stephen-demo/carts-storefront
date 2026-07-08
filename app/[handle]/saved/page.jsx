'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Heart, ChatCircle, PaperPlaneTilt } from '@phosphor-icons/react'
import { doc, getDoc, collection, getDocs, addDoc, updateDoc, query, orderBy, serverTimestamp, onSnapshot } from 'firebase/firestore'
import { db } from '../../../lib/firebase'
import { ZE, ZN } from '../../../lib/styles'

const formatPrice = (amount) => `₦${Number(amount).toLocaleString('en-NG')}`

export default function SavedPage() {
  const { handle } = useParams()
  const router = useRouter()
  const bottomRef = useRef(null)

  const [tab, setTab]             = useState('saved')
  const [products, setProducts]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [storeUid, setStoreUid]   = useState(null)
  const [storeName, setStoreName] = useState('')
  const [chatId, setChatId]       = useState(null)
  const [savedIds, setSavedIds]   = useState([])
  const [messages, setMessages]   = useState([])
  const [replyText, setReplyText] = useState('')
  const [sending, setSending]     = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const handleSnap = await getDoc(doc(db, 'handles', handle))
        if (!handleSnap.exists()) { setLoading(false); return }
        const uid = handleSnap.data().uid
        setStoreUid(uid)
        const storeSnap = await getDoc(doc(db, 'stores', uid))
        if (storeSnap.exists()) setStoreName(storeSnap.data().storeName || handle)
        const ids = JSON.parse(localStorage.getItem(`carts_saved_${handle}`) || '[]')
        setSavedIds(ids)
        const cid = localStorage.getItem(`carts_chat_${uid}`)
        if (cid) setChatId(cid)
        if (ids.length > 0) {
          const prodSnap = await getDocs(collection(db, 'stores', uid, 'products'))
          const all = prodSnap.docs.map(d => ({ id: d.id, ...d.data() }))
          setProducts(all.filter(p => ids.includes(p.id)))
        }
      } catch { /* offline */ }
      setLoading(false)
    }
    load()
  }, [handle])

  useEffect(() => {
    if (!storeUid || !chatId) return
    const unsub = onSnapshot(
      query(collection(db, 'stores', storeUid, 'chats', chatId, 'messages'), orderBy('createdAt', 'asc')),
      snap => setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      () => {}
    )
    return unsub
  }, [storeUid, chatId])

  useEffect(() => {
    if (tab === 'messages') bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, tab])

  const unsave = (id) => {
    const next = savedIds.filter(i => i !== id)
    setSavedIds(next)
    setProducts(prev => prev.filter(p => p.id !== id))
    localStorage.setItem(`carts_saved_${handle}`, JSON.stringify(next))
  }

  const sendReply = async () => {
    if (!replyText.trim() || !storeUid || !chatId || sending) return
    setSending(true)
    const msg = replyText.trim()
    setReplyText('')
    try {
      await addDoc(collection(db, 'stores', storeUid, 'chats', chatId, 'messages'), {
        text: msg, from: 'buyer', createdAt: serverTimestamp(),
      })
      updateDoc(doc(db, 'stores', storeUid, 'chats', chatId), {
        lastMessage: msg, lastMessageAt: serverTimestamp(), unread: true,
      }).catch(() => {})
    } catch { setReplyText(msg) }
    setSending(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#f5f5f5' }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#111', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="flex flex-col" style={{ background: '#f5f5f5', minHeight: '100dvh' }}>
      <header className="flex-shrink-0 sticky top-0 z-10 flex items-center gap-3 px-4 py-4"
        style={{ background: 'white', borderBottom: '1px solid #eee' }}>
        <button onClick={() => router.push(`/${handle}`)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#f0f0f0' }}>
          <ArrowLeft size={18} color="#333" />
        </button>
        <p style={{ ...ZE, fontWeight: 700, fontSize: 16, color: '#111', flex: 1 }}>Saved</p>
      </header>

      <div className="flex-shrink-0 flex mx-4 mt-4 rounded-2xl overflow-hidden mb-1" style={{ background: '#e8e8e8', padding: 3, gap: 3 }}>
        <button onClick={() => setTab('saved')} className="flex-1 py-2.5 rounded-xl"
          style={{ ...ZN, fontWeight: 700, fontSize: 13, background: tab === 'saved' ? 'white' : 'transparent', color: tab === 'saved' ? '#111' : '#999' }}>
          Saved Items
        </button>
        <button onClick={() => setTab('messages')} className="flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5"
          style={{ ...ZN, fontWeight: 700, fontSize: 13, background: tab === 'messages' ? 'white' : 'transparent', color: tab === 'messages' ? '#111' : '#999' }}>
          <ChatCircle size={14} weight={tab === 'messages' ? 'fill' : 'regular'} /> Messages
        </button>
      </div>

      {tab === 'saved' && (
        <div className="flex-1 overflow-y-auto">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-6 px-6 mt-20">
              <Heart size={52} weight="duotone" color="#ccc" />
              <div className="text-center">
                <p style={{ ...ZE, fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 6 }}>Nothing saved yet</p>
                <p style={{ ...ZN, fontSize: 14, color: '#999' }}>Tap the heart on any product to save it here.</p>
              </div>
              <button onClick={() => router.push(`/${handle}`)} className="px-6 py-3 rounded-full"
                style={{ background: '#111', ...ZN, fontWeight: 700, fontSize: 14, color: 'white' }}>
                Browse the store →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 px-4 pt-4 pb-6">
              {products.map(product => (
                <div key={product.id} className="flex flex-col">
                  <button className="relative rounded-2xl overflow-hidden text-left" style={{ aspectRatio: '3/4', background: '#e8e8e8' }}
                    onClick={() => router.push(`/${handle}/${product.id}`)}>
                    {product.images?.[0]
                      ? <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                      : <div className="w-full h-full flex items-center justify-center"><span style={{ ...ZN, fontSize: 11, color: '#bbb' }}>{product.category}</span></div>}
                    <button onClick={e => { e.stopPropagation(); unsave(product.id) }}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.9)' }}>
                      <Heart size={14} weight="fill" color="#ef4444" />
                    </button>
                  </button>
                  <div className="mt-2 px-0.5" onClick={() => router.push(`/${handle}/${product.id}`)}>
                    <p className="leading-snug line-clamp-1" style={{ ...ZN, fontSize: 13, fontWeight: 600, color: '#111' }}>{product.name}</p>
                    <p style={{ ...ZN, fontSize: 13, fontWeight: 700, color: '#111', marginTop: 2 }}>{formatPrice(product.price)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'messages' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {!chatId ? (
            <div className="flex flex-col items-center justify-center gap-4 px-6 mt-20">
              <ChatCircle size={52} weight="duotone" color="#ccc" />
              <div className="text-center">
                <p style={{ ...ZE, fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 6 }}>No messages yet</p>
                <p style={{ ...ZN, fontSize: 14, color: '#999' }}>Start a conversation from any store page.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <p style={{ ...ZN, fontSize: 14, color: '#999' }}>No messages yet. Say hello! 👋</p>
                  </div>
                )}
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.from === 'buyer' ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[75%] px-4 py-2.5 rounded-2xl"
                      style={{ background: msg.from === 'buyer' ? '#111' : 'white', borderBottomRightRadius: msg.from === 'buyer' ? 4 : 16, borderBottomLeftRadius: msg.from === 'merchant' ? 4 : 16, boxShadow: msg.from === 'merchant' ? '0 1px 4px rgba(0,0,0,0.08)' : undefined }}>
                      <p style={{ ...ZN, fontSize: 14, color: msg.from === 'buyer' ? 'white' : '#111', lineHeight: 1.5 }}>{msg.text}</p>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <div className="flex-shrink-0 px-4 py-3" style={{ background: 'white', borderTop: '1px solid #eee' }}>
                <div className="flex items-center gap-2 rounded-full px-4" style={{ background: '#f5f5f5', border: '1px solid #e8e8e8', minHeight: 48 }}>
                  <input className="flex-1 bg-transparent outline-none"
                    style={{ ...ZN, color: '#111', fontSize: 14, paddingBlock: 13 }}
                    placeholder={`Message ${storeName || handle}…`}
                    value={replyText} onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && replyText.trim()) sendReply() }} />
                  {replyText.trim() && (
                    <button onClick={sendReply} disabled={sending} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#111' }}>
                      <PaperPlaneTilt size={15} weight="fill" color="white" />
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
