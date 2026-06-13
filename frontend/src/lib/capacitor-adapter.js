import { CapacitorHttp } from '@capacitor/core'

export const isNative = () => {
  try {
    const { Capacitor } = require('@capacitor/core')
    return Capacitor.isNativePlatform()
  } catch {
    return false
  }
}

export const capacitorAdapter = (config) => {
  return new Promise((resolve, reject) => {
    const url = `${config.baseURL || ''}${config.url || ''}`
    const method = (config.method || 'get').toUpperCase()

    const headers = {}
    if (config.headers) {
      Object.entries(config.headers).forEach(([key, value]) => {
        if (value !== undefined && value !== null && typeof value !== 'function') {
          headers[key] = String(value)
        }
      })
    }

    const options = { url, method, headers }
    if (config.data) {
      options.data = config.data
    }
    if (config.params) {
      options.params = config.params
    }

    CapacitorHttp.request(options)
      .then((response) => {
        resolve({
          data: response.data,
          status: response.status,
          statusText: response.status >= 200 && response.status < 300 ? 'OK' : 'Error',
          headers: response.headers || {},
          config,
          request: { responseType: 'json' },
        })
      })
      .catch((error) => {
        const err = new Error(error.message || 'Network Error')
        err.config = config
        err.code = 'ERR_NETWORK'
        reject(err)
      })
  })
}
