<script setup lang="ts">
  import { computed } from 'vue'
  import SvgIcon from '@jamescoyle/vue-icon'
  import {
    mdiDelete,
    mdiSearchWeb,
    mdiEye,
    mdiEyeOff,
    mdiEyeOutline,
    mdiChartTimelineVariant,
    mdiFilterOutline,
  } from '@mdi/js'

  const props = defineProps<{
    text: string
    icon?: string
    ariaLabel?: string
    other?: boolean
    glow?: boolean
  }>()

  const buttonColour = computed(() => props.other ? 'var(--colour-accent)' : 'var(--colour-primary)')

  const iconPath = computed<string | null>(() => {
    switch (props.icon) {
      case 'polyline':
        return mdiChartTimelineVariant
      case 'delete':
        return mdiDelete
      case 'search':
        return mdiSearchWeb
      case 'filter':
        return mdiFilterOutline
      case 'visibility':
        return mdiEye
      case 'visibility_off':
        return mdiEyeOff
      case 'remove_red_eye_rounded':
        return mdiEyeOutline
      case 'visibility_off_rounded':
        return mdiEyeOff
      default:
        return null
    }
  })
</script>

<template>
  <button class="button" :class="{ 'button-glow': glow }" :aria-label="ariaLabel || text">
    <SvgIcon
      v-if="iconPath"
      class="icon"
      type="mdi"
      :path="iconPath"
      aria-hidden="true"
      focusable="false"
    />
    <span class="text">{{ text }}</span>
  </button>
</template>

<style scoped>
  .button {
    align-items: center;
    background-color: var(--colour-base-100);
    border: var(--border) solid v-bind(buttonColour);
    border-radius: var(--radius-input);
    box-sizing: border-box;
    color: v-bind(buttonColour) !important;
    cursor: pointer;
    display: inline-flex;
    font-size: var(--font-size-text-button);
    justify-content: center;
    overflow: hidden;
    padding: 0.5em 1em;
    position: relative;
    transition: 300ms cubic-bezier(0.83, 0, 0.17, 1);
  }

  .button > .text {
    background-color: var(--colour-transparent);
    color: inherit;
    font-weight: 700;
    position: relative;
    transition: color 700ms cubic-bezier(0.83, 0, 0.17, 1);
    z-index: 1;
  }

  .button :deep(svg.icon) {
    color: inherit !important;
    transition: color 700ms cubic-bezier(0.83, 0, 0.17, 1);
    z-index: 1;
    height: 1.2em;
    width: 1.2em;
    flex: 0 0 auto;
  }

  .button :deep(svg.icon) {
    color: inherit !important;
    fill: currentColor !important;
    transition: fill 700ms cubic-bezier(0.83, 0, 0.17, 1), color 700ms cubic-bezier(0.83, 0, 0.17, 1);
  }

  .button :deep(svg.icon *),
  .button :deep(svg.icon path),
  .button :deep(svg.icon circle),
  .button :deep(svg.icon rect),
  .button :deep(svg.icon polygon),
  .button :deep(svg.icon polyline),
  .button :deep(svg.icon line) {
    fill: currentColor !important;
    transition: fill 700ms cubic-bezier(0.83, 0, 0.17, 1);
  }

  .button :deep(svg.icon [stroke]:not([stroke='none'])) {
    stroke: currentColor !important;
    transition: stroke 700ms cubic-bezier(0.83, 0, 0.17, 1);
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

  .button:hover {
    color: var(--colour-base-100);
  }

  .button:hover::before,
  .button:hover::after {
    scale: 1;
  }

  @media (max-width: 40rem) {
    .button {
      padding: var(--padding-button-block) var(--padding-button-inline);
    }
  }
</style>
