<script setup lang="ts">
  import { onMounted } from 'vue'
  import { useDatabaseSync } from '../composables/useDatabaseSync'
  import BaseButton from './BaseButton.vue'

  const {
    isProcessing,
    statusMessage,
    exportDatabase,
    importDatabase,
    syncDatabase,
    deleteDatabase,
    oneDriveConnected,
    refreshOneDriveStatus,
    oneDriveSignIn,
    oneDriveSignOut,
    oneDrivePush,
    oneDrivePullMerge,
    oneDrivePullReplace
  } = useDatabaseSync()

  onMounted(async () => {
    await refreshOneDriveStatus()
  })

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

  async function handleDeleteDatabase() {
    const shouldDelete = window.confirm('Delete the entire local database and all saved images? This cannot be undone.')
    if (!shouldDelete) return

    try {
      await deleteDatabase()
    } catch (error) {
      console.error('Database delete error:', error)
    }
  }

  async function handleOneDriveSignIn() {
    try {
      await oneDriveSignIn()
    } catch (error) {
      console.error('OneDrive sign-in:', error)
    }
  }

  async function handleOneDriveSignOut() {
    try {
      await oneDriveSignOut()
    } catch (error) {
      console.error('OneDrive sign-out:', error)
    }
  }

  async function handleOneDrivePush() {
    try {
      await oneDrivePush()
    } catch (error) {
      console.error('OneDrive push:', error)
    }
  }

  async function handleOneDrivePullMerge() {
    try {
      await oneDrivePullMerge()
    } catch (error) {
      console.error('OneDrive pull merge:', error)
    }
  }

  async function handleOneDrivePullReplace() {
    const ok = window.confirm(
      'Replace this device’s entire library with the OneDrive backup? Local items not in the backup will be removed.'
    )
    if (!ok) return
    try {
      await oneDrivePullReplace()
    } catch (error) {
      console.error('OneDrive pull replace:', error)
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
      <BaseButton
        text="Delete Database"
        @click="handleDeleteDatabase"
        :disabled="isProcessing"
        class="syncButton deleteDatabaseButton"
      />
    </div>

    <section class="oneDriveSection">
      <h2>OneDrive</h2>
      <p class="oneDriveStatus">
        {{ oneDriveConnected ? 'Signed in to OneDrive.' : 'Not signed in.' }}
      </p>
      <div class="syncButtons oneDriveButtons">
        <BaseButton
          text="Sign in"
          @click="handleOneDriveSignIn"
          :disabled="isProcessing"
          class="syncButton"
        />
        <BaseButton
          text="Sign out"
          @click="handleOneDriveSignOut"
          :disabled="isProcessing || !oneDriveConnected"
          class="syncButton"
        />
        <BaseButton
          text="Push to OneDrive"
          @click="handleOneDrivePush"
          :disabled="isProcessing || !oneDriveConnected"
          class="syncButton"
        />
        <BaseButton
          text="Pull &amp; merge"
          @click="handleOneDrivePullMerge"
          :disabled="isProcessing || !oneDriveConnected"
          class="syncButton"
        />
        <BaseButton
          text="Pull &amp; replace"
          @click="handleOneDrivePullReplace"
          :disabled="isProcessing || !oneDriveConnected"
          class="syncButton deleteDatabaseButton"
        />
      </div>
    </section>

    <p v-if="statusMessage" class="statusMessage">{{ statusMessage }}</p>
  </div>
</template>

<style scoped>
  .deleteDatabaseButton:deep(.button) {
    border-color: #dc2626;
  }

  .deleteDatabaseButton:deep(.button > .text) {
    color: #dc2626;
  }

  .deleteDatabaseButton:deep(.button::before),
  .deleteDatabaseButton:deep(.button::after) {
    background-color: #dc2626;
  }

  .oneDriveSection {
    display: flex;
    flex-direction: column;
    gap: calc(var(--gap-section) / 2);
    margin-top: 1.5rem;
    max-width: 40rem;
  }

  .oneDriveSection h2 {
    font-family: 'Lexend', sans-serif;
    font-size: calc(var(--font-size-heading) / 1.35);
    font-weight: 600;
    line-height: 1.2;
    margin: 0;
  }

  .oneDriveHelp {
    color: var(--colour-neutral);
    font-size: var(--font-size-text-small);
    line-height: 1.4;
    margin: 0 0 0.75rem;
  }

  .mono {
    font-family: ui-monospace, monospace;
    word-break: break-all;
  }

  .oneDriveStatus {
    font-size: var(--font-size-text-small);
    margin: 0;
  }

  .oneDriveButtons {
    flex-wrap: wrap;
  }
</style>
