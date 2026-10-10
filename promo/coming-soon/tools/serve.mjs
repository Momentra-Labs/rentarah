// Tiny static server for the promo project (canvas export needs http, not file://).
// Usage: node tools/serve.mjs [port]
import { createServer } from 'node:http'
import { createReadStream } from 'node:fs'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.mp4': 'video/mp4',
}

export function startServer(port = 4780) {
  const server = createServer(async (req, res) => {
    try {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname)
      if (p.endsWith('/')) p += 'index.html'
      const file = normalize(join(ROOT, p))
      if (!file.startsWith(ROOT)) throw new Error('outside root')
      const { size } = await stat(file)
      const type = TYPES[extname(file)] || 'application/octet-stream'
      // Range support so <video> can seek the exported MP4s.
      const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '')
      if (range) {
        const start = range[1] ? Number(range[1]) : size - Number(range[2])
        const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1
        res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1, 'Cache-Control': 'no-store' })
        createReadStream(file, { start, end }).pipe(res)
        return
      }
      res.writeHead(200, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Length': size, 'Cache-Control': 'no-store' })
      res.end(await readFile(file))
    } catch {
      res.writeHead(404)
      res.end('Not found')
    }
  })
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)))
}

if (process.argv[1] && fileURLToPath(import.meta.url) === normalize(process.argv[1])) {
  const port = Number(process.argv[2] || 4780)
  await startServer(port)
  console.log(`RentaraH promo → http://127.0.0.1:${port}/`)
}
