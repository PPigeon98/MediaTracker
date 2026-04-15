<script setup lang="ts">
  import { computed } from 'vue'
  import { progressType, type progress, progressTypeLabels, isBuiltInProgressType } from '../utils/types'
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

  function toggleCardVisibility(index: number) {
    const newProgress = [...modelValue]
    const currentProgress = { ...newProgress[index] }
    currentProgress.hiddenInCard = !(currentProgress.hiddenInCard === true)
    newProgress[index] = currentProgress
    emit('update:modelValue', newProgress)
  }

  function toNonNegativeNumber(value: unknown, fallback = 0) {
    const num = typeof value === 'number' ? value : Number(value)
    if (!Number.isFinite(num)) return fallback
    return Math.max(0, num)
  }

  const CUSTOM_PROGRESS_TYPE_VALUE = '__custom__'
  const { selectOptions: builtInProgressTypeOptions } = useSelectOptions(progressType, progressTypeLabels)
  const progressTypeSelectOptions = computed(() => [
    ...builtInProgressTypeOptions.value,
    { value: CUSTOM_PROGRESS_TYPE_VALUE, label: '+' },
  ])

  function isCustomType(value: progress['type']): boolean {
    return !isBuiltInProgressType(value)
  }

  function updateProgress(index: number, field: 'current' | 'max' | 'type', value: number | string | progressType) {
    const newProgress = [...modelValue]
    const currentProgress = { ...newProgress[index] }

    if (field === 'current') {
      const safeMax = toNonNegativeNumber(currentProgress.max)
      const nextCurrent = toNonNegativeNumber(value)
      currentProgress.max = safeMax
      currentProgress.current = Math.min(nextCurrent, safeMax)
    } else if (field === 'max') {
      const nextMax = toNonNegativeNumber(value)
      currentProgress.max = nextMax
      currentProgress.current = Math.min(toNonNegativeNumber(currentProgress.current), nextMax)
    } else {
      if (value === CUSTOM_PROGRESS_TYPE_VALUE) {
        currentProgress.type = ''
      } else if (isCustomType(currentProgress.type)) {
        currentProgress.type = String(value)
      } else {
        currentProgress.type = Number(value) as progressType
      }
    }

    newProgress[index] = currentProgress
    emit('update:modelValue', newProgress)
  }
</script>

<template>
  <div>
    <h1>Progress</h1>
    <div v-for="(prog, index) in modelValue" :key="index" class="progressItem">
      <BaseButton
        text=""
        :icon="prog.hiddenInCard ? 'visibility_off_rounded' : 'remove_red_eye_rounded'"
        :aria-label="prog.hiddenInCard ? 'Show on cards' : 'Hide on cards'"
        @click="toggleCardVisibility(index)"
        class="toggleVisibilityButton mauveIconButton"
      />
      <BaseTextInput
        type="number"
        min="0"
        :max="prog.max"
        :model-value="prog.current"
        @update:model-value="(val) => updateProgress(index, 'current', val)"
        class="progressField"
      />
      out of
      <BaseTextInput
        type="number"
        min="0"
        :model-value="prog.max"
        @update:model-value="(val) => updateProgress(index, 'max', val)"
        class="progressField"
      />
      <BaseTextInput
        v-if="isCustomType(prog.type)"
        type="text"
        placeholder="Progress type"
        :model-value="String(prog.type ?? '')"
        @update:model-value="(val) => updateProgress(index, 'type', String(val))"
        class="typeField customTypeField"
      />
      <BaseSelect
        v-else
        :options="progressTypeSelectOptions"
        :model-value="prog.type"
        @update:model-value="(val) => updateProgress(index, 'type', val as string)"
        class="typeField"
      />
      <BaseButton text="" icon="delete" aria-label="Remove progress" @click="removeProgress(index)" class="removeProgressButton mauveIconButton" />
    </div>
    <BaseButton text="Add Progress" @click="addProgress()" class="addProgressButton" />
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

  .customTypeField {
    flex: 0 0 7rem;
    max-width: 7rem;
    min-width: 0;
    width: 5rem;
  }

  .customTypeField :deep(.input) {
    min-width: 0;
    width: 100%;
  }

  .removeProgressButton {
    height: var(--spacing-button-small);
    padding: 0;
    width: 10vw;
    height: 2.5vw;
  }

  .toggleVisibilityButton {
    height: var(--spacing-button-small);
    padding: 0;
    width: 10vw;
    height: 2.5vw;
  }

  .mauveIconButton :deep(svg),
  .mauveIconButton :deep(.button),
  .mauveIconButton :deep(.icon),
  .mauveIconButton :deep(path),
  .mauveIconButton :deep(circle),
  .mauveIconButton :deep(rect),
  .mauveIconButton :deep(polygon),
  .mauveIconButton :deep(polyline),
  .mauveIconButton :deep(line) {
    color: var(--colour-primary) !important;
    fill: var(--colour-primary) !important;
  }

  .mauveIconButton:hover :deep(svg),
  .mauveIconButton:hover :deep(.button),
  .mauveIconButton:hover :deep(.icon),
  .mauveIconButton:hover :deep(path),
  .mauveIconButton:hover :deep(circle),
  .mauveIconButton:hover :deep(rect),
  .mauveIconButton:hover :deep(polygon),
  .mauveIconButton:hover :deep(polyline),
  .mauveIconButton:hover :deep(line) {
    color: var(--colour-base-100) !important;
    fill: var(--colour-base-100) !important;
  }

  .addProgressButton {
    width: 100%;
  }

  @media (max-width: 40rem) {
    .progressItem {
      flex-wrap: nowrap;
      gap: calc(var(--gap-section) / 5);
    }

    .progressField,
    .typeField {
      flex: 1 1 0;
      min-width: 0;
    }

    .progressItem > span,
    .progressItem {
      font-size: calc(var(--font-size-body) * 0.92);
    }

    .progressField {
      max-width: 4.8rem;
    }

    .typeField {
      max-width: 7.2rem;
    }

    .removeProgressButton,
    .toggleVisibilityButton {
      width: 3.5vw;
      height: 3.5vw;
      padding: 0;
      min-width: 1.9rem;
      min-height: 1.9rem;
    }
  }
</style>
