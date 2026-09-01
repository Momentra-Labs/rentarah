import { Box, List, ListItemButton, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useNavigate } from 'react-router-dom'

import UserAvatar from '@/components/common/UserAvatar'
import EmptyState from '@/components/ui/EmptyState'
import { otherPartyName, splitDisplayName } from '@/features/messaging/chatDisplay'
import ChatEmptyGlyph from '@/features/messaging/components/ChatEmptyGlyph'
import { useT } from '@/hooks/useT'
import { useCarsStore } from '@/store/useCarsStore'
import type { ChatThread } from '@/types'

import { rhRadius } from '@/theme/tokens'

dayjs.extend(relativeTime)

export type ChatConversationListProps = {
  threads: ChatThread[]
  currentUserId: string
  selectedId: string | null
  onSelect: (threadId: string) => void
  unreadByThread?: Record<string, number>
}

export default function ChatConversationList({
  threads,
  currentUserId,
  selectedId,
  onSelect,
  unreadByThread = {},
}: ChatConversationListProps) {
  const t = useT()
  const navigate = useNavigate()
  const cars = useCarsStore((s) => s.cars)

  if (threads.length === 0) {
    return (
      <Box sx={{ px: 1, py: 2 }}>
        <EmptyState
          title={t('chat.none')}
          description={t('chat.noneDesc')}
          actionLabel={t('chat.viewTrips')}
          onAction={() => navigate('/dashboard')}
          icon={<ChatEmptyGlyph size={72} />}
        />
      </Box>
    )
  }

  return (
    <List disablePadding sx={{ py: 0, bgcolor: 'background.paper' }}>
      {threads.map((thread) => {
        const other = otherPartyName(thread, currentUserId)
        const names = splitDisplayName(other)
        const time = thread.lastMessageAt ? dayjs(thread.lastMessageAt).fromNow() : ''
        const unread = unreadByThread[thread.id] ?? 0
        const hasUnread = unread > 0
        const selected = selectedId === thread.id
        const car = cars.find((c) => c.id === thread.carId)
        const thumb = car?.images[0]

        return (
          <ListItemButton
            key={thread.id}
            selected={selected}
            onClick={() => onSelect(thread.id)}
            alignItems="flex-start"
            sx={{
              py: 1.5,
              px: 2,
              gap: 1.5,
              borderBottom: 1,
              borderColor: 'divider',
              borderRadius: 0,
              borderLeft: '3px solid',
              borderLeftColor: selected ? 'primary.main' : 'transparent',
              bgcolor: selected ? undefined : 'background.paper',
              '&:hover': {
                bgcolor: (theme) => alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.05 : 0.12),
              },
              '&.Mui-selected': {
                bgcolor: (theme) => alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.1 : 0.2),
                '&:hover': {
                  bgcolor: (theme) => alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.14 : 0.26),
                },
              },
            }}
          >
            <Box sx={{ position: 'relative', flexShrink: 0, width: 56, height: 56 }}>
              <UserAvatar avatar={null} firstName={names.firstName} lastName={names.lastName} size={56} />
              {thumb ? (
                <Box
                  component="img"
                  src={thumb}
                  alt=""
                  sx={{
                    position: 'absolute',
                    right: -4,
                    bottom: -4,
                    width: 28,
                    height: 28,
                    objectFit: 'cover',
                    borderRadius: `${rhRadius.sm}px`,
                    border: '2px solid',
                    borderColor: 'background.paper',
                    bgcolor: 'grey.200',
                  }}
                />
              ) : null}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 1 }}>
                <Typography
                  fontWeight={hasUnread ? 800 : 700}
                  fontSize="0.95rem"
                  noWrap
                  sx={{ flex: 1, minWidth: 0, letterSpacing: '-0.02em' }}
                >
                  {other}
                </Typography>
                {time ? (
                  <Typography
                    variant="caption"
                    sx={{
                      flexShrink: 0,
                      fontSize: '0.72rem',
                      fontWeight: hasUnread ? 700 : 500,
                      color: hasUnread ? 'primary.main' : 'text.secondary',
                    }}
                  >
                    {time}
                  </Typography>
                ) : null}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.4 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  noWrap
                  sx={{ flex: 1, minWidth: 0, fontSize: '0.8125rem', fontWeight: hasUnread ? 700 : 400 }}
                >
                  <Box component="span" fontWeight={700} color="text.primary" sx={{ opacity: 0.9 }}>
                    {thread.carName}
                  </Box>
                  {' · '}
                  {thread.lastPreview}
                </Typography>
                {hasUnread ? (
                  <Box
                    aria-label={t('chat.unreadDotAria')}
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      flexShrink: 0,
                    }}
                  />
                ) : null}
              </Box>
            </Box>
          </ListItemButton>
        )
      })}
    </List>
  )
}
