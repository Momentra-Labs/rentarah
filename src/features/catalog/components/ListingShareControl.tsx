import ContentCopy from '@mui/icons-material/ContentCopy'
import EmailOutlined from '@mui/icons-material/EmailOutlined'
import Facebook from '@mui/icons-material/Facebook'
import IosShare from '@mui/icons-material/IosShare'
import ShareOutlined from '@mui/icons-material/ShareOutlined'
import Telegram from '@mui/icons-material/Telegram'
import Twitter from '@mui/icons-material/Twitter'
import WhatsApp from '@mui/icons-material/WhatsApp'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { alpha, type Theme } from '@mui/material/styles'
import { useCallback, useMemo, useState, type MouseEvent, type ReactNode } from 'react'

import { useT } from '@/hooks/useT'
import { useSnackbarStore } from '@/store/useSnackbarStore'
import { rhRadius } from '@/theme/tokens'

import {
  canUseWebShare,
  copyToClipboard,
  listingShareSocialUrls,
  listingShareUrl,
  shareWithWebApi,
} from '../listingShare'

const OVERLAY_BTN_SX = {
  width: 36,
  height: 36,
  bgcolor: (th: Theme) => alpha(th.palette.common.white, 0.92),
  boxShadow: '0 1px 6px rgba(15,23,42,0.16)',
  '&:hover': { bgcolor: 'common.white' },
}

export type ListingShareControlProps = {
  carId: string
  title: string
  location: string
  priceLabel: string
  variant?: 'icon' | 'overlay' | 'button'
}

function stopBubble(e: MouseEvent) {
  e.stopPropagation()
}

export default function ListingShareControl({
  carId,
  title,
  location,
  priceLabel,
  variant = 'icon',
}: ListingShareControlProps) {
  const t = useT()
  const showSuccess = useSnackbarStore((s) => s.showSuccess)
  const showError = useSnackbarStore((s) => s.showError)
  const [open, setOpen] = useState(false)
  const nativeShare = canUseWebShare()

  const url = useMemo(
    () => listingShareUrl(carId, typeof window !== 'undefined' ? window.location.origin : '', import.meta.env.BASE_URL),
    [carId],
  )
  const text = t('detail.shareBody', { title, price: priceLabel, location })
  const hrefs = useMemo(() => listingShareSocialUrls(url, text, title), [url, text, title])

  const openPanel = useCallback((e: MouseEvent) => {
    stopBubble(e)
    e.preventDefault()
    setOpen(true)
  }, [])

  const copyLink = useCallback(async () => {
    const ok = await copyToClipboard(url)
    if (ok) showSuccess(t('detail.linkCopied'))
    else showError(t('detail.copyFailed'))
  }, [showError, showSuccess, t, url])

  const native = useCallback(async () => {
    const result = await shareWithWebApi({ title, text, url })
    if (result === 'shared') setOpen(false)
  }, [text, title, url])

  const openSocial = (href: string) => {
    window.open(href, '_blank', 'noopener,noreferrer')
  }

  const trigger =
    variant === 'button' ? (
      <Button
        type="button"
        size="small"
        variant="outlined"
        startIcon={<ShareOutlined fontSize="small" />}
        onClick={openPanel}
        onMouseDown={stopBubble}
        aria-label={t('detail.shareAria')}
        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, flexShrink: 0 }}
      >
        {t('detail.share')}
      </Button>
    ) : (
      <IconButton
        type="button"
        size="small"
        aria-label={t('detail.shareAria')}
        onClick={openPanel}
        onMouseDown={stopBubble}
        sx={variant === 'overlay' ? OVERLAY_BTN_SX : undefined}
      >
        <IosShare fontSize="small" />
      </IconButton>
    )

  const socialBtn = (label: string, href: string, icon: ReactNode) => (
    <Tooltip title={label} key={label}>
      <IconButton
        aria-label={label}
        onClick={() => openSocial(href)}
        sx={{
          border: 1,
          borderColor: 'divider',
          borderRadius: `${rhRadius.md}px`,
          width: 44,
          height: 44,
        }}
      >
        {icon}
      </IconButton>
    </Tooltip>
  )

  return (
    <>
      {trigger}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="xs"
        onClick={stopBubble}
        aria-labelledby="listing-share-title"
      >
        <DialogTitle id="listing-share-title" sx={{ fontWeight: 800, letterSpacing: '-0.02em', pr: 2 }}>
          {t('detail.shareDialogTitle')}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.55 }}>
            {text}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="stretch">
            <TextField
              value={url}
              fullWidth
              size="small"
              InputProps={{ readOnly: true }}
              inputProps={{ 'aria-label': t('detail.copyLink') }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <Button
              variant="contained"
              onClick={() => void copyLink()}
              startIcon={<ContentCopy fontSize="small" />}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, flexShrink: 0, px: 1.5 }}
            >
              {t('detail.copyLink')}
            </Button>
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, mb: 1, fontWeight: 700, letterSpacing: '0.04em' }}>
            {t('detail.share')}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {socialBtn(t('detail.shareWhatsApp'), hrefs.whatsapp, <WhatsApp />)}
            {socialBtn(t('detail.shareFacebook'), hrefs.facebook, <Facebook />)}
            {socialBtn(t('detail.shareX'), hrefs.x, <Twitter />)}
            {socialBtn(t('detail.shareTelegram'), hrefs.telegram, <Telegram />)}
            {socialBtn(t('detail.shareEmail'), hrefs.email, <EmailOutlined />)}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          {nativeShare ? (
            <Button onClick={() => void native()} startIcon={<IosShare />} sx={{ textTransform: 'none', fontWeight: 700, mr: 'auto' }}>
              {t('detail.shareViaApps')}
            </Button>
          ) : null}
          <Button onClick={() => setOpen(false)} sx={{ textTransform: 'none', fontWeight: 600 }}>
            {t('common.close')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
