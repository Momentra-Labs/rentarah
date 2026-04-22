import { create } from 'zustand'

type Severity = 'success' | 'error' | 'info' | 'warning'

interface SnackbarState {
  open: boolean
  message: string
  severity: Severity
  showSuccess: (message: string) => void
  showError: (message: string) => void
  showInfo: (message: string) => void
  close: () => void
}

let dismissTimer: ReturnType<typeof setTimeout> | null = null

export const useSnackbarStore = create<SnackbarState>((set) => ({
  open: false,
  message: '',
  severity: 'info',
  showSuccess: (message) => {
    if (dismissTimer) clearTimeout(dismissTimer)
    dismissTimer = setTimeout(() => set({ open: false }), 4000)
    set({ open: true, message, severity: 'success' })
  },
  showError: (message) => {
    if (dismissTimer) clearTimeout(dismissTimer)
    dismissTimer = setTimeout(() => set({ open: false }), 4000)
    set({ open: true, message, severity: 'error' })
  },
  showInfo: (message) => {
    if (dismissTimer) clearTimeout(dismissTimer)
    dismissTimer = setTimeout(() => set({ open: false }), 4000)
    set({ open: true, message, severity: 'info' })
  },
  close: () => set({ open: false }),
}))
