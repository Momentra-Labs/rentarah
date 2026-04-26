import Send from '@mui/icons-material/Send'
import { Avatar, Box, IconButton, Stack, TextField, Typography } from '@mui/material'
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
            boxShadow: (theme) =>
              theme.palette.mode === 'light' ? '0 1px 0 rgba(0, 0, 0, 0.06)' : '0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: 'primary.main', width: 44, height: 44, fontSize: '0.9rem', fontWeight: 700 }}>
              {title.slice(0, 2).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography fontWeight={800} fontSize="1rem" noWrap>
                {title}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap sx={{ fontSize: '0.8125rem' }}>
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
          bgcolor: (theme) => (theme.palette.mode === 'light' ? '#f0f2f5' : 'background.default'),
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
                mb: 1.25,
              }}
            >
              <Box
                sx={{
                  maxWidth: 'min(100%, 75%)',
                  px: 1.75,
                  py: 1,
                  borderRadius: mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  bgcolor: mine ? 'primary.main' : 'background.paper',
                  color: mine ? 'primary.contrastText' : 'text.primary',
                  boxShadow: mine
                    ? '0 1px 0.5px rgba(0, 0, 0, 0.1)'
                    : (theme) =>
                        theme.palette.mode === 'light' ? '0 1px 0.5px rgba(0, 0, 0, 0.13)' : '0 1px 2px rgba(0,0,0,0.25)',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    lineHeight: 1.45,
                    fontSize: '0.9375rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    ...(mine ? { color: 'common.white' } : {}),
                  }}
                >
                  {m.body}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mt: 0.5,
                    textAlign: 'right',
                    fontSize: '0.68rem',
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
              </Box>
            </Box>
          )
        })}
      </Box>

      <Box
        sx={{
          px: 1.5,
          py: 1.25,
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
            placeholder="Message…"
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
              '& .MuiOutlinedInput-root': {
                borderRadius: '24px',
                pl: 2,
                pr: 1,
                py: 0.75,
                bgcolor: (theme) => (theme.palette.mode === 'light' ? '#f0f2f5' : 'action.hover'),
                '& fieldset': { borderColor: 'transparent' },
                '&:hover fieldset': { borderColor: 'transparent' },
                '&.Mui-focused fieldset': { borderColor: 'primary.main', borderWidth: '1px' },
              },
            }}
          />
          <IconButton
            onClick={handleSend}
            disabled={!draft.trim()}
            aria-label="Send message"
            sx={{
              flexShrink: 0,
              width: 40,
              height: 40,
              mb: 0.25,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': { bgcolor: 'primary.dark' },
              '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'action.disabled' },
            }}
          >
            <Send sx={{ fontSize: 20 }} />
          </IconButton>
        </Stack>
      </Box>
    </Stack>
  )
}
