const MAX_UPLOAD_BYTES = 12 * 1024 * 1024

/** Client-side JPEG for ID uploads — keeps payloads reasonable before S3/backend exists. */
export async function compressImageFileToJpegDataUrl(file: File, maxWidth = 1400, quality = 0.82): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Use a JPG or PNG photo of your physical ID.')
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('File is too large (max 12 MB). Try a tighter crop or daylight photo.')
  }

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error('Could not open that image. Try JPG or PNG from your camera app.')
  }

  const scale = Math.min(1, maxWidth / bitmap.width)
  const w = Math.max(1, Math.round(bitmap.width * scale))
  const h = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not process this image in your browser.')

  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()

  return canvas.toDataURL('image/jpeg', quality)
}
