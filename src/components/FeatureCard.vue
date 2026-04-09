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

  const { imageSrc } = useImageLoader(() => item.coverImage)
  const { navigateToItem } = useItemNavigation()

  function handleCardClick() {
    navigateToItem(item)
  }

  const borderColour = computed(() => `var(--colour-${typeVariableNames[item.mediaType]})`)
</script>

<template>
  <div class="cardWrapper" @click="handleCardClick">
    <div class="cardMedia">
      <img :src="imageSrc || tempCardImage" :alt="item.title" class="cardImage">
      <FeatureType :type="item.mediaType" class="type" />
      <div v-if="item.ongoing" class="ongoingSlot">
        <FeatureOngoing />
      </div>
    </div>
    <h2>{{ item.title }}</h2>
    <FeatureProgressBar :progress="item.progress" />
  </div>
</template>

<style scoped>
  .cardImage {
    aspect-ratio: 1;
    border: calc(var(--border) * 2) solid v-bind('borderColour');
    border-radius: var(--radius-card);
    display: block;
    object-fit: cover;
    width: 100%;
  }

  .cardMedia {
    position: relative;
    width: 100%;
  }

  .cardMedia > .ongoingSlot {
    --ongoing-from-right: calc(var(--border) * -2);
    --ongoing-from-bottom: calc(var(--border) * 2);

    align-items: flex-end;
    bottom: var(--ongoing-from-bottom);
    box-sizing: border-box;
    display: flex;
    justify-content: flex-end;
    left: 0;
    pointer-events: none;
    position: absolute;
    right: var(--ongoing-from-right);
    z-index: 2;
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

  .cardMedia :deep(.type) {
    left: 0;
    position: absolute;
    top: var(--border);
  }

  @media (max-width: 40rem) {
    .cardMedia > .ongoingSlot {
      --ongoing-from-right: calc(var(--border) * -1.5);
      --ongoing-from-bottom: calc(var(--border) * 1.8);
    }

    .cardWrapper:hover :deep(.typeEar) {
      width: 32vw;
    }

    .cardWrapper:hover :deep(.ongoingEar) {
      width: 28vw;
    }
  }
</style>
