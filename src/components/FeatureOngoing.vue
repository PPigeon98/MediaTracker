<template>
  <div class="ongoingContainer">
    <div class="ongoingEar">
      <span class="ongoingText">Ongoing</span>
    </div>
  </div>
</template>

<style scoped>
  .ongoingEar {
    align-items: center;
    background-color: var(--colour-base-200);
    border-bottom-right-radius: calc(var(--radius-card) - var(--border) * 2);
    clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
    display: flex;
    height: calc(var(--radius-card) - var(--border) * 2);
    justify-content: center;
    overflow: hidden;
    transition: all 0.2s ease;
    width: calc(var(--radius-card) - var(--border) * 2);
  }

  .ongoingText {
    color: var(--colour-base-content);
    font-size: var(--font-size-text-small);
    font-weight: bold;
    opacity: 0;
  }
</style>
