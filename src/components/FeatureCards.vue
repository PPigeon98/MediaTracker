<script setup lang="ts">
  import { onMounted, watch } from 'vue'
  import { status } from './FeatureDatabase.vue'
  import { type SortBy } from '../utils/types'
  import { useItemFiltering } from '../composables/useItemFiltering'
  import FeatureCard from './FeatureCard.vue'
  import BaseButton from './BaseButton.vue'

  const { filterStatus, limit, sortBy } = defineProps<{
    filterStatus?: status
    limit?: number
    sortBy?: SortBy
  }>()

  const emit = defineEmits<{
    (e: 'showMore'): void
  }>()

  const { filteredItems, hasMore, loadItems, filterLimit } = useItemFiltering(undefined, filterStatus, sortBy, limit)

  watch(() => limit, (newLimit) => {
    filterLimit.value = newLimit
  }, { immediate: true })

  onMounted(async () => {
    await loadItems()
  })
</script>

<template>
  <div class="cardsContainer">
    <FeatureCard v-for="item in filteredItems" :key="item.id" :item="item" />
    <BaseButton v-if="hasMore" text="Show More" @click="emit('showMore')" class="showMoreButton" />
  </div>
</template>

<style scoped>
  .cardsContainer {
    display: flex;
    flex-wrap: nowrap;
    gap: var(--gap-section);
    overflow-x: auto;
    overflow-y: hidden;
    padding-left: calc(var(--gap-section) / 2);
    width: calc(100% - var(--gap-section));
  }

  .showMoreButton {
    align-self: center;
    font-size: var(--font-size-text-small) !important;
    height: var(--spacing-button-small);
    min-width: 8vw;
  }
</style>
