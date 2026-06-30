import { afterEach, describe, expect, it } from "vitest"
import {
  buildMistakesQueue,
  cardKey,
  clearMistakes,
  loadMistakes,
  mistakeCount,
  MISTAKES_STORAGE_KEY,
  recordMistake,
  removeMistake
} from "./mistakes"
import type { QueueItem } from "../types"

const sample: QueueItem = {
  deck: "Unit",
  front: "hola",
  back: "привет",
  translation: "приветствие",
  note: "",
  section: "Lex",
  mode: "vocab"
}

describe("mistakes store", () => {
  afterEach(() => {
    clearMistakes()
  })

  it("builds stable card keys", () => {
    expect(cardKey(sample)).toBe("Unit\0hola\0привет")
  })

  it("records and upserts mistakes", () => {
    recordMistake(sample)
    recordMistake(sample)

    const [item] = loadMistakes()
    expect(mistakeCount()).toBe(1)
    expect(item.missCount).toBe(2)
    expect(item.translation).toBe("приветствие")
  })

  it("removes mistake by card identity", () => {
    recordMistake(sample)
    removeMistake(sample)
    expect(mistakeCount()).toBe(0)
    expect(localStorage.getItem(MISTAKES_STORAGE_KEY)).toBeNull()
  })

  it("builds shuffled queue from stored mistakes", () => {
    recordMistake(sample)
    recordMistake({
      ...sample,
      front: "casa",
      back: "дом"
    })

    const queue = buildMistakesQueue()
    expect(queue).toHaveLength(2)
    expect(queue.every((q) => q.section === "")).toBe(true)
    expect(queue.map((q) => q.front).sort()).toEqual(["casa", "hola"])
  })

  it("clears all mistakes", () => {
    recordMistake(sample)
    clearMistakes()
    expect(loadMistakes()).toEqual([])
  })
})
