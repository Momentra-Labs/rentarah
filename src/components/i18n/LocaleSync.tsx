import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import { useEffect, type ReactNode } from 'react'

import '@/i18n/dayjsFil'

import { dayjsLocale, htmlLang, translate } from '@/i18n/translate'
import { useLocaleStore } from '@/store/useLocaleStore'

/** Keeps `html lang`, document title, and dayjs in sync with the selected locale. */
export default function LocaleSync() {
  const locale = useLocaleStore((s) => s.locale)

  useEffect(() => {
    document.documentElement.lang = htmlLang(locale)
    document.title = translate(locale, 'meta.title')
    dayjs.locale(dayjsLocale(locale))
  }, [locale])

  return null
}

export function LocaleAwareDates({ children }: { children: ReactNode }) {
  const locale = useLocaleStore((s) => s.locale)
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={dayjsLocale(locale)}>
      {children}
    </LocalizationProvider>
  )
}
