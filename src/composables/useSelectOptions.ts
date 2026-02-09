import { computed } from 'vue'
import { getNumericEnumValues } from '../utils/types'

export function useSelectOptions<T extends Record<string | number, string | number>>(
  enumObject: T,
  labels: Record<number, string>
) {
  const options = getNumericEnumValues(enumObject) as number[]

  const selectOptions = computed(() => 
    options.map(opt => ({ value: opt, label: labels[opt] }))
  )

  return {
    selectOptions,
  }
}

