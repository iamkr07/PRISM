import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

export function Topbar() {
  const location = useLocation()

  const getBreadcrumb = () => {
    const path = location.pathname
    if (path === '/') return 'Home'
    if (path === '/dashboard') return 'Dashboard'
    if (path === '/candidates') return 'Candidates'
    if (path === '/compare') return 'Compare'
    if (path === '/insights') return 'Insights'
    if (path === '/pipeline') return 'Pipeline'
    if (path === '/analyze') return 'Analyze'
    return 'PRISM'
  }

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1 }}
      className="sticky top-0 z-40 glass border-b border-border p-4"
    >
      <div className="flex items-center justify-between gap-4 max-w-full">
        <h1 className="text-lg font-space-grotesk font-bold text-muted">
          {getBreadcrumb()}
        </h1>
      </div>
    </motion.div>
  )
}

export default Topbar
