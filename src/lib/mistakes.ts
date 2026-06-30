import { shuffle } from "./patrones"
import type { QueueItem, StoredMistake } from "../types"

export const MISTAKES_STORAGE_KEY = "patrones:mistakes"

export function cardKey(item: Pick<QueueItem, "deck" | "front" | "back">): string {
  return `${item.deck}\0${item.front}\0${item.back}`
}

function readStore(): Map<string, StoredMistake> {
  if (typeof localStorage === "undefined") return new Map()

  try {
    const raw = localStorage.getItem(MISTAKES_STORAGE_KEY)
    if (!raw) return new Map()

    const list = JSON.parse(raw) as StoredMistake[]
    if (!Array.isArray(list)) return new Map()

    return new Map(list.map((item) => [cardKey(item), item]))
  } catch {
    return new Map()
  }
}

function writeStore(store: Map<string, StoredMistake>) {
  if (typeof localStorage === "undefined") return
  if (!store.size) {
    localStorage.removeItem(MISTAKES_STORAGE_KEY)
    return
  }
  localStorage.setItem(MISTAKES_STORAGE_KEY, JSON.stringify([...store.values()]))
}

export function loadMistakes(): StoredMistake[] {
  return [...readStore().values()]
}

export function mistakeCount(): number {
  return readStore().size
}

export function recordMistake(item: QueueItem) {
  const store = readStore()
  const key = cardKey(item)
  const prev = store.get(key)

  store.set(key, {
    deck: item.deck,
    front: item.front,
    back: item.back,
    translation: item.translation,
    note: item.note,
    section: item.section,
    mode: item.mode,
    missCount: (prev?.missCount ?? 0) + 1,
    lastMissedAt: Date.now()
  })

  writeStore(store)
}

export function removeMistake(item: Pick<QueueItem, "deck" | "front" | "back">) {
  const store = readStore()
  if (!store.delete(cardKey(item))) return
  writeStore(store)
}

export function clearMistakes() {
  if (typeof localStorage === "undefined") return
  localStorage.removeItem(MISTAKES_STORAGE_KEY)
}

export function buildMistakesQueue(): QueueItem[] {
  return shuffle(loadMistakes().map((item) => ({
    front: item.front,
    back: item.back,
    translation: item.translation,
    note: item.note,
    deck: item.deck,
    section: "",
    mode: item.mode
  })))
}
