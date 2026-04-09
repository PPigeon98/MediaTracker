import { computed } from 'vue'
import { useLocalStorage } from './useLocalStorage'
import type { Tag } from '../utils/types'

function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase()
}

function normalizeTagList(tags: string[]): Tag[] {
  const unique = new Set<string>()
  for (const tag of tags) {
    const normalized = normalizeTag(tag)
    if (normalized) unique.add(normalized)
  }
  return Array.from(unique)
}

export function useCustomTags() {
  const customTags = useLocalStorage<Tag[]>('customTags', [])

  const sortedCustomTags = computed(() => {
    return [...normalizeTagList(customTags.value)].sort((a, b) => a.localeCompare(b))
  })

  function addTag(tag: string) {
    customTags.value = normalizeTagList([...customTags.value, tag])
  }

  function removeTag(tag: string) {
    const normalized = normalizeTag(tag)
    customTags.value = normalizeTagList(customTags.value.filter(t => normalizeTag(t) !== normalized))
  }

  return {
    customTags,
    sortedCustomTags,
    addTag,
    removeTag,
  }
}
