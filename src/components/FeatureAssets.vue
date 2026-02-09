<script lang="ts">
  import { convertFileSrc } from '@tauri-apps/api/core'
  import { writeFile, exists, mkdir, remove, BaseDirectory } from '@tauri-apps/plugin-fs'
  import { appDataDir, join } from '@tauri-apps/api/path'
  import { download } from '@tauri-apps/plugin-upload'

  export async function saveImageAsFile(imageData: string, itemId: number): Promise<string> {
    if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
      const urlLower = imageData.toLowerCase()
      const extension = urlLower.includes('.png') ? 'png'
        : urlLower.includes('.gif') ? 'gif'
        : urlLower.includes('.webp') ? 'webp'
        : 'jpg'

      const filePath = `images/${itemId}/${itemId}_${Date.now()}.${extension}`
      const dirPath = `images/${itemId}`

      if (!(await exists(dirPath, { baseDir: BaseDirectory.AppData }))) {
        await mkdir(dirPath, { baseDir: BaseDirectory.AppData, recursive: true })
      }

      const appData = await appDataDir()
      await download(imageData, await join(appData, filePath), () => {}, new Map())
      return filePath
    }
    const base64Match = imageData.match(/^data:image\/([^;]+);base64,(.+)$/)
    if (!base64Match) {
      throw new Error('Invalid image data format')
    }

    const extension = base64Match[1]!
    const base64Data = base64Match[2]

    const binaryString = atob(base64Data)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    const timestamp = Date.now()
    const filename = `${itemId}_${timestamp}.${extension}`
    const dirPath = `images/${itemId}`
    const filePath = `${dirPath}/${filename}`

    if (!(await exists(dirPath, { baseDir: BaseDirectory.AppData }))) {
      await mkdir(dirPath, { baseDir: BaseDirectory.AppData, recursive: true })
    }

    await writeFile(filePath, bytes, { baseDir: BaseDirectory.AppData })
    return filePath
  }

  export async function getImageSrc(imagePath: string): Promise<string> {
    if (!imagePath) return ''
    if (imagePath.startsWith('data:image/')) return imagePath
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath
    }
    if (imagePath.startsWith('http://asset.localhost/') || imagePath.startsWith('https://asset.localhost/')) {
      return imagePath
    }
    if (imagePath.startsWith('file://')) {
      return convertFileSrc(imagePath.replace(/^file:\/\/+/, ''))
    }
    const appData = await appDataDir()
    return convertFileSrc(await join(appData, imagePath))
  }

  export async function getImagePath(imageSrc: string): Promise<string> {
    if (!imageSrc) return ''
    if (imageSrc.startsWith('data:image/')) return imageSrc
    if (imageSrc.startsWith('http://asset.localhost/') || imageSrc.startsWith('https://asset.localhost/')) {
      const appData = await appDataDir()
      let urlPath = decodeURIComponent(imageSrc.replace(/^https?:\/\/asset\.localhost\//, ''))
      urlPath = urlPath.replace(/\\/g, '/').replace(/^\/+/, '')
      const appDataPath = appData.replace(/\\/g, '/').replace(/^\/+/, '')
      if (urlPath.toLowerCase().startsWith(appDataPath.toLowerCase())) {
        const relativePath = urlPath.substring(appDataPath.length).replace(/^\/+/, '')
        return relativePath
      }
      return imageSrc
    }
    return imageSrc
  }

  export async function deleteImage(imageSrc: string): Promise<void> {
    if (!imageSrc) return
    if (imageSrc.startsWith('data:image/')) {
      return
    }
    const imagePath = await getImagePath(imageSrc)
    if (!imagePath || imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:image/')) {
      return
    }
    try {
      if (await exists(imagePath, { baseDir: BaseDirectory.AppData })) {
        await remove(imagePath, { baseDir: BaseDirectory.AppData })
      }
    } catch (error) {
      console.error('Failed to delete image:', error)
      throw error
    }
  }

  export default {}
</script>
