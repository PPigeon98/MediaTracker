<script setup lang="ts">
  import BaseButtonBack from './BaseButtonBack.vue'
  import FeatureSync from './FeatureSync.vue'
</script>

<template>
  <div class="syncPage">
    <BaseButtonBack />
    <h1 class="syncTitle">Database Sync</h1>
    <FeatureSync />
  </div>
</template>

<style scoped>
  .syncPage {
    align-items: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: var(--spacing-page-edge);
  }

  .syncTitle {
    margin-bottom: var(--gap-section);
    margin-top: calc(var(--window-bar-height) + var(--spacing-page-edge));
  }
</style>

