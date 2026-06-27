import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { getPipeline } from '../../services/demoApi'
import { PipelineStatus } from '../types'

export function usePipeline(): UseQueryResult<PipelineStatus, Error> {
  return useQuery<PipelineStatus, Error, PipelineStatus>({
    queryKey: ['pipelineStatus'],
    queryFn: () => getPipeline(),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })
}
