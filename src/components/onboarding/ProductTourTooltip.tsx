import CloseRounded from '@mui/icons-material/CloseRounded'
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { motion } from 'framer-motion'

export type ProductTourTooltipProps = {
  title: string
  description: string
  stepIndex: number
  stepCount: number
  dontShowAgain: boolean
  onDontShowAgainChange: (checked: boolean) => void
  onNext: () => void
  onSkip: () => void
  isLast: boolean
  /** Tooltip position (viewport coords); card is placed below when possible. */
  anchorRect: DOMRect | null
  /** Stack above tour dimmer panels. */
  zIndex?: number
}

/**
 * Spotlight-style tour callout — positioned near the highlighted region.
 */
export default function ProductTourTooltip({
  title,
  description,
  stepIndex,
  stepCount,
  dontShowAgain,
  onDontShowAgainChange,
  onNext,
  onSkip,
  isLast,
  anchorRect,
  zIndex: zIndexProp,
}: ProductTourTooltipProps) {
  const theme = useTheme()
  const zIndex = zIndexProp ?? theme.zIndex.modal + 2

  const top = anchorRect
    ? Math.min(anchorRect.bottom + 16, window.innerHeight - 280)
    : 120
  const left = anchorRect
    ? Math.max(16, Math.min(anchorRect.left + anchorRect.width / 2 - 160, window.innerWidth - 336))
    : Math.max(16, (window.innerWidth - 320) / 2)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      style={{
        position: 'fixed',
        top: Math.max(80, top),
        left,
        width: 'min(calc(100vw - 32px), 320px)',
        zIndex,
        pointerEvents: 'auto',
      }}
    >
      <Paper
        elevation={8}
        sx={{
          borderRadius: 3,
          p: 2.25,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: `0 20px 50px ${alpha(theme.palette.common.black, 0.12)}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Stack spacing={1.5}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: '0.08em', fontSize: '0.65rem' }}>
                Quick tour · {stepIndex + 1}/{stepCount}
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mt: 0.25 }}>
                {title}
              </Typography>
            </Box>
            <IconButton size="small" aria-label="Skip tour" onClick={onSkip} sx={{ mt: -0.5, mr: -0.5 }}>
              <CloseRounded fontSize="small" />
            </IconButton>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
            {description}
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={dontShowAgain}
                onChange={(_, c) => onDontShowAgainChange(c)}
                sx={{ py: 0.5 }}
              />
            }
            label={<Typography variant="body2">Don&apos;t show this again</Typography>}
            sx={{ m: 0, alignItems: 'center', mr: 0 }}
          />
          <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ pt: 0.5 }}>
            <Button variant="text" color="inherit" onClick={onSkip} sx={{ fontWeight: 600 }}>
              Skip tour
            </Button>
            <Button variant="contained" onClick={onNext} sx={{ fontWeight: 700, borderRadius: 2, px: 2.5 }}>
              {isLast ? 'Done' : 'Next'}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </motion.div>
  )
}
