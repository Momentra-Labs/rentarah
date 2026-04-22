import Close from '@mui/icons-material/Close'
import {
  Badge,
  Box,
  Button,
  IconButton,
  Stack,
  SwipeableDrawer,
  Typography,
} from '@mui/material'

import type { SearchFilters } from '../../types'
import FilterPanel from './FilterPanel'

interface FilterDrawerProps {
  open: boolean
  onClose: () => void
  filters: SearchFilters
  onChange: (partial: Partial<SearchFilters>) => void
  onClear: () => void
  hasActive: boolean
}

/**
 * Bottom-sheet filters for mobile — easier to reach than a side drawer.
 * Swipe down (or tap Apply / backdrop) to close.
 */
export default function FilterDrawer({ open, onClose, filters, onChange, onClear, hasActive }: FilterDrawerProps) {
  const iOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
      disableBackdropTransition={!iOS}
      disableDiscovery={iOS}
      disableSwipeToOpen
      ModalProps={{
        keepMounted: true,
      }}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          maxHeight: 'min(92dvh, 880px)',
          pb: 'env(safe-area-inset-bottom, 0px)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <Stack sx={{ flex: 1, minHeight: 0, maxHeight: 'inherit' }}>
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', pt: 1.5, pb: 0.5 }}>
          <Box
            sx={{
              width: 40,
              height: 4,
              borderRadius: 2,
              bgcolor: 'grey.300',
            }}
            aria-hidden
          />
        </Box>

        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, pb: 1 }}>
          <Badge color="primary" variant="dot" invisible={!hasActive}>
            <Typography variant="h6" component="span">
              Filters
            </Typography>
          </Badge>
          <IconButton edge="end" aria-label="Close filters" onClick={onClose} size="large">
            <Close />
          </IconButton>
        </Stack>

        <Box sx={{ px: 2, overflowY: 'auto', flex: 1, WebkitOverflowScrolling: 'touch' }}>
          <FilterPanel filters={filters} onChange={onChange} onClear={onClear} hasActiveFilters={hasActive} />
        </Box>

        <Box
          sx={{
            px: 2,
            pt: 2,
            pb: 2,
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Button variant="contained" fullWidth size="large" onClick={onClose} sx={{ minHeight: 48 }}>
            Show results
          </Button>
        </Box>
      </Stack>
    </SwipeableDrawer>
  )
}
