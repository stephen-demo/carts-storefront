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

const fmt = (n) => `₦${Number(n || 0).toLocaleString('en-NG')}`

function orderEmailHtml({ storeName, handle, orderId, buyerName, items = [], total, deliveryFee = 0, discount = 0, paymentMethod, delivery, confirmUrl, storeUrl }) {
  const firstName = buyerName?.split(' ')[0] || 'there'
  const DELIVERY_LABELS = { pickup: 'Pickup from store', gig: 'GIG Express', kwik: 'Kwik Delivery' }
  const deliveryLabel = DELIVERY_LABELS[delivery] || delivery || 'Pickup'
  const itemRows = items.map(item => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f0ece4;vertical-align:top;">
        <div style="font-size:14px;font-weight:600;color:#1a1209;line-height:1.4;">${item.name}</div>
        ${item.size || item.color ? `<div style="font-size:12px;color:#8a7f72;margin-top:2px;">${[item.size,item.color].filter(Boolean).join(' · ')}</div>` : ''}
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #f0ece4;text-align:center;font-size:13px;color:#5a5040;vertical-align:top;">${item.qty || 1}</td>
      <td style="padding:12px 0;border-bottom:1px solid #f0ece4;text-align:right;font-size:14px;font-weight:700;color:#1a1209;vertical-align:top;">${fmt((item.price || 0) * (item.qty || 1))}</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f2ee;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f2ee;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr><td style="background:#1a1209;padding:36px 40px 28px;text-align:center;">
          <p style="margin:0;font-size:22px;font-weight:800;color:white;letter-spacing:0.1em;text-transform:uppercase;font-family:Georgia,serif;">${storeName}</p>
          <p style="margin:8px 0 0;font-size:11px;color:rgba(255,255,255,0.45);letter-spacing:0.14em;text-transform:uppercase;">Order Confirmed</p>
        </td></tr>

        <!-- Greeting -->
        <tr><td style="padding:32px 40px 0;">
          <p style="margin:0;font-size:24px;font-weight:700;color:#1a1209;font-family:Georgia,serif;line-height:1.3;">Thank you, ${firstName}!</p>
          <p style="margin:12px 0 0;font-size:14px;color:#6a5a4a;line-height:1.6;">Your order has been received and the seller has been notified. We'll update you as it gets packed and shipped.</p>
        </td></tr>

        <!-- Order meta -->
        <tr><td style="padding:20px 40px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf9f7;border-radius:10px;padding:16px 20px;">
            <tr>
              <td style="font-size:12px;">
                <span style="font-size:9px;color:#a09080;text-transform:uppercase;letter-spacing:0.1em;display:block;margin-bottom:3px;">Order Number</span>
                <span style="font-size:13px;font-weight:700;color:#1a1209;">#${orderId.slice(0,8).toUpperCase()}</span>
              </td>
              <td style="font-size:12px;text-align:right;">
                <span style="font-size:9px;color:#a09080;text-transform:uppercase;letter-spacing:0.1em;display:block;margin-bottom:3px;">Delivery</span>
                <span style="font-size:13px;font-weight:600;color:#1a1209;">${deliveryLabel}</span>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Items -->
        <tr><td style="padding:24px 40px 0;">
          <p style="margin:0 0 4px;font-size:9px;color:#a09080;text-transform:uppercase;letter-spacing:0.1em;">Items Ordered</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <thead>
              <tr>
                <th style="font-size:9px;color:#a09080;text-transform:uppercase;letter-spacing:0.08em;font-weight:500;padding-bottom:8px;text-align:left;">Item</th>
                <th style="font-size:9px;color:#a09080;text-transform:uppercase;letter-spacing:0.08em;font-weight:500;padding-bottom:8px;text-align:center;">Qty</th>
                <th style="font-size:9px;color:#a09080;text-transform:uppercase;letter-spacing:0.08em;font-weight:500;padding-bottom:8px;text-align:right;">Amount</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
            ${deliveryFee > 0 ? `<tr><td style="font-size:13px;color:#6a5a4a;padding:4px 0;">Delivery</td><td style="font-size:13px;color:#6a5a4a;text-align:right;padding:4px 0;">${fmt(deliveryFee)}</td></tr>` : ''}
            ${discount > 0 ? `<tr><td style="font-size:13px;color:#22c55e;padding:4px 0;">Discount</td><td style="font-size:13px;color:#22c55e;text-align:right;padding:4px 0;">−${fmt(discount)}</td></tr>` : ''}
            <tr><td colspan="2" style="padding-top:12px;border-top:2px solid #1a1209;"></td></tr>
            <tr>
              <td style="font-size:15px;font-weight:700;color:#1a1209;font-family:Georgia,serif;padding-top:4px;">Total</td>
              <td style="font-size:18px;font-weight:800;color:#1a1209;font-family:Georgia,serif;text-align:right;padding-top:4px;">${fmt(total)}</td>
            </tr>
          </table>
        </td></tr>

        <!-- Primary CTA: track order -->
        <tr><td style="padding:28px 40px 0;">
          <a href="${confirmUrl}" style="display:block;background:#1a1209;color:white;padding:16px;border-radius:8px;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;text-align:center;">
            Track my order →
          </a>
        </td></tr>

        <!-- Secondary CTA: browse store -->
        <tr><td style="padding:12px 40px 0;">
          <a href="${storeUrl}" style="display:block;background:#faf9f7;color:#1a1209;padding:16px;border-radius:8px;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;text-align:center;border:1px solid #e8e2d9;">
            Browse more from ${storeName}
          </a>
        </td></tr>

        <!-- Confirm receipt prompt -->
        <tr><td style="padding:20px 40px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f2ee;border-radius:10px;padding:16px 20px;">
            <tr>
              <td>
                <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#1a1209;">Once you receive your order</p>
                <p style="margin:0 0 12px;font-size:12px;color:#6a5a4a;line-height:1.5;">Please confirm delivery and let ${storeName} know how they did — it helps them improve!</p>
                <a href="${confirmUrl}?action=received" style="display:inline-block;background:white;color:#1a1209;padding:10px 20px;border-radius:6px;font-size:12px;font-weight:700;text-decoration:none;border:1px solid #e0dbd2;">
                  ✓ Confirm I received it
                </a>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:28px 40px 32px;border-top:1px solid #f0ece4;margin-top:24px;text-align:center;">
          <p style="margin:24px 0 0;font-size:11px;color:#b0a090;">Powered by <a href="https://carts.ng" style="color:#b0a090;text-decoration:underline;">Carts.ng</a></p>
          <p style="margin:4px 0 0;font-size:11px;color:#c8bfb0;">You received this because you placed an order at ${storeName}.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
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

  if (type === 'buyer-order') {
    const { buyerEmail, buyerName, storeName, handle, orderId, items, total, deliveryFee, discount, delivery, paymentMethod } = body
    if (!buyerEmail || !orderId || !handle) {
      return Response.json({ error: 'Missing fields' }, { status: 400 })
    }
    try {
      const confirmUrl = `https://carts.ng/${handle}/orders/${orderId}`
      const storeUrl   = `https://carts.ng/${handle}`
      await sendEmail({
        to: buyerEmail,
        subject: `Your order from ${storeName} is confirmed ✓`,
        html: orderEmailHtml({ storeName, handle, orderId, buyerName, items: items || [], total: total || 0, deliveryFee: deliveryFee || 0, discount: discount || 0, paymentMethod, delivery, confirmUrl, storeUrl }),
      })
      return Response.json({ ok: true })
    } catch (err) {
      console.error('[notify] buyer-order error:', err)
      return Response.json({ error: 'Failed', detail: err?.message }, { status: 500 })
    }
  }

  if (type === 'merchant-order') {
    const { merchantEmail, storeName, storeHandle, orderId, buyerName, buyerPhone, delivery, items, total, discount, dealName, paymentMethod } = body
    if (!merchantEmail || !orderId) {
      return Response.json({ error: 'Missing fields' }, { status: 400 })
    }
    try {
      const itemList = (items || []).map(i => `<li style="margin-bottom:4px;font-size:14px;">${i.qty || 1}× ${i.name} — <strong>${fmt((i.price || 0) * (i.qty || 1))}</strong></li>`).join('')
      const DELIVERY_LABELS = { pickup: 'Pickup from store', gig: 'GIG Express', kwik: 'Kwik Delivery' }
      await sendEmail({
        to: merchantEmail,
        subject: `New order from ${buyerName || 'a customer'} — ${fmt(total)}`,
        html: `
          <div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;">
            <p style="font-size:18px;font-weight:700;color:#111;margin:0 0 4px;">New order! 🎉</p>
            <p style="font-size:14px;color:#555;margin:0 0 20px;">Order #${orderId.slice(0,8).toUpperCase()} on your ${storeName} store.</p>
            <div style="background:#f5f5f5;border-radius:12px;padding:16px;margin:0 0 16px;">
              <p style="margin:0 0 4px;font-size:13px;color:#888;">Buyer</p>
              <p style="margin:0;font-size:15px;font-weight:600;color:#111;">${buyerName || 'Unknown'}${buyerPhone ? ` · ${buyerPhone}` : ''}</p>
            </div>
            <ul style="padding-left:20px;margin:0 0 16px;">${itemList}</ul>
            ${discount > 0 ? `<p style="font-size:13px;color:#555;margin:0 0 4px;">Discount${dealName ? ` (${dealName})` : ''}: −${fmt(discount)}</p>` : ''}
            <p style="font-size:16px;font-weight:700;color:#111;margin:0 0 16px;">Total: ${fmt(total)} · ${DELIVERY_LABELS[delivery] || delivery || 'Pickup'}</p>
            <a href="https://app.carts.ng/owner/sales" style="display:inline-block;background:#111;color:#fff;padding:14px 28px;border-radius:99px;font-weight:700;text-decoration:none;font-size:14px;">View order →</a>
            <p style="font-size:12px;color:#bbb;margin-top:32px;">Powered by <a href="https://carts.ng" style="color:#bbb;">Carts.ng</a></p>
          </div>
        `,
      })
      return Response.json({ ok: true })
    } catch (err) {
      console.error('[notify] merchant-order error:', err)
      return Response.json({ error: 'Failed', detail: err?.message }, { status: 500 })
    }
  }

  if (type === 'merchant-qa') {
    const { merchantEmail, storeName, storeHandle, productName, productId, question } = body
    if (!merchantEmail || !question) {
      return Response.json({ error: 'Missing fields' }, { status: 400 })
    }
    try {
      await sendEmail({
        to: merchantEmail,
        subject: `New question about "${productName}" on your store`,
        html: `
          <div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;">
            <p style="font-size:16px;font-weight:700;color:#111;margin:0 0 4px;">New customer question</p>
            <p style="font-size:13px;color:#888;margin:0 0 20px;">On product: <strong>${productName}</strong></p>
            <div style="background:#f5f5f5;border-radius:12px;padding:16px;margin:0 0 24px;">
              <p style="font-size:15px;color:#111;margin:0;line-height:1.5;">${question}</p>
            </div>
            <a href="https://app.carts.ng/owner/qa/${productId}" style="display:inline-block;background:#111;color:#fff;padding:14px 28px;border-radius:99px;font-weight:700;text-decoration:none;font-size:14px;">Answer question →</a>
            <p style="font-size:12px;color:#bbb;margin-top:32px;">Powered by <a href="https://carts.ng" style="color:#bbb;">Carts.ng</a></p>
          </div>
        `,
      })
      return Response.json({ ok: true })
    } catch (err) {
      console.error('[notify] merchant-qa error:', err)
      return Response.json({ error: 'Failed', detail: err?.message }, { status: 500 })
    }
  }

  return Response.json({ error: 'Unknown type' }, { status: 400 })
}
