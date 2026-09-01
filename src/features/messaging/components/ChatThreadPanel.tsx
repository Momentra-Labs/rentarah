import Send from '@mui/icons-material/Send'
import { Box, Chip, IconButton, Stack, TextField, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import dayjs from 'dayjs'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import UserAvatar from '@/components/common/UserAvatar'
import { otherPartyName, splitDisplayName } from '@/features/messaging/chatDisplay'
import { groupMessagesByDay } from '@/features/messaging/groupMessagesByDay'
import { useT } from '@/hooks/useT'
import type { ChatMessage, ChatThread } from '@/types'
import { rhElev, rhRadius } from '@/theme/tokens'

export type ChatThreadPanelProps = {
  thread: ChatThread
  messages: ChatMessage[]
  currentUserId: string
  onSend: (body: string) => void
  /** Hide the in-panel contact row (e.g. when the page already shows a back bar). */
  hideThreadHeader?: boolean
}

export default function ChatThreadPanel({
  thread,
  messages,
  currentUserId,
  onSend,
  hideThreadHeader = false,
}: ChatThreadPanelProps) {
  const t = useT()
  const theme = useTheme()
  const navigate = useNavigate()
  const [draft, setDraft] = useState('')
  const scrollElRef = useRef<HTMLDivElement | null>(null)

  const groups = useMemo(() => groupMessagesByDay(messages), [messages])

  useEffect(() => {
    const el = scrollElRef.current
    if (!el) return
    const run = () => {
      el.scrollTop = el.scrollHeight
    }
    run()
    const frame = window.requestAnimationFrame(run)
    return () => window.cancelAnimationFrame(frame)
  }, [messages.length, thread.id])

  const title = otherPartyName(thread, currentUserId)
  const names = splitDisplayName(title)

  const handleSend = () => {
    const next = draft.trim()
    if (!next) return
    onSend(next)
    setDraft('')
  }

  const dayLabel = (kind: 'today' | 'yesterday' | 'date', sampleIso: string) => {
    if (kind === 'today') return t('chat.today')
    if (kind === 'yesterday') return t('chat.yesterday')
    const parsed = dayjs(sampleIso)
    return parsed.isValid() ? parsed.format('MMM D, YYYY') : ''
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
            <UserAvatar
              avatar={null}
              firstName={names.firstName}
              lastName={names.lastName}
              size={44}
              sx={{
                flexShrink: 0,
                boxShadow: `0 0 0 2px ${theme.palette.background.paper}, 0 0 0 4px ${alpha(theme.palette.primary.main, 0.28)}`,
              }}
            />
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography fontWeight={800} fontSize="1rem" noWrap sx={{ letterSpacing: '-0.02em' }}>
                {title}
              </Typography>
              <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                <Chip
                  size="small"
                  label={thread.carName}
                  clickable={Boolean(thread.carId)}
                  onClick={thread.carId ? () => navigate(`/cars/${thread.carId}`) : undefined}
                  aria-label={thread.carId ? t('chat.viewListing') : undefined}
                  sx={{ fontWeight: 700, height: 24, borderRadius: 999, maxWidth: '100%' }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: '0.03em' }}>
                  {t('chat.ref', { id: thread.bookingId.slice(0, 8) })}
                </Typography>
              </Stack>
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
          bgcolor: (th) => alpha(th.palette.primary.main, th.palette.mode === 'dark' ? 0.06 : 0.04),
        }}
      >
        {groups.map((group) => (
          <Box key={group.dayKey}>
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 1.5 }}>
              <Typography
                variant="caption"
                sx={{
                  px: 1.25,
                  py: 0.35,
                  borderRadius: 999,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  color: 'text.secondary',
                  bgcolor: (th) => alpha(th.palette.background.paper, th.palette.mode === 'dark' ? 0.7 : 0.9),
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                {dayLabel(group.kind, group.sampleIso)}
              </Typography>
            </Box>
            {group.messages.map((m, i) => {
              const mine = m.senderId === currentUserId
              const prev = group.messages[i - 1]
              const tight = Boolean(prev && prev.senderId === m.senderId)
              const radius = `${rhRadius.lg}px`
              return (
                <Box
                  key={m.id}
                  sx={{
                    display: 'flex',
                    justifyContent: mine ? 'flex-end' : 'flex-start',
                    mb: tight ? 0.5 : 1.25,
                  }}
                >
                  <Box
                    sx={{
                      maxWidth: 'min(100%, 75%)',
                      px: 1.75,
                      py: 1,
                      borderRadius: mine ? `${radius} ${radius} 4px ${radius}` : `${radius} ${radius} ${radius} 4px`,
                      bgcolor: mine ? 'primary.main' : 'background.paper',
                      color: mine ? 'primary.contrastText' : 'text.primary',
                      boxShadow: mine ? 'none' : rhElev.elev1,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        lineHeight: 1.45,
                        fontSize: '0.9375rem',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        color: mine ? 'common.white' : 'text.primary',
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
                        fontWeight: 600,
                        color: mine ? alpha(theme.palette.common.white, 0.88) : 'text.secondary',
                      }}
                    >
                      {dayjs(m.createdAt).format('h:mm a')}
                    </Typography>
                  </Box>
                </Box>
              )
            })}
          </Box>
        ))}
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
            placeholder={t('chat.placeholder')}
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
                borderRadius: `${rhRadius.pill}px`,
                pl: 2,
                pr: 1,
                py: 0.75,
                bgcolor: (th) => alpha(th.palette.primary.main, th.palette.mode === 'dark' ? 0.12 : 0.06),
                '& fieldset': { borderColor: 'transparent' },
                '&:hover fieldset': { borderColor: 'transparent' },
                '&.Mui-focused fieldset': { borderColor: 'primary.main', borderWidth: '1px' },
              },
            }}
          />
          <IconButton
            onClick={handleSend}
            disabled={!draft.trim()}
            aria-label={t('chat.send')}
            sx={{
              flexShrink: 0,
              width: 40,
              height: 40,
              mb: 0.25,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              boxShadow: rhElev.elev1,
              '&:hover': { bgcolor: 'primary.dark' },
              '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'action.disabled', boxShadow: 'none' },
            }}
          >
            <Send sx={{ fontSize: 20 }} />
          </IconButton>
        </Stack>
      </Box>
    </Stack>
  )
}
