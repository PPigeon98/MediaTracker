<script setup lang="ts">
  import { ref, onMounted, watch, nextTick } from 'vue'
  import { useFieldModel } from '../composables/useFieldModel'

  const { modelValue } = defineProps<{
    placeholder?: string
    modelValue?: string | number
    border?: boolean
  }>()

  const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
  }>()

  const textareaRef = ref<HTMLTextAreaElement | null>(null)

  function autoResize() {
    if (textareaRef.value) {
      textareaRef.value.style.height = 'var(--font-size-text-small)'
      textareaRef.value.style.height = `${textareaRef.value.scrollHeight}px`
    }
  }

  const { onInput } = useFieldModel<string>(emit)

  onMounted(() => {
    nextTick(() => {
      autoResize()
    })
  })

  watch(() => modelValue, () => {
    nextTick(() => {
      autoResize()
    })
  })
</script>

<template>
  <textarea
    ref="textareaRef"
    :placeholder="placeholder"
    :value="modelValue"
    @input="onInput"
    :class="['input', border ? 'input-bordered' : 'input-underline']"
  />
</template>

<style scoped>
  .input {
    background-color: var(--colour-transparent);
    color: var(--colour-base-content);
    min-height: var(--font-size-text-small);
    overflow: hidden;
    overflow-wrap: break-word;
    resize: none;
    white-space: pre-wrap;
    width: 100%;
    word-wrap: break-word;
  }

  .input-bordered {
    border: var(--border) solid var(--colour-primary);
    border-radius: var(--radius-input);
    padding: var(--spacing-select-padding);
  }

  .input-underline {
    border: none;
    border-bottom: var(--border) solid var(--colour-primary);
  }

  .input::placeholder {
    color: var(--colour-neutral);
  }
</style>
