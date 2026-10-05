/**
 * Candidate ID: "WD" + 2-digit ward number + 2-character party code, uppercase (e.g. WD05XY).
 *
 * Party code:
 *  - punctuation and non-Latin characters are removed from each word,
 *  - the generic word "Party" is ignored (so "ABC Party" → AB and "Congress Party" → CO),
 *  - one word → its first two characters ("BJP" → BJ),
 *  - two or more words → the first character of the first two words ("Aam Aadmi" → AA,
 *    "Indian National Congress" → IN).
 *
 * The format only has room for wards 1–99 and needs two Latin letters or digits from the
 * party name; anything else is reported as an error instead of producing a different format.
 */
export const CANDIDATE_ID_PATTERN = /^WD\d{2}[A-Z0-9]{2}$/

const GENERIC_WORDS = new Set(['PARTY'])

export function partyCode(party) {
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

/** Returns { id } or { code } with code 'WARD_CODE_TOO_LARGE' | 'PARTY_CODE_INVALID'. */
export function generateCandidateId(wardNo, party) {
  if (!Number.isInteger(wardNo) || wardNo < 1 || wardNo > 99) return { code: 'WARD_CODE_TOO_LARGE' }
  const code = partyCode(party)
  if (!code) return { code: 'PARTY_CODE_INVALID' }
  return { id: `WD${String(wardNo).padStart(2, '0')}${code}` }
}

/** Normalizes a Candidate ID typed in a sheet ("wd01ab " → "WD01AB"); null if not in the format. */
export function parseCandidateId(value) {
  const text = String(value ?? '').trim().toUpperCase()
  return CANDIDATE_ID_PATTERN.test(text) ? text : null
}
