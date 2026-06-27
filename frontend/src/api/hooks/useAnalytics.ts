import { useQuery } from '@tanstack/react-query'
import { getAnalytics } from '../../services/demoApi'
import { AnalyticsOverview } from '../types'

export function useAnalytics() {
  return useQuery<AnalyticsOverview, Error>({
    queryKey: ['analyticsOverview'],
    queryFn: () => getAnalytics(),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })
}
