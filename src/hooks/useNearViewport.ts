import { useEffect, useRef, useState } from 'react'

/**
 * Flips to true once the element is near the viewport (or already visible).
 * Disconnects after first trigger to avoid observer overhead.
 */
export function useNearViewport(rootMargin = '180px 0px') {
  const ref = useRef<HTMLElement | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (ready) return
    const el = ref.current
    if (!el) return

    if (typeof IntersectionObserver === 'undefined') {
      setReady(true)
      return
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setReady(true)
          obs.disconnect()
        }
      },
      { rootMargin, threshold: 0.01 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [ready, rootMargin])

  return { ref, ready }
}
