import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { I18nextProvider } from "react-i18next"
import i18n from "./i18n"
import Layout from "./components/layout/Layout"
import Dashboard from "./pages/Dashboard"
import Inventory from "./pages/Inventory"
import POS from "./pages/POS"
import Tickets from "./pages/Tickets"
import Customers from "./pages/Customers"
import Analytics from "./pages/Analytics"
import BarcodeScannerDemo from "./pages/BarcodeScannerDemo"
import LandingPage from "./pages/LandingPage"
import Reports from "./pages/Reports"
import Settings from "./pages/Settings"
import { ThemeProvider } from './components/ThemeProvider'

function App() {
  return (
    <ThemeProvider>
      <I18nextProvider i18n={i18n}>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/pos" element={<POS />} />
              <Route path="/tickets" element={<Tickets />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/barcode" element={<BarcodeScannerDemo />} />
              <Route path="/sales" element={<Navigate to="/pos" replace />} />
            </Route>
          </Routes>
        </Router>
      </I18nextProvider>
    </ThemeProvider>
  )
}

export default App