<script setup lang="ts">
  import { useDatabaseSync } from '../composables/useDatabaseSync'
  import BaseButton from './BaseButton.vue'

  const { isProcessing, statusMessage, exportDatabase, importDatabase, syncDatabase } = useDatabaseSync()

  async function handleExport() {
    try {
      await exportDatabase()
    } catch (error) {
      console.error('Export error:', error)
    }
  }

  async function handleImport() {
    try {
      await importDatabase()
    } catch (error) {
      console.error('File import error:', error)
    }
  }

  async function handleSync() {
    try {
      await syncDatabase()
    } catch (error) {
      console.error('File sync error:', error)
    }
  }
</script>

<template>
  <div class="syncContainer">
    <div class="syncButtons">
      <BaseButton 
        text="Export" 
        @click="handleExport" 
        :disabled="isProcessing"
        class="syncButton"
      />
      <BaseButton 
        text="Import" 
        @click="handleImport" 
        :disabled="isProcessing"
        class="syncButton"
      />
      <BaseButton 
        text="Sync" 
        @click="handleSync" 
        :disabled="isProcessing"
        class="syncButton"
      />
    </div>

    <p v-if="statusMessage" class="statusMessage">{{ statusMessage }}</p>
  </div>
</template>

