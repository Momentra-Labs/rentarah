import { Box, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

export type OnboardingSlideProps = {
  icon: ReactNode
  title: string
  description: string
}

/**
 * Single feature slide — icon in a soft tile, title + supporting line.
 */
export default function OnboardingSlide({ icon, title, description }: OnboardingSlideProps) {
  const theme = useTheme()
  return (
    <motion.div
      initial={{ opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -14 }}
      transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
      style={{ width: '100%' }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          px: { xs: 1, sm: 2 },
          pt: { xs: 1, sm: 2 },
          pb: 1,
        }}
      >
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2.5,
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            color: 'primary.main',
            border: '1px solid',
            borderColor: alpha(theme.palette.primary.main, 0.12),
          }}
        >
          {icon}
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mb: 1, lineHeight: 1.25 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65, maxWidth: 320 }}>
          {description}
        </Typography>
      </Box>
    </motion.div>
  )
}
