// Shared contact form rules, used by the server (api/contact.js) and the browser (src/ContactForm.jsx).
// The leading underscore keeps Vercel from turning this file into its own endpoint.

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
