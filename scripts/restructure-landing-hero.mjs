import fs from 'node:fs'

const path = 'src/features/landing/pages/LandingPage.tsx'
let s = fs.readFileSync(path, 'utf8')
const nl = s.includes('\r\n') ? '\r\n' : '\n'

const startMarker = `                <Stack${nl}                  data-onboarding="hero"`
const endMarker = `            <Grid item xs={12} md={6} lg={5} sx={{ order: { xs: 1, md: 2 } }}>`

const start = s.indexOf(startMarker)
const end = s.indexOf(endMarker)
if (start < 0 || end < 0) {
  console.error('markers not found', start, end)
  process.exit(1)
}

const heroLeft = `                <Stack
                  data-onboarding="hero"
                  spacing={{ xs: 2, md: 2.5 }}
                  justifyContent="center"
                  sx={{
                    maxWidth: { xs: '100%', sm: 620, md: 560 },
                    width: '100%',
                    minHeight: { md: '100%' },
                    pr: { md: 1 },
                    py: { md: 2 },
                  }}
                >
                  <Typography
                    component="p"
                    sx={{
                      fontFamily: '"Urbanist", "Inter", sans-serif',
                      fontWeight: 800,
                      fontSize: { xs: '1.75rem', sm: '2rem', md: '2.35rem' },
                      letterSpacing: '-0.04em',
                      lineHeight: 1.05,
                      color: 'primary.main',
                    }}
                  >
                    RentaraH
                  </Typography>
                  <Typography
                    component="h1"
                    variant="h1"
                    sx={{
                      letterSpacing: '-0.03em',
                      lineHeight: { xs: 1.15, md: 1.1 },
                      fontSize: { xs: '1.65rem', sm: '2rem', md: 'clamp(2rem, 3vw, 2.5rem)' },
                      fontWeight: 800,
                      color: 'text.primary',
                      textWrap: 'balance',
                    }}
                  >
                    Rent cars & motorcycles across the Philippines
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{
                      fontSize: { xs: '0.975rem', sm: '1.0625rem' },
                      lineHeight: 1.6,
                      maxWidth: '34em',
                      fontWeight: 500,
                    }}
                  >
                    Clear PHP daily rates, verified hosts, and pickup times that match real availability.
                  </Typography>
                  <Button
                    component={RouterLink}
                    to="/map"
                    variant="text"
                    color="primary"
                    size="medium"
                    startIcon={<MapOutlined />}
                    sx={{ alignSelf: 'flex-start', fontWeight: 700, px: 0.5 }}
                  >
                    Explore the map
                  </Button>
                </Stack>
              </Box>
            </Grid>

`

s = s.slice(0, start) + heroLeft + s.slice(end)

const insertAt = s.indexOf(`      <Box${nl}        id="categories"`)
if (insertAt < 0) {
  console.error('categories not found')
  process.exit(1)
}

const belowFold = `
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, py: landingSectionPy }}>
        <Grid container spacing={{ xs: 3, md: 4 }}>
          <Grid item xs={12} md={6}>
            <Stack spacing={2} id="how" component="section" aria-labelledby="landing-how-heading">
              <Box>
                <Typography variant="caption" color="primary" sx={{ fontWeight: 700, letterSpacing: '0.08em' }}>
                  Simple flow
                </Typography>
                <Typography id="landing-how-heading" variant="h5" component="h2" fontWeight={800} sx={{ mt: 0.5 }}>
                  How it works
                </Typography>
              </Box>
              <Stack spacing={1.5}>
                {HERO_FLOW_COMPACT.map(({ Icon, title, line }) => (
                  <Stack key={title} direction="row" spacing={1.5} alignItems="flex-start">
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
                        color: 'primary.main',
                        flexShrink: 0,
                      }}
                    >
                      <Icon sx={{ fontSize: 22 }} aria-hidden />
                    </Box>
                    <Box>
                      <Typography variant="body2" fontWeight={700}>{title}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                        {line}
                      </Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>
            </Stack>
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack spacing={2} component="section" aria-labelledby="landing-trust-heading">
              <Box>
                <Typography variant="caption" color="primary" sx={{ fontWeight: 700, letterSpacing: '0.08em' }}>
                  Why renters choose us
                </Typography>
                <Typography id="landing-trust-heading" variant="h5" component="h2" fontWeight={800} sx={{ mt: 0.5 }}>
                  Trust built into every trip
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 1.5,
                }}
              >
                {HERO_WHY_COMPACT.map(({ Icon, title, line }) => (
                  <Stack key={title} direction="row" spacing={1} alignItems="flex-start">
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        bgcolor: (t) => alpha(t.palette.primary.main, 0.11),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'primary.main',
                        flexShrink: 0,
                      }}
                    >
                      <Icon sx={{ fontSize: 17 }} aria-hidden />
                    </Box>
                    <Box>
                      <Typography variant="body2" fontWeight={700}>{title}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                        {line}
                      </Typography>
                    </Box>
                  </Stack>
                ))}
              </Box>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                sx={{
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  overflow: 'hidden',
                }}
              >
                {HERO_TRUST_SPECS.map((spec, i) => (
                  <Box
                    key={spec.key}
                    sx={{
                      flex: 1,
                      px: 2,
                      py: 1.75,
                      borderLeft: { sm: i > 0 ? '1px solid' : 'none' },
                      borderTop: { xs: i > 0 ? '1px solid' : 'none', sm: 'none' },
                      borderColor: 'divider',
                    }}
                  >
                    <HeroTrustStatCell spec={spec} index={i} />
                  </Box>
                ))}
              </Stack>
            </Stack>
          </Grid>
        </Grid>
      </Container>

`

s = s.slice(0, insertAt) + belowFold + s.slice(insertAt)

s = s.replace(
  '<Suspense fallback={<Box sx={{ minHeight: 320 }} aria-hidden />}>',
  `<Suspense
        fallback={
          <Box sx={{ minHeight: 320, px: 2, py: 4 }} role="status" aria-live="polite">
            <Typography color="text.secondary">Loading listings…</Typography>
          </Box>
        }
      >`,
)

fs.writeFileSync(path, s)
console.log('LandingPage hero restructured OK')
