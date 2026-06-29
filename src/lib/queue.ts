export function dequeue<T>(items: T[]): { item: T | null; rest: T[] } {
  if (items.length === 0) {
    return { item: null, rest: [] }
  }
  const rest = items.slice()
  const item = rest.shift() ?? null
  return { item, rest }
}
