export function useFieldModel<T = string>(emit: (event: 'update:modelValue', value: T) => void) {
  function onInput(event: Event) {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement
    emit('update:modelValue', target.value as T)
  }

  function onChange(event: Event) {
    const target = event.target as HTMLSelectElement
    emit('update:modelValue', target.value as T)
  }

  return { onInput, onChange }
}

