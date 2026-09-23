import { useCallback } from 'react'
import type { DocMeta } from './types'
import { loadDoc } from './content'
import { useAsyncContent } from '../useAsyncContent'

export function useDoc(meta: DocMeta | undefined) {
  const load = useCallback(() => meta ? loadDoc(meta) : Promise.resolve(null), [meta])
  const { data: doc, ...state } = useAsyncContent(meta ? load : undefined)
  return { doc, ...state }
}
