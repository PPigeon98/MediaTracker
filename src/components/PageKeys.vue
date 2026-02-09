<script setup lang="ts">
  import { useLocalStorage } from '../composables/useLocalStorage'
  import BaseButtonBack from './BaseButtonBack.vue'
  import BaseTextInput from './BaseTextInput.vue'

  const tmdbApiKey = useLocalStorage<string>('apiKeys', '')
</script>

<template>
  <div class="apiKeysContainer">
    <BaseButtonBack to="/Search" />
    <div class="apiKeysContent">
      <h1>TMDB API Key</h1>
      <BaseTextInput type="text" v-model="tmdbApiKey" placeholder="Enter your API key" class="apiKeyInput" />
    </div>
  </div>
</template>

<style scoped>
  .apiKeyInput {
    height: var(--spacing-button);
    width: 100%;
  }

  .apiKeysContainer {
    align-items: center;
    display: flex;
    flex-direction: column;
    height: 100%;
    justify-content: center;
    text-align: center;
    width: 100%;
  }

  .apiKeysContent {
    margin-top: 10vw;
  }
</style>
