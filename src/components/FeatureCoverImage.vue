<script setup lang="ts">
  import { useFileUpload } from '../composables/useFileUpload'

  const { coverImage } = defineProps<{
    coverImage: string
  }>()

  const emit = defineEmits<{
    (e: 'update:coverImage', value: string): void
    (e: 'coverImageReplaced', oldImage: string): void
  }>()

  const { fileInputRef, triggerFileInput, handleImageSelect } = useFileUpload()
  void fileInputRef

  function onImageSelect(images: string[]) {
    if (images[0]) {
      if (coverImage) {
        emit('coverImageReplaced', coverImage)
      }
      emit('update:coverImage', images[0])
    }
  }
</script>

<template>
  <div class="box" @click="triggerFileInput">
    <img v-if="!coverImage" src="/uploadImage.svg" alt="uploadImage" class="coverImageUploadButton" />
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      class="fileInput"
      @change="(e) => handleImageSelect(e, onImageSelect)"
    />
    <img v-if="coverImage" :src="coverImage" :alt="coverImage" class="coverImage" />
  </div>
</template>

<style scoped>
  .box {
    align-items: center;
    aspect-ratio: 1;
    background-color: var(--colour-transparent);
    border: calc(var(--border) * 0.6) solid var(--colour-primary);
    cursor: pointer;
    display: flex;
    flex-shrink: 0;
    justify-content: center;
    overflow: hidden;
    position: relative;
    width: 100%;
  }

  .coverImage {
    height: 100%;
    object-fit: cover;
    width: 100%;
  }

  .coverImageUploadButton {
    height: 50%;
    object-fit: contain;
    opacity: 0.5;
    width: 50%;
  }

  .fileInput {
    display: none;
  }
</style>
