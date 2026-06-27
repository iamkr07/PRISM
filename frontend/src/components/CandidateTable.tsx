import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'
import GlassCard from './GlassCard'
import { useCandidates } from '../api/hooks/useCandidates'
import { CandidateListItem } from '../api/types'

interface CandidateTableProps {
  onSelectCandidate?: (candidateId: string) => void
}

type SortKey = 'rank' | 'id' | 'name' | 'role' | 'persona' | 'recruitability' | 'risk' | 'overallScore'

const sortKeyToApiSort: Partial<Record<SortKey, string>> = {
  rank: 'rank',
  name: 'name',
  overallScore: 'score',
}

const getRecruitability = (score: number) => Math.max(0, Math.min(100, Math.round(score)))
const getRisk = (score: number) => Math.max(0, Math.min(100, Math.round(100 - score)))

const mapToRows = (items: CandidateListItem[]) =>
  items.map((item, index) => {
    const score = item.score ?? 0
    return {
      id: item.candidate_id,
      rank: index + 1,
      name: item.name,
      role: item.current_title || item.role || 'Unknown',
      persona: item.persona || 'Unknown',
      recruitability: getRecruitability(score),
      risk: getRisk(score),
      overallScore: Math.round(score),
    }
  })

export function CandidateTable({ onSelectCandidate }: CandidateTableProps) {
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>(
    {
      key: 'rank',
      direction: 'asc',
    },
  )
  const [selectedRow, setSelectedRow] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const { data, isLoading, error } = useCandidates({
    page: 1,
    limit: 50,
    search: searchTerm,
    sort: sortKeyToApiSort[sortConfig.key] ?? 'score',
  })

  const sortedCandidates = useMemo(() => {
    const rows = mapToRows(data?.items ?? [])

    return [...rows].sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      const comparison = Number(aValue) - Number(bValue)
      return sortConfig.direction === 'asc' ? comparison : -comparison
    })
  }, [data?.items, sortConfig])

  const handleSort = (key: SortKey) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc',
    })
  }

  const getSortIcon = (key: SortKey) => {
    if (sortConfig.key !== key) return null
    return sortConfig.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
  }

  return (
    <GlassCard className="w-full">
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h3 className="text-lg font-space-grotesk font-semibold">Candidate Profiles</h3>
          <input
            type="text"
            placeholder="Search candidates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-72 px-4 py-2 rounded-lg glass-elevated outline-none placeholder-muted/50 focus:ring-2 ring-primary/30"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th
                className="px-4 py-3 text-left font-mono text-xs font-semibold text-muted cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort('rank')}
              >
                <div className="flex items-center gap-2">Rank {getSortIcon('rank')}</div>
              </th>
              <th
                className="px-4 py-3 text-left font-mono text-xs font-semibold text-muted cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort('id')}
              >
                <div className="flex items-center gap-2">ID {getSortIcon('id')}</div>
              </th>
              <th
                className="px-4 py-3 text-left font-mono text-xs font-semibold text-muted cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-2">Name {getSortIcon('name')}</div>
              </th>
              <th
                className="px-4 py-3 text-left font-mono text-xs font-semibold text-muted cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort('role')}
              >
                <div className="flex items-center gap-2">Role {getSortIcon('role')}</div>
              </th>
              <th
                className="px-4 py-3 text-left font-mono text-xs font-semibold text-muted cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort('persona')}
              >
                <div className="flex items-center gap-2">Persona {getSortIcon('persona')}</div>
              </th>
              <th
                className="px-4 py-3 text-left font-mono text-xs font-semibold text-muted cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort('recruitability')}
              >
                <div className="flex items-center gap-2">Recruitability {getSortIcon('recruitability')}</div>
              </th>
              <th
                className="px-4 py-3 text-left font-mono text-xs font-semibold text-muted cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort('risk')}
              >
                <div className="flex items-center gap-2">Risk {getSortIcon('risk')}</div>
              </th>
              <th
                className="px-4 py-3 text-left font-mono text-xs font-semibold text-muted cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort('overallScore')}
              >
                <div className="flex items-center gap-2">Overall {getSortIcon('overallScore')}</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-muted">
                  Loading candidates...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-crimson">
                  {error.message}
                </td>
              </tr>
            ) : sortedCandidates.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-muted">
                  No candidates found.
                </td>
              </tr>
            ) : (
              sortedCandidates.map((candidate) => (
                <motion.tr
                  key={candidate.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  whileHover={{ backgroundColor: 'rgba(147, 112, 219, 0.05)' }}
                  onClick={() => {
                    setSelectedRow(candidate.id)
                    onSelectCandidate?.(candidate.id)
                  }}
                  className={`border-b border-border/50 cursor-pointer transition-colors ${
                    selectedRow === candidate.id ? 'bg-primary/10' : ''
                  }`}
                >
                  <td className="px-4 py-3 font-mono font-semibold text-primary">#{candidate.rank}</td>
                  <td className="px-4 py-3 font-mono text-muted text-xs">{candidate.id}</td>
                  <td className="px-4 py-3 font-medium">{candidate.name}</td>
                  <td className="px-4 py-3 text-muted">{candidate.role}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded text-xs bg-primary/10 text-primary">{candidate.persona}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-surface-elevated rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${candidate.recruitability}%` }}
                          transition={{ delay: 0.1, duration: 0.5 }}
                          className="h-full bg-gradient-to-r from-primary to-accent-cyan"
                        />
                      </div>
                      <span className="font-mono text-xs">{candidate.recruitability}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-mono text-xs ${candidate.risk > 15 ? 'text-crimson' : 'text-emerald'}`}>
                      {candidate.risk}%
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold">{candidate.overallScore}</td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </GlassCard>
  )
}

export default CandidateTable
