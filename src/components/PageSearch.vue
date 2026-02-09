<script setup lang="ts">
  import { useRouter } from 'vue-router'
  import { ref } from 'vue'
  import { search as searchApi } from '../composables/useApiCalls'
  import { type Item } from './FeatureDatabase.vue'
  import PageLibrary from './PageLibrary.vue'
  import BaseButton from './BaseButton.vue'
  import BaseTextInput from './BaseTextInput.vue'

  const router = useRouter()
  const searchInput = ref('')
  const items = ref<Item[]>([])
  const hasSearched = ref(false)
  const loading = ref(false)

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
    <BaseButton text="API Keys" @click="router.push('/Keys')" class="apiButton" />
    <BaseButton text="Manual Add" @click="router.push('/Details')" class="addItemButton" />
    <h1 class="searchTitle">Search Media</h1>
    <div class="searchInputContainer">
      <BaseTextInput v-model="searchInput" placeholder="Search for media here..." @keyup.enter="search" class="searchInput" />
      <BaseButton text="🔍︎" @click="search()" class="searchButton" />
    </div>
    <h1 v-if="loading" class="statusMessage">Loading...</h1>
    <h1 v-else-if="hasSearched && items.length === 0" class="statusMessage">No results found</h1>
    <PageLibrary v-else :items="items" :show="false" :title="true" />
  </div>
</template>

<style scoped>
  .addItemButton {
    position: absolute;
    right: var(--spacing-page-edge);
    top: calc(var(--spacing-page-edge) / 2 + var(--window-bar-height));
  }

  .apiButton {
    position: absolute;
    top: calc(var(--spacing-page-edge) / 2 + var(--window-bar-height));
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

  .searchInput {
    height: var(--spacing-button-small);
    width: 65%;
  }

  .searchInputContainer {
    align-items: center;
    display: flex;
    flex-direction: row;
    height: 100%;
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
    .addItemButton {
      top: calc(var(--padding-top-mobile) / 2 + var(--window-bar-height) + var(--spacing-page-edge));
    }

    .apiButton {
      top: calc(var(--padding-top-mobile) / 2 + var(--window-bar-height) + var(--spacing-page-edge));
    }
  }
</style>
