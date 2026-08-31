import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined'
import FavoriteBorder from '@mui/icons-material/FavoriteBorder'
import HistoryOutlined from '@mui/icons-material/HistoryOutlined'
import PersonOutline from '@mui/icons-material/PersonOutline'
import RateReviewOutlined from '@mui/icons-material/RateReviewOutlined'
import { ThemeProvider } from '@mui/material/styles'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import { theme } from '@/theme'

import DashboardSectionTabs, { type DashboardSectionTabItem } from './DashboardSectionTabs'

const ITEMS: DashboardSectionTabItem[] = [
  { key: 'trips', label: 'Trips', icon: <CalendarMonthOutlined fontSize="small" /> },
  { key: 'past', label: 'Past', icon: <HistoryOutlined fontSize="small" /> },
  { key: 'saved', label: 'Saved', icon: <FavoriteBorder fontSize="small" /> },
  { key: 'reviews', label: 'Reviews', icon: <RateReviewOutlined fontSize="small" /> },
  { key: 'profile', label: 'Profile', icon: <PersonOutline fontSize="small" /> },
]

function Harness({ initial = 'trips' }: { initial?: string }) {
  const [value, setValue] = useState(initial)
  return (
    <ThemeProvider theme={theme}>
      <DashboardSectionTabs
        items={ITEMS}
        value={value}
        onChange={setValue}
        primaryKeys={['trips', 'saved']}
        ariaLabel="Account sections"
      />
      <p>Panel {value}</p>
    </ThemeProvider>
  )
}

describe('DashboardSectionTabs', () => {
  it('shows primary tabs plus More on compact viewports', () => {
    render(<Harness />)
    expect(screen.getByRole('tab', { name: 'Trips' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Saved' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'More' })).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Past' })).not.toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Reviews' })).not.toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Profile' })).not.toBeInTheDocument()
  })

  it('opens overflow sections from the More menu and keeps More selected', async () => {
    const user = userEvent.setup()
    render(<Harness initial="profile" />)

    expect(screen.getByText('Panel profile')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'More' })).toHaveAttribute('aria-selected', 'true')

    await user.click(screen.getByRole('tab', { name: 'More' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Past' }))

    expect(screen.getByText('Panel past')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'More' })).toHaveAttribute('aria-selected', 'true')
  })

  it('does not mark overflow items selected when More opens from a primary tab', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('tab', { name: 'More' }))
    expect(await screen.findByRole('menuitem', { name: 'Past' })).not.toHaveClass('Mui-selected')
    expect(screen.getByRole('menuitem', { name: 'Reviews' })).not.toHaveClass('Mui-selected')
    expect(screen.getByRole('menuitem', { name: 'Profile' })).not.toHaveClass('Mui-selected')
  })
})
