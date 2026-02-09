<script setup lang="ts">
  import FeatureCards from './FeatureCards.vue'
  import { status } from '../utils/types'
  import { reactive } from 'vue'
  import { useRouter } from 'vue-router'
  import BaseButton from './BaseButton.vue'

  const router = useRouter()

  function handleShowMore(sectionKey: keyof typeof limits) {
    limits[sectionKey] += 5
  }

  const limits = reactive({
    tracking: 5,
    completed: 5,
    onHold: 5,
    dropped: 5,
    planned: 5,
  })

  const sections = [
    { key: 'tracking', label: 'Currently Tracking' },
    { key: 'completed', label: 'Completed' },
    { key: 'onHold', label: 'On Hold' },
    { key: 'dropped', label: 'Dropped' },
    { key: 'planned', label: 'Planned' },
  ] as const

  const statusMap: Record<(typeof sections)[number]['key'], status> = {
    tracking: status.tracking,
    completed: status.completed,
    onHold: status.onHold,
    dropped: status.dropped,
    planned: status.planned,
  }
</script>

<template>
  <div class="homeContainer">
    <div>
      <BaseButton text="Sync" @click="router.push('/Sync')" class="syncButton" />
      <BaseButton text="+" :glow="true" @click="router.push('/Search')" class="addItemButton" />
    </div>
    <div
      v-for="section in sections"
      :key="section.key"
      class="section"
    >
      <div class="sectionHeader">
        <h1>{{ section.label }}</h1>
        <BaseButton
          text="View All"
          @click="router.push(`/Library?show=true&type=${section.key}&title=false`)"
          class="viewAllButton"
        />
      </div>
      <FeatureCards
        :filterStatus="statusMap[section.key]"
        :limit="limits[section.key]"
        sortBy="lastUpdated"
        @showMore="handleShowMore(section.key)"
      />
    </div>
  </div>
</template>

<style scoped>
  .addItemButton {
    bottom: var(--spacing-page-edge);
    height: var(--spacing-button);
    left: 50%;
    position: fixed;
    transform: translateX(-50%);
    width: var(--spacing-button);
  }

  .homeContainer {
    padding-bottom: 18vw;
  }

  .section {
    margin-bottom: calc(var(--gap-section) / 2);
  }

  .sectionHeader {
    align-items: center;
    display: flex;
    gap: calc(var(--gap-section) / 2);
    justify-content: space-between;
  }

  .sectionHeader h1 {
    margin: 0;
  }

  .syncButton {
    position: fixed;
    left: var(--spacing-page-edge);
    bottom: var(--spacing-page-edge);
  }

  @media (max-width: 40rem) {
    .addItemButton {
      bottom: calc(var(--spacing-page-edge) + var(--padding-bottom-mobile));
    }

    .syncButton {
      bottom: calc(var(--spacing-page-edge) + var(--padding-bottom-mobile));
    }
  }
</style>
