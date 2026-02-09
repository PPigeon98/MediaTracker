<script setup lang="ts">
  import { useFieldModel } from '../composables/useFieldModel'

  defineProps<{
    placeholder?: string
    modelValue?: string | number
    type?: string
  }>()

  const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
  }>()

  const { onInput } = useFieldModel<string>(emit)
</script>

<template>
  <input
    :type="type"
    :placeholder="placeholder"
    :value="modelValue"
    @input="onInput"
    class="input"
  />
</template>

<style scoped>
  .input {
    background-color: var(--colour-transparent);
    border: var(--border) solid var(--colour-primary);
    border-radius: var(--radius-input);
    color: var(--colour-base-content);
    min-height: var(--font-size-text-small);
    min-width: max-content;
    padding: var(--spacing-select-padding);
    width: 100%;
  }

  .input::placeholder {
    color: var(--colour-neutral);
  }
</style>
