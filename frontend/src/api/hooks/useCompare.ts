import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { getComparison } from '../../services/demoApi'
import { ComparisonResult } from '../types'

export function useCompare(candidateId1: string, candidateId2: string): UseQueryResult<ComparisonResult, Error> {
  return useQuery<ComparisonResult, Error, ComparisonResult>({
    queryKey: ['compare', candidateId1, candidateId2],
    queryFn: () =>
      getComparison(candidateId1, candidateId2),
    // only enable when both ids are provided and different — backend returns 400 for identical ids
    enabled: !!candidateId1 && !!candidateId2 && candidateId1 !== candidateId2,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })
}
