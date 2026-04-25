import ArrowBack from '@mui/icons-material/ArrowBack'
import { Box, Button, Container, IconButton, Paper, Stack, Typography, useMediaQuery, useTheme } from '@mui/material'
import { useCallback, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import ChatConversationList from '../components/chat/ChatConversationList'
import ChatThreadPanel from '../components/chat/ChatThreadPanel'
import PageHeader from '../components/layout/PageHeader'
import { MOBILE_BOTTOM_NAV_SX_PB } from '../components/layout/MobileBottomNav'
import { useAuthStore } from '../store/useAuthStore'
import { useBookingStore } from '../store/useBookingStore'
import { useChatStore } from '../store/useChatStore'
import { containerGutters } from '../theme/pageStyles'

export default function ChatPage() {
  const theme = useTheme()
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'))
  const navigate = useNavigate()
  const { threadId } = useParams()
  const user = useAuthStore((s) => s.user)
  const bookings = useBookingStore((s) => s.bookings)
  const syncThreadsFromBookings = useChatStore((s) => s.syncThreadsFromBookings)
  const getThreadsForUser = useChatStore((s) => s.getThreadsForUser)
  const markThreadRead = useChatStore((s) => s.markThreadRead)
  const sendMessage = useChatStore((s) => s.sendMessage)
  const threadById = useChatStore((s) => s.threadById)
  const messagesByThread = useChatStore((s) => s.messagesByThread)
  useEffect(() => {
    syncThreadsFromBookings(bookings)
  }, [bookings, syncThreadsFromBookings])

  const threads = useMemo(() => (user ? getThreadsForUser(user.id) : []), [user, getThreadsForUser, threadById])

  const activeThread = threadId ? threadById[threadId] : undefined
  const activeMessages = threadId ? (messagesByThread[threadId] ?? []) : []

  useEffect(() => {
    if (threadId && user && (threadById[threadId]?.hostId === user.id || threadById[threadId]?.renterId === user.id)) {
      markThreadRead(threadId)
    }
  }, [threadId, user, markThreadRead, activeThread, threadById])

  const onSelect = useCallback(
    (id: string) => {
      navigate(`/messages/${id}`)
    },
    [navigate],
  )

  const onBack = useCallback(() => {
    navigate('/messages')
  }, [navigate])

  if (!user) return null

  const otherName = activeThread
    ? activeThread.hostId === user.id
      ? activeThread.renterName
      : activeThread.hostName
    : ''
  const invalidThread = Boolean(threadId && !activeThread)

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container
        maxWidth="lg"
        sx={{
          py: { xs: 2, md: 3 },
          pb: { xs: MOBILE_BOTTOM_NAV_SX_PB, md: 4 },
          ...containerGutters,
        }}
      >
        {!(threadId && !isMdUp) && (
          <PageHeader
            title="Messages"
            subtitle="Chat with your host or guest about upcoming trips and vehicle details."
            dense
          />
        )}

        {isMdUp ? (
          <Stack direction="row" spacing={2} alignItems="stretch" sx={{ mt: 1, minHeight: { md: 560 } }}>
            <Paper
              elevation={0}
              sx={{
                width: { md: 360, lg: 380 },
                flexShrink: 0,
                border: 1,
                borderColor: 'divider',
                borderRadius: 2,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box sx={{ px: 1.5, py: 1, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle2" fontWeight={800} color="text.secondary" letterSpacing="0.04em">
                  Conversations
                </Typography>
              </Box>
              <Box sx={{ overflow: 'auto', flex: 1, maxHeight: 520 }}>
                <ChatConversationList
                  threads={threads}
                  currentUserId={user.id}
                  selectedId={threadId ?? null}
                  onSelect={onSelect}
                />
              </Box>
            </Paper>
            <Paper
              elevation={0}
              sx={{
                flex: 1,
                minWidth: 0,
                border: 1,
                borderColor: 'divider',
                borderRadius: 2,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {threadId && activeThread && !invalidThread ? (
                <ChatThreadPanel
                  thread={activeThread}
                  messages={activeMessages}
                  currentUserId={user.id}
                  onSend={(body) => sendMessage(threadId, body)}
                />
              ) : invalidThread ? (
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
                  <Stack spacing={2} alignItems="center">
                    <Typography color="text.secondary">This conversation was not found.</Typography>
                    <Button variant="contained" onClick={onBack}>
                      Back to messages
                    </Button>
                  </Stack>
                </Box>
              ) : (
                <Box
                  sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 4,
                    color: 'text.secondary',
                  }}
                >
                  <Typography variant="body2" textAlign="center" fontWeight={500}>
                    Select a conversation to read and reply
                  </Typography>
                </Box>
              )}
            </Paper>
          </Stack>
        ) : (
          <Box sx={{ mt: threadId && !isMdUp ? 0 : 0.5 }}>
            {!threadId ? (
              <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                <ChatConversationList
                  threads={threads}
                  currentUserId={user.id}
                  selectedId={null}
                  onSelect={onSelect}
                />
              </Paper>
            ) : invalidThread ? (
              <Stack spacing={2} alignItems="flex-start" sx={{ py: 2 }}>
                <Button startIcon={<ArrowBack />} onClick={onBack}>
                  Back
                </Button>
                <Typography color="text.secondary">This conversation was not found.</Typography>
              </Stack>
            ) : activeThread && threadId ? (
              <Paper
                elevation={0}
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                  overflow: 'hidden',
                  minHeight: { xs: 'min(70vh, 600px)', sm: 480 },
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 0.5,
                    py: 0.75,
                    borderBottom: 1,
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                  }}
                >
                  <IconButton onClick={onBack} edge="start" aria-label="Back to conversations" size="small">
                    <ArrowBack />
                  </IconButton>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight={800} noWrap>
                      {otherName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap display="block">
                      {activeThread.carName}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                  <ChatThreadPanel
                    thread={activeThread}
                    messages={activeMessages}
                    currentUserId={user.id}
                    onSend={(body) => sendMessage(threadId, body)}
                    hideThreadHeader
                  />
                </Box>
              </Paper>
            ) : null}
          </Box>
        )}
      </Container>
    </Box>
  )
}
