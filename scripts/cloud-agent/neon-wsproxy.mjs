/**
 * Neon serverless driver -> local Postgres WebSocket proxy (local dev only).
 *
 * The API (`api/src/lib/db.ts`) connects through `@neondatabase/serverless`,
 * whose Pool speaks the Postgres wire protocol over a secure WebSocket to a
 * Neon endpoint. To run the real API against a local Postgres during
 * development we stand up the same kind of proxy Neon documents for
 * self-hosted use: a TLS WebSocket server that relays raw bytes to a TCP
 * Postgres backend chosen via the `?address=host:port` query the driver sends.
 *
 * Requirements handled by scripts/cloud-agent/install.sh:
 *   - a self-signed cert/key for `localhost` (trusted by the API via
 *     NODE_EXTRA_CA_CERTS)
 *   - local Postgres configured for cleartext `password` auth on 127.0.0.1
 *     (the driver's default pipelineConnect='password' requires it)
 *
 * This is dev-only infrastructure and never runs in production.
 */
import { WebSocketServer } from 'ws'
import net from 'node:net'
import https from 'node:https'
import fs from 'node:fs'

const PORT = parseInt(process.env.WSPROXY_PORT || '443', 10)
const CERT = process.env.WSPROXY_CERT || '/etc/trustatlas/certs/localhost.pem'
const KEY = process.env.WSPROXY_KEY || '/etc/trustatlas/certs/localhost-key.pem'

const server = https.createServer({
  cert: fs.readFileSync(CERT),
  key: fs.readFileSync(KEY),
})

const wss = new WebSocketServer({ server })

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, 'https://localhost')
  const address = url.searchParams.get('address') || 'localhost:5432'
  const [host, portStr] = address.split(':')
  const tcp = net.connect({ host, port: parseInt(portStr, 10) })

  let open = false
  const pending = []

  tcp.on('connect', () => {
    open = true
    for (const buf of pending) tcp.write(buf)
    pending.length = 0
  })
  ws.on('message', (data) => {
    const buf = Array.isArray(data) ? Buffer.concat(data) : data
    if (open) tcp.write(buf)
    else pending.push(buf)
  })
  tcp.on('data', (d) => {
    if (ws.readyState === ws.OPEN) ws.send(d)
  })

  const close = () => {
    try { ws.close() } catch { /* ignore */ }
    try { tcp.destroy() } catch { /* ignore */ }
  }
  ws.on('close', close)
  ws.on('error', close)
  tcp.on('close', close)
  tcp.on('error', close)
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[neon-wsproxy] listening on :${PORT} (relays to ?address=host:port)`)
})
