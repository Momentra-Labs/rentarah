import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

import { pageMotionTransition, pageMotionVariants } from './pageMotion'

export default function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      variants={pageMotionVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageMotionTransition}
      style={{ minHeight: '100%' }}
    >
      {children}
    </motion.div>
  )
}
