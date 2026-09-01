import { ThemeProvider } from '@mui/material/styles'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { theme } from '@/theme'

import ListingPhotoGallery from './ListingPhotoGallery'

const IMAGES = ['https://example.com/a.jpg', 'https://example.com/b.jpg', 'https://example.com/c.jpg']

function renderGallery(props: Partial<ComponentProps<typeof ListingPhotoGallery>> = {}) {
  return render(
    <ThemeProvider theme={theme}>
      <ListingPhotoGallery
        images={IMAGES}
        alt="2023 Toyota Fortuner"
        contain={false}
        saved={false}
        onToggleSaved={() => {}}
        variant="desktop"
        {...props}
      />
    </ThemeProvider>,
  )
}

describe('ListingPhotoGallery', () => {
  it('shows a 3-up mosaic on desktop and opens the lightbox from a tile', async () => {
    const user = userEvent.setup()
    renderGallery()
    expect(screen.getByRole('img', { name: '2023 Toyota Fortuner' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Show all 3 photos' })).toBeInTheDocument()
    await user.click(screen.getByRole('img', { name: '2023 Toyota Fortuner' }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByLabelText('Close photos')).toBeInTheDocument()
    expect(screen.getByLabelText('Next photo')).toBeInTheDocument()
    expect(screen.getByText('1 / 3')).toBeInTheDocument()
  })

  it('shows a 5-up mosaic, overflow count, and every thumbnail when the host uploaded many photos', async () => {
    const user = userEvent.setup()
    const images = Array.from({ length: 7 }, (_, i) => `https://example.com/${i}.jpg`)
    renderGallery({ images })
    expect(screen.getByRole('button', { name: 'Show all 7 photos' })).toBeInTheDocument()
    expect(screen.getByText('+2')).toBeInTheDocument()
    const strip = screen.getByRole('list', { name: 'Photo gallery' })
    expect(within(strip).getAllByRole('listitem')).toHaveLength(7)
    expect(within(strip).getAllByRole('button')).toHaveLength(7)
    await user.click(screen.getByRole('button', { name: 'Show all 7 photos' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('1 / 7')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Photo 4 of 7' }))
    expect(within(dialog).getByText('4 / 7')).toBeInTheDocument()
  })

  it('toggles save without opening the lightbox', async () => {
    const user = userEvent.setup()
    const onToggleSaved = vi.fn()
    renderGallery({ onToggleSaved, variant: 'mobile' })
    await user.click(screen.getByRole('button', { name: 'Save listing' }))
    expect(onToggleSaved).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens a share sheet with a copyable listing link', async () => {
    const user = userEvent.setup()
    renderGallery({
      variant: 'mobile',
      share: {
        carId: 'car_001',
        title: '2023 Toyota Fortuner',
        location: 'Makati',
        priceLabel: '₱3,500',
      },
    })
    await user.click(screen.getByRole('button', { name: 'Share this listing' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('heading', { name: 'Share this listing' })).toBeInTheDocument()
    expect(within(dialog).getByDisplayValue(/\/cars\/car_001$/)).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'WhatsApp' })).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Facebook' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: /photos/i })).not.toBeInTheDocument()
  })

  it('renders dots instead of a thumbnail strip on mobile', () => {
    renderGallery({ variant: 'mobile' })
    expect(screen.getByRole('tablist', { name: 'Photo gallery' })).toBeInTheDocument()
    expect(screen.getAllByRole('tab')).toHaveLength(3)
  })
})
