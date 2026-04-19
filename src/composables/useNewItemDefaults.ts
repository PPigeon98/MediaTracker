import { ref, watch } from 'vue'
import { getNumericEnumValues, mediaType, status } from '../utils/types'

const STORAGE_MEDIA = 'defaultNewItemMediaType'
const STORAGE_STATUS = 'defaultNewItemStatus'

const validMedia = new Set(getNumericEnumValues(mediaType))
const validStatus = new Set(getNumericEnumValues(status))

function readStoredEnum(
  key: string,
  fallback: number,
  valid: Set<number>
): number {
  if (typeof localStorage === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    const n = Number(JSON.parse(raw))
    return valid.has(n) ? n : fallback
  } catch {
    return fallback
  }
}

const defaultMediaType = ref<mediaType>(
  readStoredEnum(STORAGE_MEDIA, mediaType.anime, validMedia) as mediaType
)
const defaultStatus = ref<status>(
  readStoredEnum(STORAGE_STATUS, status.tracking, validStatus) as status
)

watch(defaultMediaType, (v) => {
  localStorage.setItem(STORAGE_MEDIA, JSON.stringify(v))
})

watch(defaultStatus, (v) => {
  localStorage.setItem(STORAGE_STATUS, JSON.stringify(v))
})

export function useNewItemDefaults() {
  return {
    defaultMediaType,
    defaultStatus,
  }
}
