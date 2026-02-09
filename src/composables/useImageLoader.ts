import { ref, onMounted } from 'vue'
import { getImageSrc } from '../components/FeatureAssets.vue'

export function useImageLoader(imagePath: string) {
  const imageSrc = ref<string>('')

  onMounted(async () => {
    if (imagePath) {
      imageSrc.value = await getImageSrc(imagePath)
    }
  })

  return {
    imageSrc,
  }
}

