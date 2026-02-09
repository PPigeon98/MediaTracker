<script setup lang="ts">
  defineProps<{
    text?: string
    checked?: boolean
  }>()

  const emit = defineEmits<{
    (e: 'update:checked', value: boolean): void
  }>()
</script>

<template>
  <label class="checkboxWrapper">
    <span class="boxWrapper">
      <input type="checkbox" class="input" :checked="checked" @change="emit('update:checked', !checked)" />
      <svg v-if="checked" class="checkIcon" viewBox="0 0 16 14">
        <path d="M2 8.5L6 12.5L14 1.5"></path>
      </svg>
    </span>
    <span class="text">{{ text }}</span>
  </label>
</template>

<style scoped>
  .boxWrapper {
    align-items: center;
    display: inline-flex;
    justify-content: center;
    position: relative;
  }

  .checkIcon {
    background-color: var(--colour-transparent);
    height: 60%;
    pointer-events: none;
    position: absolute;
    width: 60%;
  }

  .checkIcon path {
    fill: none;
    stroke: var(--colour-primary-content);
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: calc(var(--border) * 1.2);
  }

  .checkboxWrapper {
    align-items: center;
    cursor: pointer;
    display: inline-flex;
    gap: calc(var(--gap-section) / 4);
  }

  .input {
    appearance: none;
    border: var(--border) solid var(--colour-primary);
    border-radius: calc(var(--border) * 1.2);
    cursor: pointer;
    height: 1.2vw;
    width: 1.2vw;
  }

  .input:checked {
    background-color: var(--colour-primary);
  }

  .text {
    color: var(--colour-base-content);
    white-space: nowrap;
  }
</style>
