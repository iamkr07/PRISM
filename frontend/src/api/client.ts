const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL ?? ''

export async function apiFetch<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const url = new URL(normalizedPath, API_BASE_URL || window.location.origin)

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value))
      }
    })
  }

  const response = await fetch(url.toString(), {
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const text = await response.text()
  if (!response.ok) {
    const errorText = text || response.statusText
    throw new Error(errorText || `Request failed with status ${response.status}`)
  }

  try {
    return JSON.parse(text)
  } catch (error) {
    throw new Error(`Invalid JSON response from ${url.toString()}: ${text.slice(0, 200)}`)
  }
}
