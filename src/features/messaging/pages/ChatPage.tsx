import ArrowBack from '@mui/icons-material/ArrowBack'
import { Box, Container, IconButton, Paper, Stack, Typography, useMediaQuery, useTheme } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useCallback, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import ChatConversationList from '@/components/chat/ChatConversationList'
import ChatThreadPanel from '@/components/chat/ChatThreadPanel'
import UserAvatar from '@/components/common/UserAvatar'
import PageHeader from '@/components/layout/PageHeader'
import { MOBILE_BOTTOM_NAV_SX_PB } from '@/components/layout/MobileBottomNav'
import EmptyState from '@/components/ui/EmptyState'
import { otherPartyName, splitDisplayName } from '@/features/messaging/chatDisplay'
import ChatEmptyGlyph from '@/features/messaging/components/ChatEmptyGlyph'
import { useAuthStore } from '@/store/useAuthStore'
import { useBookingStore } from '@/store/useBookingStore'
import { unreadForThread, useChatStore } from '@/store/useChatStore'
import { useT } from '@/hooks/useT'
import { containerGutters } from '@/theme/pageStyles'
import { rhElev, rhRadius } from '@/theme/tokens'

const paneSx = {
  border: 1,
  borderColor: 'divider',
  borderRadius: `${rhRadius.lg}px`,
  boxShadow: rhElev.elev1,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  bgcolor: 'background.paper',
} as const

export default function ChatPage() {
  const t = useT()
  const theme = useTheme()
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'))
  const navigate = useNavigate()
  const { threadId } = useParams()
  const user = useAuthStore((s) => s.user)
  const bookings = useBookingStore((s) => s.bookings)
  const syncThreadsFromBookings = useChatStore((s) => s.syncThreadsFromBookings)
  const markThreadRead = useChatStore((s) => s.markThreadRead)
  const sendMessage = useChatStore((s) => s.sendMessage)
  const threadById = useChatStore((s) => s.threadById)
  const messagesByThread = useChatStore((s) => s.messagesByThread)
  const lastReadAt = useChatStore((s) => s.lastReadAt)

  useEffect(() => {
    syncThreadsFromBookings(bookings)
  }, [bookings, syncThreadsFromBookings])

  const threads = useMemo(() => {
    if (!user) return []
    return Object.values(threadById)
      .filter((x) => x.hostId === user.id || x.renterId === user.id)
      .sort((a, b) => (a.lastMessageAt < b.lastMessageAt ? 1 : -1))
  }, [user, threadById])

  const unreadByThread = useMemo(() => {
    if (!user) return {}
    const map: Record<string, number> = {}
    for (const th of threads) {
      map[th.id] = unreadForThread(user.id, th.id, messagesByThread[th.id] ?? [], lastReadAt)
    }
    return map
  }, [user, threads, messagesByThread, lastReadAt])

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

  const otherName = activeThread ? otherPartyName(activeThread, user.id) : ''
  const otherNames = splitDisplayName(otherName)
  const invalidThread = Boolean(threadId && !activeThread)

  const selectEmpty = (
    <EmptyState
      title={t('chat.selectTitle')}
      description={t('chat.select')}
      icon={<ChatEmptyGlyph />}
    />
  )

  const notFoundEmpty = (
    <EmptyState
      title={t('chat.notFound')}
      actionLabel={t('chat.backToMessages')}
      onAction={onBack}
      icon={<ChatEmptyGlyph size={64} />}
    />
  )

  if (!isMdUp) {
    return (
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.default',
          height: '100%',
          pt: threadId ? 'env(safe-area-inset-top, 0px)' : 0,
        }}
      >
        {!threadId ? (
          <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <Box
              sx={{
                px: 2,
                pt: 1.5,
                pb: 1.25,
                borderBottom: 1,
                borderColor: 'divider',
                bgcolor: 'background.paper',
                flexShrink: 0,
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em', fontSize: '1.35rem' }}>
                {t('chat.title')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35, lineHeight: 1.5 }}>
                {t('chat.subtitle')}
              </Typography>
            </Box>
            <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
              <ChatConversationList
                threads={threads}
                currentUserId={user.id}
                selectedId={null}
                onSelect={onSelect}
                unreadByThread={unreadByThread}
              />
            </Box>
          </Box>
        ) : invalidThread ? (
          <Stack spacing={1} sx={{ p: 2, flex: 1 }}>
            {notFoundEmpty}
          </Stack>
        ) : activeThread && threadId ? (
          <Paper
            elevation={0}
            sx={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 0,
              border: 'none',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 0.75,
                py: 1,
                borderBottom: 1,
                borderColor: 'divider',
                bgcolor: 'background.paper',
                flexShrink: 0,
              }}
            >
              <IconButton onClick={onBack} edge="start" aria-label={t('chat.backAria')} size="small">
                <ArrowBack />
              </IconButton>
              <UserAvatar
                avatar={null}
                firstName={otherNames.firstName}
                lastName={otherNames.lastName}
                size={36}
                sx={{ flexShrink: 0 }}
              />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="subtitle1" fontWeight={800} noWrap sx={{ letterSpacing: '-0.02em' }}>
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
    )
  }

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
        <PageHeader title={t('chat.title')} subtitle={t('chat.subtitle')} dense />

        <Stack direction="row" spacing={2} alignItems="stretch" sx={{ mt: 1, minHeight: { md: 560 } }}>
          <Paper
            elevation={0}
            sx={{
              ...paneSx,
              width: { md: 360, lg: 380 },
              flexShrink: 0,
            }}
          >
            <Box
              sx={{
                px: 2,
                py: 1.25,
                borderBottom: 1,
                borderColor: 'divider',
                bgcolor: 'background.paper',
              }}
            >
              <Typography variant="h6" fontWeight={800} fontSize="1.1rem" letterSpacing="-0.02em">
                {t('chat.chats')}
              </Typography>
            </Box>
            <Box sx={{ overflow: 'auto', flex: 1, maxHeight: 520 }}>
              <ChatConversationList
                threads={threads}
                currentUserId={user.id}
                selectedId={threadId ?? null}
                onSelect={onSelect}
                unreadByThread={unreadByThread}
              />
            </Box>
          </Paper>
          <Paper
            elevation={0}
            sx={{
              ...paneSx,
              flex: 1,
              minWidth: 0,
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
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
                {notFoundEmpty}
              </Box>
            ) : (
              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 2,
                  bgcolor: (th) => alpha(th.palette.primary.main, th.palette.mode === 'dark' ? 0.06 : 0.04),
                }}
              >
                {selectEmpty}
              </Box>
            )}
          </Paper>
        </Stack>
      </Container>
    </Box>
  )
}
