<script setup lang="ts">
  import { onMounted } from 'vue'
  import { type Item, status } from './FeatureDatabase.vue'
  import { type SortBy } from '../utils/types'
  import { useItemFiltering } from '../composables/useItemFiltering'
  import FeatureCard from './FeatureCard.vue'
  import FeatureFilter from './FeatureFilter.vue'
  import BaseButtonBack from './BaseButtonBack.vue'

  const { items: itemsProp, show, type, title } = defineProps<{
    items?: Item[]
    show: boolean
    type?: status
    title?: boolean
  }>()

  const initialSortBy: SortBy = title ? 'title' : 'lastUpdated'
  const { filteredItems, filterLimit, filterSortBy, currentFilterStatus, filterSearch, filterTags, filterMediaType, loadItems } = useItemFiltering(itemsProp, type, initialSortBy)

  onMounted(async () => {
    await loadItems()
  })
</script>

<template>
  <div class="container">
    <BaseButtonBack />
    <FeatureFilter 
      class="filter" 
      :show="show" 
      :filterStatus="currentFilterStatus" 
      :sortBy="filterSortBy"
      :filterSearch="filterSearch"
      :filterTags="filterTags"
      :filterMediaType="filterMediaType"
      @update:filterStatus="currentFilterStatus = $event" 
      @update:limit="filterLimit = $event" 
      @update:sortBy="filterSortBy = $event"
      @update:filterSearch="filterSearch = $event"
      @update:filterTags="filterTags = $event"
      @update:filterMediaType="filterMediaType = $event"
    />
    <div class="cardsContainer">
      <FeatureCard v-for="item in filteredItems" :key="item.id" :item="item" />
    </div>
  </div>
</template>

<style scoped>
  .cardsContainer {
    display: flex;
    flex-wrap: wrap;
    gap: var(--gap-section);
    height: 100%;
    justify-content: center;
    width: 100%;
  }

  .container {
    margin-top: var(--gap-section);
    text-align: center;
  }

  .filter {
    align-self: center;
    justify-self: center;
    margin-bottom: var(--spacing-button);
  }
</style>
