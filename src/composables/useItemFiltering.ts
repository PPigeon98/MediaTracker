import { ref, computed, watch } from 'vue'
import { type Item, status, getItems } from '../components/FeatureDatabase.vue'
import { type SortBy, sortItems, mediaType, tags } from '../utils/types'

export function useItemFiltering(
  itemsProp?: Item[],
  initialFilterStatus?: status,
  initialSortBy?: SortBy,
  initialLimit?: number,
  initialFilterSearch?: string,
  initialFilterTags?: tags[],
  initialFilterMediaType?: mediaType
) {
  const items = ref<Item[]>([])
  const filterLimit = ref<number | undefined>(initialLimit)
  const filterSortBy = ref<SortBy>(initialSortBy!)
  const currentFilterStatus = ref<status | undefined>(initialFilterStatus)
  const filterSearch = ref<string>(initialFilterSearch || '')
  const filterTags = ref<tags[]>(initialFilterTags || [])
  const filterMediaType = ref<mediaType | undefined>(initialFilterMediaType)

  async function loadItems() {
    if (itemsProp !== undefined) {
      items.value = itemsProp
    } else {
      items.value = await getItems()
    }
  }

  watch(() => itemsProp, (newItems) => {
    if (newItems !== undefined) {
      items.value = newItems
    }
  })

  const searchFilteredItems = computed(() => {
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
    if (filterMediaType.value === undefined) {
      return searchFilteredItems.value
    }
    return searchFilteredItems.value.filter(item => item.mediaType === filterMediaType.value)
  })

  const tagsFilteredItems = computed(() => {
    if (filterTags.value.length === 0) {
      return mediaTypeFilteredItems.value
    }
    return mediaTypeFilteredItems.value.filter(item => 
      filterTags.value.every(tag => item.tags.includes(tag))
    )
  })

  const statusFilteredItems = computed(() => {
    if (currentFilterStatus.value === undefined) {
      return tagsFilteredItems.value
    }
    return tagsFilteredItems.value.filter(item => item.status === currentFilterStatus.value)
  })

  const sortedItems = computed(() => sortItems(statusFilteredItems.value, filterSortBy.value))

  const filteredItems = computed(() => {
    if (filterLimit.value === undefined) {
      return sortedItems.value
    }
    return sortedItems.value.slice(0, filterLimit.value)
  })

  const hasMore = computed(() => {
    return filterLimit.value !== undefined && sortedItems.value.length > filterLimit.value
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

