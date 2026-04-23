import { Box } from '@mui/material'

import LoadingRoadScene from './LoadingRoadScene'
import RentaraLoadingLogo from './RentaraLoadingLogo'

/**
 * Full-viewport loader: brand mark + animated road scene (cars & motorcycles).
 */
export default function LoadingScreen() {
  return (
    <Box
      role="status"
      aria-busy="true"
      aria-label="Loading"
      sx={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        bgcolor: '#FFFFFF',
      }}
    >
      <Box sx={{ mb: { xs: 0.25, sm: 0.5, md: 0.75 }, transition: 'opacity 0.25s ease' }}>
        <RentaraLoadingLogo />
      </Box>

      <LoadingRoadScene />
    </Box>
  )
}
