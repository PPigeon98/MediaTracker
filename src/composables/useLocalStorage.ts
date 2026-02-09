import { ref, onMounted, watch } from 'vue'

export function useLocalStorage<T>(key: string, defaultValue: T) {
  const storedValue = ref<T>(defaultValue)

  onMounted(() => {
    const saved = localStorage.getItem(key)
    if (saved) {
      try {
        storedValue.value = JSON.parse(saved)
      } catch (e) {
        console.error(`Failed to parse localStorage key "${key}":`, e)
      }
    }
  })

  watch(storedValue, (newValue) => {
    localStorage.setItem(key, JSON.stringify(newValue))
  })

  return storedValue
}

