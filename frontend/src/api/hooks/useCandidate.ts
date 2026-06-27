import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { getCandidate } from '../../services/demoApi'
import { CandidateDetailResponse } from '../types'

export function useCandidate(candidateId: string): UseQueryResult<CandidateDetailResponse, Error> {
  return useQuery<CandidateDetailResponse, Error, CandidateDetailResponse>({
    queryKey: ['candidate', candidateId],
    queryFn: () => getCandidate(candidateId),
    enabled: !!candidateId,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })
}
