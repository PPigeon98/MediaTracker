import { ref, watch } from 'vue'
import { getImageSrc } from '../components/FeatureAssets.vue'

export function useImageLoader(imagePath: string | (() => string)) {
  const imageSrc = ref<string>('')

  watch(
    () => (typeof imagePath === 'function' ? imagePath() : imagePath),
    async (path) => {
      if (!path) {
        imageSrc.value = ''
        return
      }
      imageSrc.value = await getImageSrc(path)
    },
    { immediate: true }
  )

  return {
    imageSrc,
  }
}

