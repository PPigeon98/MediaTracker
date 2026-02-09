<script setup lang="ts">
  import { progressType, type progress, progressTypeLabels } from '../utils/types'
  import { useSelectOptions } from '../composables/useSelectOptions'
  import BaseTextInput from './BaseTextInput.vue'
  import BaseSelect from './BaseSelect.vue'
  import BaseButton from './BaseButton.vue'

  const { modelValue } = defineProps<{
    modelValue: progress[]
  }>()

  const emit = defineEmits<{
    (e: 'update:modelValue', value: progress[]): void
  }>()

  function addProgress() {
    const newProgress: progress[] = [...modelValue, { current: 0, max: 1, type: progressType.episode }]
    emit('update:modelValue', newProgress)
  }

  function removeProgress(index: number) {
    const newProgress = modelValue.filter((_, i) => i !== index)
    emit('update:modelValue', newProgress)
  }

  function updateProgress(index: number, field: 'current' | 'max' | 'type', value: number | progressType) {
    const newProgress = [...modelValue]
    newProgress[index] = { ...newProgress[index], [field]: value }
    emit('update:modelValue', newProgress)
  }

  const { selectOptions: progressTypeSelectOptions } = useSelectOptions(progressType, progressTypeLabels)
</script>

<template>
  <div>
    <h1>Progress</h1>
    <div v-for="(prog, index) in modelValue" :key="index" class="progressItem">
      <BaseTextInput
        type="number"
        :model-value="prog.current"
        @update:model-value="(val) => updateProgress(index, 'current', Number(val))"
        class="progressField"
      />
      out of
      <BaseTextInput
        type="number"
        :model-value="prog.max"
        @update:model-value="(val) => updateProgress(index, 'max', Number(val))"
        class="progressField"
      />
      <BaseSelect
        :options="progressTypeSelectOptions"
        :model-value="prog.type"
        @update:model-value="(val) => updateProgress(index, 'type', Number(val) as progressType)"
        class="typeField"
      />
      <BaseButton text="🗑" @click="removeProgress(index)" class="removeProgressButton" />
    </div>
    <BaseButton text="Add Progress" @click="addProgress()" />
  </div>
</template>

<style scoped>
  .progressItem {
    align-items: center;
    display: flex;
    gap: calc(var(--gap-section) / 4);
    margin-bottom: calc(var(--gap-section) / 2);
  }

  .progressField {
    min-width: unset;
  }

  .removeProgressButton {
    height: var(--spacing-button-small);
    padding: 0;
    width: 10vw;
    height: 2.5vw;
  }

  @media (max-width: 40rem) {
    .removeProgressButton {
      width: 20vw;
      height: 5vw;
    }
  }
</style>
