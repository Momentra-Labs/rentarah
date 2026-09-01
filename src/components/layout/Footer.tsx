import FacebookOutlined from '@mui/icons-material/FacebookOutlined'
import Instagram from '@mui/icons-material/Instagram'
import { Box, Container, Link, Stack, Typography } from '@mui/material'
import { alpha, type SxProps, type Theme } from '@mui/material/styles'
import { Link as RouterLink } from 'react-router-dom'

import { useT } from '@/hooks/useT'
import type { MessageKey } from '@/i18n/translate'
import { containerGutters } from '@/theme/pageStyles'
import { rhRadius } from '@/theme/tokens'

import RentaraLogoMark from '../brand/RentaraLogoMark'

type FooterRouteLink = { labelKey: MessageKey; to: string }
type FooterMailLink = { labelKey: MessageKey; href: string; external: true }
type FooterLinkItem = FooterRouteLink | FooterMailLink

const EXPLORE_LINKS: FooterRouteLink[] = [
  { labelKey: 'footer.home', to: '/' },
  { labelKey: 'footer.browse', to: '/search' },
]

const HOST_LINKS: FooterRouteLink[] = [{ labelKey: 'footer.becomeHost', to: '/become-a-host' }]

const LEGAL_LINKS: FooterLinkItem[] = [
  { labelKey: 'footer.terms', to: '/legal/terms' },
  { labelKey: 'footer.privacy', to: '/legal/privacy' },
  { labelKey: 'footer.contact', href: 'mailto:hello@rentara.com', external: true },
]

const SOCIAL = [
  { label: 'Facebook', href: 'https://facebook.com', Icon: FacebookOutlined },
  { label: 'Instagram', href: 'https://instagram.com', Icon: Instagram },
] as const

const linkSx: SxProps<Theme> = {
  typography: 'body2',
  fontWeight: 500,
  fontSize: '0.875rem',
  color: 'text.secondary',
  textDecoration: 'none',
  letterSpacing: '-0.01em',
  lineHeight: 1.5,
  display: 'inline-block',
  transition: 'color 0.2s ease',
  '&:hover': { color: 'primary.main' },
  '&:focus-visible': {
    outline: '2px solid',
    outlineColor: 'primary.main',
    outlineOffset: 2,
    borderRadius: 0.5,
  },
}

const columnHeadingSx: SxProps<Theme> = {
  fontSize: '0.6875rem',
  fontWeight: 800,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'text.secondary',
  mb: 0.75,
}

const logoLinkSx: SxProps<Theme> = {
  display: 'inline-block',
  maxWidth: 200,
  lineHeight: 0,
  textDecoration: 'none',
  color: 'inherit',
  flexShrink: 0,
  '&:focus-visible': {
    outline: '2px solid',
    outlineColor: 'primary.main',
    outlineOffset: 3,
    borderRadius: 1,
  },
}

const socialBtnSx: SxProps<Theme> = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 36,
  height: 36,
  borderRadius: `${rhRadius.pill}px`,
  color: 'text.secondary',
  border: '1px solid',
  borderColor: 'divider',
  textDecoration: 'none',
  transition: 'color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease',
  '&:hover': {
    color: 'primary.main',
    borderColor: 'primary.main',
    bgcolor: (t) => alpha(t.palette.primary.main, 0.06),
  },
  '&:focus-visible': {
    outline: '2px solid',
    outlineColor: 'primary.main',
    outlineOffset: 2,
  },
}

function FooterNavLink({
  item,
  label,
  sx,
}: {
  item: FooterLinkItem
  label: string
  sx: SxProps<Theme>
}) {
  if ('href' in item) {
    return (
      <Link href={item.href} sx={sx}>
        {label}
      </Link>
    )
  }
  return (
    <Typography component={RouterLink} to={item.to} sx={sx}>
      {label}
    </Typography>
  )
}

function SocialLinks() {
  return (
    <Stack direction="row" spacing={0.75} alignItems="center">
      {SOCIAL.map(({ label, href, Icon }) => (
        <Link key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} sx={socialBtnSx}>
          <Icon sx={{ fontSize: 18 }} />
        </Link>
      ))}
    </Stack>
  )
}

function FooterColumn({ title, links }: { title: string; links: readonly FooterLinkItem[] }) {
  const t = useT()
  return (
    <Box>
      <Typography component="h2" sx={columnHeadingSx}>
        {title}
      </Typography>
      <Stack component="ul" spacing={0.5} sx={{ m: 0, p: 0, listStyle: 'none' }}>
        {links.map((item) => (
          <Box component="li" key={item.labelKey} sx={{ m: 0, p: 0 }}>
            <FooterNavLink item={item} label={t(item.labelKey)} sx={linkSx} />
          </Box>
        ))}
      </Stack>
    </Box>
  )
}

/**
 * Mobile: one legal caption above the tab bar. Nav, social, and marketing copy live on desktop only.
 */
function MobileFooterStrip() {
  const year = new Date().getFullYear()
  const t = useT()

  return (
    <Box
      component="section"
      aria-label={t('footer.site')}
      sx={{ display: { xs: 'block', md: 'none' } }}
    >
      <Typography
        component="p"
        variant="caption"
        sx={{
          m: 0,
          textAlign: 'center',
          color: 'text.disabled',
          fontSize: '0.7rem',
          fontWeight: 500,
          lineHeight: 1.45,
          letterSpacing: '0.01em',
        }}
      >
        {t('footer.copyright', { year })}
        {' · '}
        {t('footer.developedBy')}
      </Typography>
    </Box>
  )
}

/**
 * Site footer — compact legal caption on mobile; desktop: brand + Explore / Host / Legal columns.
 */
export default function Footer() {
  const year = new Date().getFullYear()
  const t = useT()

  return (
    <Box
      component="footer"
      id="app-site-footer"
      sx={{
        mt: 'auto',
        flexShrink: 0,
        position: 'relative',
        overflow: { xs: 'visible', md: 'hidden' },
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.default',
        pt: { xs: 1, md: 2.5 },
        pb: { xs: 1.25, md: 2.5 },
        mb: {
          xs: `calc(68px + 8px + env(safe-area-inset-bottom, 0px))`,
          md: 0,
        },
      }}
    >
      <Container maxWidth="lg" sx={{ ...containerGutters, position: 'relative' }}>
        <MobileFooterStrip />

        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'minmax(220px, 1.45fr) repeat(3, minmax(120px, 1fr))',
              columnGap: 3,
              rowGap: 2,
              alignItems: 'start',
            }}
          >
            <Box>
              <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1.5} sx={{ maxWidth: 280 }}>
                <Box component={RouterLink} to="/" sx={logoLinkSx}>
                  <RentaraLogoMark variant="navLockup" size="sm" showTextFallback />
                </Box>
                <SocialLinks />
              </Stack>
              <Typography
                variant="body2"
                sx={{
                  mt: 1,
                  maxWidth: 280,
                  color: 'text.secondary',
                  fontWeight: 500,
                  lineHeight: 1.5,
                  letterSpacing: '-0.01em',
                }}
              >
                {t('footer.blurb')}
              </Typography>
            </Box>

            <Box component="nav" aria-label={t('footer.site')} sx={{ display: 'contents' }}>
              <FooterColumn title={t('footer.colExplore')} links={EXPLORE_LINKS} />
              <FooterColumn title={t('footer.colHost')} links={HOST_LINKS} />
              <FooterColumn title={t('footer.colLegal')} links={LEGAL_LINKS} />
            </Box>
          </Box>

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            flexWrap="wrap"
            gap={1}
            sx={{
              mt: 2,
              pt: 1.25,
              borderTop: '1px solid',
              borderColor: (theme) => alpha(theme.palette.divider, 0.7),
            }}
          >
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.75rem', letterSpacing: '-0.01em' }}
            >
              {t('footer.copyright', { year })}
            </Typography>
            <Stack direction="row" alignItems="center" flexWrap="wrap" columnGap={1} rowGap={0.25}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '-0.01em' }}>
                {t('footer.developedBy')}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem', fontWeight: 500 }}>
                {t('footer.demoPhp')}
              </Typography>
            </Stack>
          </Stack>
        </Box>
      </Container>
    </Box>
  )
}
