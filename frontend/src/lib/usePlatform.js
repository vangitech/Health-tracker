import { useState, useEffect } from 'react'

let cached = null

export function usePlatform() {
  const [state, setState] = useState({
    platform: 'web',
    isNative: false,
    isLoading: true,
  })

  useEffect(() => {
    if (cached) {
      setState({
        platform: cached,
        isNative: cached !== 'web',
        isLoading: false,
      })
      return
    }

    import('@capacitor/core')
      .then(({ Capacitor }) => {
        const p = Capacitor.isNativePlatform() ? Capacitor.getPlatform() : 'web'
        cached = p
        setState({ platform: p, isNative: p !== 'web', isLoading: false })
      })
      .catch(() => {
        cached = 'web'
        setState({ platform: 'web', isNative: false, isLoading: false })
      })
  }, [])

  return state
}
