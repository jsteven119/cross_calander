import { addSSEClient, removeSSEClient } from '@/lib/cache'

export const dynamic = 'force-dynamic'

export async function GET() {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      // 연결 즉시 heartbeat 전송
      controller.enqueue(encoder.encode(': connected\n\n'))
      addSSEClient(controller)

      // 30초마다 keepalive ping
      const interval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'))
        } catch {
          clearInterval(interval)
        }
      }, 30_000)
    },
    cancel(controller) {
      removeSSEClient(controller)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
