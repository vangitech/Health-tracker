/**
 * Native Platform Abstraction Layer
 *
 * Web-safe wrappers around Capacitor/Ionic native features.
 * On web, all functions return fallback values.
 * Capacitor/Ionic are dynamically imported only on native platforms.
 * This ensures web bundles never include native code.
 */

let nativePlatform = null

export async function isNative() {
  if (nativePlatform !== null) return nativePlatform
  try {
    const { Capacitor } = await import('@capacitor/core')
    nativePlatform = Capacitor.isNativePlatform()
  } catch {
    nativePlatform = false
  }
  return nativePlatform
}

export async function getPlatform() {
  try {
    const { Capacitor } = await import('@capacitor/core')
    if (Capacitor.isNativePlatform()) {
      return Capacitor.getPlatform()
    }
  } catch {}
  return 'web'
}

export async function saveFile(filename, data, mimeType = 'application/octet-stream') {
  if (!(await isNative())) {
    const blob = new Blob([data], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    return { uri: url }
  }

  const { Filesystem, Directory } = await import('@capacitor/filesystem')
  const result = await Filesystem.writeFile({
    path: filename,
    data: data instanceof Blob ? await blobToBase64(data) : data,
    directory: Directory.Documents,
  })
  return result
}

export async function readFile(path) {
  if (!(await isNative())) {
    const response = await fetch(path)
    return await response.text()
  }

  const { Filesystem, Directory } = await import('@capacitor/filesystem')
  const result = await Filesystem.readFile({
    path,
    directory: Directory.Documents,
  })
  return result.data
}

export async function getItem(key) {
  if (!(await isNative())) {
    return localStorage.getItem(key)
  }

  const { Preferences } = await import('@capacitor/preferences')
  const { value } = await Preferences.get({ key })
  return value
}

export async function setItem(key, value) {
  if (!(await isNative())) {
    localStorage.setItem(key, value)
    return
  }

  const { Preferences } = await import('@capacitor/preferences')
  await Preferences.set({ key, value })
}

export async function removeItem(key) {
  if (!(await isNative())) {
    localStorage.removeItem(key)
    return
  }

  const { Preferences } = await import('@capacitor/preferences')
  await Preferences.remove({ key })
}

async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
