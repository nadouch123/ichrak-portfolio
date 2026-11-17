// One place for every outside link on the site (PF-04).
// Swap a value here and every button that uses it updates.
export const LINKS = {
  site: 'https://ichrak-matrouh.vercel.app',
  email: 'matrouhichrak7@gmail.com',
  github: 'https://github.com/nadouch123',
  // TODO: replace with the real LinkedIn profile URL (linkedin.com/in/...)
  linkedin: '',
  // The CV is a page on this site, so it can never go stale or 404.
  cv: '/cv/',
  // TODO: replace with a Cal.com or Calendly link. Until then, "Book a call" opens an email.
  booking: '',
};

export const bookingHref = LINKS.booking || `mailto:${LINKS.email}?subject=${encodeURIComponent('Booking a 20-minute call')}`;
