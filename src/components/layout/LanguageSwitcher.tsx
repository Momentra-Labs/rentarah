import Check from '@mui/icons-material/Check'
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown'
import { Box, Button, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useId, useState } from 'react'

import { useT } from '@/hooks/useT'
import type { AppLocale } from '@/i18n/translate'
import { useLocaleStore } from '@/store/useLocaleStore'

const OPTIONS: { locale: AppLocale; short: string; nameKey: 'language.english' | 'language.filipino'; flag: 'us' | 'ph' }[] =
  [
    { locale: 'en', short: 'EN', nameKey: 'language.english', flag: 'us' },
    { locale: 'fil', short: 'FIL', nameKey: 'language.filipino', flag: 'ph' },
  ]

function LocaleFlag({ code, size = 18 }: { code: 'us' | 'ph'; size?: number }) {
  const w = size
  const h = Math.round((size * 12) / 18)
  if (code === 'ph') {
    return (
      <Box
        component="svg"
        viewBox="0 0 36 24"
        width={w}
        height={h}
        aria-hidden
        sx={{ display: 'block', flexShrink: 0, borderRadius: '2px', boxShadow: '0 0 0 1px rgba(0,0,0,0.08)' }}
      >
        <rect width="36" height="12" fill="#0038A8" />
        <rect y="12" width="36" height="12" fill="#CE1126" />
        <polygon points="0,0 14,12 0,24" fill="#fff" />
        <circle cx="6.4" cy="12" r="2.55" fill="#FCD116" />
        <polygon points="6.2,3.4 6.85,5.15 8.75,5.15 7.2,6.25 7.8,8 6.2,6.9 4.6,8 5.2,6.25 3.65,5.15 5.55,5.15" fill="#FCD116" />
        <polygon points="11.4,8.6 11.85,9.85 13.2,9.85 12.1,10.65 12.55,11.9 11.4,11.1 10.25,11.9 10.7,10.65 9.6,9.85 10.95,9.85" fill="#FCD116" />
        <polygon points="11.4,15.4 11.85,16.65 13.2,16.65 12.1,17.45 12.55,18.7 11.4,17.9 10.25,18.7 10.7,17.45 9.6,16.65 10.95,16.65" fill="#FCD116" />
      </Box>
    )
  }
  return (
    <Box
      component="svg"
      viewBox="0 0 36 24"
      width={w}
      height={h}
      aria-hidden
      sx={{ display: 'block', flexShrink: 0, borderRadius: '2px', boxShadow: '0 0 0 1px rgba(0,0,0,0.08)' }}
    >
      <rect width="36" height="24" fill="#B22234" />
      {[1, 3, 5, 7, 9, 11].map((row) => (
        <rect key={row} y={(row * 24) / 13} width="36" height={24 / 13} fill="#fff" />
      ))}
      <rect width="14.4" height={(7 * 24) / 13} fill="#3C3B6E" />
    </Box>
  )
}

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const t = useT()
  const locale = useLocaleStore((s) => s.locale)
  const setLocale = useLocaleStore((s) => s.setLocale)
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const menuId = useId()
  const buttonId = useId()
  const open = Boolean(anchor)
  const current = OPTIONS.find((o) => o.locale === locale) ?? OPTIONS[0]

  return (
    <>
      <Button
        id={buttonId}
        size="small"
        variant="outlined"
        color="inherit"
        disableElevation
        aria-label={`${t('language.label')}: ${t(current.nameKey)}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={(e) => setAnchor(e.currentTarget)}
        endIcon={compact ? undefined : <KeyboardArrowDown sx={{ fontSize: 18, ml: -0.25 }} />}
        sx={{
          flexShrink: 0,
          minWidth: compact ? 40 : undefined,
          minHeight: 36,
          px: compact ? 0.9 : 1.15,
          py: compact ? 0.5 : 0.35,
          borderRadius: 2,
          borderColor: 'divider',
          textTransform: 'none',
          fontWeight: 700,
          fontSize: '0.8125rem',
          letterSpacing: '0.02em',
          color: 'text.primary',
          '& .MuiButton-endIcon': { ml: 0.25 },
          '&:hover': { borderColor: 'action.active', bgcolor: (th) => alpha(th.palette.action.hover, 0.6) },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: compact ? 0.75 : 1 }}>
          <LocaleFlag code={current.flag} size={compact ? 16 : 18} />
          {compact ? current.short : t(current.nameKey)}
        </Box>
      </Button>
      <Menu
        id={menuId}
        role="listbox"
        anchorEl={anchor}
        open={open}
        onClose={() => setAnchor(null)}
        disableScrollLock
        MenuListProps={{ 'aria-labelledby': buttonId, role: 'listbox', dense: true }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          elevation: 0,
          sx: {
            mt: 0.75,
            minWidth: 188,
            borderRadius: 2,
            border: 1,
            borderColor: 'divider',
            boxShadow: (th) => `0 8px 24px ${alpha(th.palette.common.black, 0.1)}`,
          },
        }}
      >
        {OPTIONS.map((option) => {
          const selected = option.locale === locale
          return (
            <MenuItem
              key={option.locale}
              role="option"
              aria-selected={selected}
              selected={selected}
              onClick={() => {
                setLocale(option.locale)
                setAnchor(null)
              }}
              sx={{ py: 1, gap: 0.5 }}
            >
              <ListItemIcon sx={{ minWidth: 28 }}>
                <LocaleFlag code={option.flag} size={18} />
              </ListItemIcon>
              <ListItemText
                primary={t(option.nameKey)}
                primaryTypographyProps={{ fontWeight: selected ? 700 : 600, fontSize: '0.875rem' }}
              />
              {selected ? <Check fontSize="small" color="primary" aria-hidden /> : null}
            </MenuItem>
          )
        })}
      </Menu>
    </>
  )
}
