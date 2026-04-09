<script setup lang="ts">
  import { mediaType, mediaTypeLabels, typeVariableNames } from '../utils/types'
  import { computed } from 'vue'

  const { type } = defineProps<{
    type: mediaType
  }>()

  const backgroundColor = computed(() => {
    return `var(--colour-${typeVariableNames[type]})`
  })
</script>

<template>
  <div class="typeContainer">
    <div class="typeEar">
      <span class="typeText">{{ mediaTypeLabels[type] }}</span>
    </div>
  </div>
</template>

<style scoped>
  .typeEar {
    align-items: center;
    background-color: v-bind(backgroundColor);
    border-top-left-radius: calc(var(--radius-card) - var(--border) * 2);
    clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
    display: flex;
    height: calc(var(--radius-card) - var(--border) * 2);
    justify-content: center;
    overflow: hidden;
    transition:
      width 0.2s ease,
      clip-path 0.2s ease;
    width: calc(var(--radius-card) - var(--border) * 2);
  }

  .typeText {
    color: var(--colour-primary-content);
    font-size: var(--font-size-text-button);
    font-weight: bold;
    opacity: 0;
  }

  @media (max-width: 40rem) {
    .typeEar {
      --type-ear-base: calc(var(--radius-card) - var(--border) * 2);
      height: calc(var(--type-ear-base) * 3);
      width: calc(var(--type-ear-base) * 3);
    }

    .typeText {
      font-size: var(--font-size-text-small);
    }
  }
</style>
