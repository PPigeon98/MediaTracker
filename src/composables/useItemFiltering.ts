import { ref, computed, watch } from 'vue'
import { type Item, status, getFilteredItems, getFilteredItemsCount } from '../components/FeatureDatabase.vue'
import { type SortBy, sortItems, mediaType, type Tag } from '../utils/types'

export function useItemFiltering(
  itemsProp?: Item[],
  initialFilterStatus?: status,
  initialSortBy?: SortBy,
  initialLimit?: number,
  initialFilterSearch?: string,
  initialFilterTags?: Tag[],
  initialFilterMediaType?: mediaType
) {
  const items = ref<Item[]>([])
  const totalMatchingCount = ref(0)
  const filterLimit = ref<number | undefined>(initialLimit)
  const filterSortBy = ref<SortBy>(initialSortBy || 'title')
  const currentFilterStatus = ref<status | undefined>(initialFilterStatus)
  const filterSearch = ref<string>(initialFilterSearch || '')
  const filterTags = ref<Tag[]>(initialFilterTags || [])
  const filterMediaType = ref<mediaType | undefined>(initialFilterMediaType)
  const effectiveLimit = computed(() => {
    if (filterLimit.value === undefined || filterLimit.value <= 0) {
      return undefined
    }
    return filterLimit.value
  })

  async function loadItems() {
    if (itemsProp !== undefined) {
      items.value = itemsProp
      totalMatchingCount.value = itemsProp.length
    } else {
      const baseFilters = {
        status: currentFilterStatus.value,
        mediaType: filterMediaType.value,
        search: filterSearch.value,
        tags: filterTags.value,
        sortBy: filterSortBy.value,
      }

      items.value = await getFilteredItems({
        ...baseFilters,
        limit: effectiveLimit.value
      })
      totalMatchingCount.value = await getFilteredItemsCount(baseFilters)
    }
  }

  watch(() => itemsProp, (newItems) => {
    if (newItems !== undefined) {
      items.value = newItems
      totalMatchingCount.value = newItems.length
    }
  })

  if (itemsProp === undefined) {
    watch(
      [currentFilterStatus, filterSortBy, filterLimit, filterSearch, filterTags, filterMediaType],
      async () => {
        await loadItems()
      },
      { deep: true }
    )
  }

  const searchFilteredItems = computed(() => {
    if (itemsProp === undefined) {
      return items.value
    }
    if (!filterSearch.value.trim()) {
      return items.value
    }
    const searchLower = filterSearch.value.toLowerCase().trim()
    return items.value.filter(item => 
      item.title.toLowerCase().includes(searchLower) ||
      item.description.toLowerCase().includes(searchLower) ||
      item.otherNames.some(name => name.toLowerCase().includes(searchLower)) ||
      item.creators.some(creator => creator.toLowerCase().includes(searchLower))
    )
  })

  const mediaTypeFilteredItems = computed(() => {
    if (itemsProp === undefined) {
      return searchFilteredItems.value
    }
    if (filterMediaType.value === undefined) {
      return searchFilteredItems.value
    }
    return searchFilteredItems.value.filter(item => item.mediaType === filterMediaType.value)
  })

  const tagsFilteredItems = computed(() => {
    if (itemsProp === undefined) {
      return mediaTypeFilteredItems.value
    }
    if (filterTags.value.length === 0) {
      return mediaTypeFilteredItems.value
    }
    return mediaTypeFilteredItems.value.filter(item => 
      filterTags.value.every(tag => item.tags.includes(tag))
    )
  })

  const statusFilteredItems = computed(() => {
    if (itemsProp === undefined) {
      return tagsFilteredItems.value
    }
    if (currentFilterStatus.value === undefined) {
      return tagsFilteredItems.value
    }
    return tagsFilteredItems.value.filter(item => item.status === currentFilterStatus.value)
  })

  const sortedItems = computed(() => sortItems(statusFilteredItems.value, filterSortBy.value))

  const filteredItems = computed(() => {
    if (itemsProp === undefined) {
      return sortedItems.value
    }
    if (effectiveLimit.value === undefined) {
      return sortedItems.value
    }
    return sortedItems.value.slice(0, effectiveLimit.value)
  })

  const hasMore = computed(() => {
    if (effectiveLimit.value === undefined) {
      return false
    }
    if (itemsProp === undefined) {
      return totalMatchingCount.value > filteredItems.value.length
    }
    return sortedItems.value.length > effectiveLimit.value
  })

  return {
    items,
    filterLimit,
    filterSortBy,
    currentFilterStatus,
    filterSearch,
    filterTags,
    filterMediaType,
    filteredItems,
    hasMore,
    loadItems,
  }
}

