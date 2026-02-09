<script setup lang="ts">
  import { ref } from 'vue'
  import { useFileUpload } from '../composables/useFileUpload'
  import BaseButton from './BaseButton.vue'
  import BaseButtonDelete from './BaseButtonDelete.vue'

  const { coverImage, imageSet } = defineProps<{
    coverImage: string
    imageSet: string[]
  }>()

  const emit = defineEmits<{
    (e: 'update:imageSet', value: string[]): void
    (e: 'update:coverImage', value: string): void
    (e: 'queueDeletion', imageSrc: string): void
  }>()

  const { fileInputRef, triggerFileInput, handleImageSelect } = useFileUpload()
  void fileInputRef

  const selectedImage = ref<string | null>(null)

  function onImageSelect(images: string[]) {
    emit('update:imageSet', [...imageSet, ...images])
  }

  function openImage(imageSrc: string) {
    selectedImage.value = imageSrc
  }

  function closeImage() {
    selectedImage.value = null
  }

  function deleteSelectedImage() {
    if (!selectedImage.value) return
    const imageToDelete = selectedImage.value
    emit('queueDeletion', imageToDelete)
    if (imageToDelete === coverImage) {
      emit('update:coverImage', '')
    } else {
      const updatedImageSet = imageSet.filter(img => img !== imageToDelete)
      emit('update:imageSet', updatedImageSet)
    }
    closeImage()
  }

  function getGalleryImageClass(index: number): string {
    return `galleryImage-${index % 7}`
  }
</script>

<template>
  <div class="gallery" @keydown.escape="closeImage" tabindex="0">
    <h1>Gallery</h1>
    <BaseButton text="Upload Images" @click="triggerFileInput" />
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      :multiple="true"
      class="fileInput"
      @change="(e) => handleImageSelect(e, onImageSelect)"
    />
    <div class="galleryCollage">
      <div v-if="coverImage" class="galleryImage" :class="getGalleryImageClass(0)" @click="openImage(coverImage)">
        <img :src="coverImage" :alt="coverImage" />
      </div>
      <div v-for="(image, index) in imageSet" :key="image" class="galleryImage" :class="getGalleryImageClass(index + 1)" @click="openImage(image)">
        <img :src="image" :alt="image" />
      </div>
    </div>
    <div v-if="selectedImage" class="imageModal" @click="closeImage">
      <img :src="selectedImage" :alt="selectedImage" @click.stop />
      <BaseButtonDelete @click.stop="deleteSelectedImage" class="deleteButton" />
    </div>
  </div>
</template>

<style scoped>
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes zoomIn {
    from {
      opacity: 0;
      transform: scale(0.8);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .fileInput {
    display: none;
  }

  .gallery {
    align-items: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 100%;
  }

  .galleryCollage {
    display: grid;
    gap: calc(var(--gap-section) / 2);
    grid-auto-flow: dense;
    grid-auto-rows: 10vw;
    grid-template-columns: repeat(6, 1fr);
    max-width: 70%;
    padding: var(--gap-section);
    width: 70%;
  }

  .galleryImage {
    border-radius: calc(var(--radius-card) / 2);
    cursor: pointer;
    overflow: hidden;
    position: relative;
    transition: transform 0.2s;
  }

  .galleryImage:hover {
    transform: scale(1.05);
    z-index: 1;
  }

  .galleryImage img {
    height: 100%;
    object-fit: cover;
    width: 100%;
  }

  .galleryImage-0 {
    grid-column: span 2;
    grid-row: span 2;
  }

  .galleryImage-1 {
    grid-column: span 1;
    grid-row: span 2;
  }

  .galleryImage-2 {
    grid-column: span 1;
    grid-row: span 1;
  }

  .galleryImage-3 {
    grid-column: span 1;
    grid-row: span 2;
  }

  .galleryImage-4 {
    grid-column: span 1;
    grid-row: span 1;
  }

  .galleryImage-5 {
    grid-column: span 1;
    grid-row: span 1;
  }

  .galleryImage-6 {
    grid-column: span 2;
    grid-row: span 1;
  }

  .imageModal {
    align-items: center;
    animation: fadeIn 0.3s ease-in-out;
    background-color: rgba(0, 0, 0, 0.9);
    bottom: 0;
    cursor: pointer;
    display: flex;
    justify-content: center;
    left: 0;
    position: fixed;
    right: 0;
    top: var(--window-bar-height);
    z-index: 10000;
  }

  .deleteButton {
    bottom: var(--spacing-page-edge);
    position: absolute;
    right: var(--spacing-page-edge);
    z-index: 727;
  }

  .imageModal img {
    animation: zoomIn 0.3s ease-in-out;
    cursor: default;
    max-height: 80vw;
    max-width: 80vw;
    min-height: 80vw;
    min-width: 80vw;
    object-fit: contain;
    pointer-events: none;
  }
</style>
