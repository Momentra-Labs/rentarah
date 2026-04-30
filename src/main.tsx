import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { BrowserRouter } from 'react-router-dom'

import App from './App'
import faviconUrl from './assets/rentarah_lockup.svg'
import { FirebaseAuthSync } from './components/auth/FirebaseAuthSync'
import { theme } from './theme'

import './index.css'

function applyFavicon(url: string): void {
  let link = document.querySelector<HTMLLinkElement>("link[rel='icon'][type='image/svg+xml']")
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    link.type = 'image/svg+xml'
    document.head.appendChild(link)
  }
  link.href = url
}
applyFavicon(faviconUrl)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <BrowserRouter
          basename={
            import.meta.env.BASE_URL === '/' ? undefined : import.meta.env.BASE_URL.replace(/\/$/, '')
          }
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <FirebaseAuthSync />
          <App />
        </BrowserRouter>
      </LocalizationProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
