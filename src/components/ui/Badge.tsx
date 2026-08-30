import MuiChip, { type ChipProps } from '@mui/material/Chip'

export type BadgeProps = ChipProps & {
  tone?: 'default' | 'verified' | 'available' | 'muted'
}

const toneSx: Record<NonNullable<BadgeProps['tone']>, ChipProps['sx']> = {
  default: undefined,
  verified: {
    bgcolor: 'success.main',
    color: '#fff',
    fontWeight: 700,
    '& .MuiChip-icon': { color: '#fff' },
  },
  available: {
    bgcolor: 'primary.light',
    color: 'primary.dark',
    fontWeight: 700,
  },
  muted: {
    bgcolor: 'grey.100',
    color: 'text.secondary',
    fontWeight: 600,
  },
}

/** Compact status chip for verified / availability / meta. */
export default function Badge({ tone = 'default', size = 'small', sx, ...rest }: BadgeProps) {
  return <MuiChip size={size} sx={[toneSx[tone], ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]} {...rest} />
}
