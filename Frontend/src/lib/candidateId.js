/**
 * Preview of the Candidate ID the server will generate (Backend/utils/candidateId.js is
 * authoritative): "WD" + 2-digit ward + 2-character party code, uppercase.
 * Returns { id } or { code: 'WARD_CODE_TOO_LARGE' | 'PARTY_CODE_INVALID' }.
 */
const GENERIC_WORDS = new Set(['PARTY'])

function partyCode(party) {
  const words = String(party ?? '')
    .toUpperCase()
    .split(/[\s\-_/]+/)
    .map((word) => word.replace(/[^A-Z0-9]/g, ''))
    .filter(Boolean)
  const meaningful = words.filter((word) => !GENERIC_WORDS.has(word))
  const list = meaningful.length ? meaningful : words
  if (!list.length) return null
  const code = list.length === 1 ? list[0].slice(0, 2) : `${list[0][0]}${list[1][0]}`
  return code.length === 2 ? code : null
}

export function previewCandidateId(wardNo, party) {
  const ward = Number(wardNo)
  if (!Number.isInteger(ward) || ward < 1 || ward > 99) return { code: 'WARD_CODE_TOO_LARGE' }
  const code = partyCode(party)
  return code ? { id: `WD${String(ward).padStart(2, '0')}${code}` } : { code: 'PARTY_CODE_INVALID' }
}
