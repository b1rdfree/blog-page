import { useCallback } from 'react'
import { loadTrip } from './dataset'
import { useAsyncContent } from '../useAsyncContent'

export function useTrip(slug: string | undefined) {
  const load = useCallback(() => slug ? loadTrip(slug) : Promise.resolve(null), [slug])
  return useAsyncContent(slug ? load : undefined)
}
