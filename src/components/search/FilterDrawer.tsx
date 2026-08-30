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

import { useT } from '@/hooks/useT'

import type { SearchFilters } from '../../types'
import FilterPanelScrollColumn from './FilterPanelScrollColumn'

interface FilterDrawerProps {
  open: boolean
  onClose: () => void
  filters: SearchFilters
  onChange: (partial: Partial<SearchFilters>) => void
  onClear: () => void
  hasActive: boolean
  showVehicleType?: boolean
}

/**
 * Bottom-sheet filters for mobile — easier to reach than a side drawer.
 * Swipe down (or tap Apply / backdrop) to close.
 */
export default function FilterDrawer({
  open,
  onClose,
  filters,
  onChange,
  onClear,
  hasActive,
  showVehicleType = false,
}: FilterDrawerProps) {
  const t = useT()
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

        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, pb: 0.5 }}>
          <Badge color="primary" variant="dot" invisible={!hasActive}>
            <Typography variant="subtitle1" component="span" fontWeight={800}>
              {t('search.filters')}
            </Typography>
          </Badge>
          <IconButton edge="end" aria-label={t('search.closeFilters')} onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Stack>

        <FilterPanelScrollColumn
          active={open}
          resetScrollTopOnReveal
          filters={filters}
          onChange={onChange}
          onClear={onClear}
          hasActiveFilters={hasActive}
          showVehicleType={showVehicleType}
          scrollBoxSx={{ px: 2, pb: 1 }}
        />

        <Box
          sx={{
            px: 2,
            pt: 1,
            pb: 2,
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            flexShrink: 0,
          }}
        >
          <Button variant="contained" fullWidth size="large" onClick={onClose} sx={{ minHeight: 46 }}>
            {t('search.done')}
          </Button>
        </Box>
      </Stack>
    </SwipeableDrawer>
  )
}
