<script setup lang="ts">
  import { ref, watch } from 'vue'
  import { status, mediaType, tags, mediaTypeLabels } from '../utils/types'
  import { type SortBy } from '../utils/types'
  import BaseSelect from './BaseSelect.vue'
  import BaseTextInput from './BaseTextInput.vue'
  import BaseCheckbox from './BaseCheckbox.vue'

  const { filterStatus, limit, sortBy, show, filterSearch, filterTags, filterMediaType } = defineProps<{
    filterStatus?: status
    limit?: number
    sortBy?: SortBy
    show: boolean
    filterSearch?: string
    filterTags?: tags[]
    filterMediaType?: mediaType
  }>()

  const emit = defineEmits<{
    (e: 'update:filterStatus', value: status | undefined): void
    (e: 'update:limit', value: number | undefined): void
    (e: 'update:sortBy', value: SortBy): void
    (e: 'update:filterSearch', value: string): void
    (e: 'update:filterTags', value: tags[]): void
    (e: 'update:filterMediaType', value: mediaType | undefined): void
  }>()

  const localStatus = ref<status | undefined>(filterStatus)
  const localLimit = ref<number | undefined>(limit)
  const localSortBy = ref<SortBy>(sortBy || 'lastUpdated')
  const localSearch = ref<string>(filterSearch || '')
  const localTags = ref<tags[]>(filterTags || [])
  const localMediaType = ref<mediaType | undefined>(filterMediaType)

  const tagOptions = Object.values(tags).map(tag => ({
    value: tag,
    label: tag
  }))

  const mediaTypeOptions = [
    { value: '', label: 'All' },
    ...Object.values(mediaType)
      .filter(v => typeof v === 'number')
      .map(type => ({
        value: type as number,
        label: mediaTypeLabels[type as mediaType]
      }))
  ]

  watch(() => filterStatus, (val) => {
    localStatus.value = val
  }, { immediate: true })

  watch(() => limit, (val) => {
    localLimit.value = val
  }, { immediate: true })

  watch(() => sortBy, (val) => {
    if (val) localSortBy.value = val
  }, { immediate: true })

  watch(() => filterSearch, (val) => {
    localSearch.value = val || ''
  }, { immediate: true })

  watch(() => filterTags, (val) => {
    localTags.value = val || []
  }, { immediate: true })

  watch(() => filterMediaType, (val) => {
    localMediaType.value = val
  }, { immediate: true })

  function updateStatus(value: string) {
    const newStatus = value === '' ? undefined : Number(value) as status
    localStatus.value = newStatus
    emit('update:filterStatus', newStatus)
  }

  function updateLimit(value: string) {
    const numValue = value === '' ? undefined : Number(value)
    localLimit.value = numValue
    emit('update:limit', numValue)
  }

  function updateSortBy(value: string) {
    const newSortBy = value as SortBy
    localSortBy.value = newSortBy
    emit('update:sortBy', newSortBy)
  }

  function updateSearch(value: string) {
    localSearch.value = value
    emit('update:filterSearch', value)
  }

  function updateMediaType(value: string) {
    const newMediaType = value === '' ? undefined : Number(value) as mediaType
    localMediaType.value = newMediaType
    emit('update:filterMediaType', newMediaType)
  }

  function toggleTag(tag: tags, checked: boolean) {
    const newTags = checked
      ? [...localTags.value, tag]
      : localTags.value.filter(t => t !== tag)
    localTags.value = newTags
    emit('update:filterTags', newTags)
  }
</script>

<template>
  <div class="filter" v-if="show">
    <div class="filterGroup filterGroupSearch">
      <label for="search">Search:</label>
      <BaseTextInput
        id="search"
        :model-value="localSearch"
        placeholder="Search by title..."
        @update:model-value="updateSearch"
        :border="true"
      />
    </div>

    <div class="filterGroup">
      <label for="mediaType">Type:</label>
      <BaseSelect
        id="mediaType"
        :options="mediaTypeOptions"
        :model-value="localMediaType !== undefined ? localMediaType : ''"
        @update:model-value="updateMediaType($event as string)"
      />
    </div>

    <div class="filterGroup filterGroupTags">
      <label for="tags">Tags:</label>
      <div class="tagsContainer">
        <BaseCheckbox
          v-for="tag in tagOptions"
          :key="tag.value"
          :text="tag.label"
          :checked="localTags.includes(tag.value as tags)"
          @update:checked="(checked) => toggleTag(tag.value as tags, checked)"
        />
      </div>
    </div>

    <div class="filterGroup">
      <label for="status">Status:</label>
      <BaseSelect
        id="status"
        :options="[
          { value: '', label: 'All' },
          { value: status.tracking, label: 'Tracking' },
          { value: status.completed, label: 'Completed' },
          { value: status.onHold, label: 'On Hold' },
          { value: status.dropped, label: 'Dropped' },
          { value: status.planned, label: 'Planned' }
        ]"
        :model-value="localStatus !== undefined ? localStatus : ''"
        @update:model-value="updateStatus($event as string)"
      />
    </div>

    <div class="filterGroup">
      <label for="limit">Limit:</label>
      <BaseTextInput
        id="limit"
        type="number"
        :model-value="localLimit ? localLimit.toString() : ''"
        placeholder="None"
        @update:model-value="updateLimit"
        :border="true"
      />
    </div>

    <div class="filterGroup">
      <label for="sortBy">Sort By:</label>
      <BaseSelect
        id="sortBy"
        :options="[
          { value: 'lastUpdated', label: 'Last Updated' },
          { value: 'title', label: 'Title' }
        ]"
        :model-value="localSortBy"
        @update:model-value="updateSortBy($event as string)"
      />
    </div>
  </div>
</template>

<style scoped>
  .filter {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: var(--padding-filter);
    padding: var(--padding-filter);
    padding-left: calc(var(--padding-filter) * 7);
    padding-right: calc(var(--padding-filter) * 7);
  }

  .filterGroup {
    align-items: center;
    display: flex;
    flex-shrink: 0;
    gap: calc(var(--gap-section) / 4);
  }

  .filterGroup input {
    width: 8vw;
  }

  .filterGroupSearch input {
    width: 15vw;
  }

  .filterGroup label {
    font-weight: bold;
    white-space: nowrap;
  }

  .filterGroupTags {
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
  }

  .tagsContainer {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: calc(var(--gap-section) / 4);
    max-width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
  }

  @media (max-width: 40rem) {
    .filter {
      flex-direction: column;
      align-items: stretch;
    }

    .filterGroup {
      flex-direction: column;
      align-items: flex-start;
    }

    .filterGroup input {
      width: 100%;
    }
  }
</style>
