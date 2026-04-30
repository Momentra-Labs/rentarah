import type { Request, Response } from 'express'

/** Smoke test — confirms Express, middleware chain, and routing are wired. */
export function getHello(_req: Request, res: Response): void {
  res.json({
    ok: true,
    message: 'Hello World — RentaraH API is live',
    timestamp: new Date().toISOString(),
  })
}
