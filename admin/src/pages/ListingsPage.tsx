import OpenInNewRounded from '@mui/icons-material/OpenInNewRounded'
import SearchRounded from '@mui/icons-material/SearchRounded'
import {
  Box,
  Chip,
  FormControlLabel,
  InputAdornment,
  LinearProgress,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useMemo, useState } from 'react'

import PageHeader from '../components/PageHeader'
import { useAdminData } from '../context/AdminDataContext'
import { formatPeso } from '../lib/formatPeso'
import { marketplaceCarUrl } from '../lib/marketplaceUrl'
import { adminTableHeadRowSx, adminTablePaperSx, adminTableStripeSx } from '../theme/tableSx'

const vehicleAccent: Record<string, string> = {
  car: '#1A56DB',
  motorcycle: '#7c3aed',
  scooter: '#0d9488',
  bigbike: '#ea580c',
}

export default function ListingsPage() {
  const { vehiclesDisplay, catalogLoading, catalogSource, setListingAvailable } = useAdminData()
  const [q, setQ] = useState('')
  const [twoWheelOnly, setTwoWheelOnly] = useState(false)

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return vehiclesDisplay.filter((v) => {
      if (twoWheelOnly && v.vehicleType === 'car') return false
      if (!query) return true
      const blob = `${v.id} ${v.make} ${v.model} ${v.location} ${v.hostName}`.toLowerCase()
      return blob.includes(query)
    })
  }, [vehiclesDisplay, q, twoWheelOnly])

  return (
    <Stack spacing={{ xs: 3, md: 3.5 }}>
      <PageHeader
        eyebrow="Catalog"
        title="Listings control"
        description={
          <>
            Toggle availability persists in-session only (
            <Box component="span" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
              sessionStorage
            </Box>
            ); align with PATCH + admin JWT when APIs land.
            {catalogSource === 'api' ? ' Live fleet from your backend.' : null}
          </>
        }
      />

      {catalogLoading ? <LinearProgress sx={{ borderRadius: 999, height: 4 }} /> : null}

      <Paper sx={{ ...adminTablePaperSx }}>
        <Box
          sx={{
            px: { xs: 2, sm: 2.5 },
            py: { xs: 2, sm: 2.25 },
            bgcolor: alpha('#f8fafc', 0.94),
            borderBottom: `1px solid ${alpha('#e2e8f0', 0.85)}`,
          }}
        >
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
            <TextField
              size="small"
              placeholder="Search listing id, model, location, host…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              sx={{ flex: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRounded fontSize="small" color="primary" />
                  </InputAdornment>
                ),
              }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={twoWheelOnly}
                  onChange={(e) => setTwoWheelOnly(e.target.checked)}
                  inputProps={{ 'aria-label': 'Filter motorcycles and scooters only' }}
                />
              }
              label="Two-wheel only"
              sx={{ whiteSpace: 'nowrap', fontWeight: 600, color: 'text.secondary', ml: { md: 1 } }}
            />
          </Stack>
        </Box>

        <Box sx={{ ...adminTableStripeSx }}>
          <Table size="medium">
            <TableHead sx={adminTableHeadRowSx}>
              <TableRow>
                <TableCell>Vehicle</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Segment</TableCell>
                <TableCell>Host</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, fontVariantNumeric: 'tabular-nums' }}>
                  Rate / day
                </TableCell>
                <TableCell>Live</TableCell>
                <TableCell align="right">Listing</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((v) => {
                const thumb = v.images?.[0]
                const accent = vehicleAccent[v.vehicleType] ?? '#1A56DB'
                return (
                  <TableRow key={v.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                    <TableCell sx={{ py: { xs: 1.75, md: 2 } }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        {thumb ? (
                          <Box
                            component="img"
                            src={thumb}
                            alt=""
                            sx={{
                              width: 56,
                              height: 56,
                              borderRadius: 2,
                              objectFit: v.vehicleType === 'car' ? 'cover' : 'contain',
                              bgcolor: '#f8fafc',
                              flexShrink: 0,
                              boxShadow: '0 4px 12px rgba(15,23,42,0.12)',
                            }}
                          />
                        ) : (
                          <Box sx={{ width: 56, height: 56, borderRadius: 2, bgcolor: 'grey.200', flexShrink: 0 }} />
                        )}
                        <Stack spacing={0.25}>
                          <Box sx={{ typography: 'body2', fontWeight: 750 }}>
                            {v.year} {v.make} {v.model}
                          </Box>
                          <Box sx={{ typography: 'caption', color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
                            <Box component="span" sx={{ fontWeight: 600, color: 'text.primary', mr: 0.75 }}>
                              {v.id}
                            </Box>
                            · {v.location}
                          </Box>
                        </Stack>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      <Chip
                        label={v.vehicleType.replace('bigbike', 'big bike')}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          textTransform: 'capitalize',
                          border: `1px solid ${alpha(accent, 0.42)}`,
                          bgcolor: alpha(accent, 0.08),
                          color: accent,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ typography: 'body2', fontWeight: 630 }}>{v.hostName}</Box>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, fontWeight: 670 }}>{formatPeso(v.pricePerDay)}</TableCell>
                    <TableCell>
                      <Switch
                        checked={v.available}
                        onChange={(e) => setListingAvailable(v.id, e.target.checked)}
                        inputProps={{ 'aria-label': `Toggle visibility for ${v.id}` }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box
                        component="a"
                        sx={{
                          typography: 'body2',
                          fontWeight: 760,
                          textDecoration: 'none',
                          color: 'primary.main',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.25,
                          '&:hover': { textDecoration: 'underline', color: 'primary.dark' },
                        }}
                        href={marketplaceCarUrl(v.id)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View listing <OpenInNewRounded sx={{ fontSize: 16 }} aria-hidden />
                      </Box>
                    </TableCell>
                  </TableRow>
                )
              })}
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ py: 7, textAlign: 'center', color: 'text.secondary' }}>
                    No listings match filters — widen search or reconnect the API.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </Box>
      </Paper>
    </Stack>
  )
}
