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
  import BaseTextList from './BaseTextList.vue'
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
  const { handleQueueDeletion, saveItem, deleteItem } = useItemOperations()
  const normalizeTitle = ref(true)
  const allItems = ref<Item[]>([])
  const relations = ref<ItemRelation[]>([])
  const relationTargetInputs = ref<string[]>([])

  const CUSTOM_RELATION_REASON_VALUE = '__custom__'
  const relationReasonOptions: SelectOption[] = [
    { value: 'prequel', label: 'Prequel' },
    { value: 'sequel', label: 'Sequel' },
    { value: 'adaptation', label: 'Adaptation' },
    { value: 'special', label: 'Special' },
    { value: CUSTOM_RELATION_REASON_VALUE, label: '+' },
  ]
  const flagLabelOptions: SelectOption[] = [
    { value: 'ongoing', label: 'Ongoing' },
    { value: 'downloaded', label: 'Downloaded' },
  ]
  const effectiveFlagLabel = computed<'ongoing' | 'downloaded'>(() => {
    if (item.value.mediaTypeValue === mediaType.game) return 'downloaded'
    if (item.value.mediaTypeValue === mediaType.other) return item.value.flagLabel
    return 'ongoing'
  })
  const ongoingLabel = computed(() => effectiveFlagLabel.value === 'downloaded' ? 'Downloaded' : 'Ongoing')

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
    relationTargetInputs.value = relations.value.map((relation) => getRelationTargetLabel(relation.relatedItemId))
  })

  async function save() {
    const savedItem = await saveItem(currentItem.value, item.value, relations.value, {
      bypassTitleNormalization: !normalizeTitle.value,
    })
    currentItem.value = savedItem
  }

  async function handleDelete() {
    await deleteItem(currentItem.value)
  }

  function addRelation() {
    relations.value.push({ relatedItemId: 0, description: 'prequel' })
    relationTargetInputs.value.push('')
  }

  function removeRelation(index: number) {
    relations.value.splice(index, 1)
    relationTargetInputs.value.splice(index, 1)
  }

  function getRelationTargetLabel(relatedItemId: number): string {
    const target = allItems.value.find((item) => item.id === relatedItemId)
    if (!target) return ''
    return target.title || `Item #${target.id}`
  }

  function parseItemIdFromInput(value: string): number | null {
    const trimmed = value.trim()
    if (!trimmed) return null

    const exactTitleMatch = allItems.value.find((item) => {
      if (item.id === currentItem.value.id) return false
      return (item.title || `Item #${item.id}`).toLowerCase() === trimmed.toLowerCase()
    })
    if (exactTitleMatch) return exactTitleMatch.id

    const itemByFallbackLabel = /^Item\s+#(\d+)$/i.exec(trimmed)
    if (itemByFallbackLabel) {
      return Number(itemByFallbackLabel[1])
    }

    const query = trimmed.toLowerCase()
    const containsMatch = allItems.value.find((item) => {
      if (item.id === currentItem.value.id) return false
      return (
        item.title.toLowerCase().includes(query)
        || item.description.toLowerCase().includes(query)
        || (item.otherNames ?? []).some((name) => name.toLowerCase().includes(query))
        || (item.creators ?? []).some((creator) => creator.toLowerCase().includes(query))
      )
    })
    if (containsMatch) return containsMatch.id

    return null
  }

  function getRelationTargetOptions(index: number): SelectOption[] {
    const query = (relationTargetInputs.value[index] ?? '').trim().toLowerCase()

    return allItems.value
      .filter((item) => {
        if (item.id === currentItem.value.id) return false
        if (!query) return true

        return (
          item.title.toLowerCase().includes(query)
          || item.description.toLowerCase().includes(query)
          || (item.otherNames ?? []).some((name) => name.toLowerCase().includes(query))
          || (item.creators ?? []).some((creator) => creator.toLowerCase().includes(query))
        )
      })
      .map((item) => ({
        value: item.id,
        label: item.title || `Item #${item.id}`,
      }))
  }

  function updateRelationTargetInput(index: number, value: string) {
    const relation = relations.value[index]
    if (!relation) return
    relationTargetInputs.value[index] = value
  }

  function selectRelationTarget(index: number, selectedValue: string) {
    const relation = relations.value[index]
    if (!relation) return

    const parsedItemId = parseItemIdFromInput(selectedValue)
    if (!parsedItemId) return

    relation.relatedItemId = parsedItemId
    relationTargetInputs.value[index] = getRelationTargetLabel(parsedItemId)
  }

  function normalizeRelationReason(reason: string): string {
    return reason.trim().toLowerCase()
  }

  function updateRelationReason(index: number, value: string) {
    const relation = relations.value[index]
    if (!relation) return

    const trimmed = value.trim()
    if (trimmed === CUSTOM_RELATION_REASON_VALUE || trimmed === '+') {
      relation.description = ''
      return
    }

    relation.description = normalizeRelationReason(trimmed)
  }

  function handleCoverImageReplacedLocally(oldImage: string) {
    if (!oldImage) return
    if (!item.value.imageSet.includes(oldImage)) {
      item.value.imageSet = [oldImage, ...item.value.imageSet]
    }
  }
</script>

<template>
  <div class="itemPage">
    <BaseButtonBack />
    <BaseButtonSave text="Save" @click="save()" class="saveButton" />
    <BaseButtonDelete @click="handleDelete()" class="deleteButton" />

    <div class="itemsContainer">
      <div>
        <FeatureCoverImage v-model:coverImage="item.coverImage" @coverImageReplaced="handleCoverImageReplacedLocally" class="coverImage" />
      </div>
      <div>
        <div class="titleHeadingRow">
          <h1>Title</h1>
          <div class="normalizeTag">
            <BaseCheckbox text="Normalise" :checked="normalizeTitle" @update:checked="normalizeTitle = $event" />
          </div>
        </div>
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
        <BaseTextInput v-model="item.startDate" placeholder="Start Date" class="dateField" />
      </div>
      <div>
        <h1>End Date</h1>
        <BaseTextInput v-model="item.endDate" placeholder="End Date" class="dateField" />
      </div>
      <div>
        <h1>{{ ongoingLabel }}</h1>
        <BaseSelect
          v-if="item.mediaTypeValue === mediaType.other"
          :options="flagLabelOptions"
          :model-value="item.flagLabel"
          @update:model-value="(val) => item.flagLabel = val as 'ongoing' | 'downloaded'"
        />
        <BaseCheckbox :text="ongoingLabel" :checked="item.ongoing" @update:checked="item.ongoing = $event" />
      </div>
      <div>
        <h1>Relationships</h1>
        <div class="relationsSection">
          <div v-for="(relation, index) in relations" :key="index" class="relationRow">
            <div class="relationSelectInput">
              <BaseTextList
                :model-value="relationTargetInputs[index] ?? getRelationTargetLabel(relation.relatedItemId)"
                placeholder="Select related item"
                @update:model-value="(val) => updateRelationTargetInput(index, String(val))"
                @select="(val) => selectRelationTarget(index, String(val))"
                :options="getRelationTargetOptions(index)"
                :use-local-filter="false"
              />
            </div>
            <div class="relationReasonSelectInput">
              <BaseTextList
                :model-value="relation.description"
                placeholder="How are they related?"
                @update:model-value="(val) => updateRelationReason(index, String(val))"
                @select="(val) => updateRelationReason(index, String(val))"
                :options="relationReasonOptions"
              />
            </div>
            <div class="relationAction">
              <BaseButton text="" icon="delete" aria-label="Remove relation" @click="removeRelation(index)" class="removeRelationButton" />
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

  .titleHeadingRow {
    align-items: center;
    display: flex;
    gap: calc(var(--gap-section) / 3);
    justify-content: space-between;
  }

  .normalizeTag {
    align-items: center;
    border: var(--border) solid var(--colour-primary);
    border-radius: var(--radius-input);
    display: inline-flex;
    padding: 0.2rem 0.5rem;
  }

  .normalizeTag :deep(.text) {
    color: var(--colour-primary);
    font-size: calc(var(--font-size-text-button) * 0.85);
    font-weight: 600;
  }

  .relationsSection {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .relationRow {
    align-items: center;
    display: flex;
    flex-wrap: nowrap;
    gap: calc(var(--gap-section) / 4);
    margin-bottom: calc(var(--gap-section) / 2);
    width: 100%;
  }

  .relationRow :deep(.input),
  .relationRow :deep(.selectTrigger) {
    min-width: 0;
  }

  .relationDescriptionInput {
    min-width: 14rem;
  }

  .relationSelectInput {
    flex: 1 1 0;
    min-width: 0;
  }

  .relationReasonSelectInput {
    flex: 1 1 0;
    min-width: 0;
  }

  .relationSelectInput :deep(.textList),
  .relationReasonSelectInput :deep(.textList) {
    min-width: 0;
    width: 95%;
  }

  .relationSelectInput :deep(.input),
  .relationSelectInput :deep(.selectTrigger) {
    min-width: 0;
    width: 95%;
  }

  .relationReasonSelectInput :deep(.input),
  .relationReasonSelectInput :deep(.selectTrigger) {
    min-width: 0;
    width: 95%;
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

  .dateField {
    width: 97%;
  }

  .dateField :deep(.input) {
    box-sizing: border-box;
    min-width: 0;
    width: 97%;
  }

  @media (max-width: 50rem) {
    .itemsContainer {
      column-count: 1;
    }
  }

  @media (max-width: 40rem) {
    .removeRelationButton {
      width: 3.5vw;
      height: 3.5vw;
      min-width: 1.9rem;
      min-height: 1.9rem;
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
