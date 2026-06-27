import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import LandingPage from './pages/LandingPage'
import AnalyzePage from './pages/AnalyzePage'
import DashboardPage from './pages/DashboardPage'
import CandidatesPage from './pages/CandidatesPage'
import ComparePage from './pages/ComparePage'
import InsightsPage from './pages/InsightsPage'
import PipelinePage from './pages/PipelinePage'
import SettingsPage from './pages/SettingsPage'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/analyze" element={<AnalyzePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/candidates" element={<CandidatesPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="/pipeline" element={<PipelinePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  )
}
