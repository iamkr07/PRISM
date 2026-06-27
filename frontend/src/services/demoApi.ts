import type {
  CandidateListItem,
  CandidateListResponse,
  CandidateDetailResponse,
  AnalyticsOverview,
  ComparisonResult,
  PipelineStatus,
  SubmissionRankingItem
} from '../api/types'

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Load JSON data
async function loadData<T>(path: string): Promise<T> {
  const response = await fetch(path)
  if (!response.ok) {
    throw new Error(`Failed to load ${path}`)
  }
  return response.json()
}

let candidatesCache: CandidateListItem[] | null = null
let candidateDetailsCache: Record<string, CandidateDetailResponse> | null = null
let analyticsCache: AnalyticsOverview | null = null
let comparisonCache: Record<string, ComparisonResult> | null = null
let pipelineCache: PipelineStatus | null = null
let submissionCache: SubmissionRankingItem[] | null = null

async function getCandidatesData(): Promise<CandidateListItem[]> {
  if (!candidatesCache) {
    candidatesCache = await loadData<CandidateListItem[]>('/data/candidates.json')
  }
  return candidatesCache
}

async function getCandidateDetailsData(): Promise<Record<string, CandidateDetailResponse>> {
  if (!candidateDetailsCache) {
    candidateDetailsCache = await loadData<Record<string, CandidateDetailResponse>>('/data/candidate_details.json')
  }
  return candidateDetailsCache
}

export async function getCandidates({
  page = 1,
  limit = 20,
  search,
  persona,
  role,
  sort
}: {
  page?: number
  limit?: number
  search?: string
  persona?: string
  role?: string
  sort?: string
} = {}): Promise<CandidateListResponse> {
  await delay(200 + Math.random() * 200)
  const candidates = await getCandidatesData()

  let filtered = [...candidates]

  if (search) {
    const searchLower = search.toLowerCase()
    filtered = filtered.filter(candidate =>
      candidate.name.toLowerCase().includes(searchLower) ||
      candidate.headline.toLowerCase().includes(searchLower) ||
      candidate.location.toLowerCase().includes(searchLower) ||
      candidate.current_company.toLowerCase().includes(searchLower)
    )
  }

  if (persona) {
    filtered = filtered.filter(candidate => candidate.persona === persona)
  }

  if (role) {
    filtered = filtered.filter(candidate => candidate.role === role)
  }

  if (sort) {
    if (sort === 'score_desc') {
      filtered.sort((a, b) => b.score - a.score)
    } else if (sort === 'score_asc') {
      filtered.sort((a, b) => a.score - b.score)
    } else if (sort === 'experience_desc') {
      filtered.sort((a, b) => b.years_of_experience - a.years_of_experience)
    } else if (sort === 'experience_asc') {
      filtered.sort((a, b) => a.years_of_experience - b.years_of_experience)
    }
  }

  const total = filtered.length
  const start = (page - 1) * limit
  const end = start + limit
  const items = filtered.slice(start, end)
  const hasMore = end < total

  return {
    items,
    page,
    limit,
    total,
    has_more: hasMore
  }
}

export async function getCandidate(candidateId: string): Promise<CandidateDetailResponse> {
  await delay(200 + Math.random() * 200)
  const details = await getCandidateDetailsData()
  const candidate = details[candidateId]
  if (!candidate) {
    throw new Error(`Candidate ${candidateId} not found`)
  }
  return candidate
}

export async function getAnalytics(): Promise<AnalyticsOverview> {
  if (!analyticsCache) {
    analyticsCache = await loadData<AnalyticsOverview>('/data/analytics.json')
  }
  await delay(200 + Math.random() * 200)
  return analyticsCache
}

export async function getComparison(candidateId1: string, candidateId2: string): Promise<ComparisonResult> {
  if (!comparisonCache) {
    comparisonCache = await loadData<Record<string, ComparisonResult>>('/data/comparison.json')
  }
  await delay(200 + Math.random() * 200)
  const key = `${candidateId1}-${candidateId2}`
  const reverseKey = `${candidateId2}-${candidateId1}`
  let comparison = comparisonCache[key]
  if (!comparison) {
    comparison = comparisonCache[reverseKey]
  }
  if (!comparison) {
    const details = await getCandidateDetailsData()
    const c1 = details[candidateId1]
    const c2 = details[candidateId2]
    const score1 = c1.metrics.score
    const score2 = c2.metrics.score
    return {
      candidate_id_1: candidateId1,
      candidate_id_2: candidateId2,
      winner: score1 >= score2 ? candidateId1 : candidateId2,
      winner_score: Math.max(score1, score2),
      loser_score: Math.min(score1, score2),
      radar_values_1: [
        { axis: 'Technical Skills', value: 70 + (hash(candidateId1) % 30) },
        { axis: 'Leadership', value: 60 + (hash(candidateId1) % 40) },
        { axis: 'Communication', value: 65 + (hash(candidateId1) % 35) },
        { axis: 'Experience', value: 70 + (hash(candidateId1) % 30) },
        { axis: 'Problem Solving', value: 75 + (hash(candidateId1) % 25) }
      ],
      radar_values_2: [
        { axis: 'Technical Skills', value: 70 + (hash(candidateId2) % 30) },
        { axis: 'Leadership', value: 60 + (hash(candidateId2) % 40) },
        { axis: 'Communication', value: 65 + (hash(candidateId2) % 35) },
        { axis: 'Experience', value: 70 + (hash(candidateId2) % 30) },
        { axis: 'Problem Solving', value: 75 + (hash(candidateId2) % 25) }
      ],
      recommendation: `${c1.profile.profile.anonymized_name} and ${c2.profile.profile.anonymized_name} are both strong candidates`,
      comparison_metrics: {
        score_1: score1,
        score_2: score2,
        score_diff: Math.abs(score1 - score2),
        persona_1: c1.metrics.persona,
        persona_2: c2.metrics.persona,
        role_1: c1.metrics.role,
        role_2: c2.metrics.role,
        recruitability_1: c1.profile.profile.years_of_experience,
        recruitability_2: c2.profile.profile.years_of_experience,
        reliability_1: 80,
        reliability_2: 78,
        leadership_1: 72,
        leadership_2: 70,
        strengths_1: ['Strong skills'],
        strengths_2: ['Good experience'],
        concerns_1: [],
        concerns_2: []
      }
    }
  }
  return comparison
}

function hash(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0
  }
  return h
}

export async function getPipeline(): Promise<PipelineStatus> {
  if (!pipelineCache) {
    pipelineCache = await loadData<PipelineStatus>('/data/pipeline.json')
  }
  await delay(200 + Math.random() * 200)
  return pipelineCache
}

export async function getSubmission(): Promise<SubmissionRankingItem[]> {
  if (!submissionCache) {
    submissionCache = await loadData<SubmissionRankingItem[]>('/data/submission.json')
  }
  await delay(200 + Math.random() * 200)
  return submissionCache
}
