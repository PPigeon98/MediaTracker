<script setup lang="ts">
  import { type progress, getProgressTypeLabel } from '../utils/types'

  import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type ComponentPublicInstance } from 'vue'

  const props = defineProps<{
    progress: progress[]
  }>()

  const visibleProgressRows = computed(() => props.progress.filter(p => p.hiddenInCard !== true))
  const progressTextElements = ref<HTMLElement[]>([])
  const overflowingRows = ref<boolean[]>([])

  function setProgressTextElement(el: Element | ComponentPublicInstance | null, index: number) {
    if (!el) return

    if (el instanceof HTMLElement) {
      progressTextElements.value[index] = el
      return
    }

    if ('$el' in el && el.$el instanceof HTMLElement) {
      progressTextElements.value[index] = el.$el
    }
  }

  async function updateOverflowState() {
    await nextTick()
    overflowingRows.value = visibleProgressRows.value.map((_, index) => {
      const el = progressTextElements.value[index]
      if (!el) return false
      return el.scrollWidth > el.clientWidth + 1
    })
  }

  function getProgressOverflowClass(index: number) {
    return {
      'progressText-overflow': overflowingRows.value[index] === true
    }
  }

  function getProgressTextClasses(index: number, total: number) {
    return {
      'progressText-bottom': index === total - 1
    }
  }

  function getProgressBarClasses(current: number, max: number) {
    return {
      'progressBar-rounded': current < max
    }
  }

  function getProgressTextInvertedClasses(index: number, total: number) {
    return {
      'progressTextInverted-bottom': index === total - 1,
      ...getProgressOverflowClass(index)
    }
  }

  function handleResize() {
    updateOverflowState()
  }

  onMounted(async () => {
    await updateOverflowState()
    window.addEventListener('resize', handleResize)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize)
  })

  watch(visibleProgressRows, async () => {
    progressTextElements.value = []
    await updateOverflowState()
  }, { deep: true })
</script>

<template>
  <div v-for="(prog, index) in visibleProgressRows" :key="index" class="progressContainer">
    <p
      class="progressText"
      :class="[getProgressTextClasses(index, visibleProgressRows.length), getProgressOverflowClass(index)]"
      :ref="(el) => setProgressTextElement(el, index)"
    >
      <span class="progressTextLabel">
        {{ prog.current }} out of {{ prog.max }} {{ getProgressTypeLabel(prog.type, true) }}
      </span>
    </p>
    <div class="progressBar"
      :style="{ width: `${prog.current / prog.max * 100}%` }"
      :class="getProgressBarClasses(prog.current, prog.max)">
      <p class="progressTextInverted" :class="getProgressTextInvertedClasses(index, visibleProgressRows.length)">
        <span class="progressTextInvertedLabel">
          {{ prog.current }} out of {{ prog.max }} {{ getProgressTypeLabel(prog.type, true) }}
        </span>
      </p>
    </div>
  </div>
</template>

<style scoped>
  .progressBar {
    height: 100%;
    left: 0;
    overflow: hidden;
    position: absolute;
    top: 0;
  }

  .progressBar-rounded {
    border-radius: 0 var(--radius-card) var(--radius-card) 0;
  }

  .progressContainer {
    height: var(--gap-section);
    margin: 0 auto;
    position: relative;
    width: var(--size-card-width);
  }

  .progressText {
    align-items: center;
    border: var(--border) solid var(--colour-base-content);
    box-sizing: border-box;
    color: var(--colour-base-content);
    display: flex;
    font-size: var(--font-size-text-small);
    font-weight: bold;
    height: 100%;
    justify-content: center;
    left: 0;
    overflow: hidden;
    position: absolute;
    top: 0;
    width: 100%;
    z-index: 1;
  }

  .progressTextLabel,
  .progressTextInvertedLabel {
    box-sizing: border-box;
    color: inherit;
    display: block;
    overflow: hidden;
    padding: 0 calc(var(--gap-section) * 0.7);
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 100%;
  }

  .progressTextInvertedLabel {
    color: var(--colour-primary-content) !important;
  }

  .progressText:not(.progressText-overflow) .progressTextLabel,
  .progressTextInverted:not(.progressText-overflow) .progressTextInvertedLabel {
    text-align: center;
  }

  .progressText.progressText-overflow .progressTextLabel,
  .progressTextInverted.progressText-overflow .progressTextInvertedLabel {
    text-align: left;
  }

  .progressText-bottom {
    border-radius: 0 0 var(--radius-card) var(--radius-card);
  }

  .progressTextInverted {
    align-items: center;
    background-color: var(--colour-primary);
    border: var(--border) solid var(--colour-base-content);
    box-sizing: border-box;
    color: var(--colour-primary-content);
    display: flex;
    font-size: var(--font-size-text-small);
    font-weight: bold;
    height: 100%;
    justify-content: center;
    left: 0;
    overflow: hidden;
    position: absolute;
    top: 0;
    width: var(--size-card-width);
    z-index: 2;
  }

  .progressTextInverted-bottom {
    border-radius: 0 0 var(--radius-card) var(--radius-card);
  }

  @media (max-width: 40rem) {
    .progressContainer {
      --progress-row-h: max(var(--gap-section), calc(var(--font-size-text-small) * 1.35));
      height: var(--progress-row-h);
      --progress-corner-r: min(
        max(0px, calc(4 * var(--progress-row-h) / 2 - var(--border)))
      );
    }

    .progressText,
    .progressTextInverted {
      font-size: calc(var(--font-size-text-small) * 0.82);
    }

    .progressText-bottom,
    .progressTextInverted-bottom {
      border-bottom-left-radius: var(--progress-corner-r);
      border-bottom-right-radius: var(--progress-corner-r);
    }

    .progressBar-rounded {
      border-top-right-radius: var(--progress-corner-r);
      border-bottom-right-radius: var(--progress-corner-r);
    }
  }
</style>
