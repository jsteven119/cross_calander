// In-memory cache: Vercel serverless에서 인스턴스 간 공유 안 되므로
// 실제 프로덕션에서는 Vercel KV 또는 Redis로 교체 가능
// 단일 인스턴스 개발/소규모 팀 환경에서는 충분

let lastUpdated: string = new Date().toISOString()
const sseClients = new Set<ReadableStreamDefaultController>()

export function getLastUpdated(): string {
  return lastUpdated
}

export function setLastUpdated(ts: string): void {
  lastUpdated = ts
}

export function addSSEClient(controller: ReadableStreamDefaultController): void {
  sseClients.add(controller)
}

export function removeSSEClient(controller: ReadableStreamDefaultController): void {
  sseClients.delete(controller)
}

export function broadcastRefresh(): void {
  const ts = new Date().toISOString()
  lastUpdated = ts
  const msg = `data: ${JSON.stringify({ type: 'refresh', timestamp: ts })}\n\n`
  for (const controller of sseClients) {
    try {
      controller.enqueue(new TextEncoder().encode(msg))
    } catch {
      sseClients.delete(controller)
    }
  }
}

export function getSSEClientCount(): number {
  return sseClients.size
}
