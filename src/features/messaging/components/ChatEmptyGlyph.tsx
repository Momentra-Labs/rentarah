import ChatBubbleOutline from '@mui/icons-material/ChatBubbleOutline'
import { Box } from '@mui/material'

export default function ChatEmptyGlyph({ size = 80 }: { size?: number }) {
  const iconSize = size < 64 ? 28 : 40
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        bgcolor: 'primary.light',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <ChatBubbleOutline sx={{ fontSize: iconSize, color: 'primary.main' }} aria-hidden />
    </Box>
  )
}
