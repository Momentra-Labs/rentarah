import { persist, createJSONStorage } from 'zustand/middleware'
import { create } from 'zustand'

import { detectBrowserLocale, isAppLocale, type AppLocale } from '@/i18n/translate'

type LocaleState = {
  locale: AppLocale
  setLocale: (locale: AppLocale) => void
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: detectBrowserLocale(),
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: 'rentara-locale',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ locale: s.locale }),
      merge: (persisted, current) => {
        const row = persisted as { locale?: string } | undefined
        const locale = row?.locale && isAppLocale(row.locale) ? row.locale : current.locale
        return { ...current, locale }
      },
    },
  ),
)
