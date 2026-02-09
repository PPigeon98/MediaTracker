<script setup lang="ts">
  import { type Item, typeVariableNames } from '../utils/types'
  import tempCardImage from '../assets/Template.png'
  import { computed } from 'vue'
  import { useImageLoader } from '../composables/useImageLoader'
  import { useItemNavigation } from '../composables/useItemNavigation'
  import FeatureType from './FeatureType.vue'
  import FeatureOngoing from './FeatureOngoing.vue'
  import FeatureProgressBar from './FeatureProgressBar.vue'

  const { item } = defineProps<{
    item: Item
  }>()

  const { imageSrc } = useImageLoader(item.coverImage)
  const { navigateToItem } = useItemNavigation()

  function handleCardClick() {
    navigateToItem(item)
  }

  const borderColour = computed(() => `var(--colour-${typeVariableNames[item.mediaType]})`)
</script>

<template>
  <div class="cardWrapper" @click="handleCardClick">
    <img :src="imageSrc || tempCardImage" :alt="item.title" class="cardImage">
    <FeatureType :type="item.mediaType" class="type" />
    <FeatureOngoing v-if="item.ongoing" class="ongoing" />
    <h2>{{ item.title }}</h2>
    <FeatureProgressBar :progress="item.progress" />
  </div>
</template>

<style scoped>
  .cardImage {
    aspect-ratio: 1;
    border: calc(var(--border) * 2) solid v-bind('borderColour');
    border-radius: var(--radius-card);
    object-fit: cover;
    width: 100%;
  }

  .cardWrapper {
    align-items: center;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    min-width: var(--size-card-width);
    position: relative;
    text-align: center;
    width: var(--size-card-width);
  }

  .cardWrapper:hover :deep(.ongoingEar) {
    clip-path: polygon(var(--spacing-button-small) 0, 100% 0, 100% 100%, 0 100%);
    width: 12vw;
  }

  .cardWrapper:hover :deep(.ongoingText) {
    opacity: 1;
    transition: all 0.2s ease;
  }

  .cardWrapper:hover :deep(.typeEar) {
    clip-path: polygon(0 0, 100% 0, calc(100% - var(--spacing-button-small)) 100%, 0 100%);
    width: 20vw;
  }

  .cardWrapper:hover :deep(.typeText) {
    opacity: 1;
    transition: all 0.2s ease;
  }

  .ongoing {
    position: absolute;
    right: 0;
    top: calc(var(--size-card-width) - var(--radius-card) + var(--border) * 4);
  }

  .type {
    left: 0;
    position: absolute;
    top: var(--border);
  }
</style>
