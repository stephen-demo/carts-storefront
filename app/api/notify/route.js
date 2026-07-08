async function sendEmail({ to, subject, html }) {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.warn('[notify] RESEND_API_KEY not set — skipping email')
    return
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'Carts.ng <notifications@carts.ng>', to, subject, html }),
  })
  if (!res.ok) throw new Error(await res.text())
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}))
  const { type } = body

  if (type === 'merchant-message') {
    const { merchantEmail, storeName, storeHandle, chatId, buyerFirstName, buyerEmail, message } = body
    if (!merchantEmail || !chatId || !message) {
      return Response.json({ error: 'Missing fields' }, { status: 400 })
    }
    try {
      await sendEmail({
        to: merchantEmail,
        subject: `New message from ${buyerFirstName || 'a customer'} on your store`,
        html: `
          <div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;">
            <p style="font-size:16px;color:#111;margin:0 0 8px;">Hi ${storeName || 'there'},</p>
            <p style="font-size:14px;color:#555;margin:0 0 4px;"><strong>${buyerFirstName || 'A customer'}</strong>${buyerEmail ? ` (${buyerEmail})` : ''} sent you a message:</p>
            <div style="background:#f5f5f5;border-radius:12px;padding:16px;margin:16px 0 24px;">
              <p style="font-size:15px;color:#111;margin:0;line-height:1.5;">${message}</p>
            </div>
            <a href="https://app.carts.ng/owner/chat/${chatId}" style="display:inline-block;background:#111;color:#fff;padding:14px 28px;border-radius:99px;font-weight:700;text-decoration:none;font-size:14px;">Reply now →</a>
            <p style="font-size:12px;color:#bbb;margin-top:32px;">Powered by <a href="https://carts.ng" style="color:#bbb;">Carts.ng</a></p>
          </div>
        `,
      })
      return Response.json({ ok: true })
    } catch (err) {
      console.error('[notify] merchant-message error:', err)
      return Response.json({ error: 'Failed' }, { status: 500 })
    }
  }

  if (type === 'buyer-reply') {
    const { buyerEmail, buyerFirstName, storeName, storeHandle, chatId, merchantReply } = body
    if (!buyerEmail || !chatId || !merchantReply) {
      return Response.json({ error: 'Missing fields' }, { status: 400 })
    }
    try {
      await sendEmail({
        to: buyerEmail,
        subject: `${storeName} replied to your message`,
        html: `
          <div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;">
            <p style="font-size:16px;color:#111;margin:0 0 8px;">Hi ${buyerFirstName || 'there'},</p>
            <p style="font-size:14px;color:#555;margin:0 0 16px;"><strong>${storeName}</strong> replied to your message:</p>
            <div style="background:#f5f5f5;border-radius:12px;padding:16px;margin:0 0 24px;">
              <p style="font-size:15px;color:#111;margin:0;line-height:1.5;">${merchantReply}</p>
            </div>
            <a href="https://carts.ng/${storeHandle}/chat/${chatId}" style="display:inline-block;background:#111;color:#fff;padding:14px 28px;border-radius:99px;font-weight:700;text-decoration:none;font-size:14px;">View conversation →</a>
            <p style="font-size:12px;color:#bbb;margin-top:32px;">Powered by <a href="https://carts.ng" style="color:#bbb;">Carts.ng</a></p>
          </div>
        `,
      })
      return Response.json({ ok: true })
    } catch (err) {
      console.error('[notify] buyer-reply error:', err)
      return Response.json({ error: 'Failed' }, { status: 500 })
    }
  }

  return Response.json({ error: 'Unknown type' }, { status: 400 })
}
