<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { removeTagFromAllItems } from './FeatureDatabase.vue'
  import { useLocalStorage } from '../composables/useLocalStorage'
  import { useCustomTags } from '../composables/useCustomTags'
  import { useTypeColors } from '../composables/useTypeColors'
  import { useStatusColors } from '../composables/useStatusColors'
  import BaseButtonBack from './BaseButtonBack.vue'
  import BaseButton from './BaseButton.vue'
  import BaseTextInput from './BaseTextInput.vue'
  import FeatureSync from './FeatureSync.vue'

  type ApiKeys = {
    tmdb: string;
    neodb: string;
    hardcover: string;
    rawg: string;
  }

  const apiKeys = useLocalStorage<ApiKeys | string>('apiKeys', {
    tmdb: '',
    neodb: '',
    hardcover: '',
    rawg: '',
  })

  function keysObject(): ApiKeys {
    const v = apiKeys.value
    if (typeof v === 'string') {
      return {
        tmdb: v,
        neodb: '',
        hardcover: '',
        rawg: '',
      }
    }
    return {
      tmdb: v.tmdb ?? '',
      neodb: v.neodb ?? '',
      hardcover: v.hardcover ?? '',
      rawg: v.rawg ?? '',
    }
  }

  const tmdbApiKey = computed({
    get: () => keysObject().tmdb,
    set: (value: string) => {
      apiKeys.value = { ...keysObject(), tmdb: value }
    },
  })

  const neoDbAccessToken = computed({
    get: () => keysObject().neodb,
    set: (value: string) => {
      apiKeys.value = { ...keysObject(), neodb: value }
    },
  })

  const hardcoverApiKey = computed({
    get: () => keysObject().hardcover,
    set: (value: string) => {
      apiKeys.value = { ...keysObject(), hardcover: value }
    },
  })

  const rawgApiKey = computed({
    get: () => keysObject().rawg,
    set: (value: string) => {
      apiKeys.value = { ...keysObject(), rawg: value }
    },
  })
  const { typeColors, typeColorOptions } = useTypeColors()
  const { statusColors, statusColorOptions } = useStatusColors()
  const { sortedCustomTags, addTag, removeTag } = useCustomTags()
  const newTag = ref('')

  function handleAddTag() {
    addTag(newTag.value)
    newTag.value = ''
  }

  async function handleRemoveTag(tag: string) {
    await removeTagFromAllItems(tag)
    removeTag(tag)
  }
</script>

<template>
  <div class="settingsPage">
    <BaseButtonBack />
    <h1 class="settingsTitle">Settings</h1>

    <div class="settingsSection">
      <h2>TMDB API Key</h2>
      <BaseTextInput
        v-model="tmdbApiKey"
        type="text"
        placeholder="Enter your API key"
        class="apiKeyInput"
      />
    </div>

    <div class="settingsSection">
      <h2>NeoDB Access Token</h2>
      <BaseTextInput
        v-model="neoDbAccessToken"
        type="text"
        placeholder="Paste token (with or without Bearer)"
        class="apiKeyInput"
      />
    </div>

    <div class="settingsSection">
      <h2>Hardcover API Key</h2>
      <BaseTextInput
        v-model="hardcoverApiKey"
        type="text"
        placeholder="Paste token (with or without Bearer)"
        class="apiKeyInput"
      />
    </div>

    <div class="settingsSection">
      <h2>RAWG API Key</h2>
      <BaseTextInput
        v-model="rawgApiKey"
        type="text"
        placeholder="Enter your RAWG API key"
        class="apiKeyInput"
      />
    </div>

    <div class="settingsSection">
      <h2>Database Sync</h2>
      <FeatureSync />
    </div>

    <div class="settingsSection">
      <h2>Type Colors</h2>
      <div class="typeColorList">
        <label v-for="option in typeColorOptions" :key="option.key" class="typeColorRow">
          <span>{{ option.label }}</span>
          <input v-model="typeColors[option.key]" type="color" class="typeColorInput" />
        </label>
      </div>
    </div>

    <div class="settingsSection">
      <h2>Status Colors (Graph Border)</h2>
      <div class="typeColorList">
        <label v-for="option in statusColorOptions" :key="option.key" class="typeColorRow">
          <span>{{ option.label }}</span>
          <input v-model="statusColors[option.key]" type="color" class="typeColorInput" />
        </label>
      </div>
    </div>

    <div class="settingsSection">
      <h2>Custom Tags</h2>
      <div class="newTagRow">
        <BaseTextInput
          v-model="newTag"
          type="text"
          placeholder="Add a new tag"
          class="newTagInput"
          @keyup.enter="handleAddTag"
        />
        <BaseButton text="Add" @click="handleAddTag" />
      </div>

      <div class="tagList">
        <div v-for="tag in sortedCustomTags" :key="tag" class="tagRow">
          <span>{{ tag }}</span>
          <BaseButton text="Remove" @click="handleRemoveTag(tag)" :other="true" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .settingsPage {
    align-items: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: var(--spacing-page-edge);
  }

  .settingsTitle {
    margin-top: calc(var(--window-bar-height) + var(--spacing-page-edge));
  }

  .settingsSection {
    display: flex;
    flex-direction: column;
    gap: calc(var(--gap-section) / 2);
    margin-top: var(--gap-section);
    width: min(22rem, 100%);
  }

  .settingsSection h2 {
    font-family: 'Lexend', sans-serif;
    font-size: calc(var(--font-size-heading) / 1.35);
    font-weight: 600;
    line-height: 1.2;
    margin: 0;
  }

  .apiKeyInput {
    height: var(--spacing-button);
    width: 100%;
  }

  .typeColorList {
    display: flex;
    flex-direction: column;
    gap: calc(var(--gap-section) / 3);
  }

  .typeColorRow {
    align-items: center;
    display: flex;
    justify-content: space-between;
  }

  .typeColorInput {
    background-color: transparent;
    border: var(--border) solid var(--colour-primary);
    border-radius: var(--radius-input);
    cursor: pointer;
    height: var(--spacing-button-small);
    width: calc(var(--spacing-button-small) * 1.5);
  }

  .newTagRow {
    align-items: center;
    display: flex;
    gap: calc(var(--gap-section) / 2);
  }

  .newTagInput {
    flex: 1;
  }

  .tagList {
    display: flex;
    flex-direction: column;
    gap: calc(var(--gap-section) / 3);
  }

  .tagRow {
    align-items: center;
    display: flex;
    justify-content: space-between;
  }
</style>
