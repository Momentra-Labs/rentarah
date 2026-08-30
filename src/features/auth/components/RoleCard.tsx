import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded'
import RadioButtonUnchecked from '@mui/icons-material/RadioButtonUnchecked'
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
  compact = false,
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
  /** Tighter padding and type so three cards fit a short viewport. */
  compact?: boolean
}) {
  const theme = useTheme()
  const isNarrowPhone = useMediaQuery(theme.breakpoints.down('sm'))
  const inputId = `rentara-role-radio-${radioValue}`
  const dense = compact || isNarrowPhone

  return (
    <Box
      component="label"
      htmlFor={inputId}
      className="block cursor-pointer overflow-hidden rounded-2xl"
      sx={{
        display: 'block',
        position: 'relative',
        px: dense ? 1.5 : { xs: 2, sm: 2.25 },
        py: dense ? 1.15 : { xs: 2, sm: 2.25 },
        outline: 'none',
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease, background-color 0.2s ease, transform 0.12s ease',
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
        '&:active': {
          transform: 'scale(0.985)',
        },
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
          gap: dense ? 1.15 : 1.5,
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
              fontSize: dense ? '0.875rem' : '1rem',
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
              display: dense ? '-webkit-box' : 'block',
              mt: dense ? 0.25 : 0.5,
              lineHeight: dense ? 1.35 : 1.45,
              fontWeight: selected ? 600 : 500,
              fontSize: dense ? '0.75rem' : '0.8125rem',
              WebkitLineClamp: dense ? 2 : 'unset',
              WebkitBoxOrient: dense ? 'vertical' : undefined,
              overflow: dense ? 'hidden' : undefined,
              color: selected ? 'text.primary' : 'text.secondary',
              opacity: selected ? 0.95 : 0.98,
            }}
          >
            {description}
          </Typography>
        </Box>
        <Box sx={{ color: selected ? 'primary.main' : 'action.disabled', flexShrink: 0, mt: 0.25 }} aria-hidden>
          {selected ? <CheckCircleRounded /> : <RadioButtonUnchecked />}
        </Box>
        <Box
          component="input"
          id={inputId}
          name={radioName}
          type="radio"
          value={radioValue}
          checked={selected}
          onChange={() => onCommitted()}
          onBlur={onBlurInput}
          onClick={(e) => e.stopPropagation()}
          sx={{
            position: 'absolute',
            width: 1,
            height: 1,
            p: 0,
            m: -1,
            overflow: 'hidden',
            clip: 'rect(0,0,0,0)',
            whiteSpace: 'nowrap',
            border: 0,
          }}
        />
      </Box>
    </Box>
  )
}
