import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { getCandidates } from '../../services/demoApi'
import { CandidateListResponse } from '../types'

export interface UseCandidatesParams {
  page?: number
  limit?: number
  search?: string
  persona?: string
  role?: string
  sort?: string
}

export function useCandidates(params: UseCandidatesParams = {}): UseQueryResult<CandidateListResponse, Error> {
  return useQuery<CandidateListResponse, Error, CandidateListResponse>({
    queryKey: ['candidates', params],
    queryFn: () =>
      getCandidates({
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        search: params.search,
        persona: params.persona,
        role: params.role,
        sort: params.sort,
      }),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })
}
