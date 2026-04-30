import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

import type { SearchFilters } from '../../types'
import { FILTER_SCROLL_HINT_BOTTOM_EPS_PX } from './filterScrollConstants'

type Options = {
  /** Drawer: follow `open`. Sidebar: `true`. */
  active: boolean
  /** Reset scrollTop when `active` goes false → true (mobile sheet). Sidebar should pass `false`. */
  resetScrollTopOnReveal: boolean
  filters: SearchFilters
  hasActiveFilters: boolean
}

export function useFilterPaneScrollHint({
  active,
  resetScrollTopOnReveal,
  filters,
  hasActiveFilters,
}: Options) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const prevActiveRef = useRef(false)
  const [showScrollHint, setShowScrollHint] = useState(false)

  const refreshScrollHint = useCallback(() => {
    const el = scrollRef.current
    if (!el) {
      setShowScrollHint(false)
      return
    }
    const { scrollTop, scrollHeight, clientHeight } = el
    const hasOverflow = scrollHeight > clientHeight + 4
    const atBottom = scrollTop + clientHeight >= scrollHeight - FILTER_SCROLL_HINT_BOTTOM_EPS_PX
    setShowScrollHint(hasOverflow && !atBottom)
  }, [])

  useLayoutEffect(() => {
    if (!active) {
      setShowScrollHint(false)
      prevActiveRef.current = false
      return
    }

    const justActivated = !prevActiveRef.current
    prevActiveRef.current = true
    if (resetScrollTopOnReveal && justActivated && scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }

    refreshScrollHint()
    const id = window.requestAnimationFrame(refreshScrollHint)
    return () => window.cancelAnimationFrame(id)
  }, [active, refreshScrollHint, resetScrollTopOnReveal])

  useLayoutEffect(() => {
    if (!active) return
    refreshScrollHint()
  }, [active, filters, hasActiveFilters, refreshScrollHint])

  useEffect(() => {
    if (!active) return undefined
    if (typeof ResizeObserver === 'undefined') return undefined
    const el = scrollRef.current
    const content = el?.firstElementChild
    if (!el || !(content instanceof Element)) return undefined

    const schedule = () => window.requestAnimationFrame(refreshScrollHint)
    const ro = new ResizeObserver(schedule)
    ro.observe(el)
    ro.observe(content)
    window.addEventListener('resize', schedule)

    return () => {
      ro.disconnect()
      window.removeEventListener('resize', schedule)
    }
  }, [active, refreshScrollHint])

  return {
    scrollRef,
    showScrollHint,
    refreshScrollHint,
  }
}
