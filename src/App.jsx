import { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { NOTES, MAIN, SUPPORT } from './slides.js'

const Scene = lazy(() => import('./Scene.jsx'))

const LABELS = ['Title', 'The facts', 'The setting', 'The plot', 'Main cast', 'Secondary', 'Case closed']

function Silhouette({ tag }) {
  return (
    <svg viewBox="0 0 100 100" className="silhouette" aria-hidden="true">
      <defs>
        <linearGradient id={`g-${tag}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a3a42" />
          <stop offset="1" stopColor="#15151a" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill={`url(#g-${tag})`} />
      <circle cx="50" cy="40" r="17" fill="#0b0b0d" />
      <path d="M14 100 C18 70 34 62 50 62 C66 62 82 70 86 100 Z" fill="#0b0b0d" />
      <text x="88" y="16" textAnchor="end" className="sil-tag">{tag}</text>
    </svg>
  )
}

// Splits a heading into words that rise out of a mask.
function Words({ lines }) {
  return lines.map((line, li) => (
    <span className="line" key={li}>
      {line.split(' ').map((w, wi) => (
        <span className="w-mask" key={wi}>
          <span className="w">{w}</span>
        </span>
      ))}
    </span>
  ))
}

// Cast photo slot: shows the image if one is set, otherwise a silhouette.
function Photo({ src, tag }) {
  const [ok, setOk] = useState(Boolean(src))
  if (src && ok) return <img className="photo" src={src} alt="" onError={() => setOk(false)} />
  return <Silhouette tag={tag} />
}

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#/0123456789'
function scramble(tl, node, at, d) {
  const text = node.dataset.text || (node.dataset.text = node.textContent)
  const o = { p: 0 }
  tl.to(o, {
    p: 1, duration: 0.9 * d, ease: 'none',
    onUpdate: () => {
      const n = Math.floor(o.p * text.length)
      let tail = ''
      for (let k = n; k < Math.min(text.length, n + 4); k++) tail += text[k] === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0]
      node.textContent = text.slice(0, n) + tail
    },
    onComplete: () => { node.textContent = text },
  }, at)
}

function TitleSlide() {
  return (
    <div className="slide-inner title-slide">
      <p className="kicker reveal scramble">A crime comedy-drama series</p>
      <h1 className="title-word" aria-label="Castle">
        {'CASTLE'.split('').map((l, i) => (
          <span className="ltr-mask" key={i}>
            <span className="ltr">{l}</span>
          </span>
        ))}
      </h1>
      <p className="lede reveal">
        A mystery writer.<br />A detective.<br /><em>New York City.</em>
      </p>
    </div>
  )
}

function FactsSlide() {
  const facts = [
    { k: 'Network', v: 'ABC' },
    { k: 'First episode', v: 'March 9, 2009' },
    { k: 'Last episode', v: 'May 16, 2016' },
    { k: 'Created by', v: 'Andrew W. Marlowe' },
  ]
  return (
    <div className="slide-inner right">
      <p className="exhibit reveal scramble">Exhibit A</p>
      <h2><Words lines={['The facts']} /></h2>
      <div className="big-numbers">
        <div className="big reveal">
          <span className="num" data-count="8">0</span>
          <span className="cap">seasons</span>
        </div>
        <div className="big reveal">
          <span className="num" data-count="173">0</span>
          <span className="cap">episodes</span>
        </div>
      </div>
      <dl className="facts">
        {facts.map((f) => (
          <div className="fact reveal" key={f.k}>
            <dt>{f.k}</dt>
            <dd>{f.v}</dd>
          </div>
        ))}
      </dl>
      <p className="genre reveal">Crime · Mystery · Comedy-drama</p>
    </div>
  )
}

function SettingSlide() {
  const places = [
    { n: '01', t: 'The 12th Precinct', d: 'The NYPD station where the team works on the cases.' },
    { n: '02', t: 'Crime scenes', d: 'All over Manhattan, a new one every episode.' },
    { n: '03', t: "Castle's loft", d: 'Where he lives with his mother and his daughter.' },
  ]
  return (
    <div className="slide-inner setting">
      <p className="exhibit reveal scramble">Exhibit B · The setting</p>
      <h2 className="huge"><Words lines={['New York', 'City']} /></h2>
      <ul className="places">
        {places.map((p) => (
          <li className="place reveal" key={p.n}>
            <span className="pn">{p.n}</span>
            <div>
              <h3>{p.t}</h3>
              <p>{p.d}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function PlotSlide() {
  const steps = [
    'A killer starts copying the murders from Richard Castle’s novels.',
    'Detective Kate Beckett asks him for help with the case.',
    'Castle uses her as inspiration for a new character, Nikki Heat, and stays to help solve cases.',
  ]
  return (
    <div className="slide-inner left">
      <p className="exhibit reveal scramble">Exhibit C · The story</p>
      <h2><Words lines={['The plot']} /></h2>
      <ol className="steps">
        {steps.map((s, i) => (
          <li className="step reveal" key={i}>
            <span className="sn">{i + 1}</span>
            <p>{s}</p>
          </li>
        ))}
      </ol>
      <div className="big-case reveal">
        <span className="tape">The big case</span>
        <p>Who killed Beckett’s mother?</p>
      </div>
    </div>
  )
}

function MainSlide() {
  const pin = (c) => [c.pos[0] + 9, c.pos[1] + 2]
  const pins = MAIN.map(pin)
  const sag = (a, b, s) => `M${a[0]} ${a[1]} Q${(a[0] + b[0]) / 2} ${Math.max(a[1], b[1]) + s} ${b[0]} ${b[1]}`
  return (
    <div className="slide-inner board-wrap">
      <div className="board-head">
        <p className="exhibit reveal scramble">Persons of interest</p>
        <h2><Words lines={['Main characters']} /></h2>
      </div>
      <div className="board">
        <svg className="strings" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path className="string" d={sag(pins[0], pins[1], 4)} />
          <path className="string" d={sag(pins[1], pins[2], 4)} />
          <path className="string" d={sag(pins[2], pins[3], 4)} />
        </svg>
        {MAIN.map((c) => (
          <figure
            className="polaroid tilt"
            key={c.tag}
            data-tilt={c.tilt}
            style={{ left: `${c.pos[0]}%`, top: `${c.pos[1]}%` }}
          >
            <span className="pushpin" />
            <Photo src={c.img} tag={c.tag} />
            <figcaption>
              <strong>{c.name}</strong>
              <span className="role">{c.role}</span>
              <span className="actor">{c.actor}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}

function SupportSlide() {
  return (
    <div className="slide-inner right support">
      <p className="exhibit reveal scramble">Also on the case</p>
      <h2><Words lines={['Secondary', 'characters']} /></h2>
      <ul className="files">
        {SUPPORT.map((s, i) => (
          <li className="file reveal tilt" key={s.name}>
            <span className="fno">S-0{i + 1}</span>
            {s.img && <img className="fthumb" src={s.img} alt={s.name} />}
            <div className="fbody">
              <strong>{s.name}</strong>
              <span>{s.role}</span>
            </div>
            <span className="factor">{s.actor}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ClosingSlide() {
  return (
    <div className="slide-inner closing">
      <div className="stamp" aria-label="Case closed">Case<br />closed</div>
      <p className="why reveal">Why watch it? It’s funny and smart at the same time,<br />and every episode is a new mystery.</p>
      <h2 className="thanks"><Words lines={['Thank you!']} /></h2>
      <p className="byline reveal">Questions?</p>
    </div>
  )
}

const SLIDES = [TitleSlide, FactsSlide, SettingSlide, PlotSlide, MainSlide, SupportSlide, ClosingSlide]

export default function App() {
  const [index, setIndex] = useState(0)
  const [notes, setNotes] = useState(false)
  const slideRefs = useRef([])
  const flashRef = useRef()
  const wipeRef = useRef()
  const cursorRef = useRef()
  const mainRef = useRef()
  const prev = useRef(-1)
  const total = SLIDES.length

  const go = useCallback((n) => setIndex((i) => Math.max(0, Math.min(total - 1, typeof n === 'function' ? n(i) : n))), [total])

  useEffect(() => {
    const onKey = (e) => {
      if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); go((i) => i + 1) }
      else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); go((i) => i - 1) }
      else if (e.key === 'Home') go(0)
      else if (e.key === 'End') go(total - 1)
      else if (e.key.toLowerCase() === 'n') setNotes((v) => !v)
      else if (e.key.toLowerCase() === 'f') {
        if (document.fullscreenElement) document.exitFullscreen()
        else document.documentElement.requestFullscreen?.()
      }
    }
    let sx = null
    const ts = (e) => { sx = e.touches[0].clientX }
    const te = (e) => {
      if (sx == null) return
      const dx = e.changedTouches[0].clientX - sx
      if (Math.abs(dx) > 50) go((i) => i + (dx < 0 ? 1 : -1))
      sx = null
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('touchstart', ts, { passive: true })
    window.addEventListener('touchend', te)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('touchstart', ts)
      window.removeEventListener('touchend', te)
    }
  }, [go, total])

  // Pointer effects: custom cursor, slight parallax of the text layer, 3D tilt on cards.
  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const cx = gsap.quickTo(cursorRef.current, 'x', { duration: 0.25, ease: 'power3' })
    const cy = gsap.quickTo(cursorRef.current, 'y', { duration: 0.25, ease: 'power3' })
    const px = gsap.quickTo(mainRef.current, 'x', { duration: 1.2, ease: 'power3' })
    const py = gsap.quickTo(mainRef.current, 'y', { duration: 1.2, ease: 'power3' })
    let hovered = null
    const move = (e) => {
      cx(e.clientX); cy(e.clientY)
      if (!reduce) {
        px((e.clientX / innerWidth - 0.5) * -18)
        py((e.clientY / innerHeight - 0.5) * -12)
      }
      const card = e.target.closest?.('.tilt')
      if (card !== hovered) {
        if (hovered) gsap.to(hovered, { rotationX: 0, rotationY: 0, scale: 1, duration: 0.6, ease: 'power3.out' })
        hovered = card
      }
      if (card && !reduce) {
        const r = card.getBoundingClientRect()
        const nx = (e.clientX - r.left) / r.width - 0.5
        const ny = (e.clientY - r.top) / r.height - 0.5
        gsap.to(card, { rotationY: nx * 18, rotationX: -ny * 18, scale: 1.04, transformPerspective: 700, duration: 0.4, ease: 'power2.out' })
      }
      const big = e.target.closest?.('button, .tilt')
      cursorRef.current.classList.toggle('big', Boolean(big))
    }
    window.addEventListener('pointermove', move)
    document.body.classList.add('has-cursor')
    return () => window.removeEventListener('pointermove', move)
  }, [])

  useLayoutEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const els = slideRefs.current
    const from = prev.current
    const dir = index > from ? 1 : -1
    const el = els[index]
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

    els.forEach((s, i) => { if (i !== index && i !== from) gsap.set(s, { autoAlpha: 0 }) })

    if (from >= 0 && els[from]) {
      // Outgoing slide smears sideways like a fast pan (directional blur).
      tl.to(els[from], { autoAlpha: 0, x: -90 * dir, skewX: -6 * dir, filter: 'blur(14px)', duration: reduce ? 0 : 0.5, ease: 'power2.in' }, 0)
      tl.fromTo(flashRef.current, { autoAlpha: 0 }, { autoAlpha: 0.22, duration: 0.08, yoyo: true, repeat: 1 }, 0.42)
      // Red evidence-tape wipe across the screen.
      tl.fromTo(wipeRef.current, { scaleX: 0, transformOrigin: dir > 0 ? '0% 50%' : '100% 50%' }, { scaleX: 1, duration: 0.32 * (reduce ? 0 : 1), ease: 'power3.in' }, 0.12)
        .set(wipeRef.current, { transformOrigin: dir > 0 ? '100% 50%' : '0% 50%' })
        .to(wipeRef.current, { scaleX: 0, duration: 0.4 * (reduce ? 0 : 1), ease: 'power3.out' })
    }
    tl.set(el, { autoAlpha: 1, x: 0, skewX: 0, filter: 'blur(0px)' }, from >= 0 ? 0.5 : 0)
    const at = from >= 0 ? 0.55 : 0.4
    const d = reduce ? 0 : 1

    tl.fromTo(el.querySelectorAll('.reveal'),
      { y: 40, autoAlpha: 0, filter: 'blur(8px)' },
      { y: 0, autoAlpha: 1, filter: 'blur(0px)', duration: 0.9 * d, stagger: 0.08 * d }, at)

    const words = el.querySelectorAll('.w')
    if (words.length) tl.fromTo(words, { yPercent: 115, rotation: 6 }, { yPercent: 0, rotation: 0, duration: 1 * d, stagger: 0.09 * d, ease: 'expo.out' }, at + 0.05)

    el.querySelectorAll('.scramble').forEach((n) => scramble(tl, n, at, d || 0.001))

    const letters = el.querySelectorAll('.ltr')
    if (letters.length) tl.fromTo(letters, { yPercent: 110, rotationX: -80 }, { yPercent: 0, rotationX: 0, duration: 1.1 * d, stagger: 0.07 * d, ease: 'expo.out' }, at)

    el.querySelectorAll('[data-count]').forEach((n) => {
      const o = { v: 0 }
      tl.to(o, { v: +n.dataset.count, duration: 1.6 * d, ease: 'power2.out', onUpdate: () => { n.textContent = Math.round(o.v) } }, at + 0.3)
    })

    const strings = el.querySelectorAll('.string')
    if (strings.length) {
      tl.fromTo(el.querySelectorAll('.polaroid'),
        { y: -60, autoAlpha: 0, rotation: (i) => (i % 2 ? 14 : -14) },
        { y: 0, autoAlpha: 1, rotation: (i, t) => +t.dataset.tilt, duration: 0.9 * d, stagger: 0.12 * d, ease: 'back.out(1.6)' }, at)
      tl.fromTo(el.querySelector('.strings'), { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2 * d, ease: 'power2.inOut' }, at + 0.6)
    }

    const stamp = el.querySelector('.stamp')
    if (stamp) tl.fromTo(stamp, { scale: 2.6, rotation: -30, autoAlpha: 0 }, { scale: 1, rotation: -12, autoAlpha: 1, duration: 0.45 * d, ease: 'power4.in' }, at + 0.1)
      .fromTo('.app', { x: -6 }, { x: 0, duration: 0.3 * d, ease: 'elastic.out(1, 0.3)' }, '>')

    prev.current = index
    return () => tl.progress(1).kill()
  }, [index])

  return (
    <div className="app">
      <Suspense fallback={null}>
        <Scene index={index} />
      </Suspense>
      <div className="grain" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />
      <div className="flash" ref={flashRef} aria-hidden="true" />
      <div className="wipe" ref={wipeRef} aria-hidden="true" />
      <div className="cursor" ref={cursorRef} aria-hidden="true" />

      <header className="topbar">
        <span className="brand">Castle <i>/</i> Case file</span>
        <span className="hint">← → navigate · N notes · F fullscreen</span>
      </header>

      <main className="slides" ref={mainRef} onClick={(e) => { if (!e.target.closest('button, a')) go((i) => i + 1) }}>
        {SLIDES.map((S, i) => (
          <section
            key={i}
            className="slide"
            ref={(r) => (slideRefs.current[i] = r)}
            aria-hidden={i !== index}
          >
            <S />
          </section>
        ))}
      </main>

      {notes && (
        <aside className="notes" onClick={(e) => e.stopPropagation()}>
          <span className="notes-label">Speaker notes · {LABELS[index]}</span>
          <p>{NOTES[index]}</p>
        </aside>
      )}

      <nav className="bottombar">
        <span className="caseno">CASE #{String(index + 1).padStart(2, '0')} <i>/ {String(total).padStart(2, '0')}</i></span>
        <div className="film">
          {LABELS.map((l, i) => (
            <button key={l} className={`frame ${i === index ? 'on' : ''} ${i < index ? 'seen' : ''}`} onClick={() => go(i)} aria-label={l}>
              <span>{l}</span>
            </button>
          ))}
        </div>
        <div className="arrows">
          <button onClick={() => go((i) => i - 1)} disabled={index === 0} aria-label="Previous">←</button>
          <button onClick={() => go((i) => i + 1)} disabled={index === total - 1} aria-label="Next">→</button>
        </div>
      </nav>
    </div>
  )
}
