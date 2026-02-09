import { useRouter } from 'vue-router'
import { addItem, type Item } from '../components/FeatureDatabase.vue'

export function useItemNavigation() {
  const router = useRouter()

  async function navigateToItem(item: Item) {
    try {
      if (item.id === -1) {
        router.push(`/Details?item=${encodeURIComponent(JSON.stringify(item))}`)
      } else if (item.id > 0) {
        router.push(`/Details?item=${item.id}`)
      } else {
        const itemId = await addItem({ ...item, id: 0 })
        router.push(`/Details?item=${itemId}`)
      }
    } catch (error) {
      console.error('Failed to save item:', error)
    }
  }

  return {
    navigateToItem,
  }
}

