import { useEffect, useState, useCallback } from 'react'
import { getPyodideClient } from '../lib/pyodide-client.js'

// status: 'loading' | 'ready' | 'error'
export function usePyodide() {
  const [status, setStatus] = useState('loading')
  const [error,  setError]  = useState(null)

  useEffect(() => {
    const client = getPyodideClient()
    return client.onStatusChange((s, msg) => {
      setStatus(s)
      setError(msg || null)
    })
  }, [])

  const run = useCallback((imageURL, method, params) => {
    return getPyodideClient().process(imageURL, method, params)
  }, [])

  return { status, error, ready: status === 'ready', run }
}
