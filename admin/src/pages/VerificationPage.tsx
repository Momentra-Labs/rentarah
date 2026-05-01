import PersonOutlineRounded from '@mui/icons-material/PersonOutlineRounded'
import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Alert as MuiAlert,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useMemo, useState } from 'react'

import PageHeader from '../components/PageHeader'
import { useAdminData } from '../context/AdminDataContext'
import type { IdVerificationItem } from '../types/domain'
import { adminTableHeadRowSx, adminTablePaperSx, adminTableStripeSx } from '../theme/tableSx'

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

export default function VerificationPage() {
  const { verificationQueue, setVerificationStatus } = useAdminData()
  const [toast, setToast] = useState<{ msg: string; severity: 'success' | 'info' | 'warning' } | null>(null)

  const sorted = useMemo(
    () => [...verificationQueue].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)),
    [verificationQueue],
  )

  const approve = (row: IdVerificationItem) => {
    setVerificationStatus(row.id, 'approved')
    setToast({ msg: `${row.fullName} approved · sync to renters next`, severity: 'success' })
  }

  const reject = (row: IdVerificationItem) => {
    setVerificationStatus(row.id, 'rejected')
    setToast({ msg: `${row.fullName} rejected · rider notified locally`, severity: 'warning' })
  }

  return (
    <Stack spacing={{ xs: 3, md: 3.5 }}>
      <PageHeader
        eyebrow="Trust & identity"
        title="Government ID queue"
        description={
          <Box component="span" sx={{ display: 'flex', gap: 0.65, alignItems: 'baseline', flexWrap: 'wrap' }}>
            Mirrors{' '}
            <Box component="span" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
              identityVerification
            </Box>{' '}
            payloads — integrate secure storage + OCR output here when ready.
          </Box>
        }
      />

      <Paper sx={{ ...adminTablePaperSx }}>
        <Box sx={{ px: { xs: 2, sm: 2.5 }, pt: 2.25, pb: 1.25, display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Avatar
            sx={{
              bgcolor: alpha('#1a56db', 0.09),
              color: 'primary.main',
              border: `1px solid ${alpha('#1a56db', 0.18)}`,
            }}
          >
            <PersonOutlineRounded />
          </Avatar>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 740 }}>
              Submissions backlog
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Approve or reject pulls from local demo personas — persist through your compliance API thereafter.
            </Typography>
          </Box>
        </Box>
        <Divider />
        <Box sx={{ ...adminTableStripeSx }}>
          <Table size="medium">
            <TableHead sx={adminTableHeadRowSx}>
              <TableRow>
                <TableCell>Applicant</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Plate / license hint</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Submitted</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Controls</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sorted.map((r) => (
                <TableRow key={r.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                  <TableCell sx={{ py: { xs: 2, md: 2.25 } }}>
                    <Stack direction="row" spacing={2} alignItems="flex-start">
                      <Avatar sx={{ bgcolor: alpha('#475569', 0.09), color: '#0f172a', fontWeight: 800 }}>
                        {initials(r.fullName)}
                      </Avatar>
                      <Stack spacing={0.5}>
                        <Typography variant="body2" fontWeight={740}>
                          {r.fullName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.55 }}>
                          {r.email}
                          <Box component="span" sx={{ display: 'block', fontVariantNumeric: 'tabular-nums' }}>
                            UID {r.userId}
                          </Box>
                          {r.notes ? (
                            <Box
                              component="span"
                              sx={{
                                display: 'inline-block',
                                mt: 0.75,
                                px: 1,
                                py: 0.4,
                                borderRadius: 1,
                                bgcolor: alpha('#fcd34d', 0.2),
                                color: '#92400e',
                                border: `1px solid ${alpha('#f59e0b', 0.35)}`,
                                fontWeight: 600,
                                fontSize: '0.7rem',
                              }}
                            >
                              {r.notes}
                            </Box>
                          ) : null}
                        </Typography>
                      </Stack>
                    </Stack>
                  </TableCell>
                  <TableCell
                    sx={{ display: { xs: 'none', sm: 'table-cell' }, fontFamily: 'monospace', color: 'text.secondary' }}
                  >
                    DL ···{r.licenseLast4}
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, color: 'text.secondary', fontSize: '0.8125rem' }}>
                    {new Date(r.submittedAt).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={r.status.replace(/_/g, ' ')}
                      color={
                        r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'error' : 'warning'
                      }
                      variant={r.status === 'pending_review' ? 'filled' : 'outlined'}
                      sx={{ fontWeight: 750 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        disabled={r.status !== 'pending_review'}
                        onClick={() => approve(r)}
                        sx={{ minWidth: 96 }}
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        disabled={r.status !== 'pending_review'}
                        onClick={() => reject(r)}
                        sx={{ minWidth: 94 }}
                      >
                        Reject
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Paper>

      <Snackbar
        open={!!toast}
        autoHideDuration={4200}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert
          elevation={5}
          severity={toast?.severity ?? 'info'}
          variant="filled"
          onClose={() => setToast(null)}
          sx={{
            width: '100%',
            fontWeight: 650,
            boxShadow: '0 12px 32px rgba(15,23,42,0.18)',
            borderRadius: 2,
          }}
        >
          {toast?.msg ?? ''}
        </MuiAlert>
      </Snackbar>
    </Stack>
  )
}
