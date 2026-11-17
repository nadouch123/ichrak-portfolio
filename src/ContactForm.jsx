import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const EMPTY = { name: '', email: '', message: '', company: '' };

// Status: idle -> sending -> sent | error
export default function ContactForm({ fallbackEmail }) {
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [fields, setFields] = useState({});

  const update = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (fields[key]) setFields((f) => ({ ...f, [key]: undefined }));
  };

  async function onSubmit(e) {
    e.preventDefault();
    setStatus('sending');
    setError('');
    setFields({});
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setStatus('sent');
        setForm(EMPTY);
        return;
      }
      setFields(data.fields || {});
      setError(data.error || 'Something went wrong. Please try again.');
      setStatus('error');
    } catch {
      setError('You seem to be offline. Your message is still here, try again when you are back.');
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div className="contact-card form-done" role="status">
        <CheckCircle2 size={28} />
        <h3>Message sent.</h3>
        <p>Thank you. It's on its way to my inbox, and I'll reply by email, usually within two days.</p>
        <button type="button" className="link-btn" onClick={() => setStatus('idle')}>Send another message</button>
      </div>
    );
  }

  const sending = status === 'sending';
  const err = (k) => fields[k] && <span className="field-err" id={`${k}-err`}>{fields[k]}</span>;
  // aria-labelledby keeps the field's name to just "Name"/"Email"/"Message": the error span sits inside the
  // <label>, so without it the error text would become part of the name and be read out twice.
  const aria = (k) => ({ 'aria-labelledby': `${k}-label`, ...(fields[k] ? { 'aria-invalid': true, 'aria-describedby': `${k}-err` } : {}) });

  return (
    <form className="contact-card contact-form" onSubmit={onSubmit} noValidate>
      <p className="form-title">Send me a message</p>
      <label>
        <span id="name-label">Name</span>
        <input name="name" autoComplete="name" required maxLength={100} value={form.name} onChange={update('name')} disabled={sending} {...aria('name')} />
        {err('name')}
      </label>
      <label>
        <span id="email-label">Email</span>
        <input name="email" type="email" autoComplete="email" required maxLength={200} value={form.email} onChange={update('email')} disabled={sending} {...aria('email')} />
        {err('email')}
      </label>
      <label>
        <span id="message-label">Message</span>
        <textarea name="message" rows={5} required minLength={10} maxLength={5000} value={form.message} onChange={update('message')} disabled={sending} {...aria('message')} />
        {err('message')}
      </label>
      {/* Spam trap: hidden from people and screen readers, bots tend to fill it. */}
      <label className="hp" aria-hidden="true">
        Company <input name="company" tabIndex={-1} autoComplete="off" value={form.company} onChange={update('company')} />
      </label>
      {status === 'error' && (
        <p className="form-error" role="alert">
          <AlertCircle size={18} /> <span>{error} {fallbackEmail && <>Or write to <a href={`mailto:${fallbackEmail}`}>{fallbackEmail}</a>.</>}</span>
        </p>
      )}
      <button className="btn btn-light form-submit" type="submit" disabled={sending}>
        {sending ? <><Loader2 size={18} className="spin" /> Sending…</> : <><Send size={18} /> Send message</>}
      </button>
    </form>
  );
}
