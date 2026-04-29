import FacebookOutlined from '@mui/icons-material/FacebookOutlined'
import Instagram from '@mui/icons-material/Instagram'
import { Box, Container, Link, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Link as RouterLink } from 'react-router-dom'

import RentaraLogoMark from '../brand/RentaraLogoMark'
import { MOBILE_FOOTER_ADDITIONAL_CLEAR_PX, MOBILE_TAB_BAR_INSET_PX } from './MobileBottomNav'

const FOOTER_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Browse rentals', to: '/search' },
  { label: 'Become a host', to: '/become-a-host' },
  { label: 'Contact / support', href: 'mailto:hello@rentara.com', external: true },
] as const

/** Shown on small screens only — avoids duplicating the fixed bottom tab bar. */
const FOOTER_COMPACT_LINKS = [
  { label: 'Become a host', to: '/become-a-host' as const },
  { label: 'Support', href: 'mailto:hello@rentara.com', external: true },
] as const

const SOCIAL = [
  { label: 'Facebook', href: 'https://facebook.com', Icon: FacebookOutlined },
  { label: 'Instagram', href: 'https://instagram.com', Icon: Instagram },
] as const

const linkSx = {
  typography: 'body2',
  fontWeight: 500,
  fontSize: '0.8125rem',
  color: 'text.secondary',
  textDecoration: 'none',
  letterSpacing: '-0.01em',
  transition: 'color 0.2s ease',
  whiteSpace: 'nowrap',
  '&:hover': {
    color: 'primary.main',
    textDecoration: 'underline',
    textUnderlineOffset: 3,
  },
} as const

const mobileSubtleLinkSx = {
  typography: 'body2' as const,
  fontSize: '0.8125rem',
  fontWeight: 500,
  color: 'text.secondary',
  textDecoration: 'none',
  letterSpacing: '-0.01em',
  '&:hover': { color: 'primary.main' },
  '&:active': { color: 'primary.dark' },
}

function FooterNavLink({ item }: { item: (typeof FOOTER_LINKS)[number] }) {
  if ('href' in item && item.external) {
    return (
      <Link href={item.href} sx={linkSx}>
        {item.label}
      </Link>
    )
  }
  return (
    <Typography component={RouterLink} to={'to' in item ? item.to : '/'} sx={linkSx}>
      {item.label}
    </Typography>
  )
}

function CompactNavLink({ item }: { item: (typeof FOOTER_COMPACT_LINKS)[number] }) {
  if ('to' in item) {
    return (
      <Typography component={RouterLink} to={item.to} sx={mobileSubtleLinkSx}>
        {item.label}
      </Typography>
    )
  }
  return (
    <Link href={item.href} sx={mobileSubtleLinkSx}>
      {item.label}
    </Link>
  )
}

/**
 * Mobile: single short strip. Bottom tab bar already covers Home · Browse · Map · Account;
 * we only show brand, support links, and legal — no duplicate nav chrome.
 */
function MobileFooterStrip() {
  const year = new Date().getFullYear()

  return (
    <Box
      component="section"
      aria-label="Site footer"
      sx={{
        display: { xs: 'block', md: 'none' },
        /* Extra room above the outer footer `pb` so the legal line clears the tab bar. */
        pb: { xs: 2, md: 0 },
      }}
    >
      <Stack spacing={1.5}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          gap={1}
          sx={{ minHeight: 40 }}
        >
          <Box
            component={RouterLink}
            to="/"
            sx={{
              display: 'inline-block',
              maxWidth: 152,
              lineHeight: 0,
              textDecoration: 'none',
              color: 'inherit',
              flexShrink: 0,
            }}
          >
            <RentaraLogoMark variant="navLockup" size="sm" showTextFallback />
          </Box>
          <Stack direction="row" alignItems="center" spacing={0.25} sx={{ flexShrink: 0 }}>
            {SOCIAL.map(({ label, href, Icon }) => (
              <Link
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                sx={{
                  display: 'inline-flex',
                  p: 0.65,
                  borderRadius: 999,
                  color: 'text.secondary',
                  transition: 'color 0.2s, background-color 0.2s',
                  '&:hover': {
                    color: 'primary.main',
                    bgcolor: (t) => alpha(t.palette.primary.main, 0.06),
                  },
                }}
              >
                <Icon sx={{ fontSize: 20 }} />
              </Link>
            ))}
          </Stack>
        </Stack>

        <Typography
          variant="body2"
          sx={{
            fontSize: '0.75rem',
            lineHeight: 1.45,
            color: 'text.secondary',
            fontWeight: 500,
            maxWidth: 360,
          }}
        >
          Philippines rentals — book cars &amp; two-wheelers.
        </Typography>

        <Box
          component="nav"
          aria-label="More links"
          sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: 0.75, rowGap: 0.5 }}
        >
          {FOOTER_COMPACT_LINKS.map((item, i) => (
              <Box key={item.label} component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                {i > 0 ? (
                  <Box
                    component="span"
                    aria-hidden
                    sx={{ color: 'text.disabled', fontSize: '0.6rem', px: 0.25, userSelect: 'none' }}
                  >
                    ·
                  </Box>
                ) : null}
                <CompactNavLink item={item} />
              </Box>
            ))}
        </Box>

        <Typography
          component="p"
          variant="caption"
          sx={{
            m: 0,
            pt: 0.25,
            color: 'text.disabled',
            fontSize: '0.65rem',
            fontWeight: 500,
            lineHeight: 1.4,
            letterSpacing: '0.01em',
            /* Keeps the last line out of the fixed nav’s hit area if padding collapses. */
            scrollMarginBottom: { xs: 4, md: 0 },
          }}
        >
          © {year} Rentara · demo
        </Typography>
      </Stack>
    </Box>
  )
}

/**
 * Site footer — compact strip on mobile; desktop: single row (logo + links + social) and a thin legal line.
 */
export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <Box
      component="footer"
      id="app-site-footer"
      sx={{
        mt: 'auto',
        flexShrink: 0,
        position: 'relative',
        /* xs: do not clip — fixed tab bar paints above; hidden could interact badly in flex. */
        overflow: { xs: 'visible', md: 'hidden' },
        scrollMarginBottom: {
          xs: `max(8px, calc(12px + ${MOBILE_TAB_BAR_INSET_PX + MOBILE_FOOTER_ADDITIONAL_CLEAR_PX}px + env(safe-area-inset-bottom, 0px)))`,
          md: 0,
        },
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.default',
        pt: { xs: 2, md: 2.5 },
        pb: {
          xs: (t) =>
            `calc(${t.spacing(2)} + ${MOBILE_TAB_BAR_INSET_PX + MOBILE_FOOTER_ADDITIONAL_CLEAR_PX}px + env(safe-area-inset-bottom, 0px))`,
          md: 2.5,
        },
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, position: 'relative' }}>
        <MobileFooterStrip />

        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <Stack spacing={2}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              flexWrap="wrap"
              rowGap={1.5}
              columnGap={2}
            >
              <Box
                component={RouterLink}
                to="/"
                sx={{
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
                }}
              >
                <RentaraLogoMark variant="navLockup" size="sm" showTextFallback />
              </Box>

              <Stack
                direction="row"
                alignItems="center"
                flexWrap="wrap"
                justifyContent="flex-end"
                columnGap={0}
                rowGap={0.5}
                component="nav"
                aria-label="Footer"
                sx={{ flex: '1 1 auto', minWidth: 0 }}
              >
                {FOOTER_LINKS.map((item, i) => (
                  <Box key={'to' in item ? item.to : item.href} sx={{ display: 'inline-flex', alignItems: 'center' }}>
                    {i > 0 ? (
                      <Box
                        component="span"
                        aria-hidden
                        sx={{ color: 'text.disabled', fontSize: '0.65rem', px: 1, userSelect: 'none' }}
                      >
                        ·
                      </Box>
                    ) : null}
                    <FooterNavLink item={item} />
                  </Box>
                ))}
                <Box
                  component="span"
                  aria-hidden
                  sx={{ color: 'text.disabled', fontSize: '0.65rem', px: 1, userSelect: 'none' }}
                >
                  ·
                </Box>
                <Stack direction="row" spacing={0.25} alignItems="center" component="span">
                  {SOCIAL.map(({ label, href, Icon }) => (
                    <Link
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      sx={{
                        display: 'inline-flex',
                        p: 0.5,
                        borderRadius: 1,
                        color: 'text.secondary',
                        transition: 'color 0.2s ease',
                        '&:hover': { color: 'primary.main' },
                        '&:focus-visible': {
                          outline: '2px solid',
                          outlineColor: 'primary.main',
                          outlineOffset: 2,
                        },
                      }}
                    >
                      <Icon sx={{ fontSize: 20 }} />
                    </Link>
                  ))}
                </Stack>
              </Stack>
            </Stack>

            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              flexWrap="wrap"
              gap={1}
              sx={{
                pt: 1.5,
                borderTop: '1px solid',
                borderColor: (t) => alpha(t.palette.divider, 0.65),
              }}
            >
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.75rem' }}>
                © {year} Rentara
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem', fontWeight: 500 }}>
                Demo · PHP · mock data
              </Typography>
            </Stack>
          </Stack>
        </Box>
      </Container>
    </Box>
  )
}
