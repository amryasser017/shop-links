import { useEffect, useRef } from 'react'
import { lampMarkup } from './lampMarkup.js'
import { login, setToken } from '../lib/api.js'
import './lamp.css'

const ERRORS = {
  invalid_credentials: 'Wrong email or password.',
  admin_not_configured: 'Admin is not configured on the server.',
}

export default function LampLogin({ onDone }) {
  const ref = useRef(null)
  const doneRef = useRef(onDone)

  useEffect(() => { doneRef.current = onDone })

  useEffect(() => {
    const root = ref.current
    const $ = (s) => root.querySelector(s)
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const stage = $('#stage'), lampWrap = $('#lampWrap'), glow = $('#roomGlow')
    const card = $('#card'), cardWrap = $('#cardWrap')
    const cleanups = []
    const timers = []
    const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t }
    const on = (el, ev, fn, opt) => { el.addEventListener(ev, fn, opt); cleanups.push(() => el.removeEventListener(ev, fn, opt)) }

    /* shade pleats */
    let p = ''
    const N = 22
    for (let i = 0; i <= N; i++) {
      const t = i / N, x1 = 96 + t * 108, x2 = 50 + t * 200
      p += `<line x1="${x1.toFixed(1)}" y1="40" x2="${x2.toFixed(1)}" y2="150" stroke="rgba(255,255,255,.05)" stroke-width="1"/>`
      p += `<line class="lit" x1="${x1.toFixed(1)}" y1="40" x2="${x2.toFixed(1)}" y2="150" stroke="rgba(110,60,15,.28)" stroke-width="1"/>`
    }
    $('#pleats').innerHTML = p

    /* light state: off <-> on. Pull once = light + login, pull again = dark + login gone */
    let isOn = false
    let lit = 0, target = 0, rate = 6
    const hint = $('#hint'), hintLine = $('#hintLine')
    let flicker = []
    const setTarget = (v, r) => { target = v; rate = r }

    function toggle() {
      isOn = !isOn
      flicker.forEach(clearTimeout); flicker = []
      if (isOn) {
        if (reduce) setTarget(1, 8)
        else [[.65, 0], [.08, 70], [.9, 150], [.25, 230], [1, 330]].forEach(([v, ms]) => flicker.push(setTimeout(() => setTarget(v, 30), ms)))
        later(() => { card.classList.add('on'); scrollToCard() }, reduce ? 0 : 420)
      } else {
        card.classList.remove('on')
        card.querySelectorAll('input').forEach((i) => i.blur())
        setTarget(0, 5)
      }
      hint.style.opacity = 0; hintLine.style.opacity = 0
      later(() => {
        hint.textContent = isOn ? 'PULL AGAIN TO TURN OFF' : 'PULL THE CHAIN'
        hint.style.opacity = 1; hintLine.style.opacity = 1
      }, 500)
    }

    function scrollToCard() {
      if (innerWidth >= 860) return
      later(() => { try { card.scrollIntoView({ behavior: 'smooth', block: 'center' }) } catch { /* ignore */ } }, 500)
    }

    /* chain physics */
    const svg = $('#lamp'), chain = $('#chain'), chainThin = $('#chainThin'), handle = $('#handle'), hit = $('#hitArea')
    const AX = 162, AY = 152, L = 110
    let pull = 0, pv = 0, sx = 0, sv = 0, dragging = false, moved = 0, startX = 0, startY = 0, used = false

    function drawChain() {
      const ex = AX + sx, ey = AY + L + pull
      const cx = AX + sx * 0.45 + sv * 0.12, cy = (AY + ey) / 2
      const d = `M${AX} ${AY} Q${cx.toFixed(2)} ${cy.toFixed(2)} ${ex.toFixed(2)} ${ey.toFixed(2)}`
      chain.setAttribute('d', d); chainThin.setAttribute('d', d)
      const tilt = Math.atan2(ex - cx, ey - cy) * -57.3
      handle.setAttribute('transform', `translate(${ex.toFixed(2)} ${ey.toFixed(2)}) rotate(${tilt.toFixed(2)})`)
      hit.setAttribute('cx', ex); hit.setAttribute('cy', ey + 4)
      const hy = ey + 8
      hintLine.setAttribute('y1', hy); hintLine.setAttribute('y2', hy)
      hintLine.setAttribute('x1', ex + 16); hintLine.setAttribute('x2', ex + 30)
      hint.setAttribute('y', hy + 3.5); hint.setAttribute('x', ex + 36)
    }

    const scale = () => svg.getBoundingClientRect().width / 300
    on(hit, 'pointerdown', (e) => {
      dragging = true; moved = 0; startX = e.clientX; startY = e.clientY
      try { hit.setPointerCapture(e.pointerId) } catch { /* ignore */ }
      e.preventDefault()
    })
    on(hit, 'pointermove', (e) => {
      if (!dragging) return
      const k = scale()
      const dy = (e.clientY - startY) / k, dx = (e.clientX - startX) / k
      moved = Math.max(moved, Math.hypot(dx, dy))
      pull = Math.max(0, Math.min(46, dy)); pv = 0
      sx = Math.max(-16, Math.min(16, dx * 0.45)); sv = 0
    })
    const release = () => {
      if (!dragging) return
      dragging = false
      const fire = pull > 18 || moved < 6
      if (moved < 6) pv = 300
      sv += (Math.random() - .5) * 60
      if (fire) { used = true; toggle() }
    }
    on(hit, 'pointerup', release)
    on(hit, 'pointercancel', release)
    on(hit, 'keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pv = 300; used = true; toggle() } })

    const nudge = setInterval(() => { if (!used && !dragging && !reduce) { pv = 140; sv = 30 } }, 3600)
    cleanups.push(() => clearInterval(nudge))

    /* layout */
    function layout() {
      const s = stage.getBoundingClientRect(), r = lampWrap.getBoundingClientRect()
      glow.style.setProperty('--lx', (r.left - s.left + r.width / 2) + 'px')
      glow.style.setProperty('--ly', (r.top - s.top + r.height * 0.28) + 'px')
    }
    on(window, 'resize', layout); layout()
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout)

    /* dust */
    const cv = $('#dust'), cx = cv.getContext('2d')
    let W = 0, H = 0, parts = []
    function sizeCanvas() {
      const dpr = Math.min(devicePixelRatio || 1, 2)
      W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const n = reduce ? 20 : Math.round(Math.min(90, W * H / 14000))
      parts = Array.from({ length: n }, () => ({
        x: Math.random() * W, y: Math.random() * H, r: .5 + Math.random() * 1.7,
        vx: (Math.random() - .5) * 8, vy: -2 - Math.random() * 9, ph: Math.random() * 6.28, sp: .4 + Math.random() * 1.2,
      }))
    }
    on(window, 'resize', sizeCanvas); sizeCanvas()

    /* tilt + cursor glow */
    on(cardWrap, 'pointermove', (e) => {
      const r = cardWrap.getBoundingClientRect()
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height
      card.style.setProperty('--mx', (px * 100) + '%'); card.style.setProperty('--my', (py * 100) + '%')
      if (e.pointerType === 'mouse' && !reduce && card.classList.contains('on'))
        cardWrap.style.transform = `perspective(900px) rotateX(${(.5 - py) * 5}deg) rotateY(${(px - .5) * 6}deg)`
    })
    on(cardWrap, 'pointerleave', () => { cardWrap.style.transform = '' })

    /* main loop */
    let last = performance.now(), lastLit = -1, raf = 0
    function frame(now) {
      const dt = Math.min(.033, (now - last) / 1000); last = now
      if (!dragging) {
        pv += (-150 * pull - 9 * pv) * dt; pull += pv * dt
        sv += (-80 * sx - 3.2 * sv) * dt; sx += sv * dt
        if (pull < 0) { pull = 0; pv = Math.abs(pv) * .3 }
      }
      drawChain()
      lit += (target - lit) * Math.min(1, dt * rate)
      if (Math.abs(lit - lastLit) > .002) { root.style.setProperty('--lit', lit.toFixed(3)); lastLit = lit }

      cx.clearRect(0, 0, W, H)
      const t = now / 1000
      for (const q of parts) {
        q.x += (q.vx + Math.sin(t * q.sp + q.ph) * 6) * dt; q.y += q.vy * dt
        if (q.y < -10) { q.y = H + 10; q.x = Math.random() * W }
        if (q.x < -10) q.x = W + 10
        if (q.x > W + 10) q.x = -10
        const a = (.07 + .75 * lit) * (.45 + .55 * Math.sin(t * q.sp * 2 + q.ph))
        if (a <= 0.01) continue
        cx.fillStyle = `rgba(255,208,150,${(a * .22).toFixed(3)})`
        cx.beginPath(); cx.arc(q.x, q.y, q.r * 3.2, 0, 6.283); cx.fill()
        cx.fillStyle = `rgba(255,226,180,${a.toFixed(3)})`
        cx.beginPath(); cx.arc(q.x, q.y, q.r, 0, 6.283); cx.fill()
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    /* form: real sign-in */
    const email = $('#email'), pw = $('#pw'), fEmail = $('#fEmail'), fPw = $('#fPw')
    const msg = $('#msg'), go = $('#go'), goTxt = $('#goTxt'), goIcon = $('#goIcon'), keep = $('#keep')

    on($('#eye'), 'click', () => {
      const show = pw.type === 'password'; pw.type = show ? 'text' : 'password'
      $('#eyeIcon').innerHTML = show
        ? '<path d="M3 3l18 18"/><path d="M10.6 6.2A9.8 9.8 0 0 1 12 6c6.4 0 10 6 10 6a17 17 0 0 1-3.2 3.9M6.6 7.6A17 17 0 0 0 2 12s3.6 7 10 7a9.7 9.7 0 0 0 4.2-1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>'
        : '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'
    })
    ;[email, pw].forEach((i) => on(i, 'input', () => { fEmail.classList.remove('err'); fPw.classList.remove('err'); msg.textContent = '' }))

    function bad(f, text) {
      f.classList.add('err'); msg.style.color = ''; msg.textContent = text
      cardWrap.classList.remove('shake'); void cardWrap.offsetWidth; cardWrap.classList.add('shake')
    }
    let busy = false
    on(card, 'submit', async (e) => {
      e.preventDefault()
      if (busy) return
      if (!/^\S+@\S+\.\S+$/.test(email.value.trim())) return bad(fEmail, 'Enter a valid email address.')
      if (!pw.value) return bad(fPw, 'Enter your password.')
      busy = true
      go.classList.add('loading'); goTxt.textContent = ''; goIcon.style.display = 'none'
      const sp = document.createElement('span'); sp.className = 'spin'; go.appendChild(sp)
      const reset = () => { sp.remove(); go.classList.remove('loading'); goTxt.textContent = 'Sign in'; goIcon.style.display = ''; busy = false }
      try {
        const token = await login(email.value.trim(), pw.value)
        setToken(token, keep.checked)
        sp.remove(); go.classList.remove('loading'); go.classList.add('ok')
        goTxt.textContent = 'You’re in — welcome back'
        later(() => doneRef.current(), 700)
      } catch (err) {
        reset()
        bad(fPw, ERRORS[err.message] || 'Could not sign in. Please try again.')
      }
    })

    return () => {
      cancelAnimationFrame(raf)
      cleanups.forEach((f) => f())
      timers.forEach(clearTimeout)
      flicker.forEach(clearTimeout)
    }
  }, [])

  return <div className="lp" ref={ref} dangerouslySetInnerHTML={{ __html: lampMarkup }} />
}
