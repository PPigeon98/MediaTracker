<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { status, mediaType, mediaTypeLabels, type SortBy, type Tag } from '../utils/types'
  import { useCustomTags } from '../composables/useCustomTags'
  import BaseSelect from './BaseSelect.vue'
  import BaseTextInput from './BaseTextInput.vue'
  import BaseCheckbox from './BaseCheckbox.vue'

  const { filterStatus, limit, sortBy, show, filterSearch, filterTags, filterMediaType, firstRowOnly } = defineProps<{
    filterStatus?: status
    limit?: number
    sortBy?: SortBy
    show: boolean
    filterSearch?: string
    filterTags?: Tag[]
    filterMediaType?: mediaType
    firstRowOnly?: boolean
  }>()

  const emit = defineEmits<{
    (e: 'update:filterStatus', value: status | undefined): void
    (e: 'update:limit', value: number | undefined): void
    (e: 'update:sortBy', value: SortBy): void
    (e: 'update:filterSearch', value: string): void
    (e: 'update:filterTags', value: Tag[]): void
    (e: 'update:filterMediaType', value: mediaType | undefined): void
  }>()

  const localStatus = ref<status | undefined>(filterStatus)
  const localLimit = ref<number | undefined>(limit)
  const localSortBy = ref<SortBy>(sortBy || 'lastUpdated')
  const localSearch = ref<string>(filterSearch || '')
  const localTags = ref<Tag[]>(filterTags || [])
  const localMediaType = ref<mediaType | undefined>(filterMediaType)
  const { sortedCustomTags } = useCustomTags()

  const tagOptions = computed(() => Array.from(new Set([...sortedCustomTags.value, ...localTags.value])).sort((a, b) => a.localeCompare(b)).map(tag => ({
    value: tag,
    label: tag
  })))

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
    const numValue = value === ''
      ? undefined
      : Math.max(0, Number(value))
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

  function toggleTag(tag: Tag, checked: boolean) {
    const newTags = checked
      ? [...localTags.value, tag]
      : localTags.value.filter(t => t !== tag)
    localTags.value = newTags
    emit('update:filterTags', newTags)
  }
</script>

<template>
  <div class="filter" v-if="show">
    <div class="filterRow filterRowTop">
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

      <div class="filterGroup filterGroupType">
        <label for="mediaType">Type:</label>
        <BaseSelect
          id="mediaType"
          :options="mediaTypeOptions"
          :model-value="localMediaType !== undefined ? localMediaType : ''"
          @update:model-value="updateMediaType($event as string)"
        />
      </div>
    </div>

    <div v-if="!firstRowOnly" class="filterRow filterRowTags">
      <div class="filterGroup filterGroupTags">
      <span class="tagsInlineLabel">Tags:</span>
      <div class="tagsContainer" id="tags">
        <BaseCheckbox
          v-for="tag in tagOptions"
          :key="tag.value"
          :text="tag.label"
          :checked="localTags.includes(tag.value as Tag)"
          @update:checked="(checked) => toggleTag(tag.value as Tag, checked)"
        />
      </div>
      </div>
    </div>

    <div v-if="!firstRowOnly" class="filterRow filterRowBottom">
      <div class="filterGroup filterGroupStatus">
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

      <div class="filterGroup filterGroupLimit">
        <label for="limit">Limit:</label>
        <BaseTextInput
          id="limit"
          type="number"
          min="0"
          :model-value="localLimit !== undefined ? localLimit.toString() : ''"
          placeholder="None"
          @update:model-value="updateLimit"
          :border="true"
        />
      </div>

      <div class="filterGroup filterGroupSortBy">
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
  </div>
</template>

<style scoped>
  .filter {
    align-items: stretch;
    display: flex;
    flex-direction: column;
    gap: var(--padding-filter);
    margin: 0 auto;
    max-width: min(90rem, 100%);
    padding: var(--padding-filter);
  }

  .filterRow {
    align-items: center;
    display: flex;
    gap: var(--padding-filter);
    justify-content: center;
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

  .filterGroupLimit {
    min-width: 0;
  }

  .filterGroupLimit input {
    min-width: 0;
  }

  .filterGroup label {
    font-weight: bold;
    white-space: nowrap;
  }

  .filterGroupTags {
    align-items: center;
    flex-direction: row;
    margin: 0 auto;
    width: 75%;
  }

  .tagsContainer {
    align-items: center;
    display: flex;
    flex-direction: row;
    gap: calc(var(--gap-section) / 2);
    justify-content: flex-start;
    overflow-x: auto;
    overflow-y: hidden;
    width: 100%;
  }

  .tagsInlineLabel {
    flex: 0 0 auto;
    font-weight: bold;
    white-space: nowrap;
  }

  @media (max-width: 40rem) {
    .filter {
      max-width: 100%;
    }

    .filterRow {
      align-items: stretch;
      flex-direction: column;
    }

    .filterGroup {
      flex-direction: column;
      align-items: flex-start;
    }

    .filterGroupTags {
      align-items: flex-start;
      flex-direction: column;
      width: 100%;
    }

    .filterGroup input {
      width: 100%;
    }
  }
</style>
