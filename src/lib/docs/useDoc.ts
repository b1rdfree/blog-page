import { useEffect, useState } from 'react'
import type { Doc, DocMeta } from './types'
import { loadDoc } from './content'

type State = {
  doc: Doc | null
  loading: boolean
  /** Bad URL or file deleted */
  missing: boolean
}

/**
 * Load one doc body on demand.
 *
 * meta is already available from the build-time index; the hook only dynamically
 * imports the matching .md. An `ignored` flag discards stale responses so that
 * fast clicking does not let a late older response overwrite the newer one.
 */
export function useDoc(meta: DocMeta | undefined): State {
  const [state, setState] = useState<State>({ doc: null, loading: true, missing: false })

  useEffect(() => {
    if (!meta) {
      setState({ doc: null, loading: false, missing: false })
      return
    }

    let ignored = false
    setState((prev) => ({ doc: prev.doc, loading: true, missing: false }))

    void loadDoc(meta).then((doc) => {
      if (ignored) return
      setState({ doc, loading: false, missing: doc === null })
    })

    return () => {
      ignored = true
    }
  }, [meta])

  return state
}