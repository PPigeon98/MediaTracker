<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
  import BaseTextInput from './BaseTextInput.vue'
  import { type SelectOption } from '../utils/types'

  const props = defineProps<{
    modelValue?: string | number
    placeholder?: string
    options: Array<string | SelectOption>
    useLocalFilter?: boolean
  }>()

  const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
    (e: 'select', value: string): void
  }>()

  const rootEl = ref<HTMLElement | null>(null)
  const isOpen = ref(false)

  function getOptionValue(option: string | SelectOption): string {
    return typeof option === 'string' ? option : option.label
  }

  const normalizedOptions = computed(() =>
    props.options
      .map((option) => getOptionValue(option).trim())
      .filter(Boolean)
  )

  const filteredOptions = computed(() => {
    if (props.useLocalFilter === false) {
      return normalizedOptions.value
    }
    const query = String(props.modelValue ?? '').trim().toLowerCase()
    if (!query) return normalizedOptions.value
    return normalizedOptions.value.filter((option) => option.toLowerCase().includes(query))
  })

  function handleInput(value: string) {
    emit('update:modelValue', value)
    isOpen.value = true
  }

  function handleFocus() {
    isOpen.value = true
  }

  function selectOption(option: string) {
    emit('update:modelValue', option)
    emit('select', option)
    isOpen.value = false
  }

  function handleDocumentClick(event: MouseEvent) {
    if (!rootEl.value) return
    const target = event.target as Node | null
    if (target && !rootEl.value.contains(target)) {
      isOpen.value = false
    }
  }

  function handleEscape(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      isOpen.value = false
    }
  }

  onMounted(() => {
    document.addEventListener('click', handleDocumentClick)
    document.addEventListener('keydown', handleEscape)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('click', handleDocumentClick)
    document.removeEventListener('keydown', handleEscape)
  })
</script>

<template>
  <div ref="rootEl" class="textList">
    <BaseTextInput
      :model-value="modelValue"
      :placeholder="placeholder"
      @update:model-value="handleInput"
      @focusin="handleFocus"
    />
    <div v-if="isOpen && filteredOptions.length > 0" class="optionsMenu">
      <button
        v-for="option in filteredOptions"
        :key="option"
        type="button"
        class="optionButton"
        @click="selectOption(option)"
      >
        {{ option }}
      </button>
    </div>
  </div>
</template>

<style scoped>
  .textList {
    display: flex;
    flex-direction: column;
    position: relative;
    width: 100%;
  }

  .optionsMenu {
    background-color: var(--colour-base-200);
    border: var(--border) solid var(--colour-primary);
    border-radius: var(--radius-input);
    box-shadow: 0 0.35rem 1rem rgba(0, 0, 0, 0.35);
    margin-top: 0.35rem;
    max-height: 14rem;
    overflow-y: auto;
    position: relative;
    width: 100%;
    z-index: 1;
  }

  .optionButton {
    background-color: var(--colour-base-100);
    border: none;
    color: var(--colour-base-content);
    cursor: pointer;
    display: block;
    font: inherit;
    padding: var(--spacing-select-padding);
    text-align: left;
    width: 100%;
  }

  .optionButton + .optionButton {
    border-top: 1px solid var(--colour-base-200);
  }

  .optionButton:hover,
  .optionButton:focus-visible {
    background-color: var(--colour-secondary);
    outline: none;
  }
</style>
