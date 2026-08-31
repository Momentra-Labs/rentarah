import MoreHorizOutlined from '@mui/icons-material/MoreHorizOutlined'
import {
  Badge,
  Box,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tab,
  Tabs,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useId, useMemo, useState, type MouseEvent, type ReactElement } from 'react'

import { useT } from '@/hooks/useT'
import { dashboardSectionTabsSx, dashboardTabsBarWrapSx } from '@/theme/pageStyles'

export const DASHBOARD_MORE_TAB_VALUE = '__more__'

const TAB_BADGE_SX = {
  '& .MuiBadge-badge': {
    position: 'relative',
    transform: 'none',
    ml: 0.75,
    fontSize: 10,
    fontWeight: 800,
    minWidth: 18,
    height: 18,
  },
} as const

export type DashboardSectionTabItem = {
  key: string
  label: string
  icon?: ReactElement
  badge?: number
}

export function resolveDashboardTabsValue(
  currentKey: string,
  primaryKeys: readonly string[],
  compact: boolean,
): string {
  if (!compact) return currentKey
  return primaryKeys.includes(currentKey) ? currentKey : DASHBOARD_MORE_TAB_VALUE
}

function SectionTabLabel({ label, badge = 0 }: { label: string; badge?: number }): ReactElement {
  if (badge <= 0) return <>{label}</>
  return (
    <Badge badgeContent={badge} color="warning" max={99} sx={TAB_BADGE_SX}>
      {label}
    </Badge>
  )
}

type DashboardSectionTabsProps = {
  items: readonly DashboardSectionTabItem[]
  value: string
  onChange: (key: string) => void
  primaryKeys: readonly string[]
  ariaLabel: string
}

export default function DashboardSectionTabs({
  items,
  value,
  onChange,
  primaryKeys,
  ariaLabel,
}: DashboardSectionTabsProps) {
  const t = useT()
  const theme = useTheme()
  const isSmUp = useMediaQuery(theme.breakpoints.up('sm'), { noSsr: true })
  const moreTabId = useId()
  const moreMenuId = useId()
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)

  const primarySet = useMemo(() => new Set(primaryKeys), [primaryKeys])
  const itemByKey = useMemo(() => new Map(items.map((item) => [item.key, item])), [items])

  const compactVisible = useMemo(
    () => primaryKeys.map((key) => itemByKey.get(key)).filter((item): item is DashboardSectionTabItem => Boolean(item)),
    [itemByKey, primaryKeys],
  )
  const overflowItems = useMemo(
    () => items.filter((item) => !primarySet.has(item.key)),
    [items, primarySet],
  )

  const compact = !isSmUp && overflowItems.length > 0
  const visibleItems = compact ? compactVisible : items
  const tabsValue = resolveDashboardTabsValue(value, primaryKeys, compact)
  const menuOpen = Boolean(menuAnchor)

  const openMoreMenu = (event: MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget)
  }

  const closeMoreMenu = () => setMenuAnchor(null)

  return (
    <Box sx={dashboardTabsBarWrapSx}>
      <Tabs
        value={tabsValue}
        onChange={(_, next) => {
          if (typeof next !== 'string' || next === DASHBOARD_MORE_TAB_VALUE) return
          closeMoreMenu()
          onChange(next)
        }}
        variant={compact ? 'fullWidth' : 'scrollable'}
        scrollButtons={compact ? false : 'auto'}
        allowScrollButtonsMobile={!compact}
        aria-label={ariaLabel}
        sx={
          compact
            ? {
                ...dashboardSectionTabsSx,
                px: 0,
                '& .MuiTabs-flexContainer': {
                  ...dashboardSectionTabsSx['& .MuiTabs-flexContainer'],
                  gap: 0,
                },
                '& .MuiTab-root': {
                  ...dashboardSectionTabsSx['& .MuiTab-root'],
                  flex: 1,
                  maxWidth: 'none',
                  minWidth: 0,
                  px: 0.75,
                  whiteSpace: 'nowrap',
                  flexDirection: 'row' as const,
                  '& .MuiTab-iconWrapper': {
                    ...dashboardSectionTabsSx['& .MuiTab-root']['& .MuiTab-iconWrapper'],
                    marginBottom: 0,
                    marginRight: '6px',
                  },
                },
              }
            : dashboardSectionTabsSx
        }
      >
        {visibleItems.map((item) => (
          <Tab
            key={item.key}
            value={item.key}
            icon={item.icon}
            iconPosition="start"
            label={<SectionTabLabel label={item.label} badge={item.badge} />}
          />
        ))}
        {compact ? (
          <Tab
            id={moreTabId}
            value={DASHBOARD_MORE_TAB_VALUE}
            icon={<MoreHorizOutlined fontSize="small" />}
            iconPosition="start"
            label={t('common.more')}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-controls={menuOpen ? moreMenuId : undefined}
            onClick={openMoreMenu}
          />
        ) : null}
      </Tabs>
      {compact ? (
        <Menu
          id={moreMenuId}
          anchorEl={menuAnchor}
          open={menuOpen}
          onClose={closeMoreMenu}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          MenuListProps={{
            'aria-labelledby': moreTabId,
            autoFocusItem: overflowItems.some((item) => item.key === value),
          }}
          slotProps={{
            paper: { sx: { minWidth: 200, mt: 0.5, borderRadius: 2 } },
          }}
        >
          {overflowItems.map((item) => (
            <MenuItem
              key={item.key}
              selected={item.key === value}
              onClick={() => {
                closeMoreMenu()
                onChange(item.key)
              }}
            >
              {item.icon ? <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon> : null}
              <ListItemText primary={<SectionTabLabel label={item.label} badge={item.badge} />} />
            </MenuItem>
          ))}
        </Menu>
      ) : null}
    </Box>
  )
}
