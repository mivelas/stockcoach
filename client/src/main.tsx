import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import Guide from './pages/Guide.tsx'
import Report from './pages/Report.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/guide" element={<Guide />} />
        <Route path="/report" element={<Report />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
