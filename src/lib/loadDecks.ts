import type { DeckJsonInput, LoadDecksResult } from "../types"
import { cleanName, parseDeck } from "./patrones"

const modules = import.meta.glob<DeckJsonInput>("../../decks/*.json", {
  eager: true,
  import: "default"
})

export function loadDecksFromFolder(): LoadDecksResult {
  const decks: LoadDecksResult["decks"] = []
  const bad: string[] = []

  const entries = Object.entries(modules).sort(([a], [b]) => a.localeCompare(b, "ru"))

  for (const [path, data] of entries) {
    const fileName = path.split("/").pop() ?? path
    const deck = parseDeck(data, cleanName(fileName))
    if (deck) {
      deck.fileName = fileName
      deck.on = false
      decks.push(deck)
    } else {
      bad.push(fileName)
    }
  }

  return { decks, bad }
}
