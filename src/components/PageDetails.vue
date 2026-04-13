<script setup lang="ts">
  import { useRoute } from 'vue-router'
  import { ref, onMounted, computed } from 'vue'
  import { getItems, getItemRelations, type Item, type ItemRelation } from './FeatureDatabase.vue'
  import { useItemForm } from '../composables/useItemForm'
  import { useItemOperations } from '../composables/useItemOperations'
  import { mediaType, status, type SelectOption } from '../utils/types'
  import BaseButtonBack from './BaseButtonBack.vue'
  import BaseButtonSave from './BaseButtonSave.vue'
  import BaseButtonDelete from './BaseButtonDelete.vue'
  import FeatureCoverImage from './FeatureCoverImage.vue'
  import FeatureTags from './FeatureTags.vue'
  import FeatureGallery from './FeatureGallery.vue'
  import FeatureProgress from './FeatureProgress.vue'
  import BaseTextArea from './BaseTextArea.vue'
  import BaseTextInput from './BaseTextInput.vue'
  import BaseSelect from './BaseSelect.vue'
  import BaseCheckbox from './BaseCheckbox.vue'
  import BaseButton from './BaseButton.vue'

  const route = useRoute()

  const currentItem = ref<Item>({
    id: 0,
    title: '',
    description: '',
    lastUpdated: '',
    coverImage: '',
    status: status.tracking,
    mediaType: mediaType.anime,
    tags: [],
    progress: [],
    ongoing: false,
    imageSet: [],
    notes: '',
    otherNames: [],
    creators: [],
    startDate: '',
    endDate: '',
  })
  const { item, itemToFormItem, loadItemData, mediaTypeSelectOptions, statusSelectOptions } = useItemForm()
  const { handleQueueDeletion, handleCoverImageReplaced, saveItem, deleteItem } = useItemOperations()
  const allItems = ref<Item[]>([])
  const relations = ref<ItemRelation[]>([])

  const relationOptions = computed<SelectOption[]>(() =>
    allItems.value
      .filter(i => i.id !== currentItem.value.id)
      .map(i => ({ value: i.id, label: i.title || `Item #${i.id}` }))
  )

  onMounted(async () => {
    const items = await getItems()
    allItems.value = items

    const itemParam = route.query.item
    const paramStr = itemParam as string

    if (paramStr.startsWith('{')) {
      try {
        const decoded = decodeURIComponent(paramStr)
        const apiItem: Item = JSON.parse(decoded)
        if (apiItem.id === -1) {
          item.value = itemToFormItem(apiItem, apiItem.imageSet, apiItem.coverImage)
          return
        }
      } catch (e) {
        console.error('Failed to parse API item:', e)
      }
    }

    const dbItem = items.find(i => i.id === Number(itemParam))
    currentItem.value = dbItem!
    loadItemData(dbItem!)
    relations.value = await getItemRelations(dbItem!.id)
  })

  async function save() {
    const savedItem = await saveItem(currentItem.value, item.value, relations.value)
    currentItem.value = savedItem
  }

  async function handleDelete() {
    await deleteItem(currentItem.value)
  }

  function addRelation() {
    relations.value.push({ relatedItemId: 0, description: '' })
  }

  function removeRelation(index: number) {
    relations.value.splice(index, 1)
  }
</script>

<template>
  <div class="itemPage">
    <BaseButtonBack />
    <BaseButtonSave text="Save" @click="save()" class="saveButton" />
    <BaseButtonDelete @click="handleDelete()" class="deleteButton" />

    <div class="itemsContainer">
      <div>
        <FeatureCoverImage v-model:coverImage="item.coverImage" @coverImageReplaced="handleCoverImageReplaced" class="coverImage" />
      </div>
      <div>
        <h1>Title</h1>
        <BaseTextArea v-model="item.title" placeholder="Title" class="titleField" />
      </div>
      <div>
        <h1>Description</h1>
        <BaseTextArea v-model="item.description" placeholder="Description" class="descriptionField" />
      </div>
      <div>
        <FeatureTags v-model:selectedTags="item.selectedTags" />
      </div>
      <div>
        <h1>Media Type</h1>
        <BaseSelect
          :options="mediaTypeSelectOptions"
          :model-value="item.mediaTypeValue"
          @update:model-value="(val) => item.mediaTypeValue = Number(val) as mediaType"
        />
      </div>
      <div>
        <h1>Status</h1>
        <BaseSelect
          :options="statusSelectOptions"
          :model-value="item.statusValue"
          @update:model-value="(val) => item.statusValue = Number(val) as status"
        />
      </div>
      <div>
        <FeatureProgress v-model="item.progress" />
      </div>
      <div>
        <h1>Notes</h1>
        <BaseTextArea v-model="item.notes" placeholder="Notes" class="descriptionField" />
      </div>
      <div>
        <h1>Other Names</h1>
        <BaseTextArea v-model="item.otherNames" placeholder="Other Names" class="descriptionField" />
      </div>
      <div>
        <h1>Creators</h1>
        <BaseTextArea v-model="item.creators" placeholder="Creators" class="descriptionField" />
      </div>
      <div>
        <h1>Start Date</h1>
        <BaseTextInput v-model="item.startDate" placeholder="Start Date" />
      </div>
      <div>
        <h1>End Date</h1>
        <BaseTextInput v-model="item.endDate" placeholder="End Date" />
      </div>
      <div>
        <h1>Ongoing</h1>
        <BaseCheckbox text="Ongoing" :checked="item.ongoing" @update:checked="item.ongoing = $event" />
      </div>
      <div>
        <h1>Relationships</h1>
        <div class="relationsSection">
          <div v-for="(relation, index) in relations" :key="index" class="relationRow">
            <BaseSelect
              :options="relationOptions"
              :model-value="relation.relatedItemId"
              class="relationSelectInput"
              @update:model-value="(val) => relation.relatedItemId = Number(val)"
            />
            <BaseTextInput v-model="relation.description" placeholder="How are they related?" class="relationDescriptionInput" />
            <div class="relationAction">
              <BaseButton text="🗑" @click="removeRelation(index)" class="removeRelationButton" />
            </div>
          </div>
          <BaseButton text="Add relation" @click="addRelation" />
        </div>
      </div>
    </div>
    <div>
      <FeatureGallery v-model:imageSet="item.imageSet" v-model:coverImage="item.coverImage" @queueDeletion="handleQueueDeletion" />
    </div>
  </div>
</template>

<style scoped>
  .coverImage {
    width: 100%;
  }

  .deleteButton {
    top: calc(var(--spacing-page-edge) / 2 + var(--window-bar-stack-height));
    position: absolute;
    right: var(--spacing-page-edge);
    z-index: 727;
  }

  .itemPage {
    align-items: center;
    display: flex;
    flex-direction: column;
    height: 100%;
    justify-content: center;
    margin-bottom: 20vw;
    width: 100%;
  }

  .itemsContainer {
    column-count: 2;
    column-gap: var(--gap-section);
    width: 70%;
  }

  .itemsContainer > div {
    break-inside: avoid;
    display: inline-block;
    margin-bottom: var(--gap-section);
    width: 100%;
  }

  .saveButton {
    bottom: var(--spacing-page-edge);
    position: fixed;
    z-index: 727;
  }

  .relationsSection {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .relationRow {
    align-items: center;
    display: flex;
    gap: calc(var(--gap-section) / 4);
    margin-bottom: calc(var(--gap-section) / 2);
  }

  .relationRow :deep(.input),
  .relationRow :deep(.selectTrigger) {
    min-width: 0;
  }

  .relationRow > :not(.relationAction) {
    flex: 1;
  }

  .relationDescriptionInput {
    min-width: 14rem;
  }

  .relationSelectInput {
    max-width: 18rem;
  }

  .removeRelationButton {
    padding: 0;
    width: 2.5vw;
    height: 2.5vw;
  }

  .relationAction {
    display: flex;
    flex: 0 0 auto;
  }

  @media (max-width: 50rem) {
    .itemsContainer {
      column-count: 1;
    }

    .relationRow {
      flex-direction: column;
      align-items: stretch;
    }
  }

  @media (max-width: 40rem) {
    .removeRelationButton {
      width: 5vw;
      height: 5vw;
    }
  }

  @media (max-width: 40rem) {
    .itemPage {
      box-sizing: border-box;
      justify-content: flex-start;
      min-height: 100%;
      padding-top: var(--page-content-offset-top);
    }

    .deleteButton {
      top: calc(var(--window-bar-stack-height) + var(--spacing-page-edge));
    }

    .saveButton {
      bottom: calc(var(--spacing-page-edge) + var(--content-bottom-inset));
    }
  }
</style>
