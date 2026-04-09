import { computed, watch } from 'vue'
import { useLocalStorage } from './useLocalStorage'
import { mediaType, typeVariableNames, mediaTypeLabels } from '../utils/types'

type TypeColorKey = (typeof typeVariableNames)[mediaType]
type TypeColorMap = Record<TypeColorKey, string>

const defaultTypeColors: TypeColorMap = {
  anime: '#cba6f7',
  manga: '#b4befe',
  manhua: '#f5e0dc',
  manhwa: '#f2cdcd',
  lightnovel: '#f38ba8',
  webnovel: '#a6e3a1',
  movie: '#f9e2af',
  series: '#89b4fa',
  novel: '#fab387',
  textbook: '#f5c2e7',
  game: '#74c7ec',
  other: '#bac2de',
}

function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value)
}

function normalizeTypeColors(input: unknown): TypeColorMap {
  const fallback = { ...defaultTypeColors }
  if (!input || typeof input !== 'object') {
    return fallback
  }

  const parsed = input as Partial<Record<TypeColorKey, unknown>>
  for (const key of Object.keys(defaultTypeColors) as TypeColorKey[]) {
    const value = parsed[key]
    if (isHexColor(value)) {
      fallback[key] = value
    }
  }
  return fallback
}

export function useTypeColors() {
  const typeColors = useLocalStorage<TypeColorMap>('typeColors', defaultTypeColors)

  watch(
    typeColors,
    (value) => {
      const normalized = normalizeTypeColors(value)

      const root = document.documentElement
      for (const key of Object.keys(normalized) as TypeColorKey[]) {
        root.style.setProperty(`--colour-${key}`, normalized[key])
      }
    },
    { immediate: true, deep: true }
  )

  const orderedMediaTypes: mediaType[] = [
    mediaType.anime,
    mediaType.manga,
    mediaType.manhua,
    mediaType.manhwa,
    mediaType.lightNovel,
    mediaType.webNovel,
    mediaType.movie,
    mediaType.series,
    mediaType.novel,
    mediaType.textbook,
    mediaType.game,
    mediaType.other,
  ]

  const typeColorOptions = computed(() =>
    orderedMediaTypes.map((type) => ({
      label: mediaTypeLabels[type],
      key: typeVariableNames[type] as TypeColorKey,
    }))
  )

  return {
    typeColors,
    typeColorOptions,
  }
}
