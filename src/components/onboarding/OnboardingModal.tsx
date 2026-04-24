import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded'
import ChatBubbleOutlineOutlined from '@mui/icons-material/ChatBubbleOutlineOutlined'
import DirectionsCarOutlined from '@mui/icons-material/DirectionsCarOutlined'
import SearchRounded from '@mui/icons-material/SearchRounded'
import VerifiedUserOutlined from '@mui/icons-material/VerifiedUserOutlined'
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  FormControlLabel,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'

import OnboardingSlide from './OnboardingSlide'

export type OnboardingModalStep = 'welcome' | 'features'

export type OnboardingModalProps = {
  open: boolean
  step: OnboardingModalStep
  onStepChange: (s: OnboardingModalStep) => void
  dontShowAgain: boolean
  onDontShowAgainChange: (v: boolean) => void
  onSkip: () => void
  onFinishFeatures: () => void
}

const FEATURE_SLIDES = [
  {
    title: 'Search nearby vehicles',
    description: 'Filter by area, dates, and vehicle type — cars and motorcycles from trusted hosts.',
    icon: <SearchRounded sx={{ fontSize: 36 }} />,
  },
  {
    title: 'Chat with hosts',
    description: 'Message hosts to confirm pickup details and ask questions before you book.',
    icon: <ChatBubbleOutlineOutlined sx={{ fontSize: 36 }} />,
  },
  {
    title: 'Book easily & securely',
    description: 'Clear pricing in PHP, simple checkout, and support when you need it.',
    icon: <VerifiedUserOutlined sx={{ fontSize: 36 }} />,
  },
] as const

export default function OnboardingModal({
  open,
  step,
  onStepChange,
  dontShowAgain,
  onDontShowAgainChange,
  onSkip,
  onFinishFeatures,
}: OnboardingModalProps) {
  const theme = useTheme()
  const [slide, setSlide] = useState(0)

  const handleGetStarted = () => {
    setSlide(0)
    onStepChange('features')
  }

  const isFeatures = step === 'features'
  const lastSlide = slide === FEATURE_SLIDES.length - 1

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') onSkip()
      }}
      fullWidth
      maxWidth="sm"
      scroll="paper"
      disableRestoreFocus
      PaperProps={{
        sx: {
          borderRadius: { xs: 3, sm: 3 },
          overflow: 'hidden',
          m: { xs: 2, sm: 3 },
          maxHeight: 'min(92dvh, 640px)',
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: `0 24px 64px ${alpha(theme.palette.common.black, 0.14)}`,
        },
      }}
    >
      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            px: 2,
            py: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: alpha(theme.palette.grey[50], 0.85),
          }}
        >
          {isFeatures ? (
            <IconButton
              size="small"
              aria-label="Back"
              onClick={() => {
                if (slide > 0) setSlide((s) => s - 1)
                else onStepChange('welcome')
              }}
            >
              <ArrowBackRounded />
            </IconButton>
          ) : (
            <Box sx={{ width: 40 }} />
          )}
          <Stack direction="row" spacing={0.75} alignItems="center">
            <DirectionsCarOutlined sx={{ fontSize: 22, color: 'primary.main' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
              RentaraH
            </Typography>
          </Stack>
          <Button size="small" onClick={onSkip} sx={{ fontWeight: 700, minWidth: 64 }}>
            Skip
          </Button>
        </Stack>

        {!isFeatures ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Stack spacing={2.5} sx={{ px: { xs: 2.5, sm: 4 }, py: { xs: 3, sm: 4 }, textAlign: 'center' }}>
              <Typography
                variant="h5"
                component="h1"
                sx={{ fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.2, fontSize: { xs: '1.5rem', sm: '1.65rem' } }}
              >
                Rent cars &amp; motorcycles with ease
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.65, maxWidth: 400, mx: 'auto' }}>
                Find vehicles near you, chat with hosts, and book instantly.
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={dontShowAgain}
                    onChange={(_, c) => onDontShowAgainChange(c)}
                  />
                }
                label={<Typography variant="body2">Don&apos;t show this again</Typography>}
                sx={{ justifyContent: 'center', mr: 0 }}
              />
              <Stack spacing={1.25} sx={{ pt: 1 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleGetStarted}
                  endIcon={<ArrowForwardRounded />}
                  sx={{ fontWeight: 800, borderRadius: 2, py: 1.35, textTransform: 'none', fontSize: '1rem' }}
                >
                  Get started
                </Button>
              </Stack>
            </Stack>
          </motion.div>
        ) : (
          <Stack sx={{ flex: 1, minHeight: 0 }}>
            <Box sx={{ flex: 1, minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', px: 1 }}>
              <AnimatePresence mode="wait">
                <OnboardingSlide
                  key={slide}
                  icon={FEATURE_SLIDES[slide].icon}
                  title={FEATURE_SLIDES[slide].title}
                  description={FEATURE_SLIDES[slide].description}
                />
              </AnimatePresence>
            </Box>
            <Stack spacing={1.5} sx={{ px: 2, pb: 2, pt: 0.5 }}>
              <Stack direction="row" justifyContent="center" spacing={0.875} sx={{ py: 0.5 }}>
                {FEATURE_SLIDES.map((_, i) => (
                  <Box
                    key={i}
                    sx={{
                      width: i === slide ? 22 : 8,
                      height: 8,
                      borderRadius: 4,
                      bgcolor: i === slide ? 'primary.main' : alpha(theme.palette.primary.main, 0.2),
                      transition: 'width 0.2s ease, background-color 0.2s ease',
                    }}
                  />
                ))}
              </Stack>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={() => (lastSlide ? onFinishFeatures() : setSlide((s) => s + 1))}
                endIcon={lastSlide ? undefined : <ArrowForwardRounded />}
                sx={{ fontWeight: 800, borderRadius: 2, py: 1.15, textTransform: 'none' }}
              >
                {lastSlide ? 'Continue' : 'Next'}
              </Button>
            </Stack>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  )
}
