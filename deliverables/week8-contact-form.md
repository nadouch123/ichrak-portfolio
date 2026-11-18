# Make It Do Something: my contact form, in plain words

*Draft for me to rewrite in my own voice before submitting.*

**Live:** https://ichrak-portfolio-seven.vercel.app/#contact
**Code:** `src/ContactForm.jsx` (the form) and `api/contact.js` (the backend)

## What a backend is

My portfolio used to be only a frontend: files that get downloaded and run inside the visitor's browser. Anything in those files, anyone can read. A backend is code that runs on a server I control instead of on the visitor's computer. It can keep secrets, check what people send, and talk to other services on my behalf. Mine is a single small function that Vercel runs only when someone sends a message, so I don't keep a server running all the time and it costs nothing on the free tier.

## What my feature does

A visitor fills in their name, email and a message and presses **Send message**. A few seconds later the message lands in my Gmail inbox, and when I hit Reply, my answer goes straight to the visitor's email. If something goes wrong, the form tells them what happened, keeps what they typed, and offers my email address instead.

## How the data flows

1. **Browser.** The form (React) collects the three fields and sends them as JSON to my own address, `/api/contact`, with a POST request. The button changes to "Sending…".
2. **My function on Vercel.** `api/contact.js` receives the JSON. It checks everything again, because anything coming from a browser can be faked: is there a name, does the email look like an email, is the message between 10 and 5,000 characters. If something is wrong, it sends back an error for each field and the form highlights them. There is also a hidden "company" field that people never see. Bots fill in every field, so if that one has text, the function says "ok" but sends nothing.
3. **Resend.** If the data is good, the function calls Resend's email API. To prove it's me, it attaches my secret API key, which is stored in Vercel's environment variables and never appears in the browser code. That is the main reason this needs a backend: if the key were in the frontend, anyone could copy it and send email as me.
4. **My inbox.** Resend delivers the email to my Gmail. The subject is "Portfolio message from [name]", and the reply-to address is the visitor's email.
5. **Back to the browser.** Resend tells my function it accepted the email, my function answers the browser with `{ ok: true }`, and the form shows "Message sent."

```
Visitor's browser --(name, email, message)--> /api/contact on Vercel --(+ secret key)--> Resend --> my Gmail
        ^                                            |
        +------------- "ok" or a clear error <-------+
```

## Free tiers used

- **Vercel Hobby:** hosts the site and runs the function.
- **Resend free plan:** 3,000 emails a month, 100 a day. That is far more than a portfolio needs.

## How I tested it

I sent a real message through the live form and it reached my inbox (screenshot attached). I also tested the failure cases: empty fields, a bad email address, the bot trap, and what happens when the API key is missing.

## What I'd add next

Rate limiting per visitor and my own domain as the sender. For now, the honeypot and server-side checks are enough at this scale.
