import { Box } from '@mui/material'
import { AnimatePresence, motion } from 'framer-motion'
import { useLayoutEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import Footer from './Footer'
import Navbar from './Navbar'
import { pageMotionTransition, pageMotionVariants } from './pageMotion'
import { useCarsStore } from '../../store/useCarsStore'

export default function MainLayout() {
  const location = useLocation()

  useLayoutEffect(() => {
    useCarsStore.getState().initCars()
  }, [])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar />
      <Box
        component="main"
        sx={{
          flex: 1,
          width: '100%',
          pb: { xs: 'max(12px, env(safe-area-inset-bottom))', sm: 0 },
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={pageMotionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageMotionTransition}
            style={{ minHeight: '100%' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </Box>
      <Footer />
    </Box>
  )
}
