<script setup lang="ts">
  import { type SelectOption } from '../utils/types'
  import { useFieldModel } from '../composables/useFieldModel'

  defineProps<{
    options: Array<string | SelectOption>
    modelValue?: string | number
  }>()

  const emit = defineEmits<{
    (e: 'update:modelValue', value: string | number): void
  }>()

  const { onChange } = useFieldModel<string | number>(emit)

  function getOptionValue(option: string | SelectOption): string | number {
    return typeof option === 'string' ? option : option.value
  }

  function getOptionLabel(option: string | SelectOption): string {
    return typeof option === 'string' ? option : option.label
  }
</script>

<template>
  <select class="select" :value="modelValue" @change="onChange">
    <option v-for="option in options" :key="getOptionValue(option)" :value="getOptionValue(option)">
      {{ getOptionLabel(option) }}
    </option>
  </select>
</template>

<style scoped>
  .select {
    background-color: var(--colour-transparent);
    border: var(--border) solid var(--colour-primary);
    border-radius: var(--radius-input);
    color: var(--colour-base-content);
    min-height: var(--font-size-text-small);
    padding: var(--spacing-select-padding);
    width: 100%;
  }

  .select option {
    background-color: var(--colour-base-100);
    color: var(--colour-base-content);
    padding: var(--spacing-select-padding);
  }

  .select option:hover,
  .select option:checked {
    background-color: var(--colour-primary);
    color: var(--colour-primary-content);
  }
</style>
