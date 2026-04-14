<script setup lang="ts">
  import { getCurrentWindow } from '@tauri-apps/api/window';
  import { useRouter } from 'vue-router'

  const router = useRouter()

  async function minimise() {
    await getCurrentWindow().minimize();
  }

  async function maximise() {
    await getCurrentWindow().maximize();
  }

  async function close() {
    await getCurrentWindow().close();
  }
</script>

<template>
  <div class="windowBar">
    <div class="windowBarSettingsButton">
      <button @click="router.push('/Settings')" aria-label="Open settings">
        <svg class="windowBarSettingsIcon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M19.43 12.98c.04-.32.07-.65.07-.98s-.03-.66-.08-.98l2.11-1.65a.496.496 0 0 0 .12-.64l-2-3.46a.495.495 0 0 0-.6-.22l-2.49 1a7.03 7.03 0 0 0-1.69-.98l-.38-2.65A.488.488 0 0 0 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.24-1.17.57-1.69.98l-2.49-1a.495.495 0 0 0-.6.22l-2 3.46c-.13.22-.08.5.12.64l2.11 1.65c-.05.32-.09.65-.09.98s.03.66.08.98l-2.11 1.65a.496.496 0 0 0-.12.64l2 3.46c.13.22.39.31.62.22l2.49-1c.52.41 1.08.74 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.24 1.17-.57 1.69-.98l2.49 1c.23.09.49 0 .62-.22l2-3.46a.496.496 0 0 0-.12-.64l-2.12-1.65zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z" fill="currentColor" />
        </svg>
      </button>
    </div>
    <div class="windowBarGraphButton">
      <button @click="router.push('/Graph')" aria-label="Open graph">
        <svg class="windowBarGraphIcon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            d="M2 3V9H4.95L6.95 15H6V21H12V16.41L17.41 11H22V5H16V9.57L10.59 15H9.06L7.06 9H8V3M4 5H6V7H4M18 7H20V9H18M8 17H10V19H8Z"
            fill="currentColor"
          />
        </svg>
      </button>
    </div>
    <div class="windowBarButtons">
      <button @click="minimise" aria-label="Minimize window">
        <svg class="windowBarControlIcon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M19 13H5c-.55 0-1-.45-1-1s.45-1 1-1h14c.55 0 1 .45 1 1s-.45 1-1 1z" fill="currentColor" />
        </svg>
      </button>
      <button @click="maximise" aria-label="Maximize window">
        <svg class="windowBarControlIcon windowBarControlIconSquare" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" fill="currentColor" />
        </svg>
      </button>
      <button @click="close" aria-label="Close window">
        <svg class="windowBarControlIcon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12 5.7 16.89a1 1 0 1 0 1.41 1.41L12 13.41l4.89 4.89a1 1 0 1 0 1.41-1.41L13.41 12l4.89-4.89a.996.996 0 0 0 0-1.4z" fill="currentColor" />
        </svg>
      </button>
    </div>
    <div class="windowBarTitle">
      <img src="/icon.svg" alt="icon" class="windowBarTitleIconImage">
      Media Tracker
    </div>
  </div>
</template>

<style scoped>
  .windowBar {
    -webkit-app-region: drag;
    background-color: var(--colour-base-300);
    box-sizing: border-box;
    height: calc(var(--window-bar-height) + env(safe-area-inset-top, 0px));
    left: 0;
    padding-top: env(safe-area-inset-top, 0px);
    margin-bottom: 0vh;
    position: fixed;
    right: 0;
    top: 0;
    width: 100%;
    z-index: 69420;
  }

  .windowBarButtons {
    -webkit-app-region: no-drag;
    align-items: center;
    display: flex;
    flex-direction: row;
    height: 100%;
    position: absolute;
    right: 0vh;
    top: 0vh;
  }

  .windowBarSettingsButton {
    -webkit-app-region: no-drag;
    align-items: center;
    display: flex;
    height: 100%;
    left: 0;
    position: absolute;
    top: 0;
  }

  .windowBarSettingsButton button,
  .windowBarGraphButton button {
    align-items: center;
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    font-size: 1.8vh;
    height: var(--window-bar-height);
    justify-content: center;
    width: 6vh;
  }

  .windowBarGraphIcon {
    height: 2.2vh;
    width: 2.2vh;
  }

  .windowBarSettingsIcon {
    height: 2.2vh;
    width: 2.2vh;
  }

  .windowBarSettingsButton button:hover,
  .windowBarGraphButton button:hover {
    background-color: var(--colour-accent);
  }

  .windowBarGraphButton {
    -webkit-app-region: no-drag;
    align-items: center;
    display: flex;
    height: 100%;
    left: 6vh;
    position: absolute;
    top: 0;
  }

  .windowBarButtons button {
    align-items: center;
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    font-size: 1.8vh;
    height: var(--window-bar-height);
    justify-content: center;
    width: 6vh;
  }

  .windowBarControlIcon {
    height: 2vh;
    width: 2vh;
  }

  .windowBarControlIconSquare {
    height: 1.7vh;
    width: 1.7vh;
  }

  .windowBarButtons button:hover {
    background-color: var(--colour-accent);
  }

  .windowBarTitle {
    align-items: center;
    display: flex;
    gap: 0.5vh;
    height: 100%;
    justify-content: center;
  }

  .windowBarTitleIconImage {
    height: 2vh;
    width: 2vh;
  }

  @media (max-width: 40rem) {
    .windowBarSettingsButton button,
    .windowBarGraphButton button,
    .windowBarButtons button {
      font-size: 2.2vh;
    }

    .windowBarGraphButton {
      left: auto;
      right: 0;
    }

    .windowBarButtons {
      display: none;
    }
  }
</style>
