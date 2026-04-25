import Send from '@mui/icons-material/Send'
import { Avatar, Box, IconButton, Paper, Stack, TextField, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import dayjs from 'dayjs'
import { useEffect, useMemo, useRef, useState } from 'react'

import type { ChatMessage, ChatThread } from '../../types'

export type ChatThreadPanelProps = {
  thread: ChatThread
  messages: ChatMessage[]
  currentUserId: string
  onSend: (body: string) => void
  /** Hide the in-panel contact row (e.g. when the page already shows a back bar). */
  hideThreadHeader?: boolean
}

function otherName(t: ChatThread, me: string) {
  return t.hostId === me ? t.renterName : t.hostName
}

export default function ChatThreadPanel({
  thread,
  messages,
  currentUserId,
  onSend,
  hideThreadHeader = false,
}: ChatThreadPanelProps) {
  const [draft, setDraft] = useState('')
  const scrollElRef = useRef<HTMLDivElement | null>(null)

  const sorted = useMemo(() => [...messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt)), [messages])

  /** Only scroll the message list box — not the window (scrollIntoView was scrolling the page / other panels). */
  useEffect(() => {
    const el = scrollElRef.current
    if (!el) return
    const run = () => {
      el.scrollTop = el.scrollHeight
    }
    run()
    const t = window.requestAnimationFrame(run)
    return () => window.cancelAnimationFrame(t)
  }, [sorted.length, thread.id])

  const title = otherName(thread, currentUserId)

  const handleSend = () => {
    const t = draft.trim()
    if (!t) return
    onSend(t)
    setDraft('')
  }

  return (
    <Stack sx={{ height: '100%', minHeight: 0, flex: 1 }}>
      {!hideThreadHeader && (
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40, fontSize: 14 }}>{title.slice(0, 2).toUpperCase()}</Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography fontWeight={800} noWrap>
                {title}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {thread.carName} · ref {thread.bookingId.slice(0, 8)}…
              </Typography>
            </Box>
          </Stack>
        </Box>
      )}

      <Box
        ref={scrollElRef}
        sx={{
          flex: 1,
          overflow: 'auto',
          px: 2,
          py: 2,
          bgcolor: (theme) => (theme.palette.mode === 'light' ? 'grey.50' : 'background.default'),
        }}
      >
        {sorted.map((m) => {
          const mine = m.senderId === currentUserId
          return (
            <Box
              key={m.id}
              sx={{
                display: 'flex',
                justifyContent: mine ? 'flex-end' : 'flex-start',
                mb: 1.5,
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  maxWidth: 'min(100%, 320px)',
                  px: 1.75,
                  py: 1.25,
                  borderRadius: 2.5,
                  bgcolor: mine ? 'primary.main' : 'background.paper',
                  color: mine ? 'primary.contrastText' : 'text.primary',
                  border: mine ? 'none' : 1,
                  borderColor: 'divider',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    lineHeight: 1.45,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    /* theme body2/caption set explicit grays that override Paper color on sent bubbles */
                    ...(mine ? { color: 'common.white' } : {}),
                  }}
                >
                  {m.body}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mt: 0.75,
                    textAlign: 'right',
                    fontSize: '0.7rem',
                    ...(mine
                      ? {
                          color: (theme) => alpha(theme.palette.common.white, 0.88),
                        }
                      : {
                          color: 'text.secondary',
                          opacity: 0.9,
                        }),
                  }}
                >
                  {dayjs(m.createdAt).format('MMM D, h:mm a')}
                </Typography>
              </Paper>
            </Box>
          )
        })}
      </Box>

      <Box
        sx={{
          p: 2,
          pt: 1.5,
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Stack direction="row" spacing={1} alignItems="flex-end">
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Type a message…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': { borderRadius: 2.5 },
            }}
          />
          <IconButton
            color="primary"
            onClick={handleSend}
            disabled={!draft.trim()}
            aria-label="Send message"
            sx={{ alignSelf: 'center' }}
          >
            <Send />
          </IconButton>
        </Stack>
      </Box>
    </Stack>
  )
}
