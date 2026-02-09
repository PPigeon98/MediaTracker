import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { addItem, updateItem, getItems, getItemImages, deleteItem as deleteItemFromDb, type Item } from '../components/FeatureDatabase.vue'
import { isExternalImage, splitLines } from '../utils/types'
import { saveImageAsFile, getImagePath, deleteImage } from '../components/FeatureAssets.vue'
import { remove, exists, BaseDirectory } from '@tauri-apps/plugin-fs'

export function useItemOperations() {
  const router = useRouter()
  const deletionQueue = ref<string[]>([])

  function handleQueueDeletion(imageSrc: string) {
    deletionQueue.value.push(imageSrc)
  }

  function handleCoverImageReplaced(oldImage: string) {
    deletionQueue.value.push(oldImage)
  }

  async function saveItem(
    currentItem: Item,
    formItem: {
      coverImage: string
      imageSet: string[]
      statusValue: number
      title: string
      description: string
      mediaTypeValue: number
      selectedTags: any[]
      progress: any[]
      ongoing: boolean
      notes: string
      otherNames: string
      creators: string
      startDate: string
      endDate: string
    }
  ) {
    let itemId = currentItem.id

    if (itemId === 0) {
      const newItem: Item = {
        id: 0,
        coverImage: '',
        status: formItem.statusValue,
        title: formItem.title,
        description: formItem.description,
        lastUpdated: new Date().toISOString(),
        mediaType: formItem.mediaTypeValue,
        tags: formItem.selectedTags,
        progress: formItem.progress,
        ongoing: formItem.ongoing,
        imageSet: [],
        notes: formItem.notes,
        otherNames: splitLines(formItem.otherNames),
        creators: splitLines(formItem.creators),
        startDate: formItem.startDate,
        endDate: formItem.endDate,
      }
      itemId = await addItem(newItem)
      const items = await getItems()
      const savedItem = items.find(i => i.id === itemId)
      currentItem = savedItem!
    }

    let coverImagePath = await getImagePath(formItem.coverImage)
    if (isExternalImage(coverImagePath)) {
      try {
        coverImagePath = await saveImageAsFile(coverImagePath, itemId)
      } catch (error) {
        console.error('Failed to download and save cover image:', error)
        throw error
      }
    }

    const savedImageSet: string[] = []
    for (const image of formItem.imageSet) {
      const imagePath = await getImagePath(image)
      if (isExternalImage(imagePath)) {
        try {
          savedImageSet.push(await saveImageAsFile(imagePath, itemId))
        } catch (error) {
          console.error('Failed to download and save gallery image:', error)
        }
      } else {
        savedImageSet.push(imagePath)
      }
    }

    const dbItem: Item = {
      id: currentItem.id,
      coverImage: coverImagePath,
      status: formItem.statusValue,
      title: formItem.title,
      description: formItem.description,
      lastUpdated: new Date().toISOString(),
      mediaType: formItem.mediaTypeValue,
      tags: formItem.selectedTags,
      progress: formItem.progress,
      ongoing: formItem.ongoing,
      imageSet: savedImageSet,
      notes: formItem.notes,
      otherNames: splitLines(formItem.otherNames),
      creators: splitLines(formItem.creators),
      startDate: formItem.startDate,
      endDate: formItem.endDate,
    }

    await updateItem(dbItem)

    for (const imageSrc of deletionQueue.value) {
      try {
        await deleteImage(imageSrc)
      } catch (error) {
        console.error('Failed to delete queued image:', error)
      }
    }
    deletionQueue.value = []

    router.push('/home')
    return currentItem
  }

  async function deleteItem(item: Item) {
    try {
      const allImages: string[] = []
      allImages.push(item.coverImage)
      const galleryImages = await getItemImages(item.id)
      allImages.push(...galleryImages)

      for (const imageSrc of allImages) {
        try {
          await deleteImage(imageSrc)
        } catch (error) {
          console.error('Failed to delete image:', error)
        }
      }

      await deleteItemFromDb(item)

      const folderPath = `images/${item.id}`
      try {
        if (await exists(folderPath, { baseDir: BaseDirectory.AppData })) {
          await remove(folderPath, { baseDir: BaseDirectory.AppData, recursive: true })
        }
      } catch (error) {
        console.error('Failed to delete folder:', error)
      }

      router.push('/home')
    } catch (error) {
      console.error('Failed to delete item:', error)
    }
  }

  return {
    deletionQueue,
    handleQueueDeletion,
    handleCoverImageReplaced,
    saveItem,
    deleteItem,
  }
}

