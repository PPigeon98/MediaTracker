import { ref } from 'vue'
import { open, save } from '@tauri-apps/plugin-dialog'
import { readTextFile, writeTextFile, readFile, exists, BaseDirectory } from '@tauri-apps/plugin-fs'
import Database from '@tauri-apps/plugin-sql'
import { getItems, addItem, updateItem, deleteItem, type Item } from '../components/FeatureDatabase.vue'
import { saveImageAsFile } from '../components/FeatureAssets.vue'

export interface SyncData {
  version: string
  exportDate: string
  items: ItemWithBase64Images[]
}

interface ItemWithBase64Images extends Omit<Item, 'coverImage' | 'imageSet'> {
  coverImage?: string // base64 data URL or empty string
  imageSet?: string[] // array of base64 data URLs
}

export function useDatabaseSync() {
  const isProcessing = ref(false)
  const statusMessage = ref<string>('')

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

  async function exportDatabase(): Promise<void> {
    isProcessing.value = true
    statusMessage.value = 'Exporting database...'

    try {
      // Get all items with images
      const items = await getItems(true)

      // Convert items with images to base64
      const itemsWithBase64: ItemWithBase64Images[] = []
      
      for (const item of items) {
        const itemWithBase64: ItemWithBase64Images = {
          ...item,
          coverImage: item.coverImage ? await imagePathToBase64(item.coverImage) : '',
          imageSet: []
        }

        // Convert imageSet to base64
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

      const jsonData = JSON.stringify(syncData, null, 2)
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

      statusMessage.value = `Exported ${items.length} items successfully!`
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

      // Read file using Tauri fs plugin
      const text = await readTextFile(filePath)
      const syncData: SyncData = JSON.parse(text)

      if (!syncData.items || !Array.isArray(syncData.items)) {
        throw new Error('Invalid backup file format')
      }

      // Delete all existing items (complete replacement)
      const existingItems = await getItems(false)
      for (const item of existingItems) {
        await deleteItem(item)
      }

      // Add all items from imported file
      let imported = 0
      for (const item of syncData.items) {
        // Add new item first to get the itemId
        const newItem: Item = {
          ...item,
          id: 0,
          coverImage: '',
          imageSet: []
        }
        const newItemId = await addItem(newItem)
        
        // Convert base64 images to files with the correct itemId
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

        // Update item with image paths
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

      // Read file using Tauri fs plugin
      const text = await readTextFile(filePath)
      const syncData: SyncData = JSON.parse(text)

      if (!syncData.items || !Array.isArray(syncData.items)) {
        throw new Error('Invalid backup file format')
      }

      const existingItems = await getItems(false)
      // Create maps for matching
      const existingByIdAndTitle = new Map(
        existingItems.map(item => [`${item.id}:${item.title.toLowerCase()}`, item])
      )
      const existingById = new Map(existingItems.map(item => [item.id, item]))

      let added = 0
      let updated = 0

      // Helper function to add item with specific ID if possible
      async function addItemWithId(item: Item, desiredId: number): Promise<number> {
        // Check if the desired ID is already taken
        if (existingById.has(desiredId)) {
          // ID is taken, use auto-increment
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

        // Try to insert with specific ID
        try {
          const database = await Database.load('sqlite:database.db')
          
          // Double-check ID doesn't exist in database
          const checkResult = await database.select<{ id: number }[]>(
            'SELECT id FROM items WHERE id = $1',
            [desiredId]
          )
          
          if (checkResult.length > 0) {
            // ID exists in database, use auto-increment
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

          // Insert item with specific ID (without images - those will be handled separately)
          await database.execute(
            `INSERT INTO items (id, title, description, lastUpdated, coverImage, status, mediaType, tags, progress, ongoing, notes, otherNames, creators, startDate, endDate)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
            [
              desiredId,
              item.title,
              item.description,
              item.lastUpdated,
              '', // coverImage will be set later after converting from base64
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

          // Update the map for future checks
          existingById.set(desiredId, { ...item, id: desiredId })
          return desiredId
        } catch (error) {
          // If insertion with specific ID fails, fall back to auto-increment
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

      // Go through imported JSON one by one
      for (const item of syncData.items) {
        const matchKey = `${item.id}:${item.title.toLowerCase()}`
        const existing = existingByIdAndTitle.get(matchKey)
        
        if (existing) {
          // Both ID and title match - check if imported is newer
          const existingDate = new Date(existing.lastUpdated)
          const importedDate = new Date(item.lastUpdated)
          
          if (importedDate > existingDate) {
            // Imported is newer - replace existing item (preserve existing ID)
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
              id: existing.id, // Preserve existing ID
              coverImage: coverImagePath,
              imageSet: imageSetPaths
            }
            await updateItem(updatedItem)
            updated++
          }
          // If existing is newer or equal, do nothing (skip)
        } else {
          // ID and title don't both match - add with original ID if possible
          const newItem: Item = {
            ...item,
            coverImage: '',
            imageSet: []
          }
          const newItemId = await addItemWithId(newItem, item.id)
          
          // Convert base64 images to files with the correct itemId
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

          // Update item with image paths
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

      statusMessage.value = `Sync complete: ${added} added, ${updated} updated`
    } catch (error) {
      console.error('Error syncing database:', error)
      statusMessage.value = 'Error syncing database'
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
    syncDatabase
  }
}

