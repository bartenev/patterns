import type {
  Block,
  Card,
  CardRaw,
  Deck,
  DeckJsonInput,
  DirMode,
  OrderMode,
  QueueItem,
  SideView
} from "../types"

export function normalizeCard(c: CardRaw): Card | null {
  if (!c || typeof c !== "object") return null

  const front = (c.front || "").trim()
  const back = (c.back || "").trim()
  if (!front || !back) return null

  return {
    front,
    back,
    translation: (c.translation || "").trim(),
    note: (c.note || "").trim()
  }
}

export function parseDeck(obj: DeckJsonInput, fallbackName: string): Deck | null {
  let name = fallbackName
  let blocks: Block[] = []

  if (obj && typeof obj === "object") {
    name = obj.unit || obj.title || fallbackName
    if (Array.isArray(obj.blocks)) {
      blocks = obj.blocks
        .map((bl) => ({
          title: (bl.title || "").trim(),
          mode: bl.mode || "auto",
          cards: (Array.isArray(bl.cards) ? bl.cards : [])
            .map(normalizeCard)
            .filter((c): c is Card => Boolean(c))
        }))
        .filter((bl) => bl.cards.length > 0)
    } else if (Array.isArray(obj.cards)) {
      blocks = [{
        title: "",
        mode: obj.mode || "auto",
        cards: obj.cards.map(normalizeCard).filter((c): c is Card => Boolean(c))
      }]
    }
  }

  blocks = blocks.filter((bl) => bl.cards.length > 0)
  const count = blocks.reduce((s, b) => s + b.cards.length, 0)
  return count ? { name, blocks, on: false, fileName: "" } : null
}

export function cleanName(fn: string): string {
  return fn.replace(/\.json$/i, "")
}

export function deckCount(d: Deck): number {
  return d.blocks.reduce((s, b) => s + b.cards.length, 0)
}

export function shuffle<T>(a: T[]): T[] {
  const arr = [...a]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function blockToItems(deck: Deck, block: Block): QueueItem[] {
  return block.cards.map((c) => ({
    ...c,
    deck: deck.name,
    section: block.title || "",
    mode: block.mode || "auto"
  }))
}

export function buildQueue(selectedDecks: Deck[], order: OrderMode): QueueItem[] {
  if (order === "shuffleAll") {
    const items: QueueItem[] = []
    selectedDecks.forEach((d) => {
      d.blocks.forEach((bl) => items.push(...blockToItems(d, bl)))
    })
    return shuffle(items).map((it) => ({ ...it, section: "" }))
  }

  const out: QueueItem[] = []

  selectedDecks.forEach((d) => {
    const blocks = order === "shuffleBlocks" ? shuffle([...d.blocks]) : d.blocks

    blocks.forEach((bl) => {
      const chunk = blockToItems(d, bl)
      out.push(...(order === "straight" ? chunk : shuffle(chunk)))
    })
  })

  return out
}

export function sideFor(card: QueueItem, dirMode: DirMode): SideView {
  let mode: DirMode | "es-fwd" = dirMode
  if (mode === "auto") {
    mode = (card.mode === "vocab" || card.mode === "ru") ? "ru" : "es-fwd"
  }

  const translation = card.translation

  if (mode === "ru") {
    return {
      prompt: card.front,
      answer: card.back,
      side: "подсказка",
      spanish: card.back,
      translation
    }
  }
  if (mode === "es") {
    const isVocab = card.mode === "vocab" || card.mode === "ru"
    return {
      prompt: card.back,
      answer: card.front,
      side: "español",
      spanish: isVocab ? "" : card.front,
      translation
    }
  }
  return {
    prompt: card.front,
    answer: card.back,
    side: "форма",
    spanish: card.back,
    translation
  }
}
