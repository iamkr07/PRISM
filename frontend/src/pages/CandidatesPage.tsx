import { useState } from 'react'
import { motion } from 'framer-motion'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import CandidateTable from '../components/CandidateTable'
import CandidateDrawer from '../components/CandidateDrawer'

export function CandidatesPage() {
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:ml-80">
        <Topbar />
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="p-4 sm:p-6 lg:p-8 max-w-7xl"
        >
          <div className="mb-8">
            <h1 className="text-3xl font-space-grotesk font-bold mb-2">Candidate Explorer</h1>
            <p className="text-muted">Browse and analyze individual candidate profiles</p>
          </div>

          <CandidateTable onSelectCandidate={setSelectedCandidate} />
        </motion.main>
      </div>

      <CandidateDrawer
        isOpen={selectedCandidate !== null}
        onClose={() => setSelectedCandidate(null)}
        candidateId={selectedCandidate || ''}
      />
    </div>
  )
}

export default CandidatesPage
