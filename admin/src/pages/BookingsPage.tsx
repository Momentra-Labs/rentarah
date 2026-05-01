import OpenInNewRounded from '@mui/icons-material/OpenInNewRounded'
import {
  Box,
  Button,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  type SelectChangeEvent,
} from '@mui/material'
import { alpha } from '@mui/material/styles'

import PageHeader from '../components/PageHeader'
import { useAdminData } from '../context/AdminDataContext'
import { formatPeso } from '../lib/formatPeso'
import { marketplaceCarUrl } from '../lib/marketplaceUrl'
import type { Booking } from '../types/domain'
import { adminTableHeadRowSx, adminTablePaperSx, adminTableStripeSx } from '../theme/tableSx'

export default function BookingsPage() {
  const { bookings, setBookingStatus } = useAdminData()

  const handleStatusChange = (id: string, e: SelectChangeEvent<Booking['status']>) => {
    setBookingStatus(id, e.target.value as Booking['status'])
  }

  return (
    <Stack spacing={{ xs: 3, md: 3.5 }}>
      <PageHeader
        eyebrow="Revenue ops"
        title="Bookings ledger"
        description={
          <Box component="span" sx={{ display: 'block' }}>
            Local-only worksheet for UI polish; wire <Box component="span" sx={{ fontFamily: 'monospace', fontWeight: 620 }}>GET /admin/bookings</Box> writes to the same statuses your riders see.
          </Box>
        }
      />

      <Paper sx={{ ...adminTablePaperSx }}>
        <Box sx={{ px: { xs: 2, sm: 2.5 }, pt: 2.25, pb: 1.25 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 740 }}>
            Reservations
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Filters + exports land here next — statuses already flow into host notifications in our roadmap.
          </Typography>
        </Box>
        <Divider />
        <Box sx={{ ...adminTableStripeSx }}>
          <Table size="medium">
            <TableHead sx={adminTableHeadRowSx}>
              <TableRow>
                <TableCell>Ref</TableCell>
                <TableCell>Guest</TableCell>
                <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Dates</TableCell>
                <TableCell>Vehicle</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Fare</TableCell>
                <TableCell sx={{ minWidth: 152 }}>Status</TableCell>
                <TableCell align="right">Deep link</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bookings.map((b) => (
                <TableRow key={b.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                  <TableCell sx={{ fontWeight: 770, letterSpacing: '0.015em', color: '#0f172a' }}>{b.ref}</TableCell>
                  <TableCell>
                    <Box sx={{ fontWeight: 600 }}>{b.renterName ?? b.userId}</Box>
                    {b.location ? (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }}>
                        {b.location}
                      </Typography>
                    ) : null}
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' }, color: 'text.secondary', fontSize: '0.8125rem' }}>
                    {b.pickup} → {b.dropoff}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ fontWeight: 600 }}>{b.carName ?? b.carId}</Box>
                  </TableCell>
                  <TableCell
                    sx={{ display: { xs: 'none', md: 'table-cell' }, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
                  >
                    {formatPeso(b.total)}
                  </TableCell>
                  <TableCell sx={{ minWidth: 152 }}>
                    <FormControl size="small" fullWidth>
                      <InputLabel id={`st-${b.id}`}>State</InputLabel>
                      <Select<Booking['status']>
                        labelId={`st-${b.id}`}
                        label="State"
                        value={b.status}
                        onChange={(e) => handleStatusChange(b.id, e)}
                        sx={{ borderRadius: 1.5, bgcolor: alpha('#fff', 0.85), '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#94a3b8', 0.45) } }}
                      >
                        <MenuItem value="pending">pending</MenuItem>
                        <MenuItem value="confirmed">confirmed</MenuItem>
                        <MenuItem value="cancelled">cancelled</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell align="right">
                    <Button size="medium" variant="text" sx={{ fontWeight: 740 }} href={marketplaceCarUrl(b.carId)} target="_blank" rel="noreferrer">
                      Listing <OpenInNewRounded sx={{ fontSize: 16 }} aria-hidden />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Paper>
    </Stack>
  )
}
