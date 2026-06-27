import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { getSubmission } from '../../services/demoApi'
import { SubmissionRankingItem } from '../types'

export function useSubmission(): UseQueryResult<SubmissionRankingItem[], Error> {
  return useQuery<SubmissionRankingItem[], Error, SubmissionRankingItem[]>({
    queryKey: ['submissionRanking'],
    queryFn: () => getSubmission(),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })
}
