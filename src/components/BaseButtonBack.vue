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
    height: var(--size-button-icon);
    left: var(--spacing-page-edge);
    padding: 0;
    position: absolute;
    top: calc(var(--spacing-page-edge) / 2 + var(--window-bar-stack-height));
    width: var(--size-button-icon);
    z-index: 727;
  }

  @media (max-width: 40rem) {
    .backButton {
      padding: var(--padding-button-block) var(--padding-button-inline);
      top: calc(var(--window-bar-stack-height) + var(--spacing-page-edge));
    }
  }
</style>
