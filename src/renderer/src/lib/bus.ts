type Handler = (payload?: unknown) => void

const listeners = new Map<string, Set<Handler>>()

export const bus = {
  on(event: string, handler: Handler): () => void {
    let set = listeners.get(event)
    if (!set) {
      set = new Set()
      listeners.set(event, set)
    }
    set.add(handler)
    return () => {
      set?.delete(handler)
    }
  },
  emit(event: string, payload?: unknown): void {
    listeners.get(event)?.forEach((handler) => handler(payload))
  },
}
