export type UploadedPart = {
  field: string
  filename: string
  mime: string
  data: Buffer
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024

export function parseMultipart(body: Buffer, contentType: string): UploadedPart[] {
  const boundaryMatch = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType)
  const boundary = boundaryMatch?.[1] ?? boundaryMatch?.[2]?.trim()
  if (!boundary) throw new Error("Upload must be multipart/form-data.")
  const delimiter = Buffer.from(`--${boundary}`)
  const parts: UploadedPart[] = []
  let cursor = body.indexOf(delimiter)
  if (cursor < 0) throw new Error("Upload body is missing its multipart boundary.")
  while (cursor >= 0) {
    let start = cursor + delimiter.length
    if (body.subarray(start, start + 2).toString() === "--") break
    if (body.subarray(start, start + 2).toString() === "\r\n") start += 2
    const next = body.indexOf(delimiter, start)
    if (next < 0) break
    let slice = body.subarray(start, next)
    if (slice.subarray(slice.length - 2).toString() === "\r\n") {
      slice = slice.subarray(0, slice.length - 2)
    }
    const headerEnd = slice.indexOf("\r\n\r\n")
    if (headerEnd >= 0) {
      const headers = slice.subarray(0, headerEnd).toString("utf8")
      const data = slice.subarray(headerEnd + 4)
      const disposition = /content-disposition:[^\r\n]*/i.exec(headers)?.[0] ?? ""
      const field = /name="([^"]*)"/i.exec(disposition)?.[1] ?? ""
      const filename = /filename="([^"]*)"/i.exec(disposition)?.[1] ?? ""
      const mime = /content-type:\s*([^\r\n;]+)/i.exec(headers)?.[1]?.trim() ?? ""
      if (field) parts.push({ field, filename, mime, data })
    }
    cursor = next
  }
  return parts
}

export function imageError(part: UploadedPart | undefined): string | null {
  if (!part || part.data.length === 0) return "Choose a PNG, JPEG, or WebP image."
  if (part.data.length > MAX_IMAGE_BYTES) return "Image must be 10 MB or smaller."
  const mime = part.mime.toLowerCase()
  const name = part.filename.toLowerCase()
  const allowedMime = mime === "image/png" || mime === "image/jpeg" || mime === "image/webp"
  const allowedName = name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".webp")
  if (!allowedMime && !allowedName) return "Image must be PNG, JPEG, or WebP."
  return null
}
