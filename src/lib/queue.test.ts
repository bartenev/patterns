import { describe, expect, it } from "vitest"
import { dequeue } from "./queue"

describe("dequeue", () => {
  it("returns null for empty queue", () => {
    expect(dequeue([])).toEqual({ item: null, rest: [] })
  })

  it("returns first item and rest", () => {
    expect(dequeue(["a", "b"])).toEqual({ item: "a", rest: ["b"] })
  })

  it("returns null item when head is empty slot", () => {
    expect(dequeue([undefined as unknown as string])).toEqual({
      item: null,
      rest: []
    })
  })
})
