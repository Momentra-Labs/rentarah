import FacebookOutlined from '@mui/icons-material/FacebookOutlined'
import Instagram from '@mui/icons-material/Instagram'
import {
  Box,
  Container,
  Divider,
  Link,
  Stack,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Fragment } from 'react'
import { Link as RouterLink } from 'react-router-dom'

import RentaraLogoMark from '../brand/RentaraLogoMark'

const FOOTER_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Browse rentals', to: '/search' },
  { label: 'List your vehicle', to: '/host' },
  { label: 'Contact / support', href: 'mailto:hello@rentara.com', external: true },
] as const

const SOCIAL = [
  { label: 'Facebook', href: 'https://facebook.com', Icon: FacebookOutlined },
  { label: 'Instagram', href: 'https://instagram.com', Icon: Instagram },
] as const

const linkSx = {
  typography: 'body2',
  fontWeight: 600,
  fontSize: '0.875rem',
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

/**
 * Site footer — brand column + grouped nav/social, aligned and visually balanced on all breakpoints.
 */
export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto',
        position: 'relative',
        overflow: 'hidden',
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: (t) => alpha(t.palette.grey[50], 0.97),
        backgroundImage: (t) =>
          `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.04)} 0%, transparent 42%, ${alpha(t.palette.grey[100], 0.35)} 100%)`,
        py: { xs: 4, md: 5 },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: (t) => `linear-gradient(90deg, ${alpha(t.palette.primary.main, 0.2)}, ${alpha(t.palette.primary.main, 0.06)}, transparent)`,
          pointerEvents: 'none',
        },
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, position: 'relative' }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={{ xs: 3, md: 2 }}
          alignItems={{ xs: 'stretch', md: 'center' }}
          justifyContent="space-between"
        >
          {/* Brand — left, vertically compact */}
          <Stack spacing={1.5} sx={{ maxWidth: { xs: '100%', md: 340 }, flexShrink: 0 }}>
            <Box
              component={RouterLink}
              to="/"
              sx={{
                display: 'inline-block',
                maxWidth: { xs: 200, sm: 228 },
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
              Rent vehicles easily — anytime, anywhere in Metro Manila and beyond.
            </Typography>
          </Stack>

          {/* Nav + social — one group, same vertical axis, fills right side on desktop */}
          <Box
            sx={{
              flex: { md: '1 1 auto' },
              display: 'flex',
              justifyContent: { xs: 'stretch', md: 'flex-end' },
              alignItems: { xs: 'stretch', md: 'center' },
              minWidth: 0,
            }}
          >
            <Stack
              spacing={1.75}
              alignItems={{ xs: 'flex-start', md: 'flex-end' }}
              sx={{
                width: { xs: '100%', md: 'auto' },
                maxWidth: { md: 520 },
                px: { xs: 2, md: 2.5 },
                py: { xs: 2, md: 2 },
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
                justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
                alignItems="center"
              >
                {FOOTER_LINKS.map((item, i) => (
                  <Fragment key={'to' in item ? item.to : item.href}>
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
                          display: { xs: 'none', sm: 'inline' },
                        }}
                      >
                        ●
                      </Box>
                    ) : null}
                    <FooterNavLink item={item} />
                  </Fragment>
                ))}
              </Stack>

              <Stack
                direction="row"
                spacing={0.25}
                justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
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
            my: { xs: 3, md: 3.5 },
            borderColor: (t) => alpha(t.palette.divider, 0.9),
          }}
        />

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 1.25, sm: 4 }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
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
      </Container>
    </Box>
  )
}
