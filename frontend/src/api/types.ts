export interface NameValue {
  name: string
  value: number
}

export interface AnalyticsOverview {
  dataset_size: number
  most_common_roles: NameValue[]
  most_common_skills: NameValue[]
  persona_distribution: Record<string, number>
  risk_distribution: Record<string, number>
  experience_distribution?: Record<string, number>
  recruitability_distribution?: Record<string, number>
  hiring_readiness_distribution?: Record<string, number>
  highest_recruiter_demand_roles?: NameValue[]
  top_certifications?: NameValue[]
  top_ranked_candidates?: string[]
  average_experience_years?: number
  median_experience_years?: number
  market_insights?: Record<string, unknown>
}

export interface CandidateListItem {
  candidate_id: string
  name: string
  headline: string
  location: string
  years_of_experience: number
  current_title: string
  current_company: string
  score: number
  persona?: string
  role?: string
  recruitability_score?: number
  risk_score?: number
  dna_profile?: Record<string, unknown>
}

export interface CandidateListResponse {
  items: CandidateListItem[]
  page: number
  limit: number
  total: number
  has_more: boolean
}

export interface CareerHistory {
  company: string
  title: string
  start_date: string
  end_date?: string | null
  duration_months: number
  is_current: boolean
  industry: string
  company_size: string
  description: string
}

export interface Profile {
  anonymized_name: string
  headline: string
  summary: string
  location: string
  country: string
  years_of_experience: number
  current_title: string
  current_company: string
  current_company_size: string
  current_industry: string
}

export interface CandidateProfile {
  candidate_id: string
  profile: Profile
  career_history: CareerHistory[]
  skills?: Array<string | { name: string }>
  dna?: Record<string, number> | Array<{ name: string; value: number }>
  recruitability?: number
  risk?: number
}

export interface CandidateMetrics {
  candidate_id: string
  rank?: number | null
  score: number
  reasoning: string
  persona?: string
  role?: string
}

export interface DecisionCard {
  candidate_id: string
  recommendation: string
  score: number
  reasoning: string
  signals: string[]
  risk_factors: string[]
  strength_factors: string[]
}

export interface CandidateDetailResponse {
  profile: CandidateProfile
  metrics: CandidateMetrics
  decision_card: DecisionCard
  score_breakdown: Record<string, unknown>
}

export interface RadarValue {
  axis: string
  value: number
}

export interface ComparisonMetrics {
  score_1: number
  score_2: number
  score_diff: number
  persona_1?: string
  persona_2?: string
  role_1?: string
  role_2?: string
  recruitability_1?: number
  recruitability_2?: number
  reliability_1?: number
  reliability_2?: number
  leadership_1?: number
  leadership_2?: number
  strengths_1?: string[]
  strengths_2?: string[]
  concerns_1?: string[]
  concerns_2?: string[]
}

export interface ComparisonResult {
  candidate_id_1: string
  candidate_id_2: string
  winner: string
  winner_score: number
  loser_score: number
  radar_values_1: RadarValue[]
  radar_values_2: RadarValue[]
  recommendation: string
  comparison_metrics: ComparisonMetrics
}

export interface PipelinePhase {
  phase: string
  name: string
  description: string
  status: 'pending' | 'running' | 'completed'
  artifacts: string[]
}

export interface PipelineStatus {
  pipeline_status: string
  total_phases: number
  phases: PipelinePhase[]
  overall_progress: string
}

export interface SubmissionRankingItem {
  rank: number
  candidate_id: string
  score: number
  reasoning: string
  recommendation: string
}
