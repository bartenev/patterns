export interface Card {
  a: string
  b: string
  note: string
}

export type CardTuple = [string?, string?, string?]

export interface CardObject {
  a?: string
  prompt?: string
  b?: string
  answer?: string
  note?: string
}

export type CardRaw = CardTuple | CardObject

export interface Block {
  title: string
  mode: string
  cards: Card[]
}

export interface BlockJson {
  title?: string
  mode?: string
  cards?: CardRaw[]
}

export interface DeckJson {
  unit?: string
  title?: string
  mode?: string
  blocks?: BlockJson[]
  cards?: CardRaw[]
}

export type DeckJsonInput = DeckJson | CardRaw[]

export interface Deck {
  name: string
  blocks: Block[]
  on: boolean
  fileName: string
}

export interface QueueItem extends Card {
  deck: string
  section: string
  mode: string
}

export type OrderMode =
  | "straight"
  | "shuffleCards"
  | "shuffleBlocks"
  | "shuffleAll"

export type DirMode = "auto" | "ru" | "es"

export type AppView = "setup" | "drill" | "done"

export interface SideView {
  prompt: string
  answer: string
  side: string
  spanish: string
}

export interface LoadDecksResult {
  decks: Deck[]
  bad: string[]
}
