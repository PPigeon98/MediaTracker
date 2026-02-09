<script setup lang="ts">
  defineProps<{
    text: string
  }>()
</script>

<template>
  <button class="button" v-bind="$attrs">
    <div class="outline"></div>

    <div class="state">
      <p>
        <span
          v-for="(ch, i) in text.split('')"
          :key="`char-${i}-${ch}`"
          :style="{ '--i': i }"
        >
          {{ ch }}
        </span>
      </p>
    </div>
  </button>
</template>

<style scoped>
  @keyframes slideDown {
    0% {
      color: var(--colour-primary);
      filter: blur(0.5vw);
      opacity: 0;
      transform: translateY(-2vw) translateX(0.5vw) rotate(-90deg);
    }
    30% {
      filter: blur(0);
      opacity: 1;
      transform: translateY(0.4vw) translateX(0) rotate(0);
    }
    50% {
      opacity: 1;
      transform: translateY(-0.3vw) translateX(0) rotate(0);
    }
    100% {
      opacity: 1;
      transform: translateY(0) translateX(0) rotate(0);
    }
  }

  @keyframes wave {
    30% {
      opacity: 1;
      transform: translateY(0.4vw) translateX(0) rotate(0);
    }
    50% {
      color: var(--colour-primary);
      opacity: 1;
      transform: translateY(-0.3vw) translateX(0) rotate(0);
    }
    100% {
      opacity: 1;
      transform: translateY(0) translateX(0) rotate(0);
    }
  }

  .button {
    align-items: center;
    background-color: var(--colour-transparent);
    border: none;
    border-radius: 1.4vw;
    box-shadow: 0 0.05vw 0.05vw 0.1vw color-mix(in srgb, var(--colour-primary) 20%, transparent),
      0 1vw 2vw color-mix(in srgb, var(--colour-base-300) 20%, transparent),
      0 0.4vw 0.5vw 0vw color-mix(in srgb, var(--colour-base-300) 5%, transparent);
    cursor: pointer;
    display: flex;
    font-size: 2vw;
    font-weight: 700;
    height: 6.8vw;
    justify-content: center;
    min-width: 20vw;
    padding: 2vw;
    position: relative;
    text-shadow: 0 0.1vw 0.1vw color-mix(in srgb, var(--colour-base-300) 30%, transparent);
    transition: all 0.3s ease;
  }

  .button:active {
    box-shadow: 0 0 0.1vw 0.2vw color-mix(in srgb, var(--colour-primary) 30%, transparent),
      0 1vw 0.3vw -0.3vw color-mix(in srgb, var(--colour-base-300) 20%, transparent);
    transform: scale(1);
  }

  .button:after {
    background: linear-gradient(var(--colour-base-100), var(--colour-base-200)) padding-box,
      linear-gradient(to bottom, color-mix(in srgb, var(--colour-base-300) 10%, transparent), color-mix(in srgb, var(--colour-base-300) 45%, transparent))
        border-box;
    border: 0.25vw solid transparent;
    border-radius: 1.4vw;
    content: "";
    inset: 0;
    position: absolute;
    transition: all 0.4s ease;
    z-index: 0;
  }

  .button::before {
    background: linear-gradient(to top, var(--colour-base-100), var(--colour-base-200));
    border-radius: 3vw;
    content: "";
    filter: blur(0.05vw);
    inset: 0.7vw 0.6vw 0.6vw 0.6vw;
    position: absolute;
    z-index: 2;
  }

  .button:hover {
    box-shadow: 0 0 0.1vw 0.2vw color-mix(in srgb, var(--colour-primary) 30%, transparent),
      0 1.5vw 3vw color-mix(in srgb, var(--colour-base-300) 30%, transparent),
      0 1vw 0.3vw -0.3vw color-mix(in srgb, var(--colour-base-300) 4%, transparent);
    transform: scale(1.02);
  }

  .button:hover p span {
    animation: wave 0.5s ease forwards calc(var(--i) * 0.02s);
    opacity: 1;
  }

  .button:hover::after {
    box-shadow: inset 0 -0.1vw 0.3vw 0 var(--colour-primary);
    transform: scale(1.05, 1.1);
  }

  .outline {
    background-color: var(--colour-transparent);
    border-radius: inherit;
    inset: -0.2vw -0.35vw;
    opacity: 0;
    overflow: hidden;
    position: absolute;
    transition: opacity 0.4s ease;
    z-index: 1;
  }

  .state {
    background-color: var(--colour-transparent);
    display: flex;
    position: relative;
    z-index: 2;
  }

  .state p {
    align-items: center;
    background-color: var(--colour-transparent);
    display: flex;
    justify-content: center;
  }

  .state p span {
    animation: slideDown 0.8s ease forwards calc(var(--i) * 0.03s);
    background-color: var(--colour-transparent);
    opacity: 0;
  }
</style>
