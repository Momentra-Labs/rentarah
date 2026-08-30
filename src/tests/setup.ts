import '@testing-library/jest-dom/vitest'
import { beforeEach } from 'vitest'

import { useLocaleStore } from '@/store/useLocaleStore'

if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}

beforeEach(() => {
  localStorage.removeItem('rentara-locale')
  useLocaleStore.setState({ locale: 'en' })
})
