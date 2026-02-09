import { ref } from 'vue'
import { mediaType, tags, status, type Item, type progress, mediaTypeLabels, statusLabels, splitLines } from '../utils/types'
import { useSelectOptions } from './useSelectOptions'
import { getImageSrc } from '../components/FeatureAssets.vue'
import { getItemImages } from '../components/FeatureDatabase.vue'

export function useItemForm() {
  const item = ref({
    title: '',
    description: '',
    mediaTypeValue: mediaType.anime,
    statusValue: status.tracking,
    selectedTags: [] as tags[],
    progress: [] as progress[],
    imageSet: [] as string[],
    notes: '',
    coverImage: '',
    ongoing: false,
    otherNames: '',
    creators: '',
    startDate: '',
    endDate: '',
  })

  function itemToFormItem(dbItem: Item, imageSrcs: string[], coverImageSrc: string) {
    return {
      title: dbItem.title,
      description: dbItem.description,
      mediaTypeValue: dbItem.mediaType,
      statusValue: dbItem.status,
      selectedTags: dbItem.tags,
      progress: dbItem.progress,
      notes: dbItem.notes,
      coverImage: coverImageSrc,
      imageSet: imageSrcs,
      ongoing: dbItem.ongoing,
      otherNames: dbItem.otherNames.join('\n'),
      creators: dbItem.creators.join('\n'),
      startDate: dbItem.startDate,
      endDate: dbItem.endDate,
    }
  }

  async function loadItemData(dbItem: Item) {
    const imagePaths = await getItemImages(dbItem.id)
    const imageSrcs = await Promise.all(imagePaths.map(getImageSrc))
    item.value = itemToFormItem(dbItem, imageSrcs, await getImageSrc(dbItem.coverImage))
  }

  function createDbItem(currentItemId: number): Item {
    return {
      id: currentItemId,
      coverImage: item.value.coverImage,
      status: item.value.statusValue,
      title: item.value.title,
      description: item.value.description,
      lastUpdated: new Date().toISOString(),
      mediaType: item.value.mediaTypeValue,
      tags: item.value.selectedTags,
      progress: item.value.progress,
      ongoing: item.value.ongoing,
      imageSet: item.value.imageSet,
      notes: item.value.notes,
      otherNames: splitLines(item.value.otherNames),
      creators: splitLines(item.value.creators),
      startDate: item.value.startDate,
      endDate: item.value.endDate,
    }
  }

  const { selectOptions: mediaTypeSelectOptions } = useSelectOptions(mediaType, mediaTypeLabels)
  const { selectOptions: statusSelectOptions } = useSelectOptions(status, statusLabels)

  return {
    item,
    itemToFormItem,
    loadItemData,
    createDbItem,
    mediaTypeSelectOptions,
    statusSelectOptions,
  }
}

