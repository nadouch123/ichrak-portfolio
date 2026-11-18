# Explain It Like You Built It — How my nav links connect to the sections

*Draft for you to rewrite in your own voice before submitting.*

## Quick tutoring notes (what's actually in the code)

All of this lives in `src/main.jsx` and `src/index.css`.

1. **Each section has a name tag.** Every `<section>` has an `id`: `home`, `about`, `skills`, `projects`, `experience`, `contact`.
2. **The menu is built from a list, not typed out six times.** `['home','about','skills','projects','experience','contact'].map(...)` turns each word into a link. The label is the same word with a capital first letter (`x[0].toUpperCase()+x.slice(1)`), and the link points to `'#'+x`, e.g. `#projects`.
3. **Clicking runs one helper, `go(id)`.** It does three things: remembers which link is active (`setActive`), closes the phone menu (`setOpen(false)`), and finds the section by its id and scrolls to it smoothly (`document.getElementById(id)?.scrollIntoView({behavior:'smooth'})`). `html{scroll-behavior:smooth}` in the CSS is a backup for plain `#` links.
4. **The highlight is just a CSS class.** The link whose name matches `active` gets `className="active"`, and `.nav-links a.active` turns it blue.
5. **The phone menu is the same links, hidden.** Under 850px wide, CSS hides `.nav-links` and shows the hamburger button. Tapping it flips `open`, which adds the `open` class, and `.nav-links.open{display:flex}` makes the list appear.
6. **The hero buttons reuse it.** "View my work" and "Let's connect" call `go('projects')` and `go('contact')`.

One honest limitation I noticed: the blue highlight only changes when you *click*. If you scroll down with your mouse wheel, it stays on whatever you clicked last.

## Draft explanation (~200 words)

I picked the navigation bar on my portfolio, because I wanted to know what actually happens when you click "Projects" and the page glides down.

It works like a table of contents in a book. Every part of my page is a section, and I gave each one a name tag called an id: home, about, skills, projects, experience and contact. Instead of writing six links by hand, my code keeps those six names in a list and turns each one into a link, so the menu and the sections always use the same names.

When you click a link, one small function does three jobs. It finds the section with the matching name tag and smoothly scrolls the page to it. It remembers which link you clicked so that link turns blue. And it closes the menu if you're on a phone.

On a phone the screen is too narrow for six links, so the styling hides them and shows a hamburger button. Tapping it just flips a switch between "open" and "closed", and "open" makes the same list drop down.

One thing I learned: the blue highlight only updates when you click, not when you scroll, so that's what I'd improve next.

## Self-check questions (answer these without looking)

1. If I added a new section called "Blog", what two things would I need to add so the nav link works?
2. Why does the menu close by itself after you tap a link on your phone?
3. Why doesn't the blue highlight move when you just scroll with the mouse, and what would have to change to fix that?
