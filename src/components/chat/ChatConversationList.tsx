import ChatBubbleOutline from '@mui/icons-material/ChatBubbleOutline'
import { Avatar, Box, List, ListItemButton, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

import type { ChatThread } from '../../types'

dayjs.extend(relativeTime)

export type ChatConversationListProps = {
  threads: ChatThread[]
  currentUserId: string
  selectedId: string | null
  onSelect: (threadId: string) => void
}

function otherName(t: ChatThread, me: string) {
  return t.hostId === me ? t.renterName : t.hostName
}

export default function ChatConversationList({
  threads,
  currentUserId,
  selectedId,
  onSelect,
}: ChatConversationListProps) {
  if (threads.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 6,
          px: 2,
          textAlign: 'center',
          bgcolor: (theme) => (theme.palette.mode === 'light' ? '#f0f2f5' : 'action.hover'),
        }}
      >
        <ChatBubbleOutline sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
        <Typography variant="body1" color="text.secondary" fontWeight={600}>
          No conversations yet
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 320 }}>
          When you have an active trip, you and the other party can message each other here.
        </Typography>
      </Box>
    )
  }

  return (
    <List
      disablePadding
      sx={{
        py: 0,
        bgcolor: (theme) => (theme.palette.mode === 'light' ? '#f0f2f5' : 'action.hover'),
      }}
    >
      {threads.map((t) => {
        const other = otherName(t, currentUserId)
        const time = t.lastMessageAt ? dayjs(t.lastMessageAt).fromNow() : ''
        return (
          <ListItemButton
            key={t.id}
            selected={selectedId === t.id}
            onClick={() => onSelect(t.id)}
            alignItems="flex-start"
            sx={{
              py: 1.25,
              px: 2,
              gap: 1.5,
              borderBottom: 1,
              borderColor: (theme) => alpha(theme.palette.divider, 0.6),
              borderRadius: 0,
              '&:hover': {
                bgcolor: (theme) => alpha(theme.palette.action.hover, theme.palette.mode === 'light' ? 0.8 : 1),
              },
              '&.Mui-selected': {
                bgcolor: (theme) => alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.1 : 0.2),
                '&:hover': {
                  bgcolor: (theme) => alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.14 : 0.26),
                },
              },
            }}
          >
            <Avatar
              sx={{
                bgcolor: 'primary.main',
                width: 56,
                height: 56,
                fontSize: '1rem',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {other.slice(0, 2).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 1 }}>
                <Typography fontWeight={700} fontSize="0.95rem" noWrap sx={{ flex: 1, minWidth: 0 }}>
                  {other}
                </Typography>
                {time ? (
                  <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, fontSize: '0.72rem' }}>
                    {time}
                  </Typography>
                ) : null}
              </Box>
              <Typography variant="body2" color="text.secondary" noWrap sx={{ mt: 0.35, fontSize: '0.8125rem' }}>
                <Box component="span" fontWeight={600} color="text.primary" sx={{ opacity: 0.85 }}>
                  {t.carName}
                </Box>
                {' · '}
                {t.lastPreview}
              </Typography>
            </Box>
          </ListItemButton>
        )
      })}
    </List>
  )
}
