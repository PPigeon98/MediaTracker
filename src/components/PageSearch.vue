<script setup lang="ts">
  import { useRouter } from 'vue-router'
  import { ref } from 'vue'
  import { search as searchApi } from '../composables/useApiCalls'
  import { type Item } from './FeatureDatabase.vue'
  import PageLibrary from './PageLibrary.vue'
  import BaseButton from './BaseButton.vue'
  import BaseTextInput from './BaseTextInput.vue'
  import BaseButtonBack from './BaseButtonBack.vue'

  const router = useRouter()
  const searchInput = ref('')
  const items = ref<Item[]>([])
  const hasSearched = ref(false)
  const loading = ref(false)
  const showFilters = ref(false)

  async function search() {
    if (!searchInput.value.trim()) return
    loading.value = true
    hasSearched.value = false
    items.value = []
    try {
      const results: Item[] = await searchApi(searchInput.value)
      items.value = results
      hasSearched.value = true
    } catch (error) {
      console.error('Search error:', error)
      hasSearched.value = true
      items.value = []
    } finally {
      loading.value = false
    }
  }
</script>

<template>
  <div class="itemPage">
    <BaseButtonBack />
    <BaseButton text="Manual Add" @click="router.push('/Details')" class="addItemButton" />
    <h1 class="searchTitle">Search Media</h1>
    <div class="searchInputContainer">
      <button class="searchButton filterButton" type="button" @click="showFilters = !showFilters">
        <svg class="filterIcon" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M3 5H21L14 13V19L10 21V13L3 5Z"
            fill="none"
            stroke="var(--colour-primary)"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
      <BaseTextInput v-model="searchInput" placeholder="Search for media here..." @keyup.enter="search" class="searchInput" />
      <BaseButton text="🔍︎" @click="search()" class="searchButton" />
    </div>
    <h1 v-if="loading" class="statusMessage">Loading...</h1>
    <h1 v-else-if="hasSearched && items.length === 0" class="statusMessage">No results found</h1>
    <PageLibrary v-else :items="items" :show="showFilters" :title="true" :showBackButton="false" :firstRowOnly="true" />
  </div>
</template>

<style scoped>
  .addItemButton {
    box-sizing: border-box;
    min-height: var(--spacing-button);
    position: absolute;
    right: var(--spacing-page-edge);
    top: calc(var(--spacing-page-edge) / 2 + var(--window-bar-stack-height));
  }

  .itemPage {
    align-items: center;
    display: flex;
    flex-direction: column;
    height: 100%;
    justify-content: center;
    width: 100%;
  }

  .searchButton {
    height: var(--spacing-button-small);
    padding: 0;
    width: var(--spacing-button-small);
  }

  .filterButton {
    align-items: center;
    background-color: var(--colour-base-100);
    border: var(--border) solid var(--colour-primary);
    border-radius: var(--radius-input);
    cursor: pointer;
    display: flex;
    justify-content: center;
  }

  .filterIcon {
    height: 55%;
    width: 55%;
  }

  .searchInput {
    height: var(--spacing-button-small);
    width: 65%;
  }

  .searchInputContainer {
    align-items: center;
    display: flex;
    flex-direction: row;
    justify-content: center;
    width: 100%;
  }

  .searchTitle {
    margin-top: 8vw;
  }

  .statusMessage {
    margin-top: 4vw;
  }

  @media (max-width: 40rem) {
    .itemPage {
      box-sizing: border-box;
      justify-content: flex-start;
      min-height: 100%;
      padding-top: var(--page-content-offset-top);
    }

    .addItemButton {
      top: calc(var(--window-bar-stack-height) + var(--spacing-page-edge));
    }

    .searchTitle,
    .statusMessage {
      margin-top: var(--gap-section);
    }

    .searchButton {
      min-height: max(var(--spacing-button-small), var(--min-height-form-control));
      min-width: max(var(--spacing-button-small), var(--min-height-form-control));
    }

    .searchInput {
      min-height: max(var(--spacing-button-small), var(--min-height-form-control));
    }
  }
</style>
