import ChatBubbleOutline from '@mui/icons-material/ChatBubbleOutline'
import {
  Avatar,
  Box,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Typography,
} from '@mui/material'
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
    <List disablePadding sx={{ py: 0.5 }}>
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
              borderRadius: 2,
              mx: 0.5,
              mb: 0.5,
              py: 1.25,
            }}
          >
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: 'primary.main', width: 44, height: 44, fontSize: 15 }}>{other.slice(0, 2).toUpperCase()}</Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Typography component="span" fontWeight={700} noWrap display="block" sx={{ pr: 1 }}>
                  {other}
                </Typography>
              }
              secondary={
                <Box component="span" sx={{ display: 'block' }}>
                  <Typography component="span" variant="body2" color="text.primary" noWrap display="block" fontWeight={500}>
                    {t.carName}
                  </Typography>
                  <Typography component="span" variant="caption" color="text.secondary" noWrap display="block" sx={{ mt: 0.25 }}>
                    {t.lastPreview}
                  </Typography>
                </Box>
              }
            />
            <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, alignSelf: 'flex-start', pt: 0.25 }}>
              {time}
            </Typography>
          </ListItemButton>
        )
      })}
    </List>
  )
}
