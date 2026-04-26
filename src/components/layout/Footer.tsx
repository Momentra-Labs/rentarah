import FacebookOutlined from '@mui/icons-material/FacebookOutlined'
import Instagram from '@mui/icons-material/Instagram'
import { Box, Container, Divider, Link, Stack, Typography } from '@mui/material'
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
  fontWeight: 600,
  fontSize: { xs: '0.8125rem', sm: '0.875rem' },
  color: 'text.primary',
  textDecoration: 'none',
  letterSpacing: '-0.01em',
  transition: 'color 0.2s ease, text-underline-offset 0.2s ease',
  textUnderlineOffset: 4,
  opacity: 0.88,
  whiteSpace: 'nowrap',
  '&:hover': {
    color: 'primary.main',
    opacity: 1,
    textDecoration: 'underline',
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
            maxWidth: 400,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as const,
            overflow: 'hidden',
          }}
        >
          Rent vehicles easily in the Philippines.
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
          © {year} Rentara · Demo · PHP
        </Typography>
      </Stack>
    </Box>
  )
}

/**
 * Site footer — compact app-like strip on small screens; full brand + link card on md+.
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
        bgcolor: (t) => alpha(t.palette.grey[50], 0.98),
        pt: { xs: 2, md: 5 },
        pb: {
          xs: (t) =>
            `calc(${t.spacing(2)} + ${MOBILE_TAB_BAR_INSET_PX + MOBILE_FOOTER_ADDITIONAL_CLEAR_PX}px + env(safe-area-inset-bottom, 0px))`,
          md: 5,
        },
        backgroundImage: {
          xs: 'none',
          md: (t) =>
            `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.04)} 0%, transparent 42%, ${alpha(t.palette.grey[100], 0.35)} 100%)`,
        },
        '&::before': {
          content: '""',
          display: { xs: 'none', md: 'block' },
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: (t) =>
            `linear-gradient(90deg, ${alpha(t.palette.primary.main, 0.2)}, ${alpha(t.palette.primary.main, 0.06)}, transparent)`,
          pointerEvents: 'none',
        },
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, position: 'relative' }}>
        <MobileFooterStrip />

        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            justifyContent="space-between"
          >
            <Stack spacing={1.5} sx={{ maxWidth: 340, flexShrink: 0 }}>
              <Box
                component={RouterLink}
                to="/"
                sx={{
                  display: 'inline-block',
                  maxWidth: 228,
                  overflow: 'hidden',
                  lineHeight: 0,
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'transform 0.22s ease, opacity 0.2s ease',
                  '&:hover': { opacity: 0.92, transform: 'translateY(-1px)' },
                  '&:focus-visible': {
                    outline: '2px solid',
                    outlineColor: 'primary.main',
                    outlineOffset: 4,
                    borderRadius: 1,
                  },
                }}
              >
                <RentaraLogoMark variant="navLockup" size="sm" showTextFallback />
              </Box>
              <Typography
                variant="body2"
                sx={{
                  lineHeight: 1.65,
                  fontSize: '0.9375rem',
                  fontWeight: 500,
                  color: 'text.secondary',
                  maxWidth: 360,
                }}
              >
                Rent vehicles easily — anytime, anywhere in the Philippines.
              </Typography>
            </Stack>

            <Box
              sx={{
                flex: '1 1 auto',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                minWidth: 0,
              }}
            >
              <Stack
                spacing={1.75}
                alignItems="flex-end"
                sx={{
                  maxWidth: 520,
                  px: 2.5,
                  py: 2,
                  borderRadius: 2.5,
                  border: '1px solid',
                  borderColor: (t) => alpha(t.palette.primary.main, 0.1),
                  bgcolor: (t) => alpha(t.palette.common.white, 0.65),
                  boxShadow: (t) => `0 1px 0 ${alpha(t.palette.common.black, 0.04)}`,
                  backdropFilter: 'blur(8px)',
                }}
              >
                <Stack
                  component="nav"
                  aria-label="Footer"
                  direction="row"
                  flexWrap="wrap"
                  useFlexGap
                  spacing={1}
                  columnGap={1.25}
                  rowGap={1}
                  justifyContent="flex-end"
                  alignItems="center"
                >
                  {FOOTER_LINKS.map((item, i) => (
                    <Box key={'to' in item ? item.to : item.href} component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                      {i > 0 ? (
                        <Box
                          component="span"
                          aria-hidden
                          sx={{
                            color: 'text.disabled',
                            fontSize: '0.65rem',
                            lineHeight: 1,
                            userSelect: 'none',
                            opacity: 0.65,
                            mx: 0.5,
                          }}
                        >
                          ●
                        </Box>
                      ) : null}
                      <FooterNavLink item={item} />
                    </Box>
                  ))}
                </Stack>

                <Stack
                  direction="row"
                  spacing={0.25}
                  justifyContent="flex-end"
                  alignItems="center"
                  sx={{
                    width: '100%',
                    pt: 0.25,
                    borderTop: '1px solid',
                    borderColor: (t) => alpha(t.palette.divider, 0.85),
                  }}
                >
                  {SOCIAL.map(({ label, href, Icon }) => (
                    <Link
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      sx={{
                        display: 'inline-flex',
                        p: 0.85,
                        borderRadius: 1.5,
                        color: 'text.primary',
                        opacity: 0.75,
                        transition: 'color 0.2s ease, background-color 0.2s ease, opacity 0.2s ease, transform 0.2s ease',
                        '&:hover': {
                          color: 'primary.main',
                          opacity: 1,
                          bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
                          transform: 'translateY(-2px)',
                        },
                        '&:focus-visible': {
                          outline: '2px solid',
                          outlineColor: 'primary.main',
                          outlineOffset: 2,
                        },
                      }}
                    >
                      <Icon sx={{ fontSize: 22 }} />
                    </Link>
                  ))}
                </Stack>
              </Stack>
            </Box>
          </Stack>

          <Divider
            sx={{
              my: 3.5,
              borderColor: (t) => alpha(t.palette.divider, 0.9),
            }}
          />

          <Stack
            direction="row"
            spacing={4}
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography
              variant="body2"
              sx={{
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'text.primary',
                opacity: 0.85,
              }}
            >
              © {year} Rentara. All rights reserved.
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontWeight: 500,
                fontSize: '0.75rem',
                letterSpacing: '0.02em',
              }}
            >
              Demo marketplace · PHP · Simulated bookings &amp; listings
            </Typography>
          </Stack>
        </Box>
      </Container>
    </Box>
  )
}
