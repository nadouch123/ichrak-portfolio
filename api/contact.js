// POST /api/contact
// The portfolio's one backend feature: takes a message from the contact form,
// checks it, and emails it to me through Resend (free tier).
//
// Environment variables (set in Vercel > Project > Settings > Environment Variables):
//   RESEND_API_KEY    required. Secret key from resend.com. Never sent to the browser.
//   CONTACT_TO_EMAIL  optional. Where messages go. Defaults to my public email.
//   CONTACT_FROM      optional. Sender shown in my inbox. Defaults to Resend's test sender,
//                     which can only deliver to the email the Resend account was opened with.

const TO = process.env.CONTACT_TO_EMAIL || 'matrouhichrak7@gmail.com';
const FROM = process.env.CONTACT_FROM || 'Portfolio contact form <onboarding@resend.dev>';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const LIMITS = { name: 100, email: 200, message: 5000 };

export function validate(body) {
  const data = body && typeof body === 'object' ? body : {};
  const name = String(data.name ?? '').replace(/\s+/g, ' ').trim();
  const email = String(data.email ?? '').trim();
  const message = String(data.message ?? '').trim();
  const errors = {};

  if (!name) errors.name = 'Please add your name.';
  else if (name.length > LIMITS.name) errors.name = 'That name is too long.';

  if (!email) errors.email = 'Please add your email so I can reply.';
  else if (email.length > LIMITS.email || !EMAIL_RE.test(email)) errors.email = 'That email does not look right.';

  if (message.length < 10) errors.message = 'Please write at least a sentence (10 characters).';
  else if (message.length > LIMITS.message) errors.message = 'Please keep it under 5,000 characters.';

  return { name, email, message, errors };
}

const escapeHtml = (s) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body);
  let raw = '';
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Use POST.' });
  }

  let body;
  try {
    body = await readBody(req);
  } catch {
    return res.status(400).json({ ok: false, error: 'The request was not valid JSON.' });
  }

  // Spam trap: real people never see or fill the hidden "company" field.
  // Bots usually do. Pretend it worked so they don't retry, but send nothing.
  if (body && typeof body.company === 'string' && body.company.trim() !== '') {
    return res.status(200).json({ ok: true });
  }

  const { name, email, message, errors } = validate(body);
  if (Object.keys(errors).length) {
    return res.status(422).json({ ok: false, error: 'Please check the highlighted fields.', fields: errors });
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return res.status(503).json({ ok: false, error: 'The form is not switched on yet. Please email me directly.' });
  }

  const sentAt = new Date().toISOString();
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        reply_to: email,
        subject: `Portfolio message from ${name}`,
        text: `${message}\n\n---\nFrom: ${name} <${email}>\nSent: ${sentAt}\nVia: contact form on my portfolio`,
        html: `<p style="white-space:pre-wrap;font-size:15px;line-height:1.6">${escapeHtml(message)}</p><hr><p style="color:#5d6779;font-size:13px">From: ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;<br>Sent: ${sentAt}<br>Via: contact form on my portfolio. Hit reply to answer them.</p>`,
      }),
    });

    if (!r.ok) {
      const detail = await r.text().catch(() => '');
      console.error('[contact] Resend refused the email', r.status, detail.slice(0, 300));
      return res.status(502).json({ ok: false, error: 'The email service did not accept the message. Please email me directly.' });
    }

    const { id } = await r.json().catch(() => ({}));
    console.log('[contact] sent', id);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[contact] could not reach Resend', err);
    return res.status(502).json({ ok: false, error: 'Could not reach the email service. Please try again in a minute.' });
  }
}
