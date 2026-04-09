<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
  import { type SelectOption } from '../utils/types'

  const props = defineProps<{
    options: Array<string | SelectOption>
    modelValue?: string | number
  }>()

  const emit = defineEmits<{
    (e: 'update:modelValue', value: string | number): void
  }>()

  const isOpen = ref(false)
  const rootEl = ref<HTMLElement | null>(null)
  const menuTop = ref(0)
  const menuLeft = ref(0)
  const menuWidth = ref(0)

  function getOptionValue(option: string | SelectOption): string | number {
    return typeof option === 'string' ? option : option.value
  }

  function getOptionLabel(option: string | SelectOption): string {
    return typeof option === 'string' ? option : option.label
  }

  const selectedLabel = computed(() => {
    const selected = props.options.find((option) => getOptionValue(option) === props.modelValue)
    return selected ? getOptionLabel(selected) : ''
  })

  function toggleOpen() {
    isOpen.value = !isOpen.value
    if (isOpen.value) {
      updateMenuPosition()
    }
  }

  function closeDropdown() {
    isOpen.value = false
  }

  function selectOption(option: string | SelectOption) {
    emit('update:modelValue', getOptionValue(option))
    closeDropdown()
  }

  function handleDocumentClick(event: MouseEvent) {
    if (!rootEl.value) return
    const target = event.target as Node | null
    if (target && !rootEl.value.contains(target)) {
      closeDropdown()
    }
  }

  function handleEscape(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeDropdown()
    }
  }

  function updateMenuPosition() {
    if (!rootEl.value) return
    const rect = rootEl.value.getBoundingClientRect()
    menuTop.value = rect.bottom + 6
    menuLeft.value = rect.left
    menuWidth.value = rect.width
  }

  function handleWindowChange() {
    if (isOpen.value) {
      updateMenuPosition()
    }
  }

  onMounted(() => {
    document.addEventListener('click', handleDocumentClick)
    document.addEventListener('keydown', handleEscape)
    window.addEventListener('resize', handleWindowChange)
    window.addEventListener('scroll', handleWindowChange, true)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('click', handleDocumentClick)
    document.removeEventListener('keydown', handleEscape)
    window.removeEventListener('resize', handleWindowChange)
    window.removeEventListener('scroll', handleWindowChange, true)
  })
</script>

<template>
  <div ref="rootEl" class="selectRoot">
    <button
      type="button"
      class="selectTrigger"
      @click="toggleOpen"
      :aria-expanded="isOpen"
      aria-haspopup="listbox"
    >
      <span class="selectValue">{{ selectedLabel }}</span>
      <span class="selectArrow">▾</span>
    </button>

    <Teleport to="body">
      <div
        v-if="isOpen"
        class="selectMenu"
        role="listbox"
        :style="{ top: `${menuTop}px`, left: `${menuLeft}px`, width: `${menuWidth}px` }"
      >
        <button
          v-for="option in options"
          :key="getOptionValue(option)"
          type="button"
          role="option"
          class="selectOption"
          :class="{ selected: getOptionValue(option) === modelValue }"
          @click="selectOption(option)"
        >
          {{ getOptionLabel(option) }}
        </button>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
  .selectRoot {
    position: relative;
    width: 100%;
  }

  .selectTrigger {
    align-items: center;
    background-color: var(--colour-base-100);
    border: var(--border) solid var(--colour-primary);
    border-radius: var(--radius-input);
    color: var(--colour-base-content);
    cursor: pointer;
    display: flex;
    gap: 0.5rem;
    justify-content: space-between;
    min-height: var(--font-size-text-small);
    padding: var(--spacing-select-padding);
    text-align: left;
    width: 100%;
  }

  .selectValue {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .selectMenu {
    background-color: var(--colour-base-200);
    border: var(--border) solid var(--colour-primary);
    border-radius: var(--radius-input);
    box-shadow: 0 0.35rem 1rem rgba(0, 0, 0, 0.35);
    display: flex;
    flex-direction: column;
    max-height: 14rem;
    overflow-y: auto;
    position: fixed;
    z-index: 100000;
  }

  .selectOption {
    align-items: center;
    background-color: var(--colour-base-100);
    border: none;
    color: var(--colour-base-content);
    cursor: pointer;
    display: flex;
    flex: 0 0 auto;
    font: inherit;
    line-height: 1.2;
    min-height: 2.25rem;
    overflow: hidden;
    padding: var(--spacing-select-padding);
    text-align: left;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 100%;
  }

  .selectOption + .selectOption {
    border-top: 1px solid var(--colour-base-200);
  }

  .selectOption:hover,
  .selectOption:focus-visible {
    background-color: var(--colour-secondary);
  }

  .selectOption.selected,
  .selectOption.selected:hover,
  .selectOption.selected:focus-visible {
    background-color: var(--colour-primary);
    color: var(--colour-primary-content);
  }

  .selectRoot :focus-visible {
    outline: 2px solid var(--colour-accent);
    outline-offset: 2px;
  }

  @media (max-width: 40rem) {
    .selectTrigger {
      font-size: var(--font-size-text-small);
      line-height: 1.45;
      min-height: max(var(--font-size-text-small), var(--min-height-form-control));
    }

    .selectOption {
      line-height: 1.45;
      min-height: max(2.25rem, var(--min-height-form-control));
    }
  }
</style>
