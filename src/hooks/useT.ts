import { useCallback } from 'react'

import { translate, type MessageKey, type TranslateVars } from '@/i18n/translate'
import { useLocaleStore } from '@/store/useLocaleStore'

export function useT() {
  const locale = useLocaleStore((s) => s.locale)
  return useCallback((key: MessageKey, vars?: TranslateVars) => translate(locale, key, vars), [locale])
}

export function useLocale() {
  return useLocaleStore((s) => s.locale)
}
