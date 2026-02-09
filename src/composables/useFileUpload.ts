import { ref } from 'vue'

export function useFileUpload() {
  const fileInputRef = ref<HTMLInputElement>()

  function triggerFileInput() {
    fileInputRef.value!.click()
  }

  async function handleImageSelect(
    event: Event,
    onSelect: (images: string[]) => void
  ) {
    const target = event.target as HTMLInputElement
    const files = target.files!
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'))
    const newImages: string[] = []

    for (const file of imageFiles) {
      const reader = new FileReader()
      await new Promise<void>((resolve) => {
        reader.onload = (e) => {
          const result = e.target!.result as string
          if (result) newImages.push(result)
          resolve()
        }
        reader.readAsDataURL(file)
      })
    }

    onSelect(newImages)
    target.value = ''
  }

  return {
    fileInputRef,
    triggerFileInput,
    handleImageSelect
  }
}
