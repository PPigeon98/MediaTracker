<script setup lang="ts">
  import { tags } from '../utils/types'
  import BaseCheckbox from './BaseCheckbox.vue'

  const { selectedTags } = defineProps<{
    selectedTags: tags[]
  }>()

  const emit = defineEmits<{
    (e: 'update:selectedTags', value: tags[]): void
  }>()

  const tagOptions = Object.values(tags)

  function handleTagChange(tag: tags, checked: boolean) {
    const newTags = checked
      ? [...selectedTags, tag]
      : selectedTags.filter(t => t !== tag)
    emit('update:selectedTags', newTags)
  }
</script>

<template>
  <div>
    <h1>Tags</h1>
    <div class="tagsContainer">
      <BaseCheckbox
        v-for="tag in tagOptions"
        :key="tag"
        :text="tag"
        :checked="selectedTags.includes(tag)"
        @update:checked="(checked) => handleTagChange(tag, checked)"
      />
    </div>
  </div>
</template>

<style scoped>
  .tagsContainer {
    display: flex;
    flex-direction: row;
    gap: calc(var(--gap-section) / 2);
    overflow-x: auto;
    overflow-y: hidden;
    width: 100%;
  }
</style>
