import { Box, Typography, useMediaQuery, useTheme } from '@mui/material'
import { alpha } from '@mui/material/styles'
import type { ReactNode } from 'react'

export function RoleCard({
  title,
  description,
  icon,
  selected,
  radioName,
  radioValue,
  onCommitted,
  onBlurInput,
}: {
  title: string
  description: string
  icon: ReactNode
  selected: boolean
  radioName: string
  radioValue: string
  onCommitted: () => void
  /** RHF blur for touched state on the role field */
  onBlurInput?: () => void
}) {
  const theme = useTheme()
  const isNarrowPhone = useMediaQuery(theme.breakpoints.down('sm'))
  const inputId = `rentara-role-radio-${radioValue}`

  return (
    <Box
      component="label"
      htmlFor={inputId}
      className="block cursor-pointer overflow-hidden rounded-2xl"
      sx={{
        display: 'block',
        px: { xs: 2, sm: 2.25 },
        py: { xs: 2, sm: 2.25 },
        outline: 'none',
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease, background-color 0.2s ease',
        borderRadius: '16px',
        borderWidth: selected ? '2px' : '1px',
        borderStyle: 'solid',
        borderColor: selected ? 'primary.main' : alpha(theme.palette.divider, theme.palette.mode === 'light' ? 0.12 : 0.22),
        boxShadow: selected
          ? `0 10px 28px ${alpha(theme.palette.primary.main, 0.12)}`
          : `0 1px 4px ${alpha(theme.palette.common.black, 0.055)}`,
        bgcolor: selected
          ? alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.04 : 0.1)
          : 'background.paper',
        '&:focus-within': {
          boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.2)}`,
        },
        '@media (hover: hover)': {
          '&:hover': !selected
            ? {
                bgcolor: alpha(theme.palette.grey[50], theme.palette.mode === 'light' ? 1 : 0.06),
              }
            : {},
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 1.5,
          width: '100%',
        }}
      >
        <Box sx={{ pt: isNarrowPhone ? 0.15 : 0.25, color: selected ? 'primary.main' : 'text.secondary', flexShrink: 0 }}>
          {icon}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            component="span"
            fontWeight={800}
            sx={{
              display: 'block',
              fontSize: isNarrowPhone ? '0.9375rem' : '1rem',
              letterSpacing: '-0.02em',
              lineHeight: 1.25,
              color: 'text.primary',
            }}
          >
            {title}
          </Typography>
          <Typography
            component="span"
            variant="body2"
            sx={{
              display: 'block',
              mt: 0.5,
              lineHeight: 1.45,
              fontWeight: selected ? 600 : 500,
              fontSize: isNarrowPhone ? '0.78rem' : '0.8125rem',
              color: selected ? 'text.primary' : 'text.secondary',
              opacity: selected ? 0.95 : 0.98,
            }}
          >
            {description}
          </Typography>
        </Box>
        <input
          id={inputId}
          name={radioName}
          type="radio"
          value={radioValue}
          checked={selected}
          className="mt-1 h-5 w-5 shrink-0 cursor-pointer"
          style={{ accentColor: theme.palette.primary.main }}
          onChange={() => onCommitted()}
          onBlur={onBlurInput}
          onClick={(e) => e.stopPropagation()}
        />
      </Box>
    </Box>
  )
}
