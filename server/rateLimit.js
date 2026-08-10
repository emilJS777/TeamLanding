export function createRateLimiter({ windowMs = 15 * 60_000, max = 5, now = () => Date.now() } = {}) {
  const clients = new Map()
  return (key) => {
    const current = now()
    const previous = clients.get(key)
    if (!previous || current - previous.startedAt >= windowMs) {
      clients.set(key, { count: 1, startedAt: current })
      return { allowed: true, remaining: max - 1 }
    }
    previous.count += 1
    if (clients.size > 5000) {
      for (const [client, value] of clients) if (current - value.startedAt >= windowMs) clients.delete(client)
    }
    return { allowed: previous.count <= max, remaining: Math.max(0, max - previous.count) }
  }
}
