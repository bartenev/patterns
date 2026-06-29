<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue"
import {
  buildQueue,
  cleanName,
  deckCount,
  parseDeck,
  sideFor
} from "./lib/patrones.js"

const decks = ref([])
const view = ref("setup")
const queue = ref([])
const cur = ref(null)
const total = ref(0)
const missed = ref(0)
const missesRequeued = ref(0)
const revealed = ref(false)
const dirMode = ref("auto")
const requeue = ref(true)
const curSection = ref(null)
const order = ref("file")
const autospeak = ref(false)
const loadErr = ref("")
const isDark = ref(false)
const dropOver = ref(false)
const esVoice = ref(null)

const cardSide = ref("")
const cardPrompt = ref("")
const cardAnswer = ref("")
const cardTag = ref("")
const cardNote = ref("")
const spanishText = ref("")

const orderOptions = [
  { value: "file", title: "Прямой порядок", desc: "как в файле — блоками, с разделителями. Для постановки навыка." },
  { value: "shuffleBlocks", title: "Перемешать внутри блоков", desc: "порядок блоков сохраняется, карточки внутри каждого — вперемешку." },
  { value: "shuffleAll", title: "Перемешать всё", desc: "все карточки из всех блоков в один случайный поток. Экзамен на выбор." }
]

const dirOptions = [
  { value: "auto", label: "по блоку" },
  { value: "ru", label: "RU → ES" },
  { value: "es", label: "ES → RU" }
]

const selectedDecks = computed(() => decks.value.filter((d) => d.on))
const totalSelected = computed(() => selectedDecks.value.reduce((s, d) => s + deckCount(d), 0))
const startDisabled = computed(() => totalSelected.value === 0)
const startLabel = computed(() =>
  totalSelected.value
    ? `Начать прогон → ${totalSelected.value} пар`
    : "Выбери хотя бы одну колоду"
)

const showSecbar = computed(() => Boolean(curSection.value))
const fillWidth = computed(() => {
  const denom = total.value + missesRequeued.value
  const done = denom - (queue.value.length + 1)
  return denom ? `${Math.max(0, (done / denom) * 100)}%` : "0%"
})
const leftCount = computed(() => queue.value.length + 1)

const doneText = computed(() =>
  missed.value === 0
    ? `Все ${total.value} без запинки. Чисто.`
    : `Пройдено ${total.value} пар · споткнулся ${missed.value} раз. Прогони ошибки ещё раз — закрепится.`
)

function addDeck(d) {
  const ex = decks.value.findIndex((x) => x.name === d.name)
  if (ex >= 0) decks.value[ex] = d
  else decks.value.push(d)
}

function finishLoad(bad) {
  loadErr.value = bad.length
    ? `Не удалось разобрать: ${bad.join(", ")} — проверь, что это валидный JSON нужной структуры.`
    : ""
}

function handleFiles(files) {
  const arr = [...files]
  let pending = arr.length
  const bad = []
  if (!pending) return

  arr.forEach((f) => {
    const r = new FileReader()
    r.onload = (e) => {
      try {
        const obj = JSON.parse(e.target.result)
        const d = parseDeck(obj, cleanName(f.name))
        if (d) addDeck(d)
        else bad.push(f.name)
      } catch {
        bad.push(f.name)
      }
      if (--pending === 0) finishLoad(bad)
    }
    r.onerror = () => {
      bad.push(f.name)
      if (--pending === 0) finishLoad(bad)
    }
    r.readAsText(f)
  })
}

function onFileInput(e) {
  handleFiles(e.target.files)
  e.target.value = ""
}

function onDrop(e) {
  e.preventDefault()
  dropOver.value = false
  handleFiles(e.dataTransfer.files)
}

function onDragOver(e) {
  e.preventDefault()
  dropOver.value = true
}

function onDragLeave(e) {
  e.preventDefault()
  dropOver.value = false
}

function toggleDeck(deck, on) {
  deck.on = on
}

function removeDeck(index) {
  decks.value.splice(index, 1)
}

function selectAll(on) {
  decks.value.forEach((d) => { d.on = on })
}

function pickVoice() {
  if (!("speechSynthesis" in window)) return
  const vs = speechSynthesis.getVoices()
  esVoice.value = vs.find((v) => /es-ES/i.test(v.lang)) || vs.find((v) => /^es/i.test(v.lang)) || null
}

function speak(text) {
  if (!("speechSynthesis" in window) || !text) return
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = "es-ES"
  if (esVoice.value) u.voice = esVoice.value
  u.rate = 0.95
  speechSynthesis.speak(u)
}

function applyCardView() {
  const v = sideFor(cur.value, dirMode.value)
  spanishText.value = v.spanish
  cardSide.value = v.side
  cardPrompt.value = v.prompt
  cardAnswer.value = v.answer
  cardTag.value = cur.value.deck || ""
  cardNote.value = cur.value.note || ""
}

function next() {
  if (!queue.value.length) {
    finish()
    return
  }

  cur.value = queue.value.shift()
  revealed.value = false

  if (cur.value.section && cur.value.section !== curSection.value) {
    curSection.value = cur.value.section
  } else if (!cur.value.section) {
    curSection.value = null
  }

  applyCardView()
}

function startCards() {
  queue.value = buildQueue(selectedDecks.value, order.value)
  total.value = queue.value.length
  missed.value = 0
  missesRequeued.value = 0
  curSection.value = null
  if (!total.value) return
  view.value = "drill"
  next()
}

function reveal() {
  if (revealed.value) return
  revealed.value = true
  if (autospeak.value) speak(spanishText.value)
}

function rate(knew) {
  if (!revealed.value) return
  if (!knew) {
    missed.value++
    missesRequeued.value++
    if (requeue.value) {
      queue.value.push({ ...cur.value, section: "" })
    }
  }
  next()
}

function finish() {
  view.value = "done"
}

function quitDrill() {
  view.value = "setup"
}

function toggleTheme() {
  isDark.value = !isDark.value
  document.documentElement.setAttribute("data-theme", isDark.value ? "dark" : "light")
}

function onKeydown(e) {
  if (view.value !== "drill") return
  if (e.code === "Space" || e.code === "Enter") {
    e.preventDefault()
    if (!revealed.value) reveal()
  } else if (e.key === "ArrowRight" || e.key === "2") {
    if (revealed.value) {
      e.preventDefault()
      rate(true)
    }
  } else if (e.key === "ArrowLeft" || e.key === "1") {
    if (revealed.value) {
      e.preventDefault()
      rate(false)
    }
  } else if (e.key.toLowerCase() === "s") {
    speak(spanishText.value)
  } else if (e.key === "Escape") {
    quitDrill()
  }
}

onMounted(() => {
  pickVoice()
  if ("speechSynthesis" in window) {
    speechSynthesis.onvoiceschanged = pickVoice
  }
  document.addEventListener("keydown", onKeydown)
})

onUnmounted(() => {
  document.removeEventListener("keydown", onKeydown)
})
</script>

<template>
  <header>
    <span class="tile" aria-hidden="true" />
    <span class="brand">
      <b>Patrones</b>
      <span>паттерн-тренажёр</span>
    </span>
    <button class="ghost" type="button" title="Тема" @click="toggleTheme">
      {{ isDark ? "☀ Тема" : "☾ Тема" }}
    </button>
  </header>

  <main>
    <section v-show="view === 'setup'" class="wrap">
      <p class="lead">
        Брось сюда файлы паттернов в формате <code>.json</code> — по одному на юнит.
        Каждый файл хранит блоки (правило, типы исключений, лексика), а внутри блока — пары карточек.
        Выбери юниты галочками, режим порядка — и запускай.
      </p>

      <div
        class="drop"
        :class="{ over: dropOver }"
        @dragenter.prevent="dropOver = true"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
        @drop="onDrop"
      >
        <h3>Перетащи .json или выбери вручную</h3>
        <p>Несколько сразу — каждый станет отдельной колодой</p>
        <label class="file-btn">
          Выбрать файлы
          <input type="file" accept=".json,application/json" multiple hidden @change="onFileInput">
        </label>
        <div v-if="loadErr" class="err">{{ loadErr }}</div>
      </div>

      <div v-if="decks.length">
        <div class="deck-head">
          <h2>Колоды</h2>
          <div class="tools">
            <button class="mini" type="button" @click="selectAll(true)">все</button>
            <button class="mini" type="button" @click="selectAll(false)">снять</button>
          </div>
        </div>
        <ul class="decks">
          <li
            v-for="(deck, i) in decks"
            :key="deck.name + i"
            class="deck"
            :class="{ on: deck.on }"
          >
            <input
              type="checkbox"
              :checked="deck.on"
              @change="toggleDeck(deck, $event.target.checked)"
            >
            <span class="nm">{{ deck.name }}</span>
            <span class="ct">{{ deckCount(deck) }} · {{ deck.blocks.length }} бл.</span>
            <button class="x" type="button" title="убрать" @click="removeDeck(i)">✕</button>
          </li>
        </ul>

        <div class="block">
          <h3>Порядок карточек</h3>
          <div class="radio">
            <label
              v-for="opt in orderOptions"
              :key="opt.value"
              :class="{ on: order === opt.value }"
            >
              <input v-model="order" type="radio" name="order" :value="opt.value">
              <span>
                <span class="t">{{ opt.title }}</span>
                <span class="d">{{ opt.desc }}</span>
              </span>
            </label>
          </div>
        </div>

        <div class="opts">
          <div class="seg">
            <button
              v-for="opt in dirOptions"
              :key="opt.value"
              type="button"
              :class="{ on: dirMode === opt.value }"
              @click="dirMode = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
          <label class="chk">
            <input v-model="autospeak" type="checkbox"> озвучивать ответ
          </label>
          <label class="chk">
            <input v-model="requeue" type="checkbox"> повторять ошибки
          </label>
        </div>

        <button class="start" type="button" :disabled="startDisabled" @click="startCards">
          {{ startLabel }}
        </button>
      </div>
    </section>

    <section v-show="view === 'drill'" class="wrap">
      <div class="bar">
        <button class="ghost" type="button" @click="quitDrill">‹ выход</button>
        <div class="track">
          <div class="fill" :style="{ width: fillWidth }" />
        </div>
        <span>осталось <b>{{ leftCount }}</b></span>
        <span class="miss">споткнулся <b style="color: inherit">{{ missed }}</b></span>
      </div>

      <div v-if="showSecbar" class="secbar">
        <span>{{ curSection }}</span>
        <span class="ln" />
      </div>

      <div class="card">
        <span class="tag">{{ cardTag }}</span>
        <div class="side">{{ cardSide }}</div>
        <div class="prompt">{{ cardPrompt }}</div>
        <div v-if="revealed" class="answer">{{ cardAnswer }}</div>
        <div v-if="revealed && cardNote" class="note">{{ cardNote }}</div>
        <button
          v-if="revealed"
          class="spk"
          type="button"
          @click="speak(spanishText)"
        >
          🔊 произнести
        </button>
      </div>

      <div v-if="!revealed" class="controls">
        <button class="reveal" type="button" @click="reveal">Показать ответ</button>
      </div>
      <div v-else class="controls">
        <button class="missed" type="button" @click="rate(false)">Споткнулся</button>
        <button class="knew" type="button" @click="rate(true)">Знал</button>
      </div>

      <div class="hint">
        <kbd>Пробел</kbd> показать ответ · <kbd>←</kbd> споткнулся · <kbd>→</kbd> знал · <kbd>S</kbd> озвучить · <kbd>Esc</kbd> выход
      </div>
    </section>

    <section v-show="view === 'done'" class="wrap">
      <div class="done">
        <h2>¡Listo!</h2>
        <p>{{ doneText }}</p>
        <div class="row">
          <button class="file-btn" type="button" @click="startCards">Прогнать ещё раз</button>
          <button class="ghost" type="button" @click="view = 'setup'">К выбору колод</button>
        </div>
      </div>
    </section>
  </main>

  <footer>Работает офлайн · ничего не отправляется в сеть · паттерны хранятся только в выбранных файлах</footer>
</template>
