<script setup lang="ts">
  import { type progress, progressTypeLabelsLowercase } from '../utils/types'

  defineProps<{
    progress: progress[]
  }>()

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
      'progressTextInverted-bottom': index === total - 1
    }
  }
</script>

<template>
  <div v-for="(prog, index) in progress" :key="index" class="progressContainer">
    <p class="progressText" :class="getProgressTextClasses(index, progress.length)">{{ prog.current }} out of {{ prog.max }} {{ progressTypeLabelsLowercase[prog.type] }}</p>
    <div class="progressBar"
      :style="{ width: `${prog.current / prog.max * 100}%` }"
      :class="getProgressBarClasses(prog.current, prog.max)">
      <p class="progressTextInverted" :class="getProgressTextInvertedClasses(index, progress.length)">{{ prog.current }} out of {{ prog.max }} {{ progressTypeLabelsLowercase[prog.type] }}</p>
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
    position: absolute;
    top: 0;
    width: 100%;
    z-index: 1;
  }

  .progressText-bottom {
    border-radius: 0 0 var(--radius-card) var(--radius-card);
  }

  .progressTextInverted {
    align-items: center;
    background-color: var(--colour-primary);
    border: var(--border) solid var(--colour-base-content);
    box-sizing: border-box;
    color: var(--colour-base-100);
    display: flex;
    font-size: var(--font-size-text-small);
    font-weight: bold;
    height: 100%;
    justify-content: center;
    left: 0;
    position: absolute;
    top: 0;
    width: var(--size-card-width);
    z-index: 2;
  }

  .progressTextInverted-bottom {
    border-radius: 0 0 var(--spacing-button-small) var(--spacing-button-small);
  }
</style>
