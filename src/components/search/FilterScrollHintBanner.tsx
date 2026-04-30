import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded'
import { Stack, Typography } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'

/** Shown below a filter scroller while there’s more content below (desktop sidebar + drawer). */
export default function FilterScrollHintBanner({
  sx,
  iconSize,
}: {
  sx?: SxProps<Theme>
  /** Drawer uses slightly larger touch affordance */
  iconSize?: number
}) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={0.875}
      role="note"
      aria-live="polite"
      sx={{
        flexShrink: 0,
        flexWrap: 'wrap',
        pt: 0.25,
        pb: { xs: 0.65, md: 0.5 },
        justifyContent: { xs: 'center', md: 'flex-start' },
        ...sx,
      }}
    >
      <ExpandMoreRounded
        sx={{ fontSize: iconSize ?? ({ xs: 21, md: 20 } as const), opacity: 0.72, flexShrink: 0 }}
        aria-hidden
      />
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, lineHeight: 1.4, letterSpacing: '0.015em' }}>
        More options below in the list above — keep scrolling for price, seating, transmission & fuel.
      </Typography>
    </Stack>
  )
}
