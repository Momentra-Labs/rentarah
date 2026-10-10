// Captures the live RentaraH site in phone view (390×844 CSS px @3x) for the carousel.
//   node promo/instagram-carousel/tools/capture.mjs [baseUrl]
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { launchChrome, sleep } from '../../coming-soon/tools/cdp.mjs'

const BASE = (process.argv[2] || 'https://rentahub2026.github.io').replace(/\/$/, '')
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'screens')

// Same rule as the video: pre-launch marketing figures and trust bullets stay out of promo shots.
const HIDE = `(() => {
  const st = document.createElement('style')
  st.textContent = 'section[aria-labelledby="landing-trust-heading"] { visibility: hidden !important; }'
  document.head.appendChild(st)
})()`

// Scroll whichever element actually scrolls (window or the app shell).
const SCROLL = (y) => `(() => {
  window.scrollTo(0, ${y})
  for (const el of document.querySelectorAll('*')) {
    const s = getComputedStyle(el)
    if (/(auto|scroll)/.test(s.overflowY) && el.scrollHeight > el.clientHeight + 50) el.scrollTop = ${y}
  }
})()`

const RECT = (needle) => `(() => {
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  let n
  while ((n = w.nextNode())) {
    if (!n.textContent.trim().startsWith(${JSON.stringify(needle)})) continue
    const el = n.parentElement.closest('button, a, [role=button]') || n.parentElement
    const r = el.getBoundingClientRect()
    if (r.width) return { x: r.x, y: r.y, w: r.width, h: r.height }
  }
  return null
})()`

// spots: UI labels whose on-screen rectangles are saved for the slide callouts.
// Browse uses the app's own Car filter: the demo motorcycle photos currently fail to load.
const SHOTS = [
  { name: 'home', path: '/', scroll: 0, spots: ['Pickup city', 'Search available vehicles'] },
  { name: 'browse', path: '/search?vt=car', scroll: 0, spots: ['Choose price and type', 'Makati · 6 km', '₱12,000', 'Sort'] },
  { name: 'filters', path: '/search', scroll: 0, click: 'Choose price and type', spots: ['Vehicle', 'Motorcycle', 'Price / day', 'Available dates only', 'Transmission'] },
  { name: 'map', path: '/map', scroll: 0, spots: ['All', 'Moto', '₱2.2k', '32 vehicles nearby'] },
  { name: 'detail', path: '/cars/car_001', scroll: 0, spots: ['1 / 7', 'Share'] },
  { name: 'detail-price', path: '/cars/car_001', scroll: 300, spots: ['Pick-up', 'TRIP LENGTH', 'Total', 'Share'] },
  { name: 'detail-specs', path: '/cars/car_001', scroll: 1000, spots: ['Seats', 'What’s included', 'Hosted by'] },
  { name: 'detail-calendar', path: '/cars/car_001', scroll: 1650, spots: ['When is it free?'] },
]

const chrome = await launchChrome({ port: 9341 })
const spots = {}
try {
  await chrome.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true })
  await chrome.navigate(BASE + '/', { settleMs: 800 })
  await chrome.evaluate("localStorage.setItem('rentarah_onboarding_done', '1'); sessionStorage.setItem('rentara:geo-auto-landing', '1'); sessionStorage.setItem('rentara:geo-auto-car-detail', '1')")
  for (const s of SHOTS) {
    await chrome.navigate(BASE + s.path, { settleMs: 4500 })
    await chrome.evaluate(HIDE)
    await chrome.evaluate(SCROLL(s.scroll))
    await sleep(900)
    if (s.click) {
      const r = await chrome.evaluate(RECT(s.click))
      if (r) {
        await chrome.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: r.x + r.w / 2, y: r.y + r.h / 2, button: 'left', clickCount: 1 })
        await chrome.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: r.x + r.w / 2, y: r.y + r.h / 2, button: 'left', clickCount: 1 })
        await sleep(1500)
      }
    }
    spots[s.name] = {}
    for (const label of s.spots || []) spots[s.name][label] = await chrome.evaluate(RECT(label))
    const { data } = await chrome.send('Page.captureScreenshot', { format: 'png' })
    writeFileSync(join(OUT, `${s.name}.png`), Buffer.from(data, 'base64'))
    console.log('saved', s.name)
  }
  writeFileSync(join(OUT, 'spots.json'), JSON.stringify(spots, null, 2))
} finally {
  await chrome.close()
}
