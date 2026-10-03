/**
 * Client for the Express API. The base URL comes from VITE_API_URL (Frontend/.env), e.g.
 * http://localhost:5000/api locally or the deployed backend's /api URL in production.
 * Errors are thrown as ApiError with a `code` that the UI maps to a translated message.
 */
const API_URL = (import.meta.env.VITE_API_URL ?? '').trim().replace(/\/+$/, '')
if (!API_URL) console.error('VITE_API_URL is not set. Copy Frontend/.env.example to Frontend/.env and set it.')

export class ApiError extends Error {
  constructor(code, details = {}) {
    super(details.message || code)
    this.name = 'ApiError'
    this.code = code
    this.details = details
  }
}

async function request(method, path, { body, token } = {}) {
  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('NETWORK_ERROR')
  }
  let json = null
  try {
    json = await response.json()
  } catch {
    // Non-JSON reply (e.g. the server could not be reached through a proxy).
  }
  if (!json) throw new ApiError('NETWORK_ERROR')
  if (!response.ok || !json.success) throw new ApiError(json.code || 'generic', json)
  return json
}

/** URL of a candidate photo; the version parameter changes whenever the photo changes. */
export const candidateImageUrl = (id, version) => `${API_URL}/candidates/${encodeURIComponent(id)}/image?v=${version}`

// ---------- Public ----------

export const getWards = () => request('GET', '/wards').then((r) => r.wards)
/** Declared ward results only (the server never sends pending votes publicly). */
export const getResults = () => request('GET', '/results').then((r) => r.results)
export const getSettings = () => request('GET', '/settings').then((r) => r.settings)

// ---------- Super Admin ----------

export const login = (email, password) => request('POST', '/admin/login', { body: { email, password } })
export const me = (token) => request('GET', '/admin/me', { token })
export async function logout(token) {
  try {
    await request('POST', '/admin/logout', { token, body: {} })
  } catch {
    // The local session is discarded either way.
  }
}

export const admin = {
  data: (token) => request('GET', '/admin/data', { token }),
  importWards: (token, wards, conflictResolution) => request('POST', '/admin/wards/import', { token, body: { wards, conflictResolution } }),
  createWard: (token, ward) => request('POST', '/admin/wards', { token, body: ward }),
  updateWard: (token, wardNo, ward) => request('PUT', `/admin/wards/${wardNo}`, { token, body: ward }),
  deleteWard: (token, wardNo, withCandidates) => request('DELETE', `/admin/wards/${wardNo}${withCandidates ? '?withCandidates=true' : ''}`, { token }),
  deleteWardCandidates: (token, wardNo) => request('DELETE', `/admin/wards/${wardNo}/candidates`, { token }),
  declareWard: (token, wardNo) => request('POST', `/admin/wards/${wardNo}/declare`, { token, body: {} }),
  reopenWard: (token, wardNo) => request('POST', `/admin/wards/${wardNo}/reopen`, { token, body: {} }),
  resetWards: (token) => request('DELETE', '/admin/wards', { token }),
  importCandidates: (token, candidates, conflictResolution) => request('POST', '/admin/candidates/import', { token, body: { candidates, conflictResolution } }),
  createCandidate: (token, candidate, onConflict) => request('POST', '/admin/candidates', { token, body: { ...candidate, onConflict } }),
  updateCandidate: (token, id, candidate) => request('PUT', `/admin/candidates/${id}`, { token, body: candidate }),
  deleteCandidate: (token, id) => request('DELETE', `/admin/candidates/${id}`, { token }),
  setCandidateImage: (token, id, image) => request('PUT', `/admin/candidates/${id}/image`, { token, body: { image } }),
  resetResults: (token) => request('DELETE', '/admin/results', { token }),
  setElection: (token, dateTime) => request('PUT', '/admin/settings/election', { token, body: { dateTime } }),
  setResultDeclaration: (token, dateTime) => request('PUT', '/admin/settings/result-declaration', { token, body: { dateTime } }),
  clearSchedule: (token) => request('DELETE', '/admin/settings', { token }),
}

/**
 * Uploads a spreadsheet for a server-side preview (multipart, field "file"). Uses
 * XMLHttpRequest so the UI can tell when the file has finished uploading (`onUploaded`).
 */
function uploadSheet(path, file, token, { onUploaded } = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const form = new FormData()
    form.append('file', file)
    xhr.open('POST', `${API_URL}${path}`)
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.responseType = 'json'
    xhr.upload.onload = () => onUploaded?.()
    xhr.onerror = () => reject(new ApiError('NETWORK_ERROR'))
    xhr.onload = () => {
      const json = xhr.response
      if (!json || typeof json !== 'object') return reject(new ApiError('NETWORK_ERROR'))
      if (xhr.status >= 200 && xhr.status < 300 && json.success) return resolve(json)
      reject(new ApiError(json.code || 'generic', json))
    }
    xhr.send(form)
  })
}

/** POST /api/admin/upload-results — candidate sheet, checked against the stored Ward Master. */
export const uploadCandidateSheet = (file, token, { onUploaded } = {}) => uploadSheet('/admin/upload-results', file, token, { onUploaded })
/** POST /api/admin/upload-wards — Ward Master sheet. */
export const uploadWardSheet = (file, token, { onUploaded } = {}) => uploadSheet('/admin/upload-wards', file, token, { onUploaded })
