<script setup lang="ts">
  import { onMounted } from 'vue'
  import { RouterView } from 'vue-router'
  import { getCurrentWindow } from '@tauri-apps/api/window';
  import FeatureWindowBar from './components/FeatureWindowBar.vue'

  onMounted(async () => {
    await getCurrentWindow().maximize();
  })
</script>

<template>
  <div class="app">
    <FeatureWindowBar />
    <div class="content">
      <RouterView />
    </div>
  </div>
</template>

<style>
  @font-face {
    font-family: 'Fira Mono';
    font-style: normal;
    font-weight: 400;
    src: url('/FiraMonoNerdFontMono-Regular.otf') format('opentype');
  }

  @font-face {
    font-family: 'Lexend';
    font-style: normal;
    font-weight: 100 900;
    src: url('/Lexend-VariableFont_wght.ttf') format('truetype-variations');
  }

  :root {
    --ctp-rosewater: #f5e0dc;
    --ctp-flamingo: #f2cdcd;
    --ctp-pink: #f5c2e7;
    --ctp-mauve: #cba6f7;
    --ctp-red: #f38ba8;
    --ctp-maroon: #eba0ac;
    --ctp-peach: #fab387;
    --ctp-yellow: #f9e2af;
    --ctp-green: #a6e3a1;
    --ctp-teal: #94e2d5;
    --ctp-sky: #89dceb;
    --ctp-sapphire: #74c7ec;
    --ctp-blue: #89b4fa;
    --ctp-lavender: #b4befe;
    --ctp-text: #cdd6f4;
    --ctp-subtext1: #bac2de;
    --ctp-subtext0: #a6adc8;
    --ctp-overlay2: #9399b2;
    --ctp-overlay1: #7f849c;
    --ctp-overlay0: #6c7086;
    --ctp-surface2: #585b70;
    --ctp-surface1: #45475a;
    --ctp-surface0: #313244;
    --ctp-base: #1e1e2e;
    --ctp-mantle: #181825;
    --ctp-crust: #11111b;

    --colour-primary: var(--ctp-mauve);
    --colour-primary-content: var(--ctp-mantle);
    --colour-secondary: var(--ctp-surface0);
    --colour-secondary-content: var(--ctp-text);
    --colour-accent: var(--ctp-lavender);
    --colour-accent-content: var(--ctp-mantle);

    --colour-neutral: var(--ctp-overlay1);
    --colour-neutral-content: var(--ctp-mantle);

    --colour-success: var(--ctp-green);
    --colour-success-content: var(--ctp-base);
    --colour-warning: var(--ctp-yellow);
    --colour-warning-content: var(--ctp-base);
    --colour-error: var(--ctp-red);
    --colour-error-content: var(--ctp-base);

    --colour-info: var(--ctp-sky);
    --colour-info-content: var(--ctp-mantle);

    --colour-base-100: var(--ctp-base);
    --colour-base-200: var(--ctp-mantle);
    --colour-base-300: var(--ctp-crust);
    --colour-base-content: var(--ctp-text);

    --radius-input: 0.5rem;
    --radius-card: 2vw;
    --border: calc(1vw / 6);
    --spacing-select-padding: 0.5vw;
    --spacing-button-small: 3vw;
    --spacing-button: 5vw;
    --spacing-page-edge: 6vw;
    --window-bar-height: 3vh;
    --size-card-width: 22vw;
    --font-size-text-small: 1vw;
    --font-size-text-button: 1.5vw;
    --font-size-heading: 3vw;
    --padding-filter: 1rem;
    --gap-section: 2vw;
    --padding-top-mobile: 5vh;
    --padding-bottom-mobile: 10vh;

    --colour-transparent: transparent;

    --colour-anime: var(--ctp-mauve);
    --colour-manga: var(--ctp-lavender);
    --colour-lightnovel: var(--ctp-red);
    --colour-webnovel: var(--ctp-green);
    --colour-movie: var(--ctp-yellow);
    --colour-series: var(--ctp-blue);
    --colour-novel: var(--ctp-peach);
    --colour-textbook: var(--ctp-pink);
    --colour-game: var(--ctp-sapphire);
    --colour-manhua: var(--ctp-rosewater);
    --colour-manhwa: var(--ctp-flamingo);
    --colour-other: var(--ctp-subtext1);
  }

  * {
    -ms-overflow-style: none;
    color: var(--colour-base-content);
    font-family: 'Fira Mono', monospace;
    margin: 0;
    padding: 0;
    scrollbar-width: none;
    transition: all 0.3s ease;
  }

  ::-webkit-scrollbar {
    display: none;
  }

  body {
    background-color: var(--colour-base-100);
  }

  h1 {
    font-family: 'Lexend', sans-serif;
    font-size: var(--font-size-heading);
    font-weight: 700;
  }

  h2 {
    font-family: 'Lexend', sans-serif;
    font-size: calc(var(--font-size-heading) / 2);
  }

  .content {
    padding-top: calc(var(--window-bar-height) + 1vh);
  }

  @media (max-width: 40rem) {
    :root {
      --size-card-width: 38vw;
    }

    .app {
      padding-top: var(--padding-top-mobile);
      padding-bottom: var(--padding-bottom-mobile);
    }
  }
</style>
