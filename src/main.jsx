import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { ArrowUpRight, ArrowDown, Menu, X, Github, Linkedin, Mail, MapPin, BrainCircuit, Code2, Layers, Cpu, Accessibility, Sparkles, ShieldAlert, FileText, CalendarDays, PenLine, Flag } from 'lucide-react';
import { LINKS, bookingHref } from './links.js';
import './index.css';

const NAV = ['about', 'work', 'writing', 'experience', 'contact'];

const profileLinks = [
  { label: 'LinkedIn', href: LINKS.linkedin, icon: Linkedin, external: true },
  { label: 'GitHub', href: LINKS.github, icon: Github, external: true },
  { label: 'CV', href: LINKS.cv, icon: FileText },
  { label: 'Book a call', href: bookingHref, icon: CalendarDays, external: !!LINKS.booking },
].filter(l => l.href);

const posts = [
  { kind: 'Build log', title: 'What broke while building my first agent', desc: 'The Weekly Review Coach build log: what broke, what changed, what I cut.', href: '/agent-build/', date: 'Nov 2026' },
  { kind: 'Write-up', title: 'I sabotaged my own agent ten ways', desc: 'Designing an honest state for every failure, from a dropped network to a crashed tool.', href: '/edge-cases/', date: 'Nov 2026' },
  { kind: 'Coming next', title: 'DNS, explained for my team', desc: 'What really happens between typing an address and a site answering.', date: 'Soon' },
];

const projects = [
  { title: 'Error states, empty states, edge cases', tag: 'AI SDK · Frontend', meta: 'FlyRank · FE-08', desc: 'I sabotaged my Weekly Review Coach ten ways (network, mid-stream cut, 429, malformed tool data, crashes) and gave every failure a designed state with a safe retry. Plus designed empty states, skeletons, a mobile Safari pass, and an automated test of the mid-stream failure.', tech: ['AI SDK', 'Error boundaries', 'Playwright'], href: '/edge-cases/', cta: 'See the sabotage checklist', icon: ShieldAlert, featured: true },
  { title: 'Tool results in the UI', tag: 'AI SDK · Frontend', meta: 'FlyRank · FE-07', desc: 'My Weekly Review Coach rebuilt with the AI SDK: Zod-typed server tools, four designed states for every tool call, results rendered as real components (file preview, bar chart, review card), and a plan that waits for my approval. Includes the tool definition file and the README contract.', tech: ['AI SDK', 'Zod', 'React'], href: '/tool-ui/', cta: 'See the tools and the code', icon: Layers },
  { title: 'Weekly Review Coach (live agent)', tag: 'AI Agent · Build', meta: 'FlyRank · Checkpoint 1', desc: 'The working version of my FL-06 agent: a Claude agent on Vercel that reads my notes through tools, checks my live portfolio, reviews my week and quizzes me. With the full build log: what broke, what changed, what I cut.', tech: ['Claude API', 'Tool use', 'Vercel'], href: '/agent-build/', cta: 'See the build and try it', icon: Cpu },
  { title: 'Weekly Review Coach (spec)', tag: 'AI Agent Design', meta: 'FlyRank · FL-06', desc: "Design spec for my personal AI agent: a Claude Project that reviews my internship week from my own notes, quizzes me, and drafts next week's plan. Covers the access plan, six eval cases, guardrails and platform choice.", tech: ['Claude Project', 'Evals', 'Guardrails'], href: '/agent-spec/', cta: 'Read the agent spec', icon: BrainCircuit },
  { title: 'Accessible Component Playground', tag: 'Frontend · Accessibility', meta: 'FlyRank · FE-05', desc: 'A modal dialog, tabs and a disclosure built from scratch in React + TypeScript to WAI-ARIA patterns, then compared against the shadcn/ui and Radix implementations.', tech: ['React', 'TypeScript', 'WAI-ARIA'], href: '/playground/', cta: 'Open the playground', icon: Accessibility },
  { title: 'AI Portfolio', tag: 'AI + Frontend', meta: 'This site', desc: 'A personal portfolio experience designed to present software engineering projects, skills, and AI-assisted work.', tech: ['React', 'Vite'], icon: Sparkles },
  { title: 'UtopiaHire', tag: 'AI Job Platform', desc: 'A job-platform concept focused on connecting candidates and opportunities with an AI-oriented experience.', tech: ['Angular', 'TypeScript', 'AI'], icon: Layers },
  { title: 'Mini Todo App', tag: 'Full-Stack Web', meta: 'IEC Telecom internship', desc: 'A task-management application built during a full-stack internship with a Laravel backend and React frontend.', tech: ['Laravel', 'React', 'JWT', 'Docker'], icon: Code2 },
  { title: 'Smart Bracelet', tag: 'IoT + Microservices', desc: 'An IoT architecture concept combining device management, telemetry, processing, notifications, storage, and analytics.', tech: ['ESP32', 'MQTT', 'APIs'], icon: Cpu },
];

const skillGroups = [
  { name: 'Frontend', items: ['React', 'JavaScript', 'TypeScript', 'Angular'] },
  { name: 'Backend & Data', items: ['Laravel', 'PHP', 'Python', 'MySQL', 'MongoDB', 'REST APIs'] },
  { name: 'AI & Delivery', items: ['AI / ML', 'Docker', 'AI-assisted development'] },
];

const timeline = [
  { when: '2026 — Present', role: 'Frontend AI Engineering Intern', org: 'FlyRank', text: 'Building frontend experiences while developing an AI-assisted engineering workflow.' },
  { when: '2025', role: 'Full-Stack Web Development Intern', org: 'IEC Telecom', text: 'Built a mini Todo application with Laravel, React, Vite, Tailwind, JWT, Redux Toolkit, and Docker.' },
  { when: '2024 — Present', role: 'Engineering Degree in Computer Science', org: 'EPI Digital School', text: 'Focus areas include software engineering, cybersecurity, AI, and distributed systems.' },
];

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
    const io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach(e => io.observe(e));
    return () => io.disconnect();
  }, []);
}

function useScrollSpy(ids) {
  const [active, setActive] = useState('');
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    const io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); }), { rootMargin: '-45% 0px -50% 0px' });
    ids.forEach(id => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => { window.removeEventListener('scroll', onScroll); io.disconnect(); };
  }, [ids]);
  return { active, scrolled };
}

function App() {
  const [open, setOpen] = useState(false);
  const { active, scrolled } = useScrollSpy(NAV);
  useReveal();

  return (
    <div className="site">
      <a className="skip" href="#main">Skip to content</a>
      <header className={scrolled || open ? 'nav scrolled' : 'nav'}>
        <div className="nav-inner">
          <a className="brand" href="#top" aria-label="Ichrak Matrouh, back to top">
            <img src="/logo.jfif" alt="" width="40" height="40" />
            <span>Ichrak Matrouh</span>
          </a>
          <nav id="site-nav" className={open ? 'nav-links open' : 'nav-links'} aria-label="Main">
            {NAV.map(id => <a key={id} href={'#' + id} className={active === id ? 'active' : ''} onClick={() => setOpen(false)}>{id[0].toUpperCase() + id.slice(1)}</a>)}
            <a className="nav-cta" href="mailto:matrouhichrak7@gmail.com" onClick={() => setOpen(false)}>Get in touch</a>
          </nav>
          <button className="menu" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="site-nav">{open ? <X size={22} /> : <Menu size={22} />}</button>
        </div>
      </header>

      <main id="main">
        <section id="top" className="hero">
          <div className="hero-glow" aria-hidden="true" />
          <div className="wrap hero-grid">
            <div className="hero-copy reveal">
              <p className="eyebrow light"><span className="dot" /> AI &amp; Software Engineering</p>
              <h1>Building digital experiences with <em>AI.</em></h1>
              <p className="hero-lead">I'm Ichrak Matrouh, a computer science engineering student and frontend AI engineering intern at FlyRank. I build AI products people can trust: interfaces that show what the AI is doing, handle failure honestly, and stay usable for everyone.</p>
              <div className="hero-actions">
                <a className="btn btn-light" href="#work">View my work <ArrowUpRight size={17} /></a>
                <a className="btn btn-outline" href="#contact">Let's connect</a>
              </div>
              <ul className="profile-links" aria-label="Profiles">
                {profileLinks.map(({ label, href, icon: Icon, external }) => (
                  <li key={label}><a href={href} {...(external ? { target: '_blank', rel: 'me noreferrer' } : {})}><Icon size={16} /> {label}</a></li>
                ))}
              </ul>
            </div>
            <aside className="now-card reveal" aria-label="Current status" style={{ '--d': '120ms' }}>
              <p className="now-label">Currently</p>
              <p className="now-role">Frontend AI Engineering Intern</p>
              <p className="now-org">FlyRank</p>
              <hr />
              <ul>
                <li><MapPin size={15} /> Sousse, Tunisia</li>
                <li><span className="live" /> Open to opportunities</li>
              </ul>
              <a className="now-link" href="/edge-cases/">Latest: FE-08, error and empty states <ArrowUpRight size={15} /></a>
            </aside>
          </div>
          <div className="wrap focus-strip reveal">
            {['Software Engineering', 'Artificial Intelligence', 'Full-stack Web', 'Connected Systems'].map(f => <span key={f}>{f}</span>)}
          </div>
          <a className="scroll-cue" href="#about" aria-label="Scroll to About"><ArrowDown size={16} /></a>
        </section>

        <section id="about" className="section">
          <div className="wrap split">
            <div className="reveal">
              <p className="eyebrow">01 — About</p>
              <h2>Curious by nature.<br /><em>Builder by choice.</em></h2>
            </div>
            <div className="prose reveal">
              <p className="big">I combine software engineering fundamentals with AI to turn ideas into useful digital experiences.</p>
              <p>My work spans frontend development, backend APIs, machine learning, and connected systems. I care about clean interfaces, thoughtful product decisions, and using AI as a development partner, not a replacement for engineering judgment.</p>
              <div className="facts">
                <div><b>CS</b><span>Engineering degree</span></div>
                <div><b>AI</b><span>Focused</span></div>
                <div><b>Web</b><span>Full-stack</span></div>
              </div>
            </div>
          </div>
        </section>

        <section id="skills" className="section tinted">
          <div className="wrap">
            <div className="section-head reveal">
              <div><p className="eyebrow">02 — Toolkit</p><h2>Skills that turn ideas <em>into products.</em></h2></div>
            </div>
            <div className="skill-groups">
              {skillGroups.map((g, i) => (
                <div className="skill-group reveal" key={g.name} style={{ '--d': `${i * 80}ms` }}>
                  <p className="group-name">{g.name}</p>
                  <div className="chips">{g.items.map(s => <span key={s}>{s}</span>)}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="work" className="section">
          <div className="wrap">
            <div className="section-head reveal">
              <div><p className="eyebrow">03 — Selected work</p><h2>Projects with a <em>purpose.</em></h2></div>
              <p className="section-note">Academic, internship, AI, web, and IoT work, including my FlyRank assignments.</p>
            </div>
            <div className="work-grid">
              {projects.map((p, i) => {
                const Icon = p.icon;
                const Tag = p.href ? 'a' : 'article';
                return (
                  <Tag key={p.title} className={'card reveal' + (p.featured ? ' featured' : '') + (p.href ? ' linked' : '')} {...(p.href ? { href: p.href } : {})} style={{ '--d': `${(i % 2) * 80}ms` }}>
                    <div className="card-top">
                      <span className="card-icon"><Icon size={20} /></span>
                      <span className="card-num">{String(i + 1).padStart(2, '0')}</span>
                    </div>
                    <p className="card-tag">{p.tag}{p.meta && <span> · {p.meta}</span>}</p>
                    <h3>{p.title}</h3>
                    <p className="card-desc">{p.desc}</p>
                    <div className="card-foot">
                      <ul className="tech">{p.tech.map(t => <li key={t}>{t}</li>)}</ul>
                      {p.href && <span className="card-cta">{p.cta} <ArrowUpRight size={16} /></span>}
                    </div>
                  </Tag>
                );
              })}
            </div>
          </div>
        </section>

        <section id="writing" className="section tinted">
          <div className="wrap">
            <div className="section-head reveal">
              <div><p className="eyebrow">04 — Writing &amp; capstone</p><h2>Notes from <em>the build.</em></h2></div>
              <p className="section-note">Short posts about what I'm building and learning, and the home of my FlyRank capstone.</p>
            </div>
            <div className="writing-grid">
              <a className="capstone reveal" href="/agent-build/">
                <span className="capstone-badge"><Flag size={14} /> Capstone · in progress</span>
                <h3>Weekly Review Coach</h3>
                <p>A Claude agent that reads my weekly notes through tools, reviews my week, and quizzes me. Spec, live build, tool UI and failure states are done; the final capstone lands here, with the FlyRank completion badge once it's approved.</p>
                <span className="card-cta">Follow the build <ArrowUpRight size={16} /></span>
              </a>
              <ol className="posts">
                {posts.map((p, i) => {
                  const Tag = p.href ? 'a' : 'div';
                  return (
                    <li key={p.title} className="reveal" style={{ '--d': `${i * 80}ms` }}>
                      <Tag className={'post' + (p.href ? ' linked' : ' soon')} {...(p.href ? { href: p.href } : {})}>
                        <span className="post-meta"><PenLine size={13} /> {p.kind} · {p.date}</span>
                        <span className="post-title">{p.title}</span>
                        <span className="post-desc">{p.desc}</span>
                      </Tag>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </section>

        <section id="experience" className="section">
          <div className="wrap split">
            <div className="reveal">
              <p className="eyebrow">05 — Experience</p>
              <h2>Learning through <em>real work.</em></h2>
            </div>
            <ol className="timeline">
              {timeline.map(t => (
                <li className="reveal" key={t.role}>
                  <span className="when">{t.when}</span>
                  <h3>{t.role}</h3>
                  <p className="org">{t.org}</p>
                  <p>{t.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="contact" className="contact">
          <div className="wrap contact-grid">
            <div className="reveal">
              <p className="eyebrow light">06 — Contact</p>
              <h2>Have an idea?<br /><em>Let's build it.</em></h2>
              <p className="hero-lead">I'm open to internships, remote opportunities, collaborations, and AI/software projects.</p>
            </div>
            <div className="contact-card reveal" style={{ '--d': '100ms' }}>
              <a className="mail" href={`mailto:${LINKS.email}`}><Mail size={18} /> <span>{LINKS.email}</span> <ArrowUpRight size={16} /></a>
              <a className="mail" href={bookingHref} {...(LINKS.booking ? { target: '_blank', rel: 'noreferrer' } : {})}><CalendarDays size={18} /> <span>Book a 20-minute call</span> <ArrowUpRight size={16} /></a>
              <a className="mail" href={LINKS.cv}><FileText size={18} /> <span>View my CV</span> <ArrowUpRight size={16} /></a>
              <p><MapPin size={18} /> Sousse, Tunisia</p>
              <div className="socials">
                <a href={LINKS.github} target="_blank" rel="me noreferrer" aria-label="GitHub"><Github size={18} /></a>
                {LINKS.linkedin && <a href={LINKS.linkedin} target="_blank" rel="me noreferrer" aria-label="LinkedIn"><Linkedin size={18} /></a>}
              </div>
            </div>
          </div>
          <footer className="wrap footer"><span>© 2026 Ichrak Matrouh</span><span>AI · Software · Technology</span></footer>
        </section>
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
