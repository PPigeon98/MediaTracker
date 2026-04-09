<template>
  <div class="ongoingEar">
    <span class="ongoingText">Ongoing</span>
  </div>
</template>

<style scoped>
  .ongoingEar {
    align-items: center;
    background-color: var(--colour-base-200);
    pointer-events: auto;
    border-bottom-right-radius: calc(var(--radius-card) - var(--border) * 2);
    clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
    display: flex;
    height: calc(var(--radius-card) - var(--border) * 2);
    justify-content: center;
    overflow: hidden;
    transition:
      width 0.2s ease,
      clip-path 0.2s ease;
    width: calc(var(--radius-card) - var(--border) * 2);
  }

  .ongoingText {
    color: var(--colour-base-content);
    font-size: var(--font-size-text-small);
    font-weight: bold;
    opacity: 0;
  }

  @media (max-width: 40rem) {
    .ongoingEar {
      --ongoing-ear-base: calc(var(--radius-card) - var(--border) * 2);
      height: calc(var(--ongoing-ear-base) * 2);
      width: calc(var(--ongoing-ear-base) * 2);
    }
  }
</style>
