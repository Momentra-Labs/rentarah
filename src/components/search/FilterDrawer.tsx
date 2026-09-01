import Close from '@mui/icons-material/Close'
import {
  Badge,
  Box,
  Button,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'

import { APP_NAV_SIDEBAR_EXPANDED_PX } from '@/components/layout/AppNavigationList'
import { MOBILE_TAB_BAR_STACK_BOTTOM } from '@/components/layout/MobileBottomNav'
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
  /** Always a bottom sheet on browse. */
  anchor?: 'bottom' | 'right'
  /** Keep the overlay below the sticky search bar so Edit search does not jump or get covered. */
  insetTop?: number
}

/**
 * Bottom-sheet filters on all breakpoints so the Edit search bar stays visible and unchanged.
 */
export default function FilterDrawer({
  open,
  onClose,
  filters,
  onChange,
  onClear,
  hasActive,
  showVehicleType = false,
  anchor = 'bottom',
  insetTop = 0,
}: FilterDrawerProps) {
  const t = useT()
  const topGap = Math.max(0, insetTop)
  /** Keep the sheet in the main column so it never covers the md+ nav rail. */
  const desktopMainColumnSx = {
    left: { md: APP_NAV_SIDEBAR_EXPANDED_PX },
    right: { md: 0 },
    width: { md: `calc(100% - ${APP_NAV_SIDEBAR_EXPANDED_PX}px)` },
  } as const
  const sheetHeightXs = `calc(100dvh - ${topGap}px - 68px - env(safe-area-inset-bottom, 0px))`
  const sheetHeightMd = `calc(100dvh - ${topGap}px)`

  return (
    <Drawer
      id="browse-advanced-search"
      anchor={anchor}
      open={open}
      onClose={onClose}
      sx={{
        zIndex: (theme) => theme.zIndex.appBar - 2,
        ...desktopMainColumnSx,
      }}
      ModalProps={{
        keepMounted: true,
        disableScrollLock: true,
      }}
      BackdropProps={{
        sx: desktopMainColumnSx,
      }}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          bottom: { xs: MOBILE_TAB_BAR_STACK_BOTTOM, md: 0 },
          height: { xs: sheetHeightXs, md: sheetHeightMd },
          maxHeight: { xs: sheetHeightXs, md: sheetHeightMd },
          pb: { xs: 0, md: 'env(safe-area-inset-bottom, 0px)' },
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          boxSizing: 'border-box',
          left: { xs: 0, md: APP_NAV_SIDEBAR_EXPANDED_PX },
          right: 0,
          width: { xs: '100%', md: `calc(100% - ${APP_NAV_SIDEBAR_EXPANDED_PX}px)` },
        },
      }}
    >
      <Stack
        sx={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          height: '100%',
          overflow: 'hidden',
        }}
      >
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

        <Stack sx={{ px: 2, pb: 1 }} spacing={0.25}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Badge color="primary" variant="dot" invisible={!hasActive}>
              <Typography variant="subtitle1" component="span" fontWeight={800}>
                {t('search.filters')}
              </Typography>
            </Badge>
            <IconButton edge="end" aria-label={t('search.closeFilters')} onClick={onClose} size="small">
              <Close />
            </IconButton>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {t('search.filtersIntro')}
          </Typography>
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
    </Drawer>
  )
}
