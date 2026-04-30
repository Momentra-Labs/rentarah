import { Box, Stack } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import type { ComponentPropsWithoutRef } from 'react'

import FilterPanel from './FilterPanel'
import FilterScrollHintBanner from './FilterScrollHintBanner'
import { useFilterPaneScrollHint } from './useFilterPaneScrollHint'

type FilterPanelProps = ComponentPropsWithoutRef<typeof FilterPanel>

type Props = FilterPanelProps & {
  /** When false (e.g. drawer closed), hint hidden and observers detached. */
  active: boolean
  /** Drawer: true — scroll to top on open. Sidebar: false. */
  resetScrollTopOnReveal?: boolean
  /** Appended to the scroll area (defaults cover flex + overscroll clipping). */
  scrollBoxSx?: SxProps<Theme>
  /** Extra styles for hint row (sidebar: no horizontal padding if Paper pads). */
  hintBannerSx?: SxProps<Theme>
}

/** Scroll column + collapsible bottom hint — shared desktop sidebar + drawer body. */
export default function FilterPanelScrollColumn({
  active,
  resetScrollTopOnReveal = false,
  scrollBoxSx,
  hintBannerSx,
  ...panelProps
}: Props) {
  const { filters, hasActiveFilters } = panelProps
  const { scrollRef, showScrollHint, refreshScrollHint } = useFilterPaneScrollHint({
    active,
    resetScrollTopOnReveal,
    filters,
    hasActiveFilters,
  })

  return (
    <Stack sx={{ flex: 1, minHeight: 0, minWidth: 0 }} spacing={0}>
      <Box
        ref={scrollRef}
        onScroll={refreshScrollHint}
        sx={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          overflowX: 'hidden',
          overflowY: 'auto',
          overscrollBehaviorX: 'none',
          WebkitOverflowScrolling: 'touch',
          scrollbarGutter: 'stable',
          ...scrollBoxSx,
        }}
      >
        <FilterPanel {...panelProps} />
      </Box>
      {showScrollHint ? <FilterScrollHintBanner sx={hintBannerSx} /> : null}
    </Stack>
  )
}
