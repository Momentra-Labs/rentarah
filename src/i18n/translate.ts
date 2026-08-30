import { en, type Messages } from './en'
import { fil } from './fil'

export const SUPPORTED_LOCALES = ['en', 'fil'] as const
export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

export const dictionaries: Record<AppLocale, Messages> = { en, fil }

type NestedPaths<T, Prefix extends string = ''> = T extends string
  ? Prefix
  : {
      [K in keyof T & string]: NestedPaths<T[K], Prefix extends '' ? K : `${Prefix}.${K}`>
    }[keyof T & string]

export type MessageKey = NestedPaths<Messages>

export type TranslateVars = Record<string, string | number>

export function isAppLocale(value: string): value is AppLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

export function detectBrowserLocale(): AppLocale {
  if (typeof navigator === 'undefined') return 'en'
  const raw = (navigator.language || 'en').toLowerCase()
  if (raw.startsWith('fil') || raw.startsWith('tl')) return 'fil'
  return 'en'
}

export function lookupMessage(messages: Messages, key: MessageKey): string {
  const parts = key.split('.')
  let cur: unknown = messages
  for (const part of parts) {
    if (cur && typeof cur === 'object' && part in cur) {
      cur = (cur as Record<string, unknown>)[part]
    } else {
      return key
    }
  }
  return typeof cur === 'string' ? cur : key
}

export function interpolate(template: string, vars?: TranslateVars): string {
  if (!vars) return template
  return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) =>
    vars[name] === undefined || vars[name] === null ? '' : String(vars[name]),
  )
}

export function translate(locale: AppLocale, key: MessageKey, vars?: TranslateVars): string {
  return interpolate(lookupMessage(dictionaries[locale], key), vars)
}

export function htmlLang(locale: AppLocale): string {
  return locale === 'fil' ? 'fil' : 'en'
}

export function dayjsLocale(locale: AppLocale): string {
  return locale === 'fil' ? 'fil' : 'en'
}
