/**
 * Client for the Express API (backend/server.js). In development Vite proxies /api
 * to http://localhost:4000. Errors are thrown as ApiError with a `code` that the UI
 * maps to a translated message (errors.* / admin.progress.errors.*).
 */
export class ApiError extends Error {
  constructor(code, details = {}) {
    super(details.message || code)
    this.name = 'ApiError'
    this.code = code
    this.details = details
  }
}

async function postJson(path, body, token) {
  let response
  try {
    response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body ?? {}),
    })
  } catch {
    throw new ApiError('NETWORK_ERROR')
  }
  let json = null
  try {
    json = await response.json()
  } catch {
    // Non-JSON reply (e.g. the dev proxy could not reach the API server).
  }
  if (!json) throw new ApiError('NETWORK_ERROR')
  if (!response.ok || !json.success) throw new ApiError(json.code || 'generic', json)
  return json
}

/** POST /api/admin/login → { token, user } */
export async function login(email, password) {
  const { token, user } = await postJson('/api/admin/login', { email, password })
  return { token, user }
}

/** POST /api/admin/logout — best effort; the local session is cleared regardless. */
export async function logout(token) {
  try {
    await postJson('/api/admin/logout', {}, token)
  } catch {
    // Ignore: the session is discarded client-side either way.
  }
}

/**
 * POST /api/admin/upload-results (multipart, field "file").
 * Uses XMLHttpRequest so the UI can tell when the file has finished uploading
 * (`onUploaded`) and the server has moved on to checking fields.
 * Resolves with the validated records: [{ name, wardNo, totalVotes }].
 */
export function uploadResults(file, token, { onUploaded } = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const form = new FormData()
    form.append('file', file)

    xhr.open('POST', '/api/admin/upload-results')
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.responseType = 'json'
    xhr.upload.onload = () => onUploaded?.()
    xhr.onerror = () => reject(new ApiError('NETWORK_ERROR'))
    xhr.onload = () => {
      const json = xhr.response
      if (!json || typeof json !== 'object') return reject(new ApiError('NETWORK_ERROR'))
      if (xhr.status >= 200 && xhr.status < 300 && json.success) return resolve(json.data)
      reject(new ApiError(json.code || 'generic', json))
    }
    xhr.send(form)
  })
}
