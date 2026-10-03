/**
 * Candidate photos are resized in the browser to a small JPEG (max 320px, ~20–40 KB)
 * before upload; the server checks the type and size again before storing them.
 */
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_INPUT_BYTES = 5 * 1024 * 1024
const MAX_SIDE = 320

const fail = (code) => Object.assign(new Error(code), { code })

export async function prepareCandidateImage(file) {
  if (!ACCEPTED.includes(file.type)) throw fail('IMAGE_INVALID')
  if (file.size > MAX_INPUT_BYTES) throw fail('IMAGE_TOO_LARGE')

  const url = URL.createObjectURL(file)
  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(fail('IMAGE_ERROR'))
      img.src = url
    })
    const scale = Math.min(1, MAX_SIDE / Math.max(image.naturalWidth, image.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    const context = canvas.getContext('2d')
    context.fillStyle = '#ffffff' // flatten transparency for JPEG
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.85)
  } finally {
    URL.revokeObjectURL(url)
  }
}
