'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { doc, getDoc, collection, addDoc, updateDoc, orderBy, query, serverTimestamp, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../../../../lib/firebase'
import { ArrowLeft, PaperPlaneTilt } from '@phosphor-icons/react'
import { ZE, ZN } from '../../../../lib/styles'

export default function BuyerThreadPage() {
  const { handle, chatId } = useParams()
  const router = useRouter()

  const [store, setStore]       = useState(null)
  const [storeUid, setStoreUid] = useState(null)
  const [chatMeta, setChatMeta] = useState(null)
  const [messages, setMessages] = useState([])
  const [replyText, setReplyText] = useState('')
  const [sending, setSending]   = useState(false)
  const [loading, setLoading]   = useState(true)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  useEffect(() => {
    async function load() {
      try {
        const handleSnap = await getDoc(doc(db, 'handles', handle))
        if (!handleSnap.exists()) { setLoading(false); return }
        const uid = handleSnap.data().uid
        setStoreUid(uid)
        const [storeSnap, chatSnap] = await Promise.all([
          getDoc(doc(db, 'stores', uid)),
          getDoc(doc(db, 'stores', uid, 'chats', chatId)),
        ])
        if (storeSnap.exists()) setStore(storeSnap.data())
        if (chatSnap.exists()) setChatMeta(chatSnap.data())
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
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendReply = async () => {
    if (!replyText.trim() || !storeUid || sending) return
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
      // Notify seller by email
      if (store?.email) {
        fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'merchant-message',
            merchantEmail: store.email,
            storeName: store.storeName || handle,
            storeHandle: handle,
            chatId,
            buyerFirstName: chatMeta?.buyerFirstName || chatMeta?.buyerName || 'A customer',
            buyerEmail: chatMeta?.buyerEmail || '',
            message: msg,
          }),
        }).catch(() => {})
      }
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
    <div className="flex flex-col" style={{ background: '#f5f5f5', height: '100dvh' }}>
      <header className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ background: 'white', borderBottom: '1px solid #eee' }}>
        <button onClick={() => router.push(`/${handle}/saved`)}>
          <ArrowLeft size={20} color="#111" />
        </button>
        <div className="flex-1 min-w-0">
          <p style={{ ...ZN, fontWeight: 800, fontSize: 14, color: '#111' }} className="truncate">
            {store?.storeName?.toUpperCase() ?? handle.toUpperCase()}
          </p>
          <p style={{ ...ZN, fontSize: 12, color: '#999' }}>Your conversation</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 max-w-2xl mx-auto w-full">
        {messages.length === 0 && (
          <div className="text-center py-16">
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
        <div className="max-w-2xl mx-auto flex items-center gap-2 rounded-full px-4" style={{ background: '#f5f5f5', border: '1px solid #e8e8e8', minHeight: 48 }}>
          <input ref={inputRef} className="flex-1 bg-transparent outline-none"
            style={{ ...ZN, color: '#111', fontSize: 14, paddingBlock: 13 }}
            placeholder={`Message ${store?.storeName ?? 'store'}…`}
            value={replyText} onChange={e => setReplyText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && replyText.trim()) sendReply() }} />
          {replyText.trim() && (
            <button onClick={sendReply} disabled={sending} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#111' }}>
              <PaperPlaneTilt size={15} weight="fill" color="white" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
