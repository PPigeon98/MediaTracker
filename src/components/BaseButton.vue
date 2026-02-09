<script setup lang="ts">
  import { computed } from 'vue'

  const { other } = defineProps<{
    text: string
    other?: boolean
    glow?: boolean
  }>()

  const buttonColour = computed(() => other ? 'var(--colour-accent)' : 'var(--colour-primary)')
</script>

<template>
  <button class="button" :class="{ 'button-glow': glow }">
    <span class="text">{{ text }}</span>
  </button>
</template>

<style scoped>
  .button {
    background-color: var(--colour-base-100);
    border: var(--border) solid v-bind(buttonColour);
    border-radius: var(--radius-input);
    cursor: pointer;
    font-size: var(--font-size-text-button);
    overflow: hidden;
    padding: 0.5em 1em;
    position: relative;
    transition: 300ms cubic-bezier(0.83, 0, 0.17, 1);
  }

  .button > .text {
    background-color: var(--colour-transparent);
    color: v-bind(buttonColour);
    font-weight: 700;
    position: relative;
    transition: color 700ms cubic-bezier(0.83, 0, 0.17, 1);
    z-index: 1;
  }

  .button::after {
    left: 100%;
    top: 100%;
  }

  .button::before {
    left: 0;
    top: 0;
  }

  .button::before,
  .button::after {
    aspect-ratio: 1/1;
    background-color: v-bind(buttonColour);
    border-radius: 50%;
    content: "";
    position: absolute;
    scale: 0;
    translate: -50% -50%;
    transition: 727ms cubic-bezier(0.76, 0, 0.24, 1);
    width: 200%;
  }

  .button:active {
    filter: brightness(0.9);
    scale: 0.98;
  }

  .button-glow {
    box-shadow: 0 0 2vw 0.5vw color-mix(in srgb, v-bind(buttonColour) 50%, transparent);
  }

  .button:hover > .text {
    color: var(--colour-base-100);
  }

  .button:hover::before,
  .button:hover::after {
    scale: 1;
  }
</style>
