<script setup lang="ts">
  import { useRouter } from 'vue-router'
  import BaseButton from './BaseButton.vue'

  const router = useRouter()

  defineProps<{
    to?: string
  }>()

  function goBack() {
    router.push('/home')
  }
</script>

<template>
  <BaseButton text="←" :other="true" @click="to ? router.push(to) : goBack()" class="backButton" />
</template>

<style scoped>
  .backButton {
    height: var(--spacing-button);
    left: var(--spacing-page-edge);
    position: absolute;
    top: calc(var(--spacing-page-edge) / 2 + var(--window-bar-height));
    width: var(--spacing-button);
    z-index: 727;
  }

  @media (max-width: 40rem) {
    .backButton {
      top: calc(var(--padding-top-mobile) / 2 + var(--window-bar-height) + var(--spacing-page-edge));
    }
  }
</style>
