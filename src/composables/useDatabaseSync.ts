import { ref } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { open, save } from '@tauri-apps/plugin-dialog'
import { readTextFile, writeTextFile, readFile, exists, remove, BaseDirectory } from '@tauri-apps/plugin-fs'
import Database from '@tauri-apps/plugin-sql'
import { getItems, addItem, updateItem, deleteItem, type Item } from '../components/FeatureDatabase.vue'
import { saveImageAsFile } from '../components/FeatureAssets.vue'

export interface SyncData {
  version: string
  exportDate: string
  items: ItemWithBase64Images[]
}

interface ItemWithBase64Images extends Omit<Item, 'coverImage' | 'imageSet'> {
  coverImage?: string
  imageSet?: string[]
}

const ONEDRIVE_STAGING_PUSH = 'onedrive_sync_push.json'
const ONEDRIVE_STAGING_PULL = 'onedrive_sync_pull.json'

export function useDatabaseSync() {
  const isProcessing = ref(false)
  const statusMessage = ref<string>('')
  const oneDriveConnected = ref(false)
  // Convert image file to base64 data URL
  async function imagePathToBase64(imagePath: string): Promise<string> {
    // Skip if already base64 or URL
    if (!imagePath || imagePath.startsWith('data:image/') || imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath
    }

    try {
      // Check if file exists
      if (!(await exists(imagePath, { baseDir: BaseDirectory.AppData }))) {
        console.warn(`Image file not found: ${imagePath}`)
        return ''
      }

      // Read file as binary
      const fileData = await readFile(imagePath, { baseDir: BaseDirectory.AppData })

      // Determine MIME type from extension
      const extension = imagePath.split('.').pop()?.toLowerCase() || 'jpg'
      const mimeTypes: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp'
      }
      const mimeType = mimeTypes[extension] || 'image/jpeg'

      // Convert Uint8Array to base64 (handle large files by chunking)
      let binaryString = ''
      const chunkSize = 8192
      for (let i = 0; i < fileData.length; i += chunkSize) {
        const chunk = fileData.slice(i, i + chunkSize)
        binaryString += String.fromCharCode(...chunk)
      }
      const base64 = btoa(binaryString)
      return `data:${mimeType};base64,${base64}`
    } catch (error) {
      console.error(`Error converting image to base64: ${imagePath}`, error)
      return ''
    }
  }

  async function buildExportPayload(): Promise<{ json: string; itemCount: number }> {
    const items = await getItems(true)
    const itemsWithBase64: ItemWithBase64Images[] = []

    for (const item of items) {
      const itemWithBase64: ItemWithBase64Images = {
        ...item,
        coverImage: item.coverImage ? await imagePathToBase64(item.coverImage) : '',
        imageSet: []
      }

      if (item.imageSet && item.imageSet.length > 0) {
        for (const imagePath of item.imageSet) {
          const base64 = await imagePathToBase64(imagePath)
          if (base64) {
            itemWithBase64.imageSet!.push(base64)
          }
        }
      }

      itemsWithBase64.push(itemWithBase64)
    }

    const syncData: SyncData = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      items: itemsWithBase64
    }

    return { json: JSON.stringify(syncData, null, 2), itemCount: items.length }
  }

  async function importFromJsonText(text: string): Promise<number> {
    const syncData: SyncData = JSON.parse(text)

    if (!syncData.items || !Array.isArray(syncData.items)) {
      throw new Error('Invalid backup file format')
    }

    const existingItems = await getItems(false)
    for (const item of existingItems) {
      await deleteItem(item)
    }

    let imported = 0
    for (const item of syncData.items) {
      const newItem: Item = {
        ...item,
        id: 0,
        coverImage: '',
        imageSet: []
      }
      const newItemId = await addItem(newItem)

      let coverImagePath = ''
      const imageSetPaths: string[] = []

      if (item.coverImage && item.coverImage.startsWith('data:image/')) {
        coverImagePath = await saveImageAsFile(item.coverImage, newItemId)
      } else if (item.coverImage) {
        coverImagePath = item.coverImage
      }

      if (item.imageSet && item.imageSet.length > 0) {
        for (const base64Image of item.imageSet) {
          if (base64Image && base64Image.startsWith('data:image/')) {
            const imagePath = await saveImageAsFile(base64Image, newItemId)
            if (imagePath) {
              imageSetPaths.push(imagePath)
            }
          } else if (base64Image) {
            imageSetPaths.push(base64Image)
          }
        }
      }

      if (coverImagePath || imageSetPaths.length > 0) {
        await updateItem({
          ...newItem,
          id: newItemId,
          coverImage: coverImagePath,
          imageSet: imageSetPaths
        })
      }

      imported++
    }

    return imported
  }

  async function syncMergeFromJsonText(text: string): Promise<{ added: number; updated: number }> {
    const syncData: SyncData = JSON.parse(text)

    if (!syncData.items || !Array.isArray(syncData.items)) {
      throw new Error('Invalid backup file format')
    }

    const existingItems = await getItems(false)
    const existingByIdAndTitle = new Map(
      existingItems.map(item => [`${item.id}:${item.title.toLowerCase()}`, item])
    )
    const existingById = new Map(existingItems.map(item => [item.id, item]))

    let added = 0
    let updated = 0

    async function addItemWithId(item: Item, desiredId: number): Promise<number> {
      if (existingById.has(desiredId)) {
        const newItem: Item = {
          ...item,
          id: 0,
          coverImage: '',
          imageSet: []
        }
        const newId = await addItem(newItem)
        existingById.set(newId, { ...newItem, id: newId })
        return newId
      }

      try {
        const database = await Database.load('sqlite:database.db')

        const checkResult = await database.select<{ id: number }[]>(
          'SELECT id FROM items WHERE id = $1',
          [desiredId]
        )

        if (checkResult.length > 0) {
          existingById.set(desiredId, { ...item, id: desiredId })
          const newItem: Item = {
            ...item,
            id: 0,
            coverImage: '',
            imageSet: []
          }
          const newId = await addItem(newItem)
          existingById.set(newId, { ...newItem, id: newId })
          return newId
        }

        await database.execute(
          `INSERT INTO items (id, title, description, lastUpdated, coverImage, status, mediaType, tags, progress, ongoing, notes, otherNames, creators, startDate, endDate)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
          [
            desiredId,
            item.title,
            item.description,
            item.lastUpdated,
            '',
            item.status,
            item.mediaType,
            JSON.stringify(item.tags),
            JSON.stringify(item.progress),
            Number(item.ongoing),
            item.notes,
            JSON.stringify(item.otherNames),
            JSON.stringify(item.creators),
            item.startDate,
            item.endDate
          ]
        )

        existingById.set(desiredId, { ...item, id: desiredId })
        return desiredId
      } catch (error) {
        console.warn(`Failed to insert with ID ${desiredId}, using auto-increment:`, error)
        const newItem: Item = {
          ...item,
          id: 0,
          coverImage: '',
          imageSet: []
        }
        const newId = await addItem(newItem)
        existingById.set(newId, { ...newItem, id: newId })
        return newId
      }
    }

    for (const item of syncData.items) {
      const matchKey = `${item.id}:${item.title.toLowerCase()}`
      const existing = existingByIdAndTitle.get(matchKey)

      if (existing) {
        const existingDate = new Date(existing.lastUpdated)
        const importedDate = new Date(item.lastUpdated)

        if (importedDate > existingDate) {
          let coverImagePath = ''
          const imageSetPaths: string[] = []

          if (item.coverImage && item.coverImage.startsWith('data:image/')) {
            coverImagePath = await saveImageAsFile(item.coverImage, existing.id)
          } else if (item.coverImage) {
            coverImagePath = item.coverImage
          }

          if (item.imageSet && item.imageSet.length > 0) {
            for (const base64Image of item.imageSet) {
              if (base64Image && base64Image.startsWith('data:image/')) {
                const imagePath = await saveImageAsFile(base64Image, existing.id)
                if (imagePath) {
                  imageSetPaths.push(imagePath)
                }
              } else if (base64Image) {
                imageSetPaths.push(base64Image)
              }
            }
          }

          const updatedItem: Item = {
            ...item,
            id: existing.id,
            coverImage: coverImagePath,
            imageSet: imageSetPaths
          }
          await updateItem(updatedItem)
          updated++
        }
      } else {
        const newItem: Item = {
          ...item,
          coverImage: '',
          imageSet: []
        }
        const newItemId = await addItemWithId(newItem, item.id)

        let coverImagePath = ''
        const imageSetPaths: string[] = []

        if (item.coverImage && item.coverImage.startsWith('data:image/')) {
          coverImagePath = await saveImageAsFile(item.coverImage, newItemId)
        } else if (item.coverImage) {
          coverImagePath = item.coverImage
        }

        if (item.imageSet && item.imageSet.length > 0) {
          for (const base64Image of item.imageSet) {
            if (base64Image && base64Image.startsWith('data:image/')) {
              const imagePath = await saveImageAsFile(base64Image, newItemId)
              if (imagePath) {
                imageSetPaths.push(imagePath)
              }
            } else if (base64Image) {
              imageSetPaths.push(base64Image)
            }
          }
        }

        if (coverImagePath || imageSetPaths.length > 0) {
          await updateItem({
            ...newItem,
            id: newItemId,
            coverImage: coverImagePath,
            imageSet: imageSetPaths
          })
        }

        added++
      }
    }

    return { added, updated }
  }

  async function refreshOneDriveStatus(): Promise<void> {
    try {
      oneDriveConnected.value = await invoke<boolean>('onedrive_status')
    } catch {
      oneDriveConnected.value = false
    }
  }

  async function oneDriveSignIn(): Promise<void> {
    isProcessing.value = true
    statusMessage.value = 'Opening browser for OneDrive sign-in...'
    try {
      await invoke('onedrive_sign_in')
      await refreshOneDriveStatus()
      statusMessage.value = 'OneDrive: signed in.'
    } catch (e) {
      console.error(e)
      statusMessage.value = `OneDrive sign-in failed: ${e}`
      throw e
    } finally {
      isProcessing.value = false
    }
  }

  async function oneDriveSignOut(): Promise<void> {
    isProcessing.value = true
    try {
      await invoke('onedrive_sign_out')
      await refreshOneDriveStatus()
      statusMessage.value = 'OneDrive: signed out.'
    } catch (e) {
      statusMessage.value = `OneDrive: ${e}`
      throw e
    } finally {
      isProcessing.value = false
    }
  }

  async function oneDrivePush(): Promise<void> {
    isProcessing.value = true
    statusMessage.value = 'Preparing upload to OneDrive...'
    try {
      const { json, itemCount } = await buildExportPayload()
      await writeTextFile(ONEDRIVE_STAGING_PUSH, json, { baseDir: BaseDirectory.AppData })
      await invoke('onedrive_push', { stagingFilename: ONEDRIVE_STAGING_PUSH })
      statusMessage.value = `OneDrive: uploaded backup (${itemCount} items).`
    } catch (e) {
      console.error(e)
      statusMessage.value = `OneDrive upload failed: ${e}`
      throw e
    } finally {
      isProcessing.value = false
    }
  }

  async function oneDrivePullMerge(): Promise<void> {
    isProcessing.value = true
    statusMessage.value = 'Downloading from OneDrive...'
    try {
      await invoke('onedrive_pull', { stagingFilename: ONEDRIVE_STAGING_PULL })
      const text = await readTextFile(ONEDRIVE_STAGING_PULL, { baseDir: BaseDirectory.AppData })
      const { added, updated } = await syncMergeFromJsonText(text)
      statusMessage.value = `OneDrive pull & merge: ${added} added, ${updated} updated.`
    } catch (e) {
      console.error(e)
      statusMessage.value = `OneDrive pull failed: ${e}`
      throw e
    } finally {
      isProcessing.value = false
    }
  }

  async function oneDrivePullReplace(): Promise<void> {
    isProcessing.value = true
    statusMessage.value = 'Downloading from OneDrive...'
    try {
      await invoke('onedrive_pull', { stagingFilename: ONEDRIVE_STAGING_PULL })
      const text = await readTextFile(ONEDRIVE_STAGING_PULL, { baseDir: BaseDirectory.AppData })
      const n = await importFromJsonText(text)
      statusMessage.value = `OneDrive pull & replace: ${n} items imported.`
    } catch (e) {
      console.error(e)
      statusMessage.value = `OneDrive pull failed: ${e}`
      throw e
    } finally {
      isProcessing.value = false
    }
  }

  async function exportDatabase(): Promise<void> {
    isProcessing.value = true
    statusMessage.value = 'Exporting database...'

    try {
      const { json: jsonData, itemCount } = await buildExportPayload()
      const defaultFilename = `media-tracker-backup-${new Date().toISOString().split('T')[0]}.json`

      // Open save dialog
      const filePath = await save({
        filters: [
          {
            name: 'JSON',
            extensions: ['json'],
          },
        ],
        defaultPath: defaultFilename,
      })

      if (!filePath) {
        statusMessage.value = 'Export cancelled'
        return
      }

      // Write file using Tauri fs plugin
      await writeTextFile(filePath, jsonData)

      statusMessage.value = `Exported ${itemCount} items successfully!`
    } catch (error) {
      console.error('Error exporting database:', error)
      statusMessage.value = 'Error exporting database'
      throw error
    } finally {
      isProcessing.value = false
    }
  }

  async function importDatabase(): Promise<void> {
    isProcessing.value = true
    statusMessage.value = 'Importing database...'

    try {
      // Open file dialog
      const filePath = await open({
        multiple: false,
        directory: false,
        filters: [
          {
            name: 'JSON',
            extensions: ['json'],
          },
        ],
      })

      if (!filePath || typeof filePath !== 'string') {
        statusMessage.value = 'Import cancelled'
        return
      }

      const text = await readTextFile(filePath)
      const imported = await importFromJsonText(text)
      statusMessage.value = `Import complete: ${imported} items imported`
    } catch (error) {
      console.error('Error importing database:', error)
      statusMessage.value = 'Error importing database'
      throw error
    } finally {
      isProcessing.value = false
    }
  }

  async function syncDatabase(): Promise<void> {
    isProcessing.value = true
    statusMessage.value = 'Syncing database...'

    try {
      // Open file dialog
      const filePath = await open({
        multiple: false,
        directory: false,
        filters: [
          {
            name: 'JSON',
            extensions: ['json'],
          },
        ],
      })

      if (!filePath || typeof filePath !== 'string') {
        statusMessage.value = 'Sync cancelled'
        return
      }

      const text = await readTextFile(filePath)
      const { added, updated } = await syncMergeFromJsonText(text)
      statusMessage.value = `Sync complete: ${added} added, ${updated} updated`
    } catch (error) {
      console.error('Error syncing database:', error)
      statusMessage.value = 'Error syncing database'
      throw error
    } finally {
      isProcessing.value = false
    }
  }

  async function deleteDatabase(): Promise<void> {
    isProcessing.value = true
    statusMessage.value = 'Deleting database...'

    try {
      const database = await Database.load('sqlite:database.db')
      await database.execute('DELETE FROM item_images')
      await database.execute('DELETE FROM items')
      await database.execute('DELETE FROM sqlite_sequence WHERE name IN (\'items\', \'item_images\')')

      const imagesFolder = 'images'
      if (await exists(imagesFolder, { baseDir: BaseDirectory.AppData })) {
        await remove(imagesFolder, { baseDir: BaseDirectory.AppData, recursive: true })
      }

      statusMessage.value = 'Database deleted successfully'
    } catch (error) {
      console.error('Error deleting database:', error)
      statusMessage.value = 'Error deleting database'
      throw error
    } finally {
      isProcessing.value = false
    }
  }

  return {
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
  }
}
